'use client';

import { useState } from 'react';
import { Share2, X } from 'lucide-react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ShareButtonProps {
  type: 'tarot' | 'palm' | 'iching' | 'compatibility';
  resultId: string;
  userId?: string;
  onShare?: () => void;
}

export default function ShareButton({ type, resultId, userId, onShare }: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const typeLabels = {
    tarot: 'タロット占い',
    palm: '手相占い',
    iching: '易占い',
    compatibility: '相性占い'
  };

  const handleShare = async (platform: 'line' | 'twitter' | 'copy') => {
    setIsSharing(true);

    const url = `https://shukumei.xyz/share/${type}/${resultId}`;
    const text = `私の${typeLabels[type]}結果をシェア！あなたも試してみて✨`;

    try {
      if (platform === 'line') {
        const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text + '\n' + url)}`;
        window.open(lineUrl, '_blank');
      } else if (platform === 'twitter') {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, '_blank');
      } else if (platform === 'copy') {
        await navigator.clipboard.writeText(url);
        alert('リンクをコピーしました！');
      }

      // シェアボーナスを付与
      if (userId) {
        try {
          const { getDoc, setDoc } = await import('firebase/firestore');
          const userRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userRef);
          
          // ユーザードキュメントが存在しない場合は作成
          if (!userDoc.exists()) {
            console.log('📝 ユーザードキュメントを作成します:', userId);
            await setDoc(userRef, {
              userId: userId,
              subscription: 'free',
              readingCount: 0,
              palmReadingCount: 0,
              ichingCount: 0,
              chatConsultCount: 0,
              compatibilityCount: 0,
              currentMonth: new Date().toISOString().slice(0, 7),
              shareBonus: {
                count: 1,
                lastSharedAt: new Date(),
                premiumFreeUses: 0,
              },
              createdAt: new Date(),
            });
            console.log('✅ ユーザードキュメントを作成しました');
          } else {
            // 既存のユーザーの場合は更新
            await updateDoc(userRef, {
              'shareBonus.count': increment(1),
              'shareBonus.lastSharedAt': new Date(),
            });
            
            // 5シェアごとにプレミアム機能1回無料
            const shareCount = await getShareCount(userId);
            if (shareCount % 5 === 0 && shareCount > 0) {
              await updateDoc(userRef, {
                'shareBonus.premiumFreeUses': increment(1),
              });
              alert('🎉 おめでとうございます！\nプレミアム機能が1回無料で使えます！');
            }
          }
        } catch (error) {
          console.error('⚠️ シェアボーナス付与エラー:', error);
          // エラーが発生してもシェア自体は成功として扱う
        }
      }

      if (onShare) onShare();
      setShowModal(false);
    } catch (error) {
      console.error('シェアエラー:', error);
      alert('シェアに失敗しました');
    } finally {
      setIsSharing(false);
    }
  };

  const getShareCount = async (uid: string): Promise<number> => {
    const userDoc = await import('firebase/firestore').then(m => m.getDoc(doc(db, 'users', uid)));
    return userDoc.data()?.shareBonus?.count || 0;
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
      >
        <Share2 className="w-5 h-5" />
        結果をシェアする
      </button>

      {/* シェアモーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold mb-2">結果をシェアしよう！</h2>
            <p className="text-gray-600 mb-6">
              友達に結果をシェアして、5回シェアするとプレミアム機能が1回無料で使えます✨
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleShare('line')}
                disabled={isSharing}
                className="w-full flex items-center justify-center gap-3 bg-[#06C755] hover:bg-[#05b04b] text-white px-6 py-4 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                LINEでシェア
              </button>

              <button
                onClick={() => handleShare('twitter')}
                disabled={isSharing}
                className="w-full flex items-center justify-center gap-3 bg-black hover:bg-gray-800 text-white px-6 py-4 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Xでシェア
              </button>

              <button
                onClick={() => handleShare('copy')}
                disabled={isSharing}
                className="w-full flex items-center justify-center gap-3 bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-4 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <Share2 className="w-5 h-5" />
                リンクをコピー
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
