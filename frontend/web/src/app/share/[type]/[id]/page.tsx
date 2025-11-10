import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Heart, TrendingUp, Coins, Users, Zap } from 'lucide-react';

interface SharePageProps {
  params: {
    type: 'tarot' | 'palm' | 'iching' | 'compatibility';
    id: string;
  };
}

// OGP設定
export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { type } = params;

  const titles = {
    tarot: 'タロット占い結果',
    palm: '手相占い結果',
    iching: '易占い結果',
    compatibility: '相性占い結果'
  };

  return {
    title: `${titles[type]} - Shukumei`,
    description: `私の${titles[type]}をシェア！あなたも無料で占ってみませんか？`,
    openGraph: {
      title: `${titles[type]} - Shukumei`,
      description: `私の${titles[type]}をシェア！`,
      url: `https://shukumei.xyz/share/${type}/${params.id}`,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${titles[type]} - Shukumei`,
      description: `私の${titles[type]}をシェア！`,
      images: ['/og-image.png'],
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { type, id } = params;

  const titles = {
    tarot: 'タロット占い',
    palm: '手相占い',
    iching: '易占い',
    compatibility: '相性占い'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 mb-4">
            <span className="text-sm font-medium">占い結果をシェアしてもらいました</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {titles[type]}結果 ✨
          </h1>
          <p className="text-lg text-purple-100">
            あなたも無料で占ってみませんか？
          </p>
        </div>
      </div>

      {/* 結果プレビュー */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-purple-100 to-pink-100 rounded-full px-6 py-3 mb-4">
              <span className="text-purple-700 font-medium">友達の占い結果</span>
            </div>
            <p className="text-gray-600">
              詳細を見るには、あなたも占ってみましょう！
            </p>
          </div>

          {/* ぼかしプレビュー */}
          <div className="relative">
            <div className="blur-sm pointer-events-none select-none">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">恋愛運</span>
                  </div>
                  <div className="h-2 bg-purple-200 rounded-full" />
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">仕事運</span>
                  </div>
                  <div className="h-2 bg-blue-200 rounded-full" />
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium">金運</span>
                  </div>
                  <div className="h-2 bg-yellow-200 rounded-full" />
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    <span className="font-medium">健康運</span>
                  </div>
                  <div className="h-2 bg-green-200 rounded-full" />
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                あなたの運勢について、AIが詳しく分析した結果がここに表示されます...
              </p>
            </div>

            {/* オーバーレイ */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl">
                <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">詳細を見るには</h3>
                <p className="text-gray-600 mb-6">
                  無料で占いを始めてください
                </p>
                <Link
                  href="/"
                  className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
                >
                  無料で占いを始める 🔮
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 特徴セクション */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-bold mb-2">AI占い</h3>
            <p className="text-sm text-gray-600">
              最新のAI技術で本格的な占いを実現
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-pink-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="font-bold mb-2">完全無料</h3>
            <p className="text-sm text-gray-600">
              登録不要で今すぐ占える
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold mb-2">多彩な占い</h3>
            <p className="text-sm text-gray-600">
              タロット・手相・易・相性診断
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-5 rounded-full text-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl mb-4"
          >
            今すぐ無料で占う 🔮
          </Link>
          <p className="text-sm text-gray-500">
            登録不要・完全無料で始められます
          </p>
        </div>
      </div>
    </div>
  );
}
