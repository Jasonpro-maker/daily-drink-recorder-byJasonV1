import type { BeverageResult, OrganImpact } from "./types.ts";
import { HEALTH_REFERENCES } from "./scoring.ts";

const organPositions: Record<string, { x: number; y: number }> = {
  brain: { x: 150, y: 64 }, eyes: { x: 150, y: 91 }, heart: { x: 132, y: 192 },
  stomach: { x: 166, y: 250 }, liver: { x: 128, y: 238 }, kidneys: { x: 150, y: 286 },
  bones: { x: 150, y: 352 }, teeth: { x: 150, y: 108 },
};

function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

function color(impact: OrganImpact): string {
  if (impact.score === null) return "#a8b7b2";
  if (impact.score > 0) return impact.score >= 3 ? "#20b875" : "#75d7a8";
  if (impact.score < 0) return impact.score <= -3 ? "#e85151" : "#f28b82";
  return "#d9b44a";
}

function fmt(value: number | null, unit: string): string { return value === null ? "資料不足" : `${Math.round(value * 10) / 10} ${unit}`; }

export function renderReport(result: Omit<BeverageResult, "reportHtml">): string {
  const impactMap = new Map(result.impacts.map((impact) => [impact.organ, impact]));
  const dots = result.impacts.map((impact) => {
    const p = organPositions[impact.organ];
    return `<a href="#${impact.organ}" aria-label="${esc(impact.label)} ${impact.score ?? "資料不足"}"><circle cx="${p.x}" cy="${p.y}" r="${impact.organ === "bones" ? 14 : 11}" fill="${color(impact)}" stroke="#fff" stroke-width="4"/><text x="${p.x}" y="${p.y + 4}" text-anchor="middle" font-size="10" font-weight="800" fill="#17352f">${impact.score === null ? "?" : impact.score > 0 ? `+${impact.score}` : impact.score}</text></a>`;
  }).join("");
  const cards = result.impacts.map((impact) => `<article class="impact" id="${impact.organ}"><div class="impact-title"><span class="swatch" style="background:${color(impact)}"></span><strong>${esc(impact.label)}</strong><b>${impact.score === null ? "資料不足" : impact.score > 0 ? `+${impact.score}` : impact.score}</b></div><p>${esc(impact.reason)}</p><small>${impact.evidence ? `證據：${impact.evidence === "strong" ? "較強" : impact.evidence === "moderate" ? "中等" : "有限"}` : "未評分"}</small></article>`).join("");
  const sources = [...result.sources, ...HEALTH_REFERENCES.map((s) => ({ ...s, kind: "official" as const, accessedAt: result.generatedAt }))];
  const sourceList = sources.map((source) => `<li><a href="${esc(source.url)}">${esc(source.title)}</a> <span>${esc(source.kind)}</span></li>`).join("");
  const mainScore = result.impacts.reduce((sum, impact) => sum + (impact.score ?? 0), 0);
  const n = result.nutrition;
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(result.matchedName)}｜飲料身體報告</title><style>
  :root{color-scheme:light;--ink:#17352f;--muted:#60736e;--paper:#f4fbf8;--card:#fff;--line:#dce9e4;--accent:#237a69}*{box-sizing:border-box}body{margin:0;background:linear-gradient(160deg,#e9f8f1,#fff7e8);color:var(--ink);font:16px/1.55 -apple-system,BlinkMacSystemFont,"PingFang TC",sans-serif}.wrap{max-width:760px;margin:auto;padding:28px 18px 64px}.hero,.panel{background:rgba(255,255,255,.88);border:1px solid rgba(255,255,255,.8);border-radius:28px;box-shadow:0 16px 45px rgba(32,84,72,.10);padding:24px;margin-bottom:16px}.eyebrow{font-size:12px;letter-spacing:.12em;color:var(--accent);font-weight:800}h1{font-size:32px;line-height:1.15;margin:7px 0}.meta{color:var(--muted)}.score{display:inline-flex;align-items:center;gap:8px;background:#edf7f3;border-radius:999px;padding:8px 13px;font-weight:800}.grid{display:grid;grid-template-columns:280px 1fr;gap:20px}.body{width:100%;max-height:460px}.legend{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--muted)}.legend i,.swatch{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:5px}.impact{border-bottom:1px solid var(--line);padding:13px 0;scroll-margin-top:16px}.impact:last-child{border:0}.impact-title{display:grid;grid-template-columns:18px 1fr auto;align-items:center}.impact p{margin:7px 0;color:#38534d}.impact small{color:var(--muted)}.nutri{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.nutri div{background:var(--paper);padding:12px;border-radius:14px}.nutri b,.nutri span{display:block}.nutri span{font-size:12px;color:var(--muted)}ul{padding-left:20px}li{margin:8px 0}li span{font-size:11px;color:var(--muted);background:#eef3f1;padding:2px 6px;border-radius:99px}a{color:#196c5b}.notice{font-size:13px;color:var(--muted);background:#fff5d9;border-radius:14px;padding:12px}@media(max-width:620px){.grid{grid-template-columns:1fr}.body{max-height:390px}.nutri{grid-template-columns:repeat(2,1fr)}}
  </style></head><body><main class="wrap"><section class="hero"><div class="eyebrow">每日飲料記錄器 · 一般成人參考</div><h1>${esc(result.matchedName)}</h1><p class="meta">${esc(result.brand ?? "未指定品牌")} · ${result.servingMl} ml · ${esc(result.sweetness ?? "未指定甜度")} · ${result.price.amount === null ? "價格未知" : `NT$ ${result.price.amount}`}</p><div class="score">本杯器官分數合計 ${mainScore > 0 ? `+${mainScore}` : mainScore}</div></section>
  <section class="panel grid"><div><svg class="body" viewBox="0 0 300 470" role="img" aria-label="人體器官影響圖"><circle cx="150" cy="82" r="45" fill="#dce9e4"/><path d="M104 134 Q150 112 196 134 L218 294 Q202 330 183 345 L176 448 H139 L132 345 Q98 325 82 294Z" fill="#dce9e4"/><path d="M104 148 L57 286" stroke="#dce9e4" stroke-width="27" stroke-linecap="round"/><path d="M196 148 L243 286" stroke="#dce9e4" stroke-width="27" stroke-linecap="round"/>${dots}</svg><div class="legend"><span><i style="background:#20b875"></i>可能益處</span><span><i style="background:#e85151"></i>可能負擔</span><span><i style="background:#a8b7b2"></i>資料不足</span></div></div><div>${cards}</div></section>
  <section class="panel"><h2>本杯營養</h2><div class="nutri"><div><span>熱量</span><b>${fmt(n.energyKcal,"kcal")}</b></div><div><span>糖</span><b>${fmt(n.sugarG,"g")}</b></div><div><span>咖啡因</span><b>${fmt(n.caffeineMg,"mg")}</b></div><div><span>鈉</span><b>${fmt(n.sodiumMg,"mg")}</b></div><div><span>蛋白質</span><b>${fmt(n.proteinG,"g")}</b></div><div><span>脂肪</span><b>${fmt(n.fatG,"g")}</b></div><div><span>碳水</span><b>${fmt(n.carbsG,"g")}</b></div><div><span>鈣</span><b>${fmt(n.calciumMg,"mg")}</b></div></div></section>
  <section class="panel"><h2>資料來源</h2><ul>${sourceList}</ul><p class="meta">可信度：${result.confidence} · 資料類型：${result.dataLabel} · 評分規則：${result.ruleVersion}</p></section><p class="notice">這是依單杯營養資料產生的遊戲化一般成人參考，不是診斷或醫療建議。實際影響會受總飲食、飲用頻率、個人體質與疾病影響。</p></main></body></html>`;
}
