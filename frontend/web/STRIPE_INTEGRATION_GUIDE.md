# 💳 Destiny Tracker - Stripe統合完全ガイド

## 📋 目次
1. [実装内容](#実装内容)
2. [料金プラン設計](#料金プラン設計)
3. [セットアップ手順](#セットアップ手順)
4. [各機能への統合方法](#各機能への統合方法)
5. [テスト方法](#テスト方法)
6. [本番環境デプロイ](#本番環境デプロイ)

---

## 🎯 実装内容

### 新規作成ファイル一覧

```
frontend/web/
├── src/
│   ├── lib/
│   │   └── plans.ts                                    # 料金プラン定義
│   ├── hooks/
│   │   └── useUsageLimits.ts                          # 使用制限フック
│   ├── app/
│   │   ├── pricing/
│   │   │   └── page.tsx                               # 料金ページ
│   │   ├── subscription/
│   │   │   └── page.tsx                               # サブスク管理
│   │   ├── payment/
│   │   │   └── success/page.tsx                       # 支払い成功
│   │   └── api/
│   │       └── stripe/
│   │           ├── create-checkout-session/route.ts   # Checkout作成
│   │           ├── cancel-subscription/route.ts       # サブスクキャンセル
│   │           └── webhook/route.ts                   # Webhook処理
│   └── lib/
│       └── firebase-admin.ts                          # Admin SDK（新規作成必要）
├── .env.example                                        # 環境変数テンプレート
├── STRIPE_SETUP.md                                    # セットアップガイド
└── USAGE_LIMITS_EXAMPLE.tsx                           # 使用制限実装例
```

---

## 💎 料金プラン設計

### プラン比較表

| 機能 | 無料 | ベーシック (¥980/月) | プレミアム (¥2,980/月) |
|------|------|---------------------|----------------------|
| タロット占い | 月3回 | **無制限** | **無制限** |
| 手相占い | 月1回 | 月5回 | **無制限** |
| 易占い | 月2回 | 月10回 | **無制限** |
| AIチャット | なし | 月100回 | **無制限** |
| 相性診断 | 月1回 | 月10回 | **無制限** |
| 履歴保存 | 30日 | 1年間 | 無期限 |
| 広告 | あり | なし | なし |
| PDF出力 | - | ○ | ○ |
| 詳細分析 | - | - | ○ |
| 優先サポート | - | - | ○ |

### ターゲットユーザー

- **無料プラン**: お試しユーザー、ライトユーザー
- **ベーシックプラン**: 定期的に占いを楽しむユーザー
- **プレミアムプラン**: ヘビーユーザー、ビジネス利用

### 収益予測（6ヶ月後）

| プラン | ユーザー数 | 単価 | 月商 |
|--------|----------|------|------|
| 無料 | 8,000人 | ¥0 | ¥0 |
| ベーシック | 1,500人 | ¥980 | ¥1,470,000 |
| プレミアム | 500人 | ¥2,980 | ¥1,490,000 |
| **合計** | **10,000人** | - | **¥2,960,000** |

---

## 🚀 セットアップ手順

### ステップ1: Stripeアカウント作成

1. [Stripe](https://stripe.com/jp)でアカウント作成
2. ダッシュボードにログイン
3. 「開発者」モードを有効化

### ステップ2: 料金プランの作成

#### ベーシックプラン

1. ダッシュボード → 商品 → 「商品を追加」
2. 設定:
   - 名前: `Destiny Tracker ベーシックプラン`
   - 価格: `¥980`
   - 請求期間: `月次`
   - 課金タイプ: `定期支払い`
3. Price IDをコピー（例: `price_1QRs...`）

#### プレミアムプラン

1. 同様に作成:
   - 名前: `Destiny Tracker プレミアムプラン`
   - 価格: `¥2,980`
   - 請求期間: `月次`
2. Price IDをコピー

### ステップ3: APIキーの取得

1. ダッシュボード → 開発者 → APIキー
2. **公開可能キー（Publishable key）**: `pk_test_...`
3. **シークレットキー（Secret key）**: `sk_test_...`

### ステップ4: Webhookの設定

1. 開発者 → Webhook → 「エンドポイントを追加」
2. URL: `http://localhost:3000/api/stripe/webhook`（開発環境）
3. イベント選択:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Webhook署名シークレットをコピー: `whsec_...`

### ステップ5: 環境変数の設定

`.env.local` を作成:

```bash
# Stripe設定
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# プラン価格ID
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_xxxxxxxxxxxxx

# アプリURL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Firebase Admin SDK（Firebaseコンソールから取得）
FIREBASE_PROJECT_ID=destiny-tracker-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@destiny-tracker-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

### ステップ6: Firebase Admin SDKの設定

`src/lib/firebase-admin.ts` を作成:

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

### ステップ7: Stripe CLIのインストール（ローカル開発）

```bash
# Homebrewでインストール（Mac）
brew install stripe/stripe-cli/stripe

# ログイン
stripe login

# Webhookをローカルにフォワード
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### ステップ8: 依存関係のインストール

```bash
cd frontend/web

# Firebase Admin SDKをインストール（まだの場合）
npm install firebase-admin

# Stripeはインストール済み（package.jsonで確認済み）
```

### ステップ9: 開発サーバー起動

```bash
# ターミナル1: Next.js開発サーバー
npm run dev

# ターミナル2: Stripe Webhook転送
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 🔧 各機能への統合方法

### 1. タロット占いに使用制限を追加

`src/app/tarot/page.tsx` を編集:

```typescript
import { useUsageLimits, getUsageLimitMessage } from '@/hooks/useUsageLimits';

export default function TarotPage() {
  const { usage, loading, refresh } = useUsageLimits('tarot');
  
  const handleStartReading = () => {
    if (!usage.allowed) {
      alert(getUsageLimitMessage('tarot', usage, userProfile?.subscription || 'free'));
      return;
    }
    // 占いを実行
    startReading();
  };
  
  // 占い完了後に使用回数を更新
  const saveReading = async (result) => {
    await saveToFirestore(result);
    refresh(); // 使用回数を再取得
  };
}
```

### 2. 手相占いに使用制限を追加

同様に `src/app/palm/page.tsx` に追加。

### 3. ダッシュボードにプラン情報を表示

`src/app/dashboard/page.tsx` に追加:

```typescript
import { PLANS } from '@/lib/plans';

const currentPlan = PLANS[userProfile?.subscription || 'free'];

<div className="bg-white/10 rounded-xl p-6">
  <h3 className="text-xl font-bold mb-2">{currentPlan.name}</h3>
  <p className="text-gray-300">¥{currentPlan.price.toLocaleString()}/月</p>
  {userProfile?.subscription === 'free' && (
    <button onClick={() => router.push('/pricing')}>
      アップグレード
    </button>
  )}
</div>
```

### 4. プロフィールページに追加

`src/app/profile/page.tsx` にサブスクリプション情報を表示:

```typescript
<button onClick={() => router.push('/subscription')}>
  サブスクリプション管理
</button>
```

---

## 🧪 テスト方法

### テストカード番号

| カード番号 | 結果 |
|-----------|------|
| 4242 4242 4242 4242 | 成功 |
| 4000 0000 0000 0002 | カード拒否 |
| 4000 0000 0000 9995 | 資金不足 |

- 有効期限: 任意の未来の日付（12/30など）
- CVC: 任意の3桁（123など）
- 郵便番号: 任意の5桁（12345など）

### テスト手順

1. **料金ページにアクセス**
   ```
   http://localhost:3000/pricing
   ```

2. **プランを選択してCheckout**
   - ベーシックプランを選択
   - テストカード情報を入力
   - 支払いを完了

3. **Webhookイベントを確認**
   - Stripe CLIのログを確認
   - `checkout.session.completed`イベントが受信されているか

4. **Firestoreを確認**
   - Firebaseコンソールで`users`コレクションを開く
   - 該当ユーザーの`subscription`が`basic`に更新されているか
   - `stripeSubscriptionId`が設定されているか

5. **サブスクリプション管理ページを確認**
   ```
   http://localhost:3000/subscription
   ```
   - プラン情報が正しく表示されるか
   - 支払い履歴が表示されるか

6. **使用制限をテスト**
   - タロット占いで制限回数まで占う
   - 制限に達した後、警告が表示されるか
   - アップグレード後、無制限になるか

---

## 🌐 本番環境デプロイ

### ステップ1: Stripeを本番モードに切り替え

1. Stripeダッシュボードで「本番データを表示」に切り替え
2. 本番用APIキーを取得
3. 本番用の商品・価格を作成（テスト環境と同じ設定）
4. 本番用Webhookを設定

### ステップ2: Vercelに環境変数を設定

```bash
vercel env add STRIPE_SECRET_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID production
vercel env add NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID production
vercel env add NEXT_PUBLIC_BASE_URL production
vercel env add FIREBASE_PROJECT_ID production
vercel env add FIREBASE_CLIENT_EMAIL production
vercel env add FIREBASE_PRIVATE_KEY production
```

### ステップ3: デプロイ

```bash
cd frontend/web
vercel --prod
```

### ステップ4: Webhook URLを更新

Stripeダッシュボードで Webhook エンドポイントを本番URLに更新:
```
https://destiny-tracker.vercel.app/api/stripe/webhook
```

---

## ✅ チェックリスト

### セットアップ完了確認

- [ ] Stripeアカウント作成
- [ ] 商品・料金プラン作成（Basic・Premium）
- [ ] APIキー取得（Publishable・Secret）
- [ ] Webhook設定
- [ ] 環境変数設定（.env.local）
- [ ] Firebase Admin SDK設定
- [ ] Stripe CLIインストール・設定
- [ ] 開発サーバー起動確認

### 機能実装確認

- [ ] 料金ページ表示
- [ ] Checkout Session作成
- [ ] 支払い完了
- [ ] Webhook受信
- [ ] Firestore更新
- [ ] サブスクリプション管理ページ表示
- [ ] キャンセル機能
- [ ] 使用制限チェック（タロット）
- [ ] 使用制限チェック（手相）
- [ ] 使用制限チェック（易占い）

### テスト確認

- [ ] テストカードで支払い成功
- [ ] Webhookイベント受信確認
- [ ] Firestoreデータ確認
- [ ] 支払い履歴表示確認
- [ ] 制限回数到達時の挙動確認
- [ ] アップグレード後の挙動確認

---

## 📚 参考リンク

- [Stripe公式ドキュメント](https://stripe.com/docs)
- [Next.js Stripe統合](https://stripe.com/docs/payments/checkout/how-checkout-works)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Stripe Webhook](https://stripe.com/docs/webhooks)

---

## 🎉 完了！

Stripe統合が完成しました！これで有料プランによる収益化が可能になります。

### 次のステップ

1. ✅ Stripe統合完了
2. 各占い機能に使用制限を追加
3. メール通知機能の実装
4. 分析・ダッシュボードの強化
5. マーケティング施策の実施

頑張ってください！💪
