// src/app/payment/success/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 via-black to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 成功アイコン */}
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/50 animate-pulse">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -top-4 -right-4">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-bounce" />
          </div>
        </div>

        {/* メッセージ */}
        <h1 className="text-4xl font-bold text-white mb-4">
          お支払いが完了しました！
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          プレミアム機能をお楽しみください ✨
        </p>

        {/* セッションID（デバッグ用、本番では非表示推奨） */}
        {sessionId && (
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 mb-8 border border-white/10">
            <p className="text-sm text-gray-400 mb-1">セッションID</p>
            <p className="text-xs text-gray-500 font-mono break-all">
              {sessionId}
            </p>
          </div>
        )}

        {/* 案内 */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">
            アップグレード特典
          </h2>
          <ul className="space-y-2 text-left">
            <li className="flex items-start gap-2 text-gray-300">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>すべての占いが無制限で利用可能</span>
            </li>
            <li className="flex items-start gap-2 text-gray-300">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>AIチャットで24時間相談可能</span>
            </li>
            <li className="flex items-start gap-2 text-gray-300">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>詳細な分析レポートをPDFで取得</span>
            </li>
            <li className="flex items-start gap-2 text-gray-300">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>広告なしで快適に利用</span>
            </li>
          </ul>
        </div>

        {/* カウントダウン */}
        <div className="flex items-center justify-center gap-3 text-gray-400 mb-6">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p>
            {countdown}秒後にダッシュボードへ移動します...
          </p>
        </div>

        {/* ボタン */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
        >
          今すぐダッシュボードへ
        </button>

        {/* サポート */}
        <p className="text-sm text-gray-500 mt-6">
          ご不明な点がございましたら、
          <a
            href="mailto:support@destiny-tracker.com"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            サポート
          </a>
          までお問い合わせください
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-purple-900/20 via-black to-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
