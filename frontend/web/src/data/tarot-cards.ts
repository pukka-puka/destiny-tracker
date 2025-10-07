import { DestinyParameters } from "@/types/destiny.types";

// src/data/tarot-cards.ts

export const majorArcana = [
  { id: '0', name: 'The Fool', nameJa: '愚者', meaning: '新しい始まり、無限の可能性、冒険' },
  { id: '1', name: 'The Magician', nameJa: '魔術師', meaning: '創造力、スキル、意志の力' },
  { id: '2', name: 'The High Priestess', nameJa: '女教皇', meaning: '直感、潜在意識、神秘' },
  { id: '3', name: 'The Empress', nameJa: '女帝', meaning: '豊穣、母性、創造' },
  { id: '4', name: 'The Emperor', nameJa: '皇帝', meaning: '権威、構造、安定' },
  { id: '5', name: 'The Hierophant', nameJa: '教皇', meaning: '伝統、精神的指導、学習' },
  { id: '6', name: 'The Lovers', nameJa: '恋人', meaning: '愛、調和、選択' },
  { id: '7', name: 'The Chariot', nameJa: '戦車', meaning: '勝利、意志力、前進' },
  { id: '8', name: 'Strength', nameJa: '力', meaning: '内なる強さ、勇気、忍耐' },
  { id: '9', name: 'The Hermit', nameJa: '隠者', meaning: '内省、探求、導き' },
  { id: '10', name: 'Wheel of Fortune', nameJa: '運命の輪', meaning: '変化、サイクル、運命' },
  { id: '11', name: 'Justice', nameJa: '正義', meaning: '公正、真実、バランス' },
  { id: '12', name: 'The Hanged Man', nameJa: '吊るされた男', meaning: '犠牲、新しい視点、待機' },
  { id: '13', name: 'Death', nameJa: '死神', meaning: '変容、終わりと始まり、再生' },
  { id: '14', name: 'Temperance', nameJa: '節制', meaning: 'バランス、調和、忍耐' },
  { id: '15', name: 'The Devil', nameJa: '悪魔', meaning: '束縛、執着、誘惑' },
  { id: '16', name: 'The Tower', nameJa: '塔', meaning: '突然の変化、啓示、解放' },
  { id: '17', name: 'The Star', nameJa: '星', meaning: '希望、インスピレーション、平穏' },
  { id: '18', name: 'The Moon', nameJa: '月', meaning: '幻想、不安、直感' },
  { id: '19', name: 'The Sun', nameJa: '太陽', meaning: '成功、活力、喜び' },
  { id: '20', name: 'Judgement', nameJa: '審判', meaning: '再生、内なる呼びかけ、判断' },
  { id: '21', name: 'The World', nameJa: '世界', meaning: '完成、達成、統合' }
];

// タロット解釈生成ヘルパー
export function generateTarotInterpretation(cards: any[], spread: string): string {
  const past = cards[0];
  const present = cards[1];
  const future = cards[2];
  
  return `過去の${past.nameJa}が示すのは${past.meaning}の影響です。
現在は${present.nameJa}のエネルギーが働いており、${present.meaning}の状況にあります。
未来に向けては${future.nameJa}が暗示する${future.meaning}の展開が予想されます。`;
}

// 運勢パラメータ計算（カードの意味に基づく実装）
export function calculateParametersFromCards(cards: any[]): DestinyParameters {
  // カードIDを数値に変換
  const cardIds = cards.map(card => parseInt(card.id));
  
  // 各カードの意味に基づいてパラメータを計算
  const baseValue = 50;
  
  // カードの属性マッピング
  const cardAttributes: { [key: string]: { love: number, career: number, money: number, health: number, social: number, growth: number }} = {
    '0': { love: 70, career: 60, money: 50, health: 80, social: 75, growth: 90 },  // 愚者
    '1': { love: 60, career: 85, money: 75, health: 70, social: 65, growth: 80 },  // 魔術師
    '2': { love: 75, career: 65, money: 60, health: 70, social: 70, growth: 85 },  // 女教皇
    '3': { love: 85, career: 70, money: 80, health: 75, social: 80, growth: 70 },  // 女帝
    '4': { love: 60, career: 90, money: 85, health: 70, social: 75, growth: 65 },  // 皇帝
    '5': { love: 65, career: 75, money: 70, health: 65, social: 80, growth: 75 },  // 教皇
    '6': { love: 95, career: 70, money: 65, health: 75, social: 85, growth: 75 },  // 恋人
    '7': { love: 70, career: 85, money: 75, health: 80, social: 70, growth: 80 },  // 戦車
    '8': { love: 75, career: 80, money: 70, health: 85, social: 75, growth: 85 },  // 力
    '9': { love: 60, career: 70, money: 65, health: 70, social: 55, growth: 90 },  // 隠者
    '10': { love: 75, career: 75, money: 80, health: 70, social: 75, growth: 70 }, // 運命の輪
    '11': { love: 70, career: 80, money: 75, health: 70, social: 75, growth: 75 }, // 正義
    '12': { love: 65, career: 60, money: 55, health: 65, social: 60, growth: 85 }, // 吊るされた男
    '13': { love: 60, career: 65, money: 60, health: 60, social: 65, growth: 80 }, // 死神
    '14': { love: 75, career: 75, money: 70, health: 80, social: 80, growth: 75 }, // 節制
    '15': { love: 55, career: 65, money: 70, health: 55, social: 60, growth: 60 }, // 悪魔
    '16': { love: 50, career: 55, money: 50, health: 60, social: 55, growth: 70 }, // 塔
    '17': { love: 80, career: 75, money: 70, health: 85, social: 80, growth: 85 }, // 星
    '18': { love: 70, career: 60, money: 60, health: 65, social: 65, growth: 75 }, // 月
    '19': { love: 90, career: 85, money: 85, health: 90, social: 90, growth: 85 }, // 太陽
    '20': { love: 75, career: 80, money: 75, health: 80, social: 75, growth: 85 }, // 審判
    '21': { love: 85, career: 90, money: 85, health: 85, social: 85, growth: 90 }  // 世界
  };

  // 3枚のカードの平均値を計算
  let parameters: DestinyParameters = {
    love: 0,
    career: 0,
    money: 0,
    health: 0,
    social: 0,
    growth: 0
  };

  cards.forEach(card => {
    const attrs = cardAttributes[card.id] || { love: 70, career: 70, money: 70, health: 70, social: 70, growth: 70 };
    
    // 逆位置の場合は値を調整
    const modifier = card.isReversed ? 0.7 : 1.0;
    
    parameters.love += attrs.love * modifier;
    parameters.career += attrs.career * modifier;
    parameters.money += attrs.money * modifier;
    parameters.health += attrs.health * modifier;
    parameters.social += attrs.social * modifier;
    parameters.growth += attrs.growth * modifier;
  });

  // 3枚の平均を取り、整数に丸める
  return {
    love: Math.round(parameters.love / 3),
    career: Math.round(parameters.career / 3),
    money: Math.round(parameters.money / 3),
    health: Math.round(parameters.health / 3),
    social: Math.round(parameters.social / 3),
    growth: Math.round(parameters.growth / 3)
  };
}