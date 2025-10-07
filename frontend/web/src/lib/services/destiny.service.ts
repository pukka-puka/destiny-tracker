import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  addDoc,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';  // ← authを追加
import { 
  DestinyReading, 
  DestinyParameters,
  DailyFortune,
  TarotCard,
  TarotReadingData,
  UserStats
} from '@/types/destiny.types';

// タロット占いを保存（カードの意味に基づいたパラメータを使用）
export async function saveTarotReading(
  cards: TarotCard[],
  interpretation: string,
  category: 'general' | 'love' | 'career' | 'money' = 'general',  // work → career
  parameters?: DestinyParameters
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  // パラメーターが渡されない場合は計算
  const finalParameters = parameters || {
    love: Math.floor(Math.random() * 40) + 60,
    career: Math.floor(Math.random() * 40) + 60,  // work → career
    money: Math.floor(Math.random() * 40) + 60,
    health: Math.floor(Math.random() * 40) + 60,
    social: Math.floor(Math.random() * 40) + 60,
    growth: Math.floor(Math.random() * 40) + 60,
  };

  // カテゴリに応じてパラメーターを調整
  if (category === 'love') finalParameters.love = Math.min(100, finalParameters.love + 20);
  if (category === 'career') finalParameters.career = Math.min(100, finalParameters.career + 20);  // work → career
  if (category === 'money') finalParameters.money = Math.min(100, finalParameters.money + 20);

  // 総合運勢スコアを計算
  const fortuneScore = Math.round(
    Object.values(finalParameters).reduce((a, b) => a + b, 0) / 6
  );

  const reading: Omit<DestinyReading, 'id'> = {
    userId: user.uid,
    readingType: 'daily-tarot',
    parameters: finalParameters,
    daily: {
      fortune: fortuneScore,
      message: interpretation.substring(0, 200),
      luckyColor: ['赤', '青', '黄', '緑', '紫', '橙'][Math.floor(Math.random() * 6)],
      luckyNumber: Math.floor(Math.random() * 9) + 1,
    },
    tarotReading: {
      cards: cards.map(c => ({
        id: c.id,
        name: c.name,
        nameJa: c.nameJa || c.name,
        meaning: c.meaning,
        reversed: c.reversed || false,
        keywords: c.keywords,
        description: c.description
      })),
      interpretation,
      category,
      spreadType: 'three-card',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Firestoreに保存する際はTimestampに変換
  const firestoreData = {
    ...reading,
    createdAt: Timestamp.fromDate(reading.createdAt),
    updatedAt: Timestamp.fromDate(reading.updatedAt),
  };

  const docRef = await addDoc(collection(db, 'readings'), firestoreData);
  return docRef.id;
}

// 最新の占い結果を取得
export async function getLatestReadings(
  userId: string, 
  readingType?: 'daily-tarot' | 'palm' | 'special',
  limitCount: number = 10
): Promise<DestinyReading[]> {
  let q = query(
    collection(db, 'readings'),
    where('userId', '==', userId)
  );

  if (readingType) {
    q = query(q, where('readingType', '==', readingType));
  }

  q = query(q, orderBy('createdAt', 'desc'), limit(limitCount));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as DestinyReading;
  });
}

// 今日の運勢を取得
export async function getTodaysFortune(userId: string): Promise<DailyFortune | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const q = query(
    collection(db, 'readings'),
    where('userId', '==', userId),
    where('readingType', '==', 'daily-tarot'),
    where('createdAt', '>=', Timestamp.fromDate(today)),
    where('createdAt', '<', Timestamp.fromDate(tomorrow)),
    orderBy('createdAt', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const reading = snapshot.docs[0].data() as DocumentData;
  return reading.daily || null;
}

// 統計情報を取得
export async function getUserStatistics(userId: string): Promise<UserStats> {
  const allReadings = await getLatestReadings(userId, undefined, 1000);
  
  const tarotReadings = allReadings.filter(r => r.readingType === 'daily-tarot').length;
  const palmReadings = allReadings.filter(r => r.readingType === 'palm').length;

  const avgParameters: DestinyParameters = {
    love: 0,
    career: 0,
    money: 0,
    health: 0,
    social: 0,
    growth: 0,
  };

  if (allReadings.length > 0) {
    allReadings.forEach(reading => {
      Object.keys(avgParameters).forEach(key => {
        const param = key as keyof DestinyParameters;
        avgParameters[param] += reading.parameters[param] || 0;
      });
    });

    Object.keys(avgParameters).forEach(key => {
      const param = key as keyof DestinyParameters;
      avgParameters[param] = Math.round(avgParameters[param] / allReadings.length);
    });
  }

  // 連続日数と最後の占い日を計算
  const lastReadingDate = allReadings.length > 0 
    ? new Date(allReadings[0].createdAt) 
    : new Date();

  let currentStreak = 0;
  if (allReadings.length > 0) {
    const today = new Date();
    const lastDate = new Date(allReadings[0].createdAt);
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      currentStreak = 1;
    }
  }

  // 最高の日を計算
  const bestDay = allReadings.reduce((best, reading) => {
    const overall = reading.daily?.fortune || 0;
    return overall > best.overall 
      ? { date: new Date(reading.createdAt), overall }
      : best;
  }, { date: new Date(), overall: 0 });

  return {
    totalReadings: allReadings.length,
    tarotReadings,
    palmReadings,
    currentStreak,
    lastReadingDate,
    averageParameters: avgParameters,
    bestDay
  };
}

// 占い履歴を期間で取得
export async function getReadingsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<DestinyReading[]> {
  const q = query(
    collection(db, 'readings'),
    where('userId', '==', userId),
    where('createdAt', '>=', Timestamp.fromDate(startDate)),
    where('createdAt', '<=', Timestamp.fromDate(endDate)),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as DestinyReading;
  });
}

// 画像アップロード関数（手相占いで使用）
export async function uploadImage(file: File, path: string): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const fullPath = `${path}/${fileName}`;
  
  const storageRef = ref(storage, fullPath);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  
  return downloadUrl;
}
