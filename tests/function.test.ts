import test from "node:test";
import assert from "node:assert/strict";

(globalThis as unknown as { Netlify: unknown }).Netlify = {
  env: {
    get(name: string) {
      if (name === "SHORTCUT_ACCESS_TOKEN2") return "test-secret";
      if (name === "OPENAI_MODEL") return "chat-latest";
      return undefined;
    },
  },
};

const { default: handler } = await import("../netlify/functions/beverage-lookup.ts");

test("健康檢查端點可回應", async () => {
  const response = await handler(new Request("https://example.test/api/beverage-lookup"));
  const health = await response.json();
  assert.equal(response.status, 200);
  assert.equal(health.ok, true);
  assert.equal(health.integrations.openAiModel, "gpt-5.6-luna");
  assert.equal(health.integrations.shortcutAccessToken2Configured, true);
});

test("錯誤捷徑權杖會被拒絕", async () => {
  const response = await handler(new Request("https://example.test/api/beverage-lookup", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recordId: "123e4567-e89b-12d3-a456-426614174000", name: "水", accessToken: "wrong" }),
  }));
  assert.equal(response.status, 401);
});

test("正確權杖可完成查詢且不回傳權杖", async () => {
  const response = await handler(new Request("https://example.test/api/beverage-lookup", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recordId: "123e4567-e89b-12d3-a456-426614174000", name: "水", servingMl: "500", paidPrice: "15", accessToken: "test-secret" }),
  }));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.status, "ready");
  assert.equal(JSON.stringify(result).includes("test-secret"), false);
});
