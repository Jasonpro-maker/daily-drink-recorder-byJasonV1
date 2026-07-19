# 簽署捷徑輸出

macOS 26 的 `shortcuts sign` 目前拒絕 Cherri 2.3.0 產生的 plist。原始碼與通過 `plutil` 驗證的未簽檔位於上一層 `unsigned/`。

取得 RoutineHub HubSign 網路權限後執行：

```sh
cherri shortcuts/record-drink.cherri --derive-uuids --hubsign
cherri shortcuts/view-latest.cherri --derive-uuids --hubsign
```

簽署時送出的檔案只含匯入問題的預設值 `YOUR-SITE` 與 `CHANGE-ME`，不含正式 API 金鑰或私人紀錄。
