// src/hooks/useUsageLimits.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { canUseFeature, PLANS } from '@/lib/plans';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type FeatureType = 'tarot' | 'palm' | 'iching' | 'aiChat' | 'compatibility';

interface UsageStatus {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
}

export function useUsageLimits(feature: FeatureType) {
  const { user, userProfile } = useAuth();
  const [usage, setUsage] = useState<UsageStatus>({
    allowed: true,
    remaining: -1,
    limit: -1,
    used: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !userProfile) {
      setLoading(false);
      return;
    }

    checkUsage();
  }, [user, userProfile, feature]);

  const checkUsage = async () => {
    if (!user || !userProfile) return;

    try {
      // 今月の使用回数を取得
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let readingType: string;
      switch (feature) {
        case 'tarot':
          readingType = 'tarot';
          break;
        case 'palm':
          readingType = 'palm';
          break;
        case 'iching':
          readingType = 'iching';
          break;
        case 'aiChat':
          // チャットの場合は別途カウント
          const chatCount = await getChatMessageCount(user.uid, startOfMonth);
          const chatLimit = canUseFeature(userProfile.subscription, 'aiChat', chatCount);
          setUsage({
            allowed: chatLimit.allowed,
            remaining: chatLimit.remaining,
            limit: chatLimit.limit,
            used: chatCount,
          });
          setLoading(false);
          return;
        case 'compatibility':
          // 相性診断もreadingsコレクションに保存されている想定
          readingType = 'compatibility';
          break;
        default:
          readingType = feature;
      }

      // 今月の占い回数を取得
      const q = query(
        collection(db, 'readings'),
        where('userId', '==', user.uid),
        where('readingType', '==', readingType),
        where('createdAt', '>=', Timestamp.fromDate(startOfMonth))
      );

      const snapshot = await getDocs(q);
      const usageCount = snapshot.size;

      // 制限チェック
      const limitCheck = canUseFeature(
        userProfile.subscription,
        feature,
        usageCount
      );

      setUsage({
        allowed: limitCheck.allowed,
        remaining: limitCheck.remaining,
        limit: limitCheck.limit,
        used: usageCount,
      });
    } catch (error) {
      console.error('Error checking usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChatMessageCount = async (userId: string, since: Date): Promise<number> => {
    try {
      const q = query(
        collection(db, 'chatMessages'),
        where('userId', '==', userId),
        where('role', '==', 'user'), // ユーザーのメッセージのみカウント
        where('timestamp', '>=', Timestamp.fromDate(since))
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting chat count:', error);
      return 0;
    }
  };

  const refresh = () => {
    setLoading(true);
    checkUsage();
  };

  return { usage, loading, refresh };
}

// 使用制限の警告メッセージを生成
export function getUsageLimitMessage(
  feature: FeatureType,
  usage: UsageStatus,
  subscription: string
): string {
  if (usage.allowed) {
    if (usage.limit === -1) {
      return '無制限でご利用いただけます';
    }
    return `残り${usage.remaining}回ご利用いただけます（今月: ${usage.used}/${usage.limit}回）`;
  }

  const featureNames: Record<FeatureType, string> = {
    tarot: 'タロット占い',
    palm: '手相占い',
    iching: '易占い',
    aiChat: 'AIチャット',
    compatibility: '相性診断',
  };

  const plan = PLANS[subscription as keyof typeof PLANS];
  const featureName = featureNames[feature];

  return `今月の${featureName}の利用回数（${usage.limit}回）に達しました。${
    subscription === 'free'
      ? 'プランをアップグレードして無制限でご利用ください。'
      : subscription === 'basic'
      ? 'プレミアムプランにアップグレードして無制限でご利用ください。'
      : '来月まで引き続きご利用いただけません。'
  }`;
}
