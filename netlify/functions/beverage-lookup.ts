import type { Config } from "@netlify/functions";
import { lookupBeverage } from "./_shared/lookup.ts";
import type { BeverageLookupRequest } from "./_shared/types.ts";

declare const Netlify: { env: { get(name: string): string | undefined } };

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const DEFAULT_OPENAI_MODEL = "gpt-5.6-luna";

function getOpenAiModel(): string {
  const configured = Netlify.env.get("OPENAI_MODEL")?.trim();
  if (!configured || configured === "chat-latest" || configured.startsWith("sk-")) return DEFAULT_OPENAI_MODEL;
  return configured;
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: jsonHeaders });
  if (req.method === "GET") return Response.json({
    ok: true,
    service: "每日飲料記錄器",
    version: "0.1.0",
    integrations: {
      openAiConfigured: Boolean(Netlify.env.get("OPENAI_API_KEY")),
      openAiModel: getOpenAiModel(),
      shortcutAccessToken2Configured: Boolean(Netlify.env.get("SHORTCUT_ACCESS_TOKEN2")),
    },
  }, { headers: jsonHeaders });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: jsonHeaders });

  try {
    const body = await req.json() as BeverageLookupRequest & { accessToken?: string };
    const expectedToken = Netlify.env.get("SHORTCUT_ACCESS_TOKEN2");
    const suppliedToken = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? body.accessToken;
    if (expectedToken && suppliedToken !== expectedToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: jsonHeaders });
    }
    delete body.accessToken;
    const result = await lookupBeverage(body, {
      openAiApiKey: Netlify.env.get("OPENAI_API_KEY"),
      openAiModel: getOpenAiModel(),
    });
    return Response.json(result, { headers: jsonHeaders });
  } catch {
    return Response.json({ status: "not_found", recordId: "unknown", message: "查詢服務暫時無法處理請求，請稍後重試。" }, { status: 400, headers: jsonHeaders });
  }
};

export const config: Config = { path: "/api/beverage-lookup", method: ["GET", "POST", "OPTIONS"] };
