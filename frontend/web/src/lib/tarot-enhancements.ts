// ==========================================
// タロット占い改善: src/lib/tarot-enhancements.ts
// ==========================================

import { TarotCard } from '@/types/destiny.types';

// ==========================================
// 1. ラッキーカラーの偏り解消
// ==========================================

interface LuckyColorData {
  color: string;
  meaning: string;
  energy: string;
}

const LUCKY_COLORS: LuckyColorData[] = [
  { color: '赤', meaning: '情熱と行動力', energy: '火のエネルギー' },
  { color: 'オレンジ', meaning: '創造性と喜び', energy: '太陽のエネルギー' },
  { color: '黄色', meaning: '知性と楽観性', energy: '光のエネルギー' },
  { color: '緑', meaning: '成長と調和', energy: '自然のエネルギー' },
  { color: '青', meaning: '冷静さと信頼', energy: '水のエネルギー' },
  { color: '藍色', meaning: '直感と洞察', energy: '深淵のエネルギー' },
  { color: '紫', meaning: '精神性と変容', energy: '神秘のエネルギー' },
  { color: 'ピンク', meaning: '愛と優しさ', energy: '慈愛のエネルギー' },
  { color: '白', meaning: '純粋さと新しい始まり', energy: '浄化のエネルギー' },
  { color: '金', meaning: '豊かさと成功', energy: '繁栄のエネルギー' },
  { color: '銀', meaning: '直感と月の力', energy: '女性性のエネルギー' },
  { color: 'ターコイズ', meaning: 'コミュニケーション', energy: '表現のエネルギー' },
];

// カードの数値に基づいた決定論的な色選択（毎回同じカードなら同じ色）
export function getLuckyColor(cards: TarotCard[]): LuckyColorData {
  // カードIDの合計値から色を決定（0-21の範囲）
  const cardSum = cards.reduce((sum, card) => {
    const cardNumber = parseInt(card.id);
    return sum + (card.reversed ? cardNumber * 2 : cardNumber);
  }, 0);
  
  const index = cardSum % LUCKY_COLORS.length;
  return LUCKY_COLORS[index];
}

// ==========================================
// 2. 導入部分のバリエーション
// ==========================================

interface IntroText {
  greeting: string;
  context: string;
  transition: string;
}

