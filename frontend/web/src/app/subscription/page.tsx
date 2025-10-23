// src/app/subscription/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { PLANS } from '@/lib/plans';
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Crown,
  ArrowRight,
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: Date;
}

export default function SubscriptionPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadPayments();
  }, [user, router]);

  const loadPayments = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'payments'),
        where('userId', '==', user.uid),
        orderBy('paidAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const paymentData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        paidAt: doc.data().paidAt.toDate(),
      })) as Payment[];

      setPayments(paymentData);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('本当にサブスクリプションをキャンセルしますか？\n残りの期間は引き続きご利用いただけます。')) {
      return;
    }

    setCancelling(true);

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.uid,
        }),
      });

      if (response.ok) {
        alert('サブスクリプションがキャンセルされました。期間終了後、無料プランに切り替わります。');
        window.location.reload();
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('キャンセル処理に失敗しました。もう一度お試しください。');
    } finally {
      setCancelling(false);
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900/20 via-black to-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  const currentPlan = PLANS[userProfile.subscription as keyof typeof PLANS];
  const isPaidPlan = userProfile.subscription !== 'free';
  const isActive = userProfile.subscriptionStatus === 'active';
  const isCancelled = userProfile.subscriptionCancelAtPeriodEnd;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 via-black to-black">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* ヘッダー */}
        <h1 className="text-4xl font-bold text-white mb-2">サブスクリプション管理</h1>
        <p className="text-gray-400 mb-12">
          あなたのプラン情報と支払い履歴を確認できます
        </p>

        {/* 現在のプラン */}
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                userProfile.subscription === 'premium'
                  ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                  : userProfile.subscription === 'basic'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                  : 'bg-gradient-to-br from-purple-500 to-purple-700'
              }`}>
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {currentPlan.name}
                </h2>
                <p className="text-gray-300">
                  {currentPlan.price > 0 ? `¥${currentPlan.price.toLocaleString()}/月` : '無料'}
                </p>
              </div>
            </div>

            {isPaidPlan && isActive && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-300 font-semibold">有効</span>
              </div>
            )}
            {isCancelled && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-300 font-semibold">キャンセル予定</span>
              </div>
            )}
          </div>

          {/* 期間情報 */}
          {isPaidPlan && userProfile.subscriptionCurrentPeriodEnd && (
            <div className="flex items-center gap-2 text-gray-300 mb-6">
              <Calendar className="w-5 h-5" />
              <span>
                次回更新日: {new Date(userProfile.subscriptionCurrentPeriodEnd).toLocaleDateString('ja-JP')}
              </span>
            </div>
          )}

          {/* 機能リスト */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {currentPlan.highlights.slice(0, 6).map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* アクション */}
          <div className="flex gap-4">
            {userProfile.subscription === 'free' && (
              <button
                onClick={() => router.push('/pricing')}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
              >
                アップグレード
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            {isPaidPlan && !isCancelled && (
              <>
                <button
                  onClick={() => router.push('/pricing')}
                  className="flex-1 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
                >
                  プラン変更
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="flex-1 py-3 bg-red-500/20 border border-red-500/50 text-red-300 font-bold rounded-xl hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      処理中...
                    </span>
                  ) : (
                    'キャンセル'
                  )}
                </button>
              </>
            )}
          </div>

          {/* キャンセル予定の警告 */}
          {isCancelled && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-300 font-semibold mb-1">
                    キャンセル予定
                  </p>
                  <p className="text-gray-300 text-sm">
                    {userProfile.subscriptionCurrentPeriodEnd && 
                      `${new Date(userProfile.subscriptionCurrentPeriodEnd).toLocaleDateString('ja-JP')}まで現在のプランをご利用いただけます。その後、無料プランに切り替わります。`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 支払い履歴 */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            支払い履歴
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">支払い履歴がありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      payment.status === 'succeeded'
                        ? 'bg-green-500/20'
                        : 'bg-red-500/20'
                    }`}>
                      {payment.status === 'succeeded' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        ¥{payment.amount.toLocaleString()}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {payment.paidAt.toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    payment.status === 'succeeded'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {payment.status === 'succeeded' ? '成功' : '失敗'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
