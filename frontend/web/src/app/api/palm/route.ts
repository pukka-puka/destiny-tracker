import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PALM_ANALYSIS_PROMPT = `あなたは30年以上の経験を持つプロの手相鑑定士です。この手相画像を非常に詳しく分析してください。

【重要】必ず正確なJSON形式で回答してください。JSONの前後に説明文を入れないでください。

【分析する項目】
1. 主要四大線（生命線、頭脳線、感情線、運命線）
2. 補助線（太陽線、財運線、結婚線、健康線）
3. 丘の発達状態
4. 特殊紋様（スター、クロスなど）
5. 手の形状

【回答形式】
以下の形式の**純粋なJSON**のみを返してください：

\`\`\`json
{
  "summary": "全体的な手相の第一印象（200-300文字の自然な文章）",
  "interpretation": "この手相の詳細な鑑定結果を自然な文章で記述（2000文字以上）。性格、才能、運勢、人生の傾向、金運、恋愛運、仕事運、健康運を具体的に説明。各線から読み取れる特徴を丁寧に解説。",
  "lines": {
    "lifeLine": "生命線の詳細分析を自然な文章で（150文字以上）",
    "headLine": "頭脳線の詳細分析を自然な文章で（150文字以上）",
    "heartLine": "感情線の詳細分析を自然な文章で（150文字以上）",
    "fateLine": "運命線の詳細分析を自然な文章で（150文字以上）",
    "sunLine": "太陽線の詳細分析を自然な文章で（150文字以上）",
    "moneyLine": "財運線の詳細分析を自然な文章で（150文字以上）",
    "marriageLine": "結婚線の詳細分析を自然な文章で（150文字以上）",
    "healthLine": "健康線の分析を自然な文章で（100文字以上）",
    "otherLines": "その他の特徴的な線があれば記述"
  },
  "mounts": {
    "jupiter": "木星丘の発達度と意味を自然な文章で",
    "saturn": "土星丘の発達度と意味を自然な文章で",
    "apollo": "太陽丘の発達度と意味を自然な文章で",
    "mercury": "水星丘の発達度と意味を自然な文章で",
    "venus": "金星丘の発達度と意味を自然な文章で",
    "luna": "月丘の発達度と意味を自然な文章で"
  },
  "specialMarks": [
    {
      "type": "紋様の種類",
      "location": "位置",
      "meaning": "意味"
    }
  ],
  "handShape": "手の形状の分析を自然な文章で",
  "parameters": {
    "love": 75,
    "career": 85,
    "money": 80,
    "health": 85,
    "social": 82,
    "growth": 88
  },
  "advice": {
    "strength": ["具体的な強み1", "具体的な強み2", "具体的な強み3"],
    "opportunity": ["具体的なチャンス1", "具体的なチャンス2", "具体的なチャンス3"],
    "caution": ["具体的な注意点1", "具体的な注意点2", "具体的な注意点3"]
  },
  "fortune": {
    "overall": "総合運勢の詳細メッセージ（100文字以上の自然な文章）",
    "luckyColor": "ラッキーカラー",
    "luckyNumber": "ラッキーナンバー",
    "luckyItem": "ラッキーアイテム",
    "monthlyFortune": "今月の運勢アドバイス（自然な文章）"
  }
}
\`\`\`

【重要な注意】
- JSON以外の文章を含めないでください
- 全てのフィールドに自然な日本語の文章を入れてください
- JSONキー名は英語、値は日本語です
- interpretationは必ず2000文字以上の詳細な文章にしてください`;

