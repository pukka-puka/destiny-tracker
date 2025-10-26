# 📊 ユーザー統計フィールド初期化ガイド

## 🎯 目的

全ユーザーのFirestoreドキュメントに、使用回数追跡のための統計フィールドを追加します。

## 📋 追加されるフィールド

```typescript
{
  readingCount: 0,           // タロット占い使用回数
  palmReadingCount: 0,       // 手相占い使用回数
  ichingCount: 0,            // 易占い使用回数
  chatConsultCount: 0,       // AIチャット使用回数
  compatibilityCount: 0,     // 相性診断使用回数
  currentMonth: "2025-10",   // 集計対象月
  lastReadingAt: null,       // 最終使用日時
  statsInitializedAt: Date   // 初期化日時
}
```

## 🚀 実行手順

### 1. 前提条件の確認

以下の環境変数が `.env.local` に設定されていることを確認:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

### 2. スクリプトファイルの配置

`init-user-stats.ts` をプロジェクトルートまたは `scripts/` ディレクトリに配置してください。

### 3. 依存パッケージの確認

Firebase Admin SDKがインストールされていることを確認:

```bash
npm list firebase-admin
```

もしインストールされていなければ:

```bash
npm install firebase-admin
```

### 4. TypeScript設定の確認

`tsconfig.json` で以下が設定されていることを確認:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### 5. スクリプトの実行

#### 方法1: ts-nodeを使用（推奨）

```bash
# ts-nodeをインストール（まだの場合）
npm install -D ts-node

# スクリプト実行
npx ts-node init-user-stats.ts
```

#### 方法2: TypeScriptをコンパイルしてから実行

```bash
# TypeScriptをコンパイル
npx tsc init-user-stats.ts

# コンパイルされたJSを実行
node init-user-stats.js
```

#### 方法3: package.jsonにスクリプトを追加

`package.json` に以下を追加:

```json
{
  "scripts": {
    "init-stats": "ts-node scripts/init-user-stats.ts"
  }
}
```

実行:

```bash
npm run init-stats
```

## 📊 実行結果の例

```
🚀 ユーザー統計フィールド初期化スクリプト開始
📅 現在の月: 2025-10

👥 対象ユーザー数: 5人

✅ 更新完了: user1@example.com
✅ 更新完了: user2@example.com
⏭️  スキップ: user3@example.com (すでに初期化済み)
✅ 更新完了: user4@example.com
✅ 更新完了: user5@example.com

==================================================
📊 実行結果サマリー
==================================================
✅ 成功: 4人
⏭️  スキップ: 1人
❌ エラー: 0人
📝 合計: 5人

🎉 すべてのユーザーの統計フィールド初期化が完了しました!

✨ スクリプト実行完了
```

## ✅ 実行後の確認

### Firebaseコンソールで確認

1. [Firebaseコンソール](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. Firestore Database → `users` コレクション
4. 任意のユーザードキュメントを開く
5. 以下のフィールドが追加されていることを確認:
   - `readingCount: 0`
   - `palmReadingCount: 0`
   - `ichingCount: 0`
   - `chatConsultCount: 0`
   - `compatibilityCount: 0`
   - `currentMonth: "2025-10"`
   - `lastReadingAt: null`
   - `statsInitializedAt: Timestamp`

## ⚠️ トラブルシューティング

### エラー: Firebase環境変数が設定されていません

**原因**: `.env.local` に Firebase Admin SDK の認証情報が設定されていない

**解決策**:
1. Firebaseコンソール → プロジェクト設定 → サービスアカウント
2. 「新しい秘密鍵の生成」をクリック
3. ダウンロードしたJSONファイルから値をコピーして `.env.local` に追加

### エラー: Cannot find module 'firebase-admin'

**原因**: Firebase Admin SDKがインストールされていない

**解決策**:
```bash
npm install firebase-admin
```

### エラー: Unexpected token 'export'

**原因**: TypeScriptファイルを直接nodeで実行しようとしている

**解決策**: ts-nodeを使用するか、先にコンパイルしてください
```bash
npx ts-node init-user-stats.ts
```

## 🔄 再実行について

このスクリプトは**冪等性**があります:
- すでに統計フィールドが存在するユーザーはスキップされます
- 何度実行しても安全です
- 既存データは上書きされません

## 📝 次のステップ

統計フィールドの初期化が完了したら、次は以下を実装します:

1. ✅ 統計フィールド初期化（完了）
2. 🔲 各APIに統計更新処理を追加
3. 🔲 月次リセット機能の実装
4. 🔲 ダッシュボードに使用状況を表示

---

## 📞 サポート

問題が発生した場合は、以下の情報を提供してください:
- エラーメッセージ全文
- Node.jsバージョン (`node -v`)
- npm/yarnバージョン
- 実行したコマンド
