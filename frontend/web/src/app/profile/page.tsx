// src/app/profile/page.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Settings, 
  Mail, 
  Calendar, 
  Award,
  LogOut,
  Camera,
  Save,
  Loader2
} from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserStats {
  totalReadings: number;
  tarotReadings: number;
  palmReadings: number;
  currentStreak: number;
}

export default function ProfilePage() {
  const { user, userProfile, signOut, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [stats, setStats] = useState<UserStats>({
    totalReadings: 0,
    tarotReadings: 0,
    palmReadings: 0,
    currentStreak: 0
  });

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    setDisplayName(user.displayName || '');
    setPhotoURL(user.photoURL || '');
    
    // 統計情報を取得
    fetchUserStats();
  }, [user, router]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      const readingsRef = collection(db, 'readings');
      const q = query(readingsRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      const readings = snapshot.docs.map(doc => doc.data());
      const tarotCount = readings.filter(r => r.readingType === 'tarot').length;
      const palmCount = readings.filter(r => r.readingType === 'palm').length;

      setStats({
        totalReadings: readings.length,
        tarotReadings: tarotCount,
        palmReadings: palmCount,
        currentStreak: 0 // TODO: 連続日数の計算ロジックを実装
      });
    } catch (error) {
      console.error('統計取得エラー:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateProfile(user, {
        displayName,
        photoURL
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName,
        photoURL,
        updatedAt: new Date()
      });

      await refreshUserProfile();
      setIsEditing(false);
      alert('プロフィールを更新しました');
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      alert('更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      await signOut();
      router.push('/');
    }
  };

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const displayStats = [
    { label: 'タロット占い', value: stats.tarotReadings, icon: '🔮' },
    { label: '手相占い', value: stats.palmReadings, icon: '✋' },
    { label: '総占い回数', value: stats.totalReadings, icon: '⭐' },
    { label: '連続日数', value: stats.currentStreak, icon: '🔥' }
  ];

  // createdAtの型安全な処理
  const createdAtDate = userProfile.createdAt 
    ? (typeof userProfile.createdAt === 'object' && 'seconds' in userProfile.createdAt
        ? new Date(userProfile.createdAt.seconds * 1000)
        : new Date(userProfile.createdAt))
    : new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-white/80 hover:text-white mb-4 flex items-center gap-2"
          >
            ← ダッシュボードに戻る
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">
            プロフィール
          </h1>
          <p className="text-white/70">
            あなたの占い履歴とアカウント情報
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-6">
          <div className="flex items-start gap-6 mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center overflow-hidden">
                {photoURL ? (
                  <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              )}
            </div>

            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">表示名</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">プロフィール画像URL</label>
                    <input
                      type="text"
                      value={photoURL}
                      onChange={(e) => setPhotoURL(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setDisplayName(user.displayName || '');
                        setPhotoURL(user.photoURL || '');
                      }}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {user.displayName || '名無しの占い師'}
                  </h2>
                  <div className="flex items-center gap-2 text-white/70 mb-4">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 mb-4">
                    <Calendar className="w-4 h-4" />
                    <span>登録日: {createdAtDate.toLocaleDateString('ja-JP')}</span>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                  >
                    <Settings className="w-4 h-4" />
                    編集
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayStats.map((stat, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-white/70 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-6 h-6" />
            サブスクリプション
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-lg font-semibold mb-1">
                {userProfile.subscription === 'free' ? '無料プラン' :
                 userProfile.subscription === 'basic' ? 'ベーシックプラン' :
                 userProfile.subscription === 'premium' ? 'プレミアムプラン' :
                 'VIPプラン'}
              </div>
              <div className="text-white/70 text-sm">
                {userProfile.subscription === 'free' ? 
                  'タロット: 月3回 / 手相: 月1回' :
                  'すべての機能を利用可能'}
              </div>
            </div>
            {userProfile.subscription === 'free' && (
              <button
                onClick={() => router.push('/pricing')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700"
              >
                アップグレード
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl hover:bg-red-500/30"
          >
            <LogOut className="w-5 h-5" />
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}