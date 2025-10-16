'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Loader2, Heart, Briefcase, DollarSign, Activity, Users, TrendingUp, Sparkles, Share2, Download } from 'lucide-react';

interface PalmAnalysis {
  summary: string;
  interpretation: string;
  lines: {
    lifeLine: string;
    headLine: string;
    heartLine: string;
    fateLine: string;
    sunLine?: string;
    marriageLine?: string;
  };
  parameters: {
    love: number;
    career: number;
    money: number;
    health: number;
    social: number;
    growth: number;
  };
  advice: {
    strength: string[];
    opportunity: string[];
    caution: string[];
  };
  fortune: {
    overall: string;
    luckyColor: string;
    luckyNumber: string;
    luckyItem: string;
  };
}

interface PalmReading {
  imageUrl: string;
  analysis: PalmAnalysis;
}

export default function PalmAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [palmReading, setPalmReading] = useState<PalmReading | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/');
      return;
    }

    const fetchReading = async () => {
      try {
        const docRef = doc(db, 'readings', params.id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setPalmReading(data.palmReading as PalmReading);
        } else {
          setError('解析結果が見つかりませんでした');
        }
      } catch (err) {
        console.error('Error fetching reading:', err);
        setError('データの取得に失敗しました');
      }
    };

    fetchReading();
  }, [params.id, user, loading, router]);

  if (loading || !palmReading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/palm')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  const { analysis } = palmReading;
  const parameterIcons = {
    love: Heart,
    career: Briefcase,
    money: DollarSign,
    health: Activity,
    social: Users,
    growth: TrendingUp,
  };

  const parameterLabels = {
    love: '恋愛運',
    career: '仕事運',
    money: '金運',
    health: '健康運',
    social: '対人運',
    growth: '成長運',
  };

  const parameterColors = {
    love: 'from-pink-500 to-rose-500',
    career: 'from-blue-500 to-indigo-500',
    money: 'from-yellow-500 to-orange-500',
    health: 'from-green-500 to-emerald-500',
    social: 'from-purple-500 to-violet-500',
    growth: 'from-indigo-500 to-blue-500',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            手相鑑定結果
            <Sparkles className="w-8 h-8 text-purple-600" />
          </h1>
          <p className="text-gray-600">あなたの運勢を読み解きました</p>
        </div>

        {/* 画像とサマリー */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <img
                src={palmReading.imageUrl}
                alt="手相画像"
                className="w-full rounded-lg shadow-md"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                総合評価
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {analysis.summary}
              </p>
            </div>
          </div>
        </div>

        {/* パラメーター */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">運勢パラメーター</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(analysis.parameters).map(([key, value]) => {
              const Icon = parameterIcons[key as keyof typeof parameterIcons];
              const label = parameterLabels[key as keyof typeof parameterLabels];
              const colorClass = parameterColors[key as keyof typeof parameterColors];

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-700">{label}</span>
                    </div>
                    <span className="font-bold text-gray-900">{value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`bg-gradient-to-r ${colorClass} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 主要な線の解説 */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">主要な線の解説</h2>
          <div className="space-y-4">
            {Object.entries(analysis.lines).map(([key, value]) => (
              <div key={key} className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-bold text-gray-800 mb-1">
                  {key === 'lifeLine' && '生命線'}
                  {key === 'headLine' && '頭脳線'}
                  {key === 'heartLine' && '感情線'}
                  {key === 'fateLine' && '運命線'}
                  {key === 'sunLine' && '太陽線'}
                  {key === 'marriageLine' && '結婚線'}
                </h3>
                <p className="text-gray-600">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 詳細な解釈 */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">詳細な解釈</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {analysis.interpretation}
          </p>
        </div>

        {/* アドバイス */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">アドバイス</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-bold text-green-600 mb-3">✨ あなたの強み</h3>
              <ul className="space-y-2">
                {analysis.advice.strength.map((item, index) => (
                  <li key={index} className="text-gray-700">• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-blue-600 mb-3">🌟 チャンス</h3>
              <ul className="space-y-2">
                {analysis.advice.opportunity.map((item, index) => (
                  <li key={index} className="text-gray-700">• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-orange-600 mb-3">⚠️ 注意点</h3>
              <ul className="space-y-2">
                {analysis.advice.caution.map((item, index) => (
                  <li key={index} className="text-gray-700">• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ラッキーアイテム */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">運勢アップのヒント</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">総合運</p>
              <p className="font-bold text-gray-900">{analysis.fortune.overall}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">ラッキーカラー</p>
              <p className="font-bold text-gray-900">{analysis.fortune.luckyColor}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">ラッキーナンバー</p>
              <p className="font-bold text-gray-900">{analysis.fortune.luckyNumber}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">ラッキーアイテム</p>
              <p className="font-bold text-gray-900">{analysis.fortune.luckyItem}</p>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            ダッシュボードへ
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
