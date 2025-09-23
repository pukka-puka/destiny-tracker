// ローカルストレージを使用した簡易版（Firebaseなしで動作）
export interface TarotReading {
  id: string;
  question: string;
  spreadType: 'three-card' | 'celtic-cross';
  cards: Array<{
    id: number;
    name: string;
    isReversed: boolean;
  }>;
  interpretation: string;
  category: string;
  timestamp: string;
}

// 占い結果を保存
export function saveTarotReading(reading: TarotReading) {
  if (typeof window === 'undefined') return;
  
  let existingReadings = getStoredReadings();
  existingReadings.unshift(reading); // 最新を先頭に
  
  // 最大50件まで保存
  if (existingReadings.length > 50) {
    existingReadings = existingReadings.slice(0, 50);
  }
  
  localStorage.setItem('tarotReadings', JSON.stringify(existingReadings));
  return reading.id;
}

// 占い履歴を取得
export function getStoredReadings(): TarotReading[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem('tarotReadings');
  return stored ? JSON.parse(stored) : [];
}

// 統計情報を取得
export function getReadingStatistics() {
  const readings = getStoredReadings();
  
  if (readings.length === 0) {
    return {
      totalReadings: 0,
      mostFrequentCard: null,
      categoryStats: {},
      lastReading: null
    };
  }
  
  // カードの出現頻度
  const cardFrequency: { [key: string]: number } = {};
  readings.forEach(reading => {
    reading.cards.forEach(card => {
      cardFrequency[card.name] = (cardFrequency[card.name] || 0) + 1;
    });
  });
  
  // 最も多く出現したカード
  const mostFrequentCard = Object.entries(cardFrequency)
    .sort(([, a], [, b]) => b - a)[0];
  
  // カテゴリー別の統計
  const categoryStats: { [key: string]: number } = {};
  readings.forEach(reading => {
    categoryStats[reading.category] = (categoryStats[reading.category] || 0) + 1;
  });
  
  return {
    totalReadings: readings.length,
    mostFrequentCard,
    categoryStats,
    lastReading: readings[0]
  };
}
