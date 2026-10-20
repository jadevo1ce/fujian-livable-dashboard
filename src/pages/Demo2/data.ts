import realDataJson from "./realData.json";

// ──────────────────────────────────────────────────────────────────────────
// 数据来源：fujian_green_livable_2015_2024/ 官方源表（福建九市 2015–2024 真实统计）。
// realData.json 由源表抽取生成，含 5 个维度得分 + 城镇化率 / 人均GDP / 人口 / 密度。
//
// 维度口径：
//   - 生态环境(eco) / 生活便利(life) / 空间承载(space)：直接采用源表标准化得分；
//   - 医疗养老(health) / 教育文化(education)：源表原始得分只用「每万人/每百人」人均口径，
//     会让人口稀疏的内陆市虚高（如三明 > 厦门），不符合常理。这里改为
//     「人均得分 × 0.5 + 绝对总量得分 × 0.5」的混合口径，兼顾资源规模与人均可得性。
//   - 综合指数(index)：按官方权重 生态30% 医疗20% 教育20% 生活20% 空间承载10%
//     对 5 个维度得分加权重算（负向指标在源表中已反向标准化）。
// ──────────────────────────────────────────────────────────────────────────

export type CityMetricKey =
  | "index"
  | "eco"
  | "health"
  | "education"
  | "life"
  | "space"
  | "urbanization"
  | "gdpPerCapita"
  | "population"
  | "density";

export interface CityYear extends Record<CityMetricKey, number> {
  city: string;
  year: number;
}

const realData = realDataJson as CityYear[];

const round = (x: number, d = 2) => Number(x.toFixed(d));

// ── 年份轴 ──
export const years = [...new Set(realData.map((d) => d.year))].sort(
  (a, b) => a - b
);
export const firstYear = years[0];
export const latestYear = years[years.length - 1];

// ── 分城市逐年真实序列 ──
export const cityTrendData: Record<string, CityYear[]> = {};
realData.forEach((d) => {
  (cityTrendData[d.city] ??= []).push(d);
});
Object.values(cityTrendData).forEach((arr) =>
  arr.sort((a, b) => a.year - b.year)
);

// 2024 快照，按真实综合指数降序排列（决定排名 / 配色顺序）。
export const cityGreenLivable: CityYear[] = realData
  .filter((d) => d.year === latestYear)
  .slice()
  .sort((a, b) => b.index - a.index);

/** 指定年份全部九市的数据（保持 cityGreenLivable 的排名顺序）。 */
export const citiesAtYear = (year: number): CityYear[] =>
  cityGreenLivable.map(
    (c) =>
      cityTrendData[c.city].find((d) => d.year === year) ??
      cityTrendData[c.city][cityTrendData[c.city].length - 1]
  );

/** 指定城市在指定年份的数据。 */
export const cityAtYear = (city: string, year: number): CityYear | null =>
  cityTrendData[city]?.find((d) => d.year === year) ?? null;

/** 指定年份的全省各维度均值（用于 KPI、雷达基准线、详情卡对比刻度）。 */
export const provinceAvgAtYear = (year: number) => {
  const arr = citiesAtYear(year);
  const mean = (key: CityMetricKey) =>
    arr.reduce((s, c) => s + c[key], 0) / arr.length;
  return {
    index: round(mean("index")),
    eco: round(mean("eco")),
    health: round(mean("health")),
    education: round(mean("education")),
    life: round(mean("life")),
    space: round(mean("space")),
    urbanization: round(mean("urbanization")),
    gdpPerCapita: Math.round(mean("gdpPerCapita")),
    population: Math.round(mean("population")),
    density: round(mean("density"), 1),
  };
};

// ── 全省十年趋势（由真实逐年数据按年求均值）──
export const greenLivableTrend = years.map((year) => {
  const a = provinceAvgAtYear(year);
  return {
    year,
    index: a.index,
    urbanization: a.urbanization,
    eco: a.eco,
    life: a.life,
  };
});

const provAvgLatest = provinceAvgAtYear(latestYear);
const provAvgFirst = provinceAvgAtYear(firstYear);

export const greenLivableSummary = {
  latestYear,
  cityCount: cityGreenLivable.length,
  avgIndex: provAvgLatest.index,
  avgUrbanization: provAvgLatest.urbanization,
  avgGdpPerCapita: provAvgLatest.gdpPerCapita,
  avgEco: provAvgLatest.eco,
  improvement: round(provAvgLatest.index - provAvgFirst.index),
};

// 四个核心宜居维度的全省 2024 均值。
export const dimensionAverages = [
  { name: "生态环境", value: provAvgLatest.eco },
  { name: "医疗养老", value: provAvgLatest.health },
  { name: "教育休闲", value: provAvgLatest.education },
  { name: "生活富足", value: provAvgLatest.life },
];

