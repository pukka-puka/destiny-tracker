// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Sparkles, TrendingUp, Calendar, Heart, Briefcase, 
  DollarSign, Activity, Users, LineChart as LineChartIcon,
  BookOpen, MessageCircle, History, User as UserIcon
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { PLANS } from '@/lib/plans';

interface Reading {
  id: string;
  userId: string;
  type: string;
  category: string;
  interpretation: string;
  cards?: any[];
  parameters?: {
    love: number;
    career: number;
    money: number;
    health: number;
    social: number;
    growth: number;
  };
  createdAt: any;
}

interface UserProfile {
  subscription: 'free' | 'basic' | 'premium';
  readingCount?: number;
  palmReadingCount?: number;
  chatConsultCount?: number;
  compatibilityCount?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [latestReading, setLatestReading] = useState<Reading | null>(null);
  const [readingHistory, setReadingHistory] = useState<Reading[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const defaultParameters = {
    love: 70,
    career: 70,
    money: 70,
    health: 70,
    social: 70,
    growth: 70
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('認証済みユーザー:', user.uid);
        setAuthReady(true);
        await loadUserProfile(user.uid);
        await loadDashboardData(user.uid);
      } else {
        console.log('未認証 - ログインページへ');
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadUserProfile = async (userId: string) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const data = userDocSnap.data() as UserProfile;
        setUserProfile(data);
        console.log('ユーザープロファイル:', data);
      } else {
        console.log('ユーザープロファイルが見つかりません');
        // デフォルト値を設定
        setUserProfile({ subscription: 'free' });
      }
    } catch (error) {
      console.error('ユーザープロファイル読み込みエラー:', error);
      setUserProfile({ subscription: 'free' });
    }
  };

  const loadDashboardData = async (userId: string) => {
    try {
      setLoading(true);

      const readingsRef = collection(db, 'readings');
      const q = query(
        readingsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const readings: Reading[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        readings.push({
          id: doc.id,
          ...data
        } as Reading);
      });

      console.log('取得した占い履歴:', readings);

      if (readings.length > 0) {
        const latest = readings[0];
        if (!latest.parameters) {
          latest.parameters = defaultParameters;
        }
        setLatestReading(latest);
        setReadingHistory(readings);
      } else {
        const localHistory = localStorage.getItem('tarot-history');
        if (localHistory) {
          const parsed = JSON.parse(localHistory);
          if (parsed.length > 0) {
            const latest = parsed[0];
            if (!latest.parameters) {
              latest.parameters = defaultParameters;
            }
            setLatestReading(latest);
            setReadingHistory(parsed);
          }
        }
      }
    } catch (error) {
      console.error('ダッシュボードデータ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryLabels: { [key: string]: string } = {
    general: '総合運',
    love: '恋愛運',
    career: '仕事運',
    money: '金運'
  };

  const parameterIcons: { [key: string]: any } = {
    love: Heart,
    career: Briefcase,
    money: DollarSign,
    health: Activity,
    social: Users,
    growth: TrendingUp
  };

  const parameterLabels: { [key: string]: string } = {
    love: '恋愛運',
    career: '仕事運',
    money: '金運',
    health: '健康運',
    social: '対人運',
    growth: '成長運'
  };

  const parameterColors: { [key: string]: string } = {
    love: '#ec4899',
    career: '#3b82f6',
    money: '#eab308',
    health: '#22c55e',
    social: '#a855f7',
    growth: '#f97316'
  };

  // グラフ用データの作成
  const chartData = readingHistory.map((reading, index) => {
    const date = reading.createdAt?.seconds 
      ? new Date(reading.createdAt.seconds * 1000)
      : new Date(reading.createdAt);
    
    return {
      date: date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
      ...reading.parameters
    };
  }).reverse();

  // 新機能カード
  const newFeatures = [
    {
      title: 'AI相談',
      description: 'AIキャラと悩み相談',
      icon: MessageCircle,
      path: '/chat',
      color: 'from-blue-500 to-cyan-500',
      badge: 'NEW'
    },
    {
      title: '易占い',
      description: '古代の知恵で未来を占う',
      icon: BookOpen,
      path: '/iching',
      color: 'from-green-500 to-emerald-500',
      badge: 'NEW'
    },
    {
      title: '相性占い',
      description: '二人の相性を診断',
      icon: Heart,
      path: '/compatibility',
      color: 'from-pink-500 to-rose-500'
    },
    {
      title: '占い履歴',
      description: 'これまでの占い結果',
      icon: History,
      path: '/history',
      color: 'from-purple-500 to-violet-500'
    }
  ];

  if (loading || !authReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!latestReading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 pt-6 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                ダッシュボード
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-gray-600">あなたの運勢と成長の記録</p>
                {userProfile && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm font-semibold text-purple-600">
                      {PLANS[userProfile.subscription].name}
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => router.push('/profile')}
              className="p-3 rounded-full bg-white shadow-md hover:shadow-lg transition"
            >
              <UserIcon className="w-6 h-6 text-purple-600" />
            </button>
          </div>

          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              まだ占い結果がありません
            </h2>
            <p className="text-gray-600 mb-8">
              最初の占いを始めて、あなたの運勢を確認しましょう
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/tarot')}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition"
              >
                タロット占いを始める
              </button>
              <button
                onClick={() => router.push('/palm')}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-semibold hover:from-blue-600 hover:to-cyan-600 transition"
              >
                手相占いを始める
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const parameters = latestReading.parameters || defaultParameters;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* ヘッダー */}
        <div className="mb-8 pt-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
              ダッシュボード
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-gray-600">あなたの運勢と成長の記録</p>
              {userProfile && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm font-semibold text-purple-600">
                    {PLANS[userProfile.subscription].name}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="p-3 rounded-full bg-white shadow-md hover:shadow-lg transition"
          >
            <UserIcon className="w-6 h-6 text-purple-600" />
          </button>
        </div>

        {/* 最新の占い結果 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                最新の占い結果
              </h2>
              <p className="text-gray-600">
                {categoryLabels[latestReading.category || 'general']} - {new Date(latestReading.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('ja-JP')}
              </p>
            </div>
            <Sparkles className="w-8 h-8 text-yellow-500" />
          </div>

          {/* 運勢パラメーター */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(parameters).map(([key, value]) => {
              const Icon = parameterIcons[key];
              const color = parameterColors[key];
              const label = parameterLabels[key];

              return (
                <div key={key} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {Icon && <Icon className="w-5 h-5" style={{ color }} />}
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${value}%`,
                        backgroundColor: color
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold" style={{ color }}>
                      {value}
                    </span>
                    <span className="text-xs text-gray-500">
                      {value >= 80 ? '絶好調' : value >= 60 ? '好調' : value >= 40 ? '普通' : '要注意'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 解釈プレビュー */}
          {latestReading.interpretation && (
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-gray-700 line-clamp-3">
                {latestReading.interpretation}
              </p>
            </div>
          )}
        </div>

        {/* 運勢の推移グラフ */}
        {readingHistory.length > 1 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <div className="flex items-center gap-2 mb-6">
              <LineChartIcon className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-800">運勢の推移</h2>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <Tooltip 
                  formatter={(value: number) => `${value}点`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="love" stroke={parameterColors.love} strokeWidth={2} name="恋愛運" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="career" stroke={parameterColors.career} strokeWidth={2} name="仕事運" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="money" stroke={parameterColors.money} strokeWidth={2} name="金運" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="health" stroke={parameterColors.health} strokeWidth={2} name="健康運" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="social" stroke={parameterColors.social} strokeWidth={2} name="対人運" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="growth" stroke={parameterColors.growth} strokeWidth={2} name="成長運" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 新機能セクション */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            新しい占いメニュー
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {newFeatures.map((feature, index) => (
              <button
                key={index}
                onClick={() => router.push(feature.path)}
                className={`relative bg-gradient-to-br ${feature.color} rounded-xl p-6 text-white text-left hover:scale-105 transition-all group`}
              >
                {feature.badge && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                    {feature.badge}
                  </div>
                )}
                <feature.icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold mb-1">{feature.title}</h3>
                <p className="text-sm text-white/80">{feature.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => router.push('/tarot')}
            className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all group"
          >
            <Sparkles className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-2">今日のタロット占い</h3>
            <p className="text-purple-100">AIが導く運命のメッセージ</p>
          </button>

          <button
            onClick={() => router.push('/palm')}
            className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all group"
          >
            <Activity className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-2">AI手相占い</h3>
            <p className="text-blue-100">手のひらから運命を読み解く</p>
          </button>
        </div>

        {/* 占い履歴 */}
        {readingHistory.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              占い履歴
            </h2>
            <div className="space-y-4">
              {readingHistory.slice(0, 5).map((reading) => (
                <div
                  key={reading.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {categoryLabels[reading.category || 'general']}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(reading.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {reading.parameters && (
                      <span className="text-2xl font-bold text-purple-600">
                        {Math.round(Object.values(reading.parameters).reduce((a, b) => a + b, 0) / 6)}
                      </span>
                    )}
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
