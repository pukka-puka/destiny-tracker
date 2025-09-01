// src/app/palm/page.tsx（シンプル版）
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function PalmPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (!user) {
    return <div>ログインが必要です</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>🎉 ログイン成功！</h1>
      <p>ようこそ、{user.email}さん</p>
      <p>UID: {user.uid}</p>
      <button onClick={handleLogout}>ログアウト</button>
      
      <div style={{ marginTop: '40px' }}>
        <h2>手相解析機能（開発中）</h2>
        <p>今後実装予定の機能です</p>
      </div>
    </div>
  );
}