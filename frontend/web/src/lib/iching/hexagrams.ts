// src/lib/iching/hexagrams.ts

export interface Hexagram {
  number: number;
  name: string;
  chinese: string;
  binary: string; // 例: "111111" (上から下へ)
  judgment: string;
  image: string;
  keywords: string[];
  meaning: {
    general: string;
    love: string;
    career: string;
    health: string;
  };
}

export const hexagrams: Hexagram[] = [
  {
    number: 1,
    name: "乾為天",
    chinese: "乾",
    binary: "111111",
    judgment: "元亨利貞。剛健なる天の徳を象徴し、創造力と積極性を表す。",
    image: "天行健。君子以自強不息。",
    keywords: ["創造", "剛健", "積極", "リーダーシップ"],
    meaning: {
      general: "強い意志と行動力が求められる時です。積極的に物事を進めることで大きな成功を得られるでしょう。",
      love: "主導権を握って関係を進展させる時。ただし相手の気持ちにも配慮を。",
      career: "新しいプロジェクトや起業に最適な時期。リーダーシップを発揮しましょう。",
      health: "体力が充実している時期。運動を始めるのに良いタイミングです。"
    }
  },
  {
    number: 2,
    name: "坤為地",
    chinese: "坤",
    binary: "000000",
    judgment: "元亨。利牝馬之貞。大地の柔軟性と包容力を象徴する。",
    image: "地勢坤。君子以厚徳載物。",
    keywords: ["受容", "柔軟", "包容", "協調"],
    meaning: {
      general: "柔軟に対応し、周囲と協調することが成功の鍵です。焦らず着実に進みましょう。",
      love: "相手を受け入れ、支える姿勢が大切。包容力が関係を深めます。",
      career: "チームワークを重視し、サポート役に徹することで評価されます。",
      health: "無理をせず、心身のバランスを保つことが重要です。"
    }
  },
  {
    number: 3,
    name: "水雷屯",
    chinese: "屯",
    binary: "010001",
    judgment: "元亨利貞。困難の中にも成長の機会あり。",
    image: "雲雷屯。君子以経綸。",
    keywords: ["困難", "始まり", "忍耐", "成長"],
    meaning: {
      general: "新しいことを始める時期ですが、困難が伴います。忍耐強く取り組むことで道が開けます。",
      love: "関係の始まりには障害がありますが、それを乗り越えることで絆が深まります。",
      career: "新プロジェクトの立ち上げ時期。準備と計画をしっかりと。",
      health: "体調管理に注意。予防医療を心がけましょう。"
    }
  },
  {
    number: 4,
    name: "山水蒙",
    chinese: "蒙",
    binary: "100010",
    judgment: "亨。学びと成長の時。",
    image: "山下出泉。蒙。君子以果行育徳。",
    keywords: ["学習", "成長", "教育", "啓発"],
    meaning: {
      general: "学ぶ姿勢が重要です。謙虚に知識を吸収することで成長できます。",
      love: "相手を理解しようとする姿勢が大切。コミュニケーションを深めましょう。",
      career: "新しいスキルの習得や研修に最適な時期です。",
      health: "健康に関する知識を学び、実践する良い機会です。"
    }
  },
  {
    number: 5,
    name: "水天需",
    chinese: "需",
    binary: "010111",
    judgment: "有孚。光亨貞吉。待つことの重要性。",
    image: "雲上於天。需。君子以飲食宴楽。",
    keywords: ["待機", "準備", "タイミング", "忍耐"],
    meaning: {
      general: "今は行動より準備の時。適切なタイミングを待つことが成功への鍵です。",
      love: "焦らずに関係を育てる時期。信頼関係を築きましょう。",
      career: "チャンスを待ちながら、スキルアップに励む時です。",
      health: "無理をせず、体力を温存する時期です。"
    }
  },
  {
    number: 6,
    name: "天水訟",
    chinese: "訟",
    binary: "111010",
    judgment: "有孚窒。惕中吉。争いには慎重に。",
    image: "天与水違行。訟。君子以作事謀始。",
    keywords: ["対立", "紛争", "慎重", "交渉"],
    meaning: {
      general: "対立や争いの可能性がある時期。冷静な判断と慎重な対応が必要です。",
      love: "意見の相違が生じやすい時。話し合いで解決を図りましょう。",
      career: "交渉事は慎重に。専門家の助言を求めることも検討しましょう。",
      health: "ストレスに注意。リラックスする時間を作りましょう。"
    }
  },
  {
    number: 7,
    name: "地水師",
    chinese: "師",
    binary: "000010",
    judgment: "貞。丈人吉。組織と統率の重要性。",
    image: "地中有水。師。君子以容民畜衆。",
    keywords: ["統率", "組織", "規律", "戦略"],
    meaning: {
      general: "組織力と規律が成功の鍵。計画的に物事を進めましょう。",
      love: "関係に秩序とルールを持ち込むことで安定します。",
      career: "チームをまとめる力が求められます。リーダーシップを発揮しましょう。",
      health: "規則正しい生活習慣が健康を保ちます。"
    }
  },
  {
    number: 8,
    name: "水地比",
    chinese: "比",
    binary: "010000",
    judgment: "吉。原筮元永貞。協調と親和の時。",
    image: "地上有水。比。先王以建万国親諸侯。",
    keywords: ["協力", "親和", "連帯", "調和"],
    meaning: {
      general: "人との協力関係を築く良い時期。調和を大切にしましょう。",
      love: "お互いを尊重し合う関係が築けます。親密さが深まる時です。",
      career: "チームワークが重要。協力体制を強化しましょう。",
      health: "家族や友人との交流が心身の健康に良い影響を与えます。"
    }
  },
  // 残りの56卦も同様に定義...
  // スペースの都合上、8卦まで記載。実際のアプリでは64卦すべてを定義します
];

// 卦を番号から取得
export function getHexagramByNumber(num: number): Hexagram | undefined {
  return hexagrams.find(h => h.number === num);
}

// 二進数文字列から卦を取得
export function getHexagramByBinary(binary: string): Hexagram | undefined {
  return hexagrams.find(h => h.binary === binary);
}

// コイン投げシミュレーション（3枚のコインで1つの爻を決定）
export function throwCoins(): { value: number; changing: boolean } {
  // 各コイン: 表=3, 裏=2
  const coins = [
    Math.random() < 0.5 ? 3 : 2,
    Math.random() < 0.5 ? 3 : 2,
    Math.random() < 0.5 ? 3 : 2
  ];
  
  const sum = coins.reduce((a, b) => a + b, 0);
  
  // 6: 老陰（変爻） → 0
  // 7: 少陽 → 1
  // 8: 少陰 → 0
  // 9: 老陽（変爻） → 1
  
  return {
    value: sum === 7 || sum === 9 ? 1 : 0,
    changing: sum === 6 || sum === 9
  };
}

// 6回コインを投げて卦を生成
export function generateHexagram(): {
  lines: number[];
  changingLines: number[];
  binary: string;
} {
  const lines: number[] = [];
  const changingLines: number[] = [];
  
  // 下から上へ6本の爻を決定
  for (let i = 0; i < 6; i++) {
    const result = throwCoins();
    lines.push(result.value);
    if (result.changing) {
      changingLines.push(i);
    }
  }
  
  // 上から下への順序に変換（表示用）
  const binary = [...lines].reverse().join('');
  
  return { lines, changingLines, binary };
}