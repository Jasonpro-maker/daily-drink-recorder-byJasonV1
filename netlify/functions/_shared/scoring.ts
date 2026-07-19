import type { Nutrition, OrganId, OrganImpact } from "./types.ts";

export const RULE_VERSION = "2026.07.1";

const labels: Record<OrganId, string> = {
  eyes: "眼睛", brain: "腦／神經", teeth: "牙齒", heart: "心血管",
  stomach: "胃", liver: "肝／代謝", kidneys: "腎臟", bones: "骨骼",
};

type Contribution = { organ: OrganId; score: number; reason: string; evidence: "strong" | "moderate" | "limited"; ruleId: string };

function negativeBand(value: number, thresholds: number[]): number {
  let score = 0;
  thresholds.forEach((threshold, index) => { if (value >= threshold) score = -(index + 1); });
  return score;
}

function positiveBand(value: number, thresholds: number[]): number {
  let score = 0;
  thresholds.forEach((threshold, index) => { if (value >= threshold) score = index + 1; });
  return score;
}

function clamp(score: number): number { return Math.max(-5, Math.min(5, score)); }

export function scoreNutrition(n: Nutrition): OrganImpact[] {
  const c: Contribution[] = [];

  if (n.sugarG !== null) {
    const dental = negativeBand(n.sugarG, [5, 12.5, 25, 37.5, 50]);
    const metabolic = negativeBand(n.sugarG, [12.5, 25, 37.5, 50, 65]);
    if (dental) c.push({ organ: "teeth", score: dental, reason: `本杯含糖 ${fmt(n.sugarG)} g；游離糖攝取與蛀牙風險相關。`, evidence: "strong", ruleId: "sugar-dental" });
    if (metabolic) c.push({ organ: "liver", score: metabolic, reason: `本杯含糖 ${fmt(n.sugarG)} g，約占 WHO 50 g 每日上限的 ${Math.round(n.sugarG / 50 * 100)}%。`, evidence: "moderate", ruleId: "sugar-metabolic" });
  }
  if (n.acidic === true) {
    c.push({ organ: "teeth", score: -1, reason: "資料顯示飲品具酸性；頻繁接觸可能增加牙齒酸蝕負擔。", evidence: "limited", ruleId: "acid-teeth" });
    c.push({ organ: "stomach", score: -1, reason: "酸性飲品可能使部分成人感到胃部不適；個人反應差異很大。", evidence: "limited", ruleId: "acid-stomach" });
  }
  if (n.caffeineMg !== null && n.caffeineMg > 0) {
    if (n.caffeineMg <= 100) c.push({ organ: "brain", score: 1, reason: `咖啡因約 ${fmt(n.caffeineMg)} mg，可能短暫提升清醒度。`, evidence: "moderate", ruleId: "caffeine-alertness" });
    if (n.caffeineMg >= 100) c.push({ organ: "brain", score: n.caffeineMg >= 200 ? -2 : -1, reason: `單杯咖啡因約 ${fmt(n.caffeineMg)} mg；接近睡前可能影響睡眠。`, evidence: "moderate", ruleId: "caffeine-sleep" });
    if (n.caffeineMg >= 200) c.push({ organ: "heart", score: -1, reason: "單次咖啡因達 200 mg，敏感者可能感到心悸；一般成人反應不一。", evidence: "limited", ruleId: "caffeine-heart" });
  }
  if (n.sodiumMg !== null) {
    const sodium = negativeBand(n.sodiumMg, [200, 400, 800, 1200, 1600]);
    if (sodium) {
      c.push({ organ: "heart", score: sodium, reason: `鈉約 ${fmt(n.sodiumMg)} mg；需併入當日總攝取量評估。`, evidence: "moderate", ruleId: "sodium-heart" });
      c.push({ organ: "kidneys", score: Math.max(-3, sodium), reason: `鈉約 ${fmt(n.sodiumMg)} mg，腎臟需協助維持體液與電解質平衡。`, evidence: "limited", ruleId: "sodium-kidney" });
    }
  }
  const vitaminARae = (n.vitaminAUg ?? 0) + (n.betaCaroteneUg ?? 0) / 12;
  if (vitaminARae > 0) {
    const eye = positiveBand(vitaminARae, [90, 180, 360, 630, 900]);
    if (eye) c.push({ organ: "eyes", score: eye, reason: `維生素 A 當量約 ${fmt(vitaminARae)} µg RAE，有助維持正常視覺功能。`, evidence: "strong", ruleId: "vitamin-a-eyes" });
  }
  if (n.calciumMg !== null) {
    const bone = positiveBand(n.calciumMg, [100, 200, 300, 500, 800]);
    if (bone) c.push({ organ: "bones", score: bone, reason: `鈣約 ${fmt(n.calciumMg)} mg，是維持骨骼健康所需營養素。`, evidence: "strong", ruleId: "calcium-bones" });
  }

  return (Object.keys(labels) as OrganId[]).map((organ) => {
    const matches = c.filter((item) => item.organ === organ);
    if (!hasRelevantData(organ, n)) return { organ, label: labels[organ], score: null, tone: "unknown", reason: "可用營養資料不足，暫不評分。", evidence: null, ruleIds: [] };
    const score = clamp(matches.reduce((sum, item) => sum + item.score, 0));
    const ordered = [...matches].sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
    return {
      organ, label: labels[organ], score,
      tone: score > 0 ? "positive" : score < 0 ? "negative" : "neutral",
      reason: ordered.length ? ordered.map((item) => item.reason).join(" ") : "目前沒有達到加減分門檻的已知影響。",
      evidence: ordered[0]?.evidence ?? null,
      ruleIds: ordered.map((item) => item.ruleId),
    };
  });
}

function hasRelevantData(organ: OrganId, n: Nutrition): boolean {
  switch (organ) {
    case "eyes": return n.vitaminAUg !== null || n.betaCaroteneUg !== null;
    case "brain": return n.caffeineMg !== null;
    case "teeth": return n.sugarG !== null || n.acidic !== null;
    case "heart": return n.sodiumMg !== null || n.caffeineMg !== null;
    case "stomach": return n.acidic !== null || n.caffeineMg !== null;
    case "liver": return n.sugarG !== null;
    case "kidneys": return n.sodiumMg !== null;
    case "bones": return n.calciumMg !== null;
  }
}

function fmt(value: number): string { return Number.isInteger(value) ? String(value) : value.toFixed(1); }

export const HEALTH_REFERENCES = [
  { title: "WHO：健康飲食與游離糖建議", url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet" },
  { title: "WHO：糖與齲齒", url: "https://www.who.int/news-room/fact-sheets/detail/sugars-and-dental-caries" },
  { title: "EFSA：咖啡因安全性", url: "https://www.efsa.europa.eu/en/topics/topic/caffeine" },
  { title: "台灣食品營養成分資料庫", url: "https://www.fda.gov.tw/tc/site.aspx?r=972680063&sid=271" },
];
