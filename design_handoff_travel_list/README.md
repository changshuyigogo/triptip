# Handoff：旅遊清單視覺化編輯器（Travel List Viewer & Editor）

## Overview
一個「可檢視 + 可編輯」的旅遊地點清單網站。使用者匯入一份地點資料（美食／咖啡甜點／景點／商店，含經緯度座標），以卡片清單為主、地圖為輔的方式瀏覽；並可搜尋、依分類／地區／來源篩選、排序。擁有者透過密碼解鎖後，可新增／修改／刪除地點、調整分類標籤、重新排序、切換多個清單，以及匯入 / 匯出 CSV·JSON。分享出去的其他人預設為「唯讀」，不能改動內容。

介面語言：**中文為主，店名保留原文（含韓文）**。字型需同時支援中／日／韓。

---

## About the Design Files
此包內的 `旅遊清單.dc.html` 是**用 HTML 製作的設計參考（prototype）**，目的在於呈現「最終外觀與互動行為」，**不是要直接複製進正式專案的程式碼**。

該檔案是一個「Design Component（DC）」格式：template（含 `{{ }}` 佔位符與 `<sc-for>` / `<sc-if>` 標籤）+ 一個 `class Component extends DCLogic` 邏輯類別，靠一個私有 runtime（`support.js`）渲染。**這個 runtime 不該被搬進你的專案。** 請把它當成「規格 + 可執行的視覺參考」。

你的任務：**在既有專案的技術環境中，用它現有的模式與元件庫重建這些設計**（若專案是 React／Vue／Svelte 等就用其慣例；若還沒有前端環境，就選一個最合適的框架來實作）。下方 README 已含足夠資訊，未參與本次對話的工程師也能據此完整實作。

---

## Fidelity
**High-fidelity（hifi）。** 顏色、字體、間距、圓角、陰影、互動皆為最終值，請盡量像素級還原，但改用你專案既有的元件與樣式系統（例如按鈕、輸入框、下拉選單、Dialog 用你們現成的）。

> 註：本專案原綁定 Whoscall 設計系統，但使用者明確要求改用「簡單、不嚴肅」的暖色系與圓潤字體，因此本設計**刻意不使用 Whoscall 的綠色品牌色與 Nunito**。請以下方 Design Tokens 為準，不要套回 Whoscall 綠。

---

## Screens / Views

本設計為**單一頁面應用**，由「頁首（Header）」+「主內容（清單 + 地圖）」+「新增／編輯彈窗（Modal）」構成。RWD：桌機為清單左、地圖右並排；視窗變窄時自動堆疊為清單在上、地圖在下。

