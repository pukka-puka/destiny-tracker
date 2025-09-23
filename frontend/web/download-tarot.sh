#!/bin/bash

# 画像保存用ディレクトリを作成
mkdir -p public/tarot-cards

echo "🎴 タロットカード画像をダウンロード中..."

# Wikimedia Commonsから画像を直接ダウンロード
# 各カードの画像URLと保存名
declare -a CARDS=(
  "0-fool https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/RWS_Tarot_00_Fool.jpg/256px-RWS_Tarot_00_Fool.jpg"
  "1-magician https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/RWS_Tarot_01_Magician.jpg/256px-RWS_Tarot_01_Magician.jpg"
  "2-high-priestess https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/RWS_Tarot_02_High_Priestess.jpg/256px-RWS_Tarot_02_High_Priestess.jpg"
  "3-empress https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/RWS_Tarot_03_Empress.jpg/256px-RWS_Tarot_03_Empress.jpg"
  "4-emperor https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/RWS_Tarot_04_Emperor.jpg/256px-RWS_Tarot_04_Emperor.jpg"
  "5-hierophant https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/RWS_Tarot_05_Hierophant.jpg/256px-RWS_Tarot_05_Hierophant.jpg"
  "6-lovers https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/RWS_Tarot_06_Lovers.jpg/256px-RWS_Tarot_06_Lovers.jpg"
  "7-chariot https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/RWS_Tarot_07_Chariot.jpg/256px-RWS_Tarot_07_Chariot.jpg"
  "8-strength https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/RWS_Tarot_08_Strength.jpg/256px-RWS_Tarot_08_Strength.jpg"
  "9-hermit https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/RWS_Tarot_09_Hermit.jpg/256px-RWS_Tarot_09_Hermit.jpg"
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

# 各カードをダウンロード
for card_info in "${CARDS[@]}"; do
  card_data=($card_info)
  name=${card_data[0]}
  url=${card_data[1]}
  
  echo "Downloading ${name}..."
  curl -L -o "public/tarot-cards/${name}.jpg" "$url"
  
  # 少し待機（サーバーに負荷をかけないため）
  sleep 0.5
done

echo "✅ タロットカード画像のダウンロード完了！"
echo "📁 画像は frontend/web/public/tarot-cards/ に保存されました"
