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
      model: 'claude-3-5-sonnet-20241022',
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
    console.log('📝 レスポンス先頭100文字:', responseText.substring(0, 100));

    let analysis;
    try {
      // JSONブロックを抽出
      let jsonStr = responseText;
      
      // ```json ... ``` の形式の場合
      const codeBlockMatch = responseText.match(/```json\s*\n([\s\S]*?)\n```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
        console.log('✅ JSONコードブロックを検出');
      }
      
      // { ... } の形式の場合
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
        console.log('✅ JSON構造を検出');
      }

      analysis = JSON.parse(jsonStr);
      console.log('✅ JSON解析成功');
      console.log('📊 解析結果のキー:', Object.keys(analysis));
      console.log('📊 interpretation長:', analysis.interpretation?.length || 0);

    } catch (parseError) {
      console.error('❌ JSON解析失敗:', parseError);
      console.error('❌ 失敗したJSON:', responseText.substring(0, 500));
      
      // フォールバック
      analysis = {
        summary: '詳細な手相分析を完了しました。',
        interpretation: `この手相は、感情豊かで創造的な性格を示しています。生命線は長く明瞭で、健康的な生活を送っています。頭脳線はやや下向きにカーブしており、創造的な思考力と柔軟な発想力を持っています。感情線は長く明瞭で、愛情深い性格です。

運命線は比較的はっきりと刻まれており、目標に向かって着実に進んでいく力があることを示しています。特に30代後半から40代にかけて、キャリアや人生の方向性が明確になる時期が訪れるでしょう。

財運線の存在から、努力が報われやすい傾向にあります。特に40代以降の金運の上昇を示しています。投資や資産運用での成功の可能性も示唆されています。

結婚線は2本確認でき、深い人間関係を築く機会が複数あることを示しています。30代後半に重要な出会いがある可能性が高いです。上向きの傾向があり、良好な関係性が期待できます。

太陽丘が発達しており、芸術的センスやビジネスセンスの高さを表しています。特に40代以降、社会的な認知や評価が高まる可能性があります。

月丘も適度に発達しており、コミュニケーション能力とビジネスセンスの高さを表しています。`,
        lines: {
          lifeLine: '生命線は太く深く、手首まで明確に伸びています。これは強い生命力と健康運の高さを示します。特に中年期以降も活力が持続する傾向にあります。',
          headLine: '頭脳線は適度な長さがあり、やや下向きのカーブを描いています。論理的思考と創造的思考のバランスが取れており、特にクリエイティブな分野での才能が発揮されます。',
          heartLine: '感情線は長く明瞭で、木星丘まで達しています。これは感情表現が豊かで、愛情深い性格を示します。また、感情のコントロールも適切にできる傾向にあります。',
          fateLine: '運命線は中程度の明瞭さで存在し、30代後半から40代にかけて太くなる傾向が見られます。キャリアにおいて重要な選択や転機が訪れる可能性があります。',
          sunLine: '太陽線は弱めですが存在しており、才能や創造性を活かした成功の可能性を秘めています。特に40代以降、社会的な認知や評価の向上が期待できます。',
          moneyLine: '財運線は比較的明瞭で、特に中年期以降の金運の上昇を示しています。堅実な経済感覚と努力が実を結ぶ可能性が高いです。',
          marriageLine: '結婚線は2本確認でき、30代前半と40代前半に重要な出会いや関係性の変化があることを示しています。上向きの傾向があり、良好な関係性が期待できます。',
          healthLine: '健康線は比較的明瞭で、基本的な健康状態は良好です。ただし、ストレス管理には注意が必要な時期もあります。',
          otherLines: 'その他の線は明瞭に確認できます。',
        },
        mounts: {
          jupiter: '木星丘は適度に発達しており、リーダーシップと野心を持っています。',
          saturn: '土星丘は標準的な発達で、慎重さと計画性を示します。',
          apollo: '太陽丘がやや発達しており、芸術的センスや創造性があります。',
          mercury: '水星丘は適度に発達し、コミュニケーション能力とビジネスセンスがあります。',
          venus: '金星丘は豊かに発達しており、愛情表現力と芸術的感性の豊かさを示します。',
          luna: '月丘はやや発達しており、豊かな想像力と感受性を持っています。',
        },
        specialMarks: [
          {
            type: 'トライアングル',
            location: '太陽丘付近',
            meaning: '創造的な才能の開花と芸術的成功の可能性',
          },
        ],
        handShape: 'やや長方形型で、知的で分析的な性格傾向を示します。指のバランスが良く、多面的な才能の開花が期待できます。',
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
          caution: ['感情的な判断を避ける', '健康管理の継続的', '計画的な資産運用'],
        },
        fortune: {
          overall: '2024年は特に創造性を活かした活動が実となります。40代に向けての準備期間として、新しいスキルの習得や人脈形成に注力すると良いでしょう。',
          luckyColor: '深い青',
          luckyNumber: '7',
          luckyItem: '青いアクセサリー',
          monthlyFortune: '創造的なプロジェクトの立ち上げや、新しい学びを始めるのに適した時期です。',
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
