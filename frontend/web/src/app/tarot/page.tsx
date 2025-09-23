'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Heart, Briefcase, DollarSign, HelpCircle, Star, Moon, Sun } from 'lucide-react';
import Image from 'next/image';
import { saveTarotReading } from '@/lib/tarot-history';

interface TarotCard {
  id: number;
  name: string;
  arcana: string;
  isReversed: boolean;
}

interface TarotReading {
  id?: string;
  cards: TarotCard[];
  interpretation: string;
  spreadType: string;
  timestamp: string;
}

// カード名と画像ファイル名のマッピング
const CARD_IMAGE_MAP: { [key: string]: string } = {
  '愚者': '0-fool',
  '魔術師': '1-magician',
  '女教皇': '2-high-priestess',
  '女帝': '3-empress',
  '皇帝': '4-emperor',
  '教皇': '5-hierophant',
  '恋人': '6-lovers',
  '戦車': '7-chariot',
  '力': '8-strength',
  '隠者': '9-hermit',
  '運命の輪': '10-wheel-of-fortune',
  '正義': '11-justice',
  '吊るされた男': '12-hanged-man',
  '死神': '13-death',
  '節制': '14-temperance',
  '悪魔': '15-devil',
  '塔': '16-tower',
  '星': '17-star',
  '月': '18-moon',
  '太陽': '19-sun',
  '審判': '20-judgement',
  '世界': '21-world',
};

// ローディング中のメッセージ
const LOADING_MESSAGES = [
  { time: 0, message: "宇宙のエネルギーに接続中..." },
  { time: 1500, message: "カードをシャッフルしています..." },
  { time: 3000, message: "あなたの運命のカードを選んでいます..." },
  { time: 4500, message: "カードからメッセージを読み取っています..." },
  { time: 6000, message: "神秘の解釈を紡いでいます..." },
  { time: 7500, message: "まもなく結果が現れます..." }
];

// 占いの豆知識
const TAROT_FACTS = [
  "タロットカードの起源は15世紀のイタリアにさかのぼります",
  "大アルカナ22枚は人生の重要な転機を表します",
  "「愚者」のカードは旅の始まりを意味します",
  "タロットの「死神」は終わりではなく変容を意味します",
  "カードの逆位置は、そのカードのエネルギーが抑制されていることを示します",
  "ライダー・ウェイト版は最も有名なタロットデッキです"
];

