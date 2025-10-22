// src/app/history/page.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Calendar,
  Search,
  Filter,
  Trash2,
  Heart,
  Eye,
  Loader2,
  Sparkles,
  Hand
} from 'lucide-react';

interface Reading {
  id: string;
  readingType: 'tarot' | 'palm' | 'iching';
  createdAt: Date;
  parameters: any;
  type?: string;
  category?: string;
  question?: string;
  interpretation?: string;
  tarotReading?: any;
  palmReading?: any;
  hexagram?: any;
  isFavorite?: boolean;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [filteredReadings, setFilteredReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'tarot' | 'palm' | 'iching'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'favorite'>('date');

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    fetchReadings();
  }, [user, router]);

  useEffect(() => {
    filterAndSortReadings();
  }, [readings, searchQuery, filterType, sortBy]);

  const fetchReadings = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'readings'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(docSnap => {
        const docData = docSnap.data();
        return {
          id: docSnap.id,
          readingType: docData.readingType || docData.type || 'tarot',
          createdAt: docData.createdAt?.toDate() || new Date(),
          parameters: docData.parameters || {},
          category: docData.category,
          interpretation: docData.interpretation,
          tarotReading: docData.tarotReading,
          palmReading: docData.palmReading,
          isFavorite: docData.isFavorite || false
        } as Reading;
      });

      setReadings(data);
    } catch (error) {
      console.error('履歴取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortReadings = () => {
    let filtered = [...readings];

    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.readingType === filterType);
    }

    if (searchQuery) {
      filtered = filtered.filter(r => {
        const query = searchQuery.toLowerCase();
        if (r.readingType === 'tarot' && r.interpretation) {
          return r.interpretation.toLowerCase().includes(query) ||
                 r.category?.toLowerCase().includes(query);
        }
        if (r.readingType === 'palm' && r.palmReading) {
          return r.palmReading.analysis?.summary?.toLowerCase().includes(query);
        }
        return false;
      });
    }

    if (sortBy === 'favorite') {
      filtered.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    } else {
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    setFilteredReadings(filtered);
  };

  const toggleFavorite = async (readingId: string) => {
    const reading = readings.find(r => r.id === readingId);
    if (!reading) return;

    try {
      const readingRef = doc(db, 'readings', readingId);
      await updateDoc(readingRef, {
        isFavorite: !reading.isFavorite
      });

      setReadings(prev => prev.map(r => 
        r.id === readingId ? { ...r, isFavorite: !r.isFavorite } : r
      ));
    } catch (error) {
      console.error('お気に入り更新エラー:', error);
    }
  };

  const deleteReading = async (readingId: string) => {
    if (!confirm('この占い結果を削除しますか？')) return;

    try {
      await deleteDoc(doc(db, 'readings', readingId));
      setReadings(prev => prev.filter(r => r.id !== readingId));
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const viewReading = (reading: Reading) => {
    // 古いデータ（readingTypeがない）の場合は警告
    if (!reading.readingType && !reading.type) {
      alert('この占い結果は古い形式のため、詳細を表示できません。新しく占いを行ってください。');
      return;
    }

    if (reading.readingType === 'tarot' || reading.type === 'tarot') {
      router.push(`/tarot/result/${reading.id}`);
    } else if (reading.readingType === 'palm') {
      router.push(`/palm/analysis/${reading.id}`);
    } else if (reading.readingType === 'iching') {
      router.push(`/iching/result/${reading.id}`);
    } else {
      alert('この占い結果の詳細ページは利用できません。');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-white/80 hover:text-white mb-4"
          >
            ← ダッシュボードに戻る
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">占い履歴</h1>
          <p className="text-white/70">これまでの占い結果を振り返りましょう</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="キーワードで検索..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">すべて</option>
              <option value="tarot">タロット占い</option>
              <option value="palm">手相占い</option>
              <option value="iching">易占い</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-400"
            >
              <option value="date">日付順</option>
              <option value="favorite">お気に入り優先</option>
            </select>
          </div>
          
          <div className="mt-4 text-white/60 text-xs text-center">
            ⚠️ 古い形式の占い結果は詳細表示ができません。最新の機能を使って新しく占いを行ってください。
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">{readings.length}</div>
            <div className="text-white/70 text-sm">総占い回数</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {readings.filter(r => r.readingType === 'tarot' || r.type === 'tarot').length}
            </div>
            <div className="text-white/70 text-sm">タロット</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {readings.filter(r => r.readingType === 'palm').length}
            </div>
            <div className="text-white/70 text-sm">手相</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {readings.filter(r => r.readingType === 'iching').length}
            </div>
            <div className="text-white/70 text-sm">易占い</div>
          </div>
        </div>

        {filteredReadings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔮</div>
            <p className="text-white/70 text-lg mb-4">
              {searchQuery || filterType !== 'all' 
                ? '該当する履歴が見つかりませんでした'
                : 'まだ占いをしていません'}
            </p>
            {!searchQuery && filterType === 'all' && (
              <button
                onClick={() => router.push('/tarot')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700"
              >
                タロット占いを始める
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReadings.map(reading => (
              <div
                key={reading.id}
                className="bg-white/10 backdrop-blur-xl rounded-xl p-6 hover:bg-white/15 transition-all cursor-pointer group"
                onClick={() => viewReading(reading)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      reading.readingType === 'tarot' || reading.type === 'tarot'
                        ? 'bg-purple-500/20' 
                        : reading.readingType === 'palm'
                          ? 'bg-pink-500/20'
                          : 'bg-amber-500/20'
                    }`}>
                      {reading.readingType === 'tarot' || reading.type === 'tarot' ? (
                        <Sparkles className="w-6 h-6 text-purple-300" />
                      ) : reading.readingType === 'palm' ? (
                        <Hand className="w-6 h-6 text-pink-300" />
                      ) : (
                        <span className="text-2xl">🎋</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">
                        {reading.readingType === 'tarot' || reading.type === 'tarot' ? 'タロット占い' : 
                         reading.readingType === 'palm' ? '手相占い' : '易占い'}
                      </h3>
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Calendar className="w-3 h-3" />
                        {reading.createdAt.toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => toggleFavorite(reading.id)}
                      className={`p-2 rounded-lg transition ${
                        reading.isFavorite 
                          ? 'bg-red-500/20 text-red-300' 
                          : 'bg-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${reading.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => deleteReading(reading.id)}
                      className="p-2 rounded-lg bg-white/10 text-white/50 hover:text-red-300 hover:bg-red-500/20 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-white/70 text-sm mb-4 line-clamp-3">
                  {reading.interpretation?.substring(0, 150) + '...'}
                </div>

                <div className="mt-4 flex items-center gap-2 text-purple-300 opacity-0 group-hover:opacity-100 transition">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">詳細を見る</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}