// components/dashboard/StatsCard.tsx

import { UserStats } from '@/types/destiny.types';
import { TrendingUp, Calendar, Flame, Target } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface StatsCardProps {
  stats: UserStats;
}

export default function StatsCard({ stats }: StatsCardProps) {
  return (
    <div className="space-y-4">
      {/* 占い回数 */}
      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-200 rounded-lg">
            <Target className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <p className="text-sm text-gray-600">総占い回数</p>
            <p className="text-2xl font-bold text-purple-700">
              {stats.totalReadings}回
            </p>
          </div>
        </div>
      </div>

      {/* 連続日数 */}
      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-200 rounded-lg">
            <Flame className="w-5 h-5 text-orange-700" />
          </div>
          <div>
            <p className="text-sm text-gray-600">連続占い日数</p>
            <p className="text-2xl font-bold text-orange-700">
              {stats.streakDays}日
            </p>
          </div>
        </div>
      </div>

      {/* 最終占い日 */}
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-200 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <p className="text-sm text-gray-600">最終占い</p>
            <p className="text-lg font-bold text-blue-700">
              {format(new Date(stats.lastReadingDate), 'M月d日', { locale: ja })}
            </p>
          </div>
        </div>
      </div>

      {/* 平均スコア */}
      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-200 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <p className="text-sm text-gray-600">総合運平均</p>
            <p className="text-2xl font-bold text-green-700">
              {stats.averageScores.overall}点
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
