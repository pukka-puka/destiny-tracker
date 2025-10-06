'use client';

import { useState, useEffect } from 'react';
import { getStoredReadings, getReadingStatistics } from '@/lib/tarot-history';
import { Clock, TrendingUp, Star, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  const [readings, setReadings] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  useEffect(() => {
    loadHistory();
  }, []);
  
  const loadHistory = () => {
    const storedReadings = getStoredReadings();
    const stats = getReadingStatistics();
    
    setReadings(storedReadings);
    setStatistics(stats);
  };
  
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          占い履歴
        </h1>
        
        {statistics && statistics.totalReadings > 0 ? (
          <>
            {/* 統計情報 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-white font-semibold">総占い回数</h3>
                </div>
                <p className="text-3xl font-bold text-white">{statistics.totalReadings}回</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-white font-semibold">最頻出カード</h3>
                </div>
                <p className="text-xl font-bold text-white">
                  {statistics.mostFrequentCard?.[0] || 'なし'}
                </p>
                <p className="text-sm text-gray-300">
                  {statistics.mostFrequentCard?.[1] || 0}回出現
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-white font-semibold">最後の占い</h3>
                </div>
                <p className="text-white">
                  {statistics.lastReading 
                    ? new Date(statistics.lastReading.timestamp).toLocaleDateString('ja-JP')
                    : 'まだありません'}
                </p>
              </div>
            </div>
            
            {/* 履歴リスト */}
            <div className="space-y-4 max-w-4xl mx-auto">
              {readings.map((reading) => (
                <div key={reading.id} className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {reading.question || '総合運勢'}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(reading.timestamp).toLocaleString('ja-JP')}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm">
                      {reading.spreadType === 'three-card' ? '3カード' : 'ケルト十字'}
                    </span>
                  </div>
                  
                  {/* カード一覧 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {reading.cards.map((card: any, i: number) => (
                      <div key={i} className="bg-white/20 px-3 py-1 rounded text-sm text-white">
                        {card.name}{card.isReversed && '(逆)'}
                      </div>
                    ))}
                  </div>
                  
                  {/* 解釈 */}
                  <div className={`text-gray-300 ${expandedId !== reading.id ? 'line-clamp-3' : ''}`}>
                    <pre className="whitespace-pre-wrap font-sans">{reading.interpretation}</pre>
                  </div>
                  
                  <button 
                    onClick={() => toggleExpand(reading.id)}
                    className="mt-4 text-purple-300 hover:text-purple-200 text-sm flex items-center gap-1"
                  >
                    {expandedId === reading.id ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        閉じる
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        詳細を見る
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-white text-xl mb-6">まだ占い履歴がありません</p>
            <Link
              href="/tarot"
              className="inline-block px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
            >
              タロット占いを始める
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
