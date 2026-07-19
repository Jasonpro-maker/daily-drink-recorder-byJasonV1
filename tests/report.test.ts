import test from "node:test";
import assert from "node:assert/strict";
import { lookupBeverage } from "../netlify/functions/_shared/lookup.ts";

test("HTML 報告是自包含且逃脫使用者輸入", async () => {
  const result = await lookupBeverage({ recordId: "123e4567-e89b-12d3-a456-426614174000", name: "可樂", brand: '<script>alert("x")</script>' });
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.doesNotMatch(result.reportHtml, /<script>alert/);
  assert.match(result.reportHtml, /&lt;script&gt;/);
  assert.match(result.reportHtml, /<svg/);
  assert.doesNotMatch(result.reportHtml, /https:\/\/.*\.js/);
});
