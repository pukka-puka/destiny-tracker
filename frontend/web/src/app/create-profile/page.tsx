// src/app/create-profile/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function CreateProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const createProfile = async () => {
    if (!user) {
      setStatus('ユーザーがログインしていません');
      return;
    }

    setLoading(true);
    setStatus('プロファイル作成中...');

    try {
      const userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'ユーザー',
        photoURL: user.photoURL,
        subscription: 'free',
        credits: 10,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        destinyParameters: {
          love: 50,
          money: 50,
          health: 50,
          work: 50,
          social: 50,
          overall: 50
        }
      };

      // Firestoreにプロファイルを作成
      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      setStatus('success');
      
      // 2秒後にホームへリダイレクト
      setTimeout(() => {
        router.push('/');
        // ページをリロードして認証状態を更新
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error('Error creating profile:', error);
      setStatus(`error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <User className="w-8 h-8" />
              ユーザープロファイル作成
            </h1>
          </div>

          {/* コンテンツ */}
          <div className="p-6 space-y-6">
            {/* 現在のユーザー情報 */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-white mb-3">現在のログイン情報</h2>
              {user ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 min-w-[60px]">UID:</span>
                    <span className="text-gray-300 break-all font-mono text-xs">
                      {user.uid}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 min-w-[60px]">Email:</span>
                    <span className="text-gray-300">
                      {user.email}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 min-w-[60px]">名前:</span>
                    <span className="text-gray-300">
                      {user.displayName || '未設定'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-red-400">ログインしていません</p>
              )}
            </div>

            {/* 作成されるプロファイル内容 */}
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <h3 className="text-blue-400 font-semibold mb-2">作成される内容</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• サブスクリプション: Free</li>
                <li>• 初回クレジット: 10</li>
                <li>• 運勢パラメーター: 各50（初期値）</li>
              </ul>
            </div>

            {/* アクションボタン */}
            <button
              onClick={createProfile}
              disabled={!user || loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  プロファイル作成中...
                </span>
              ) : (
                'プロファイルを作成'
              )}
            </button>

            {/* ステータス表示 */}
            {status && (
              <div className={`p-4 rounded-lg ${
                status === 'success' ? 'bg-green-900/50 border border-green-700/50' : 
                status.startsWith('error') ? 'bg-red-900/50 border border-red-700/50' : 
                'bg-blue-900/50 border border-blue-700/50'
              }`}>
                {status === 'success' ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>プロファイル作成成功！ホームへ戻ります...</span>
                  </div>
                ) : status.startsWith('error') ? (
                  <div className="flex items-start gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="break-all">{status.replace('error: ', '')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-blue-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{status}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* フッター注意事項 */}
          <div className="px-6 pb-6">
            <div className="p-3 bg-yellow-900/20 border border-yellow-600/50 rounded-lg">
              <p className="text-yellow-400 text-xs">
                ⚠️ 既存のプロファイルがある場合は上書きされます
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}