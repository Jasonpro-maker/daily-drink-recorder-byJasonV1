# 每日飲料記錄器

用 iPhone 捷徑記錄飲料，查詢營養與台灣售價，將紀錄寫入 iCloud Drive CSV，並產生彩色人體器官影響報告。

## 專案內容

- `netlify/functions/beverage-lookup.ts`：唯一的 HTTPS 查詢端點，不保存飲用紀錄。
- `netlify/functions/_shared/`：食品查詢、評分規則、CSV 與自包含 HTML 報告。
- `shortcuts/`：兩個 iPhone 捷徑的 Cherri 原始碼與編譯檔。
- `tests/`：規則、查詢、CSV 與 HTML 安全測試。

## 部署 Netlify

需要 Node.js 18.14 以上、Netlify 帳號與 OpenAI API 金鑰。

```sh
pnpm install
netlify login
netlify init --manual
netlify env:set OPENAI_API_KEY "你的 OpenAI API 金鑰" --secret
netlify env:set OPENAI_MODEL "gpt-5.6-luna"
netlify env:set SHORTCUT_ACCESS_TOKEN2 "一組夠長的隨機字串" --secret
netlify deploy
netlify deploy --prod
```

部署後的端點為：

```text
https://你的站名.netlify.app/api/beverage-lookup
```

有 `OPENAI_API_KEY` 時，服務會使用 OpenAI Responses API 的 Web Search 工具，讓 ChatGPT 先搜尋品牌、相近品項、官方/通路營養標示與售價，再把結果整理回前端。建議 `OPENAI_MODEL` 使用支援 Responses API、結構化輸出與 Web Search 的模型，例如 `gpt-5.6-luna`；若誤設為 `chat-latest`，程式會自動改用 `gpt-5.6-luna`。沒有 `OPENAI_API_KEY` 時，水、可樂、胡蘿蔔汁、黑咖啡、鮮奶、御茶園綠茶與珍珠奶茶範例仍可使用；其他飲料會先查 Open Food Facts，資料不足時前端會先以「資料不足」保存紀錄。

## API

`POST /api/beverage-lookup` 接受 JSON：

```json
{
  "recordId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "可樂",
  "brand": "",
  "servingMl": 330,
  "sweetness": "正常",
  "ice": "冰",
  "paidPrice": 35,
  "accessToken": "與 Netlify 相同的權杖",
  "locale": "zh-TW"
}
```

回傳 `ready`、`needs_confirmation` 或 `not_found`。`ready` 內含營養、價格、來源、器官影響、可直接追加的 CSV 列與自包含 HTML。

## 本機驗證

```sh
pnpm test
netlify dev
```

健康分數是一般成人的遊戲化參考，不是醫療診斷。缺資料的器官維持「資料不足」，弱證據規則單項最多 ±1。

詳細捷徑安裝方式見 [shortcuts/README.md](shortcuts/README.md)。
