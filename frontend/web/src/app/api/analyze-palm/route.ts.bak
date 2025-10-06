import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, userId, readingId } = body;

    if (!imageUrl || !userId || !readingId) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    // 画像をBase64に変換
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Claude Sonnet 4で解析（モデル名は正式リリース時に更新）
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',  // ← 正しいモデルIDに修正
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Image
            }
          },
          {
            type: 'text',
            text: `手相画像を分析し、JSON形式で結果を返してください。

{
  "overallScore": 70-95の範囲の整数,
  "lifeLine": {
    "score": 70-95の範囲の整数,
    "title": "生命線",
    "description": "生命線の特徴を2文で",
    "advice": "健康アドバイスを1文で"
  },
  "heartLine": {
    "score": 70-95の範囲の整数,
    "title": "感情線",
    "description": "感情線の特徴を2文で",
    "advice": "恋愛アドバイスを1文で"
  },
  "headLine": {
    "score": 70-95の範囲の整数,
    "title": "頭脳線",
    "description": "頭脳線の特徴を2文で",
    "advice": "知的活動のアドバイスを1文で"
  },
  "fateLine": {
    "score": 70-95の範囲の整数,
    "title": "運命線",
    "description": "運命線の特徴を2文で",
    "advice": "キャリアアドバイスを1文で"
  },
  "sunLine": {
    "score": 70-95の範囲の整数,
    "title": "太陽線",
    "description": "太陽線の特徴を2文で",
    "advice": "成功へのアドバイスを1文で"
  },
  "todaysFortune": {
    "lucky": {
      "color": "赤/青/黄/緑/紫から1つ",
      "number": 1-9の整数,
      "direction": "北/南/東/西から1つ",
      "item": "具体的なアイテム1つ"
    },
    "message": "今日の運勢を1文で"
  },
  "overallAdvice": "総合アドバイスを2文で"
}

JSONのみ返してください。`
          }
        ]
      }]
    });

    // JSONを抽出
    const analysisText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';
    
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!analysis) {
      throw new Error('解析結果の取得に失敗しました');
    }

    return NextResponse.json({
      success: true,
      readingId,
      analysis,
      analyzedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: '解析エラーが発生しました' },
      { status: 500 }
    );
  }
}
