// scripts/init-user-stats.ts
// .env.localを明示的に読み込む
import { config } from 'dotenv';
import { resolve } from 'path';

// .env.localを読み込む
config({ path: resolve(process.cwd(), '.env.local') });

// 全ユーザーに統計フィールドを追加するスクリプト
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Firebase Admin初期化
if (!getApps().length) {
  // 環境変数から認証情報を取得
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    console.error('❌ Firebase環境変数が設定されていません');
    console.error('必要な環境変数:');
    console.error('  - FIREBASE_PROJECT_ID');
    console.error('  - FIREBASE_CLIENT_EMAIL');
    console.error('  - FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = getFirestore();

// 現在の月を取得 (YYYY-MM形式)
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// ユーザー統計フィールドの初期値
interface UserStats {
  readingCount: number;
  palmReadingCount: number;
  ichingCount: number;
  chatConsultCount: number;
  compatibilityCount: number;
  currentMonth: string;
  lastReadingAt: null;
  statsInitializedAt: Date;
}

const initialStats: UserStats = {
  readingCount: 0,
  palmReadingCount: 0,
  ichingCount: 0,
  chatConsultCount: 0,
  compatibilityCount: 0,
  currentMonth: getCurrentMonth(),
  lastReadingAt: null,
  statsInitializedAt: new Date(),
};

async function initializeUserStats() {
  console.log('🚀 ユーザー統計フィールド初期化スクリプト開始');
  console.log('📅 現在の月:', getCurrentMonth());
  console.log('🔧 環境設定確認:');
  console.log(`   PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`   CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL?.substring(0, 20)}...`);
  console.log(`   PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY ? '設定済み' : '未設定'}`);
  console.log('');

  try {
    // 全ユーザーを取得
    const usersSnapshot = await db.collection('users').get();
    console.log(`👥 対象ユーザー数: ${usersSnapshot.size}人`);
    console.log('');

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // 各ユーザーを処理
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      try {
        // すでに統計フィールドがある場合はスキップ
        if (userData.readingCount !== undefined && userData.currentMonth !== undefined) {
          console.log(`⏭️  スキップ: ${userData.email || userId} (すでに初期化済み)`);
          skipCount++;
          continue;
        }

        // 統計フィールドを追加
        await db.collection('users').doc(userId).update({
          ...initialStats,
          updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`✅ 更新完了: ${userData.email || userId}`);
        successCount++;
      } catch (error: any) {
        console.error(`❌ エラー: ${userData.email || userId} - ${error.message}`);
        errorCount++;
      }
    }

    console.log('');
    console.log('='.repeat(50));
    console.log('📊 実行結果サマリー');
    console.log('='.repeat(50));
    console.log(`✅ 成功: ${successCount}人`);
    console.log(`⏭️  スキップ: ${skipCount}人`);
    console.log(`❌ エラー: ${errorCount}人`);
    console.log(`📝 合計: ${usersSnapshot.size}人`);
    console.log('');

    if (errorCount === 0) {
      console.log('🎉 すべてのユーザーの統計フィールド初期化が完了しました!');
    } else {
      console.log('⚠️  一部のユーザーでエラーが発生しました。ログを確認してください。');
    }

  } catch (error: any) {
    console.error('❌ スクリプト実行エラー:', error);
    process.exit(1);
  }
}

// スクリプト実行
initializeUserStats()
  .then(() => {
    console.log('');
    console.log('✨ スクリプト実行完了');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 予期しないエラー:', error);
    process.exit(1);
  });
