// src/lib/usage-tracker.ts
// 使用回数追跡とプラン制限チェックのヘルパー関数

import { adminDb } from './firebase-admin';
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

    // 月が変わっていたら使用回数は0としてカウント（有料プランのみ）
    let currentUsage = 0;
    if (subscription !== 'free' && userMonth !== currentMonth) {
      // 有料プランで月が変わっている場合は0からスタート
      currentUsage = 0;
    } else {
      // 無料プランまたは同じ月の場合は既存の値を使用
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

    // 次のリセット日（来月1日）- 無料プランの場合はnull
    let resetDate;
    if (subscription !== 'free') {
      const now = new Date();
      resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

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
 * Admin SDKを使った使用回数記録（増加）
 * 有料プランの場合のみ月が変わったら自動的にリセット
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

    // 有料プランの場合のみ月次リセット
    if (subscription !== 'free' && userMonth !== currentMonth) {
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
      // 通常の増加（無料プランは永遠にカウントアップ）
      const currentValue = userData[usageField] || 0;
      await userRef.update({
        [usageField]: currentValue + 1,
        lastReadingAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✅ ${usageField} を +1 しました (${currentValue} → ${currentValue + 1})`);
      
      // 無料プランの場合は警告ログ
      if (subscription === 'free') {
        console.log(`⚠️ 無料プラン: 使用回数は永続的にカウント（リセットなし）`);
      }
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
    if (subscription === 'free') {
      // 無料プランの場合はリセット日なし
      return `今月の${featureName}の利用回数上限（${result.limit}回）に達しました。\n\n` +
             `無料プランの使用回数は月次リセットされません。\n\n` +
             `続けてご利用したい場合は、プランをアップグレードしてください!`;
    } else {
      // 有料プランの場合はリセット日を表示
      const resetDateStr = result.resetDate 
        ? result.resetDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
        : '来月1日';

      return `今月の${featureName}の利用回数上限（${result.limit}回）に達しました。\n\n` +
             `${resetDateStr}にリセットされます。\n\n` +
             `今すぐ続けたい場合は、プランをアップグレードしてください!`;
    }
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