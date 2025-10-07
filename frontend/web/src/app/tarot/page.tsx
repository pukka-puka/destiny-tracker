'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { majorArcana, calculateParametersFromCards } from '@/data/tarot-cards';
import { Sparkles, RefreshCw, ArrowRight, Heart, Briefcase, DollarSign, Star } from 'lucide-react';
import Image from 'next/image';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

type TarotCategory = 'general' | 'love' | 'career' | 'money';

export default function TarotPage() {
  const router = useRouter();
  const [step, setStep] = useState<'intro' | 'shuffle' | 'select' | 'reveal' | 'reading' | 'result'>('intro');
  const [selectedCards, setSelectedCards] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TarotCategory>('general');
  const [isShuffling, setIsShuffling] = useState(false);
  const [interpretation, setInterpretation] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [revealedCards, setRevealedCards] = useState<boolean[]>([false, false, false]);

  const categories: Array<{ id: TarotCategory; label: string; icon: any; color: string }> = [
    { id: 'general', label: '総合運', icon: Star, color: 'from-purple-500 to-pink-500' },
    { id: 'love', label: '恋愛運', icon: Heart, color: 'from-pink-500 to-red-500' },
    { id: 'career', label: '仕事運', icon: Briefcase, color: 'from-blue-500 to-cyan-500' },
    { id: 'money', label: '金運', icon: DollarSign, color: 'from-yellow-500 to-orange-500' }
  ];

  useEffect(() => {
    const initAuth = async () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!user) {
            console.log('匿名認証を開始...');
            await signInAnonymously(auth);
          } else {
            console.log('認証済み:', user.uid);
          }
          setAuthReady(true);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error('認証エラー:', error);
        setAuthReady(true);
      }
    };
    initAuth();
  }, []);

  const getCardImageName = (cardName: string): string => {
    const imageMap: { [key: string]: string } = {
      '愚者': '00-fool',
      '魔術師': '01-magician',
      '女教皇': '02-high-priestess',
      '女帝': '03-empress',
      '皇帝': '04-emperor',
      '教皇': '05-hierophant',
      '恋人': '06-lovers',
      '戦車': '07-chariot',
      '力': '08-strength',
      '隠者': '09-hermit',
      '運命の輪': '10-wheel-of-fortune',
      '正義': '11-justice',
      '吊された男': '12-hanged-man',
      '死神': '13-death',
      '節制': '14-temperance',
      '悪魔': '15-devil',
      '塔': '16-tower',
      '星': '17-star',
      '月': '18-moon',
      '太陽': '19-sun',
      '審判': '20-judgement',
      '世界': '21-world'
    };
    return imageMap[cardName] || '00-fool';
  };

  const saveToLocalStorage = (readingData: any) => {
    try {
      const history = JSON.parse(localStorage.getItem('tarot-history') || '[]');
      const newEntry = {
        ...readingData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      history.unshift(newEntry);
      if (history.length > 50) history.splice(50);
      localStorage.setItem('tarot-history', JSON.stringify(history));
      console.log('✅ LocalStorageに保存成功');
    } catch (error) {
      console.error('LocalStorage保存エラー:', error);
    }
  };

  const saveReading = async () => {
    if (saving) return;
    setSaving(true);
    console.log('=== 保存開始 ===');

    try {
      if (!authReady) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      let currentUser = auth.currentUser;
      if (!currentUser) {
        const result = await signInAnonymously(auth);
        currentUser = result.user;
      }

      if (!interpretation || !selectedCards || selectedCards.length === 0) {
        alert('占い結果が生成されていません');
        setSaving(false);
        return;
      }

      // カードからパラメータを計算
      const parameters = calculateParametersFromCards(selectedCards);
      console.log('計算されたパラメータ:', parameters);

      const readingData = {
        userId: currentUser.uid,
        cards: selectedCards.map(card => ({
          id: card.id,
          name: card.name,
          nameJa: card.nameJa,
          meaning: card.meaning,
          reversed: card.isReversed || false
        })),
        interpretation: interpretation,
        category: selectedCategory,
        parameters: parameters, // パラメータを追加
        createdAt: serverTimestamp(),
        type: 'tarot'
      };

      await addDoc(collection(db, 'readings'), readingData);
      console.log('✅ Firestore保存成功');

      saveToLocalStorage({
        ...readingData,
        createdAt: new Date().toISOString()
      });

      alert('占い結果を保存しました！');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('=== 保存エラー ===', error);
      alert(`保存に失敗しました: ${error?.message || '不明なエラー'}`);
    } finally {
      setSaving(false);
    }
  };

  const shuffleCards = () => {
    setIsShuffling(true);
    setTimeout(() => {
      setIsShuffling(false);
      setStep('select');
    }, 2000);
  };

  const selectCard = (index: number) => {
    if (selectedCards.length >= 3) return;
    
    const randomCard = majorArcana[Math.floor(Math.random() * majorArcana.length)];
    const newCard = {
      ...randomCard,
      position: selectedCards.length,
      isReversed: Math.random() > 0.5
    };
    
    const newSelectedCards = [...selectedCards, newCard];
    setSelectedCards(newSelectedCards);
    
    if (newSelectedCards.length === 3) {
      setTimeout(() => {
        setStep('reveal');
        // カードを1枚ずつリビール
        revealCardsSequentially();
      }, 500);
    }
  };

  // カードを順番にリビール
  const revealCardsSequentially = () => {
    setTimeout(() => setRevealedCards([true, false, false]), 500);
    setTimeout(() => setRevealedCards([true, true, false]), 1500);
    setTimeout(() => {
      setRevealedCards([true, true, true]);
      setTimeout(() => {
        setStep('reading');
        getInterpretation(selectedCards);
      }, 1000);
    }, 2500);
  };

  const getInterpretation = async (cards: any[]) => {
    setLoading(true);
    try {
      const response = await fetch('/api/divination/tarot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: cards.map(c => ({
            name: c.nameJa,
            meaning: c.meaning,
            reversed: c.isReversed || false
          })),
          category: selectedCategory
        })
      });

      if (!response.ok) throw new Error('API呼び出しに失敗しました');

      const data = await response.json();
      setInterpretation(data.interpretation);
      setStep('result');
    } catch (error) {
      console.error('解釈生成エラー:', error);
      alert('占い結果の生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* イントロ */}
        {step === 'intro' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
            <Sparkles className="w-16 h-16 mb-6 text-yellow-300 animate-pulse" />
            <h1 className="text-4xl font-bold mb-4">タロット占い</h1>
            <p className="text-xl mb-8 text-purple-200">
              AIが導く、あなたの運命のメッセージ
            </p>
            
            <div className="mb-8">
              <p className="mb-4 text-purple-300">占いたい内容を選んでください</p>
              <div className="grid grid-cols-2 gap-4">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                        selectedCategory === cat.id
                          ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                          : 'bg-purple-800/50 text-purple-200 hover:bg-purple-700/50'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setStep('shuffle')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105"
            >
              占いを始める
            </button>
          </div>
        )}

        {/* シャッフル */}
        {step === 'shuffle' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <h2 className="text-3xl font-bold mb-8">カードをシャッフル中...</h2>
            <div className="relative w-48 h-72 mb-8">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-2xl transform ${
                    isShuffling ? 'animate-shuffle' : ''
                  }`}
                  style={{
                    transform: `rotate(${i * 5 - 10}deg) translateX(${i * 2}px)`,
                    zIndex: 5 - i
                  }}
                >
                  <div className="w-full h-full rounded-lg border-2 border-purple-300 opacity-50" />
                </div>
              ))}
            </div>
            {!isShuffling && (
              <button
                onClick={shuffleCards}
                className="px-6 py-3 bg-yellow-500 text-purple-900 rounded-full font-semibold hover:bg-yellow-400 transition"
              >
                シャッフルする
              </button>
            )}
          </div>
        )}

        {/* カード選択 */}
        {step === 'select' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <h2 className="text-3xl font-bold mb-4">カードを3枚選んでください</h2>
            <p className="text-purple-200 mb-8">{selectedCards.length}/3 枚選択済み</p>
            
            <div className="grid grid-cols-7 gap-2 mb-8">
              {[...Array(22)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => selectCard(i)}
                  disabled={selectedCards.length >= 3}
                  className="w-16 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg hover:shadow-2xl transition-all transform hover:scale-110 hover:-translate-y-2 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0"
                >
                  <div className="w-full h-full rounded-lg border border-purple-300 opacity-50" />
                </button>
              ))}
            </div>

            {selectedCards.length > 0 && (
              <div className="flex gap-4">
                {['過去', '現在', '未来'].map((label, i) => (
                  <div key={i} className="text-center">
                    <p className="text-sm mb-2">{label}</p>
                    <div className={`w-20 h-32 rounded-lg border-2 ${
                      selectedCards[i] 
                        ? 'border-yellow-400 bg-gradient-to-br from-purple-600 to-pink-600' 
                        : 'border-purple-500 border-dashed'
                    }`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* カードリビール */}
        {step === 'reveal' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <h2 className="text-3xl font-bold mb-8">あなたが選んだカード</h2>
            <div className="flex gap-8 mb-8">
              {selectedCards.map((card, i) => {
                const imageName = getCardImageName(card.nameJa);
                return (
                  <div key={i} className="text-center">
                    <p className="text-lg mb-2 text-yellow-300">{['過去', '現在', '未来'][i]}</p>
                    <div className="w-32 h-48 rounded-lg shadow-2xl overflow-hidden transition-all duration-500">
                      {revealedCards[i] ? (
                        <img
                          src={`/tarot-cards/${imageName}.jpg`}
                          alt={card.nameJa}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 border-2 border-purple-300" />
                      )}
                    </div>
                    {revealedCards[i] && (
                      <p className="mt-2 text-sm text-purple-200 animate-fade-in">
                        {card.nameJa}{card.isReversed ? '（逆位置）' : ''}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI解釈中 */}
        {(step === 'reading' || loading) && (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-300 mx-auto mb-4"></div>
              <p className="text-xl text-purple-200 animate-pulse">
                AIがカードの意味を解釈中...
              </p>
              <p className="text-sm text-purple-300 mt-2">
                詳細な占い結果を生成しています
              </p>
            </div>
          </div>
        )}

        {/* 結果表示 */}
        {step === 'result' && !loading && (
          <div className="flex flex-col items-center py-12">
            <h2 className="text-3xl font-bold mb-8">
              {categories.find(c => c.id === selectedCategory)?.label}の占い結果
            </h2>
            
            <div className="flex gap-8 mb-12">
              {selectedCards.map((card, i) => {
                const imageName = getCardImageName(card.nameJa);
                return (
                  <div key={i} className="text-center">
                    <p className="text-lg mb-2 text-yellow-300">{['過去', '現在', '未来'][i]}</p>
                    <div className="w-32 h-48 rounded-lg shadow-2xl overflow-hidden transform hover:scale-110 transition-transform">
                      <img
                        src={`/tarot-cards/${imageName}.jpg`}
                        alt={card.nameJa}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="mt-2 text-sm text-purple-200">
                      {card.nameJa}{card.isReversed ? '（逆位置）' : ''}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="max-w-4xl w-full bg-purple-800/50 backdrop-blur rounded-xl p-8 mb-8">
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-purple-100 leading-relaxed text-lg">
                  {interpretation}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep('intro');
                  setSelectedCards([]);
                  setInterpretation('');
                  setRevealedCards([false, false, false]);
                }}
                className="px-6 py-3 bg-purple-600 rounded-full font-semibold hover:bg-purple-700 transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                もう一度占う
              </button>
              
              <button
                onClick={saveReading}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-purple-900 rounded-full font-semibold hover:from-yellow-600 hover:to-orange-600 transition flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? '保存中...' : '結果を保存'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shuffle {
          0%, 100% { transform: translateX(0) rotateZ(0deg); }
          25% { transform: translateX(-20px) rotateZ(-5deg); }
          75% { transform: translateX(20px) rotateZ(5deg); }
        }
        .animate-shuffle {
          animation: shuffle 0.5s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}