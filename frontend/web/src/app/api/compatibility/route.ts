// src/app/api/compatibility/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { checkAndTrackUsage } from '@/lib/usage-tracker';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// 数秘術の計算
function calculateLifePath(birthDate: string): number {
  const digits = birthDate.replace(/-/g, '').split('').map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').map(Number).reduce((a, b) => a + b, 0);
  }
  
  return sum;
}

// 星座の計算
function getZodiacSign(birthDate: string): string {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const signs = [
    { sign: '山羊座', start: [12, 22], end: [1, 19] },
    { sign: '水瓶座', start: [1, 20], end: [2, 18] },
    { sign: '魚座', start: [2, 19], end: [3, 20] },
    { sign: '牡羊座', start: [3, 21], end: [4, 19] },
    { sign: '牡牛座', start: [4, 20], end: [5, 20] },
    { sign: '双子座', start: [5, 21], end: [6, 21] },
    { sign: '蟹座', start: [6, 22], end: [7, 22] },
    { sign: '獅子座', start: [7, 23], end: [8, 22] },
    { sign: '乙女座', start: [8, 23], end: [9, 22] },
    { sign: '天秤座', start: [9, 23], end: [10, 23] },
    { sign: '蠍座', start: [10, 24], end: [11, 21] },
    { sign: '射手座', start: [11, 22], end: [12, 21] }
  ];
  
  for (const { sign, start, end } of signs) {
    if ((month === start[0] && day >= start[1]) || (month === end[0] && day <= end[1])) {
      return sign;
    }
  }
  
  return '山羊座';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 受信したリクエストボディ:', JSON.stringify(body, null, 2));
    
    // 新しい形式に対応
    let person1, person2, category, userId;
    
    if (body.person1 && body.person2) {
      // 旧形式
      ({ person1, person2, category, userId } = body);
    } else {
      // 新形式（直接パラメータ）
      const { birthdate1, birthdate2, name1, name2, userId: uid } = body;
      person1 = { name: name1, birthDate: birthdate1 };
      person2 = { name: name2, birthDate: birthdate2 };
      category = 'love'; // デフォルト
      userId = uid;
    }
    
    console.log('✅ person1:', person1);
    console.log('✅ person2:', person2);
    console.log('✅ category:', category);
    console.log('✅ userId:', userId);

    // バリデーション
    if (!person1?.name || !person1?.birthDate || !person2?.name || !person2?.birthDate) {
      return NextResponse.json({
        success: false,
        error: '必要な情報が不足しています'
      }, { status: 400 });
    }

    // ===== 使用制限チェック & 使用回数記録 =====
    if (userId) {
      console.log('📊 相性診断の使用制限をチェック中...');
      
      try {
        const usageCheck = await checkAndTrackUsage(userId, 'compatibilityCount');
        
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
        // 使用制限チェックのエラーは相性診断処理を止めない（フォールバック）
      }
    } else {
      console.warn('⚠️ userIdが提供されていません。使用制限チェックをスキップします。');
    }

    // 数秘術の計算
    const lifePath1 = calculateLifePath(person1.birthDate);
    const lifePath2 = calculateLifePath(person2.birthDate);
    
    // 星座の取得
    const zodiac1 = getZodiacSign(person1.birthDate);
    const zodiac2 = getZodiacSign(person2.birthDate);

    // カテゴリーのマッピング
    const categoryTextMap: Record<string, string> = {
      love: '恋愛',
      friendship: '友情',
      work: '仕事'
    };
    
    const categoryText = categoryTextMap[category] || '恋愛';

    const prompt = `あなたは経験豊富な占い師です。以下の二人の相性を詳しく分析してください。

【1人目】
名前: ${person1.name}
生年月日: ${person1.birthDate}
ライフパスナンバー: ${lifePath1}
星座: ${zodiac1}

【2人目】
名前: ${person2.name}
生年月日: ${person2.birthDate}
ライフパスナンバー: ${lifePath2}
星座: ${zodiac2}

【診断タイプ】: ${categoryText}相性

以下のJSON形式で相性診断の結果を返してください。JSON以外の説明文は一切含めず、純粋なJSON形式のみを返してください：

{
  "overallScore": 総合相性スコア(1-100の数値),
  "interpretation": "詳細な解釈（800文字程度の文章）。数秘術とそれぞれの星座の特徴を踏まえた具体的な相性分析を含めてください。",
  "advice": "二人の関係をより良くするための具体的なアドバイス（400文字程度）",
  "strengths": ["この二人の組み合わせの強み1", "強み2", "強み3"],
  "challenges": ["注意すべき点1", "注意すべき点2", "注意すべき点3"]
}

【分析のポイント】
1. 数秘術のライフパスナンバーから見た相性
2. 星座同士の相性と特徴
3. ${categoryText}における具体的な相性
4. 実践的で前向きなアドバイス
5. 相性スコアは現実的な範囲（40-90点程度）で設定

解釈は具体的で温かみのある内容にし、二人の関係の可能性を前向きに示してください。`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    console.log('📝 Claude API Raw Response:', responseText.substring(0, 500));

    // JSONを抽出（より厳密に）
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ JSON形式が見つかりませんでした');
      throw new Error('JSON形式のレスポンスが取得できませんでした');
    }

    let jsonString = jsonMatch[0];
    
    // 制御文字をエスケープ（念のため）
    jsonString = jsonString
      .replace(/\n/g, ' ')  // 改行を半角スペースに
      .replace(/\r/g, '')   // キャリッジリターンを削除
      .replace(/\t/g, ' ')  // タブを半角スペースに
      .replace(/[\x00-\x1F\x7F]/g, ''); // その他の制御文字を削除

    console.log('🔧 Cleaned JSON:', jsonString.substring(0, 300));

    let result;
    try {
      result = JSON.parse(jsonString);
      
      // 結果ページで期待される形式に変換
      if (result.overallScore && !result.overall) {
        result.overall = result.overallScore;
      }
      
    } catch (parseError) {
      console.error('❌ JSONパースエラー:', parseError);
      console.error('❌ 問題のJSON文字列:', jsonString);
      throw new Error('JSON解析に失敗しました');
    }

    console.log('✅ 相性診断成功:', {
      overallScore: result.overallScore || result.overall,
      hasInterpretation: !!result.interpretation,
      hasAdvice: !!result.advice,
      strengthsCount: result.strengths?.length || 0,
      challengesCount: result.challenges?.length || 0
    });

    return NextResponse.json({ 
      success: true,
      result 
    });

  } catch (error) {
    console.error('相性診断APIエラー:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '相性診断に失敗しました'
      },
      { status: 500 }
    );
  }
}
