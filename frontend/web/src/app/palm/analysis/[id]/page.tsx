'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Loader2, 
  Heart, 
  Coins, 
  Briefcase, 
  Activity, 
  Users, 
  TrendingUp,
  Star
} from 'lucide-react';
import Image from 'next/image';

// モックの手相解析結果
const mockAnalysis = {
  lines: {
    life: {
      strength: 85,
      description: '生命線は長く深く、健康で活力に満ちた人生を示しています。'
    },
    heart: {
      strength: 72,
      description: '感情線は安定しており、豊かな感情表現と愛情深さを表しています。'
    },
    head: {
      strength: 90,
      description: '頭脳線は明瞭で、論理的思考と創造性のバランスが取れています。'
    },
    fate: {
      strength: 68,
      description: '運命線は中程度の強さで、自由な選択と運命のバランスを示しています。'
    }
  },
  parameters: {
    love: 75,
    money: 82,
    work: 88,
    health: 79,
    social: 71,
    overall: 80
  },
  personality: {
    traits: ['創造的', 'リーダーシップ', '直感的', '情熱的'],
    summary: 'あなたは創造性とリーダーシップを兼ね備えた、バランスの取れた人物です。'
  },
  advice: '現在のあなたの手相は、大きな可能性を秘めています。特に仕事運が高まっており、新しいチャレンジに適した時期です。'
};

// パラメーターアイコンマップ
const parameterIcons = {
  love: Heart,
  money: Coins,
  work: Briefcase,
  health: Activity,
  social: Users,
  overall: TrendingUp
};

// パラメーター日本語名
const parameterNames = {
  love: '恋愛運',
  money: '金運',
  work: '仕事運',
  health: '健康運',
  social: '対人運',
  overall: '総合運'
};

export default function PalmAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  interface PalmData {
    imageUrl?: string;
    imagePath?: string;
    status?: string;
    userId?: string;
  }
  
  const [palmData, setPalmData] = useState<PalmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  useEffect(() => {
    const fetchPalmData = async () => {
      if (!user || !params.id) return;

      try {
        const docRef = doc(db, 'palm-readings', params.id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPalmData(docSnap.data());
          
          // モック解析プログレス
          const interval = setInterval(() => {
            setAnalysisProgress(prev => {
              if (prev >= 100) {
                clearInterval(interval);
                setTimeout(() => setLoading(false), 500);
                return 100;
              }
              return prev + 20;
            });
          }, 500);
        } else {
          router.push('/palm');
        }
      } catch (error) {
        console.error('Error fetching palm data:', error);
        router.push('/palm');
      }
    };

    fetchPalmData();
  }, [user, params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700">手相を解析中...</p>
          <div className="mt-4 w-64 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">{analysisProgress}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🔮 手相解析結果
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 手相画像 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">アップロード画像</h2>
            {palmData?.imageUrl && (
              <div className="relative w-full aspect-square">
                <Image 
                  src={palmData.imageUrl} 
                  alt="手相" 
                  fill
                  className="rounded-lg object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}
          </div>

          {/* 運勢パラメーター */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">運勢パラメーター</h2>
            <div className="space-y-4">
              {Object.entries(mockAnalysis.parameters).map(([key, value]) => {
                const Icon = parameterIcons[key as keyof typeof parameterIcons];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${key === 'love' ? 'text-pink-500' : key === 'money' ? 'text-yellow-500' : 'text-purple-500'}`} />
                    <span className="text-sm font-medium text-gray-600 w-16">
                      {parameterNames[key as keyof typeof parameterNames]}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          key === 'love' ? 'bg-pink-500' : 
                          key === 'money' ? 'bg-yellow-500' : 
                          'bg-purple-500'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 手相線の分析 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">主要線の分析</h2>
            <div className="space-y-4">
              {Object.entries(mockAnalysis.lines).map(([line, data]) => (
                <div key={line} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700 capitalize">
                      {line === 'life' ? '生命線' : 
                       line === 'heart' ? '感情線' : 
                       line === 'head' ? '頭脳線' : '運命線'}
                    </span>
                    <span className="text-sm text-purple-600 font-semibold">
                      強度: {data.strength}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{data.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 性格特性 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">性格特性</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {mockAnalysis.personality.traits.map(trait => (
                <span 
                  key={trait}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                >
                  {trait}
                </span>
              ))}
            </div>
            <p className="text-gray-600">{mockAnalysis.personality.summary}</p>
          </div>
        </div>

        {/* アドバイス */}
        <div className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-start gap-3">
            <Star className="w-6 h-6 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-semibold mb-2">今日のアドバイス</h2>
              <p className="text-purple-50">{mockAnalysis.advice}</p>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={() => router.push('/palm')}
            className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-50 transition-colors shadow-lg"
          >
            新しい手相を撮影
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
          >
            ダッシュボードへ
          </button>
        </div>
      </div>
    </div>
  );
}