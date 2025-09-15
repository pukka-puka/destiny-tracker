'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Sparkles, 
  Heart, 
  Brain, 
  Activity, 
  TrendingUp,
  Star,
  Share2,
  Download,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Sun
} from 'lucide-react';

interface AnalysisLine {
  score: number;
  title: string;
  description: string;
  advice: string;
}

interface Analysis {
  overallScore: number;
  lifeLine: AnalysisLine;
  heartLine: AnalysisLine;
  headLine: AnalysisLine;
  fateLine: AnalysisLine;
  sunLine: AnalysisLine;
  todaysFortune: {
    lucky: {
      color: string;
      number: number;
      direction: string;
      item: string;
    };
    message: string;
  };
  overallAdvice: string;
}

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/auth');
        return;
      }
      
      setUser(user);
      
      // Firestoreから解析結果を取得
      try {
        const docRef = doc(db, 'palm-readings', params.id as string);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          setError('解析結果が見つかりません');
          setLoading(false);
          return;
        }
        
        const data = docSnap.data();
        
        // ユーザーの結果かチェック
        if (data.userId !== user.uid) {
          setError('この解析結果を表示する権限がありません');
          setLoading(false);
          return;
        }
        
        if (data.status === 'error') {
          setError('解析中にエラーが発生しました');
          setLoading(false);
          return;
        }
        
        if (data.status === 'analyzing') {
          // まだ解析中の場合は少し待つ
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          return;
        }
        
        setAnalysis(data.analysis);
        setImageUrl(data.imageUrl);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching analysis:', error);
        setError('データの取得中にエラーが発生しました');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [params.id, router]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-purple-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🌟';
    if (score >= 80) return '✨';
    if (score >= 70) return '⭐';
    if (score >= 60) return '💫';
    return '🌙';
  };

  const lineIcons = {
    lifeLine: <Activity className="w-5 h-5" />,
    heartLine: <Heart className="w-5 h-5" />,
    headLine: <Brain className="w-5 h-5" />,
    fateLine: <TrendingUp className="w-5 h-5" />,
    sunLine: <Sun className="w-5 h-5" />
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">解析結果を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-center text-gray-800 mb-6">{error}</p>
          <button
            onClick={() => router.push('/palm')}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            新しい手相を占う
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/palm')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            戻る
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-600" />
              手相占い結果
              <Sparkles className="w-8 h-8 text-purple-600" />
            </h1>
            <p className="text-gray-600">あなたの運命が明らかになりました</p>
          </div>
        </div>

        {/* 総合スコア */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">総合運勢スコア</h2>
            <div className="relative inline-flex items-center justify-center">
              <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {analysis.overallScore}
              </div>
              <div className="text-3xl ml-2 text-gray-600">/100</div>
            </div>
            <div className="mt-4 text-4xl">{getScoreEmoji(analysis.overallScore)}</div>
            <p className="mt-4 text-gray-700 max-w-2xl mx-auto">{analysis.overallAdvice}</p>
          </div>
        </div>

        {/* 各線の詳細 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {Object.entries({
            lifeLine: analysis.lifeLine,
            heartLine: analysis.heartLine,
            headLine: analysis.headLine,
            fateLine: analysis.fateLine,
            sunLine: analysis.sunLine
          }).map(([key, line]) => (
            <div key={key} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    {lineIcons[key as keyof typeof lineIcons]}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{line.title}</h3>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(line.score)}`}>
                  {line.score}
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-gray-700">{line.description}</p>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <span className="font-medium">アドバイス:</span> {line.advice}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 今日の運勢 */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-xl p-8 text-white mb-6">
          <h2 className="text-2xl font-bold mb-6 text-center">今日の運勢</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-purple-200 text-sm mb-1">ラッキーカラー</p>
              <p className="text-xl font-bold">{analysis.todaysFortune.lucky.color}</p>
            </div>
            <div className="text-center">
              <p className="text-purple-200 text-sm mb-1">ラッキーナンバー</p>
              <p className="text-xl font-bold">{analysis.todaysFortune.lucky.number}</p>
            </div>
            <div className="text-center">
              <p className="text-purple-200 text-sm mb-1">ラッキー方位</p>
              <p className="text-xl font-bold">{analysis.todaysFortune.lucky.direction}</p>
            </div>
            <div className="text-center">
              <p className="text-purple-200 text-sm mb-1">ラッキーアイテム</p>
              <p className="text-xl font-bold">{analysis.todaysFortune.lucky.item}</p>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="text-center">{analysis.todaysFortune.message}</p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/palm')}
            className="flex-1 px-6 py-3 bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            もう一度占う
          </button>
          <button
            onClick={() => {
              // TODO: シェア機能の実装
              alert('シェア機能は準備中です！');
            }}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Share2 className="w-5 h-5" />
            結果をシェア
          </button>
        </div>
      </div>
    </div>
  );
}