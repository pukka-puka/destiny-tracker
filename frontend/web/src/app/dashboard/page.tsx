'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { destinyService } from '@/lib/services/destiny.service';
import { DestinyReading, UserStats } from '@/types/destiny.types';
import ParameterCard from '@/components/dashboard/ParameterCard';
import RadarChart from '@/components/dashboard/RadarChart';
import HistoryChart from '@/components/dashboard/HistoryChart';
import DailyFortune from '@/components/dashboard/DailyFortune';
import StatsCard from '@/components/dashboard/StatsCard';
import { RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [todayReading, setTodayReading] = useState<DestinyReading | null>(null);
  const [readingHistory, setReadingHistory] = useState<DestinyReading[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [today, history, stats] = await Promise.all([
        destinyService.getTodayReading(user.uid),
        destinyService.getReadingHistory(user.uid, 30),
        destinyService.getUserStats(user.uid)
      ]);

      setTodayReading(today);
      setReadingHistory(history);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user) return;

    setRefreshing(true);
    try {
      // 日付を変更して新しい占いを生成（テスト用）
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - readingHistory.length);
      
      const parameters = destinyService.generateParameters(user.uid, testDate);
      const daily = destinyService.generateDailyFortune(user.uid);
      
      await destinyService.saveReading(user.uid, {
        parameters,
        daily,
        readingType: 'daily',
        createdAt: testDate // テスト用に異なる日付を設定
      });

      // データを再読み込み
      await loadDashboardData();
      
      // 成功メッセージ（オプション）
      console.log('新しい占い結果を生成しました');
    } catch (error) {
      console.error('Error refreshing:', error);
      alert('占いの生成に失敗しました');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">運命を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            運命ダッシュボード
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.displayName || user?.email}さんの運勢
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? '生成中...' : '新しい占い'}
        </button>
      </div>

      {/* デバッグ情報（開発時のみ表示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-4 rounded text-sm">
          <p>履歴件数: {readingHistory.length}件</p>
          <p>総占い回数: {userStats?.totalReadings || 0}回</p>
        </div>
      )}

      {/* 今日の運勢 */}
      {todayReading?.daily && (
        <DailyFortune fortune={todayReading.daily} />
      )}

      {/* パラメーターカード */}
      {todayReading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(todayReading.parameters).map(([key, value]) => (
            <ParameterCard
              key={key}
              parameter={key as keyof typeof todayReading.parameters}
              value={value}
            />
          ))}
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
            <StatsCard stats={userStats} />
          </div>
        )}
      </div>

      {/* 履歴グラフ */}
      {readingHistory.length > 1 && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">
            運勢の推移（{readingHistory.length}件）
          </h2>
          <HistoryChart readings={readingHistory} />
        </div>
      )}
    </div>
  );
}
