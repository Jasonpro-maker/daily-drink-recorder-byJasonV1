import test from "node:test";
import assert from "node:assert/strict";
import { csvEscape, makeCsvHeader } from "../netlify/functions/_shared/csv.ts";

test("CSV 正確處理中文逗號、雙引號與換行", () => {
  assert.equal(csvEscape('品牌,「特別」"版"\n第二行'), '"品牌,「特別」""版""\n第二行"');
  assert.equal(makeCsvHeader().split(",").length, 19);
});
