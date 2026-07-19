import type { NormalizedBeverage, Nutrition, Source } from "./types.ts";

type FetchLike = typeof fetch;

const wantedFields = ["code", "product_name", "product_name_zh", "brands", "serving_size", "nutriments", "url"].join(",");

export async function searchOpenFoodFacts(query: string, servingMl: number, fetcher: FetchLike = fetch): Promise<NormalizedBeverage[]> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "5");
  url.searchParams.set("fields", wantedFields);
  const response = await fetcher(url, {
    headers: { "User-Agent": "DailyDrinkRecorder/0.1 (personal nutrition logger)" },
    signal: AbortSignal.timeout(6_000),
  });
  if (!response.ok) throw new Error(`Open Food Facts ${response.status}`);
  const body = await response.json() as { products?: Array<Record<string, unknown>> };
  return (body.products ?? []).map((product) => normalizeOffProduct(product, servingMl)).filter((item): item is NormalizedBeverage => item !== null);
}

function normalizeOffProduct(product: Record<string, unknown>, servingMl: number): NormalizedBeverage | null {
  const nutriments = product.nutriments as Record<string, unknown> | undefined;
  const name = text(product.product_name_zh) || text(product.product_name);
  if (!name || !nutriments) return null;
  const scale = servingMl / 100;
  const per100 = (key: string): number | null => number(nutriments[`${key}_100g`]);
  const n: Nutrition = {
    energyKcal: mul(per100("energy-kcal"), scale),
    sugarG: mul(per100("sugars"), scale),
    caffeineMg: mul(per100("caffeine"), scale, 1000),
    proteinG: mul(per100("proteins"), scale),
    fatG: mul(per100("fat"), scale),
    carbsG: mul(per100("carbohydrates"), scale),
    sodiumMg: mul(per100("sodium"), scale, 1000),
    calciumMg: mul(per100("calcium"), scale, 1000),
    vitaminAUg: mul(per100("vitamin-a"), scale, 1_000_000),
    betaCaroteneUg: mul(per100("beta-carotene"), scale, 1_000_000),
    acidic: null,
    carbonated: null,
  };
  if (Object.values(n).every((value) => value === null)) return null;
  const code = text(product.code) || crypto.randomUUID();
  const source: Source = {
    title: `Open Food Facts：${name}`,
    url: text(product.url) || `https://world.openfoodfacts.org/product/${encodeURIComponent(code)}`,
    kind: "database",
    accessedAt: new Date().toISOString(),
  };
  return {
    id: `off-${code}`, matchedName: name, brand: text(product.brands) || null,
    defaultServingMl: servingMl, referenceServingMl: servingMl, nutritionPerServing: n,
    priceMin: null, priceMax: null, priceType: "unknown", confidence: "medium", dataLabel: "database", sources: [source],
  };
}

interface WebLookupPayload {
  matchedName: string;
  brand: string | null;
  servingMl: number;
  nutrition: Nutrition;
  priceMin: number | null;
  priceMax: number | null;
  confidence: "medium" | "low";
  dataLabel: "official" | "database" | "estimated";
  sourceUrls: Array<{ title: string; url: string; kind: "official" | "database" | "estimated" }>;
}

const FIXED_WEB_SEARCH_PROMPT = `你是「台灣飲料營養資料搜尋助手」。你的任務不是醫療診斷，而是幫使用者把一杯飲料轉成可記錄的營養資料表。

固定搜尋規則：
1. 先判斷品牌。若使用者有輸入品牌，品牌是最高優先條件，不能跨品牌套用資料。
2. 品名可以模糊匹配。使用者輸入短名稱時，請在同品牌中尋找最接近的完整市售品項。例如品牌「御茶園」、名稱「綠茶」，可採用「御茶園特撰日式綠茶」或同品牌最接近綠茶品項。
3. 若同品牌有多個候選，選擇名稱、容量、甜度最接近者。matchedName 必須回傳實際採用的完整商品名稱，不要只回使用者輸入的短名稱。
4. 搜尋順序：品牌官方產品頁或菜單 → 官方營養標示/PDF/圖片 → 台灣政府或可信資料庫 → 台灣通路商品頁 → 其他可查證網頁。
5. 優先取得熱量、糖、咖啡因、蛋白質、脂肪、碳水、鈉。若有鈣、維生素 A、β-胡蘿蔔素也一併填入。
6. 若來源是每 100ml 或每 100g，請換算成使用者輸入的容量。若來源是每瓶/每份，請先確認該份量，再換算。
7. 售價用台灣新台幣範圍，優先官方或通路價；找不到可填 null。
8. 如果找不到完全精確的營養標示，但找得到同品牌相近品項、產品頁、成分或同類飲料營養依據，可以產出「低可信度估算」。這時 confidence 必須是 low，dataLabel 必須是 estimated，sourceUrls 的 title 要寫清楚「估算依據」。
9. 若官方或包裝營養標示直接支撐數值，confidence 可為 medium，dataLabel 為 official。Open Food Facts 或資料庫結果則 dataLabel 為 database。
10. 不要捏造來源網址。sourceUrls 必須是真實可開啟、與品項或估算依據相關的網址。
11. 若某欄位完全沒有可靠依據，填 null；但如果是低可信度估算，允許用同品牌或同類飲料資料推估熱量、糖、碳水、脂肪、蛋白質、鈉，並以 low/estimated 標示。
12. 回傳必須只符合 JSON schema，不要輸出解釋文字。`;

