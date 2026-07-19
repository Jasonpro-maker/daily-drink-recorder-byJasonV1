# GitHub Pages 部署方式

這個專案目前可以不透過 Netlify，改用 GitHub Pages 發佈 `public/` 裡面的靜態網頁。

## 手動建立 repo 後部署

1. 到 GitHub 建立一個新的空 repo，例如 `daily-drink-recorder-tw`。
2. 不要勾選 README、.gitignore 或 license，保持空 repo。
3. 把 repo 名稱傳給 Codex，格式例如：

   `你的帳號/daily-drink-recorder-tw`

4. Codex 可以把目前檔案放進 repo；推上 `main` 後，`.github/workflows/deploy-pages.yml` 會自動部署 GitHub Pages。

## 之後查看網址

部署完成後，GitHub 會產生類似：

`https://你的帳號.github.io/daily-drink-recorder-tw/`

## 注意

- App 的飲料紀錄仍只存在手機瀏覽器 localStorage。
- GitHub Pages 只負責提供網頁檔案，不會收集你的飲料紀錄。
- 若更換手機或清除瀏覽器資料，請先在 App 裡下載 CSV 備份。
