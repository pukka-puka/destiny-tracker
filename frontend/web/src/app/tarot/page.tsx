'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { majorArcana, calculateParametersFromCards } from '@/data/tarot-cards';
import { Sparkles, RefreshCw, ArrowRight, Heart, Briefcase, DollarSign, Star } from 'lucide-react';
import Image from 'next/image';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getLuckyColor,
  getIntroText,
  getLuckyItem,
  getPowerTime,
  getLuckyDirection,
  getResultClosing,
  generateEnhancedFortuneSection
} from '@/lib/tarot-enhancements';
import { useAuth } from '@/contexts/AuthContext';
import UsageLimitModal from '@/components/UsageLimitModal';
import ShareButton from '@/components/ShareButton';

type TarotCategory = 'general' | 'love' | 'career' | 'money';

export default function TarotPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'shuffle' | 'select' | 'reveal' | 'reading' | 'result'>('intro');
  const [selectedCards, setSelectedCards] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TarotCategory>('general');
  const [isShuffling, setIsShuffling] = useState(false);
  const [interpretation, setInterpretation] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [revealedCards, setRevealedCards] = useState<boolean[]>([false, false, false]);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [savedReadingId, setSavedReadingId] = useState<string | null>(null);

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
        readingType: 'tarot',
        
        // ⭐ トップレベルに移動
        category: selectedCategory,
        parameters: parameters,
        
        // カード情報もトップレベルに
        cards: selectedCards.map(card => ({
          id: card.id,
          name: card.name,
          nameJa: card.nameJa,
          meaning: card.meaning,
          reversed: card.isReversed || false
        })),
        
        interpretation: interpretation,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'readings'), readingData);
      setSavedReadingId(docRef.id);
      console.log('✅ Firestore保存成功:', docRef.id);

      saveToLocalStorage({
        ...readingData,
        id: docRef.id,
        createdAt: new Date().toISOString()
      });

      alert('占い結果を保存しました！');
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
    
    // ユーザーIDの確認
    if (!user?.uid) {
      alert('ログインが必要です');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/divination/tarot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `私の${categories.find(c => c.id === selectedCategory)?.label}を詳しく教えてください`,
          spreadType: 'three-card',
          userId: user.uid
        })
      });

      // 403エラー（使用制限）のハンドリング
      if (response.status === 403) {
        const errorData = await response.json();
        setShowLimitModal(true);
        setLoading(false);
        return;
      }

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

  const generateInterpretation = (cards: any[]): string => {
    const past = cards[0];
    const present = cards[1];
    const future = cards[2];

    const categoryLabel = categories.find(c => c.id === selectedCategory)?.label || '運勢';

    // ★★★ ここから追加・変更 ★★★
    
    // シード値を生成（毎回違う導入文を表示するため）
    const seed = Date.now();
    
    // 改善された導入テキストを取得
    const introText = getIntroText(selectedCategory, seed);
    
    // 改善されたラッキーカラー取得
    const luckyColorData = getLuckyColor(cards);
    
    // 改善されたラッキーアイテム取得
    const luckyItem = getLuckyItem(cards);
    
    // パワータイム取得
    const powerTime = getPowerTime(cards);
    
    // 開運の方位取得
    const direction = getLuckyDirection(cards);
    
    // 結果の締めくくり文を取得
    const closing = getResultClosing(seed);

    // ★★★ ここまで追加 ★★★

    return `
━━━━━━━━━━━━━━━━━
✨ ${introText.greeting}
━━━━━━━━━━━━━━━━━

${introText.context}

${introText.transition}

━━━━━━━━━━━━━━━━━
🌟 総合的なメッセージ
━━━━━━━━━━━━━━━━━

${categoryLabel}について、タロットカードがあなたに伝えるメッセージがあります。
過去の${past.nameJa}、現在の${present.nameJa}、そして未来の${future.nameJa}。
この3枚のカードは、あなたの人生における重要な転換点を示しています。

${past.nameJa}が過去の位置で現れたということは、${past.meaning}という経験を通じて、
今のあなたが形成されてきたことを意味します。この経験は決して無駄ではなく、
現在のあなたを支える大切な基盤となっているのです。

現在の${present.nameJa}は、${present.meaning}というエネルギーが今まさにあなたの人生で
活発に働いていることを示しています。この時期は${categoryLabel}において、
特に重要な意味を持つ時間です。

そして未来。${future.nameJa}が示す${future.meaning}は、あなたが進むべき道の先に
待っている可能性を暗示しています。この未来は確定されたものではなく、
あなたの選択と行動によって形作られていくものです。

━━━━━━━━━━━━━━━━━
⏰ 過去：${past.nameJa}${past.isReversed ? '（逆位置）' : '（正位置）'}
━━━━━━━━━━━━━━━━━

【カードの意味】
${past.meaning}

【あなたの過去が語ること】
${past.nameJa}が過去の位置に現れたことは、大きな意味を持ちます。
${past.isReversed ? 
  '逆位置で現れたこのカードは、あなたが過去に経験した困難や未解決の課題を示しています。しかし、それらは今のあなたを形作る重要な要素となっています。' : 
  '正位置のこのカードは、あなたの過去における肯定的な経験や成長の証です。'}

${categoryLabel}という観点から見ると、あなたは${past.meaning.split('、')[0]}という体験を通じて、
多くを学んできました。${selectedCategory === 'love' ? 
  '過去の恋愛経験や人間関係が、今のあなたの愛に対する理解を深めてきたのです。' : 
  selectedCategory === 'career' ? 
  'これまでの仕事での経験や挑戦が、今のあなたの専門性と自信を育ててきました。' : 
  selectedCategory === 'money' ? 
  '金銭に関する過去の選択や経験が、今の経済観念を形成してきたのです。' : 
  'これまでの人生経験すべてが、今のあなたを作り上げる礎となっています。'}

この過去があったからこそ、今のあなたがあります。
過去を否定するのではなく、そこから得た教訓を現在に活かすことが大切です。

━━━━━━━━━━━━━━━━━
🌸 現在：${present.nameJa}${present.isReversed ? '（逆位置）' : '（正位置）'}
━━━━━━━━━━━━━━━━━

【カードの意味】
${present.meaning}

【今、この瞬間のあなた】
現在の位置に${present.nameJa}が現れたことは、非常に重要なサインです。
${present.isReversed ? 
  '逆位置のこのカードは、現在直面している課題や、まだ十分に発揮できていないポテンシャルを示しています。' : 
  '正位置のこのカードは、あなたが今、正しい方向に進んでいることを示す強力なサインです。'}

${present.nameJa}の本質である${present.meaning}は、今のあなたにとって最も重要なテーマです。
${selectedCategory === 'love' ? 
  '恋愛において、このカードが示すエネルギーを意識することで、関係性は大きく深まります。' : 
  selectedCategory === 'career' ? 
  '仕事面で、このカードの教えを実践することが、キャリアの飛躍につながります。' : 
  selectedCategory === 'money' ? 
  '金運において、このカードの示す方向性を信じることが、豊かさへの道を開きます。' : 
  '人生全般において、このカードのメッセージは今最も必要な指針となるでしょう。'}

今この瞬間、あなたは岐路に立っています。
${present.nameJa}のエネルギーを理解し、それと調和することで、
あなたの${categoryLabel}は新たな次元へと進化します。

重要なのは、焦らないことです。
${present.meaning.split('、')[1] || present.meaning.split('、')[0]}という要素を、
じっくりと自分のものにしていく時間が必要です。

━━━━━━━━━━━━━━━━━
🔮 未来：${future.nameJa}${future.isReversed ? '（逆位置）' : '（正位置）'}
━━━━━━━━━━━━━━━━━

【カードの意味】
${future.meaning}

【未来の可能性】
${future.nameJa}が未来の位置に出たことは、あなたの${categoryLabel}における
重要な展開を予告しています。
${future.isReversed ? 
  '逆位置は、予想外の形での展開や、違った角度からのアプローチが必要であることを示しています。柔軟な姿勢が成功の鍵です。' : 
  '正位置は、あなたの努力が報われ、望む方向へと物事が進んでいくことを強く示唆しています。'}

${future.meaning.split('、')[0]}というテーマは、あなたの${categoryLabel}における到達点です。
近い将来、${selectedCategory === 'love' ? 
  '素晴らしい出会いや既存の関係の深まり、または新たな愛の形' : 
  selectedCategory === 'career' ? 
  '仕事での大きな成果、新たなチャンスの到来、またはキャリアの転換点' : 
  selectedCategory === 'money' ? 
  '経済的な安定、予期せぬ収入、または新たな収入源の発見' : 
  '人生における重要な達成、新しい章の始まり、または深い自己理解'}
が期待できます。

ただし、この未来は確定されたものではありません。
${future.nameJa}が示すのは「可能性」であり、それを現実にするのはあなた自身の選択と行動です。
カードはあなたに道を示しますが、その道を歩むのはあなたなのです。

${closing.transition}

━━━━━━━━━━━━━━━━━
💫 3枚のカードが紡ぐストーリー
━━━━━━━━━━━━━━━━━

過去の${past.nameJa}、現在の${present.nameJa}、そして未来の${future.nameJa}。
この3枚のカードの組み合わせは、あなたの${categoryLabel}における
完全な物語を描いています。

過去の${past.meaning.split('、')[0]}という経験から始まり、
現在の${present.meaning.split('、')[0]}という状況を経て、
未来の${future.meaning.split('、')[0]}へと向かう流れ。
これは人生における自然な進化のプロセスそのものです。

特に注目すべきは、これら3枚のカードが示すエネルギーの流れです。
過去から現在、現在から未来へと、エネルギーは確実に変容しています。
あなたは停滞しているのではなく、確実に前進しているのです。

${categoryLabel}において、あなたは今、新たなステージへの移行期にあります。
過去の学びを活かし、現在の課題に取り組み、未来の可能性に向けて歩を進める。
このサイクルを理解することで、あなたの人生はより豊かになるでしょう。

━━━━━━━━━━━━━━━━━
🎯 具体的なアドバイス
━━━━━━━━━━━━━━━━━

カードからのメッセージを日常生活に活かすために、以下のことを心がけてください：

**今週中に取るべき行動**
${selectedCategory === 'love' ? 
  '大切な人との時間を意識的に作り、素直な気持ちを言葉で伝えましょう。小さな感謝の言葉が、関係性を大きく深めます。また、新しい出会いの場にも積極的に足を運んでみてください。' : 
  selectedCategory === 'career' ? 
  '先延ばしにしていたプロジェクトや課題に着手しましょう。小さな一歩でも前進させることが重要です。また、上司や同僚とのコミュニケーションを積極的に取り、協力関係を強化してください。' : 
  selectedCategory === 'money' ? 
  '収支を詳しく見直し、将来のための貯蓄計画を具体的に立てましょう。無駄な支出を見直すとともに、新たな収入源の可能性も探ってみてください。投資の勉強を始めるのも良い時期です。' : 
  '自分の本当の願いを紙に書き出し、それに向けた具体的な行動計画を立てましょう。大きな目標を小さなステップに分解することで、実現可能性が高まります。'}

**意識すべきポイント**
現在のカード${present.nameJa}が示すように、${present.meaning.split('、')[1] || present.meaning.split('、')[0]}を
大切にすることが、今のあなたに最も必要です。このエネルギーを意識的に取り入れ、
日常の選択の基準としてください。

**避けるべきこと**
${past.isReversed || present.isReversed || future.isReversed ? 
  '過度な期待や焦りは禁物です。物事には自然な流れとタイミングがあります。焦らず、今できることに集中しましょう。また、逆位置のカードが示す課題から目を背けることなく、正面から向き合う勇気を持ってください。' : 
  '現状に満足しすぎて成長を止めないでください。カードが示す肯定的な流れに乗りながらも、常に学びと進化を求める姿勢を忘れずに。自己満足は停滞の始まりです。'}

**心に留めておくべき言葉**
「${future.nameJa}」が示す未来は、あなたの手の中にあります。
運命は決まっているのではなく、あなたが毎日の選択で創り上げていくものです。
カードは可能性を示しますが、それを現実にするのはあなた自身なのです。

━━━━━━━━━━━━━━━━━
🍀 開運ポイント
━━━━━━━━━━━━━━━━━

**ラッキーカラー**: ${luckyColorData.color}
${luckyColorData.meaning}を象徴し、${luckyColorData.energy}をもたらします。
この色を身につけたり、部屋のアクセントとして取り入れることで、運気の流れが良くなります。
${luckyColorData.color}の小物を持ち歩くだけでも効果的です。

**ラッキーアイテム**: ${luckyItem}
このアイテムを活用することで、カードのエネルギーとより深くつながることができます。
毎日触れたり目にする場所に置くことで、無意識レベルで運気を高められます。

**パワータイム**: ${powerTime.time}
${powerTime.reason}。
この時間帯に重要な決断や行動を起こすと、より良い結果を引き寄せやすくなります。
毎日この時間を意識して過ごしてみてください。

**開運の方位**: ${direction}
この方角を意識して行動すると、良い流れを引き寄せやすくなります。
座る位置、デスクの配置、散歩の方向など、日常で取り入れてみましょう。

**おすすめの行動**
- 朝起きたら窓を開けて新鮮な空気を取り入れる
- ${luckyColorData.color}の服や小物を身につける
- ${powerTime.time}に重要なことをする
- ${direction}の方角を向いて瞑想や深呼吸をする
- ${luckyItem}を身近に置く

━━━━━━━━━━━━━━━━━
✨ 最後のメッセージ
━━━━━━━━━━━━━━━━━

${closing.opening}

タロットカードは、あなたの内なる知恵と宇宙のエネルギーをつなぐ架け橋です。
今回の占いで示されたメッセージは、あなたの潜在意識がすでに知っていることを、
意識の表面に引き上げるためのものでもあります。

${categoryLabel}において、あなたは正しい道を歩んでいます。
時に迷い、時に立ち止まることがあっても、それは成長のプロセスの一部です。
${past.nameJa}の経験、${present.nameJa}の学び、${future.nameJa}の可能性。
これらすべてが、あなたという存在を形作る大切な要素なのです。

${closing.advice}

カードが示した方向へ、自信を持って進んでください。
宇宙はあなたの味方であり、あなたの成功と幸福を応援しています。

${closing.closing}

🌙 占い師より愛を込めて

━━━━━━━━━━━━━━━━━
📅 占い実施日時: ${new Date().toLocaleString('ja-JP')}
🎴 使用したカード: ${past.nameJa}、${present.nameJa}、${future.nameJa}
📂 カテゴリー: ${categoryLabel}
━━━━━━━━━━━━━━━━━
`;
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

            {/* ⭐ ここから追加 ⭐ */}
            
            {/* パラメータスコア表示 */}
            <div className="w-full max-w-4xl bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                🌟 運勢パラメーター
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(calculateParametersFromCards(selectedCards)).map(([key, value]) => (
                  <div key={key} className="bg-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">
                        {key === 'love' ? '❤️ 恋愛運' : 
                         key === 'career' ? '💼 仕事運' :
                         key === 'money' ? '💰 金運' :
                         key === 'health' ? '🏃 健康運' :
                         key === 'social' ? '👥 対人運' : '🌱 成長運'}
                      </span>
                      <span className="text-yellow-300 font-bold text-xl">{value}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-yellow-300 to-pink-300 h-2 rounded-full transition-all"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 開運ポイント */}
            <div className="w-full max-w-4xl bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                🍀 開運ポイント
              </h3>
              <div className="grid grid-cols-2 gap-4 text-white">
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-sm text-purple-200 mb-1">ラッキーカラー</p>
                  <p className="text-lg font-bold">{getLuckyColor(selectedCards).color}</p>
                  <p className="text-xs text-purple-200 mt-1">{getLuckyColor(selectedCards).meaning}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-sm text-purple-200 mb-1">ラッキーナンバー</p>
                  <p className="text-lg font-bold">
                    {selectedCards.reduce((sum, card) => sum + parseInt(card.id), 0) % 9 + 1}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-sm text-purple-200 mb-1">ラッキーアイテム</p>
                  <p className="text-lg font-bold">{getLuckyItem(selectedCards)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-sm text-purple-200 mb-1">パワータイム</p>
                  <p className="text-lg font-bold">{getPowerTime(selectedCards).time}</p>
                </div>
              </div>
            </div>

            {/* ⭐ ここまで追加 ⭐ */}

            <div className="flex gap-4 mb-8">
              <button
                onClick={() => {
                  setStep('intro');
                  setSelectedCards([]);
                  setInterpretation('');
                  setRevealedCards([false, false, false]);
                  setSavedReadingId(null);
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

            {/* シェアボタン */}
            {savedReadingId && (
              <div className="mt-8 flex justify-center">
                <ShareButton 
                  type="tarot" 
                  resultId={savedReadingId}
                  userId={user?.uid}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 使用制限モーダルを追加 */}
      <UsageLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        featureName="タロット占い"
      />

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