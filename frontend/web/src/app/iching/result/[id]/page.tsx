// src/app/iching/result/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, BookOpen, Sparkles, ArrowLeft } from 'lucide-react';

interface IChingReading {
  question: string;
  hexagram: {
    number: number;
    name: string;
    chinese: string;
    binary: string;
    keywords: string[];
  };
  lines: number[];
  changingLines: number[];
  interpretation: string;
  createdAt: any;
}

export default function IChingResultPage() {
  const params = useParams();
  const router = useRouter();
  const [reading, setReading] = useState<IChingReading | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchReading(params.id as string);
    }
  }, [params.id]);

  const fetchReading = async (id: string) => {
    try {
      const docRef = doc(db, 'readings', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setReading({
          question: data.question,
          hexagram: data.hexagram,
          lines: data.lines,
          changingLines: data.changingLines || [],
          interpretation: data.interpretation,
          createdAt: data.createdAt
        });
      } else {
        alert('占い結果が見つかりませんでした');
        router.push('/history');
      }
    } catch (error) {
      console.error('結果取得エラー:', error);
      alert('結果の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-yellow-800 to-orange-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!reading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-yellow-800 to-orange-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/history')}
          className="flex items-center gap-2 text-amber-100/80 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          履歴に戻る
        </button>

        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white/10 rounded-full mb-4">
            <BookOpen className="w-12 h-12 text-amber-200" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">易占い結果</h1>
          <p className="text-amber-100/80">
            {reading.createdAt?.toDate().toLocaleDateString('ja-JP')}
          </p>
        </div>

        {/* 質問 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-3">あなたの質問</h2>
          <p className="text-amber-100/90 text-lg">{reading.question}</p>
        </div>

        {/* 卦 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-6">
          <h2 className="text-3xl font-bold text-white mb-6">
            本卦：{reading.hexagram.chinese} {reading.hexagram.name}
          </h2>

          {/* 卦の図 */}
          <div className="flex flex-col-reverse gap-2 max-w-md mx-auto mb-6">
            {reading.hexagram.binary.split('').map((line, i) => (
              <div key={i} className={`h-12 rounded-lg flex items-center justify-center ${
                line === '1' ? 'bg-white/90' : 'bg-white/30'
              } ${reading.changingLines.includes(5 - i) ? 'ring-2 ring-amber-400' : ''}`}>
                <span className="text-amber-900 font-bold text-xl">
                  {line === '1' ? '━━━━━' : '━━ ━━'}
                </span>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-amber-200 font-bold mb-2">キーワード</h3>
            <div className="flex flex-wrap gap-2">
              {reading.hexagram.keywords.map((kw, i) => (
                <span key={i} className="px-3 py-1 bg-amber-500/20 text-amber-200 rounded-full text-sm">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* AI解釈 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-6">
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            AI解釈
          </h3>
          <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
            {reading.interpretation}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push('/iching')}
            className="flex-1 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20"
          >
            もう一度占う
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-600"
          >
            ダッシュボードへ
          </button>
        </div>
      </div>
    </div>
  );
}