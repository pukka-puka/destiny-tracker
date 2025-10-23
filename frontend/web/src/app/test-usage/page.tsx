'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useUsageLimits, getUsageLimitMessage } from '@/hooks/useUsageLimits';
import { Loader2 } from 'lucide-react';

export default function TestUsagePage() {
  const { user, userProfile } = useAuth();
  
  // 各機能の使用状況をチェック
  const tarotUsage = useUsageLimits('tarot');
  const palmUsage = useUsageLimits('palm');
  const ichingUsage = useUsageLimits('iching');
  const chatUsage = useUsageLimits('aiChat');
  const compatibilityUsage = useUsageLimits('compatibility');

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900/20 via-black to-black flex items-center justify-center">
        <p className="text-white">ログインしてください</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 via-black to-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          使用制限テストページ 🧪
        </h1>

        {/* ユーザー情報 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">ユーザー情報</h2>
          <div className="space-y-2 text-gray-300">
            <p>UID: {user.uid}</p>
            <p>Email: {user.email || '匿名'}</p>
            <p>プラン: {userProfile?.subscription || 'free'}</p>
          </div>
        </div>

        {/* タロット占い */}
        <UsageCard
          title="タロット占い 🔮"
          usage={tarotUsage.usage}
          loading={tarotUsage.loading}
          subscription={userProfile?.subscription || 'free'}
          feature="tarot"
        />

        {/* 手相占い */}
        <UsageCard
          title="手相占い 🖐️"
          usage={palmUsage.usage}
          loading={palmUsage.loading}
          subscription={userProfile?.subscription || 'free'}
          feature="palm"
        />

        {/* 易占い */}
        <UsageCard
          title="易占い 📿"
          usage={ichingUsage.usage}
          loading={ichingUsage.loading}
          subscription={userProfile?.subscription || 'free'}
          feature="iching"
        />

        {/* AIチャット */}
        <UsageCard
          title="AIチャット 💬"
          usage={chatUsage.usage}
          loading={chatUsage.loading}
          subscription={userProfile?.subscription || 'free'}
          feature="aiChat"
        />

        {/* 相性診断 */}
        <UsageCard
          title="相性診断 💑"
          usage={compatibilityUsage.usage}
          loading={compatibilityUsage.loading}
          subscription={userProfile?.subscription || 'free'}
          feature="compatibility"
        />
      </div>
    </div>
  );
}

// 使用状況カードコンポーネント
function UsageCard({ title, usage, loading, subscription, feature }: any) {
  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 mb-4">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 mb-4">
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">使用可否</p>
          <p className={`text-2xl font-bold ${usage.allowed ? 'text-green-400' : 'text-red-400'}`}>
            {usage.allowed ? '✅ 利用可能' : '❌ 制限到達'}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-400 mb-1">今月の使用状況</p>
          <p className="text-2xl font-bold text-white">
            {usage.used} / {usage.limit === -1 ? '∞' : usage.limit}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-400 mb-1">残り回数</p>
          <p className="text-2xl font-bold text-yellow-400">
            {usage.limit === -1 ? '無制限' : `${usage.remaining}回`}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-400 mb-1">制限数</p>
          <p className="text-2xl font-bold text-blue-400">
            {usage.limit === -1 ? '無制限' : `${usage.limit}回`}
          </p>
        </div>
      </div>

      {/* メッセージ */}
      <div className="bg-white/5 rounded-lg p-4">
        <p className="text-gray-300 text-sm">
          {getUsageLimitMessage(feature, usage, subscription)}
        </p>
      </div>
    </div>
  );
}
