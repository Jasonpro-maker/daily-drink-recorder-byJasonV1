import { BUBBLE_TEA_CANDIDATES, bubbleTeaFromCandidate, findCatalogue, isAmbiguousBubbleTea } from "./catalogue.ts";
import { makeCsvHeader, makeCsvRow } from "./csv.ts";
import { searchOpenFoodFacts, searchWithOpenAI } from "./external.ts";
import { renderReport } from "./report.ts";
import { RULE_VERSION, scoreNutrition } from "./scoring.ts";
import type { BeverageLookupRequest, BeverageLookupResponse, BeverageResult, NormalizedBeverage, Nutrition } from "./types.ts";

export interface LookupOptions { openAiApiKey?: string; openAiModel?: string; fetcher?: typeof fetch; now?: () => Date }

export async function lookupBeverage(request: BeverageLookupRequest, options: LookupOptions = {}): Promise<BeverageLookupResponse> {
  request = normalizeShortcutValues(request);
  const validation = validateRequest(request);
  if (validation) return { status: "not_found", recordId: request.recordId || "missing", message: validation };
  if (isAmbiguousBubbleTea(request.name, request.brand, request.sweetness) && !request.selectedCandidateId) {
    return { status: "needs_confirmation", recordId: request.recordId, message: `資料不夠明確，請補充品牌、容量與甜度後重試。候選：${BUBBLE_TEA_CANDIDATES.map((item) => item.name).join("、")}。`, candidates: BUBBLE_TEA_CANDIDATES };
  }

  const servingMl = clampServing(request.servingMl ?? 500);
  let match = request.selectedCandidateId ? bubbleTeaFromCandidate(request.selectedCandidateId) : null;
  match ??= findCatalogue(request.name, request.brand);
  let openAiAttempted = false;
  let openAiFailed = false;
  let openAiFailureDetail = "";
  if (!match) {
    try {
      const found = await searchOpenFoodFacts(`${request.brand ?? ""} ${request.name}`.trim(), servingMl, options.fetcher);
      match = found[0] ?? null;
    } catch { /* Continue to web search. */ }
  }
  if (!match && options.openAiApiKey) {
    openAiAttempted = true;
    try {
      match = await searchWithOpenAI({ name: request.name, brand: request.brand, servingMl, sweetness: request.sweetness, ice: request.ice }, options.openAiApiKey, options.openAiModel ?? "gpt-5.6-luna", options.fetcher);
    } catch (error) {
      openAiFailed = true;
      openAiFailureDetail = sanitizeErrorMessage(error);
      console.warn("OpenAI beverage lookup failed", error);
    }
  }
  if (!match) return {
    status: "not_found",
    recordId: request.recordId,
    message: buildNotFoundMessage(Boolean(options.openAiApiKey), openAiAttempted, openAiFailed, openAiFailureDetail),
  };
  return assembleResult(request, match, options.now?.() ?? new Date());
}

function buildNotFoundMessage(openAiConfigured: boolean, openAiAttempted: boolean, openAiFailed: boolean, detail = ""): string {
  if (!openAiConfigured) return "目前只查了內建表與 Open Food Facts；Netlify 沒有讀到 OPENAI_API_KEY，所以 ChatGPT 網路搜尋尚未啟用。請先設定 OPENAI_API_KEY 後再試。";
  if (openAiFailed) return `ChatGPT 網路搜尋有啟用，但這次呼叫失敗。常見原因是 OPENAI_API_KEY 權限/額度、OPENAI_MODEL 不支援 Web Search、搜尋逾時或 OpenAI 回傳格式錯誤。${detail ? `錯誤摘要：${detail}。` : ""}已先保留目前輸入內容，營養與器官分數標示為資料不足。`;
  if (openAiAttempted) return "ChatGPT 網路搜尋有執行，但沒有找到同品牌／近似品項且有來源支撐的營養標示。已先保留目前輸入內容，營養與器官分數標示為資料不足。";
  return "目前找不到足夠可靠的資料。請加入品牌、容量或更完整的品名後再試。";
}

function sanitizeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw
    .replace(/sk-[A-Za-z0-9_-]+/g, "[API_KEY_HIDDEN]")
    .replace(/\s+/g, " ")
    .slice(0, 220);
}

function normalizeShortcutValues(request: BeverageLookupRequest): BeverageLookupRequest {
  const raw = request as Omit<BeverageLookupRequest, "servingMl" | "paidPrice"> & { servingMl?: number | string; paidPrice?: number | string };
  return {
    ...request,
    servingMl: raw.servingMl === undefined || raw.servingMl === "" ? undefined : Number(raw.servingMl),
    paidPrice: raw.paidPrice === undefined || raw.paidPrice === "" ? undefined : Number(raw.paidPrice),
  };
}

export function assembleResult(request: BeverageLookupRequest, match: NormalizedBeverage, now = new Date()): BeverageResult {
  const servingMl = clampServing(request.servingMl ?? match.defaultServingMl);
  const nutrition = scaleNutrition(match.nutritionPerServing, servingMl / match.referenceServingMl);
  const impacts = scoreNutrition(nutrition);
  const inferredPrice = midpoint(match.priceMin, match.priceMax);
  const price = request.paidPrice !== undefined && Number.isFinite(request.paidPrice) && request.paidPrice > 0
    ? { amount: Math.max(0, request.paidPrice), min: request.paidPrice, max: request.paidPrice, currency: "TWD" as const, type: "paid" as const }
    : { amount: inferredPrice, min: match.priceMin, max: match.priceMax, currency: "TWD" as const, type: match.priceType };
  const base = {
    status: "ready" as const, recordId: request.recordId, originalName: request.name, matchedName: match.matchedName,
    brand: request.brand?.trim() || match.brand, servingMl, sweetness: request.sweetness?.trim() || null,
    ice: request.ice?.trim() || null, nutrition, price, confidence: match.confidence, dataLabel: match.dataLabel,
    sources: match.sources, impacts, ruleVersion: RULE_VERSION, generatedAt: now.toISOString(),
  };
  const csvHeader = makeCsvHeader();
  const csvRow = makeCsvRow(base);
  const reportHtml = renderReport({ ...base, csvHeader, csvRow });
  return { ...base, csvHeader, csvRow, reportHtml };
}

function validateRequest(request: BeverageLookupRequest): string | null {
  if (!request || typeof request !== "object") return "請求格式不正確。";
  if (!/^[0-9a-f-]{16,64}$/i.test(request.recordId ?? "")) return "recordId 格式不正確。";
  if (typeof request.name !== "string" || request.name.trim().length < 1 || request.name.length > 120) return "飲料名稱必須是 1–120 個字。";
  if (request.servingMl !== undefined && (!Number.isFinite(request.servingMl) || request.servingMl < 30 || request.servingMl > 5000)) return "容量必須介於 30–5000 ml。";
  if (request.paidPrice !== undefined && (!Number.isFinite(request.paidPrice) || request.paidPrice < 0 || request.paidPrice > 100000)) return "價格格式不正確。";
  return null;
}

function scaleNutrition(n: Nutrition, scale: number): Nutrition {
  const scaled = (value: number | null) => value === null ? null : Math.round(value * scale * 10) / 10;
  return { energyKcal: scaled(n.energyKcal), sugarG: scaled(n.sugarG), caffeineMg: scaled(n.caffeineMg), proteinG: scaled(n.proteinG), fatG: scaled(n.fatG), carbsG: scaled(n.carbsG), sodiumMg: scaled(n.sodiumMg), calciumMg: scaled(n.calciumMg), vitaminAUg: scaled(n.vitaminAUg), betaCaroteneUg: scaled(n.betaCaroteneUg), acidic: n.acidic, carbonated: n.carbonated };
}
function clampServing(value: number): number { return Math.max(30, Math.min(5000, Math.round(value))); }
function midpoint(min: number | null, max: number | null): number | null { if (min === null && max === null) return null; if (min === null) return max; if (max === null) return min; return Math.round((min + max) / 2); }
