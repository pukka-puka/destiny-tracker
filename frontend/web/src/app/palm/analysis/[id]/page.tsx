// src/app/palm/analysis/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  Sparkles, 
  Heart, 
  Briefcase, 
  TrendingUp, 
  Users,
  Star,
  ChevronRight,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Share2,
  Download
} from 'lucide-react';

interface PalmReading {
  id: string;
  userId: string;
  imageUrl: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  analysis?: {
    lifeLine: {
      score: number;
      description: string;
    };
    heartLine: {
      score: number;
      description: string;
    };
    headLine: {
      score: number;
      description: string;
    };
    fateLine: {
      score: number;
      description: string;
    };
    overall: {
      fortune: number;
      message: string;
      advice: string;
    };
  };
  createdAt: any;
}

// ダミーの解析結果生成（実際はAI APIを使用）
const generateDummyAnalysis = () => ({
  lifeLine: {
    score: Math.floor(Math.random() * 30) + 70,
    description: "生命線がはっきりと刻まれており、健康運に恵まれています。長寿の相が表れており、活力に満ちた人生を送ることができるでしょう。"
  },
  heartLine: {
    score: Math.floor(Math.random() * 30) + 70,
    description: "感情豊かで愛情深い性格が表れています。人との繋がりを大切にし、温かい人間関係を築くことができるでしょう。"
  },
  headLine: {
    score: Math.floor(Math.random() * 30) + 70,
    description: "知的で論理的な思考力を持っています。決断力があり、困難な状況でも冷静に対処できる能力があります。"
  },
  fateLine: {
    score: Math.floor(Math.random() * 30) + 70,
    description: "運命線が強く表れており、目標に向かって着実に進む力があります。努力が報われやすい運勢です。"
  },
  overall: {
    fortune: Math.floor(Math.random() * 30) + 70,
    message: "全体的にバランスの取れた良い手相です。特に今年は大きなチャンスが訪れる暗示があります。",
    advice: "自信を持って新しいことにチャレンジしてみましょう。あなたの努力は必ず実を結びます。"
  }
});

export default function PalmAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [reading, setReading] = useState<PalmReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchReading(params.id as string);
    }
  }, [params.id]);

  const fetchReading = async (id: string) => {
    try {
      const docRef = doc(db, 'palm-readings', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('占い結果が見つかりません');
        setLoading(false);
        return;
      }

      const data = docSnap.data() as Omit<PalmReading, 'id'>;
      const readingData: PalmReading = {
        id: docSnap.id,
        ...data
      };

      // 権限チェック
      if (user && data.userId !== user.uid) {
        setError('この占い結果を表示する権限がありません');
        setLoading(false);
        return;
      }

      setReading(readingData);

      // 解析がまだの場合は実行
      if (data.status === 'pending') {
        await startAnalysis(id);
      }
    } catch (err) {
      console.error('Error fetching reading:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const startAnalysis = async (id: string) => {
    setAnalyzing(true);
    try {
      // ステータスを更新
      const docRef = doc(db, 'palm-readings', id);
      await updateDoc(docRef, {
        status: 'analyzing',
        updatedAt: new Date()
      });

      // ダミーの解析（実際はAI APIを呼び出し）
      await new Promise(resolve => setTimeout(resolve, 3000));
      const analysis = generateDummyAnalysis();

      // 解析結果を保存
      await updateDoc(docRef, {
        status: 'completed',
        analysis,
        updatedAt: new Date()
      });

      // 状態を更新
      setReading(prev => prev ? {
        ...prev,
        status: 'completed',
        analysis
      } : null);
    } catch (err) {
      console.error('Error analyzing:', err);
      setError('解析に失敗しました');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-center text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => router.push('/palm')}
            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  if (analyzing || reading?.status === 'analyzing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Sparkles className="w-16 h-16 text-purple-600 animate-pulse mx-auto" />
            <div className="absolute inset-0 animate-ping">
              <Sparkles className="w-16 h-16 text-purple-400 mx-auto opacity-50" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-2">
            手相を解析中...
          </h2>
          <p className="text-gray-600">
            AIがあなたの運命を読み解いています
          </p>
        </div>
      </div>
    );
  }

  const analysis = reading?.analysis;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/palm')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>戻る</span>
          </button>
          <div className="flex gap-2">
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* タイトル */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            <h1 className="text-3xl font-bold text-gray-800 mx-3">
              あなたの手相占い結果
            </h1>
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          </div>
          <p className="text-gray-600">
            {new Date(reading?.createdAt?.toDate()).toLocaleDateString('ja-JP')}
          </p>
        </div>

        {analysis && (
          <>
            {/* 総合運勢 */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                総合運勢
              </h2>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold">
                  {analysis.overall.fortune}点
                </span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < Math.floor(analysis.overall.fortune / 20)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="mb-3">{analysis.overall.message}</p>
              <p className="text-sm opacity-90">
                💡 {analysis.overall.advice}
              </p>
            </div>

            {/* 各線の詳細 */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {/* 生命線 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    生命線
                  </h3>
                  <span className="text-2xl font-bold text-red-500">
                    {analysis.lifeLine.score}点
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${analysis.lifeLine.score}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {analysis.lifeLine.description}
                </p>
              </div>

              {/* 感情線 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500" />
                    感情線
                  </h3>
                  <span className="text-2xl font-bold text-pink-500">
                    {analysis.heartLine.score}点
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-pink-500 h-2 rounded-full"
                    style={{ width: `${analysis.heartLine.score}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {analysis.heartLine.description}
                </p>
              </div>

              {/* 頭脳線 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-500" />
                    頭脳線
                  </h3>
                  <span className="text-2xl font-bold text-blue-500">
                    {analysis.headLine.score}点
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${analysis.headLine.score}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {analysis.headLine.description}
                </p>
              </div>

              {/* 運命線 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    運命線
                  </h3>
                  <span className="text-2xl font-bold text-purple-500">
                    {analysis.fateLine.score}点
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${analysis.fateLine.score}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {analysis.fateLine.description}
                </p>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/tarot')}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
              >
                <span>タロット占いも試す</span>
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/palm')}
                className="flex-1 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-all"
              >
                もう一度占う
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}