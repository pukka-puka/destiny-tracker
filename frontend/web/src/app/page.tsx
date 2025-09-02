// src/app/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Camera, 
  Moon, 
  MessageCircle, 
  TrendingUp,
  ArrowRight,
  Star,
  Users,
  Shield,
  Zap
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const features = [
    {
      icon: Camera,
      title: '手相占い',
      description: 'AIが手のひらから運命を読み解きます',
      path: '/palm',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Moon,
      title: 'タロット占い',
      description: '神秘的なカードがあなたの未来を示します',
      path: '/tarot',
      color: 'from-blue-500 to-purple-500'
    },
    {
      icon: MessageCircle,
      title: 'AI占い師チャット',
      description: '24時間いつでも相談できるAI占い師',
      path: '/chat',
      color: 'from-green-500 to-blue-500'
    },
    {
      icon: TrendingUp,
      title: '運勢トラッカー',
      description: '日々の運勢を記録して傾向を分析',
      path: '/dashboard',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const stats = [
    { label: '利用者数', value: '10,000+', icon: Users },
    { label: '的中率', value: '92%', icon: Star },
    { label: '満足度', value: '4.8/5', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* ヒーローセクション */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            {/* ロゴ/タイトル */}
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-12 h-12 text-purple-600 animate-pulse" />
              <h1 className="text-5xl sm:text-6xl font-bold ml-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Destiny Tracker
              </h1>
            </div>
            
            {/* サブタイトル */}
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              AIとデータで運命を可視化する
              <br />
              次世代占いプラットフォーム
            </p>

            {/* CTA ボタン */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => router.push('/auth/signup')}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                無料で始める
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="px-8 py-4 bg-white text-purple-600 rounded-full font-semibold text-lg border-2 border-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
              >
                ログイン
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* 統計情報 */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 機能一覧 */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            選べる占い機能
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            最新のAI技術と伝統的な占術を組み合わせた、
            あなただけの特別な占い体験をお届けします
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              onClick={() => router.push(feature.path)}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${feature.color} mb-4`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {feature.description}
                    </p>
                    <div className="flex items-center text-purple-600 font-semibold group-hover:gap-3 transition-all">
                      <span>試してみる</span>
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
              <div className={`h-1 bg-gradient-to-r ${feature.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
            </div>
          ))}
        </div>
      </div>

      {/* 特徴セクション */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              なぜDestiny Trackerが選ばれるのか
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">安心・安全</h3>
              <p className="text-white/80">
                プライバシーを最優先に、
                あなたのデータを厳重に保護
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">高精度AI</h3>
              <p className="text-white/80">
                最新のAI技術で、
                より正確な占い結果を提供
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">豊富な実績</h3>
              <p className="text-white/80">
                10,000人以上のユーザーに
                愛されている占いサービス
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* フッター */}
      <footer className="bg-gray-50 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center text-gray-600 text-sm">
            <p>© 2024 Destiny Tracker. All rights reserved.</p>
            <div className="flex justify-center gap-4 mt-4">
              <button className="hover:text-purple-600">利用規約</button>
              <button className="hover:text-purple-600">プライバシーポリシー</button>
              <button className="hover:text-purple-600">お問い合わせ</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}