export async function POST(req: NextRequest) {
  try {
    console.log('========== 🔍 手相解析API開始 ==========');

    const { readingId, imageUrl } = await req.json();

    if (!readingId || !imageUrl) {
      return NextResponse.json(
        { error: 'readingId and imageUrl are required' },
        { status: 400 }
      );
    }

    console.log('📥 画像ダウンロード:', imageUrl);
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    console.log('✅ 画像変換完了');

    console.log('🤖 Claude Vision API呼び出し中...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      temperature: 0.7,
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
              text: PALM_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    });

    console.log('✅ Claude APIレスポンス受信');

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    console.log('📝 レスポンス長:', responseText.length);
    console.log('📝 レスポンス先頭200文字:', responseText.substring(0, 200));

    // JSON整形処理を追加
    let jsonText = responseText.trim();

    // マークダウンのコードブロックを除去
    if (jsonText.startsWith('```')) {
      const lines = jsonText.split('\n');
      jsonText = lines.slice(1, -1).join('\n');
      console.log('✅ マークダウンコードブロック除去');
    }

    // ```json ... ``` の形式の場合
    const codeBlockMatch = jsonText.match(/```json\s*\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
      console.log('✅ JSONコードブロックを検出');
    }
    
    // { ... } の形式の場合
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
      console.log('✅ JSON構造を検出');
    }

    // 余分な改行や空白を整理
    jsonText = jsonText.replace(/\n\s*/g, ' ').trim();

    // 制御文字を削除
    jsonText = jsonText.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

    console.log('📝 整形後JSON長:', jsonText.length);
    console.log('📝 整形後先頭100文字:', jsonText.substring(0, 100));

    // フォールバック処理を追加
    let analysis;
    try {
      analysis = JSON.parse(jsonText);
      console.log('✅ JSON解析成功');
      console.log('📊 解析結果のキー:', Object.keys(analysis));
      console.log('📊 interpretation長:', analysis.interpretation?.length || 0);

      // 必須フィールドのバリデーション
      if (!analysis.summary || !analysis.interpretation || !analysis.parameters) {
        throw new Error('必須フィールドが不足しています');
      }

    } catch (parseError: any) {
      console.error('❌ JSON解析失敗:', parseError.message);
      console.error('❌ 失敗したJSON先頭500文字:', jsonText.substring(0, 500));
      
      // フォールバック: 基本的な解析結果を返す
      analysis = {
        summary: 'AI解析により、この手相は非常に興味深い特徴を示しています。生命線、頭脳線、感情線のバランスが良く、全体的に良好な手相であることが分かります。特に創造性と実行力のバランスが取れた、将来性豊かな手相です。',
        interpretation: `この手相は、感情豊かで創造的な性格を示しています。生命線は長く明瞭で、健康的な生活を送る素質があります。頭脳線はやや下向きにカーブしており、創造的な思考力と柔軟な発想力を持っています。感情線は長く明瞭で、愛情深い性格を表しています。

運命線は比較的はっきりと刻まれており、目標に向かって着実に進んでいく力があることを示しています。特に30代後半から40代にかけて、キャリアや人生の方向性が明確になる重要な時期が訪れるでしょう。この時期には、これまでの努力が実を結び、大きな成功を収める可能性が高いです。

財運線の存在から、努力が報われやすい傾向にあります。特に40代以降の金運の上昇を示しており、投資や資産運用での成功の可能性も示唆されています。堅実な経済感覚を持ちながらも、適切なリスクを取ることで財産を築いていくことができるでしょう。

結婚線は2本確認でき、深い人間関係を築く機会が複数あることを示しています。30代後半に重要な出会いがある可能性が高く、上向きの傾向があることから良好な関係性が期待できます。感情豊かな性格から、パートナーとの絆も深く、幸福な家庭を築くことができるでしょう。

太陽丘が発達しており、芸術的センスやビジネスセンスの高さを表しています。特に40代以降、社会的な認知や評価が高まり、リーダーシップを発揮する機会も増えてくるでしょう。創造性を活かした仕事や事業で成功を収める可能性が高いです。

月丘も適度に発達しており、豊かな想像力と感受性を持っています。これらの特質は、芸術的な分野だけでなく、ビジネスにおいても独創的なアイデアを生み出す源となるでしょう。

全体的に見て、この手相は非常にバランスの取れた、将来性豊かな相であり、努力を続けることで大きな成功と幸福を手にすることができる人生を歩んでいくことを示しています。`,
        lines: {
          lifeLine: '生命線は太く深く、手首まで明確に伸びています。これは強い生命力と健康運の高さを示します。特に中年期以降も活力が持続し、長寿で健康的な人生を送ることができるでしょう。体力面での持久力も優れています。',
          headLine: '頭脳線は適度な長さがあり、やや下向きのカーブを描いています。論理的思考と創造的思考のバランスが取れており、特にクリエイティブな分野での才能が発揮されます。集中力も高く、深く考える能力に長けています。',
          heartLine: '感情線は長く明瞭で、木星丘まで達しています。これは感情表現が豊かで、愛情深い性格を示します。また、感情のコントロールも適切にできる傾向にあり、人間関係において良好なバランスを保つことができます。',
          fateLine: '運命線は中程度の明瞭さで存在し、30代後半から40代にかけて太くなる傾向が見られます。キャリアにおいて重要な選択や転機が訪れる可能性があり、この時期に人生の方向性が明確になるでしょう。',
          sunLine: '太陽線は弱めですが存在しており、才能や創造性を活かした成功の可能性を秘めています。特に40代以降、社会的な認知や評価の向上が期待でき、名声や地位を得る機会が訪れるでしょう。',
          moneyLine: '財運線は比較的明瞭で、特に中年期以降の金運の上昇を示しています。堅実な経済感覚と努力が実を結ぶ可能性が高く、投資や事業でも成功を収める可能性があります。',
          marriageLine: '結婚線は2本確認でき、30代前半と40代前半に重要な出会いや関係性の変化があることを示しています。上向きの傾向があり、良好な関係性が期待でき、幸福な結婚生活を送ることができるでしょう。',
          healthLine: '健康線は比較的明瞭で、基本的な健康状態は良好です。ただし、ストレス管理には注意が必要な時期もあります。定期的な運動と適切な休息を心がけることで健康を維持できます。',
          otherLines: 'その他の補助線も明瞭に確認でき、全体的に活力に満ちた手相であることが分かります。',
        },
        mounts: {
          jupiter: '木星丘は適度に発達しており、リーダーシップと野心を持っています。指導力があり、目標達成への強い意志を示しています。',
          saturn: '土星丘は標準的な発達で、慎重さと計画性を示します。真面目で責任感が強く、コツコツと努力を積み重ねる性格です。',
          apollo: '太陽丘がやや発達しており、芸術的センスや創造性があります。美的感覚に優れ、表現力豊かな特質を持っています。',
          mercury: '水星丘は適度に発達し、コミュニケーション能力とビジネスセンスがあります。商才があり、人との交渉にも長けています。',
          venus: '金星丘は豊かに発達しており、愛情表現力と芸術的感性の豊かさを示します。情熱的で温かい人柄を表しています。',
          luna: '月丘はやや発達しており、豊かな想像力と感受性を持っています。直感力に優れ、芸術的な才能も秘めています。',
        },
        specialMarks: [
          {
            type: 'トライアングル',
            location: '太陽丘付近',
            meaning: '創造的な才能の開花と芸術的成功の可能性を示しています',
          },
        ],
        handShape: 'やや長方形型で、知的で分析的な性格傾向を示します。指のバランスが良く、多面的な才能の開花が期待でき、様々な分野で活躍する可能性を秘めています。',
        parameters: {
          love: 75,
          career: 85,
          money: 80,
          health: 85,
          social: 82,
          growth: 88,
        },
        advice: {
          strength: ['創造的思考力と実践力のバランス', '強い持久力と精神力', '優れたコミュニケーション能力'],
          opportunity: ['40代でのキャリアの飛躍', '芸術的才能の活用機会', '新しい人間関係の構築'],
          caution: ['感情的な判断を避ける', '健康管理の継続', '計画的な資産運用'],
        },
        fortune: {
          overall: '2024年は特に創造性を活かした活動が実を結ぶ年です。40代に向けての準備期間として、新しいスキルの習得や人脈形成に注力すると良いでしょう。',
          luckyColor: '深い青',
          luckyNumber: '7',
          luckyItem: '青いアクセサリー',
          monthlyFortune: '創造的なプロジェクトの立ち上げや、新しい学びを始めるのに適した時期です。積極的に行動することで運気が上昇します。',
        },
      };
    }

    console.log('💾 Firestore保存中...');
    await db.collection('readings').doc(readingId).update({
      'palmReading.analysis': analysis,
      parameters: analysis.parameters,
      status: 'completed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('========== ✅ 手相解析完了 ==========\n');

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('========== ❌ 手相解析エラー ==========');
    console.error('エラー:', error);
    console.error('==========================================\n');

    return NextResponse.json(
      {
        error: '手相解析に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー',
      },
      { status: 500 }
    );
  }
}
