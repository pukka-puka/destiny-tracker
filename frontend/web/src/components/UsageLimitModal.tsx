// src/components/UsageLimitModal.tsx
'use client';

import { useRouter } from 'next/navigation';
import { XCircle, Crown, TrendingUp } from 'lucide-react';

interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  limit?: number;  // ← オプショナルに変更
  resetDate?: Date;
  currentPlan?: string;
}

export default function UsageLimitModal({
  isOpen,
  onClose,
  featureName,
  limit,
  resetDate,
  currentPlan = 'free'
}: UsageLimitModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const resetDateStr = resetDate
    ? new Date(resetDate).toLocaleDateString('ja-JP', { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric' 
      })
    : '来月1日';

  const handleUpgrade = () => {
    router.push('/pricing');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-gradient-to-br from-purple-900/95 via-black to-black border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* ヘッダー */}
        <div className="relative p-8 pb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>

          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-white mb-2">
            今月の利用上限に達しました
          </h2>
          
          <p className="text-center text-gray-300 text-sm">
            {featureName}の月間利用回数{limit ? `（${limit}回）` : ''}を使い切りました
          </p>
        </div>

        {/* 本文 */}
        <div className="px-8 pb-8 space-y-6">
          
          {/* リセット日 */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <p className="text-sm text-gray-400 mb-1">次回リセット日</p>
            <p className="text-lg font-bold text-white">{resetDateStr}</p>
          </div>

          {/* アップグレード提案 */}
          <div className="space-y-3">
            <p className="text-white font-medium text-center">
              今すぐ続けたい方へ 🌟
            </p>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-4 border border-purple-500/30">
              <div className="flex items-start gap-3 mb-3">
                <Crown className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium mb-1">
                    プレミアムプランで無制限に
                  </p>
                  <p className="text-sm text-gray-300">
                    すべての機能を制限なしでご利用いただけます
                  </p>
                </div>
              </div>
              
              <ul className="space-y-2 text-sm text-gray-300 mb-4">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>タロット占い 無制限</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>手相占い 無制限</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>易占い 無制限</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>AIチャット 無制限</span>
                </li>
              </ul>

              <button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                プランを見る
              </button>
            </div>
          </div>

          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 border border-white/20"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}