// 按综合指数排名（由高到低）生成的城市配色：亮绿 → 深青（呼应「绿色宜居」主题）。
// 风玫瑰图、气泡图、平行坐标图共用同一套配色，保证同一城市在不同图表中颜色一致，
// 同时颜色本身也编码了排名（越亮绿综合指数越高，越宜居）。
const rankPalette = [
  "#A6F5C9",
  "#7CEAB0",
  "#52DD9B",
  "#34CE8D",
  "#27BE92",
  "#21AC9C",
  "#1F99A2",
  "#23859C",
  "#2C7290",
];

export const cityColorMap: Record<string, string> = cityGreenLivable.reduce(
  (acc, item, index) => {
    acc[item.city] = rankPalette[index] ?? "#2FC98E";
    return acc;
  },
  {} as Record<string, string>
);

export const topGreenLivableCities = cityGreenLivable.slice(0, 5);

// 全省九市各指标 2024 均值，用于详情抽屉里的「优势 / 短板」对比。
export const provinceAvg = provAvgLatest;

// 城市 → 综合指数排名（cityGreenLivable 已按综合指数降序排列）。
export const cityRankMap: Record<string, number> = cityGreenLivable.reduce(
  (acc, c, i) => {
    acc[c.city] = i + 1;
    return acc;
  },
  {} as Record<string, number>
);

// 详情抽屉中展示的四个核心宜居维度（0-100 标准化得分，可与全省均值直接比较）。
export const livableDimensions = [
  { key: "eco", name: "生态环境" },
  { key: "health", name: "医疗养老" },
  { key: "education", name: "教育文化" },
  { key: "life", name: "生活便利" },
] as const;

export const coastalCities = ["福州市", "泉州市", "厦门市"].map((city) => {
  const item = cityGreenLivable.find((entry) => entry.city === city);

  if (!item) {
    throw new Error(`Missing coastal city data: ${city}`);
  }

  return item;
});

/** 趋势折线图用：每个城市的「绿色宜居指数」十年序列。 */
export const cityIndexSeries = cityGreenLivable.map((c) => ({
  city: c.city,
  color: cityColorMap[c.city],
  data: cityTrendData[c.city].map((d) => d.index),
}));

