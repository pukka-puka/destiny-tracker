// src/lib/usage-tracker.ts
// 使用回数追跡とプラン制限チェックのヘルパー関数

import { adminDb } from './firebase-admin';
import { PLANS, canUseFeature } from './plans';

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
  lifetimeUsage: number;
  limit: number;
  remaining: number;
  resetDate?: Date;
  period: 'month' | 'lifetime';
}

/**
 * Admin SDKを使った使用制限チェック
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
    // Admin SDKでユーザー情報を取得
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data()!;
    const subscription = userData.subscription || 'free';
    const currentMonth = getCurrentMonth();
    const userMonth = userData.currentMonth || '';

    // 無料プランは累計、有料プランは月間で判断
    let currentUsage = userData[usageField] || 0;
    const lifetimeUsage = userData[usageField] || 0; // 累計使用回数

    // 有料プランで月が変わっている場合のみリセット扱い
    if (subscription !== 'free' && userMonth !== currentMonth) {
      currentUsage = 0; // 新しい月なので0からスタート
    }

    // プランの制限を取得
    const plan = PLANS[subscription as keyof typeof PLANS];
    
    // 使用回数フィールドに対応するプラン機能を取得
    let featureKey: keyof typeof plan.features;
    
    switch (usageField) {
      case 'readingCount':
        featureKey = 'tarot';
        break;
      case 'palmReadingCount':
        featureKey = 'palm';
        break;
      case 'ichingCount':
        featureKey = 'iching';
        break;
      case 'chatConsultCount':
        featureKey = 'aiChat';
        break;
      case 'compatibilityCount':
        featureKey = 'compatibility';
        break;
    }

    // canUseFeature関数を使用してチェック
    const usageCheck = canUseFeature(
      subscription as any,
      featureKey,
      currentUsage,
      lifetimeUsage
    );

    // 次のリセット日（来月1日）- 無料プランまたはlifetime制限の場合はnull
    let resetDate;
    const featureConfig = plan.features[featureKey] as any;
    const period = featureConfig.period || 'month';
    
    if (subscription !== 'free' && period === 'month') {
      const now = new Date();
      resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    return {
      allowed: usageCheck.allowed,
      currentUsage,
      lifetimeUsage,
      limit: usageCheck.limit,
      remaining: usageCheck.remaining,
      resetDate,
      period,
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    throw error;
  }
}

/**
 * Admin SDKを使った使用回数記録（増加）
 * 無料プランは累計のみ、有料プランは月次リセット対応
 * 
 * @param userId - ユーザーID
 * @param usageField - 増加させる使用回数フィールド
 */
export async function trackUsage(
  userId: string,
  usageField: UsageField
): Promise<void> {
  try {
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data()!;
    const subscription = userData.subscription || 'free';
    const currentMonth = getCurrentMonth();
    const userMonth = userData.currentMonth || '';

    // 無料プランは累計カウント（リセットなし）
    if (subscription === 'free') {
      const currentValue = userData[usageField] || 0;
      await userRef.update({
        [usageField]: currentValue + 1,
        lastReadingAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ 無料プラン（累計）: ${usageField} を +1 しました (${currentValue} → ${currentValue + 1})`);
      return;
    }

    // 有料プランの場合のみ月次リセット
    if (userMonth !== currentMonth) {
      console.log(`📅 月が変わりました: ${userMonth} → ${currentMonth}`);
      console.log(`🔄 ${subscription}プランの使用回数をリセットします`);

      await userRef.update({
        readingCount: 0,
        palmReadingCount: 0,
        ichingCount: 0,
        chatConsultCount: 0,
        compatibilityCount: 0,
        currentMonth: currentMonth,
        [usageField]: 1, // 今回の使用分を記録
        lastReadingAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ リセット完了 & 使用回数を記録');
    } else {
      // 通常の増加（有料プランの月間カウント）
      const currentValue = userData[usageField] || 0;
      await userRef.update({
        [usageField]: currentValue + 1,
        lastReadingAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✅ ${subscription}プラン（月間）: ${usageField} を +1 しました (${currentValue} → ${currentValue + 1})`);
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
    if (result.period === 'lifetime') {
      // lifetime制限の場合（主に無料プラン）
      return `${featureName}の利用回数上限（累計${result.limit}回）に達しました。\n\n` +
             `無料プランの使用回数はリセットされません。\n\n` +
             `続けてご利用したい場合は、プランをアップグレードしてください!`;
    } else {
      // 月間制限の場合（有料プラン）
      const resetDateStr = result.resetDate 
        ? result.resetDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
        : '来月1日';

      return `今月の${featureName}の利用回数上限（${result.limit}回）に達しました。\n\n` +
             `${resetDateStr}にリセットされます。\n\n` +
             `今すぐ続けたい場合は、プランをアップグレードしてください!`;
    }
  }

  const periodText = result.period === 'lifetime' ? '累計' : '今月';
  return `${featureName}を利用できます（${periodText}残り${result.remaining}回）`;
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
      const userRef = adminDb.collection('users').doc(userId);
      const userDoc = await userRef.get();
      const subscription = userDoc.exists ? userDoc.data()!.subscription : 'free';
      
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