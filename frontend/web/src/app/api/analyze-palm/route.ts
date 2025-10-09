import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 画像を安全なフォーマットに変換する関数
async function convertImageToSafeFormat(imageUrl: string): Promise<string> {
  try {
    // Firebase Storageから画像を取得
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`画像の取得に失敗: ${response.status}`);
    }

    const blob = await response.blob();
    
    // Canvas APIを使用してJPEGに変換
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // キャンバスのサイズを設定
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 画像を描画
        ctx?.drawImage(img, 0, 0);
        
        // JPEGとしてBase64エンコード
        const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        resolve(base64);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  } catch (error) {
    console.error('画像変換エラー:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: '画像URLが必要です' },
        { status: 400 }
      );
    }

    console.log('🔍 手相解析開始:', imageUrl);

    // 画像をBase64に変換してClaude APIに送信
    let base64Image: string;
    
    try {
      // Firebase Storage URLから直接取得を試みる
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`画像取得失敗: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      base64Image = buffer.toString('base64');
      
      console.log('✅ 画像をBase64に変換成功');
    } catch (fetchError) {
      console.error('❌ 画像取得エラー:', fetchError);
      return NextResponse.json(
        { error: '画像の読み込みに失敗しました' },
        { status: 500 }
      );
    }

    // Claude Vision APIで手相を解析
    console.log('🤖 Claude APIに送信中...');
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `この手相の画像を詳しく分析してください。以下の形式でJSON形式で返答してください:

{
  "mainLines": {
    "lifeLine": {
      "length": "長い/普通/短い",
      "clarity": "明瞭/普通/不明瞭",
      "interpretation": "解釈"
    },
    "heartLine": {
      "length": "長い/普通/短い",
      "clarity": "明瞭/普通/不明瞭",
      "curve": "強い/普通/弱い",
      "interpretation": "解釈"
    },
    "headLine": {
      "length": "長い/普通/短い",
      "clarity": "明瞭/普通/不明瞭",
      "curve": "強い/普通/弱い",
      "interpretation": "解釈"
    },
    "fateLine": {
      "presence": "ある/ない",
      "clarity": "明瞭/普通/不明瞭",
      "interpretation": "解釈"
    }
  },
  "mounts": {
    "jupiter": "発達している/普通/未発達",
    "saturn": "発達している/普通/未発達",
    "apollo": "発達している/普通/未発達",
    "mercury": "発達している/普通/未発達",
    "venus": "発達している/普通/未発達",
    "luna": "発達している/普通/未発達"
  },
  "specialMarks": [
    {
      "type": "スター/クロス/トライアングルなど",
      "location": "位置",
      "meaning": "意味"
    }
  ],
  "overallInterpretation": "総合的な手相の解釈（300文字程度）",
  "parameters": {
    "love": 75,
    "career": 80,
    "money": 70,
    "health": 85,
    "social": 75,
    "growth": 80
  },
  "advice": "アドバイス（200文字程度）"
}

必ずJSON形式で返答してください。`,
            },
          ],
        },
      ],
    });

    console.log('✅ Claude APIレスポンス受信');

    // レスポンスからテキストを抽出
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    // JSONを抽出（```json ... ``` の部分を取り除く）
    let analysisResult;
    try {
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                       responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        analysisResult = JSON.parse(jsonStr);
      } else {
        throw new Error('JSON形式のレスポンスが見つかりません');
      }
    } catch (parseError) {
      console.error('❌ JSON解析エラー:', parseError);
      console.log('レスポンス:', responseText);
      
      // フォールバック: デフォルト値を返す
      analysisResult = {
        mainLines: {
          lifeLine: {
            length: '解析中',
            clarity: '解析中',
            interpretation: 'AI解析を完了できませんでした',
          },
          heartLine: {
            length: '解析中',
            clarity: '解析中',
            curve: '解析中',
            interpretation: 'AI解析を完了できませんでした',
          },
          headLine: {
            length: '解析中',
            clarity: '解析中',
            curve: '解析中',
            interpretation: 'AI解析を完了できませんでした',
          },
          fateLine: {
            presence: '解析中',
            clarity: '解析中',
            interpretation: 'AI解析を完了できませんでした',
          },
        },
        mounts: {
          jupiter: '解析中',
          saturn: '解析中',
          apollo: '解析中',
          mercury: '解析中',
          venus: '解析中',
          luna: '解析中',
        },
        specialMarks: [],
        overallInterpretation: responseText.substring(0, 500),
        parameters: {
          love: 70,
          career: 70,
          money: 70,
          health: 70,
          social: 70,
          growth: 70,
        },
        advice: 'より詳細な解析のため、明るい場所で手のひら全体が写るように撮影してください。',
      };
    }

    console.log('✅ 手相解析完了');

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
    });

  } catch (error) {
    console.error('❌ 手相解析エラー:', error);
    
    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message);
      console.error('スタックトレース:', error.stack);
    }

    return NextResponse.json(
      { 
        error: '手相解析に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}