const INTRO_PATTERNS: Record<string, IntroText[]> = {
  love: [
    {
      greeting: '愛と情熱の扉が開きました',
      context: 'あなたの心の声に耳を傾けながら、タロットのメッセージを受け取りましょう',
      transition: '3枚のカードが、恋愛における過去・現在・未来を照らし出します'
    },
    {
      greeting: 'ハートのエネルギーがあなたを包み込んでいます',
      context: '今この瞬間、あなたの恋愛運に宇宙が特別なメッセージを送っています',
      transition: '選ばれたカードが、愛の真実を明らかにします'
    },
    {
      greeting: '愛の女神が微笑む時です',
      context: 'タロットは鏡のように、あなたの心の奥底にある想いを映し出します',
      transition: 'これから明かされるカードに、素直な心で向き合いましょう'
    },
    {
      greeting: '運命の糸が交差する瞬間を迎えています',
      context: 'あなたの恋愛に関する問いかけに、カードが応えようとしています',
      transition: '深呼吸をして、カードからのメッセージを受け取る準備をしましょう'
    }
  ],
  career: [
    {
      greeting: '成功への扉が今、開こうとしています',
      context: 'あなたのキャリアパスに光を当てる時が来ました',
      transition: 'カードが示す道筋に注目してください'
    },
    {
      greeting: '仕事運の風向きが変わろうとしています',
      context: '今、あなたに必要な答えがタロットの中に隠されています',
      transition: '選ばれたカードが、キャリアの指針を示します'
    },
    {
      greeting: '野心と可能性の交差点に立っています',
      context: 'タロットが、あなたの職業人生における重要な局面を読み解きます',
      transition: 'カードのメッセージが、次のステップを照らし出すでしょう'
    },
    {
      greeting: '達成と成長のエネルギーが満ちています',
      context: '仕事における課題と機会、その両方をカードが映し出します',
      transition: 'あなたのキャリアを導く叡智を受け取りましょう'
    }
  ],
  money: [
    {
      greeting: '豊かさのエネルギーがあなたを取り囲んでいます',
      context: '金運の流れを読み解く時が来ました',
      transition: 'カードが財運の秘密を明かします'
    },
    {
      greeting: '繁栄の波動が近づいています',
      context: 'お金とあなたの関係性に、タロットが新たな視点をもたらします',
      transition: '3枚のカードが、財運の道筋を示してくれるでしょう'
    },
    {
      greeting: '富と価値の真実に触れる瞬間です',
      context: '金運は単なる数字ではなく、エネルギーの流れです',
      transition: 'カードを通じて、その流れを感じ取りましょう'
    },
    {
      greeting: '物質的な豊かさと精神的な充足の境界線上にいます',
      context: 'タロットが、あなたの財運における重要なメッセージを伝えます',
      transition: '選ばれたカードに、経済的な未来のヒントが隠されています'
    }
  ],
  general: [
    {
      greeting: '宇宙の叡智があなたに語りかけようとしています',
      context: '今日という日は、特別な意味を持つ一日になるでしょう',
      transition: 'カードが、あなたの人生における重要なメッセージを運んできます'
    },
    {
      greeting: '運命の扉が静かに開き始めています',
      context: 'タロットは古代から受け継がれた叡智の結晶です',
      transition: 'あなただけに向けられたメッセージを、今から受け取りましょう'
    },
    {
      greeting: '今この瞬間、全ての星々が整列しています',
      context: 'あなたの魂が求める答えが、カードの中に秘められています',
      transition: '心を開いて、タロットの導きを受け入れましょう'
    },
    {
      greeting: '時空を超えた知恵が、今あなたの元へ届けられます',
      context: 'タロットは偶然ではなく、必然によって選ばれます',
      transition: 'これから現れるカードには、深い意味が込められているのです'
    }
  ]
};

export function getIntroText(category: string, seed: number = Date.now()): IntroText {
  const patterns = INTRO_PATTERNS[category] || INTRO_PATTERNS.general;
  const index = seed % patterns.length;
  return patterns[index];
}

// ==========================================
// 3. ラッキーアイテム
// ==========================================

const LUCKY_ITEMS = [
  'クリスタル（透明な石）',
  'お香やアロマキャンドル',
  '観葉植物や生花',
  '美しい手帳やノート',
  'お気に入りの音楽',
  '月光浴をした水',
  'シルバーアクセサリー',
  '天然石のブレスレット',
  'ハーブティー',
  'フェザー（羽根）',
  '鏡（小さな手鏡）',
  'ベル（鈴）',
  '砂時計',
  '星モチーフのアイテム',
  'ラベンダーサシェ',
];

export function getLuckyItem(cards: TarotCard[]): string {
  const cardSum = cards.reduce((sum, card) => sum + parseInt(card.id), 0);
  const index = cardSum % LUCKY_ITEMS.length;
  return LUCKY_ITEMS[index];
}

// ==========================================
// 4. パワータイム
// ==========================================

interface PowerTime {
  time: string;
  reason: string;
}

const POWER_TIMES: PowerTime[] = [
  { time: '早朝5時〜7時', reason: '太陽のエネルギーが最も純粋な時間帯' },
  { time: '正午12時前後', reason: '太陽が最高点に達し、活力が満ちる時' },
  { time: '午後3時〜4時', reason: '一日の中で直感が冴える黄金の時間' },
  { time: '夕暮れ時', reason: '昼と夜の境界で魔法的なエネルギーが高まる' },
  { time: '夜22時以降', reason: '月のエネルギーが強まり、内省に適した時間' },
  { time: '深夜0時前後', reason: '一日の区切りで新しいサイクルが始まる神聖な時' },
];

