// src/app/compatibility/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Heart, Users, Briefcase, Sparkles, Loader2, ArrowRight } from 'lucide-react';

interface Person {
  name: string;
  birthDate: string;
}

interface CompatibilityResult {
  overall: number;
  love: number;
  friendship: number;
  work: number;
  communication: number;
  trust: number;
  interpretation: string;
  strengths: string[];
  challenges: string[];
  advice: string[];
}

export default function CompatibilityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'input' | 'analyzing' | 'result'>('input');
  const [person1, setPerson1] = useState<Person>({ name: '', birthDate: '' });
  const [person2, setPerson2] = useState<Person>({ name: '', birthDate: '' });
  const [category, setCategory] = useState<'love' | 'friendship' | 'work'>('love');
  const [result, setResult] = useState<CompatibilityResult | null>(null);

  const analyzeCompatibility = async () => {
    if (!person1.name || !person1.birthDate || !person2.name || !person2.birthDate) {
      alert('すべての項目を入力してください');
      return;
    }

    setStep('analyzing');

    try {
      const response = await fetch('/api/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person1,
          person2,
          category
        })
      });

      const data = await response.json();
      setResult(data.result);
      setStep('result');
    } catch (error) {
      console.error('相性診断エラー:', error);
      alert('診断に失敗しました');
      setStep('input');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-800 to-red-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white text-xl mb-4">ログインが必要です</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30"
          >
            ホームへ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-800 to-red-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-white/80 hover:text-white mb-4"
          >
            ← ダッシュボードに戻る
          </button>
          
          <div className="inline-block p-4 bg-white/10 rounded-full mb-4">
            <Heart className="w-12 h-12 text-pink-200" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            相性診断
          </h1>
          <p className="text-pink-100/80 text-lg">
            生年月日から二人の相性を詳しく分析します
          </p>
        </div>

        {/* 入力画面 */}
        {step === 'input' && (
          <div className="space-y-6">
            {/* カテゴリー選択 */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">診断の種類を選択</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setCategory('love')}
                  className={`p-6 rounded-xl transition ${
                    category === 'love'
                      ? 'bg-pink-500/30 border-2 border-pink-400'
                      : 'bg-white/10 hover:bg-white/15'
                  }`}
                >
                  <Heart className="w-8 h-8 text-pink-300 mx-auto mb-3" />
                  <div className="text-white font-bold mb-1">恋愛相性</div>
                  <div className="text-white/70 text-sm">カップル向け</div>
                </button>

                <button
                  onClick={() => setCategory('friendship')}
                  className={`p-6 rounded-xl transition ${
                    category === 'friendship'
                      ? 'bg-pink-500/30 border-2 border-pink-400'
                      : 'bg-white/10 hover:bg-white/15'
                  }`}
                >
                  <Users className="w-8 h-8 text-pink-300 mx-auto mb-3" />
                  <div className="text-white font-bold mb-1">友情相性</div>
                  <div className="text-white/70 text-sm">友人同士</div>
                </button>

                <button
                  onClick={() => setCategory('work')}
                  className={`p-6 rounded-xl transition ${
                    category === 'work'
                      ? 'bg-pink-500/30 border-2 border-pink-400'
                      : 'bg-white/10 hover:bg-white/15'
                  }`}
                >
                  <Briefcase className="w-8 h-8 text-pink-300 mx-auto mb-3" />
                  <div className="text-white font-bold mb-1">仕事相性</div>
                  <div className="text-white/70 text-sm">ビジネスパートナー</div>
                </button>
              </div>
            </div>

            {/* 1人目の情報 */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">1人目の情報</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 mb-2">名前</label>
                  <input
                    type="text"
                    value={person1.name}
                    onChange={(e) => setPerson1({ ...person1, name: e.target.value })}
                    placeholder="山田太郎"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-pink-400"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 mb-2">生年月日</label>
                  <input
                    type="date"
                    value={person1.birthDate}
                    onChange={(e) => setPerson1({ ...person1, birthDate: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-pink-400"
                  />
                </div>
              </div>
            </div>

            {/* 2人目の情報 */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">2人目の情報</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 mb-2">名前</label>
                  <input
                    type="text"
                    value={person2.name}
                    onChange={(e) => setPerson2({ ...person2, name: e.target.value })}
                    placeholder="佐藤花子"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-pink-400"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 mb-2">生年月日</label>
                  <input
                    type="date"
                    value={person2.birthDate}
                    onChange={(e) => setPerson2({ ...person2, birthDate: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-pink-400"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={analyzeCompatibility}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl hover:from-pink-600 hover:to-rose-600 flex items-center justify-center gap-2"
            >
              相性を診断する
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 分析中画面 */}
        {step === 'analyzing' && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center">
            <Loader2 className="w-16 h-16 animate-spin text-pink-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">
              相性を分析しています...
            </h2>
            <p className="text-pink-100/80">
              生年月日から運命の相性を読み解いています
            </p>
          </div>
        )}

        {/* 結果画面 */}
        {step === 'result' && result && (
          <div className="space-y-6">
            {/* 総合相性 */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                {person1.name} ❤️ {person2.name}
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
                    strokeDasharray={`${result.overall * 5.53} 553`}
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
                    <div className="text-5xl font-bold text-white">{result.overall}</div>
                    <div className="text-pink-200 text-sm">/ 100</div>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">総合相性</h3>
              <p className="text-pink-100/80">
                {result.overall >= 80 ? '素晴らしい相性です！' :
                 result.overall >= 60 ? '良好な相性です' :
                 result.overall >= 40 ? '普通の相性です' :
                 '相性には課題があります'}
              </p>
            </div>

            {/* 詳細スコア */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">詳細スコア</h3>
              
              <div className="space-y-4">
                {[
                  { label: '恋愛', value: result.love, icon: '❤️' },
                  { label: '友情', value: result.friendship, icon: '🤝' },
                  { label: '仕事', value: result.work, icon: '💼' },
                  { label: 'コミュニケーション', value: result.communication, icon: '💬' },
                  { label: '信頼', value: result.trust, icon: '🛡️' }
                ].map((item, i) => (
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

            {/* AI解釈 */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-pink-400" />
                AI詳細分析
              </h3>
              <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                {result.interpretation}
              </p>
            </div>

            {/* 強み */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">✨ 二人の強み</h3>
              <ul className="space-y-3">
                {result.strengths.map((strength, i) => (
                  <li key={i} className="flex gap-3 text-white/90">
                    <span className="text-pink-400">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 課題 */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">⚠️ 注意すべき点</h3>
              <ul className="space-y-3">
                {result.challenges.map((challenge, i) => (
                  <li key={i} className="flex gap-3 text-white/90">
                    <span className="text-pink-400">•</span>
                    <span>{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* アドバイス */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">💡 関係を深めるためのアドバイス</h3>
              <ul className="space-y-3">
                {result.advice.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-white/90">
                    <span className="text-pink-400">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* アクション */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep('input');
                  setPerson1({ name: '', birthDate: '' });
                  setPerson2({ name: '', birthDate: '' });
                  setResult(null);
                }}
                className="flex-1 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20"
              >
                もう一度診断する
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl hover:from-pink-600 hover:to-rose-600"
              >
                ダッシュボードへ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}