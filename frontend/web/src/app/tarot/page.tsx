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
  const [step, setStep] = useState<'intro' | 'shuffle' | 'select' | 'reading' | 'result'>('intro');
  const [selectedCards, setSelectedCards] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TarotCategory>('general');
  const [isShuffling, setIsShuffling] = useState(false);
  const [interpretation, setInterpretation] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const categories: Array<{ id: TarotCategory; label: string; icon: any; color: string }> = [
    { id: 'general', label: '総合運', icon: Star, color: 'from-purple-500 to-pink-500' },
    { id: 'love', label: '恋愛運', icon: Heart, color: 'from-pink-500 to-red-500' },
    { id: 'career', label: '仕事運', icon: Briefcase, color: 'from-blue-500 to-cyan-500' },
    { id: 'money', label: '金運', icon: DollarSign, color: 'from-yellow-500 to-orange-500' }
  ];

  // 認証の初期化
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 認証状態を監視
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!user) {
            // ユーザーがいなければ匿名認証
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
        setAuthReady(true); // エラーでも続行
      }
    };

    initAuth();
  }, []);

  // カード画像のマッピング
  const getCardImagePath = (cardName: string): string => {
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
    return imageMap[cardName];
  };

  // LocalStorage保存
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

  // Firestore保存（修正版）
  const saveReading = async () => {
    if (saving) return;
    
    setSaving(true);
    console.log('=== 保存開始 ===');

    try {
      // 1. 認証確認
      if (!authReady) {
        console.log('認証が未完了です。待機中...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      let currentUser = auth.currentUser;
      console.log('現在のユーザー:', currentUser?.uid);

      if (!currentUser) {
        console.log('ユーザーがいないため匿名認証を実行...');
        const result = await signInAnonymously(auth);
        currentUser = result.user;
        console.log('匿名認証成功:', currentUser.uid);
      }

      // 2. データ検証
      if (!interpretation) {
        console.error('解釈が空です');
        alert('占い結果が生成されていません');
        setSaving(false);
        return;
      }

      if (!selectedCards || selectedCards.length === 0) {
        console.error('カードが選択されていません');
        alert('カードを選択してください');
        setSaving(false);
        return;
      }

      // 3. 保存データ作成
      const readingData = {
        userId: currentUser.uid,
        cards: selectedCards.map(card => ({
          id: card.id,
          name: card.name,
          nameJa: card.nameJa,
          meaning: card.meaning,
          reversed: card.reversed || false
        })),
        interpretation: interpretation,
        category: selectedCategory,
        createdAt: serverTimestamp(),
        type: 'tarot'
      };

      console.log('保存データ:', readingData);

      // 4. Firestoreに保存
      const docRef = await addDoc(collection(db, 'readings'), readingData);
      console.log('✅ Firestore保存成功:', docRef.id);

      // 5. LocalStorageにも保存
      saveToLocalStorage({
        ...readingData,
        createdAt: new Date().toISOString()
      });

      // 6. ダッシュボードへ遷移
      alert('占い結果を保存しました！');
      router.push('/dashboard');

    } catch (error: any) {
      console.error('=== 保存エラー ===');
      console.error('エラー詳細:', error);
      console.error('エラーコード:', error?.code);
      console.error('エラーメッセージ:', error?.message);
      
      alert(`保存に失敗しました: ${error?.message || '不明なエラー'}`);
    } finally {
      setSaving(false);
    }
  };

  // カードをシャッフル
  const handleShuffle = async () => {
    setIsShuffling(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsShuffling(false);
    setStep('select');
  };

  // カードを選択
  const handleSelectCard = (card: any) => {
    if (selectedCards.length < 3 && !selectedCards.find(c => c.id === card.id)) {
      const newCards = [...selectedCards, card];
      setSelectedCards(newCards);
      
      if (newCards.length === 3) {
        setStep('reading');
        generateReading(newCards);
      }
    }
  };

  // AI解釈生成
  const generateReading = async (cards: any[]) => {
    setLoading(true);
    try {
      const response = await fetch('/api/divination/tarot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: cards.map(c => ({
            name: c.nameJa,
            meaning: c.meaning,
            reversed: c.reversed || false
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

  // イントロ画面
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 text-white p-4">
        <div className="max-w-6xl mx-auto">
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
              className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 rounded-xl font-bold text-lg hover:scale-105 transition-transform"
            >
              カードをシャッフルする
              <ArrowRight className="inline ml-2" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // シャッフル画面
  if (step === 'shuffle') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className={`w-20 h-20 mx-auto mb-6 text-yellow-300 ${isShuffling ? 'animate-spin' : ''}`} />
          <h2 className="text-3xl font-bold mb-4">カードをシャッフル中...</h2>
          <p className="text-purple-200 mb-8">心を落ち着けて、質問に集中してください</p>
          {!isShuffling && (
            <button
              onClick={handleShuffle}
              className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 rounded-xl font-bold text-lg hover:scale-105 transition-transform"
            >
              シャッフル開始
            </button>
          )}
        </div>
      </div>
    );
  }

  // カード選択画面
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 text-white p-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">3枚のカードを選んでください</h2>
          <p className="text-center text-purple-200 mb-8">
            選択済み: {selectedCards.length}/3
          </p>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {majorArcana.map((card) => (
              <div
                key={card.id}
                onClick={() => handleSelectCard(card)}
                className={`cursor-pointer transform transition-all hover:scale-105 ${
                  selectedCards.find(c => c.id === card.id) ? 'opacity-50' : ''
                }`}
              >
                <div className="bg-purple-800/50 rounded-lg p-2">
                  <Image
                    src={`/tarot-cards/${getCardImagePath(card.nameJa)}.jpg`}
                    alt={card.nameJa}
                    width={120}
                    height={210}
                    className="rounded"
                  />
                  <p className="text-center mt-2 text-sm">{card.nameJa}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 解釈生成中
  if (step === 'reading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-20 h-20 mx-auto mb-6 text-yellow-300 animate-pulse" />
          <h2 className="text-3xl font-bold mb-4">カードを読み取り中...</h2>
          <p className="text-purple-200">AIがあなたの運命を解釈しています</p>
        </div>
      </div>
    );
  }

  // 結果表示
  if (step === 'result') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">あなたの占い結果</h2>

          <div className="flex justify-center gap-4 mb-8">
            {selectedCards.map((card, index) => (
              <div key={card.id} className="text-center">
                <Image
                  src={`/tarot-cards/${getCardImagePath(card.nameJa)}.jpg`}
                  alt={card.nameJa}
                  width={150}
                  height={263}
                  className="rounded-lg shadow-xl"
                />
                <p className="mt-2 font-semibold">{card.nameJa}</p>
                <p className="text-sm text-purple-300">
                  {index === 0 ? '過去' : index === 1 ? '現在' : '未来'}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-purple-800/50 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">解釈</h3>
            <p className="whitespace-pre-wrap leading-relaxed">{interpretation}</p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setStep('intro');
                setSelectedCards([]);
                setInterpretation('');
              }}
              className="px-6 py-3 bg-purple-700 hover:bg-purple-600 rounded-lg transition"
            >
              もう一度占う
            </button>
            
            <button
              onClick={saveReading}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 rounded-lg font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '結果を保存'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}