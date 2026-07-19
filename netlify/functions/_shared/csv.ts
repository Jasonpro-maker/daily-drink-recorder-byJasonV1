import type { BeverageResult } from "./types.ts";

export const CSV_COLUMNS = [
  "record_id", "recorded_at", "original_name", "matched_name", "brand", "serving_ml", "sweetness",
  "energy_kcal", "sugar_g", "caffeine_mg", "protein_g", "fat_g", "carbs_g", "sodium_mg",
  "price_twd", "price_type", "confidence", "organ_impacts_json", "source_urls",
];

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function makeCsvHeader(): string { return CSV_COLUMNS.join(","); }

export function makeCsvRow(result: Omit<BeverageResult, "csvHeader" | "csvRow" | "reportHtml">): string {
  const n = result.nutrition;
  const values = [
    result.recordId, result.generatedAt, result.originalName, result.matchedName, result.brand, result.servingMl,
    result.sweetness, n.energyKcal, n.sugarG, n.caffeineMg, n.proteinG, n.fatG, n.carbsG, n.sodiumMg,
    result.price.amount, result.price.type, result.confidence,
    result.impacts.map(({ organ, score, tone, evidence, ruleIds }) => ({ organ, score, tone, evidence, ruleIds })),
    result.sources.map((source) => source.url).join(" | "),
  ];
  return values.map(csvEscape).join(",");
}