// ── 地图按「分数深浅」着色：指数越高越亮绿，越低越暗沉。 ──
const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ] as const;
};
const rgbToHex = (r: number, g: number, b: number) => {
  const c = (x: number) =>
    Math.round(Math.max(0, Math.min(255, x)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
};
const mixHex = (a: string, b: string, t: number) => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
};

const allIndexValues = realData.map((d) => d.index);
export const indexDomain = {
  min: Math.min(...allIndexValues),
  max: Math.max(...allIndexValues),
};

const SCORE_LOW = "#0d4332"; // 低分：暗沉深绿
const SCORE_MID = "#2FC98E";
const SCORE_HIGH = "#BFFFDD"; // 高分：明亮翠绿

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// 0–1 归一化分数 → 绿色深浅（低→暗，高→亮）。
const scoreToColor = (t: number) =>
  t < 0.5
    ? mixHex(SCORE_LOW, SCORE_MID, t / 0.5)
    : mixHex(SCORE_MID, SCORE_HIGH, (t - 0.5) / 0.5);

/** 把绿色宜居指数映射成绿色深浅（按「全部年份」全局区间）。 */
export const indexColor = (v: number) => {
  const { min, max } = indexDomain;
  const t = max > min ? clamp01((v - min) / (max - min)) : 0.5;
  return scoreToColor(t);
};

/** 指定年份九市「绿色宜居指数」的取值区间。 */
export const yearIndexDomain = (year: number) => {
  const arr = citiesAtYear(year).map((c) => c.index);
  return { min: Math.min(...arr), max: Math.max(...arr) };
};

/**
 * 按「当年九市分布」给城市着色：当年最高分→最亮翠绿，最低分→最暗深绿。
 * 相比全局 indexColor，同一年里各市的深浅对比被显著拉开，便于在地图上一眼看出高低。
 */
export const indexColorAt = (v: number, year: number) => {
  const { min, max } = yearIndexDomain(year);
  const span = max - min || 1;
  // 区间两端各留一点余量，避免最低分被压成纯黑、最高分顶到极亮。
  const lo = min - span * 0.12;
  const hi = max + span * 0.04;
  return scoreToColor(clamp01((v - lo) / (hi - lo)));
};

// ── 区县级演示数据 ──
// 切换到地级市地图后，渲染单元是区县（如鼓楼区、晋江市），官方源表只有福建九市
// 粒度，没有区县真实统计；杭州 / 广州 / 长沙 / 长春连市级真实数据也没有。
// 这里用「名称 → 确定性伪随机」生成一套稳定的演示指标：同一区域在同一年份的
// 值固定、围绕其母市基准值小幅波动，保证地图着色、抬升高度、标签数值可正常
// 展示。接入真实区县数据后删除此段即可。

/** 字符串 → 0~1 确定性哈希（同一名字永远得到同一值）。 */
const nameHash = (name: string) => {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
};

// 运营中心七城的区县名录（与 DataV GeoJSON 中的区县名严格一致），
// 用于让区县演示值围绕其母市基准值波动。
const districtGroups: Array<[string, string]> = [
  [
    "泉州市",
    "鲤城区|丰泽区|洛江区|泉港区|惠安县|安溪县|永春县|德化县|金门县|石狮市|晋江市|南安市",
  ],
  ["厦门市", "思明区|海沧区|湖里区|集美区|同安区|翔安区"],
  [
    "福州市",
    "鼓楼区|台江区|仓山区|马尾区|晋安区|长乐区|闽侯县|连江县|罗源县|闽清县|永泰县|平潭县|福清市",
  ],
  [
    "杭州市",
    "上城区|拱墅区|西湖区|滨江区|萧山区|余杭区|富阳区|临安区|钱塘区|临平区|桐庐县|淳安县|建德市",
  ],
  [
    "广州市",
    "荔湾区|越秀区|海珠区|天河区|白云区|黄埔区|番禺区|花都区|南沙区|从化区|增城区",
  ],
  [
    "长沙市",
    "芙蓉区|天心区|岳麓区|开福区|雨花区|望城区|长沙县|浏阳市|宁乡市",
  ],
  [
    "长春市",
    "南关区|宽城区|朝阳区|二道区|绿园区|双阳区|九台区|农安县|榆树市|德惠市|公主岭市",
  ],
];

const districtParentCity = (name: string): string | null => {
  for (const [parent, pattern] of districtGroups) {
    if (new RegExp(`^(${pattern})$`).test(name)) return parent;
  }
  return null;
};

/**
 * 无真实统计数据的城市（杭州 / 广州 / 长沙 / 长春）：
 * 由城市名哈希生成确定性的市级基准值，并带轻微逐年上升趋势，
 * 让时间轴播放时地图高度 / 颜色也会缓慢变化。
 */
const synthBase = (name: string, year: number): CityYear => {
  const h = (k: string) => nameHash(name + k);
  const t = year - years[0]; // 0..n，逐年微增
  const score = (k: string, g: number) =>
    Math.max(1, Math.min(100, round(55 + h(k) * 30 + t * g, 1)));
  const eco = score("eco", 0.8);
  const health = score("health", 0.7);
  const education = score("edu", 0.7);
  const life = score("life", 0.8);
  const space = score("space", 0.6);
  return {
    city: name,
    year,
    eco,
    health,
    education,
    life,
    space,
    urbanization: Math.max(
      10,
      Math.min(100, round(55 + h("urb") * 30 + t * 1.2, 1))
    ),
    gdpPerCapita: Math.round((60000 + h("gdp") * 80000) * (1 + t * 0.06)),
    population: Math.round((400 + h("pop") * 700) * (1 + t * 0.015)),
    density: Math.round(400 + h("den") * 1200),
    index: round(
      eco * 0.3 + health * 0.2 + education * 0.2 + life * 0.2 + space * 0.1
    ),
  };
};

/**
 * 任意区域（市 / 区县）在指定年份的指标：
 * 福建九市返回真实数据；杭州 / 广州 / 长沙 / 长春返回合成的市级基准值；
 * 区县返回围绕母市基准值波动的确定性演示数据。
 */
export const regionAtYear = (name: string, year: number): CityYear | null => {
  const real = cityAtYear(name, year);
  if (real) return real;

  const parentName = districtParentCity(name);
  const parent = parentName
    ? (cityAtYear(parentName, year) ?? synthBase(parentName, year))
    : null;
  if (!parent) return null;

  const h = nameHash(name);
  // 围绕母市取值 ±8 波动，并做 0~100 截断。
  const jitter = (v: number, k: number) =>
    Math.max(1, Math.min(100, round(v + (nameHash(name + k) - 0.5) * 16, 1)));

  const demo: CityYear = {
    city: name,
    year,
    eco: jitter(parent.eco, 1),
    health: jitter(parent.health, 2),
    education: jitter(parent.education, 3),
    life: jitter(parent.life, 4),
    space: jitter(parent.space, 5),
    urbanization: Math.max(
      10,
      Math.min(100, round(parent.urbanization + (h - 0.5) * 20, 1))
    ),
    gdpPerCapita: Math.max(
      10000,
      Math.round(parent.gdpPerCapita * (0.7 + h * 0.6))
    ),
    population: Math.max(10, Math.round(parent.population / 8)),
    density: Math.max(100, round(parent.density * (0.6 + h), 0)),
    index: 0,
  };
  demo.index = round(
    demo.eco * 0.3 +
      demo.health * 0.2 +
      demo.education * 0.2 +
      demo.life * 0.2 +
      demo.space * 0.1
  );
  return demo;
};
