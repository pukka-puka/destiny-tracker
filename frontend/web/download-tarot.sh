#!/bin/bash

# タロットカード画像ダウンロードスクリプト
# Wikimedia Commons の Rider-Waite-Smith タロットカード（パブリックドメイン）

# 色付き出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🎴 タロットカード画像ダウンロード${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}出典: Wikimedia Commons${NC}"
echo -e "${YELLOW}カードデッキ: Rider-Waite-Smith (パブリックドメイン)${NC}"
echo ""

# 現在のディレクトリを確認
if [ ! -d "public" ]; then
    echo -e "${RED}❌ エラー: publicディレクトリが見つかりません${NC}"
    echo -e "${YELLOW}💡 frontend/web ディレクトリで実行してください${NC}"
    exit 1
fi

# 画像保存用ディレクトリを作成
mkdir -p public/tarot-cards

# 各カードの情報（ファイル名とURL）
declare -a CARDS=(
  "00-fool https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/RWS_Tarot_00_Fool.jpg/256px-RWS_Tarot_00_Fool.jpg"
  "01-magician https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/RWS_Tarot_01_Magician.jpg/256px-RWS_Tarot_01_Magician.jpg"
  "02-high-priestess https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/RWS_Tarot_02_High_Priestess.jpg/256px-RWS_Tarot_02_High_Priestess.jpg"
  "03-empress https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/RWS_Tarot_03_Empress.jpg/256px-RWS_Tarot_03_Empress.jpg"
  "04-emperor https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/RWS_Tarot_04_Emperor.jpg/256px-RWS_Tarot_04_Emperor.jpg"
  "05-hierophant https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/RWS_Tarot_05_Hierophant.jpg/256px-RWS_Tarot_05_Hierophant.jpg"
  "06-lovers https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/RWS_Tarot_06_Lovers.jpg/256px-RWS_Tarot_06_Lovers.jpg"
  "07-chariot https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/RWS_Tarot_07_Chariot.jpg/256px-RWS_Tarot_07_Chariot.jpg"
  "08-strength https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/RWS_Tarot_08_Strength.jpg/256px-RWS_Tarot_08_Strength.jpg"
  "09-hermit https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/RWS_Tarot_09_Hermit.jpg/256px-RWS_Tarot_09_Hermit.jpg"
  "10-wheel-of-fortune https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg/256px-RWS_Tarot_10_Wheel_of_Fortune.jpg"
  "11-justice https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/RWS_Tarot_11_Justice.jpg/256px-RWS_Tarot_11_Justice.jpg"
  "12-hanged-man https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/RWS_Tarot_12_Hanged_Man.jpg/256px-RWS_Tarot_12_Hanged_Man.jpg"
  "13-death https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/RWS_Tarot_13_Death.jpg/256px-RWS_Tarot_13_Death.jpg"
  "14-temperance https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/RWS_Tarot_14_Temperance.jpg/256px-RWS_Tarot_14_Temperance.jpg"
  "15-devil https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/RWS_Tarot_15_Devil.jpg/256px-RWS_Tarot_15_Devil.jpg"
  "16-tower https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/RWS_Tarot_16_Tower.jpg/256px-RWS_Tarot_16_Tower.jpg"
  "17-star https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/RWS_Tarot_17_Star.jpg/256px-RWS_Tarot_17_Star.jpg"
  "18-moon https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/RWS_Tarot_18_Moon.jpg/256px-RWS_Tarot_18_Moon.jpg"
  "19-sun https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/RWS_Tarot_19_Sun.jpg/256px-RWS_Tarot_19_Sun.jpg"
  "20-judgement https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/RWS_Tarot_20_Judgement.jpg/256px-RWS_Tarot_20_Judgement.jpg"
  "21-world https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/RWS_Tarot_21_World.jpg/256px-RWS_Tarot_21_World.jpg"
)

# 日本語名
declare -a CARD_NAMES=(
  "愚者 (The Fool)"
  "魔術師 (The Magician)"
  "女教皇 (The High Priestess)"
  "女帝 (The Empress)"
  "皇帝 (The Emperor)"
  "教皇 (The Hierophant)"
  "恋人 (The Lovers)"
  "戦車 (The Chariot)"
  "力 (Strength)"
  "隠者 (The Hermit)"
  "運命の輪 (Wheel of Fortune)"
  "正義 (Justice)"
  "吊された男 (The Hanged Man)"
  "死神 (Death)"
  "節制 (Temperance)"
  "悪魔 (The Devil)"
  "塔 (The Tower)"
  "星 (The Star)"
  "月 (The Moon)"
  "太陽 (The Sun)"
  "審判 (Judgement)"
  "世界 (The World)"
)

# カウンター
total=${#CARDS[@]}
current=0
success=0
failed=0

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}ダウンロード開始...${NC}"
echo ""

# 各カードをダウンロード
for i in "${!CARDS[@]}"; do
  card_info=${CARDS[$i]}
  card_data=($card_info)
  name=${card_data[0]}
  url=${card_data[1]}
  card_name=${CARD_NAMES[$i]}
  
  current=$((current + 1))
  
  echo -ne "${YELLOW}[$current/$total] $card_name をダウンロード中...${NC}"
  
  # curlでダウンロード（進捗非表示、エラー時も継続）
  if curl -sS -L -o "public/tarot-cards/${name}.jpg" "$url" 2>/dev/null; then
    echo -e " ${GREEN}✓${NC}"
    success=$((success + 1))
  else
    echo -e " ${RED}✗${NC}"
    failed=$((failed + 1))
  fi
  
  # サーバーに負荷をかけないよう少し待機
  sleep 0.3
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}ダウンロード完了！${NC}"
echo ""
echo -e "${GREEN}✅ 成功: $success 枚${NC}"
if [ $failed -gt 0 ]; then
  echo -e "${RED}❌ 失敗: $failed 枚${NC}"
fi
echo ""
echo -e "${BLUE}📁 保存先: frontend/web/public/tarot-cards/${NC}"
echo ""

# 画像の確認
if [ $success -eq $total ]; then
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}🎉 全てのカード画像のダウンロードに成功しました！${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${YELLOW}次のステップ:${NC}"
  echo "  1. npm run dev で開発サーバーを起動"
  echo "  2. http://localhost:3000/tarot でタロット占いを試す"
  echo ""
else
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}⚠️  一部のダウンロードに失敗しました${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${YELLOW}対処方法:${NC}"
  echo "  - インターネット接続を確認してください"
  echo "  - もう一度スクリプトを実行してください: ./download-tarot.sh"
  echo "  - 失敗したカードは手動でダウンロードできます"
  echo ""
fi

# ファイルサイズ確認
total_size=$(du -sh public/tarot-cards 2>/dev/null | cut -f1)
if [ ! -z "$total_size" ]; then
  echo -e "${BLUE}💾 合計サイズ: $total_size${NC}"
  echo ""
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📚 画像について${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "出典: Wikimedia Commons"
echo "ライセンス: パブリックドメイン"
echo "デッキ: Rider-Waite-Smith Tarot"
echo "作者: Pamela Colman Smith (1909年作)"
echo ""
echo "これらの画像はパブリックドメインであり、"
echo "商用・非商用問わず自由に使用できます。"
echo ""
echo -e "${GREEN}✨ 良い占いを！${NC}"
echo ""