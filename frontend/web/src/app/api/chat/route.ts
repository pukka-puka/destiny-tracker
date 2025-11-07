// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { checkAndTrackUsage } from '@/lib/usage-tracker';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, newMessage, characterPrompt, userId } = await request.json();

    // ===== 使用制限チェック & 使用回数記録（追加） =====
    if (userId) {
      console.log('📊 AIチャットの使用制限をチェック中...');
      
      try {
        const usageCheck = await checkAndTrackUsage(userId, 'chatConsultCount');
        
        if (!usageCheck.allowed) {
          console.log('❌ 使用制限に達しています');
          return NextResponse.json({
            success: false,
            error: 'Usage limit reached',
            message: usageCheck.message,
            limit: usageCheck.result.limit,
            currentUsage: usageCheck.result.currentUsage,
            remaining: usageCheck.result.remaining,
            resetDate: usageCheck.result.resetDate,
          }, { status: 403 });
        }
        
        console.log('✅ 使用制限OK & 使用回数を記録しました');
      } catch (usageError: any) {
        console.error('⚠️ 使用制限チェックエラー:', usageError);
        // 使用制限チェックのエラーはチャット処理を止めない（フォールバック）
      }
    } else {
      console.warn('⚠️ userIdが提供されていません。使用制限チェックをスキップします。');
    }
    // ===== ここまで追加 =====

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
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: systemPrompt,
      messages: conversationHistory
    });

    const response = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    return NextResponse.json({ 
      success: true,
      response 
    });

  } catch (error) {
    console.error('チャットAPIエラー:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'メッセージの送信に失敗しました' 
      },
      { status: 500 }
    );
  }
}