// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, newMessage, characterPrompt } = await request.json();

    // システムプロンプト
    const systemPrompt = `${characterPrompt}

以下のガイドラインに従って応答してください：

1. **共感と理解**: まず相談者の気持ちに共感し、理解を示す
2. **具体性**: 抽象的なアドバイスではなく、具体的で実践可能な提案をする
3. **前向き**: 問題点を指摘するだけでなく、解決策と希望を提示する
4. **適切な長さ**: 長すぎず短すぎず、200-400文字程度で簡潔に
5. **質問**: 必要に応じて相談者の状況をより深く理解するための質問をする

相談者に寄り添い、実用的で温かみのある応答を心がけてください。`;

    // 会話履歴を構築（最新10件まで）
    const conversationHistory = messages.slice(-10).map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // 新しいメッセージを追加
    conversationHistory.push({
      role: 'user',
      content: newMessage
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: conversationHistory
    });

    const response = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    return NextResponse.json({ response });

  } catch (error) {
    console.error('チャットAPIエラー:', error);
    return NextResponse.json(
      { error: 'メッセージの送信に失敗しました' },
      { status: 500 }
    );
  }
}