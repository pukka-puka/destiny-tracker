'use client';

import { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function EmailAuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const validateForm = () => {
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return false;
    }
    
    if (isSignUp) {
      if (password.length < 6) {
        setError('パスワードは6文字以上で設定してください');
        return false;
      }
      if (password !== confirmPassword) {
        setError('パスワードが一致しません');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (isSignUp) {
        // 新規登録
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('新規登録成功:', userCredential.user.email);
        setSuccess('アカウントを作成しました！');
        // 即座にリダイレクト
        router.push('/palm');
      } else {
        // ログイン
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('ログイン成功:', userCredential.user.email);
        setSuccess('ログインしました！');
        // 即座にリダイレクト
        router.push('/palm');
      }
    } catch (error) {
      console.error('認証エラー:', error);
      
      // エラーメッセージを日本語化
      const firebaseError = error as { code?: string };
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          setError('このメールアドレスは既に使用されています');
          break;
        case 'auth/invalid-email':
          setError('無効なメールアドレスです');
          break;
        case 'auth/user-not-found':
          setError('アカウントが見つかりません');
          break;
        case 'auth/wrong-password':
          setError('パスワードが間違っています');
          break;
        case 'auth/weak-password':
          setError('パスワードが弱すぎます（6文字以上）');
          break;
        default:
          setError('認証エラーが発生しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('パスワードリセットメールを送信しました');
    } catch (resetError) {
      console.error('パスワードリセットエラー:', resetError);
      setError('メールの送信に失敗しました');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            メールアドレス
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            パスワード
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {isSignUp && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード（確認）
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="••••••••"
                required={isSignUp}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              {isSignUp ? '新規登録' : 'ログイン'}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccess(null);
            }}
            className="text-sm text-purple-600 hover:underline"
          >
            {isSignUp ? 'すでにアカウントをお持ちの方' : 'アカウントを新規作成'}
          </button>
          
          {!isSignUp && (
            <>
              <span className="text-gray-400 mx-2">|</span>
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-sm text-gray-600 hover:underline"
              >
                パスワードを忘れた方
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}