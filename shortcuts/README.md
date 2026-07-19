# iPhone 捷徑

此資料夾包含可版本控制的 Cherri 原始碼，以及編譯後可匯入 iPhone 的 `.shortcut` 檔。

## 安裝

1. 先部署 Netlify 服務，設定 `OPENAI_API_KEY`、`OPENAI_MODEL` 與 `SHORTCUT_ACCESS_TOKEN`。
2. 在 iPhone 的「設定 → Apple 帳號 → iCloud → iCloud Drive」確認已開啟。
3. 將 `signed/記錄飲料.shortcut` 與 `signed/查看最近飲料報告.shortcut` 放入 iCloud Drive，再於 iPhone「檔案」App 依序點開匯入。
4. 匯入「記錄飲料」時，輸入正式 API 網址及與 Netlify 相同的 `SHORTCUT_ACCESS_TOKEN`。
5. 在捷徑詳細資訊選擇「加入主畫面」。

紀錄會存到 `iCloud Drive/Shortcuts/每日飲料記錄器/drinks.csv`，報告存於同資料夾的 `reports/`。

## 重新編譯

Cherri 2.3.0：

```sh
cherri shortcuts/record-drink.cherri --derive-uuids --skip-sign
cherri shortcuts/view-latest.cherri --derive-uuids --skip-sign
mv shortcuts/記錄飲料_unsigned.shortcut shortcuts/unsigned/記錄飲料.shortcut
mv shortcuts/查看最近飲料報告_unsigned.shortcut shortcuts/unsigned/查看最近飲料報告.shortcut
shortcuts sign --mode anyone --input shortcuts/unsigned/記錄飲料.shortcut --output shortcuts/signed/記錄飲料.shortcut
shortcuts sign --mode anyone --input shortcuts/unsigned/查看最近飲料報告.shortcut --output shortcuts/signed/查看最近飲料報告.shortcut
```

若目前 macOS 版本拒絕 Cherri 的 plist，可改用 Cherri 官方支援的 `--hubsign`，再將產生的簽署檔移入 `signed/`。Cherri 是第三方開源編譯器；捷徑原始碼與未簽檔均保留供檢查。
