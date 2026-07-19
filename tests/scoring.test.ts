import test from "node:test";
import assert from "node:assert/strict";
import { scoreNutrition } from "../netlify/functions/_shared/scoring.ts";
import type { Nutrition } from "../netlify/functions/_shared/types.ts";

const base = (overrides: Partial<Nutrition>): Nutrition => ({
  energyKcal: null, sugarG: null, caffeineMg: null, proteinG: null, fatG: null, carbsG: null,
  sodiumMg: null, calciumMg: null, vitaminAUg: null, betaCaroteneUg: null, acidic: null, carbonated: null,
  ...overrides,
});

test("高糖酸性可樂讓牙齒與代謝呈現負分", () => {
  const impacts = scoreNutrition(base({ sugarG: 35, caffeineMg: 32, sodiumMg: 15, acidic: true, calciumMg: 0, vitaminAUg: 0 }));
  assert.ok(impacts.find((x) => x.organ === "teeth")!.score! < 0);
  assert.ok(impacts.find((x) => x.organ === "liver")!.score! < 0);
  assert.match(impacts.find((x) => x.organ === "teeth")!.reason, /35/);
});

test("胡蘿蔔汁只有在維生素 A 資料存在時眼睛才加分", () => {
  const known = scoreNutrition(base({ vitaminAUg: 500, betaCaroteneUg: 3000 }));
  const missing = scoreNutrition(base({ vitaminAUg: null, betaCaroteneUg: null }));
  assert.ok(known.find((x) => x.organ === "eyes")!.score! > 0);
  assert.equal(missing.find((x) => x.organ === "eyes")!.score, null);
});

test("弱證據酸性規則單項最多扣 1 分", () => {
  const impacts = scoreNutrition(base({ acidic: true, sugarG: 0 }));
  assert.equal(impacts.find((x) => x.organ === "stomach")!.score, -1);
  assert.equal(impacts.find((x) => x.organ === "stomach")!.evidence, "limited");
});
