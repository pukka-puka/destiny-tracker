// src/contexts/AuthContext.tsx への追加・修正部分
// 
// 既存のAuthContextに以下の関数と処理を追加してください

// ===== 追加: 統計フィールド初期化関数 =====

/**
 * 現在の月を取得 (YYYY-MM形式)
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 新規ユーザーの統計フィールド初期値
 */
interface UserStatsFields {
  readingCount: number;
  palmReadingCount: number;
  ichingCount: number;
  chatConsultCount: number;
  compatibilityCount: number;
  currentMonth: string;
  lastReadingAt: null;
  statsInitializedAt: Date;
}

function getInitialUserStats(): UserStatsFields {
  return {
    readingCount: 0,
    palmReadingCount: 0,
    ichingCount: 0,
    chatConsultCount: 0,
    compatibilityCount: 0,
    currentMonth: getCurrentMonth(),
    lastReadingAt: null,
    statsInitializedAt: new Date(),
  };
}

// ===== 修正: createUserProfile関数 =====

/**
 * 新規ユーザープロフィール作成
 * 統計フィールドを含めて作成
 */
async function createUserProfile(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  // すでにプロフィールが存在する場合は統計フィールドのみチェック
  if (userDoc.exists()) {
    const userData = userDoc.data();
    
    // 統計フィールドがない場合は追加
    if (userData.readingCount === undefined || userData.currentMonth === undefined) {
      await updateDoc(userRef, {
        ...getInitialUserStats(),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ 既存ユーザーに統計フィールドを追加しました');
    }
    return;
  }

  // 新規ユーザープロフィールを作成（統計フィールド含む）
  const newUserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    subscription: 'free' as const,
    credits: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    
    // 運勢パラメータ初期値
    destinyParameters: {
      love: 50,
      money: 50,
      health: 50,
      work: 50,
      social: 50,
      overall: 50,
    },
    
    // 統計フィールド（新規追加）
    ...getInitialUserStats(),
  };

  await setDoc(userRef, newUserProfile);
  console.log('✅ 新規ユーザープロフィールを作成しました（統計フィールド含む）');
}

// ===== 使用例: useEffect内での呼び出し =====

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    setUser(user);
    setLoading(true);

    if (user) {
      try {
        // ユーザープロフィール作成（統計フィールド含む）
        await createUserProfile(user);

        // 最新のユーザー情報を取得
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }

        // 最終ログイン時刻を更新
        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    } else {
      setUserProfile(null);
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, []);

// ===== 型定義への追加 =====

// UserProfile型に統計フィールドを追加
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  subscription: 'free' | 'basic' | 'premium';
  credits: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin: Timestamp;
  
  // 既存フィールド
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
  
  // Stripe関連
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  subscriptionCurrentPeriodEnd?: Date;
  subscriptionCancelAtPeriodEnd?: boolean;
  
  // 統計フィールド（新規追加）
  readingCount: number;
  palmReadingCount: number;
  ichingCount: number;
  chatConsultCount: number;
  compatibilityCount: number;
  currentMonth: string;
  lastReadingAt: Timestamp | null;
  statsInitializedAt?: Timestamp;
}
