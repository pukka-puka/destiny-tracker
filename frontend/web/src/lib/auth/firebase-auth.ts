// src/lib/auth/firebase-auth.ts

import { 
  Auth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// ユーザー情報の型定義
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  subscription: 'free' | 'basic' | 'premium' | 'vip';
  credits: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin: Timestamp;
  palmData?: {
    imageUrl?: string;
    analysis?: any;
    analyzedAt?: Timestamp;
  };
  destinyParameters?: {
    love: number;
    money: number;
    health: number;
    work: number;
    social: number;
    overall: number;
  };
  // Stripe関連フィールド
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  subscriptionCurrentPeriodEnd?: Date;
  subscriptionCancelAtPeriodEnd?: boolean;
}

// Googleプロバイダーの設定
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Googleでサインイン
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // ユーザープロファイルを作成/更新
    await createOrUpdateUserProfile(user);
    
    return user;
  } catch (error: any) {
    console.error('Googleサインインエラー:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// メールとパスワードでサインアップ
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<User | null> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // 表示名を更新
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    // ユーザープロファイルを作成
    await createOrUpdateUserProfile(user);
    
    return user;
  } catch (error: any) {
    console.error('メールサインアップエラー:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// メールとパスワードでサインイン
export const signInWithEmail = async (
  email: string, 
  password: string
): Promise<User | null> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // 最終ログイン時刻を更新
    await updateLastLogin(user.uid);
    
    return user;
  } catch (error: any) {
    console.error('メールサインインエラー:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// サインアウト
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('サインアウトエラー:', error);
    throw new Error('サインアウトに失敗しました');
  }
};

// ユーザープロファイルを作成または更新
const createOrUpdateUserProfile = async (user: User): Promise<void> => {
  if (!user) return;
  
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // 新規ユーザーの場合
      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        subscription: 'free',
        credits: 10, // 初回特典として10クレジット付与
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        lastLogin: serverTimestamp() as Timestamp,
        destinyParameters: {
          love: 50,
          money: 50,
          health: 50,
          work: 50,
          social: 50,
          overall: 50
        }
      };
      
      await setDoc(userRef, newUserProfile);
      console.log('新規ユーザープロファイル作成完了');
    } else {
      // 既存ユーザーの場合は最終ログイン時刻のみ更新
      await updateLastLogin(user.uid);
    }
  } catch (error) {
    console.error('ユーザープロファイル作成/更新エラー:', error);
  }
};

// 最終ログイン時刻を更新
const updateLastLogin = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('最終ログイン時刻更新エラー:', error);
  }
};

// ユーザープロファイルを取得
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('ユーザープロファイル取得エラー:', error);
    return null;
  }
};

// エラーメッセージを日本語化
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'このメールアドレスは既に使用されています';
    case 'auth/invalid-email':
      return 'メールアドレスの形式が正しくありません';
    case 'auth/operation-not-allowed':
      return 'この認証方法は無効になっています';
    case 'auth/weak-password':
      return 'パスワードは6文字以上にしてください';
    case 'auth/user-disabled':
      return 'このユーザーアカウントは無効になっています';
    case 'auth/user-not-found':
      return 'ユーザーが見つかりません';
    case 'auth/wrong-password':
      return 'パスワードが正しくありません';
    case 'auth/popup-closed-by-user':
      return 'ログインをキャンセルしました';
    case 'auth/network-request-failed':
      return 'ネットワークエラーが発生しました';
    default:
      return '認証エラーが発生しました';
  }
};

// 認証状態の監視
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};