// src/components/auth/UserMenu.tsx

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  User as UserIcon, 
  LogOut, 
  Settings, 
  CreditCard, 
  History,
  ChevronDown,
  Sparkles,
  Crown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export const UserMenu: React.FC = () => {
  const { user, userProfile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // クリック外で閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user || !userProfile) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('サインアウトエラー:', error);
    }
  };

  const getSubscriptionBadge = () => {
    switch (userProfile.subscription) {
      case 'vip':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-bold rounded-full">
            <Crown className="w-3 h-3" />
            VIP
          </span>
        );
      case 'premium':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
            <Sparkles className="w-3 h-3" />
            Premium
          </span>
        );
      case 'basic':
        return (
          <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
            Basic
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-600 text-white text-xs font-bold rounded-full">
            Free
          </span>
        );
    }
  };

  return (
    <div ref={menuRef} className="relative">
      {/* トリガーボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-8 h-8 rounded-full border-2 border-purple-500"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
        )}
        <span className="text-white font-medium hidden md:block">
          {user.displayName || 'ユーザー'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-50">
          {/* ユーザー情報ヘッダー */}
          <div className="p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-gray-700">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-12 h-12 rounded-full border-2 border-purple-500"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                  <UserIcon className="w-7 h-7 text-white" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-white font-semibold">
                  {user.displayName || 'ユーザー'}
                </p>
                <p className="text-gray-400 text-sm truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              {getSubscriptionBadge()}
              <div className="flex items-center gap-1 text-yellow-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-bold">{userProfile.credits} クレジット</span>
              </div>
            </div>
          </div>

          {/* メニューアイテム */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/dashboard');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              <span>運命ダッシュボード</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/history');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <History className="w-5 h-5" />
              <span>占い履歴</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/subscription');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              <span>プラン変更</span>
              {userProfile.subscription === 'free' && (
                <span className="ml-auto text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full">
                  アップグレード
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/settings');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>設定</span>
            </button>

            <div className="border-t border-gray-700 my-2" />

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};