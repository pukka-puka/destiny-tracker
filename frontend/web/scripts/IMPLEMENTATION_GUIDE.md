# 📊 フェーズ1: ユーザー統計フィールド初期化 - 完全実装ガイド

## 🎯 目標

全ユーザーに使用回数追跡用の統計フィールドを追加し、Stripe課金システムと連携できるようにする。

---

## 📦 配布ファイル一覧

```
phase1-user-stats-initialization/
├── init-user-stats.ts              # メインスクリプト
├── run-init-stats.sh               # 実行用シェルスクリプト
├── AuthContext-stats-addition.tsx  # AuthContext修正コード
├── INIT_USER_STATS_GUIDE.md       # 詳細ガイド
└── IMPLEMENTATION_GUIDE.md         # このファイル
```

---

## 🚀 実装手順

### ステップ1: プロジェクトへのファイル配置

#### 1-1. スクリプトファイルの配置

```bash
# プロジェクトルートに移動
cd /path/to/destiny-tracker/frontend/web

# scriptsディレクトリを作成（なければ）
mkdir -p scripts

# スクリプトファイルを配置
cp init-user-stats.ts scripts/
cp run-init-stats.sh ./
```

#### 1-2. 実行権限の付与

```bash
chmod +x run-init-stats.sh
```

---

### ステップ2: 環境変数の確認

`.env.local` に以下の環境変数が設定されていることを確認:

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

#### Firebase Admin SDK認証情報の取得方法

1. [Firebaseコンソール](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. ⚙️ プロジェクト設定 → サービスアカウント
4. 「新しい秘密鍵の生成」をクリック
5. ダウンロードしたJSONファイルから以下をコピー:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (改行を `\n` に置き換え)

---

### ステップ3: スクリプト実行

#### 方法1: シェルスクリプトを使用（推奨）

```bash
./run-init-stats.sh
```

#### 方法2: 直接実行

```bash
# ts-nodeをインストール（まだの場合）
npm install -D ts-node

# 環境変数を読み込んでスクリプト実行
source .env.local && npx ts-node scripts/init-user-stats.ts
```

#### 方法3: package.jsonにコマンド追加

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

---

### ステップ4: 実行結果の確認

#### 4-1. コンソール出力の確認

正常に実行されると以下のような出力が表示されます:

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
```

#### 4-2. Firebaseコンソールで確認

1. [Firebaseコンソール](https://console.firebase.google.com/) を開く
2. プロジェクトを選択
3. Firestore Database → `users` コレクション
4. 任意のユーザードキュメントを開く
5. 以下のフィールドが追加されていることを確認:

```javascript
{
  // 既存フィールド
  uid: "xxx",
  email: "user@example.com",
  subscription: "free",
  
  // 新規追加された統計フィールド
  readingCount: 0,
  palmReadingCount: 0,
  ichingCount: 0,
  chatConsultCount: 0,
  compatibilityCount: 0,
  currentMonth: "2025-10",
  lastReadingAt: null,
  statsInitializedAt: Timestamp(2025, 10, 26, 12, 0, 0)
}
```

---

### ステップ5: AuthContextの修正

新規ユーザー登録時に自動的に統計フィールドを追加するため、AuthContextを修正します。

#### 5-1. ファイルの場所

```
src/contexts/AuthContext.tsx
```

#### 5-2. 修正内容

`AuthContext-stats-addition.tsx` ファイルの内容を参考に、以下を追加:

1. **統計フィールド初期化関数を追加**:
   ```typescript
   function getCurrentMonth(): string { ... }
   function getInitialUserStats(): UserStatsFields { ... }
   ```

2. **createUserProfile関数を修正**:
   - 新規ユーザー作成時に統計フィールドを含める
   - 既存ユーザーで統計フィールドがない場合は追加

3. **UserProfile型定義に統計フィールドを追加**:
   ```typescript
   readingCount: number;
   palmReadingCount: number;
   ichingCount: number;
   chatConsultCount: number;
   compatibilityCount: number;
   currentMonth: string;
   lastReadingAt: Timestamp | null;
   statsInitializedAt?: Timestamp;
   ```

#### 5-3. 修正後の動作確認

1. 新規ユーザーでサインアップ
2. Firebaseコンソールで該当ユーザーを確認
3. 統計フィールドが自動的に追加されていることを確認

---

## ✅ チェックリスト

### 実装前
- [ ] `.env.local` にFirebase Admin SDK認証情報を設定
- [ ] firebase-adminパッケージがインストール済み
- [ ] プロジェクト構造を確認

### 実行時
- [ ] スクリプトが正常に実行される
- [ ] エラーが発生していない
- [ ] 対象ユーザー数が正しい

### 実行後
- [ ] Firebaseコンソールで統計フィールドを確認
- [ ] すべてのユーザーに統計フィールドが追加されている
- [ ] AuthContext.tsxを修正
- [ ] 新規ユーザーで統計フィールドが自動追加されることを確認

---

## ⚠️ トラブルシューティング

### エラー: Firebase環境変数が設定されていません

**原因**: `.env.local` に必要な環境変数がない

**解決策**:
1. Firebaseコンソールからサービスアカウントのキーを取得
2. `.env.local` に追加
3. 再度スクリプトを実行

### エラー: Cannot find module 'firebase-admin'

**原因**: Firebase Admin SDKがインストールされていない

**解決策**:
```bash
npm install firebase-admin
```

### エラー: Permission denied

**原因**: シェルスクリプトに実行権限がない

**解決策**:
```bash
chmod +x run-init-stats.sh
```

### 一部のユーザーでエラーが発生

**原因**: Firestoreのセキュリティルールまたはデータ形式の問題

**解決策**:
1. エラーログを確認
2. 該当ユーザーのドキュメント構造を確認
3. 必要に応じて手動で修正

---

## 🔄 再実行について

このスクリプトは**冪等性**があります:
- すでに統計フィールドが存在するユーザーは自動的にスキップ
- 何度実行しても既存データは上書きされません
- 安全に再実行可能

---

## 📝 次のステップ

フェーズ1が完了したら、次は以下を実装します:

### フェーズ2: API統計更新処理の追加
- タロット占いAPI
- 手相占いAPI
- 易占いAPI
- AIチャットAPI
- 相性診断API

### フェーズ3: 月次リセット機能
- 月が変わったら自動的にカウントをリセット
- Stripe課金サイクルとの同期

### フェーズ4: ダッシュボード改善
- 今月の使用状況表示
- 残り回数の可視化
- プランアップグレード誘導

---

## 📞 サポート

問題が発生した場合は、以下の情報を提供してください:
- エラーメッセージ全文
- 実行したコマンド
- Node.jsバージョン (`node -v`)
- Firebaseコンソールのスクリーンショット（可能であれば）

---

**🎉 フェーズ1実装完了までもう少しです!頑張りましょう!**
