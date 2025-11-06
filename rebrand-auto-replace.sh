#!/bin/bash

echo "🔮 Shukumei リブランディング - 一括置換"
echo ""

# macOS用のsedコマンド
find . \( -path '*/node_modules' -o -path '*/.git' -o -path '*/.next' -o -path '*/build' -o -path '*/dist' \) -prune -o \
    -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" -o -name "*.html" -o -name "*.css" \) \
    -exec sed -i '' 's/Destiny Tracker/Shukumei/g' {} \; 2>/dev/null

find . \( -path '*/node_modules' -o -path '*/.git' -o -path '*/.next' -o -path '*/build' -o -path '*/dist' \) -prune -o \
    -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" -o -name "*.html" -o -name "*.css" \) \
    -exec sed -i '' 's/destiny-tracker/shukumei/g' {} \; 2>/dev/null

find . \( -path '*/node_modules' -o -path '*/.git' -o -path '*/.next' -o -path '*/build' -o -path '*/dist' \) -prune -o \
    -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" -o -name "*.html" -o -name "*.css" \) \
    -exec sed -i '' 's/destinyTracker/shukumei/g' {} \; 2>/dev/null

find . \( -path '*/node_modules' -o -path '*/.git' -o -path '*/.next' -o -path '*/build' -o -path '*/dist' \) -prune -o \
    -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" -o -name "*.html" -o -name "*.css" \) \
    -exec sed -i '' 's/DestinyTracker/Shukumei/g' {} \; 2>/dev/null

echo "✅ 一括置換完了！"
echo ""
echo "変更されたファイル数: $(git diff --name-only | wc -l)"
