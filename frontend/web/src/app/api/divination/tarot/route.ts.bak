import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// APIキーの確認
const API_KEY = process.env.ANTHROPIC_API_KEY;
console.log('🔑 API Key status:', API_KEY ? 'Found' : 'Not found');
console.log('🔑 API Key prefix:', API_KEY?.substring(0, 30) + '...');

// 強制的に本番モード
const USE_MOCK = false; // ← 直接falseに設定

const anthropic = API_KEY 
  ? new Anthropic({ apiKey: API_KEY })
  : null;

if (!anthropic) {
  console.error('⚠️ Anthropic client not initialized! Check your API key.');
}

// タロットカードデータ（省略...既存のまま）
const TAROT_CARDS = [
  { id: 0, name: '愚者', arcana: 'major', meaning: '新しい始まり、無邪気、自由、冒険' },
  { id: 1, name: '魔術師', arcana: 'major', meaning: '意志力、創造力、スキル、集中' },
  { id: 2, name: '女教皇', arcana: 'major', meaning: '直感、潜在意識、神秘、内なる声' },
  { id: 3, name: '女帝', arcana: 'major', meaning: '豊穣、母性、創造、自然' },
  { id: 4, name: '皇帝', arcana: 'major', meaning: '権威、構造、支配、父性' },
  { id: 5, name: '教皇', arcana: 'major', meaning: '伝統、慣習、教育、信念体系' },
  { id: 6, name: '恋人', arcana: 'major', meaning: '愛、調和、関係性、価値観の選択' },
  { id: 7, name: '戦車', arcana: 'major', meaning: '意志力、決断力、勝利、自己制御' },
  { id: 8, name: '力', arcana: 'major', meaning: '内なる強さ、勇気、忍耐、慈悲' },
  { id: 9, name: '隠者', arcana: 'major', meaning: '内省、探求、導き、孤独' },
  { id: 10, name: '運命の輪', arcana: 'major', meaning: '運命、周期、転換点、チャンス' },
  { id: 11, name: '正義', arcana: 'major', meaning: '公平、真実、因果、バランス' },
  { id: 12, name: '吊るされた男', arcana: 'major', meaning: '犠牲、手放し、新しい視点、忍耐' },
  { id: 13, name: '死神', arcana: 'major', meaning: '終わりと始まり、変容、手放し、再生' },
  { id: 14, name: '節制', arcana: 'major', meaning: '節度、バランス、忍耐、調和' },
  { id: 15, name: '悪魔', arcana: 'major', meaning: '執着、物質主義、束縛、誘惑' },
  { id: 16, name: '塔', arcana: 'major', meaning: '突然の変化、崩壊、啓示、解放' },
  { id: 17, name: '星', arcana: 'major', meaning: '希望、インスピレーション、静けさ、精神性' },
  { id: 18, name: '月', arcana: 'major', meaning: '幻想、不安、直感、潜在意識' },
  { id: 19, name: '太陽', arcana: 'major', meaning: '成功、喜び、活力、自信' },
  { id: 20, name: '審判', arcana: 'major', meaning: '判断、再生、内なる呼びかけ、赦し' },
  { id: 21, name: '世界', arcana: 'major', meaning: '完成、統合、達成、旅の終わり' },
];

function selectRandomCards(spreadType: string) {
  const count = spreadType === 'three-card' ? 3 : 10;
  const shuffled = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(card => ({
    ...card,
    isReversed: Math.random() > 0.5
  }));
}

