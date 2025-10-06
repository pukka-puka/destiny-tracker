// src/hooks/useAuth.tsx
'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ユーザープロファイルをFirestoreに保存
  const saveUserProfile = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // 新規ユーザーの場合
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          plan: 'free',
          credits: 10 // 初回クレジット
        });
      } else {
        // 既存ユーザーの場合は最終ログイン時刻を更新
        await setDoc(userRef, {
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  };

  // Email/Passwordでサインイン
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      await saveUserProfile(result.user);
      router.push('/dashboard');
    } catch (error: any) {
      setError(getErrorMessage(error.code));
      throw error;
    }
  };

  // Email/Passwordでサインアップ
  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // displayNameを設定
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      await saveUserProfile(result.user);
      router.push('/dashboard');
    } catch (error: any) {
      setError(getErrorMessage(error.code));
      throw error;
    }
  };

  // Googleでサインイン
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await saveUserProfile(result.user);
      router.push('/dashboard');
    } catch (error: any) {
      setError(getErrorMessage(error.code));
      throw error;
    }
  };

  // ログアウト
  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error: any) {
      setError(getErrorMessage(error.code));
      throw error;
    }
  };

  // パスワードリセット
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      setError(getErrorMessage(error.code));
      throw error;
    }
  };

  // エラーメッセージの日本語化
  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'メールアドレスの形式が正しくありません';
      case 'auth/user-disabled':
        return 'このアカウントは無効化されています';
      case 'auth/user-not-found':
        return 'ユーザーが見つかりません';
      case 'auth/wrong-password':
        return 'パスワードが間違っています';
      case 'auth/email-already-in-use':
        return 'このメールアドレスは既に使用されています';
      case 'auth/weak-password':
        return 'パスワードは6文字以上で設定してください';
      case 'auth/network-request-failed':
        return 'ネットワークエラーが発生しました';
      case 'auth/popup-closed-by-user':
        return 'ログインがキャンセルされました';
      case 'auth/requires-recent-login':
        return '再度ログインが必要です';
      default:
        return 'エラーが発生しました。もう一度お試しください';
    }
  };

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuthフックのエクスポート
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Providerの外で使用された場合のフォールバック
    return {
      user: null,
      loading: false,
      error: null,
      signInWithEmail: async () => {},
      signUpWithEmail: async () => {},
      signInWithGoogle: async () => {},
      logout: async () => {},
      resetPassword: async () => {}
    };
  }
  return context;
}