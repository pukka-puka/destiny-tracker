'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, addDoc, collection, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Loader2, Heart, Briefcase, DollarSign, Activity, Users, TrendingUp, Sparkles, Download, Star } from 'lucide-react';
import { PalmReadingData } from '@/types/destiny.types';
import ShareButton from '@/components/ShareButton';

export default function PalmAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [reading, setReading] = useState<PalmReadingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/');
      return;
    }

    const fetchReading = async () => {
      try {
        console.log('📥 解析結果を取得中:', params.id);
        const docRef = doc(db, 'readings', params.id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('✅ データ取得成功:', data);
          
          if (data.readingType !== 'palm') {
            setError('手相占いのデータではありません');
            return;
          }
          
          if (!data.palmReading?.analysis) {
            setError('解析結果がまだ生成されていません。少々お待ちください。');
            return;
          }
          
          setReading(data.palmReading);
        } else {
          console.error('❌ ドキュメントが見つかりません');
          setError('解析結果が見つかりませんでした');
        }
      } catch (err) {
        console.error('❌ データ取得エラー:', err);
        setError('データの取得に失敗しました');
      }
    };

    fetchReading();
  }, [params.id, user, loading, router]);

  const analyzePalm = async () => {
    if (!imageUrl || !user) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Firestoreに初期データを保存
      const docRef = await addDoc(collection(db, 'readings'), {
        userId: user.uid,
        readingType: 'palm',
        imageUrl,
        createdAt: serverTimestamp(),
      });

      // APIリクエスト
      const response = await fetch('/api/palm-reading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          userId: user.uid,
          readingId: docRef.id,
        }),
      });

      // 403エラーのハンドリング
      if (response.status === 403) {
        const errorData = await response.json();
        setShowLimitModal(true);
        setIsAnalyzing(false);
        return;
      }

      if (!response.ok) {
        throw new Error('手相分析に失敗しました');
      }

      const data = await response.json();
      setReading(data.result);

      // Firestoreの結果を更新
      await updateDoc(docRef, {
        result: data.result,
        updatedAt: serverTimestamp(),
      });

    } catch (err) {
      console.error('手相分析エラー:', err);
      setError(err instanceof Error ? err.message : '手相分析に失敗しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading || (!reading && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">解析結果を読み込んでいます...</p>
        </div>
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
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            手相占いに戻る
          </button>
        </div>
      </div>
    );
  }

  const analysis = reading?.analysis;
  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">解析データが見つかりません</p>
          <button
            onClick={() => router.push('/palm')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            手相占いに戻る
          </button>
        </div>
      </div>
    );
  }
  
  const parameterIcons: Record<string, any> = {
    love: Heart,
    career: Briefcase,
    money: DollarSign,
    health: Activity,
    social: Users,
    growth: TrendingUp,
  };

  const parameterLabels: Record<string, string> = {
    love: '恋愛運',
    career: '仕事運',
    money: '金運',
    health: '健康運',
    social: '対人運',
    growth: '成長運',
  };

  const parameterColors: Record<string, string> = {
    love: 'from-pink-500 to-rose-500',
    career: 'from-blue-500 to-indigo-500',
    money: 'from-yellow-500 to-orange-500',
    health: 'from-green-500 to-emerald-500',
    social: 'from-purple-500 to-violet-500',
    growth: 'from-indigo-500 to-blue-500',
  };

  const lineLabels: Record<string, string> = {
    lifeLine: '生命線',
    headLine: '頭脳線',
    heartLine: '感情線',
    fateLine: '運命線',
    sunLine: '太陽線',
    moneyLine: '財運線',
    marriageLine: '結婚線',
    healthLine: '健康線',
    otherLines: 'その他の線',
  };

  const mountLabels: Record<string, string> = {
    jupiter: '木星丘',
    saturn: '土星丘',
    apollo: '太陽丘',
    mercury: '水星丘',
    venus: '金星丘',
    luna: '月丘',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
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
                src={reading.imageUrl}
                alt="手相画像"
                className="w-full rounded-lg shadow-md"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">総合評価</h2>
              <p className="text-gray-700 leading-relaxed">
                {analysis.summary || analysis.overallInterpretation}
              </p>
            </div>
          </div>
        </div>

        {/* パラメーター */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">運勢パラメーター</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(analysis.parameters).map(([key, value]) => {
              const Icon = parameterIcons[key];
              const label = parameterLabels[key];
              const colorClass = parameterColors[key];
              const numValue = value as number;

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-700">{label}</span>
                    </div>
                    <span className="font-bold text-gray-900">{numValue}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`bg-gradient-to-r ${colorClass} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${numValue}%` }}
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
            {analysis.mainLines && Object.entries(analysis.mainLines).map(([key, lineData]) => {
              if (!lineData) return null;
              
              let displayText = '';
              
              if (typeof lineData === 'string') {
                displayText = lineData;
              } else if (lineData.interpretation) {
                displayText = lineData.interpretation;
              } else {
                // 全てのプロパティを安全に取得
                const data = lineData as any;
                displayText = [
                  data.clarity,
                  data.curve,
                  data.length,
                  data.presence
                ].filter(Boolean).join(' ');
              }
              
              if (!displayText) return null;
              
              return (
                <div key={key} className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-bold text-gray-800 mb-2 text-lg">
                    {lineLabels[key] || key}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{displayText}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 丘の分析 */}
        {analysis.mounts && (
          <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">丘の分析</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(analysis.mounts).map(([key, value]) => (
                <div key={key} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                  <h3 className="font-bold text-purple-800 mb-2">
                    {mountLabels[key] || key}
                  </h3>
                  <p className="text-gray-700">{value as string}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 特殊紋様 */}
        {analysis.specialMarks && analysis.specialMarks.length > 0 && (
          <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              特殊紋様
            </h2>
            <div className="space-y-4">
              {analysis.specialMarks.map((mark: any, index: number) => (
                <div key={index} className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-yellow-600 mt-1" />
                    <div>
                      <h3 className="font-bold text-yellow-900 mb-1">
                        {mark.type}
                      </h3>
                      <p className="text-sm text-yellow-800 mb-2">
                        場所: {mark.location}
                      </p>
                      <p className="text-gray-700">{mark.meaning}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 詳細な解釈 */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">詳細な解釈</h2>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {analysis.interpretation || analysis.overallInterpretation}
            </p>
          </div>
        </div>

        {/* 手の形状 */}
        {analysis.handShape && (
          <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">手の形状</h2>
            <p className="text-gray-700 leading-relaxed">{analysis.handShape}</p>
          </div>
        )}

        {/* アドバイス */}
        {analysis.advice && (
          <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">アドバイス</h2>
            {typeof analysis.advice === 'string' ? (
              <p className="text-gray-700 leading-relaxed">{analysis.advice}</p>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-bold text-green-600 mb-3 text-lg">✨ あなたの強み</h3>
                  <ul className="space-y-2">
                    {analysis.advice?.strength?.map((item: string, index: number) => (
                      <li key={index} className="text-gray-700 flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-blue-600 mb-3 text-lg">🌟 チャンス</h3>
                  <ul className="space-y-2">
                    {analysis.advice?.opportunity?.map((item: string, index: number) => (
                      <li key={index} className="text-gray-700 flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-orange-600 mb-3 text-lg">⚠️ 注意点</h3>
                  <ul className="space-y-2">
                    {analysis.advice?.caution?.map((item: string, index: number) => (
                      <li key={index} className="text-gray-700 flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ラッキーアイテム */}
        {analysis.fortune && (
          <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">運勢アップのヒント</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {analysis.fortune.luckyColor && (
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2 font-medium">ラッキーカラー</p>
                  <p className="font-bold text-gray-900 text-lg">{analysis.fortune.luckyColor}</p>
                </div>
              )}
              {analysis.fortune.luckyNumber && (
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2 font-medium">ラッキーナンバー</p>
                  <p className="font-bold text-gray-900 text-lg">{analysis.fortune.luckyNumber}</p>
                </div>
              )}
              {analysis.fortune.luckyItem && (
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2 font-medium">ラッキーアイテム</p>
                  <p className="font-bold text-gray-900 text-lg">{analysis.fortune.luckyItem}</p>
                </div>
              )}
              {analysis.fortune.overall && (
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2 font-medium">総合運</p>
                  <p className="font-bold text-gray-900 text-sm leading-tight">{analysis.fortune.overall}</p>
                </div>
              )}
            </div>
            
            {analysis.fortune.monthlyFortune && (
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                <h3 className="font-bold text-purple-900 mb-2">今月の運勢</h3>
                <p className="text-gray-800">{analysis.fortune.monthlyFortune}</p>
              </div>
            )}
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex gap-4 justify-center mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            ダッシュボードへ
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            保存
          </button>
        </div>

        {/* シェアボタン */}
        <div className="mt-8 flex justify-center">
          <ShareButton 
            type="palm" 
            resultId={params.id as string}
            userId={user?.uid}
          />
        </div>
      </div>
    </div>
  );
}
