// src/app/iching/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UsageLimitModal from '@/components/UsageLimitModal';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// 64卦の基本データ（簡易版）
interface Hexagram {
  number: number;
  name: string;
  chinese: string;
  binary: string;
  judgment: string;
  image: string;
  keywords: string[];
  meaning: {
    general: string;
  };
}

const hexagramsData: Hexagram[] = [
  {
    number: 1,
    name: "乾為天",
    chinese: "乾",
    binary: "111111",
    judgment: "元亨利貞。剛健なる天の徳を象徴し、創造力と積極性を表す。",
    image: "天行健。君子以自強不息。",
    keywords: ["創造", "剛健", "積極", "リーダーシップ"],
    meaning: { general: "強い意志と行動力が求められる時です。積極的に物事を進めることで大きな成功を得られるでしょう。" }
  },
  {
    number: 2,
    name: "坤為地",
    chinese: "坤",
    binary: "000000",
    judgment: "元亨。利牝馬之貞。大地の柔軟性と包容力を象徴する。",
    image: "地勢坤。君子以厚徳載物。",
    keywords: ["受容", "柔軟", "包容", "協調"],
    meaning: { general: "柔軟に対応し、周囲と協調することが成功の鍵です。焦らず着実に進みましょう。" }
  }
];

function getHexagramByBinary(binary: string): Hexagram {
  const index = parseInt(binary.substring(0, 2), 2) % hexagramsData.length;
  return hexagramsData[index];
}

// 筮竹で一爻を決定
function divineWithSticks(): { value: number; changing: boolean } {
  const result = Math.floor(Math.random() * 4);
  const values = [6, 7, 8, 9];
  const chosen = values[result];
  
  return {
    value: chosen === 7 || chosen === 9 ? 1 : 0,
    changing: chosen === 6 || chosen === 9
  };
}

