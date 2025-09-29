// lib/services/destiny.service.ts

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc,
  query, 
  where, 
  limit,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  DestinyReading, 
  UserStats, 
  DestinyParameters,
  DailyFortune,
  LUCKY_COLORS,
  LUCKY_ITEMS
} from '@/types/destiny.types';

export class DestinyService {
  private static instance: DestinyService;

  private constructor() {}

  public static getInstance(): DestinyService {
    if (!DestinyService.instance) {
      DestinyService.instance = new DestinyService();
    }
    return DestinyService.instance;
  }

  // 今日の運勢を生成
  generateDailyFortune(userId: string): DailyFortune {
    const today = new Date().toDateString();
    const seed = `${userId}-${today}`.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    const messages = [
      '素晴らしい一日になりそうです！チャンスを逃さないで。',
      '新しい出会いがあなたを待っています。',
      '今日は慎重に行動することが大切です。',
      '創造力が高まる日。アイデアを形にしましょう。',
      '人間関係が好転する兆し。積極的にコミュニケーションを。'
    ];

    return {
      message: messages[seed % messages.length],
      luckyColor: LUCKY_COLORS[seed % LUCKY_COLORS.length].name,
      luckyItem: LUCKY_ITEMS[seed % LUCKY_ITEMS.length],
      luckyNumber: (seed % 9) + 1,
      advice: '深呼吸をして、自分のペースを保ちましょう。'
    };
  }

  // 運勢パラメーターを生成
  generateParameters(userId: string, date?: Date): DestinyParameters {
    const targetDate = date || new Date();
    const seed = `${userId}-${targetDate.toDateString()}`.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    // ランダム性を増やす
    const randomValue = (base: number) => {
      const variation = Math.sin(seed * base) * 30;
      const random = Math.random() * 40 - 20; // -20 to +20のランダム値
      return Math.max(0, Math.min(100, 50 + variation + random));
    };

    const params = {
      love: Math.round(randomValue(1.1)),
      money: Math.round(randomValue(2.2)),
      health: Math.round(randomValue(3.3)),
      work: Math.round(randomValue(4.4)),
      social: Math.round(randomValue(5.5)),
      overall: 0
    };

    params.overall = Math.round(
      (params.love + params.money + params.health + params.work + params.social) / 5
    );

    return params;
  }

  // 新しい占い結果を保存
  async saveReading(userId: string, reading: Partial<DestinyReading>): Promise<string> {
    try {
      const readingsRef = collection(db, 'destinyReadings');
      
      // createdAtが渡されている場合はそれを使用、なければ現在時刻
      const timestamp = reading.createdAt ? 
        Timestamp.fromDate(reading.createdAt instanceof Date ? reading.createdAt : new Date(reading.createdAt)) : 
        serverTimestamp();
      
      const newReading = {
        ...reading,
        userId,
        createdAt: timestamp,
        readingType: reading.readingType || 'daily'
      };

      const docRef = await addDoc(readingsRef, newReading);
      
      // ユーザー統計を更新（非同期で実行）
      this.updateUserStats(userId).catch(console.error);
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving reading:', error);
      throw error;
    }
  }

  // 今日の占い結果を取得
  async getTodayReading(userId: string): Promise<DestinyReading | null> {
    try {
      const q = query(
        collection(db, 'destinyReadings'),
        where('userId', '==', userId),
        limit(30)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // 新規作成
        const parameters = this.generateParameters(userId);
        const daily = this.generateDailyFortune(userId);
        
        const readingId = await this.saveReading(userId, {
          parameters,
          daily,
          readingType: 'daily'
        });

        return {
          id: readingId,
          userId,
          createdAt: new Date(),
          parameters,
          daily,
          readingType: 'daily'
        };
      }

      // データを日付でソート
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // 今日のデータを探す
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayReading = docs.find(doc => {
        const readingDate = new Date(doc.createdAt);
        readingDate.setHours(0, 0, 0, 0);
        return readingDate.getTime() === today.getTime();
      });

      if (todayReading) {
        return {
          id: todayReading.id,
          ...todayReading.data,
          createdAt: todayReading.createdAt
        } as DestinyReading;
      }

      // 最新のデータを返す（今日のデータがない場合）
      const latest = docs[0];
      return {
        id: latest.id,
        ...latest.data,
        createdAt: latest.createdAt
      } as DestinyReading;
    } catch (error) {
      console.error('Error getting today reading:', error);
      return null;
    }
  }

  // 過去の占い結果を取得
  async getReadingHistory(userId: string, limitCount: number = 30): Promise<DestinyReading[]> {
    try {
      const q = query(
        collection(db, 'destinyReadings'),
        where('userId', '==', userId),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      
      const readings = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as DestinyReading;
      });

      // 日付でソート（新しい順）
      return readings.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting reading history:', error);
      return [];
    }
  }

  // ユーザー統計を取得
  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const statsRef = doc(db, 'userStats', userId);
      const statsDoc = await getDoc(statsRef);
      
      // 最新の履歴を取得
      const readings = await this.getReadingHistory(userId, 100);
      
      if (readings.length === 0) {
        return {
          userId,
          totalReadings: 0,
          averageScores: {
            love: 0,
            money: 0,
            health: 0,
            work: 0,
            social: 0,
            overall: 0
          },
          lastReadingDate: new Date(),
          streakDays: 0
        };
      }

      // 統計を計算
      const totals = readings.reduce((acc, reading) => {
        Object.keys(reading.parameters).forEach(key => {
          const paramKey = key as keyof DestinyParameters;
          acc[paramKey] = (acc[paramKey] || 0) + reading.parameters[paramKey];
        });
        return acc;
      }, {} as DestinyParameters);

      const averageScores = Object.keys(totals).reduce((acc, key) => {
        const paramKey = key as keyof DestinyParameters;
        acc[paramKey] = Math.round(totals[paramKey] / readings.length);
        return acc;
      }, {} as DestinyParameters);

      return {
        userId,
        totalReadings: readings.length,
        averageScores,
        lastReadingDate: readings[0].createdAt,
        streakDays: this.calculateStreak(readings)
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  // ユーザー統計を更新
  private async updateUserStats(userId: string): Promise<void> {
    try {
      const stats = await this.getUserStats(userId);
      if (stats) {
        await setDoc(doc(db, 'userStats', userId), {
          ...stats,
          lastReadingDate: Timestamp.fromDate(stats.lastReadingDate)
        });
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  // ストリーク日数を計算
  private calculateStreak(readings: DestinyReading[]): number {
    if (readings.length === 0) return 0;

    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < readings.length - 1; i++) {
      const current = new Date(readings[i].createdAt);
      const next = new Date(readings[i + 1].createdAt);
      
      current.setHours(0, 0, 0, 0);
      next.setHours(0, 0, 0, 0);
      
      const dayDiff = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}

export const destinyService = DestinyService.getInstance();
