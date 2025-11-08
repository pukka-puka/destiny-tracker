// src/lib/plans.ts
export type SubscriptionTier = 'free' | 'basic' | 'premium';

export interface PlanFeatures {
  tarot: { limit: number; period?: 'month' | 'day' | 'lifetime' };
  palm: { limit: number; period?: 'month' | 'day' | 'lifetime' };
  iching: { limit: number; period?: 'month' | 'day' | 'lifetime' };
  aiChat: { limit: number; period?: 'month' | 'day' | 'lifetime' };
  compatibility: { limit: number; period?: 'month' | 'day' | 'lifetime' };
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
      tarot: { limit: 3, period: 'lifetime' },
      palm: { limit: 1, period: 'lifetime' },
      iching: { limit: 2, period: 'lifetime' },
      aiChat: { limit: 0, period: 'lifetime' },
      compatibility: { limit: 1, period: 'lifetime' },
      history: { days: -1 },
      ads: true,
      priority: false,
    },
    highlights: [
      'タロット占い 累計3回',
      '手相占い 累計1回',
      '易占い 累計2回',
      '相性診断 累計1回',
      '履歴無期限保存',
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
      tarot: { limit: 100, period: 'month' },
      palm: { limit: 40, period: 'month' },
      iching: { limit: 40, period: 'month' },
      aiChat: { limit: 100, period: 'month' },
      compatibility: { limit: 10, period: 'month' },
      history: { days: -1 },
      ads: false,
      priority: false,
      pdfExport: true,
    },
    highlights: [
      'タロット占い 月100回',
      '手相占い 月40回',
      '易占い 月40回',
      'AIチャット 月100回',
      '相性診断 月10回',
      '広告なし',
      'PDFエクスポート',
      '履歴無期限保存',
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

// 使用制限チェック関数（lifetime対応版）
export function canUseFeature(
  subscription: SubscriptionTier,
  feature: keyof PlanFeatures,
  usageThisMonth: number,
  usageLifetime?: number
): { allowed: boolean; remaining: number; limit: number } {
  const plan = PLANS[subscription];
  const featureLimit = plan.features[feature] as any;

  if (typeof featureLimit !== 'object' || !('limit' in featureLimit)) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  const limit = featureLimit.limit;
  const period = featureLimit.period;

  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  // lifetime（累計）の場合
  if (period === 'lifetime' && usageLifetime !== undefined) {
    const allowed = usageLifetime < limit;
    const remaining = Math.max(0, limit - usageLifetime);
    return { allowed, remaining, limit };
  }

  // month（月間）の場合
  const allowed = usageThisMonth < limit;
  const remaining = Math.max(0, limit - usageThisMonth);

  return { allowed, remaining, limit };
}

// プラン比較用の定数
export const PLAN_COMPARISON = {
  features: [
    { name: 'タロット占い', free: '累計3回', basic: '月100回', premium: '無制限' },
    { name: '手相占い', free: '累計1回', basic: '月40回', premium: '無制限' },
    { name: '易占い', free: '累計2回', basic: '月40回', premium: '無制限' },
    { name: 'AIチャット', free: '利用不可', basic: '月100回', premium: '無制限' },
    { name: '相性診断', free: '累計1回', basic: '月10回', premium: '無制限' },
    { name: '履歴保存', free: '無期限', basic: '無期限', premium: '無期限' },
    { name: '広告表示', free: 'あり', basic: 'なし', premium: 'なし' },
    { name: 'PDFエクスポート', free: '-', basic: '○', premium: '○' },
    { name: '詳細分析', free: '-', basic: '-', premium: '○' },
    { name: '優先サポート', free: '-', basic: '-', premium: '○' },
  ],
};
