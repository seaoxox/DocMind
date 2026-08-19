# DocMind Q&A（純前端版）

智慧指引文件問答與手冊瀏覽系統。**完全前端（無後端伺服器）**，文件解析在瀏覽器本機完成，AI 問答直接呼叫您自備的
Gemini／OpenAI／Anthropic API Key，可直接部署於 **GitHub Pages** 這類純靜態託管服務。

## 功能
- 指引問答模式：雙下拉勾選「主要指引文件」與「額外／補充指引文件」，向 AI 提問，取得嚴格依據文件內容、附精確引用出處（JSON citations）的回答。
- 支援 Word（.docx）、PDF、Markdown（.md）、純文字（.txt）文件，全部在瀏覽器端解析（`mammoth` / `pdfjs-dist`）。
- 使用者可直接上傳自己的文件（不需重新部署），也可在 repo 中預先放入「內建文件」供所有訪客使用。
- 指引文件模式：以章節瀏覽結構化的 Markdown 手冊（含圖片）。
- 對話歷史紀錄（存於瀏覽器 localStorage）、深色／淺色主題切換、每日免責聲明（以 Asia/Taipei 時區判斷）。
- 響應式介面：桌面雙欄佈局／手機單欄 + 抽屜 + 分頁切換。
- AI 供應商可切換：Google Gemini、OpenAI、Anthropic Claude，API Key 僅存於您瀏覽器的 localStorage，不會經過任何第三方伺服器。

## 本機開發

```bash
npm install
npm run dev
```

## 加入內建（預設）文件（選用）

如果您想讓所有訪客一開啟網站就有預設文件可用（不需自行上傳），將檔案放入對應資料夾：

```
public/instruction_files/        # 主要指引文件（.docx / .pdf / .md / .txt）
public/sub_instruction_files/    # 額外／補充指引文件
public/manual_md/<章節資料夾>/<章節>.md   # 手冊章節（可含同資料夾內的圖片，於 md 中以相對路徑引用）
```

接著執行（`npm run dev` 與 `npm run build` 都會自動執行這一步）：

```bash
npm run manifest
```

此指令會掃描上述資料夾並產生 `public/manifest.json`，前端會在啟動時讀取它並自動載入這些文件。
專案已內附一份範例主要指引文件與一個範例手冊章節，可直接刪除或替換。

> 若不需要內建文件，保持資料夾為空即可；使用者仍可在介面中自行上傳文件使用。

## 部署到 GitHub Pages

### 方式一：GitHub Actions（推薦，已內附設定檔）

1. 將本專案推送到您的 GitHub repository。
2. 到 repo 的 **Settings → Pages**，「Source」選擇 **GitHub Actions**。
3. 推送到 `main` 分支即會自動觸發 `.github/workflows/deploy.yml`，建置並部署到
   `https://<your-username>.github.io/<repo-name>/`。
   - 此 workflow 會自動將 `VITE_BASE_PATH` 設為 `/<repo-name>/`。
   - 若您是部署到使用者根網站（repo 名稱為 `<username>.github.io`），請將 workflow 中的
     `VITE_BASE_PATH` 改為 `/`，並同步修改 `vite.config.ts` 的預設值。

### 方式二：手動建置後推送 `dist/`

```bash
VITE_BASE_PATH=/your-repo-name/ npm run build
# 將 dist/ 內容推送到 gh-pages 分支，或於 Settings → Pages 指定 dist 為發布來源
```

## 使用者如何設定 API Key

1. 開啟網站後，點右上角「設定（齒輪圖示）」。
2. 選擇 AI 供應商（Gemini / OpenAI / Anthropic），貼上您自己的 API Key。
   - Gemini：https://aistudio.google.com/apikey
   - OpenAI：https://platform.openai.com/api-keys
   - Anthropic：https://console.anthropic.com/settings/keys
3. （選用）填入自訂模型名稱，留空則使用預設模型。
4. 儲存後即可在「指引問答」頁面提問。

> **注意**：Anthropic 的 Messages API 是否允許瀏覽器直接呼叫（CORS）依帳戶與網域設定而異，
> 若呼叫失敗，建議優先使用 Gemini 或 OpenAI，皆已在瀏覽器環境測試可正常運作。

## 專案結構

```
src/
  components/        # UI 元件（文件選擇器、回答/引用面板、設定、手冊瀏覽…）
  services/
    docParser.ts      # 瀏覽器端 docx/pdf/md/txt 解析
    aiService.ts       # 多供應商 AI 呼叫與 JSON citation 解析
    manifest.ts         # 讀取 public/manifest.json
    storage.ts            # localStorage 存取（設定/歷史/主題/免責聲明）
  types.ts
  App.tsx
scripts/
  generate-manifest.mjs   # 建置前掃描 public/ 內建文件並產生 manifest.json
public/
  instruction_files/、sub_instruction_files/、manual_md/   # 內建文件（選用）
```

## 資料隱私說明

所有文件解析皆於使用者瀏覽器本機完成，不會上傳到任何伺服器。使用者勾選文件之文字內容與提問內容，
只會直接傳送至使用者自行設定之 AI 供應商官方 API（並附帶使用者自己的 API Key），本專案本身不經手、不儲存任何內容。