export async function searchWithOpenAI(input: { name: string; brand?: string; servingMl: number; sweetness?: string; ice?: string }, apiKey: string, model: string, fetcher: FetchLike = fetch): Promise<NormalizedBeverage | null> {
  const schema = {
    type: "object", additionalProperties: false,
    properties: {
      matchedName: { type: "string" }, brand: { type: ["string", "null"] }, servingMl: { type: "number" },
      nutrition: { type: "object", additionalProperties: false, properties: {
        energyKcal: nullableNumber(), sugarG: nullableNumber(), caffeineMg: nullableNumber(), proteinG: nullableNumber(), fatG: nullableNumber(), carbsG: nullableNumber(), sodiumMg: nullableNumber(), calciumMg: nullableNumber(), vitaminAUg: nullableNumber(), betaCaroteneUg: nullableNumber(), acidic: { type: ["boolean", "null"] }, carbonated: { type: ["boolean", "null"] },
      }, required: ["energyKcal","sugarG","caffeineMg","proteinG","fatG","carbsG","sodiumMg","calciumMg","vitaminAUg","betaCaroteneUg","acidic","carbonated"] },
      priceMin: nullableNumber(), priceMax: nullableNumber(),
      confidence: { type: "string", enum: ["medium", "low"] },
      dataLabel: { type: "string", enum: ["official", "database", "estimated"] },
      sourceUrls: { type: "array", items: { type: "object", additionalProperties: false, properties: { title: { type: "string" }, url: { type: "string" }, kind: { type: "string", enum: ["official","database","estimated"] } }, required: ["title","url","kind"] } },
    }, required: ["matchedName","brand","servingMl","nutrition","priceMin","priceMax","confidence","dataLabel","sourceUrls"],
  };
  const response = await callOpenAI("web_search");
  async function callOpenAI(toolType: "web_search" | "web_search_preview"): Promise<Response> {
    return fetcher("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(40_000),
    body: JSON.stringify({
      model,
      tools: [{
        type: toolType,
        search_context_size: "medium",
        user_location: {
          type: "approximate",
          country: "TW",
          city: "Taipei",
          timezone: "Asia/Taipei",
        },
      }],
      input: `${FIXED_WEB_SEARCH_PROMPT}

使用者這次要查：
- 飲料名稱：${input.name}
- 品牌：${input.brand || "未指定"}
- 容量：${input.servingMl} ml
- 甜度：${input.sweetness || "未指定"}
- 冰量：${input.ice || "未指定"}`,
      text: { format: { type: "json_schema", name: "beverage_lookup", strict: true, schema } },
    }),
  });
  }
  if (!response.ok) {
    const primaryError = await response.text();
    if (primaryError.includes("web_search") || primaryError.includes("tool")) {
      const retry = await callOpenAI("web_search_preview");
      if (retry.ok) return parseOpenAIResponse(retry, input);
      throw new Error(`OpenAI ${retry.status}: ${(await retry.text()).slice(0, 300)}`);
    }
    throw new Error(`OpenAI ${response.status}: ${primaryError.slice(0, 300)}`);
  }
  return parseOpenAIResponse(response, input);
}

async function parseOpenAIResponse(response: Response, input: { servingMl: number }): Promise<NormalizedBeverage | null> {
  const data = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  const outputText = data.output_text ?? data.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
  if (!outputText) return null;
  const parsed = JSON.parse(outputText) as WebLookupPayload;
  const sources = parsed.sourceUrls.filter((source) => safeHttpUrl(source.url)).map((source) => ({ ...source, accessedAt: new Date().toISOString() }));
  if (!parsed.matchedName || sources.length === 0) return null;
  return {
    id: `web-${crypto.randomUUID()}`, matchedName: parsed.matchedName, brand: parsed.brand,
    defaultServingMl: parsed.servingMl || input.servingMl, referenceServingMl: parsed.servingMl || input.servingMl,
    nutritionPerServing: parsed.nutrition, priceMin: parsed.priceMin, priceMax: parsed.priceMax,
    priceType: "estimated", confidence: parsed.confidence,
    dataLabel: parsed.dataLabel, sources,
  };
}

function nullableNumber(): { type: ["number", "null"] } { return { type: ["number", "null"] }; }
function text(value: unknown): string { return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : ""; }
function number(value: unknown): number | null { const n = typeof value === "number" ? value : Number(value); return Number.isFinite(n) ? n : null; }
function mul(value: number | null, scale: number, unit = 1): number | null { return value === null ? null : Math.round(value * scale * unit * 10) / 10; }
function safeHttpUrl(value: string): boolean { try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; } }
