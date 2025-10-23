// src/app/pricing/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PLANS, PLAN_COMPARISON } from '@/lib/plans';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string | undefined, planId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (planId === 'free') {
      router.push('/dashboard');
      return;
    }

    if (!priceId) {
      alert('このプランは現在利用できません');
      return;
    }

    setLoading(planId);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Checkout URL not returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <Sparkles className="w-8 h-8" />;
      case 'basic':
        return <Zap className="w-8 h-8" />;
      case 'premium':
        return <Crown className="w-8 h-8" />;
      default:
        return <Sparkles className="w-8 h-8" />;
    }
  };

  const isCurrentPlan = (planId: string) => {
    return userProfile?.subscription === planId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 via-black to-black">
      {/* ヘッダー */}
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-white mb-4">
          あなたに最適なプランを選択
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          無料プランから始めて、いつでもアップグレード可能です
        </p>
      </div>

      {/* プランカード */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {Object.values(PLANS).map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border-2 transition-all hover:scale-105 ${
                plan.recommended
                  ? 'border-yellow-500 shadow-2xl shadow-yellow-500/20'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              {/* おすすめバッジ */}
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  おすすめ
                </div>
              )}

              {/* アイコン */}
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                  plan.id === 'free'
                    ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                    : plan.id === 'basic'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                    : 'bg-gradient-to-br from-yellow-500 to-orange-500'
                }`}
              >
                <div className="text-white">{getPlanIcon(plan.id)}</div>
              </div>

              {/* プラン名 */}
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

              {/* 価格 */}
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">
                    ¥{plan.price.toLocaleString()}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-400">/月</span>
                  )}
                </div>
              </div>

              {/* 機能リスト */}
              <div className="space-y-3 mb-8">
                {plan.highlights.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTAボタン */}
              <button
                onClick={() => handleSubscribe(plan.priceId, plan.id)}
                disabled={loading === plan.id || isCurrentPlan(plan.id)}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
                  isCurrentPlan(plan.id)
                    ? 'bg-gray-600 cursor-not-allowed'
                    : plan.recommended
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {loading === plan.id
                  ? '処理中...'
                  : isCurrentPlan(plan.id)
                  ? '現在のプラン'
                  : plan.price === 0
                  ? '無料で始める'
                  : 'アップグレード'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 機能比較表 */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          プラン機能比較
        </h2>
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-white font-semibold">
                    機能
                  </th>
                  <th className="px-6 py-4 text-center text-white font-semibold">
                    無料
                  </th>
                  <th className="px-6 py-4 text-center text-white font-semibold">
                    ベーシック
                  </th>
                  <th className="px-6 py-4 text-center text-white font-semibold bg-yellow-500/10">
                    プレミアム
                  </th>
                </tr>
              </thead>
              <tbody>
                {PLAN_COMPARISON.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="px-6 py-4 text-gray-300">{row.feature}</td>
                    <td className="px-6 py-4 text-center text-gray-400">
                      {row.free}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-400">
                      {row.basic}
                    </td>
                    <td className="px-6 py-4 text-center text-white bg-yellow-500/5">
                      {row.premium}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          よくある質問
        </h2>
        <div className="space-y-6">
          {[
            {
              q: 'いつでもプランを変更できますか?',
              a: 'はい、いつでも変更可能です。アップグレードは即座に適用され、ダウングレードは次の請求日から有効になります。',
            },
            {
              q: '支払い方法は何が使えますか?',
              a: 'クレジットカード（Visa、Mastercard、American Express、JCB）がご利用いただけます。',
            },
            {
              q: '無料プランでどのくらい使えますか?',
              a: 'タロット占いは月3回、手相占いは月1回、易占いは月2回ご利用いただけます。',
            },
            {
              q: 'キャンセル方法は?',
              a: 'プロフィールページからいつでもキャンセルできます。残りの期間は引き続きご利用いただけます。',
            },
          ].map((faq, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                {faq.q}
              </h3>
              <p className="text-gray-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
