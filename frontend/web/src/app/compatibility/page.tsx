'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Heart, Users, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import UsageLimitModal from '@/components/UsageLimitModal';

interface Person {
  name: string;
  birthDate: string;
}

export default function CompatibilityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [person1, setPerson1] = useState<Person>({ name: '', birthDate: '' });
  const [person2, setPerson2] = useState<Person>({ name: '', birthDate: '' });
  const [birthInput1, setBirthInput1] = useState('');
  const [birthInput2, setBirthInput2] = useState('');
  const [isValidBirth1, setIsValidBirth1] = useState(false);
  const [isValidBirth2, setIsValidBirth2] = useState(false);
  const [category] = useState<'love' | 'friendship' | 'work'>('love');
  const [showLimitModal, setShowLimitModal] = useState(false);

  // 生年月日のパース関数
  const parseBirthDate = (input: string): string | null => {
    const cleaned = input.replace(/[^0-9]/g, '');
    
    if (cleaned.length === 8) {
      const year = cleaned.substring(0, 4);
      const month = cleaned.substring(4, 6);
      const day = cleaned.substring(6, 8);
      return `${year}-${month}-${day}`;
    } else if (cleaned.length === 6) {
      const year = '19' + cleaned.substring(0, 2);
      const month = cleaned.substring(2, 4);
      const day = cleaned.substring(4, 6);
      return `${year}-${month}-${day}`;
    }
    
    return null;
  };

  // 生年月日の表示形式
  const formatBirthDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 生年月日1の入力ハンドラ
  const handleBirthInput1 = (value: string) => {
    setBirthInput1(value);
    const parsed = parseBirthDate(value);
    if (parsed) {
      setPerson1({ ...person1, birthDate: parsed });
      setIsValidBirth1(true);
    } else {
      setIsValidBirth1(false);
    }
  };

  // 生年月日2の入力ハンドラ
  const handleBirthInput2 = (value: string) => {
    setBirthInput2(value);
    const parsed = parseBirthDate(value);
    if (parsed) {
      setPerson2({ ...person2, birthDate: parsed });
      setIsValidBirth2(true);
    } else {
      setIsValidBirth2(false);
    }
  };

  const analyzeCompatibility = async () => {
    console.log('🔵 analyzeCompatibility 開始');
    console.log('person1:', person1);
    console.log('person2:', person2);
    console.log('category:', category);
    console.log('user?.uid:', user?.uid);

    if (!person1.name || !person1.birthDate || !person2.name || !person2.birthDate) {
      alert('すべての項目を入力してください');
      return;
    }

    if (!user?.uid) {
      alert('ログインが必要です');
      return;
    }

    setLoading(true);
    console.log('🔵 ステップを loading に変更');

    try {
      console.log('🔵 APIリクエスト送信前');
      const response = await fetch('/api/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person1,
          person2,
          category,
          userId: user.uid
        })
      });
      console.log('🔵 APIレスポンス受信:', response.status);

      if (response.status === 403) {
        const errorData = await response.json();
        setShowLimitModal(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('相性診断の実行に失敗しました');
      }

      const data = await response.json();
      console.log('🔵 レスポンスデータ:', data);

      // Firestoreに保存して結果ページにリダイレクト
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const docRef = await addDoc(collection(db, 'readings'), {
        userId: user.uid,
        readingType: 'compatibility',
        person1,
        person2,
        category,
        compatibilityReading: {
          person1,
          person2,
          overallScore: data.result.overallScore || data.result.overall || 0,
          interpretation: data.result.interpretation || '',
          advice: data.result.advice || '',
          strengths: data.result.strengths || [],
          challenges: data.result.challenges || [],
        },
        createdAt: serverTimestamp(),
      });
      
      console.log('✅ 相性診断結果を保存しました:', docRef.id);
      
      // 結果ページにリダイレクト
      router.push(`/compatibility/result/${docRef.id}`);

    } catch (error) {
      console.error('相性診断エラー:', error);
      alert('診断に失敗しました');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-800 to-red-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white text-xl mb-4">ログインが必要です</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-white text-pink-600 rounded-lg hover:bg-gray-100"
          >
            ホームへ戻る
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-800 to-red-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">相性を分析しています...</h2>
          <p className="text-pink-200">AI が二人の相性を詳しく分析中</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-800 to-red-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full p-4 mb-4">
            <Heart className="w-12 h-12 text-pink-200" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            相性診断
          </h1>
          <p className="text-pink-200 text-lg">
            数秘術と星座で二人の相性を詳しく分析
          </p>
        </div>

        {/* 入力フォーム */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* 人物1 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                あなた
              </h3>
              
              <div>
                <label className="block text-pink-200 mb-2">お名前</label>
                <input
                  type="text"
                  value={person1.name}
                  onChange={(e) => setPerson1({ ...person1, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-pink-200/50 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="山田太郎"
                />
              </div>

              <div>
                <label className="block text-pink-200 mb-2">生年月日</label>
                <div className="relative">
                  <input
                    type="text"
                    value={birthInput1}
                    onChange={(e) => handleBirthInput1(e.target.value)}
                    placeholder="19900101 または 900101"
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-pink-200/50 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  {isValidBirth1 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 flex items-center gap-2">
                      <span className="text-sm">{formatBirthDate(person1.birthDate)}</span>
                      <span>✓</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 人物2 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                相手
              </h3>
              
              <div>
                <label className="block text-pink-200 mb-2">お名前</label>
                <input
                  type="text"
                  value={person2.name}
                  onChange={(e) => setPerson2({ ...person2, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-pink-200/50 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="佐藤花子"
                />
              </div>

              <div>
                <label className="block text-pink-200 mb-2">生年月日</label>
                <div className="relative">
                  <input
                    type="text"
                    value={birthInput2}
                    onChange={(e) => handleBirthInput2(e.target.value)}
                    placeholder="19920515 または 920515"
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-pink-200/50 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  {isValidBirth2 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 flex items-center gap-2">
                      <span className="text-sm">{formatBirthDate(person2.birthDate)}</span>
                      <span>✓</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 診断ボタン */}
          <button
            onClick={analyzeCompatibility}
            disabled={loading}
            className="w-full mt-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                相性を診断する
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* 説明 */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center">
          <p className="text-pink-200">
            数秘術（ライフパスナンバー）と星座の相性を組み合わせて、
            <br className="hidden md:block" />
            二人の関係性を多角的に分析します
          </p>
        </div>
      </div>

      {/* 使用制限モーダル */}
      <UsageLimitModal 
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        featureName="相性診断"
      />
    </div>
  );
}
