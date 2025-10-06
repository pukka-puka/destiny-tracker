// src/app/api/palm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// 月1回の制限をチェック
async function checkMonthlyLimit(userId: string): Promise<boolean> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const palmReadings = await db
    .collection('readings')
    .where('userId', '==', userId)
    .where('readingType', '==', 'palm')
    .where('createdAt', '>=', startOfMonth)
    .get();
  
  return palmReadings.size === 0;
}

// 手相解析のプロンプト
const PALM_ANALYSIS_PROMPT = `あなたは経験豊富な手相占い師です。提供された手の画像を詳細に分析し、以下の観点から鑑定を行ってください。

【分析項目】
1. **主要な線の分析**
   - 生命線: 長さ、濃さ、曲がり方、始点と終点
   - 頭脳線: 長さ、方向、分岐、明瞭さ
   - 感情線: 長さ、カーブ、終点の位置
   - 運命線: 有無、長さ、始点、明瞭さ
   - 太陽線: 有無、長さ、位置
   - 結婚線: 本数、長さ、位置

2. **丘の分析**
   - 金星丘、木星丘、土星丘、太陽丘、水星丘、月丘、火星丘の発達度

3. **手の形と指の特徴**
   - 手の形（四角型、円錐型、へら型、混合型など）
   - 指の長さのバランス
   - 親指の形状と柔軟性

【鑑定内容】
以下の形式でJSON形式で回答してください：

{
  "summary": "全体的な手相の特徴と印象（200文字程度）",
  "interpretation": "詳細な鑑定結果（2000文字以上）。性格、才能、運勢、人生の傾向などを含む",
  "lines": {
    "lifeLine": "生命線の特徴と意味",
    "headLine": "頭脳線の特徴と意味",
    "heartLine": "感情線の特徴と意味",
    "fateLine": "運命線の特徴と意味",
    "sunLine": "太陽線の特徴と意味",
    "marriageLine": "結婚線の特徴と意味"
  },
  "parameters": {
    "love": 恋愛運（1-100）,
    "career": 仕事運（1-100）,
    "money": 金運（1-100）,
    "health": 健康運（1-100）,
    "social": 対人運（1-100）,
    "growth": 成長運（1-100）
  },
  "advice": {
    "strength": "あなたの強み（3つ）",
    "opportunity": "今後のチャンス（3つ）",
    "caution": "注意すべき点（3つ）"
  },
  "fortune": {
    "overall": "総合運勢メッセージ",
    "luckyColor": "ラッキーカラー",
    "luckyNumber": "ラッキーナンバー",
    "luckyItem": "ラッキーアイテム"
  }
}`;

export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // 月1回制限チェック
    const canAnalyze = await checkMonthlyLimit(userId);
    if (!canAnalyze) {
      return NextResponse.json(
        { 
          error: 'Monthly limit exceeded',
          message: '手相占いは月に1回までです。来月までお待ちください。'
        },
        { status: 429 }
      );
    }

    // リクエストボディから画像データを取得
    const { imageBase64, imageUrl } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Claude Vision APIを呼び出し
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: PALM_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    });

    // レスポンスをパース
    const analysisText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';
    
    let analysis;
    try {
      // JSONとして解析を試みる
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response');
      }
    } catch (error) {
      // JSONパースに失敗した場合はデフォルト構造を返す
      console.error('Failed to parse analysis:', error);
      analysis = {
        summary: '手相の解析を行いました。',
        interpretation: analysisText,
        parameters: {
          love: 70,
          career: 75,
          money: 65,
          health: 80,
          social: 72,
          growth: 78
        },
        lines: {},
        advice: {
          strength: [],
          opportunity: [],
          caution: []
        },
        fortune: {
          overall: '良い運勢が訪れています',
          luckyColor: 'ブルー',
          luckyNumber: '7',
          luckyItem: 'パワーストーン'
        }
      };
    }

    // Firestoreに保存
    const reading = {
      userId,
      readingType: 'palm',
      parameters: analysis.parameters,
      palmReading: {
        imageUrl,
        analysis,
        analyzedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('readings').add(reading);

    return NextResponse.json({
      id: docRef.id,
      ...analysis,
      imageUrl,
    });

  } catch (error) {
    console.error('Palm reading error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze palm',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
