// src/lib/plans.ts
export type SubscriptionTier = 'free' | 'basic' | 'premium';

export interface PlanFeatures {
  tarot: { limit: number; period?: 'month' | 'day' };
  palm: { limit: number; period?: 'month' | 'day' };
  iching: { limit: number; period?: 'month' | 'day' };
  aiChat: { limit: number; period?: 'month' | 'day' };
  compatibility: { limit: number; period?: 'month' | 'day' };
  history: { days: number };
  ads: boolean;
  priority: boolean;
  pdfExport?: boolean;
  detailedAnalysis?: boolean;
  personalizedAI?: boolean;
}

export interface Plan {
  id: SubscriptionTier;
  name: string;
  nameEn: string;
  price: number;
  priceId?: string;
  description: string;
  features: PlanFeatures;
  highlights: string[];
  recommended?: boolean;
}

export const PLANS: Record<SubscriptionTier, Plan> = {
  free: {
    id: 'free',
    name: '無料プラン',
    nameEn: 'Free',
    price: 0,
    description: 'まずは気軽に試してみたい方におすすめ',
    features: {
      tarot: { limit: 3, period: 'month' },
      palm: { limit: 1, period: 'month' },
      iching: { limit: 2, period: 'month' },
      aiChat: { limit: 0, period: 'month' },
      compatibility: { limit: 1, period: 'month' },
      history: { days: 30 },
      ads: true,
      priority: false,
    },
    highlights: [
      'タロット占い 月3回',
      '手相占い 月1回',
      '易占い 月2回',
      '相性診断 月1回',
      '履歴30日間保存',
    ],
  },
  basic: {
    id: 'basic',
    name: 'ベーシックプラン',
    nameEn: 'Basic',
    price: 980,
    priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
    description: '定期的に占いを楽しみたい方に最適',
    features: {
      tarot: { limit: -1 }, // -1は無制限
      palm: { limit: 5, period: 'month' },
      iching: { limit: 10, period: 'month' },
      aiChat: { limit: 100, period: 'month' },
      compatibility: { limit: 10, period: 'month' },
      history: { days: 365 },
      ads: false,
      priority: false,
      pdfExport: true,
    },
    highlights: [
      'タロット占い 無制限',
      '手相占い 月5回',
      '易占い 月10回',
      'AIチャット 月100メッセージ',
      '相性診断 月10回',
      '広告なし',
      'PDFエクスポート',
      '履歴1年間保存',
    ],
  },
  premium: {
    id: 'premium',
    name: 'プレミアムプラン',
    nameEn: 'Premium',
    price: 2980,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    description: 'すべての機能を無制限で使いたい方へ',
    recommended: true,
    features: {
      tarot: { limit: -1 },
      palm: { limit: -1 },
      iching: { limit: -1 },
      aiChat: { limit: -1 },
      compatibility: { limit: -1 },
      history: { days: -1 },
      ads: false,
      priority: true,
      pdfExport: true,
      detailedAnalysis: true,
      personalizedAI: true,
    },
    highlights: [
      'すべての占い 無制限',
      'AIチャット 無制限',
      '相性診断 無制限',
      '広告なし',
      'PDFエクスポート',
      '詳細分析レポート',
      'パーソナライズAI',
      '優先サポート',
      '履歴無期限保存',
    ],
  },
};

// 使用制限チェック関数
export function canUseFeature(
  subscription: SubscriptionTier,
  feature: keyof PlanFeatures,
  usageThisMonth: number
): { allowed: boolean; remaining: number; limit: number } {
  const plan = PLANS[subscription];
  const featureLimit = plan.features[feature] as any;

  // 数値でないもの（広告設定など）は常にtrue
  if (typeof featureLimit !== 'object' || !('limit' in featureLimit)) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  const limit = featureLimit.limit;

  // 無制限の場合
  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  // 制限チェック
  const remaining = limit - usageThisMonth;
  const allowed = remaining > 0;

  return { allowed, remaining, limit };
}

// プラン比較用のデータ
export const PLAN_COMPARISON = [
  {
    feature: 'タロット占い',
    free: '月3回',
    basic: '無制限',
    premium: '無制限',
  },
  {
    feature: '手相占い',
    free: '月1回',
    basic: '月5回',
    premium: '無制限',
  },
  {
    feature: '易占い',
    free: '月2回',
    basic: '月10回',
    premium: '無制限',
  },
  {
    feature: 'AIチャット',
    free: '利用不可',
    basic: '月100回',
    premium: '無制限',
  },
  {
    feature: '相性診断',
    free: '月1回',
    basic: '月10回',
    premium: '無制限',
  },
  {
    feature: '履歴保存',
    free: '30日間',
    basic: '1年間',
    premium: '無期限',
  },
  {
    feature: '広告表示',
    free: 'あり',
    basic: 'なし',
    premium: 'なし',
  },
  {
    feature: 'PDFエクスポート',
    free: '-',
    basic: '○',
    premium: '○',
  },
  {
    feature: '詳細分析',
    free: '-',
    basic: '-',
    premium: '○',
  },
  {
    feature: '優先サポート',
    free: '-',
    basic: '-',
    premium: '○',
  },
];