// ローディングコンポーネント
function LoadingOverlay({ startTime }: { startTime: number }) {
  const [currentMessage, setCurrentMessage] = useState(LOADING_MESSAGES[0].message);
  const [progress, setProgress] = useState(0);
  const [currentFact, setCurrentFact] = useState("");
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    // プログレスバーの更新
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / 8000) * 100, 95); // 最大95%まで
      setProgress(newProgress);
    }, 100);

    // メッセージの更新
    const messageTimeouts: NodeJS.Timeout[] = [];
    LOADING_MESSAGES.forEach((msg) => {
      const timeout = setTimeout(() => {
        setCurrentMessage(msg.message);
      }, msg.time);
      messageTimeouts.push(timeout);
    });

    // 豆知識の表示
    setCurrentFact(TAROT_FACTS[0]);
    const factInterval = setInterval(() => {
      setFactIndex(prev => {
        const nextIndex = (prev + 1) % TAROT_FACTS.length;
        setCurrentFact(TAROT_FACTS[nextIndex]);
        return nextIndex;
      });
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(factInterval);
      messageTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [startTime]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gradient-to-br from-purple-900/90 to-indigo-900/90 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/20">
        {/* アニメーションカード */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* 回転するカード */}
            <div className="w-24 h-36 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg shadow-xl animate-flip">
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl animate-pulse">🎴</span>
              </div>
            </div>
            {/* キラキラエフェクト */}
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-spin-slow" />
            <Star className="absolute -bottom-2 -left-2 w-5 h-5 text-yellow-300 animate-pulse" />
          </div>
        </div>

        {/* メッセージ */}
        <h3 className="text-white text-center text-lg font-semibold mb-4 min-h-[28px]">
          {currentMessage}
        </h3>

        {/* プログレスバー */}
        <div className="mb-6">
          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-400 to-pink-400 h-full rounded-full transition-all duration-300 relative"
              style={{ width: `${progress}%` }}
            >
              {/* 光るエフェクト */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          <p className="text-white/70 text-xs text-center mt-2">
            {Math.round(progress)}% 完了
          </p>
        </div>

        {/* 豆知識 */}
        <div className="bg-white/10 rounded-lg p-4">
          <p className="text-yellow-300 text-xs mb-1 font-semibold">💡 豆知識</p>
          <p className="text-white/80 text-sm animate-fade-in">
            {currentFact}
          </p>
        </div>

        {/* ローディングインジケーター */}
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// タロットカードコンポーネント
function TarotCardVisual({ card, index, isResult = false }: { 
  card: TarotCard; 
  index: number; 
  isResult?: boolean 
}) {
  const [imageError, setImageError] = useState(false);
  const imageName = CARD_IMAGE_MAP[card.name];

  return (
    <div className="relative group">
      <div 
        className={`relative transform transition-all duration-700 ${
          card.isReversed ? 'rotate-180' : ''
        } ${isResult ? 'hover:scale-110 hover:-translate-y-2' : 'hover:scale-105'}`}
        style={{
          animation: isResult ? `fadeInUp ${0.5 + index * 0.15}s ease-out` : undefined,
          transformStyle: 'preserve-3d'
        }}
      >
        <div className="relative rounded-lg shadow-2xl overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100"
             style={{ aspectRatio: '256/456' }}>
          
          {imageName && !imageError ? (
            <>
              <Image
                src={`/tarot-cards/${imageName}.jpg`}
                alt={card.name}
                width={256}
                height={456}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
                priority={index < 3}
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white font-bold text-center text-sm drop-shadow-lg">
                  {card.name}
                </p>
                <p className="text-white/80 text-xs text-center">
                  {card.arcana === 'major' ? '大アルカナ' : '小アルカナ'}
                </p>
              </div>

              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-sparkle" />
                <div className="absolute top-3/4 right-1/4 w-1.5 h-1.5 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-sparkle animation-delay-200" />
                <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-sparkle animation-delay-400" />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <div className="text-center text-white p-4">
                <div className="text-4xl mb-2">🎴</div>
                <p className="font-bold">{card.name}</p>
                <p className="text-xs opacity-80">
                  {card.arcana === 'major' ? '大アルカナ' : '小アルカナ'}
                </p>
              </div>
            </div>
          )}
        </div>

        {card.isReversed && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <span className="text-xs px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg backdrop-blur-sm">
              逆位置
            </span>
          </div>
        )}

        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-yellow-300 via-purple-300 to-transparent blur-xl" />
        </div>
      </div>
    </div>
  );
}

export default function TarotPage() {
  const [question, setQuestion] = useState('');
  const [spreadType, setSpreadType] = useState<'three-card' | 'celtic-cross'>('three-card');
  const [reading, setReading] = useState<TarotReading | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [showCards, setShowCards] = useState(false);

  const categories = [
    { id: 'general', label: '総合運', icon: HelpCircle, color: 'from-purple-500 to-pink-500' },
    { id: 'love', label: '恋愛運', icon: Heart, color: 'from-pink-500 to-red-500' },
    { id: 'work', label: '仕事運', icon: Briefcase, color: 'from-blue-500 to-cyan-500' },
    { id: 'money', label: '金運', icon: DollarSign, color: 'from-green-500 to-emerald-500' },
  ];

  const handleReading = async () => {
    setLoading(true);
    setLoadingStartTime(Date.now());
    setShowCards(false);
    
    try {
      const response = await fetch('/api/divination/tarot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question || getCategoryQuestion(selectedCategory),
          spreadType
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // 最低表示時間を確保（UXのため）
        const elapsed = Date.now() - loadingStartTime;
        const minLoadTime = 3000;
        if (elapsed < minLoadTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadTime - elapsed));
        }
        
        setReading(data);
        
        // 履歴に保存
        saveTarotReading({
          id: data.id || Date.now().toString(),
          question: question || getCategoryQuestion(selectedCategory),
          spreadType,
          cards: data.cards,
          interpretation: data.interpretation,
          category: selectedCategory,
          timestamp: data.timestamp
        });
        
        setLoading(false);
        setTimeout(() => setShowCards(true), 100);
      }
    } catch (error) {
      console.error('タロット占いエラー:', error);
      setLoading(false);
    }
  };

  const getCategoryQuestion = (category: string) => {
    const questions = {
      general: '私の今後の運勢を教えてください',
      love: '恋愛運について教えてください',
      work: '仕事運について教えてください',
      money: '金運について教えてください'
    };
    return questions[category as keyof typeof questions];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* ローディングオーバーレイ */}
      {loading && <LoadingOverlay startTime={loadingStartTime} />}

      {/* 背景の装飾 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse animation-delay-1000" />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse" />
            タロット占い
            <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse" />
          </h1>
          <p className="text-gray-300 text-lg">神秘のカードがあなたの運命を照らします</p>
        </div>

        {/* カテゴリー選択 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`relative p-4 rounded-xl bg-white/10 backdrop-blur-md border-2 transition-all transform ${
                  selectedCategory === cat.id
                    ? 'border-white scale-105 shadow-2xl bg-white/20'
                    : 'border-white/30 hover:border-white/60 hover:scale-102'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-20 rounded-xl`} />
                <Icon className="w-8 h-8 text-white mx-auto mb-2 relative z-10" />
                <p className="text-white font-semibold relative z-10">{cat.label}</p>
              </button>
            );
          })}
        </div>

        {/* 質問入力エリア */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-2xl">
            <label className="block text-white mb-2 font-semibold">質問を入力（オプション）</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="具体的な質問があれば入力してください..."
              className="w-full px-4 py-3 bg-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              rows={3}
            />

            <div className="mt-4 flex gap-4">
              <button
                onClick={() => setSpreadType('three-card')}
                className={`flex-1 py-3 px-4 rounded-lg transition-all font-semibold ${
                  spreadType === 'three-card'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-white/20 text-gray-300 hover:bg-white/30'
                }`}
              >
                3カードスプレッド
              </button>
              <button
                onClick={() => setSpreadType('celtic-cross')}
                className={`flex-1 py-3 px-4 rounded-lg transition-all font-semibold ${
                  spreadType === 'celtic-cross'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-white/20 text-gray-300 hover:bg-white/30'
                }`}
              >
                ケルト十字
              </button>
            </div>

            <button
              onClick={handleReading}
              disabled={loading}
              className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-xl text-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <Star className="w-5 h-5" />
                カードを引く
                <Star className="w-5 h-5" />
              </span>
            </button>
          </div>
        </div>

        {/* 占い結果 */}
        {reading && showCards && (
          <div className="max-w-6xl mx-auto animate-fade-in">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
                <Moon className="w-8 h-8 text-yellow-300" />
                占い結果
                <Sun className="w-8 h-8 text-yellow-300" />
              </h2>

              {/* カード表示エリア */}
              <div className={`grid gap-6 mb-10 ${
                spreadType === 'three-card' 
                  ? 'grid-cols-1 md:grid-cols-3 max-w-3xl mx-auto' 
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
              }`}>
                {reading.cards.map((card, index) => (
                  <div key={index} className="flex flex-col items-center">
                    {spreadType === 'three-card' && (
                      <p className="text-white/80 text-sm mb-2 font-semibold">
                        {index === 0 ? '過去' : index === 1 ? '現在' : '未来'}
                      </p>
                    )}
                    <TarotCardVisual card={card} index={index} isResult={true} />
                  </div>
                ))}
              </div>

              {/* 解釈セクション */}
              <div className="prose prose-invert max-w-none">
                <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-lg p-6 backdrop-blur-sm border border-white/10">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    カードからのメッセージ
                  </h3>
                  <div className="text-gray-200 whitespace-pre-wrap leading-relaxed text-base">
                    {reading.interpretation}
                  </div>
                </div>
              </div>

              {/* もう一度占うボタン */}
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => {
                    setReading(null);
                    setQuestion('');
                    setShowCards(false);
                  }}
                  className="px-8 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all transform hover:scale-105 font-semibold shadow-lg"
                >
                  もう一度占う
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes sparkle {
          0%, 100% { 
            opacity: 0; 
            transform: scale(0) rotate(0deg); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1) rotate(180deg); 
          }
        }

        @keyframes flip {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(180deg); }
          100% { transform: rotateY(360deg); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }

        .animate-flip {
          animation: flip 2s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-in;
        }

        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }

        .animation-delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
}