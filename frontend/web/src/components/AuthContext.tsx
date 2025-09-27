// src/contexts/AuthContext.tsx

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { 
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  onAuthStateChange,
  getUserProfile,
  UserProfile
} from '@/lib/auth/firebase-auth';

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

// コンテキストの作成
const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
  refreshUserProfile: async () => {},
});

// カスタムフックの作成
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// AuthProviderコンポーネント
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ユーザープロファイルを取得
  const fetchUserProfile = async (uid: string) => {
    try {
      const profile = await getUserProfile(uid);
      setUserProfile(profile);
    } catch (error) {
      console.error('プロファイル取得エラー:', error);
    }
  };

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Googleでサインイン
  const handleSignInWithGoogle = async () => {
    try {
      setLoading(true);
      const firebaseUser = await signInWithGoogle();
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser.uid);
      }
    } catch (error: any) {
      console.error('Googleサインインエラー:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // メールでサインイン
  const handleSignInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const firebaseUser = await signInWithEmail(email, password);
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser.uid);
      }
    } catch (error: any) {
      console.error('メールサインインエラー:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // メールでサインアップ
  const handleSignUpWithEmail = async (
    email: string, 
    password: string, 
    displayName?: string
  ) => {
    try {
      setLoading(true);
      const firebaseUser = await signUpWithEmail(email, password, displayName);
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser.uid);
      }
    } catch (error: any) {
      console.error('メールサインアップエラー:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // サインアウト
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOutUser();
      setUser(null);
      setUserProfile(null);
    } catch (error: any) {
      console.error('サインアウトエラー:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ユーザープロファイルを再取得
  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user.uid);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithEmail: handleSignInWithEmail,
    signUpWithEmail: handleSignUpWithEmail,
    signOut: handleSignOut,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};