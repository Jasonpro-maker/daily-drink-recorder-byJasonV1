export type Confidence = "high" | "medium" | "low";
export type EvidenceLevel = "strong" | "moderate" | "limited";
export type SourceKind = "measured" | "official" | "database" | "estimated";

export interface BeverageLookupRequest {
  recordId: string;
  name: string;
  brand?: string;
  servingMl?: number;
  sweetness?: string;
  ice?: string;
  paidPrice?: number;
  selectedCandidateId?: string;
  locale?: string;
}

export interface Nutrition {
  energyKcal: number | null;
  sugarG: number | null;
  caffeineMg: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  sodiumMg: number | null;
  calciumMg: number | null;
  vitaminAUg: number | null;
  betaCaroteneUg: number | null;
  acidic: boolean | null;
  carbonated: boolean | null;
}

export interface Source {
  title: string;
  url: string;
  kind: SourceKind;
  accessedAt: string;
}

export type OrganId = "eyes" | "brain" | "teeth" | "heart" | "stomach" | "liver" | "kidneys" | "bones";

export interface OrganImpact {
  organ: OrganId;
  label: string;
  score: number | null;
  tone: "positive" | "negative" | "neutral" | "unknown";
  reason: string;
  evidence: EvidenceLevel | null;
  ruleIds: string[];
}

export interface Candidate {
  id: string;
  name: string;
  brand: string | null;
  servingMl: number | null;
  description: string;
}

export interface BeverageResult {
  status: "ready";
  recordId: string;
  originalName: string;
  matchedName: string;
  brand: string | null;
  servingMl: number;
  sweetness: string | null;
  ice: string | null;
  nutrition: Nutrition;
  price: {
    amount: number | null;
    min: number | null;
    max: number | null;
    currency: "TWD";
    type: "paid" | "official" | "estimated" | "unknown";
  };
  confidence: Confidence;
  dataLabel: SourceKind;
  sources: Source[];
  impacts: OrganImpact[];
  ruleVersion: string;
  generatedAt: string;
  csvHeader: string;
  csvRow: string;
  reportHtml: string;
}

export type BeverageLookupResponse = BeverageResult | {
  status: "needs_confirmation";
  recordId: string;
  message: string;
  candidates: Candidate[];
} | {
  status: "not_found";
  recordId: string;
  message: string;
};

export interface NormalizedBeverage {
  id: string;
  matchedName: string;
  brand: string | null;
  defaultServingMl: number;
  nutritionPerServing: Nutrition;
  referenceServingMl: number;
  priceMin: number | null;
  priceMax: number | null;
  priceType: "official" | "estimated" | "unknown";
  confidence: Confidence;
  dataLabel: SourceKind;
  sources: Source[];
}
