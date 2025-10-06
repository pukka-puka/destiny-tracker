// src/app/test-auth/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function TestAuthPage() {
  const [status, setStatus] = useState<string>('Checking...');
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    console.log('TestAuth: Starting auth check...');
    
    try {
      // Firebaseの認証状態を直接チェック
      const unsubscribe = onAuthStateChanged(auth, 
        (user) => {
          console.log('TestAuth: Auth state changed:', user);
          if (user) {
            setStatus('Logged in');
            setUser(user);
          } else {
            setStatus('Not logged in');
            setUser(null);
          }
        },
        (error) => {
          console.error('TestAuth: Auth error:', error);
          setError(error.message);
          setStatus('Error');
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('TestAuth: Setup error:', err);
      setError(err.message || 'Unknown error');
      setStatus('Setup failed');
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">認証テストページ</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-bold mb-2">ステータス</h2>
          <p className={`text-lg ${status === 'Logged in' ? 'text-green-400' : status === 'Error' ? 'text-red-400' : 'text-yellow-400'}`}>
            {status}
          </p>
        </div>

        {error && (
          <div className="bg-red-900 p-4 rounded">
            <h2 className="text-xl font-bold mb-2">エラー</h2>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {user && (
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-bold mb-2">ユーザー情報</h2>
            <p>UID: {user.uid}</p>
            <p>Email: {user.email || 'なし'}</p>
          </div>
        )}

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-bold mb-2">Firebase設定</h2>
          <p className="text-sm text-gray-400">
            Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set'}
          </p>
          <p className="text-sm text-gray-400">
            Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'Not set'}
          </p>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-bold mb-2">デバッグ情報</h2>
          <p className="text-sm text-gray-400">
            このページは Firebase の認証状態を直接チェックします。
            コンソールログも確認してください（F12）。
          </p>
        </div>
      </div>
    </div>
  );
}