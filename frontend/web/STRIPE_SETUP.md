# 💳 Stripe統合セットアップガイド

## 📋 概要
このガイドでは、ShukumeiにStripe決済を統合する手順を説明します。

---

## 🚀 セットアップ手順

### 1. Stripeアカウント作成

1. [Stripe](https://stripe.com/jp)にアクセス
2. 「アカウント作成」をクリック
3. 必要情報を入力してアカウント作成
4. ダッシュボードにログイン

### 2. APIキーの取得

1. Stripeダッシュボードで「開発者」→「APIキー」にアクセス
2. **公開可能キー（Publishable key）**をコピー
   ```
   pk_test_51xxxxxxxxxxxxxxxxxxxxx
   ```
3. **シークレットキー（Secret key）**をコピー（絶対に公開しない！）
   ```
   sk_test_51xxxxxxxxxxxxxxxxxxxxx
   ```

### 3. 料金プラン（Price）の作成

#### ベーシックプラン（¥980/月）

1. ダッシュボードで「商品」→「商品を追加」
2. 以下を入力：
   - **名前**: Shukumei ベーシックプラン
   - **説明**: 定期的に占いを楽しみたい方に最適
   - **料金**: ¥980
   - **請求期間**: 月次
   - **支払い方法**: 定期支払い
3. 「商品を作成」をクリック
4. **Price ID**をコピー（`price_xxxxxxxxxx`形式）

#### プレミアムプラン（¥2,980/月）

1. 同様に新しい商品を作成：
   - **名前**: Shukumei プレミアムプラン
   - **説明**: すべての機能を無制限で使いたい方へ
   - **料金**: ¥2,980
   - **請求期間**: 月次
   - **支払い方法**: 定期支払い
2. **Price ID**をコピー

### 4. Webhookの設定

1. ダッシュボードで「開発者」→「Webhook」にアクセス
2. 「エンドポイントを追加」をクリック
3. 以下を設定：
   - **エンドポイントURL**: `https://yourdomain.com/api/stripe/webhook`
     - 開発環境: `http://localhost:3000/api/stripe/webhook`（Stripe CLIを使用）
   - **説明**: Shukumei Webhook
   - **イベント**: 以下を選択
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. 「エンドポイントを追加」をクリック
5. **Webhook署名シークレット**をコピー（`whsec_xxxxxxxxxx`形式）

### 5. 環境変数の設定

`.env.local` ファイルに以下を追加：

```bash
# Stripe設定
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# プラン価格ID
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_xxxxxxxxxxxxx

# アプリケーションURL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 6. Stripe CLIのインストール（ローカル開発用）

```bash
# Homebrewでインストール（Mac）
brew install stripe/stripe-cli/stripe

# ログイン
stripe login

# Webhookをローカルにフォワード
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

これにより、Webhook署名シークレットが表示されます：
```
Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### 7. Firebase Admin SDKの設定

Webhook処理にFirebase Admin SDKが必要です。

#### Firebase Admin SDK認証情報の取得

1. [Firebaseコンソール](https://console.firebase.google.com/)にアクセス
2. プロジェクト設定 → サービスアカウント
3. 「新しい秘密鍵の生成」をクリック
4. JSONファイルがダウンロードされます

#### 環境変数に追加

`.env.local` に以下を追加（JSONファイルから値をコピー）：

```bash
FIREBASE_PROJECT_ID=shukumei-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@shukumei-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

**注意**: `FIREBASE_PRIVATE_KEY`は改行を`\n`に置き換えてダブルクォートで囲む

### 8. Firebase Admin初期化ファイルの作成

`src/lib/firebase-admin.ts` を作成：

```typescript
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminDb = getFirestore();
```

---

## 🧪 テスト方法

### 1. ローカル開発環境でテスト

```bash
# 開発サーバー起動
cd frontend/web
npm run dev

# 別ターミナルでStripe CLI起動
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 2. テストカード番号

Stripeは開発環境で使えるテストカード番号を提供しています：

| カード番号 | 結果 |
|-----------|------|
| 4242 4242 4242 4242 | 成功 |
| 4000 0000 0000 0002 | カード拒否 |
| 4000 0000 0000 9995 | 資金不足 |

- **有効期限**: 任意の未来の日付（例: 12/25）
- **CVC**: 任意の3桁（例: 123）
- **郵便番号**: 任意の5桁（例: 12345）

### 3. 決済フローのテスト

1. `http://localhost:3000/pricing` にアクセス
2. プランを選択
3. テストカード情報を入力
4. 支払い完了を確認
5. Stripe CLIでWebhookイベントを確認
6. Firestoreでユーザー情報が更新されているか確認

---

## 🚀 本番環境へのデプロイ

### 1. 本番用APIキーに切り替え

Stripeダッシュボードで「本番環境」に切り替えて、本番用のAPIキーを取得

### 2. Vercelに環境変数を設定

```bash
# Vercel CLIを使用
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID
vercel env add NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID
vercel env add NEXT_PUBLIC_BASE_URL
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_CLIENT_EMAIL
vercel env add FIREBASE_PRIVATE_KEY
```

または、Vercelダッシュボードで直接設定

### 3. Webhook URLを本番環境に変更

Stripeダッシュボードで Webhook エンドポイントを更新：
```
https://shukumei.vercel.app/api/stripe/webhook
```

---

## ✅ 動作確認チェックリスト

- [ ] Stripeアカウント作成完了
- [ ] APIキー取得完了（公開可能キー・シークレットキー）
- [ ] 商品・料金プラン作成完了（ベーシック・プレミアム）
- [ ] Webhook設定完了
- [ ] 環境変数設定完了（`.env.local`）
- [ ] Firebase Admin SDK設定完了
- [ ] Stripe CLI動作確認
- [ ] テストカードで決済テスト成功
- [ ] Webhookイベント受信確認
- [ ] Firestoreデータ更新確認

---

## 🎯 次のステップ

1. ✅ Stripe統合完了
2. 使用制限機能の実装（各機能で制限チェック）
3. サブスクリプション管理画面のUI改善
4. メール通知機能（支払い成功・失敗）
5. 請求書自動発行

---

## 📚 参考リンク

- [Stripe公式ドキュメント](https://stripe.com/docs)
- [Next.js Stripe統合ガイド](https://stripe.com/docs/payments/checkout/how-checkout-works)
- [Stripe Webhookガイド](https://stripe.com/docs/webhooks)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

## 💡 トラブルシューティング

### Webhook署名検証エラー

```
Error: No signatures found matching the expected signature for payload
```

**解決策**: Stripe CLIでWebhookをフォワードして、正しい署名シークレットを使用

### Firebase Admin初期化エラー

```
Error: Failed to parse private key
```

**解決策**: `FIREBASE_PRIVATE_KEY`の改行が正しく`\n`に置き換えられているか確認

### 支払い後にユーザー情報が更新されない

**確認事項**:
1. Webhookが正しく受信されているか（Stripe CLI・ダッシュボードで確認）
2. `userId`がmetadataに正しく設定されているか
3. Firestoreのルールが書き込みを許可しているか

---

**セットアップ完了！**🎉

何か問題があれば、このガイドを参照してください。