export async function POST(request: NextRequest) {
  try {
    const { question, spreadType = 'three-card' } = await request.json();
    const selectedCards = selectRandomCards(spreadType);
    
    let interpretation = '';
    let apiUsed = 'none';

    if (!anthropic) {
      console.error('❌ Anthropic client is not available!');
      interpretation = `APIキーが設定されていません。.env.localファイルを確認してください。`;
      apiUsed = 'error';
    } else {
      try {
        console.log('🚀 Calling Claude API with question:', question);
        
        const prompt = `あなたは日本で最も有名な占い師「神秘の導き手」です。
長年の経験と深い洞察力を持ち、相談者の心に寄り添いながら、具体的で実践的なアドバイスを提供することで知られています。

今回、相談者から以下の質問を受けました：
「${question || '私の総合的な運勢を詳しく教えてください'}」

タロットカードを引いた結果は以下の通りです：

【過去】${selectedCards[0].name}${selectedCards[0].isReversed ? '（逆位置）' : '（正位置）'}
- カードの基本的意味：${selectedCards[0].meaning}

【現在】${selectedCards[1].name}${selectedCards[1].isReversed ? '（逆位置）' : '（正位置）'}
- カードの基本的意味：${selectedCards[1].meaning}

【未来】${selectedCards[2].name}${selectedCards[2].isReversed ? '（逆位置）' : '（正位置）'}
- カードの基本的意味：${selectedCards[2].meaning}

以下の構成で、2500文字以上の非常に詳細で具体的な占い結果を提供してください：

━━━━━━━━━━━━━━━━━
🌟 総合的なメッセージ
━━━━━━━━━━━━━━━━━
（300文字以上で、3枚のカードが示す全体的な流れとメッセージを説明）

━━━━━━━━━━━━━━━━━
⏰ 過去：${selectedCards[0].name}が示すもの
━━━━━━━━━━━━━━━━━
（500文字以上で、このカードが過去の位置で示す具体的な意味、あなたが経験してきたこと、それが現在にどう影響しているかを詳述）

━━━━━━━━━━━━━━━━━
🌸 現在：${selectedCards[1].name}が示すもの
━━━━━━━━━━━━━━━━━
（500文字以上で、現在の状況、直面している課題や機会、今すぐ取るべき行動を詳述）

━━━━━━━━━━━━━━━━━
🔮 未来：${selectedCards[2].name}が示すもの
━━━━━━━━━━━━━━━━━
（500文字以上で、これから訪れる可能性、注意すべき点、期待できる展開を詳述）

━━━━━━━━━━━━━━━━━
💫 3枚のカードが紡ぐストーリー
━━━━━━━━━━━━━━━━━
（400文字以上で、3枚のカードの関連性、因果関係、全体的な物語を説明）

━━━━━━━━━━━━━━━━━
🎯 具体的なアドバイス
━━━━━━━━━━━━━━━━━
（400文字以上で、質問に対する具体的で実践的なアドバイスを箇条書きではなく文章で提供）

━━━━━━━━━━━━━━━━━
🍀 開運ポイント
━━━━━━━━━━━━━━━━━
ラッキーカラー：（色とその理由）
ラッキーアイテム：（具体的なアイテムとその使い方）
おすすめの行動：（今週中に実践すべき具体的な行動3つ）
パワースポット：（訪れると良い場所のタイプ）
開運の時期：（特に運気が上昇する時期）

相談者の質問内容に必ず具体的に答え、温かみのある言葉で希望を与えながらも、現実的なアドバイスを含めてください。`;

        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          temperature: 0.9,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        });

        interpretation = response.content[0].type === 'text' 
          ? response.content[0].text 
          : 'エラーが発生しました';
        
        apiUsed = 'claude-success';
        console.log('✅ Claude API Success! Response length:', interpretation.length);
        
      } catch (apiError: any) {
        console.error('❌ Claude API Error:', apiError);
        console.error('Error details:', apiError.message);
        interpretation = `APIエラーが発生しました: ${apiError.message}`;
        apiUsed = 'claude-error';
      }
    }

    return NextResponse.json({
      success: true,
      id: Date.now().toString(),
      cards: selectedCards,
      interpretation,
      spreadType,
      timestamp: new Date().toISOString(),
      metadata: {
        apiUsed,
        interpretationLength: interpretation.length,
        isMock: false
      }
    });

  } catch (error: any) {
    console.error('❌ General error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      cards: [],
      interpretation: 'エラーが発生しました',
      spreadType: 'three-card',
      timestamp: new Date().toISOString()
    });
  }
}

function detectQuestionCategory(question: string | undefined): string {
  if (!question) return 'general';
  if (question.includes('恋愛') || question.includes('恋')) return 'love';
  if (question.includes('仕事') || question.includes('キャリア')) return 'career';
  if (question.includes('金') || question.includes('お金')) return 'money';
  return 'general';
}
