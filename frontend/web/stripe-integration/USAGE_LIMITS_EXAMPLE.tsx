// 使用制限チェック機能の実装例
// 既存のタロットページに以下のように統合してください

// src/app/tarot/page.tsx に追加する部分

// 1. インポート追加
import { useUsageLimits, getUsageLimitMessage } from '@/hooks/useUsageLimits';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { AlertCircle, Lock, ArrowRight } from 'lucide-react';

// 2. コンポーネント内で使用制限をチェック
export default function TarotPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { usage, loading: usageLoading, refresh } = useUsageLimits('tarot');
  
  // ... 既存の state

  // 3. 占い実行前にチェック
  const handleStartReading = () => {
    if (!usage.allowed) {
      // 使用制限に達している場合
      setShowLimitModal(true);
      return;
    }

    // 占いを実行
    startReading();
  };

  // 4. 使用制限モーダルの表示
  {showLimitModal && (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 rounded-3xl p-8 max-w-md w-full border border-purple-500/30 shadow-2xl">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Lock className="w-10 h-10 text-white" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-4">
            使用制限に達しました
          </h3>
          
          <div className="bg-white/10 rounded-xl p-4 mb-6">
            <p className="text-gray-300 mb-2">
              {getUsageLimitMessage('tarot', usage, userProfile?.subscription || 'free')}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-3">
              <AlertCircle className="w-4 h-4" />
              <span>
                今月の利用: {usage.used}/{usage.limit}回
              </span>
            </div>
          </div>

          {userProfile?.subscription === 'free' && (
            <div className="space-y-3 mb-6">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  プレミアムプランなら
                </h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>✨ タロット占い無制限</li>
                  <li>✨ すべての占い機能が使い放題</li>
                  <li>✨ AIチャット相談も無制限</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowLimitModal(false)}
              className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
            >
              閉じる
            </button>
            {userProfile?.subscription === 'free' && (
              <button
                onClick={() => router.push('/pricing')}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
              >
                プラン変更
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )}

  // 5. ヘッダーに残り回数を表示
  {!usageLoading && user && (
    <div className="mb-6 flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-yellow-400" />
        <div>
          <p className="text-sm text-gray-400">今月の利用状況</p>
          <p className="text-white font-semibold">
            {usage.limit === -1 
              ? '無制限'
              : `残り ${usage.remaining}回（${usage.used}/${usage.limit}）`
            }
          </p>
        </div>
      </div>
      {userProfile?.subscription === 'free' && usage.remaining <= 1 && (
        <button
          onClick={() => router.push('/pricing')}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          アップグレード
        </button>
      )}
    </div>
  )}

  // ... 残りのコンポーネント
}