### 1) Header（頁首，sticky 置頂）
- **Layout**：`position: sticky; top:0; z-index:40`，半透明白底 `rgba(255,255,255,0.92)` + `backdrop-filter: blur(8px)`，底部 `1px` 細線 `--border-subtle`。內容置中，`max-width:1440px`，左右 padding `clamp(14px,3vw,32px)`。垂直分兩列，`gap:12px`。
- **第一列（品牌 + 動作）**，`display:flex; align-items:center; gap:14px; flex-wrap:wrap`：
  - **Logo**：`38×38`、`border-radius:12px`、底色 `--ws-green`(#EC6A52)、置中一個白色 Material Symbol `travel_explore`（24px）、陰影 `0 3px 10px rgba(236,106,82,0.35)`。
  - **標題區**：清單名稱（`--font-display`，weight 900，`clamp(18px,2.4vw,24px)`，`letter-spacing:-0.02em`，單行省略）；其下一行灰字 `13px`（`--ws-dark-gray`）顯示地點數，例如「19 個地點」或篩選後「7 / 19 個地點」。
  - **彈性空白** `flex:1` 撐開。
  - **右側動作區**，`display:flex; gap:8px; flex-wrap:wrap`：
    - **清單切換下拉**（永遠可見，唯讀者也能切換檢視）：pill 樣式，`height:40px`，左內 `list` 圖示、右內 `expand_more` 圖示，邊框 `1.5px --ws-green`，底色 `--ws-green-mint`，文字 `--ws-forest`，`font-weight:800`，`max-width:200px`。
    - **鎖定狀態時**：顯示一顆「🔒 檢視中」按鈕（pill，白底，`1.5px --border-default` 邊框，`lock` 圖示 + 文字「檢視中」）。點擊 → 跳密碼輸入。
    - **解鎖狀態時**：顯示 4 個控制項 —「開鎖」圖示鈕（`lock_open`，40×40 圓形，點擊重新鎖定）、「編輯／完成」切換鈕（pill；未編輯時底色 `--ws-green-mint`、文字 `--ws-forest`、`edit` 圖示 +「編輯」；編輯中時底色 `--ws-forest`、白字、`check` 圖示 +「完成」）、「＋新增」鈕（pill，實心 `--ws-green` 底、白字，`add` 圖示，hover 變 `--ws-forest`，active `scale(0.96)`）、「⋯更多」鈕（40×40 圓形白底，`more_horiz`）。
    - **⋯更多選單**（點擊展開的下拉，`position:absolute; right:0; top:48px; width:230px`，白底、圓角 16px、陰影 `--shadow-pop`，入場動畫 `pop` 0.16s）。每項為左對齊列，`gap:10px`，圖示（`--ws-forest`）+ 文字：`playlist_add` 新增空白清單、`edit_note` 重新命名此清單、（分隔線）、`upload_file` 匯入 CSV（新清單）、`download` 匯出 CSV、`data_object` 匯出 JSON、（分隔線）、`delete` 刪除此清單（紅字 `--ws-red`，hover 淡紅底）。
- **第二列（搜尋 + 篩選）**，`display:flex; align-items:center; gap:10px; flex-wrap:wrap`：
  - **搜尋框**：`flex:1 1 220px; max-width:360px`。`height:42px`，pill（`border-radius:999px`），`1.5px --border-default` 邊框，左內 `search` 圖示（20px，灰）。placeholder：「搜尋店名、說明、地址…」。即時過濾（比對 名稱 + 說明 + 韓文地址 + 類別）。
  - **大分類 chips**：一排按鈕，`gap:7px; flex-wrap:wrap`。每顆 `height:38px`，pill，`font-weight:800`，`13.5px`，左側 Material Symbol + 標籤 + 一個半透明數字（該分類數量）。共 5 顆：`全部`(icon `apps`)、`美食`(`restaurant`)、`咖啡甜點`(`local_cafe`)、`景點`(`photo_camera`)、`商店`(`shopping_bag`)。**未選中**：白底、`--ws-cool-dark` 文字、`1.5px --border-default`。**選中**：底色與文字用該分類的主色（見 Design Tokens 分類色）— 選中「全部」時用主色 `#EC6A52` 實心白字；選中某分類時用該分類主色實心白字，邊框同主色。
  - **彈性空白** `flex:1`。
  - **4 個下拉選單**（pill 樣式，見 Components 通用下拉規格）：地區（`全部地區`＋資料中出現過的地區）、類別（`全部類別`＋出現過的細類別）、來源（`全部來源`＋出現過的來源）、排序（`清單順序` manual / `依名稱` / `依地區` / `依類別`）。

### 2) 主內容（清單 + 地圖）
- **容器** `<main>`：`max-width:1440px; margin:0 auto; padding:clamp(14px,2.5vw,28px); display:flex; flex-wrap:wrap; gap:22px; align-items:flex-start`。
- **左：清單欄** `<section>`：`flex:1 1 440px; min-width:300px; display:flex; flex-direction:column; gap:14px`。
- **右：地圖欄** `<aside>`：`flex:1 1 360px; min-width:280px; position:sticky; top:150px; align-self:flex-start`。窄螢幕時自動換行到清單下方。

#### 2a) 地點卡片（Card）
- 容器 `<article>`：白底，`border-radius:18px`，`1.5px` 邊框（預設 `--border-subtle`），陰影 `--shadow-card`，padding `16px 18px`，`position:relative; overflow:hidden`，`cursor:pointer`。**hover**：邊框變 `--ws-green`。點卡片 → 地圖平移並打開該點 popup（見 Interactions）。
- **左側彩色條**：`position:absolute; left:0; top:0; bottom:0; width:5px`，底色 = 該地點大分類主色。
- **頂列標籤**（`gap:8px; flex-wrap:wrap; margin-bottom:5px`）：
  - **分類 pill**：`padding:3px 10px`，pill，底色 = 分類 `bg`、文字 = 分類 `fg`（見 tokens），`font-weight:800`，`12px`，左側對應圖示。
  - **細類別 pill**（若有）：底色 `--ws-cool-gray`、文字 `--ws-cool-dark`、`12px`。
  - **地區**（若有）：`place` 圖示 + 文字，灰色 `--ws-dark-gray`，`12px`。
- **主名稱**：`--font-display`，weight 800，`18px`，`line-height:1.25`，`--ws-black`，`word-break:break-word`。
- **副名稱**（原文／韓文，若有）：`13.5px`，weight 700，`--ws-forest`。名稱以「主名 (副名)」或「主名（副名）」格式書寫時，程式自動把括號內文字拆成副名。
- **編輯控制（僅編輯模式顯示）**：卡片右上一直排小按鈕（`flex-direction:column; gap:4px`）：`edit`（34×34，圓角 9px）、`delete`（紅字）、`arrow_upward`、`arrow_downward`（各 34×26；**僅在排序=清單順序且未套用任何篩選/搜尋時**顯示）。這些按鈕的點擊需 `stopPropagation`，避免觸發卡片本身的地圖平移。
- **說明**（若有）：`margin-top:9px`，`14.5px`，`line-height:1.55`，`--ws-cool-dark`，`white-space:pre-line`（保留換行）。
- **底列動作**（`margin-top:11px; gap:8px; flex-wrap:wrap`，容器需 `stopPropagation`）：
  - **複製韓文地址鈕**（若有韓文地址）：`content_copy` 圖示 + 地址文字（過長省略），底 `--ws-cool-gray`，`12.5px`。點擊複製到剪貼簿，並暫時把文字改成「已複製 ✓」1.2 秒。
  - **地圖導航**：連結，底 `--ws-green-mint`、文字 `--ws-forest`，`near_me` 圖示。連到 `https://www.google.com/maps/search/?api=1&query=<韓文地址｜或 lat,lng｜或主名>`，開新分頁。
  - **來源連結**（若來源是 http/https 網址）：`link` 圖示，藍字 `--ws-blue`(#1AA5EC)，開新分頁。
  - **來源文字**（若來源不是網址）：`sell` 圖示 + 文字，灰色。

#### 2b) 地圖（Map）
- 用 **Leaflet 1.9.4**；底圖 tiles = CARTO Voyager（`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`，maxZoom 19，需標註 © OpenStreetMap © CARTO）。你們專案若已有地圖方案（Google Maps / Mapbox / Leaflet）沿用即可。
- 容器：`width:100%; height:clamp(340px, calc(100vh - 190px), 860px)`，`border-radius:20px`，`1px --border-subtle` 邊框，陰影 `--shadow-card`。
- **Markers**：只為「有座標」的地點畫點。用 `circleMarker`：`radius:8`，白色外框 `weight:3 color:#fff`，`fillColor` = 該地點分類主色，`fillOpacity:1`。popup 內容：粗體主名 + （副名，`--ws-forest` 12px）+（細類別，灰 12px）。
- Markers 集合改變時（篩選/搜尋/切清單）重繪；初次載入 `fitBounds` 到所有點。
- 地圖下方**圖例**：4 個圓點 + 文字（美食 `#EC6A52`、咖啡甜點 `#D99A2B`、景點 `#2FAE9A`、商店 `#7E8AD6`），`12px` weight 700 灰字。

### 3) 新增／編輯彈窗（Modal）
- **遮罩**：`position:fixed; inset:0; z-index:80; background:rgba(0,0,0,0.5)`，flex 置中，`padding:16px`。點遮罩關閉。
- **面板**：白底，`max-width:560px; width:100%`，`max-height:92vh; overflow:auto`，`border-radius:24px`，padding `22px clamp(16px,4vw,28px) 26px`，陰影 `--shadow-pop`，入場動畫 `pop` 0.2s。內容需 `stopPropagation`。
- **標題列**：左標題（`--font-display` 900，22px；「新增地點」或「編輯地點」）；右 `close` 圓鈕（38×38，底 `--ws-cool-gray`）。
- **欄位**（每欄一個 label：小寫金屬灰 ALL-CAPS 樣式的欄名 `--font-display` weight 800 `12px letter-spacing:0.04em text-transform:uppercase --ws-dark-gray` + 控制項；控制項高 46px、圓角 12px、`1.5px --border-default`）：
  1. **名稱（可含韓文）** — text，placeholder「例如：嚴湧帛豬肉湯飯 (엄용백돼지국밥)」。必填。
  2. 一列三欄（`flex-wrap`）：**大分類**（select：美食／咖啡甜點／景點／商店）、**類別標籤**（text）、**地區**（text）。
  3. **說明 / 推薦重點** — textarea，4 列，可垂直縮放。
  4. **韓文地址** — text，placeholder「부산 해운대구…」。
  5. 一列三欄：**來源**（text）、**緯度 lat**（text/decimal，等寬字型）、**經度 lng**（text/decimal，等寬字型）。
  6. 提示小字：「留白也沒關係，有座標才會顯示在地圖上。」
- **底部按鈕列**：「取消」（白底外框）+「儲存變更／加入清單」（實心 `--ws-green` 底白字，`flex:1`，50px 高，圓角 14px）。名稱空白時擋下並提示「請至少輸入名稱」。

### 通用下拉選單（Select）規格
所有篩選下拉：`appearance:none`，`height:40px`，pill（`border-radius:999px`），`padding:0 38px 0 16px`，白底，`1.5px --border-default`，`font-weight:700`，`13.5px`，`--ws-cool-dark` 文字。右側自訂 `chevron` 箭頭（灰 `#948A7E` 的向下 V 形 SVG，`background-position:right 14px center`）。

---

## Interactions & Behavior
- **搜尋**：即時（onInput）過濾，比對 名稱＋說明＋韓文地址＋類別（小寫、includes）。
- **分類 chip / 篩選下拉**：切換即套用；多條件為「AND」交集。「排序」有 4 種：清單順序（手動）、名稱、地區、類別（後三者用 `localeCompare(..., 'zh-Hant')`）。
- **卡片點擊**：把地圖 `setView` 到該點（zoom 至少 15，animate），並 `openPopup()`。若該點無座標則無動作。
- **編輯模式**（需先解鎖）：切換後卡片右上出現 編輯／刪除／上下移；再按「完成」關閉。
- **上下移**：只在「排序=清單順序且無任何篩選/搜尋」時可用，對「當前清單的完整順序」做相鄰交換。
- **刪除**：`confirm('確定刪除「<主名>」？')` 後移除。
- **新增/編輯**：開 Modal；儲存時把 lat/lng 空字串轉為 null，寫回當前清單；重繪 markers。
- **複製地址**：`navigator.clipboard.writeText`，失敗時退回 `execCommand('copy')`；按鈕文字暫顯「已複製 ✓」。
- **清單管理**：新增空白清單（prompt 名稱）、重新命名（prompt）、刪除（至少保留 1 個，confirm）。切換清單後重繪並重新 `fitBounds`。
- **匯入 CSV**：讀檔 → 解析 → 建立新清單（清單名 = 檔名）。欄位以標頭關鍵字模糊對應（WKT／名稱／類別／地區／地址(中文)／韓文／說明／來源）；WKT 形如 `POINT (lng lat)`。
- **匯出**：CSV（含 BOM，UTF-8，欄位順序：WKT,名稱,類別,地區,地址 (中文),韓文地址,說明,來源；WKT 由 lat/lng 反推）或整個清單 JSON。
- **動畫/緩動**：Modal/選單入場 `pop`（`opacity 0→1 + scale .96→1`）；卡片 hover 邊框色 0.16s；按鈕 active `scale(0.96~0.99)`；緩動 `--ease-emphasized: cubic-bezier(0.22,1,0.36,1)`。
- **RWD**：主內容 flex-wrap，窄螢幕清單在上、地圖在下；header 各列 flex-wrap。

### 編輯權限鎖（重點需求：只有擁有者能改，別人只能看）
- 預設**鎖定（唯讀）**：隱藏 編輯／新增／⋯更多 與卡片內編輯控制；保留 檢視／搜尋／篩選／導航／複製。
- 點「🔒 檢視中」→ `prompt` 輸入密碼；正確 → 解鎖，並把解鎖狀態記在 `localStorage`（key `travel_unlock` = 密碼），之後同一瀏覽器自動維持解鎖；錯誤 → 提示「密碼錯誤」。
- 「開鎖」圖示鈕 → 重新鎖定（清 `localStorage` 旗標、關編輯模式）。
- 密碼是一個可設定的參數（此原型預設 `1234`，透過設定面板可改）。
- ⚠️ **這是純前端的「輕量存取控制」，非真正安全機制**。在你們的正式環境，請以真正的身分驗證 / 後端權限來實作「擁有者可編輯、他人唯讀」（例如：登入 + 該清單 owner 才有寫入 API 權限；未登入/非 owner 只給讀取）。

---

## State Management
需要的狀態：
- `lists`：清單陣列，每個 `{ id, name, items: Item[] }`。
- `activeListId`：目前清單 id。
- 篩選狀態：`search`、`typeFilter`（'全部'或分類）、`categoryFilter`、`areaFilter`、`sourceFilter`（皆 '全部' 為不篩）、`sort`（manual/name/area/category）。
- `editMode`（bool）、`showMenu`（⋯選單）、`showForm`（Modal）、`editingId`（null=新增）、`form`（表單欄位）。
- `unlocked`（bool，權限）。
- **持久化**：原型把 `{lists, activeListId}` 存 `localStorage`（key `travel_lists_v1`），解鎖旗標存 `travel_unlock`。**在正式專案請改為後端資料庫**（使用者稍早表示「我有資料庫」）：清單與地點為主要資料表，CSV 匯入/匯出作為與其資料庫互通的橋樑。

### 資料模型 Item
```ts
type Item = {
  id: string;
  name: string;        // 「主名 (副名/韓文)」；副名用括號自動拆出僅為顯示
  type: '美食' | '咖啡甜點' | '景點' | '商店';  // 大分類
  category: string;    // 細類別標籤，可自由填（豬肉湯飯、咖啡…）
  area: string;        // 地區（海雲台、松亭…）
  addrZh: string;      // 中文地址（可空）
  addrKr: string;      // 韓文地址（導航/複製用）
  desc: string;        // 說明/推薦重點（可含換行）
  source: string;      // 來源：人名/IG/或 http(s) 網址
  lat: number | null;  // 緯度
  lng: number | null;  // 經度
};
```

---

## Design Tokens

### Colors
```
主色 / 品牌     --ws-green      #EC6A52   (珊瑚橘，按鈕、logo、選中態、hover marker)
深主色          --ws-forest     #C4482E   (--ws-green-dark 同值；深文字/連結/圖示)
主色淡底        --ws-green-mint #FBE7E0   (chip 選中前的軟底、hover 底、導航鈕底)
主色更淡        --ws-green-light#F6D6CB   (導航鈕 hover)
主要文字        --ws-black      #3B3733   (暖黑)
次要文字        --ws-cool-dark  #5F574F
輔助/提示文字   --ws-dark-gray  #9A8F82
中性表面        --ws-cool-gray  #F3ECE2   (細類別 pill 底、複製鈕底)
畫布背景        --ws-light-blue #FBF6EF   (body 背景，暖奶油)
危險/刪除       --ws-red        #DB5A54
連結藍          --ws-blue       #1AA5EC   (來源網址連結)
邊框(淡)        --border-subtle  rgba(59,55,51,0.08)
邊框(預設)      --border-default rgba(59,55,51,0.17)
卡片白底                        #FFFFFF
```

### 四個大分類色（marker / chip / 卡片標籤 / 左側條）
```
美食      主色 #EC6A52   底 #FBE3DC   文字 #B23E29   icon restaurant
咖啡甜點  主色 #D99A2B   底 #F7EACF   文字 #8A5E12   icon local_cafe
景點      主色 #2FAE9A   底 #D6F0EA   文字 #1B6E61   icon photo_camera
商店      主色 #7E8AD6   底 #E6E8F8   文字 #464F9E   icon shopping_bag
```

### Typography
- **Display / 標題 / UI 標籤**：`--font-display` = `'Baloo 2', 'Noto Sans TC', 'Noto Sans JP', 'Noto Sans KR', system-ui, sans-serif`。權重常用 700 / 800 / 900（Baloo 2 上限 800，900 自動退回）。
- **Body / 內文**：`--font-body` = `'Quicksand', 'Noto Sans TC', 'Noto Sans JP', 'Noto Sans KR', system-ui, sans-serif`。權重常用 600 / 700。
- 等寬（座標欄）：`ui-monospace, 'SF Mono', Menlo, Consolas, monospace`。
- 字級（px）：12（標籤/pill/圖例）、12.5（動作鈕）、13 / 13.5（副名/下拉/次要）、14.5（說明）、15（表單輸入）、18（卡片主名）、20（空狀態標題）、22（Modal 標題）、`clamp(18px,2.4vw,24px)`（頁首清單名）。
- CJK 覆蓋：中文 Noto Sans TC、日文 Noto Sans JP、韓文 Noto Sans KR。Latin 用 Baloo 2 / Quicksand。字型從 Google Fonts 載入。

### Radius
```
9px    卡片內小按鈕
10px   動作鈕（複製/導航/來源）
12px   logo 方塊、表單控制項
14px   Modal 底部主按鈕
16px   ⋯選單
18px   地點卡片
20px   地圖容器
24px   Modal 面板、空狀態框
999px  所有 pill / chip / 下拉 / 搜尋框 / 圓鈕
5px    卡片左側彩色條寬
```

### Shadow
```
--shadow-card  0 4px 20px rgba(59,55,51,0.08)
--shadow-pop   0 16px 44px rgba(59,55,51,0.18)
logo           0 3px 10px rgba(236,106,82,0.35)
```

### Spacing
4px 基準；常見 gap：4 / 7 / 8 / 10 / 12 / 14 / 22px。頁面內距 `clamp(14px,2.5vw,28px)`。

---

## Assets
- **圖示**：Material Symbols Rounded（Google Fonts CDN）。用到：`travel_explore, list, expand_more, lock, lock_open, edit, check, add, more_horiz, playlist_add, edit_note, upload_file, download, data_object, delete, search, apps, restaurant, local_cafe, photo_camera, shopping_bag, place, near_me, content_copy, link, sell, close, map, arrow_upward, arrow_downward`。請替換成你們專案既有的 icon 集（對應語意即可）。
- **字型**：Baloo 2、Quicksand、Noto Sans TC/JP/KR（Google Fonts）。
- **地圖**：Leaflet + CARTO Voyager tiles（可換成你們既有地圖方案）。
- 無自繪 SVG 品牌素材；logo 為「珊瑚橘方塊 + travel_explore 圖示」的組合，可自由替換成你們的品牌標記。

---

## Files
- `旅遊清單.dc.html` — 完整設計參考（template + 邏輯 class）。可用瀏覽器直接開啟預覽外觀與互動（注意：需搭配其私有 runtime 才能執行，僅供參考，勿移植 runtime）。
- `2026 Jul 釜山海雲台西面- 海雲台餐廳.csv` — 範例來源資料（原始 Excel 匯出），示範欄位格式與 CSV 匯入對應。

---

## 實作建議（給 Claude Code）
1. 沿用專案既有的 UI 元件（Button / Input / Select / Dialog / Card）與 icon、字型載入方式，用上方 tokens 對齊視覺。
2. 資料改走後端：清單 + 地點資料表；CSV 匯入/匯出作為與資料庫互通。權限用真正的登入 + owner 判斷取代前端密碼鎖（擁有者可寫、他人唯讀）。
3. 地圖沿用專案既有方案；markers 依大分類上色，點卡片聯動地圖。
4. 保持「清單為主、地圖為輔、RWD 自動堆疊」的版面，以及中文介面 + 店名保留原文的原則。
