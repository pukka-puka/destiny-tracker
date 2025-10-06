// components/dashboard/DailyFortune.tsx

import { DailyFortune as DailyFortuneType } from '@/types/destiny.types';
import { Sparkles, Palette, Gift, Hash } from 'lucide-react';

interface DailyFortuneProps {
  fortune: DailyFortuneType;
}

export default function DailyFortune({ fortune }: DailyFortuneProps) {
  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-6 h-6" />
        <h2 className="text-2xl font-bold">今日の運勢</h2>
      </div>
      
      <p className="text-lg mb-6 leading-relaxed">
        {fortune.message}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ラッキーカラー */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-4 h-4" />
            <span className="text-sm font-medium">ラッキーカラー</span>
          </div>
          <p className="text-xl font-bold">{fortune.luckyColor}</p>
        </div>
        
        {/* ラッキーアイテム */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-4 h-4" />
            <span className="text-sm font-medium">ラッキーアイテム</span>
          </div>
          <p className="text-xl font-bold">{fortune.luckyItem}</p>
        </div>
        
        {/* ラッキーナンバー */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-4 h-4" />
            <span className="text-sm font-medium">ラッキーナンバー</span>
          </div>
          <p className="text-3xl font-bold">{fortune.luckyNumber}</p>
        </div>
      </div>
      
      {fortune.advice && (
        <div className="mt-4 pt-4 border-t border-white/30">
          <p className="text-sm opacity-90">
            💡 アドバイス: {fortune.advice}
          </p>
        </div>
      )}
    </div>
  );
}