export function getPowerTime(cards: TarotCard[]): PowerTime {
  const cardSum = cards.reduce((sum, card) => sum + parseInt(card.id), 0);
  const index = cardSum % POWER_TIMES.length;
  return POWER_TIMES[index];
}

// ==========================================
// 5. 開運の方位
// ==========================================

const DIRECTIONS = ['北', '北東', '東', '南東', '南', '南西', '西', '北西'];

export function getLuckyDirection(cards: TarotCard[]): string {
  const cardSum = cards.reduce((sum, card) => sum + parseInt(card.id), 0);
  const index = cardSum % DIRECTIONS.length;
  return DIRECTIONS[index];
}

// ==========================================
// 6. 結果テンプレートの生成
// ==========================================

interface ResultClosing {
  opening: string;
  transition: string;
  advice: string;
  closing: string;
}

const RESULT_CLOSINGS: ResultClosing[] = [
  {
    opening: 'カードが示す真実の時が来ました。',
    transition: 'これらのカードは、単なる偶然ではありません。宇宙の意志があなたに語りかけています。',
    advice: 'カードのメッセージを心に刻み、日々の行動に活かしてください。',
    closing: 'この占いがあなたの人生における光となりますように。運命はあなたの味方です。'
  },
  {
    opening: '運命のカードが全て揃いました。',
    transition: '一枚一枚のカードに込められた意味を、深く受け止めてください。',
    advice: 'タロットは警告ではなく、可能性を示すものです。前向きに捉えましょう。',
    closing: 'あなたの未来は、あなた自身の手の中にあります。信じて進んでください。'
  },
  {
    opening: 'タロットの神秘が今、解き明かされます。',
    transition: '選ばれたカードには、必然的な理由があります。その意味を噛みしめましょう。',
    advice: 'この占い結果を、人生の羅針盤として活用してください。',
    closing: '星々の導きがあなたと共にありますように。素晴らしい未来が待っています。'
  },
  {
    opening: '宇宙からのメッセージが届きました。',
    transition: 'これらのカードは、あなたの潜在意識が引き寄せたものです。',
    advice: '示されたメッセージを信じ、勇気を持って一歩を踏み出しましょう。',
    closing: 'タロットの叡智があなたの道を照らし続けますように。幸運を祈ります。'
  }
];

export function getResultClosing(seed: number): ResultClosing {
  const index = seed % RESULT_CLOSINGS.length;
  return RESULT_CLOSINGS[index];
}

// ==========================================
// 7. 統合: 改善された開運セクションを生成
// ==========================================

export function generateEnhancedFortuneSection(
  cards: TarotCard[],
  seed: number = Date.now()
): string {
  const luckyColor = getLuckyColor(cards);
  const luckyItem = getLuckyItem(cards);
  const powerTime = getPowerTime(cards);
  const direction = getLuckyDirection(cards);
  const closing = getResultClosing(seed);

  return `
━━━━━━━━━━━━━━━━━
🍀 開運ポイント
━━━━━━━━━━━━━━━━━

**ラッキーカラー**: ${luckyColor.color}
${luckyColor.meaning}を象徴し、${luckyColor.energy}をもたらします。
この色を身につけたり、意識的に取り入れることで、運気の流れが良くなります。

**ラッキーアイテム**: ${luckyItem}
このアイテムを活用することで、カードのエネルギーとより深くつながることができます。

**パワータイム**: ${powerTime.time}
${powerTime.reason}。
この時間帯に重要な決断や行動を起こすと良いでしょう。

**開運の方位**: ${direction}
この方角を意識して行動すると、良い流れを引き寄せやすくなります。

━━━━━━━━━━━━━━━━━
✨ 最後のメッセージ
━━━━━━━━━━━━━━━━━

${closing.transition}

${closing.advice}

${closing.closing}

🌙 占い師より愛を込めて
`;
}