// types/destiny.types.ts

export interface DestinyParameters {
  love: number;        // 恋愛運 (0-100)
  money: number;       // 金運 (0-100)
  health: number;      // 健康運 (0-100)
  work: number;        // 仕事運 (0-100)
  social: number;      // 対人運 (0-100)
  overall: number;     // 総合運 (0-100)
}

export interface DailyFortune {
  message: string;
  luckyColor: string;
  luckyItem: string;
  luckyNumber: number;
  advice?: string;
}

export interface PalmReadingData {
  imageUrl: string;
  analysis: string;
  readingDate: Date;
}

export interface DestinyReading {
  id: string;
  userId: string;
  createdAt: Date;
  parameters: DestinyParameters;
  daily?: DailyFortune;
  palmReading?: PalmReadingData;
  readingType: 'daily' | 'palm' | 'special';
  notes?: string;
}

export interface UserStats {
  userId: string;
  totalReadings: number;
  averageScores: DestinyParameters;
  lastReadingDate: Date;
  streakDays: number;
  favoriteParameter?: keyof DestinyParameters;
  achievements?: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: Date;
  icon: string;
}

export interface ChartDataPoint {
  date: string;
  love: number;
  money: number;
  health: number;
  work: number;
  social: number;
  overall: number;
}

export const PARAMETER_LABELS: Record<keyof DestinyParameters, string> = {
  love: '恋愛運',
  money: '金運',
  health: '健康運',
  work: '仕事運',
  social: '対人運',
  overall: '総合運'
};

export const PARAMETER_COLORS: Record<keyof DestinyParameters, string> = {
  love: '#FF6B9D',
  money: '#FFD93D',
  health: '#6BCF7F',
  work: '#4E89E3',
  social: '#B565D8',
  overall: '#FF8C42'
};

export const LUCKY_COLORS = [
  { name: 'レッド', value: '#FF4444' },
  { name: 'ブルー', value: '#4E89E3' },
  { name: 'イエロー', value: '#FFD93D' },
  { name: 'グリーン', value: '#6BCF7F' },
  { name: 'パープル', value: '#B565D8' },
  { name: 'オレンジ', value: '#FF8C42' },
  { name: 'ピンク', value: '#FF6B9D' },
  { name: 'ホワイト', value: '#FFFFFF' },
  { name: 'ブラック', value: '#2C3E50' },
  { name: 'ゴールド', value: '#FFB700' }
];

export const LUCKY_ITEMS = [
  '四つ葉のクローバー',
  'クリスタル',
  '金のアクセサリー',
  '青い石',
  '赤い花',
  '香水',
  '手帳',
  '音楽プレーヤー',
  '本',
  'お守り',
  'キャンドル',
  '観葉植物',
  '時計',
  '鏡',
  'ペン'
];
