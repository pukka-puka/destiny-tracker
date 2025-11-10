'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Heart, Users, Briefcase, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import ShareButton from '@/components/ShareButton';

interface CompatibilityResult {
  overall?: number;
  overallScore?: number;
  love?: number;
  friendship?: number;
  work?: number;
  communication?: number;
  trust?: number;
  interpretation: string;
  strengths: string[];
  challenges: string[];
  advice: string | string[];
  person1: {
    name: string;
    birthDate: string;
  };
  person2: {
    name: string;
    birthDate: string;
  };
  category?: string;
  createdAt: any;
}

export default function CompatibilityResultPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const unwrappedParams = use(params);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CompatibilityResult | null>(null);

  // params から直接 id を取得
  useEffect(() => {
    if (unwrappedParams.id) {
      fetchResult(unwrappedParams.id);
    }
  }, [unwrappedParams.id]);

  const fetchResult = async (id: string) => {
    try {
      // 'readings' コレクションから取得（保存時と同じコレクション）
      const docRef = doc(db, 'readings', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('📥 取得したデータ:', data);

        if (data.readingType === 'compatibility') {
          console.log('✅ 相性診断データ:', data.compatibilityReading);
          
          // compatibilityReading フィールドから取得
          const compatData = data.compatibilityReading;
          
          if (compatData) {
            // createdAt を追加
            const resultData = {
              ...compatData,
              createdAt: data.createdAt
            };
            
            console.log('📊 セット前のデータ:', resultData);
            setResult(resultData);
          } else {
            console.error('❌ compatibilityReading が見つかりません');
            console.error('🔍 実際のデータ:', data);
            alert('データの形式が正しくありません');
            router.push('/compatibility');
          }
        } else {
          alert('相性診断の結果ではありません');
          router.push('/compatibility');
        }
      } else {
        alert('結果が見つかりませんでした');
        router.push('/compatibility');
      }
    } catch (error) {
      console.error('結果取得エラー:', error);
      alert('結果の取得に失敗しました');
      router.push('/compatibility');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-800 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-pink-300 mx-auto mb-4" />
          <p className="text-white">結果を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  // スコア値の取得（overallScore または overall）
  const overallScore = result.overallScore || result.overall || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-800 to-red-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <button
          onClick={() => router.push('/compatibility')}
          className="flex items-center gap-2 text-pink-100 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          新しい相性診断
        </button>

        <div className="space-y-6">
          {/* 総合相性 */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {result.person1.name} ❤️ {result.person2.name}
            </h2>
            
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="transform -rotate-90 w-48 h-48">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="16"
                  fill="none"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="url(#gradient)"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${overallScore * 5.53} 553`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div>
                  <div className="text-5xl font-bold text-white">{overallScore}</div>
                  <div className="text-pink-200 text-sm">/ 100</div>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">総合相性</h3>
            <p className="text-pink-100/80">
              {overallScore >= 80 ? '素晴らしい相性です！' :
               overallScore >= 60 ? '良好な相性です' :
               overallScore >= 40 ? '普通の相性です' :
               '相性には課題があります'}
            </p>
          </div>

          {/* 詳細スコア（利用可能な場合のみ表示） */}
          {(result.love || result.friendship || result.work || result.communication || result.trust) && (
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">詳細スコア</h3>
              
              <div className="space-y-4">
                {[
                  { label: '恋愛', value: result.love, icon: '❤️' },
                  { label: '友情', value: result.friendship, icon: '🤝' },
                  { label: '仕事', value: result.work, icon: '💼' },
                  { label: 'コミュニケーション', value: result.communication, icon: '💬' },
                  { label: '信頼', value: result.trust, icon: '🛡️' }
                ].filter(item => item.value !== undefined).map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white flex items-center gap-2">
                        <span>{item.icon}</span>
                        {item.label}
                      </span>
                      <span className="text-pink-200 font-bold">{item.value}</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-1000"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 詳細解釈 */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              詳細な解釈
            </h3>
            <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
              {result.interpretation}
            </p>
          </div>

          {/* 強み */}
          {result.strengths && result.strengths.length > 0 && (
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">✨ 二人の強み</h3>
              <ul className="space-y-3">
                {result.strengths.map((strength, i) => (
                  <li key={i} className="text-white/90 flex items-start gap-3">
                    <span className="text-pink-300 text-xl">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 課題 */}
          {result.challenges && result.challenges.length > 0 && (
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">⚠️ 乗り越えるべき課題</h3>
              <ul className="space-y-3">
                {result.challenges.map((challenge, i) => (
                  <li key={i} className="text-white/90 flex items-start gap-3">
                    <span className="text-yellow-300 text-xl">•</span>
                    <span>{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* アドバイス */}
          {result.advice && (
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">💡 関係を深めるアドバイス</h3>
              {Array.isArray(result.advice) ? (
                <ul className="space-y-3">
                  {result.advice.map((item, i) => (
                    <li key={i} className="text-white/90 flex items-start gap-3">
                      <span className="text-green-300 text-xl">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                  {result.advice}
                </p>
              )}
            </div>
          )}

          {/* シェアボタン */}
          <div className="flex justify-center">
            <ShareButton 
              type="compatibility" 
              resultId={unwrappedParams.id}
              userId={user?.uid}
            />
          </div>

          {/* 再診断ボタン */}
          <div className="text-center">
            <button
              onClick={() => router.push('/compatibility')}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
            >
              もう一度診断する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
