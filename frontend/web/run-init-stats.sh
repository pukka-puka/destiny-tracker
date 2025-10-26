#!/bin/bash

# ユーザー統計フィールド初期化スクリプト
# 使い方: ./run-init-stats.sh

echo "🚀 ユーザー統計フィールド初期化スクリプト"
echo ""

# 環境変数チェック
if [ ! -f .env.local ]; then
    echo "❌ エラー: .env.local ファイルが見つかりません"
    echo "💡 .env.local に Firebase Admin SDK の認証情報を設定してください"
    exit 1
fi

# 必要な環境変数の確認
source .env.local

if [ -z "$FIREBASE_PROJECT_ID" ] || [ -z "$FIREBASE_CLIENT_EMAIL" ] || [ -z "$FIREBASE_PRIVATE_KEY" ]; then
    echo "❌ エラー: Firebase環境変数が設定されていません"
    echo ""
    echo "必要な環境変数:"
    echo "  - FIREBASE_PROJECT_ID"
    echo "  - FIREBASE_CLIENT_EMAIL"
    echo "  - FIREBASE_PRIVATE_KEY"
    exit 1
fi

echo "✅ 環境変数の確認完了"
echo ""

# Firebase Admin SDKのインストール確認
if ! npm list firebase-admin > /dev/null 2>&1; then
    echo "⚠️  firebase-admin がインストールされていません"
    echo "📦 インストール中..."
    npm install firebase-admin
fi

# ts-nodeのインストール確認
if ! npm list ts-node > /dev/null 2>&1; then
    echo "⚠️  ts-node がインストールされていません"
    echo "📦 インストール中..."
    npm install -D ts-node
fi

echo "✅ 依存パッケージの確認完了"
echo ""

# スクリプト実行
echo "📊 初期化スクリプトを実行します..."
echo ""

npx ts-node init-user-stats.ts

# 実行結果の確認
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 スクリプトが正常に完了しました!"
    echo ""
    echo "📝 次のステップ:"
    echo "  1. Firebaseコンソールで users コレクションを確認"
    echo "  2. 統計フィールドが追加されていることを確認"
    echo "  3. AuthContext.tsx に統計フィールドの自動追加機能を実装"
    echo ""
else
    echo ""
    echo "❌ スクリプトの実行中にエラーが発生しました"
    echo "📄 ログを確認してください"
    exit 1
fi
