import type { NormalizedBeverage, Nutrition, Source } from "./types.ts";

const accessedAt = "2026-07-04T00:00:00+08:00";
const tfdaSource: Source = {
  title: "台灣食品營養成分資料庫",
  url: "https://www.fda.gov.tw/tc/site.aspx?r=972680063&sid=271",
  kind: "database",
  accessedAt,
};
const accessedAtCurrent = "2026-07-18T00:00:00+08:00";

const emptyNutrition = (): Nutrition => ({
  energyKcal: null, sugarG: null, caffeineMg: null, proteinG: null,
  fatG: null, carbsG: null, sodiumMg: null, calciumMg: null,
  vitaminAUg: null, betaCaroteneUg: null, acidic: null, carbonated: null,
});

export const CATALOGUE: NormalizedBeverage[] = [
  {
    id: "water-500", matchedName: "飲用水", brand: null, defaultServingMl: 500,
    referenceServingMl: 500,
    nutritionPerServing: { ...emptyNutrition(), energyKcal: 0, sugarG: 0, caffeineMg: 0, proteinG: 0, fatG: 0, carbsG: 0, sodiumMg: 0, calciumMg: 0, vitaminAUg: 0, betaCaroteneUg: 0, acidic: false, carbonated: false },
    priceMin: 10, priceMax: 25, priceType: "estimated", confidence: "high", dataLabel: "database", sources: [tfdaSource],
  },
  {
    id: "cola-330", matchedName: "可樂", brand: null, defaultServingMl: 330,
    referenceServingMl: 330,
    nutritionPerServing: { ...emptyNutrition(), energyKcal: 139, sugarG: 35, caffeineMg: 32, proteinG: 0, fatG: 0, carbsG: 35, sodiumMg: 15, calciumMg: 0, vitaminAUg: 0, betaCaroteneUg: 0, acidic: true, carbonated: true },
    priceMin: 25, priceMax: 40, priceType: "estimated", confidence: "medium", dataLabel: "estimated",
    sources: [{ title: "Open Food Facts：可樂產品資料", url: "https://world.openfoodfacts.org/cgi/search.pl?search_terms=cola&search_simple=1&action=process", kind: "database", accessedAt }],
  },
  {
    id: "carrot-juice-250", matchedName: "胡蘿蔔汁", brand: null, defaultServingMl: 250,
    referenceServingMl: 250,
    nutritionPerServing: { ...emptyNutrition(), energyKcal: 100, sugarG: 10, caffeineMg: 0, proteinG: 2, fatG: 0.4, carbsG: 23, sodiumMg: 120, calciumMg: 60, vitaminAUg: 956, betaCaroteneUg: 5500, acidic: false, carbonated: false },
    priceMin: 40, priceMax: 80, priceType: "estimated", confidence: "medium", dataLabel: "estimated", sources: [tfdaSource],
  },
  {
    id: "black-coffee-240", matchedName: "黑咖啡", brand: null, defaultServingMl: 240,
    referenceServingMl: 240,
    nutritionPerServing: { ...emptyNutrition(), energyKcal: 3, sugarG: 0, caffeineMg: 95, proteinG: 0.3, fatG: 0, carbsG: 0, sodiumMg: 5, calciumMg: 5, vitaminAUg: 0, betaCaroteneUg: 0, acidic: true, carbonated: false },
    priceMin: 35, priceMax: 100, priceType: "estimated", confidence: "medium", dataLabel: "estimated", sources: [tfdaSource],
  },
  {
    id: "milk-240", matchedName: "鮮奶", brand: null, defaultServingMl: 240,
    referenceServingMl: 240,
    nutritionPerServing: { ...emptyNutrition(), energyKcal: 146, sugarG: 12, caffeineMg: 0, proteinG: 7.7, fatG: 7.9, carbsG: 11.7, sodiumMg: 105, calciumMg: 276, vitaminAUg: 112, betaCaroteneUg: 0, acidic: false, carbonated: false },
    priceMin: 35, priceMax: 65, priceType: "estimated", confidence: "medium", dataLabel: "database", sources: [tfdaSource],
  },
  {
    id: "yuchayuan-japanese-green-tea-590",
    matchedName: "御茶園特撰日式綠茶",
    brand: "御茶園",
    defaultServingMl: 590,
    referenceServingMl: 590,
    nutritionPerServing: { ...emptyNutrition(), energyKcal: 0, sugarG: 0, caffeineMg: null, proteinG: 0, fatG: 0, carbsG: 0, sodiumMg: 59, calciumMg: null, vitaminAUg: 0, betaCaroteneUg: 0, acidic: null, carbonated: false },
    priceMin: 25,
    priceMax: 40,
    priceType: "estimated",
    confidence: "low",
    dataLabel: "database",
    sources: [
      { title: "ETMall：御茶園特撰日式綠茶營養標示", url: "https://www.etmall.com.tw/i/3040932", kind: "database", accessedAt: accessedAtCurrent },
      { title: "Rakuten 愛買：御茶園日式綠茶營養標示", url: "https://www.rakuten.com.tw/shop/amart/product/900103448/", kind: "database", accessedAt: accessedAtCurrent },
    ],
  },
  {
    id: "imei-ceylon-black-tea-250",
    matchedName: "義美錫蘭紅茶",
    brand: "義美",
    defaultServingMl: 250,
    referenceServingMl: 250,
    nutritionPerServing: { ...emptyNutrition(), energyKcal: 67, sugarG: 16.1, caffeineMg: null, proteinG: 0, fatG: 0, carbsG: 16.8, sodiumMg: 5, calciumMg: null, vitaminAUg: 0, betaCaroteneUg: 0, acidic: null, carbonated: false },
    priceMin: null,
    priceMax: null,
    priceType: "unknown",
    confidence: "medium",
    dataLabel: "measured",
    sources: [
      { title: "使用者提供：義美錫蘭紅茶 250 mL 包裝營養標示", url: "https://www.imeifoods.com.tw/", kind: "measured", accessedAt: accessedAtCurrent },
    ],
  },
];

