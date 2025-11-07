// src/lib/services/palm.service.ts
import { auth } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PalmReadingData } from '@/types/destiny.types';

// 共通型からエイリアスを作成
export type PalmAnalysis = PalmReadingData['analysis'] & {
  id?: string;
  imageUrl?: string;
};

export interface PalmReadingLimit {
  canAnalyze: boolean;
  nextAvailableDate?: Date;
  lastAnalysisDate?: Date;
}

class PalmService {
  // 画像をBase64に変換
  async convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // データURLから Base64 部分を抽出
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 手相解析を実行
  async analyzePalm(imageBase64: string, imageUrl: string): Promise<PalmAnalysis> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();
    
    const response = await fetch('/api/analyze-palm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        imageUrl,
        userId: user.uid,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to analyze palm');
    }

    const data = await response.json();
    return data.analysis;
  }

  // 月1回の制限チェック
  async checkMonthlyLimit(): Promise<PalmReadingLimit> {
    const user = auth.currentUser;
    if (!user) {
      return { canAnalyze: false };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const q = query(
      collection(db, 'readings'),
      where('userId', '==', user.uid),
      where('readingType', '==', 'palm'),
      where('createdAt', '>=', Timestamp.fromDate(startOfMonth)),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { canAnalyze: true };
    }

    const lastReading = snapshot.docs[0];
    const lastAnalysisDate = lastReading.data().createdAt.toDate();
    
    // 次の月の1日を計算
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    return {
      canAnalyze: false,
      nextAvailableDate: nextMonth,
      lastAnalysisDate,
    };
  }

  // 過去の手相解析履歴を取得
  async getPalmHistory(maxResults: number = 12): Promise<PalmAnalysis[]> {
    const user = auth.currentUser;
    if (!user) {
      return [];
    }

    const q = query(
      collection(db, 'readings'),
      where('userId', '==', user.uid),
      where('readingType', '==', 'palm'),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data.palmReading?.analysis,
        imageUrl: data.palmReading?.imageUrl,
      };
    });
  }

  // 特定の手相解析結果を取得
  async getPalmReading(id: string): Promise<PalmAnalysis | null> {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    const docRef = doc(db, 'readings', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists() || docSnap.data().userId !== user.uid) {
      return null;
    }

    const data = docSnap.data();
    if (data.readingType !== 'palm' || !data.palmReading) {
      return null;
    }

    return {
      id: docSnap.id,
      ...data.palmReading.analysis,
      imageUrl: data.palmReading.imageUrl,
    };
  }

  // 画像のバリデーション
  validateImage(file: File): { valid: boolean; error?: string } {
    // ファイルサイズチェック (10MB以下)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'ファイルサイズは10MB以下にしてください' };
    }

    // ファイルタイプチェック
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'JPG、PNG、またはWebP形式の画像をアップロードしてください' };
    }

    return { valid: true };
  }

  // 統計情報の取得
  async getPalmStatistics() {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    const history = await this.getPalmHistory();
    
    if (history.length === 0) {
      return null;
    }

    // 平均パラメーター計算
    const avgParameters = history.reduce((acc, reading) => {
      if (reading.parameters) {
        Object.keys(reading.parameters).forEach(key => {
          const param = key as keyof typeof reading.parameters;
          acc[param] = (acc[param] || 0) + reading.parameters[param];
        });
      }
      return acc;
    }, {} as Record<string, number>);

    Object.keys(avgParameters).forEach(key => {
      avgParameters[key] = Math.round(avgParameters[key] / history.length);
    });

    return {
      totalReadings: history.length,
      averageParameters: avgParameters,
      lastReading: history[0],
    };
  }
}

export const palmService = new PalmService();
