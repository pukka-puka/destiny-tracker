// src/types/destiny.types.ts

export interface DestinyParameters {
  love: number;      // 恋愛運
  career: number;    // 仕事運
  money: number;     // 金運
  health: number;    // 健康運
  social: number;    // 対人運
  growth: number;    // 成長運
}

export interface DailyFortune {
  fortune: number;      // 総合運 (1-100)
  message: string;      // メッセージ
  luckyColor: string;   // ラッキーカラー
  luckyNumber: number;  // ラッキーナンバー
  luckyItem?: string;   // ラッキーアイテム（オプショナル）
  advice?: string;      // アドバイス（オプショナル）
}

// タロットカードのデータ
export interface TarotCard {
  id: string;
  name: string;
  nameJa: string;
  meaning: string;
  reversed?: boolean;
  keywords?: string[];
  description?: string;
}

// タロット占い結果
export interface TarotReadingData {
  cards: TarotCard[];
  interpretation: string;
  category: 'general' | 'love' | 'career' | 'money';
  spreadType: 'single' | 'three-card' | 'celtic-cross';
}

// 手相占い結果
export interface PalmReadingData {
  imageUrl: string;
  analysis: {
    summary: string;
    interpretation: string;
    lines: {
      lifeLine?: string;
      headLine?: string;
      heartLine?: string;
      fateLine?: string;
      sunLine?: string;
      marriageLine?: string;
    };
    parameters: DestinyParameters;
    advice: {
      strength: string[];
      opportunity: string[];
      caution: string[];
    };
    fortune: {
      overall: string;
      luckyColor: string;
      luckyNumber: string;
      luckyItem: string;
    };
  };
  analyzedAt: Date;
}

// 拡張された占い記録
export interface DestinyReading {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  readingType: 'daily-tarot' | 'palm' | 'special';
  parameters: DestinyParameters;
  daily?: DailyFortune;
  tarotReading?: TarotReadingData;
  palmReading?: PalmReadingData;
}

export interface UserStats {
  totalReadings: number;        // 総占い回数
  tarotReadings: number;        // タロット占い回数
  palmReadings: number;         // 手相占い回数
  currentStreak: number;        // 連続占い日数
  lastReadingDate: Date;        // 最後の占い日
  averageParameters: DestinyParameters;
  bestDay: {
    date: Date;
    overall: number;
  };
}

// パラメータの色定義
export const PARAMETER_COLORS: Record<keyof DestinyParameters, string> = {
  love: '#FF6B9D',    // ピンク
  career: '#4ECDC4',  // ターコイズ
  money: '#FFD93D',   // ゴールド
  health: '#95E77E',  // グリーン
  social: '#A8E6CF',  // ミント
  growth: '#C7B3FF'   // ラベンダー
};

// パラメータのラベル定義
export const PARAMETER_LABELS: Record<keyof DestinyParameters, string> = {
  love: '恋愛運',
  career: '仕事運',
  money: '金運',
  health: '健康運',
  social: '対人運',
  growth: '成長運'
};

// パラメータのアイコン定義（絵文字）
export const PARAMETER_ICONS: Record<keyof DestinyParameters, string> = {
  love: '❤️',
  career: '💼',
  money: '💰',
  health: '🏃',
  social: '👥',
  growth: '🌱'
};
