import { NextRequest, NextResponse } from 'next/server';

// ダミーの手相解析結果を生成（後でClaude APIに置き換え）
function generateDummyAnalysis() {
  const scores = {
    lifeLine: Math.floor(Math.random() * 30) + 70,
    heartLine: Math.floor(Math.random() * 30) + 70,
    headLine: Math.floor(Math.random() * 30) + 70,
    fateLine: Math.floor(Math.random() * 30) + 70,
    sunLine: Math.floor(Math.random() * 30) + 70
  };

  return {
    // 総合運勢スコア
    overallScore: Math.floor(Object.values(scores).reduce((a, b) => a + b, 0) / 5),
    
    // 各線の詳細分析
    lifeLine: {
      score: scores.lifeLine,
      title: "生命線",
      description: "生命線がはっきりとしており、健康運が良好です。長寿の相が見られます。",
      advice: "現在の健康的な生活習慣を維持することで、より充実した人生を送れるでしょう。"
    },
    
    heartLine: {
      score: scores.heartLine,
      title: "感情線",
      description: "感情線が美しい弧を描いており、豊かな感受性と愛情深さを示しています。",
      advice: "あなたの優しさは周囲の人々を幸せにします。自分の感情も大切にしましょう。"
    },
    
    headLine: {
      score: scores.headLine,
      title: "頭脳線",
      description: "頭脳線が明瞭で、論理的思考力と創造性のバランスが取れています。",
      advice: "新しいことにチャレンジする絶好の時期です。学習や創作活動に取り組んでみましょう。"
    },
    
    fateLine: {
      score: scores.fateLine,
      title: "運命線",
      description: "運命線が力強く伸びており、目標達成への強い意志を示しています。",
      advice: "今年は大きな転機が訪れる可能性があります。チャンスを逃さないよう準備しておきましょう。"
    },
    
    sunLine: {
      score: scores.sunLine,
      title: "太陽線",
      description: "太陽線が現れており、成功と幸運の兆しが見えます。",
      advice: "あなたの才能が開花する時期です。自信を持って前進しましょう。"
    },
    
    // 今日の運勢
    todaysFortune: {
      lucky: {
        color: ["赤", "オレンジ", "黄色"][Math.floor(Math.random() * 3)],
        number: Math.floor(Math.random() * 9) + 1,
        direction: ["北", "南", "東", "西"][Math.floor(Math.random() * 4)],
        item: ["水晶", "花", "本", "鍵"][Math.floor(Math.random() * 4)]
      },
      message: "今日は新しい出会いがありそうです。積極的に行動することで良い結果が得られるでしょう。"
    },
    
    // 総合アドバイス
    overallAdvice: "あなたの手相は全体的にバランスが良く、幸運な相を持っています。自分の直感を信じて行動することで、より良い未来を築けるでしょう。"
  };
}

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

    // ダミーの処理時間をシミュレート（1-2秒）
    await new Promise(resolve => setTimeout(resolve, 1500));

    // ダミー解析結果を生成
    const analysis = generateDummyAnalysis();

    return NextResponse.json({
      success: true,
      readingId,
      analysis,
      analyzedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: '解析中にエラーが発生しました' },
      { status: 500 }
    );
  }
}