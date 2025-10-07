// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserStatistics, getLatestReadings } from '@/lib/services/destiny.service';
import { DestinyReading, UserStats } from '@/types/destiny.types';
import ParameterCard from '@/components/dashboard/ParameterCard';
import RadarChart from '@/components/dashboard/RadarChart';
import HistoryChart from '@/components/dashboard/HistoryChart';
import DailyFortune from '@/components/dashboard/DailyFortune';
import StatsCard from '@/components/dashboard/StatsCard';
import { Sparkles, Camera, Calendar, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [todayReading, setTodayReading] = useState<DestinyReading | null>(null);
  const [lastPalmReading, setLastPalmReading] = useState<DestinyReading | null>(null);
  const [readingHistory, setReadingHistory] = useState<DestinyReading[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [canReadTarotToday, setCanReadTarotToday] = useState(true);
  const [canReadPalmThisMonth, setCanReadPalmThisMonth] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [history, stats] = await Promise.all([
        getLatestReadings(user.uid, undefined, 30),
        getUserStatistics(user.uid)
      ]);

      // 今日のタロット占いを確認
      const todayTarot = history.find((r: DestinyReading) => {
        const readingDate = new Date(r.createdAt);
        const today = new Date();
        return r.readingType === 'daily-tarot' &&
               readingDate.toDateString() === today.toDateString();
      });

      // 最新の手相占いを取得
      const palmReading = history.find((r: DestinyReading) => r.readingType === 'palm');

      // 今月の手相占いがあるか確認
      const thisMonth = new Date();
      const hasPalmThisMonth = history.some((r: DestinyReading) => {
        const readingDate = new Date(r.createdAt);
        return r.readingType === 'palm' &&
               readingDate.getMonth() === thisMonth.getMonth() &&
               readingDate.getFullYear() === thisMonth.getFullYear();
      });

      // 最新の占い結果を設定（今日のタロットまたは最新の占い）
      setTodayReading(todayTarot || history[0] || null);
      setLastPalmReading(palmReading || null);
      setReadingHistory(history);
      setUserStats(stats);
      setCanReadTarotToday(!todayTarot);
      setCanReadPalmThisMonth(!hasPalmThisMonth);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTarotReading = () => {
    router.push('/tarot');
  };

  const handlePalmReading = () => {
    router.push('/palm');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">ログインしてください</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            ログインページへ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">ダッシュボード</h1>
          <p>あなたの運勢と成長の記録</p>
        </div>

        {/* アクションカード */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* タロット占い */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <div>
                <h2 className="text-lg font-semibold">今日のタロット占い</h2>
                <p className="text-sm text-gray-600">AI が導く運命のメッセージ</p>
              </div>
            </div>
            
            {canReadTarotToday ? (
              <button
                onClick={handleTarotReading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition"
              >
                占いを始める
              </button>
            ) : (
              <div className="text-center py-3 bg-gray-100 rounded-lg">
                <p className="text-gray-600">本日の占い済み ✨</p>
                <p className="text-xs text-gray-400 mt-1">明日また占えます</p>
              </div>
            )}

            {todayReading?.tarotReading && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-700 line-clamp-2">
                  {todayReading.tarotReading.interpretation}
                </p>
              </div>
            )}
          </div>

          {/* 手相占い */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Camera className="w-8 h-8 text-indigo-600" />
              <div>
                <h2 className="text-lg font-semibold">AI手相占い</h2>
                <p className="text-sm text-gray-600">月1回の詳細診断</p>
              </div>
            </div>
            
            {canReadPalmThisMonth ? (
              <button
                onClick={handlePalmReading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition"
              >
                手相で占う
              </button>
            ) : (
              <div className="text-center py-3 bg-gray-100 rounded-lg">
                <p className="text-gray-600">今月の占い済み 🖐️</p>
                <p className="text-xs text-gray-400 mt-1">来月また占えます</p>
              </div>
            )}

            {lastPalmReading?.palmReading && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  {lastPalmReading.palmReading.analysis?.summary || '手相診断結果があります'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 今日の運勢 */}
        {todayReading?.daily && (
          <DailyFortune fortune={todayReading.daily} />
        )}

        {/* パラメーターカード */}
        {todayReading && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              今日のパラメーター
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(todayReading.parameters).map(([key, value]) => (
                <ParameterCard
                  key={key}
                  parameter={key as keyof typeof todayReading.parameters}
                  value={value}
                />
              ))}
            </div>
          </div>
        )}

        {/* チャートセクション */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* レーダーチャート */}
          {todayReading && (
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">運勢バランス</h2>
              <RadarChart data={todayReading.parameters} />
            </div>
          )}

          {/* 統計カード */}
          {userStats && (
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">統計情報</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">総占い回数</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {userStats.totalReadings}回
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-600">タロット</p>
                    <p className="text-lg font-semibold text-purple-600">
                      {userStats.tarotReadings || 0}回
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <p className="text-xs text-gray-600">手相</p>
                    <p className="text-lg font-semibold text-indigo-600">
                      {userStats.palmReadings || 0}回
                    </p>
                  </div>
                </div>
                
                {userStats.currentStreak > 0 && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-gray-600">連続日数</p>
                    <p className="text-lg font-semibold text-yellow-600">
                      {userStats.currentStreak}日 🔥
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 履歴チャート */}
        {readingHistory.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">運勢の推移</h2>
            <HistoryChart readings={readingHistory} />
          </div>
        )}
      </div>
    </div>
  );
}