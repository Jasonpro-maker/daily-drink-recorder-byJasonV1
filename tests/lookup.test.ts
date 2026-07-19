import test from "node:test";
import assert from "node:assert/strict";
import { lookupBeverage } from "../netlify/functions/_shared/lookup.ts";

const id = "123e4567-e89b-12d3-a456-426614174000";

test("常見飲料可在無 API 金鑰時完整產生報告與 CSV", async () => {
  const result = await lookupBeverage({ recordId: id, name: "可樂", servingMl: 330, paidPrice: 35 }, { now: () => new Date("2026-07-04T12:00:00Z") });
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.equal(result.price.type, "paid");
  assert.equal(result.price.amount, 35);
  assert.match(result.reportHtml, /人體器官影響圖/);
  assert.match(result.reportHtml, /不是診斷或醫療建議/);
  assert.match(result.csvRow, new RegExp(id));
});

test("模糊珍珠奶茶先要求確認，不自行猜測", async () => {
  const result = await lookupBeverage({ recordId: id, name: "珍珠奶茶" });
  assert.equal(result.status, "needs_confirmation");
  if (result.status === "needs_confirmation") assert.equal(result.candidates.length, 3);
});

test("選定珍珠奶茶規格後回傳低可信度估算", async () => {
  const result = await lookupBeverage({ recordId: id, name: "珍珠奶茶", selectedCandidateId: "bubble-tea-half-700" });
  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    assert.equal(result.confidence, "low");
    assert.equal(result.servingMl, 700);
    assert.equal(result.dataLabel, "estimated");
  }
});

test("品牌優先時可用模糊品名匹配市售飲料成分", async () => {
  const result = await lookupBeverage({ recordId: id, brand: "御茶園", name: "綠茶", servingMl: 500 });
  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    assert.match(result.matchedName, /御茶園.*綠茶/);
    assert.equal(result.brand, "御茶園");
    assert.equal(result.nutrition.sugarG, 0);
    assert.equal(result.confidence, "low");
    assert.match(result.csvRow, /御茶園/);
  }
});

test("義美錫蘭紅茶可由品牌與模糊紅茶品名帶入營養標示", async () => {
  const result = await lookupBeverage({ recordId: id, brand: "義美", name: "錫蘭紅茶", servingMl: 250 });
  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    assert.match(result.matchedName, /義美.*錫蘭紅茶/);
    assert.equal(result.brand, "義美");
    assert.equal(result.nutrition.energyKcal, 67);
    assert.equal(result.nutrition.sugarG, 16.1);
    assert.equal(result.nutrition.carbsG, 16.8);
    assert.equal(result.nutrition.sodiumMg, 5);
    assert.equal(result.confidence, "medium");
  }
});

test("義美鮮奶茶不會套用義美錫蘭紅茶資料", async () => {
  const fetcher = async () => new Response(JSON.stringify({ products: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
  const result = await lookupBeverage({ recordId: id, brand: "義美", name: "鮮奶茶", servingMl: 500 }, { fetcher: fetcher as typeof fetch });
  assert.equal(result.status, "not_found");
});

test("OpenAI 搜尋使用固定 prompt 並允許低可信度估算", async () => {
  let requestedPrompt = "";
  const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("openfoodfacts.org")) {
      return new Response(JSON.stringify({ products: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.includes("api.openai.com")) {
      const body = JSON.parse(String(init?.body));
      requestedPrompt = body.input;
      return new Response(JSON.stringify({
        output_text: JSON.stringify({
          matchedName: "義美鮮奶茶 500ml 低可信度估算",
          brand: "義美",
          servingMl: 500,
          nutrition: {
            energyKcal: 210, sugarG: 28, caffeineMg: 35, proteinG: 5, fatG: 4, carbsG: 34, sodiumMg: 90,
            calciumMg: null, vitaminAUg: null, betaCaroteneUg: null, acidic: null, carbonated: false,
          },
          priceMin: 25,
          priceMax: 35,
          confidence: "low",
          dataLabel: "estimated",
          sourceUrls: [{ title: "估算依據：義美鮮奶茶產品與同類奶茶營養資料", url: "https://example.com/imei-milk-tea", kind: "estimated" }],
        }),
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    throw new Error(`unexpected url ${url}`);
  };

  const result = await lookupBeverage({ recordId: id, brand: "義美", name: "鮮奶茶", servingMl: 500 }, {
    openAiApiKey: "test-key",
    openAiModel: "gpt-5.6-luna",
    fetcher: fetcher as typeof fetch,
  });
  assert.match(requestedPrompt, /固定搜尋規則/);
  assert.match(requestedPrompt, /低可信度估算/);
  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    assert.equal(result.confidence, "low");
    assert.equal(result.dataLabel, "estimated");
    assert.equal(result.nutrition.sugarG, 28);
    assert.match(result.sources[0].title, /估算依據/);
  }
});

test("未知飲料且外部資料庫無結果時清楚回報", async () => {
  const fetcher = async () => new Response(JSON.stringify({ products: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
  const result = await lookupBeverage({ recordId: id, name: "不存在的神秘飲料" }, { fetcher: fetcher as typeof fetch });
  assert.equal(result.status, "not_found");
});

test("錯誤容量被驗證拒絕", async () => {
  const result = await lookupBeverage({ recordId: id, name: "水", servingMl: 1 });
  assert.equal(result.status, "not_found");
  if (result.status === "not_found") assert.match(result.message, /30–5000/);
});

test("接受捷徑以文字傳來的容量與價格", async () => {
  const result = await lookupBeverage({ recordId: id, name: "水", servingMl: "600", paidPrice: "20" } as never);
  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    assert.equal(result.servingMl, 600);
    assert.equal(result.price.amount, 20);
  }
});
