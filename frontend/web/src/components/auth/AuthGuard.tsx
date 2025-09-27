// src/components/auth/AuthGuard.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginModal } from '@/components/auth/LoginModal';
import { Loader2, Lock } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireSubscription?: 'basic' | 'premium' | 'vip';
  fallback?: 'redirect' | 'modal';
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireSubscription,
  fallback = 'modal' 
}) => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      if (fallback === 'redirect') {
        router.push('/');
      } else {
        setShowLoginModal(true);
      }
    }
  }, [user, loading, fallback, router]);

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未ログイン
  if (!user) {
    if (fallback === 'modal') {
      return (
        <>
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                ログインが必要です
              </h2>
              <p className="text-gray-400 mb-6">
                この機能を利用するにはログインしてください。
                無料で始められます。
              </p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
              >
                ログイン / 新規登録
              </button>
            </div>
          </div>
          <LoginModal 
            isOpen={showLoginModal} 
            onClose={() => {
              setShowLoginModal(false);
              router.push('/');
            }} 
          />
        </>
      );
    }
    return null;
  }

  // サブスクリプションチェック
  if (requireSubscription && userProfile) {
    const subscriptionLevels = {
      free: 0,
      basic: 1,
      premium: 2,
      vip: 3
    };

    const userLevel = subscriptionLevels[userProfile.subscription as keyof typeof subscriptionLevels];
    const requiredLevel = subscriptionLevels[requireSubscription as keyof typeof subscriptionLevels];

    if (userLevel < requiredLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              プランのアップグレードが必要です
            </h2>
            <p className="text-gray-400 mb-6">
              この機能は{requireSubscription.toUpperCase()}プラン以上で利用可能です。
              プランをアップグレードして、すべての機能をお楽しみください。
            </p>
            <button
              onClick={() => router.push('/subscription')}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold rounded-lg hover:from-yellow-600 hover:to-amber-600 transition-all transform hover:scale-105"
            >
              プランを見る
            </button>
          </div>
        </div>
      );
    }
  }

  // 認証済みでアクセス権がある
  return <>{children}</>;
};