export default function IChingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'divining' | 'result'>('intro');
  const [question, setQuestion] = useState('');
  const [divineCount, setDivineCount] = useState(0);
  const [lines, setLines] = useState<number[]>([]);
  const [changingLines, setChangingLines] = useState<number[]>([]);
  const [hexagram, setHexagram] = useState<Hexagram | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const startDivination = () => {
    if (!question.trim()) {
      alert('質問を入力してください');
      return;
    }

    if (!user?.uid) {
      alert('ログインが必要です');
      return;
    }

    setStep('divining');
    setDivineCount(0);
    setLines([]);
    setChangingLines([]);
  };

  const divineWithSticksAnimation = async () => {
    if (divineCount >= 6 || isAnimating) return;

    setIsAnimating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = divineWithSticks();
      const newLines = [...lines, result.value];
      const newChangingLines = result.changing ? [...changingLines, divineCount] : changingLines;

      setLines(newLines);
      setChangingLines(newChangingLines);
      setDivineCount(divineCount + 1);

      if (divineCount + 1 === 6) {
        const binary = newLines.join('');
        const hex = getHexagramByBinary(binary);
        setHexagram(hex);
        
        setTimeout(() => {
          analyzeWithAI(hex, newChangingLines);
        }, 1000);
      }
    } finally {
      setIsAnimating(false);
    }
  };

  const analyzeWithAI = async (hex: Hexagram, changingLineIndexes: number[]) => {
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/iching/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          hexagram: hex,
          changingLines: changingLineIndexes,
          userId: user?.uid
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setShowLimitModal(true);
          return;
        }
        throw new Error(data.error || '解釈の取得に失敗しました');
      }

      setInterpretation(data.interpretation);

      // Firestoreに保存
      const readingId = `iching_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await setDoc(doc(db, 'readings', readingId), {
        userId: user?.uid,
        readingType: 'iching',
        question,
        hexagram: hex,
        lines,
        changingLines: changingLineIndexes,
        interpretation: data.interpretation,
        createdAt: new Date()
      });

      // 結果ページへ遷移
      router.push(`/iching/result/${readingId}`);

    } catch (error) {
      console.error('AI解釈エラー:', error);
      alert('解釈の生成に失敗しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-yellow-800 to-orange-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <button onClick={() => router.push('/dashboard')} className="text-amber-100/80 hover:text-white mb-4">
            ← ダッシュボードに戻る
          </button>
          <div className="inline-block p-4 bg-white/10 rounded-full mb-4">
            <BookOpen className="w-12 h-12 text-amber-200" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">易占い（I Ching）</h1>
          <p className="text-amber-100/80 text-lg">3000年の歴史を持つ東洋最古の占い</p>
        </div>

        {step === 'intro' && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">質問を入力してください</h2>
            <p className="text-amber-100/80 mb-6">
              易占いでは、具体的な質問をすることで、より明確な答えが得られます。
              心を落ち着けて、あなたの問いかけを入力してください。
            </p>

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="例：新しい仕事を始めるべきでしょうか？"
              className="w-full h-32 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-amber-400 resize-none mb-6"
            />

            <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 mb-6">
              <h3 className="text-amber-200 font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                易占いについて
              </h3>
              <ul className="text-amber-100/80 text-sm space-y-2">
                <li>• 筮竹（ぜいちく）という神聖な竹の棒を使って占います</li>
                <li>• 49本の筮竹を操作し、6回の卜筮で6本の爻（こう）を決定</li>
                <li>• 陽爻「━━━━━」と陰爻「━━ ━━」が集まって卦を形成</li>
                <li>• 本卦（現在）と之卦（未来）から運命を読み解きます</li>
                <li>• AIが古典の知恵を現代に活かす解釈を提供します</li>
              </ul>
            </div>

            <button
              onClick={startDivination}
              disabled={!question.trim()}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              占いを始める
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 'divining' && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              筮竹を操作しています ({divineCount}/6)
            </h2>
            <p className="text-amber-100/80 text-sm mb-6">
              49本の筮竹を分け、数を数えて一爻を得ます
            </p>

            <div className="mb-8 relative">
              <div className={`inline-flex gap-1 ${isAnimating ? 'animate-pulse' : ''}`}>
                {[...Array(isAnimating ? 49 : 6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-gradient-to-b from-amber-600 to-amber-800 rounded-full transition-all duration-500 ${
                      isAnimating 
                        ? 'h-32' 
                        : i < divineCount 
                          ? 'h-20 opacity-50' 
                          : 'h-24'
                    }`}
                  />
                ))}
              </div>
              {isAnimating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl animate-spin">🎋</div>
                </div>
              )}
            </div>

            <div className="mb-8 flex flex-col-reverse gap-3 max-w-md mx-auto">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`h-12 rounded-lg flex items-center justify-center transition-all ${
                  i < lines.length ? lines[i] === 1 ? 'bg-white/90' : 'bg-white/30' : 'bg-white/10'
                } ${changingLines.includes(i) ? 'ring-2 ring-amber-400' : ''}`}>
                  {i < lines.length && (
                    <span className="text-amber-900 font-bold text-xl">
                      {lines[i] === 1 ? '━━━━━' : '━━ ━━'}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {divineCount < 6 && !isAnalyzing && (
              <button
                onClick={divineWithSticksAnimation}
                disabled={isAnimating}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50"
              >
                {isAnimating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    筮竹を数えています...
                  </span>
                ) : (
                  '筮竹を操作する'
                )}
              </button>
            )}

            {isAnalyzing && (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-amber-100/80">AIが易経の古典を参照し、解釈を生成しています...</p>
              </div>
            )}
          </div>
        )}

        <UsageLimitModal
          isOpen={showLimitModal}
          onClose={() => {
            setShowLimitModal(false);
            router.push('/dashboard');
          }}
          featureName="易占い"
        />
      </div>
    </div>
  );
}
