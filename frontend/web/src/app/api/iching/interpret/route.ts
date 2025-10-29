// src/app/api/iching/interpret/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { checkAndTrackUsage } from '@/lib/usage-tracker';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { question, hexagram, changingLines, futureHexagram, userId } = await request.json();

    // ===== 使用制限チェック & 使用回数記録（追加） =====
    if (userId) {
      console.log('📊 易占いの使用制限をチェック中...');
      
      try {
        const usageCheck = await checkAndTrackUsage(userId, 'ichingCount');
        
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
        // 使用制限チェックのエラーは易占い処理を止めない（フォールバック）
      }
    } else {
      console.warn('⚠️ userIdが提供されていません。使用制限チェックをスキップします。');
    }
    // ===== ここまで追加 =====

    const prompt = `あなたは易経（I Ching）の専門家です。以下の占いの結果を詳しく解釈してください。

【質問】
${question}

【本卦】
番号: ${hexagram.number}
名前: ${hexagram.name} (${hexagram.chinese})
卦辞: ${hexagram.judgment}
象伝: ${hexagram.image}
キーワード: ${hexagram.keywords.join('、')}

【変爻】
${changingLines.length > 0 ? `変爻の位置: ${changingLines.map((i: number) => i + 1).join('、')}爻目` : 'なし'}

${futureHexagram ? `【之卦（未来）】
番号: ${futureHexagram.number}
名前: ${futureHexagram.name} (${futureHexagram.chinese})
` : ''}

以下の観点から、質問者にとって分かりやすく、かつ深い洞察を含む解釈を800文字程度で提供してください：

1. **現在の状況の解釈**
   - 本卦が示す現在の状態
   - 質問に対する直接的な答え

2. **変化の示唆**（変爻がある場合）
   - 変爻が意味する転換点
   - 之卦が示す未来の展開

3. **具体的なアドバイス**
   - 取るべき行動
   - 避けるべきこと
   - 心構え

4. **時期とタイミング**
   - いつ行動すべきか
   - 待つべき時期があるか

5. **古典の知恵**
   - 卦辞・象伝の深い意味
   - 現代への応用

文章は親しみやすく、しかし威厳のある占い師の語り口で書いてください。質問者を励まし、前向きな気持ちにさせる内容を心がけてください。`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251201',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const interpretation = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    return NextResponse.json({ 
      success: true,
      interpretation 
    });

  } catch (error) {
    console.error('易占い解釈エラー:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '解釈の生成に失敗しました' 
      },
      { status: 500 }
    );
  }
}