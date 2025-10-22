// src/app/iching/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, BookOpen, ArrowRight, Loader2 } from 'lucide-react';

// 簡易的な64卦データ
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

const sampleHexagrams: Hexagram[] = [
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
  const index = parseInt(binary.substring(0, 2), 2) % sampleHexagrams.length;
  return sampleHexagrams[index];
}

// 筮竹で一爻を決定（49本の筮竹を使った伝統的な方法を簡略化）
function divineWithSticks(): { value: number; changing: boolean } {
  // ランダムで陽爻(1)か陰爻(0)を決定
  // 老陽(9)、少陽(7)、老陰(6)、少陰(8)を模擬
  const result = Math.floor(Math.random() * 4);
  const values = [6, 7, 8, 9]; // 老陰、少陽、少陰、老陽
  const chosen = values[result];
  
  return {
    value: chosen === 7 || chosen === 9 ? 1 : 0, // 陽か陰か
    changing: chosen === 6 || chosen === 9 // 変爻かどうか
  };
}

export default function IChingPage() {
  const router = useRouter();
  const [step, setStep] = useState<'intro' | 'divining' | 'result'>('intro');
  const [question, setQuestion] = useState('');
  const [divineCount, setDivineCount] = useState(0);
  const [lines, setLines] = useState<number[]>([]);
  const [changingLines, setChangingLines] = useState<number[]>([]);
  const [hexagram, setHexagram] = useState<Hexagram | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startDivination = () => {
    if (!question.trim()) {
      alert('質問を入力してください');
      return;
    }
    setStep('divining');
    setDivineCount(0);
    setLines([]);
    setChangingLines([]);
  };

  const divineWithSticksAnimation = async () => {
    if (divineCount >= 6 || isAnimating) return;

    console.log('筮竹操作開始:', divineCount + 1);
    setIsAnimating(true);
    
    try {
      // 筮竹を操作するアニメーション（2秒）
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = divineWithSticks();
      const newLines = [...lines, result.value];
      const newChangingLines = result.changing ? [...changingLines, divineCount] : changingLines;

      console.log('新しい爻:', result.value, '変爻:', result.changing);

      setLines(newLines);
      setChangingLines(newChangingLines);
      
      const newCount = divineCount + 1;
      setDivineCount(newCount);
      
      setIsAnimating(false);

      // 6回完了したら結果を表示
      if (newCount === 6) {
        console.log('6回完了、結果を解析');
        await new Promise(resolve => setTimeout(resolve, 500));
        analyzeResult(newLines, newChangingLines);
      }
    } catch (error) {
      console.error('筮竹操作エラー:', error);
      setIsAnimating(false);
    }
  };

  const analyzeResult = async (finalLines: number[], finalChangingLines: number[]) => {
    const binary = [...finalLines].reverse().join('');
    const mainHexagram = getHexagramByBinary(binary);
    setHexagram(mainHexagram);

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/iching/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          hexagram: mainHexagram,
          changingLines: finalChangingLines,
          futureHexagram: null
        })
      });

      const data = await response.json();
      const aiInterpretation = data.interpretation || mainHexagram.meaning.general;
      setInterpretation(aiInterpretation);

      // Firestoreに保存
      if (typeof window !== 'undefined') {
        const { collection, addDoc, Timestamp } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const { auth } = await import('@/lib/firebase');
        
        const user = auth.currentUser;
        if (user) {
          await addDoc(collection(db, 'readings'), {
            userId: user.uid,
            readingType: 'iching',
            question,
            hexagram: {
              number: mainHexagram.number,
              name: mainHexagram.name,
              chinese: mainHexagram.chinese,
              binary: mainHexagram.binary,
              keywords: mainHexagram.keywords
            },
            lines: finalLines,
            changingLines: finalChangingLines,
            interpretation: aiInterpretation,
            parameters: {
              love: 70,
              career: 70,
              money: 70,
              health: 70,
              social: 70,
              growth: 70
            },
            createdAt: Timestamp.now()
          });
          console.log('易占い結果を保存しました');
        }
      }
    } catch (error) {
      console.error('解釈生成エラー:', error);
      setInterpretation(mainHexagram.meaning.general);
    } finally {
      setIsAnalyzing(false);
    }

    setStep('result');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-yellow-800 to-orange-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
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

        {/* イントロ画面 */}
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

        {/* 筮竹操作画面 */}
        {step === 'divining' && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              筮竹を操作しています ({divineCount}/6)
            </h2>
            <p className="text-amber-100/80 text-sm mb-6">
              49本の筮竹を分け、数を数えて一爻を得ます
            </p>

            {/* 筮竹のビジュアル */}
            <div className="mb-8 relative">
              <div className={`inline-flex gap-1 ${isAnimating ? 'animate-pulse' : ''}`}>
                {/* 筮竹を表現 */}
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
                    style={{
                      animation: isAnimating ? `stick-${i % 3} 1s ease-in-out infinite` : 'none'
                    }}
                  />
                ))}
              </div>
              {isAnimating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl animate-spin">🎋</div>
                </div>
              )}
            </div>

            {/* 卦の表示 */}
            <div className="mb-8 flex flex-col-reverse gap-3 max-w-md mx-auto">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`h-12 rounded-lg flex items-center justify-center transition-all ${
                  i < lines.length ? lines[i] === 1 ? 'bg-white/90' : 'bg-white/30' : 'bg-white/10'
                } ${changingLines.includes(i) ? 'ring-2 ring-amber-400 animate-pulse' : ''}`}>
                  {i < lines.length && (
                    <span className="text-amber-900 font-bold text-lg">
                      {lines[i] === 1 ? '━━━━━' : '━━ ━━'}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                console.log('ボタンクリック！現在:', { divineCount, isAnimating, step });
                divineWithSticksAnimation();
              }}
              disabled={isAnimating || divineCount >= 6}
              className={`px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl transition-all ${
                isAnimating || divineCount >= 6
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:from-amber-600 hover:to-orange-600 cursor-pointer'
              }`}
            >
              {isAnimating ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  筮竹を操作中...
                </span>
              ) : divineCount >= 6 ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  卦を解析中...
                </span>
              ) : (
                `筮竹を操作する (${divineCount + 1}回目)`
              )}
            </button>
            
            <div className="mt-4 text-amber-100/60 text-xs">
              ※ 陽爻（━━━━━）と陰爻（━━ ━━）を6回得て卦を完成させます
            </div>
          </div>
        )}

        {/* 結果画面 */}
        {step === 'result' && hexagram && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                本卦：{hexagram.chinese} {hexagram.name}
              </h2>

              {/* 卦の図 */}
              <div className="flex flex-col-reverse gap-2 max-w-md mx-auto mb-6">
                {hexagram.binary.split('').map((line, i) => (
                  <div key={i} className={`h-12 rounded-lg flex items-center justify-center ${
                    line === '1' ? 'bg-white/90' : 'bg-white/30'
                  } ${changingLines.includes(5 - i) ? 'ring-2 ring-amber-400' : ''}`}>
                    <span className="text-amber-900 font-bold text-xl">
                      {line === '1' ? '━━━━━' : '━━ ━━'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-amber-200 font-bold mb-2">卦辞</h3>
                  <p className="text-white/90">{hexagram.judgment}</p>
                </div>
                <div>
                  <h3 className="text-amber-200 font-bold mb-2">象伝</h3>
                  <p className="text-white/90">{hexagram.image}</p>
                </div>
                <div>
                  <h3 className="text-amber-200 font-bold mb-2">キーワード</h3>
                  <div className="flex flex-wrap gap-2">
                    {hexagram.keywords.map((kw, i) => (
                      <span key={i} className="px-3 py-1 bg-amber-500/20 text-amber-200 rounded-full text-sm">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI解釈 */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-400" />
                AI解釈
              </h3>
              {isAnalyzing ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-4" />
                  <p className="text-white/70">古典の知恵を解釈しています...</p>
                </div>
              ) : (
                <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                  {interpretation || hexagram.meaning.general}
                </p>
              )}
            </div>

            {/* アクション */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep('intro');
                  setQuestion('');
                  setHexagram(null);
                }}
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
        )}
      </div>

      {/* CSSアニメーション */}
      <style jsx>{`
        @keyframes stick-0 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes stick-1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-3deg); }
        }
        @keyframes stick-2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
}