export const BUBBLE_TEA_CANDIDATES = [
  { id: "bubble-tea-full-700", name: "珍珠奶茶（全糖）", brand: null, servingMl: 700, description: "大杯、全糖；營養與價格將以估算呈現" },
  { id: "bubble-tea-half-700", name: "珍珠奶茶（半糖）", brand: null, servingMl: 700, description: "大杯、半糖；營養與價格將以估算呈現" },
  { id: "bubble-tea-custom", name: "珍珠奶茶（自訂規格）", brand: null, servingMl: null, description: "回到捷徑補充品牌、容量與甜度" },
];

export function bubbleTeaFromCandidate(id: string): NormalizedBeverage | null {
  if (!id.startsWith("bubble-tea-") || id === "bubble-tea-custom") return null;
  const half = id.includes("half");
  return {
    id, matchedName: half ? "珍珠奶茶（半糖）" : "珍珠奶茶（全糖）", brand: null,
    defaultServingMl: 700, referenceServingMl: 700,
    nutritionPerServing: { ...emptyNutrition(), energyKcal: half ? 520 : 650, sugarG: half ? 38 : 65, caffeineMg: 60, proteinG: 4, fatG: 12, carbsG: half ? 93 : 120, sodiumMg: 180, calciumMg: 120, vitaminAUg: null, betaCaroteneUg: null, acidic: null, carbonated: false },
    priceMin: 55, priceMax: 85, priceType: "estimated", confidence: "low", dataLabel: "estimated",
    sources: [{ title: "依常見配方與份量估算，請以品牌標示為準", url: "https://consumer.fda.gov.tw/Food/TFND.aspx?nodeID=178", kind: "estimated", accessedAt }],
  };
}

const aliases: Record<string, string> = {
  "水": "water-500", "飲用水": "water-500", "白開水": "water-500",
  "可樂": "cola-330", "cola": "cola-330", "coke": "cola-330", "coca-cola": "cola-330",
  "胡蘿蔔汁": "carrot-juice-250", "紅蘿蔔汁": "carrot-juice-250", "carrot juice": "carrot-juice-250",
  "黑咖啡": "black-coffee-240", "美式咖啡": "black-coffee-240", "black coffee": "black-coffee-240",
  "鮮奶": "milk-240", "牛奶": "milk-240", "milk": "milk-240",
  "御茶園特撰日式綠茶": "yuchayuan-japanese-green-tea-590",
  "御茶園日式綠茶": "yuchayuan-japanese-green-tea-590",
  "義美錫蘭紅茶": "imei-ceylon-black-tea-250",
  "義美紅茶": "imei-ceylon-black-tea-250",
  "義美ceylon紅茶": "imei-ceylon-black-tea-250",
};

export function findCatalogue(name: string, brand?: string): NormalizedBeverage | null {
  const key = normalizeSearchText(name);
  const id = aliases[key];
  if (id) return CATALOGUE.find((item) => item.id === id) ?? null;

  const combined = normalizeSearchText(`${brand ?? ""}${name}`);
  if (/御茶園/.test(combined) && /綠茶|日式|茶/.test(combined)) {
    return CATALOGUE.find((item) => item.id === "yuchayuan-japanese-green-tea-590") ?? null;
  }
  if (/義美/.test(combined) && /錫蘭|紅茶|ceylon/.test(combined) && !/奶茶|鮮奶茶|牛奶|奶/.test(combined)) {
    return CATALOGUE.find((item) => item.id === "imei-ceylon-black-tea-250") ?? null;
  }
  return null;
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function isAmbiguousBubbleTea(name: string, brand?: string, sweetness?: string): boolean {
  return /珍珠奶茶|波霸奶茶|bubble tea/i.test(name) && !brand && !sweetness;
}
