// src/app/pricing/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PLANS } from '@/lib/plans';
import { Check, Sparkles, Zap, Crown, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string | undefined, planId: string) => {
    // 未ログインの場合はログインページへリダイレクト
    if (!user) {
      alert('プランを購入するにはログインが必要です');
      router.push('/'); // ホームに戻ってログインを促す
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
        
        {/* 未ログイン時の注意メッセージ */}
        {!user && (
          <div className="mt-8 max-w-md mx-auto bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
            <p className="text-blue-300 text-sm">
              💡 有料プランをご利用いただくには、まずログインが必要です
            </p>
          </div>
        )}
      </div>

      {/* プランカード */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {Object.values(PLANS).map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border-2 transition-all hover:scale-105 ${
                plan.recommended
                  ? 'border-purple-500 shadow-2xl shadow-purple-500/50'
                  : 'border-white/10'
              }`}
            >
              {/* おすすめバッジ */}
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  おすすめ
                </div>
              )}

              {/* 現在のプランバッジ */}
              {isCurrentPlan(plan.id) && (
                <div className="absolute -top-4 right-4 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                  現在のプラン
                </div>
              )}

              {/* アイコン */}
              <div className="flex justify-center mb-6">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    plan.id === 'free'
                      ? 'bg-gradient-to-br from-gray-500 to-gray-700'
                      : plan.id === 'basic'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                      : 'bg-gradient-to-br from-purple-500 to-pink-600'
                  }`}
                >
                  {getPlanIcon(plan.id)}
                </div>
              </div>

              {/* プラン名 */}
              <h3 className="text-3xl font-bold text-white text-center mb-2">
                {plan.name}
              </h3>

              {/* 価格 */}
              <div className="text-center mb-6">
                {plan.price === 0 ? (
                  <span className="text-4xl font-bold text-white">無料</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-white">
                      ¥{plan.price.toLocaleString()}
                    </span>
                    <span className="text-gray-400 ml-2">/月</span>
                  </>
                )}
              </div>

              {/* 説明 */}
              <p className="text-gray-400 text-center mb-8">{plan.description}</p>

              {/* 機能リスト */}
              <ul className="space-y-4 mb-8">
                {plan.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{highlight}</span>
                  </li>
                ))}
              </ul>

              {/* ボタン */}
              <button
                onClick={() => handleSubscribe(plan.priceId, plan.id)}
                disabled={loading === plan.id || isCurrentPlan(plan.id)}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                  isCurrentPlan(plan.id)
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : plan.recommended
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                } disabled:opacity-50`}
              >
                {loading === plan.id
                  ? '処理中...'
                  : isCurrentPlan(plan.id)
                  ? '現在のプラン'
                  : plan.price === 0
                  ? user ? '無料で始める' : 'ログインして始める'
                  : user ? 'プランを選択' : 'ログインして選択'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* プラン比較表 */}
      <div className="max-w-7xl mx-auto px-4 pb-24">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          詳細な機能比較
        </h2>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-white font-bold">機能</th>
                  <th className="px-6 py-4 text-center text-white font-bold">無料プラン</th>
                  <th className="px-6 py-4 text-center text-white font-bold">Basicプラン</th>
                  <th className="px-6 py-4 text-center text-white font-bold">Premiumプラン</th>
                </tr>
              </thead>
              <tbody>
                {/* 月額料金 */}
                <tr className="border-b border-white/10">
                  <td className="px-6 py-4 text-gray-300 font-medium">月額料金</td>
                  <td className="px-6 py-4 text-center text-white">¥0</td>
                  <td className="px-6 py-4 text-center text-white">¥980</td>
                  <td className="px-6 py-4 text-center text-white">¥2,980</td>
                </tr>

                {/* タロット占い */}
                <tr className="border-b border-white/10">
                  <td className="px-6 py-4 text-gray-300 font-medium">タロット占い</td>
                  <td className="px-6 py-4 text-center text-gray-400">累計3回</td>
                  <td className="px-6 py-4 text-center text-gray-300">月100回</td>
                  <td className="px-6 py-4 text-center text-green-400 font-bold">無制限</td>
                </tr>

                {/* 手相占い */}
                <tr className="border-b border-white/10">
                  <td className="px-6 py-4 text-gray-300 font-medium">手相占い</td>
                  <td className="px-6 py-4 text-center text-gray-400">累計1回</td>
                  <td className="px-6 py-4 text-center text-gray-300">月40回</td>
                  <td className="px-6 py-4 text-center text-green-400 font-bold">無制限</td>
                </tr>

                {/* 易占い */}
                <tr className="border-b border-white/10">
                  <td className="px-6 py-4 text-gray-300 font-medium">易占い</td>
                  <td className="px-6 py-4 text-center text-gray-400">累計2回</td>
                  <td className="px-6 py-4 text-center text-gray-300">月40回</td>
                  <td className="px-6 py-4 text-center text-green-400 font-bold">無制限</td>
                </tr>

                {/* AIチャット */}
                <tr className="border-b border-white/10">
                  <td className="px-6 py-4 text-gray-300 font-medium">AIチャット</td>
                  <td className="px-6 py-4 text-center text-gray-400">利用不可</td>
                  <td className="px-6 py-4 text-center text-gray-300">月100回</td>
                  <td className="px-6 py-4 text-center text-green-400 font-bold">無制限</td>
                </tr>

                {/* 相性診断 */}
                <tr className="border-b border-white/10">
                  <td className="px-6 py-4 text-gray-300 font-medium">相性診断</td>
                  <td className="px-6 py-4 text-center text-gray-400">累計1回</td>
                  <td className="px-6 py-4 text-center text-gray-300">月10回</td>
                  <td className="px-6 py-4 text-center text-green-400 font-bold">無制限</td>
                </tr>

                {/* 履歴保存 - 全プラン無期限 */}
                <tr className="border-b border-white/10">
                  <td className="px-6 py-4 text-gray-300 font-medium">履歴保存</td>
                  <td className="px-6 py-4 text-center text-white">無期限</td>
                  <td className="px-6 py-4 text-center text-white">無期限</td>
                  <td className="px-6 py-4 text-center text-white">無期限</td>
                </tr>

                {/* 広告表示 */}
                <tr className="border-b border-white/10">
                  <td className="px-6 py-4 text-gray-300 font-medium">広告表示</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-red-400">あり</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-400">なし</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-400">なし</span>
                  </td>
                </tr>

                {/* PDFエクスポート */}
                <tr className="border-b border-white/10">
                  <td className="px-6 py-4 text-gray-300 font-medium">PDFエクスポート</td>
                  <td className="px-6 py-4 text-center">
                    <X className="w-5 h-5 text-gray-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                </tr>

                {/* 詳細分析 */}
                <tr className="border-b border-white/10">
                  <td className="px-6 py-4 text-gray-300 font-medium">詳細分析</td>
                  <td className="px-6 py-4 text-center">
                    <X className="w-5 h-5 text-gray-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <X className="w-5 h-5 text-gray-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                </tr>

                {/* 優先サポート */}
                <tr>
                  <td className="px-6 py-4 text-gray-300 font-medium">優先サポート</td>
                  <td className="px-6 py-4 text-center">
                    <X className="w-5 h-5 text-gray-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <X className="w-5 h-5 text-gray-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-3">📝 プランについての注意事項</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• 無料プランの各機能の利用回数は「累計」です（リセットされません）</li>
            <li>• Basic/Premiumプランの各機能の利用回数は「月間」です（毎月1日にリセット）</li>
            <li>• すべてのプランで履歴は無期限で保存されます</li>
            <li>• 有料プランをご利用いただくには、ログインが必要です</li>
            <li>• いつでもプラン変更・キャンセルが可能です</li>
            <li>• キャンセルは次回更新日まで有効です</li>
          </ul>
        </div>
      </div>

      {/* よくある質問 */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          よくある質問
        </h2>

        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-bold mb-2">いつでもプランを変更できますか?</h3>
            <p className="text-gray-400">
              はい、いつでも変更可能です。アップグレードは即座に適用され、ダウングレードは次の請求日から適用されます。
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-bold mb-2">支払い方法は何が使えますか?</h3>
            <p className="text-gray-400">
              クレジットカード（Visa、Mastercard、American Express、JCB）がご利用いただけます。
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-bold mb-2">無料プランでどのくらい使えますか?</h3>
            <p className="text-gray-400">
              タロット占いは累計3回、手相占いは累計1回、易占いは累計2回、相性診断は累計1回ご利用いただけます。
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-bold mb-2">キャンセル方法は?</h3>
            <p className="text-gray-400">
              プロフィールページからいつでもキャンセルできます。残りの期間は引き続きご利用いただけます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
