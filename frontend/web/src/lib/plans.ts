export interface Plan {
  id: 'free' | 'basic' | 'premium';
  name: string;
  price: number;
  stripePriceId?: string;
  features: string[];
  limits: {
    tarot: number | 'unlimited';
    palm: number | 'unlimited';
    chat: number | 'unlimited';
  };
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: 'free',
    name: '無料プラン',
    price: 0,
    features: [
      'タロット占い（月3回）',
      '手相占い（月1回）',
      'AIチャット（利用不可）',
      '履歴保存30日間'
    ],
    limits: {
      tarot: 3,
      palm: 1,
      chat: 0,
    }
  },
  basic: {
    id: 'basic',
    name: 'ベーシックプラン',
    price: 980,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
    features: [
      'タロット占い（無制限）',
      '手相占い（月5回）',
      'AIチャット（月100回）',
      '履歴保存1年間',
      '広告なし',
      'PDF出力'
    ],
    limits: {
      tarot: 'unlimited',
      palm: 5,
      chat: 100,
    }
  },
  premium: {
    id: 'premium',
    name: 'プレミアムプラン',
    price: 2980,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    features: [
      'すべての占い無制限',
      'AIチャット無制限',
      '履歴保存無期限',
      '広告なし',
      'PDF出力',
      '詳細分析機能',
      '優先サポート'
    ],
    limits: {
      tarot: 'unlimited',
      palm: 'unlimited',
      chat: 'unlimited',
    }
  }
};
