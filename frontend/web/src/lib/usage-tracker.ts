// src/lib/usage-tracker.ts
// 使用回数追跡とプラン制限チェックのヘルパー関数

import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { PLANS } from './plans';

/**
 * 現在の月を取得 (YYYY-MM形式)
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 使用回数のフィールド名
 */
export type UsageField = 
  | 'readingCount'        // タロット占い
  | 'palmReadingCount'    // 手相占い
  | 'ichingCount'         // 易占い
  | 'chatConsultCount'    // AIチャット
  | 'compatibilityCount'; // 相性診断

/**
 * プラン制限チェック結果
 */
export interface UsageLimitResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  resetDate?: Date;
}

/**
 * ユーザーの使用制限をチェック
 * 
 * @param userId - ユーザーID
 * @param usageField - チェックする使用回数フィールド
 * @returns 使用可能かどうかの情報
 */
export async function checkUsageLimit(
  userId: string,
  usageField: UsageField
): Promise<UsageLimitResult> {
  try {
    // ユーザー情報を取得
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const subscription = userData.subscription || 'free';
    const currentMonth = getCurrentMonth();
    const userMonth = userData.currentMonth || '';

    // 月が変わっていたら使用回数は0としてカウント
    let currentUsage = 0;
    if (userMonth === currentMonth) {
      currentUsage = userData[usageField] || 0;
    }

    // プランの制限を取得
    const plan = PLANS[subscription as keyof typeof PLANS];
    
    // 使用回数フィールドに対応するプラン機能を取得
    let featureLimit = -1; // -1は無制限
    
    switch (usageField) {
      case 'readingCount':
        featureLimit = plan.features.tarot.limit;
        break;
      case 'palmReadingCount':
        featureLimit = plan.features.palm.limit;
        break;
      case 'ichingCount':
        featureLimit = plan.features.iching.limit;
        break;
      case 'chatConsultCount':
        featureLimit = plan.features.aiChat.limit;
        break;
      case 'compatibilityCount':
        featureLimit = plan.features.compatibility.limit;
        break;
    }

    // 無制限の場合
    if (featureLimit === -1) {
      return {
        allowed: true,
        currentUsage,
        limit: -1,
        remaining: -1,
      };
    }

    // 制限に達しているかチェック
    const allowed = currentUsage < featureLimit;
    const remaining = Math.max(0, featureLimit - currentUsage);

    // 次のリセット日（来月1日）
    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      allowed,
      currentUsage,
      limit: featureLimit,
      remaining,
      resetDate,
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    throw error;
  }
}

/**
 * 使用回数を記録（増加）
 * 月が変わっていた場合は自動的にリセットしてから増加
 * 
 * @param userId - ユーザーID
 * @param usageField - 増加させる使用回数フィールド
 */
export async function trackUsage(
  userId: string,
  usageField: UsageField
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const currentMonth = getCurrentMonth();
    const userMonth = userData.currentMonth || '';

    // 月が変わっていた場合はリセット
    if (userMonth !== currentMonth) {
      console.log(`📅 月が変わりました: ${userMonth} → ${currentMonth}`);
      console.log('🔄 使用回数をリセットします');

      await updateDoc(userRef, {
        readingCount: 0,
        palmReadingCount: 0,
        ichingCount: 0,
        chatConsultCount: 0,
        compatibilityCount: 0,
        currentMonth: currentMonth,
        [usageField]: 1, // 今回の使用分を記録
        lastReadingAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ リセット完了 & 使用回数を記録');
    } else {
      // 通常の増加
      await updateDoc(userRef, {
        [usageField]: increment(1),
        lastReadingAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ ${usageField} を +1 しました`);
    }
  } catch (error) {
    console.error('Error tracking usage:', error);
    throw error;
  }
}

/**
 * プラン制限エラーメッセージを生成
 * 
 * @param usageField - 使用回数フィールド
 * @param result - 制限チェック結果
 * @param subscription - 現在のプラン
 * @returns エラーメッセージ
 */
export function getUsageLimitMessage(
  usageField: UsageField,
  result: UsageLimitResult,
  subscription: string
): string {
  const featureNames: Record<UsageField, string> = {
    readingCount: 'タロット占い',
    palmReadingCount: '手相占い',
    ichingCount: '易占い',
    chatConsultCount: 'AIチャット',
    compatibilityCount: '相性診断',
  };

  const featureName = featureNames[usageField];
  const planName = subscription === 'free' ? '無料プラン' : 
                   subscription === 'basic' ? 'ベーシックプラン' : 
                   'プレミアムプラン';

  if (result.limit === -1) {
    return `${featureName}は無制限でご利用いただけます!`;
  }

  if (!result.allowed) {
    const resetDateStr = result.resetDate 
      ? result.resetDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
      : '来月1日';

    return `今月の${featureName}の利用回数上限（${result.limit}回）に達しました。\n\n` +
           `${resetDateStr}にリセットされます。\n\n` +
           `今すぐ続けたい場合は、プランをアップグレードしてください!`;
  }

  return `${featureName}を利用できます（残り${result.remaining}回）`;
}

/**
 * APIハンドラーで使う統合関数
 * 制限チェック → 使用記録を一度に実行
 * 
 * @param userId - ユーザーID
 * @param usageField - 使用回数フィールド
 * @returns 使用可能かどうか
 */
export async function checkAndTrackUsage(
  userId: string,
  usageField: UsageField
): Promise<{ allowed: boolean; message?: string; result: UsageLimitResult }> {
  try {
    // 制限チェック
    const result = await checkUsageLimit(userId, usageField);

    // 制限に達している場合
    if (!result.allowed) {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const subscription = userDoc.exists() ? userDoc.data().subscription : 'free';
      
      return {
        allowed: false,
        message: getUsageLimitMessage(usageField, result, subscription),
        result,
      };
    }

    // 使用回数を記録
    await trackUsage(userId, usageField);

    return {
      allowed: true,
      result,
    };
  } catch (error) {
    console.error('Error in checkAndTrackUsage:', error);
    throw error;
  }
}