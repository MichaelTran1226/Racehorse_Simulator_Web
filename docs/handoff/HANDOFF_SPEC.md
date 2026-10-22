# HANDOFF SPEC — EquiFlow Simulator v3 → Antigravity

> **Dành cho agent làm tiếp v3** (làm tiếp game hiện có và các yêu cầu bổ sung của người dùng về sau).
> Đọc theo thứ tự: file này → `docs/handoff/ASSET_MANIFEST.json` → `CLAUDE.md` của v3 → `README.md`.
> Mọi lệnh chạy trong thư mục `Racehorse_Simulator_Web_v3/`. Ngày bàn giao: 21/10/2026.

**Goal:** giữ v3 chạy đúng và đẹp như hiện tại, làm tiếp các yêu cầu mới mà **không bao giờ tự vẽ thay sprite**.

**Architecture:** React 19 + Vite 8 + Canvas 2D. Bản đồ là ảnh ghép sẵn (`/assets/maps/...`) sinh từ `art/map/gen-layout.ts` qua Aseprite; nhân vật nền là sprite vẽ mỗi khung bằng `ctx.drawImage()`, toạ độ tính bằng hàm thuần trong `src/hub/`.

**Tech Stack:** TypeScript ~6.0 strict, `node --test` (Node 24 chạy thẳng `.ts`), Aseprite CLI `D:\Users\ASUS\Downloads\Programs\Aseprite-v1.3.18.6-Windows\aseprite.exe`. Không có lint; cổng chất lượng là typecheck + test + build + verify:map.

---

## 1. Context & Current State

### Đã hoàn thành (Claude, 21/10/2026)

v3 là bản **độc lập**, chép nguyên ứng dụng v2 (bỏ `.git`, `node_modules`, `dist`, `Stardrew Valley/`), rồi:

| Hạng mục | Kết quả | File chính |
|---|---|---|
| Bản đồ mới (bố cục theo ảnh tham khảo) | Đường xe hàng 3 ô xuyên ngang hàng 19–21 (y 304–352) qua cửa Kho; đường đua bầu dục thu nhỏ; Chuồng (Barn + mái che Stable) cách Kho 6 ô; Trạm Y tế; Nhà NV; sân huấn luyện đông bắc; 2 vườn cảnh phía tây; không có nước | `art/map/gen-layout.ts`, `art/map/autotile.ts` (`stadiumRing`) |
| Trạm Y tế đối xứng | Nửa trái phòng khám Harvey + lật gương. **Ngoại lệ người dùng duyệt, chỉ cho sprite này** | `art/aseprite/patch-clinic.lua` → `art/png/sv/sv-clinic.png` |
| Nhân vật & con vật | Toàn bộ nhân vật v2 + 6 con vật hoang (chim xanh, chim sẻ, thỏ, sóc) ở vườn tây + 9 chim đậu trên tán cây; gà/vịt ở vườn tây trên; xe điện chạy đường trên cùng; xe đẩy rơm làn riêng phía tây | `src/hub/ambientScene.ts`, `src/hub/ambient.ts`, `src/hub/paths.ts` |
| Màn chính | Mở ở giữa 4 công trình (`anchors.mainFocus`), kéo/zoom/quán tính như v2 | `src/ui/FarmMapCanvas.tsx` |
| Intro TMEC (4,2 s) | Mây Stardew 3 lớp → "TMEC" nảy → giãn thành "THIEN MA EQUESTRIAN CLUB" → mây tách 2 bên, màn chính 1.06→1; chạm/phím bỏ qua | `src/ui/IntroOverlay.tsx`, `IntroOverlay.module.css`, `introTimeline.ts` |

### File đầu ra đã dựng xong

| Loại | Đường dẫn | Sinh bởi |
|---|---|---|
| `.aseprite` bản đồ (6 layer: ground, paths, fences, buildings, decor, markers) | `art/aseprite/farm-day.aseprite` | `art/aseprite/build-farm-map.lua` |
| PNG nền bản đồ (mọi thứ trừ 4 công trình) | `public/assets/maps/farm-ground.png` (1280×768) | như trên |
| PNG 4 công trình bấm được | `public/assets/maps/objects/{barn,stable,vet,track}.png` | như trên |
| Xem trước toàn bản đồ | `art/preview/farm-day-x1.png` | như trên |
| Bố cục + anchors (dữ liệu runtime) | `art/map/farm-layout.json` | `node art/map/gen-layout.ts` |
| Dấu băm chống lệch | `art/map/farm-build-manifest.json` | `npm run stamp:map` |
| Sheet phòng khám vá | `art/png/sv/sv-clinic.png` | `art/aseprite/patch-clinic.lua` |
| Mây intro | `public/assets/clouds/*.png` | `art/aseprite/cut-clouds.lua` từ `art/png/sv/sv-clouds.png` |
| `.aseprite` sprite tự vẽ S01–S15 | `art/aseprite/s*.aseprite` | `art/gen/*.ts` + `art/aseprite/build-sheet.lua` (kế thừa v2) |
| Danh mục asset | `docs/handoff/ASSET_MANIFEST.json` (55 mục) | `node scripts/gen-asset-manifest.mjs` |

### Trạng thái kiểm tra lúc bàn giao

`npm run typecheck` sạch · `npm test` **92/92 pass** · `npm run build` xong (1 cảnh báo chunk > 500 kB) · `npm run verify:map` pass (18 sheet) · chạy thử trên trình duyệt desktop (`npm run dev` → http://localhost:5175).

### Chỗ cần biết

- `anchors` trong `art/map/farm-layout.json` (`FARM_ANCHORS`): `stableStalls`, `supplyDoor`, `houseDoor`, `clinicDoor`, `mainFocus`, `perches`. Code runtime chỉ đọc toạ độ công trình từ đây; **đổi bố cục thì đổi ở `gen-layout.ts`, không sửa tay JSON**.
- `_legacy-preview/` là bản mock HTML/CSS cũ của v3 — **chỉ để tham khảo, đừng dùng lại** (nó vẽ công trình bằng khối CSS, đúng thứ bị cấm bên dưới).
- `public/assets/concept/raw/*` là ảnh concept chỉ cho trang `/?dev`; **cấm dùng trên bản đồ hoặc trong game**.
- Cổng 5175 (v1/v2 dùng 5174). Chỉ làm cho **web desktop**.

---

## 2. Strict Visual Constraints (CỰC KỲ QUAN TRỌNG)

### 2.1 Bắt buộc

1. **Render bằng hình ảnh thật**: `<img>`, CSS `background-image: url(...)`, hoặc `ctx.drawImage()` — trỏ **trực tiếp** tới file có trong `ASSET_MANIFEST.json` (`filePath` bắt đầu bằng `/assets/`). File `art/...` chỉ dùng lúc dựng bản đồ, không tải ở runtime.
2. **Giữ nét pixel**: CSS `image-rendering: pixelated;` cho mọi ảnh sprite; Canvas `ctx.imageSmoothingEnabled = false;` ngay sau mỗi lần lấy context hoặc đổi kích thước canvas (xem `src/ui/FarmMapCanvas.tsx:130`, `src/ui/PixelCanvas.tsx`).
3. **Asset mới phải vào manifest**: thêm file → chạy `node scripts/gen-asset-manifest.mjs` → commit cả JSON.

### 2.2 TUYỆT ĐỐI CẤM (FORBIDDEN)

- Tự vẽ hình học thay sprite/công trình/địa hình/nhân vật bằng khối màu CSS (`background-color`, `border-radius`, `box-shadow`, gradient), SVG tự chế, ký tự (✿, ■…), hay `ctx.fillRect()` / `ctx.arc()` / path.
- Vẽ primitive, scale, xoay, sửa pixel, chèn chữ **vào ảnh bản đồ** (`verify:map` sẽ bắt). Biển tên là chữ HTML phủ lên trên.
- Dùng ảnh concept hoặc ảnh tham khảo làm asset.
- Thêm dependency khi chưa hỏi người dùng.

**Được phép (không phải giả lập sprite):** khung giao diện HUD/Popup theo token `src/ui/tokens.css`; lớp phủ toàn màn hình (đêm, flash); hiệu ứng hạt nhỏ (mưa, đom đóm); nền biểu đồ; nhãn chữ. Không chắc thuộc loại nào → **dừng và hỏi**.

### 2.3 Vi phạm đang tồn tại (kế thừa từ v2 — chưa sửa, xem Task A2–A3)

| Chỗ | Đang vẽ bằng | Mức |
|---|---|---|
| `src/render/scenes.ts` `drawTrack` (màn Đường đua): trời, cây, rào, cột mốc, cổng xuất phát, cờ đích | `rect()` → `ctx.fillRect` | **Vi phạm rõ** |
| `src/ui/VetZone.tsx:53–56` nền + gạch sàn phòng khám | `ctx.fillRect` | Vi phạm nhẹ |
| `src/ui/IntroOverlay.module.css` `.back` nền mây | `linear-gradient` | Vi phạm nhẹ (lớp đệm sau sprite mây) |

### 2.4 Quy tắc dự án vẫn giữ

- Mọi hiệu ứng có nhánh `prefers-reduced-motion` (chỉ còn mờ dần / đứng yên).
- Màu mới → token trong `src/ui/tokens.css`; chữ tiếng Việt có dấu dùng VT323; tiêu đề ASCII dùng Handjet.
- Logic thuần (không DOM) trong `src/hub/*`, `src/sim/*`, có `*.test.ts` cạnh file; test import kèm đuôi `.ts`.
- Sheet bản đồ chép **nguyên byte** từ `Racehorse_Simulator_Web_v2/Stardrew Valley/` (ngoại lệ duy nhất: `sv-clinic`). Sprite tự vẽ mới phải qua ảnh xem trước và **người dùng duyệt** trước khi vào `public/assets/`.
- Spec và code mâu thuẫn → dừng và hỏi, không tự chọn.

---

## 3. Implementation Tasks for Antigravity

Mỗi task: viết test hỏng trước → chạy thấy hỏng → sửa tối thiểu → chạy thấy qua → kiểm cuối (mục 4). Không gộp nhiều task vào một thay đổi.

### Nhóm A — Việc còn dở lúc bàn giao

#### Task A1: Kiểm nhánh giảm chuyển động

**Files:** đọc `src/ui/IntroOverlay.tsx`, `src/ui/IntroOverlay.module.css` (khối `@media (prefers-reduced-motion: reduce)`), `src/hub/ambientScene.ts`
**Assets:** `cloud.big`, `cloud.small2`, `cloud.small3`, `critter.critters`

- [ ] Bật giả lập trong DevTools (Rendering → `prefers-reduced-motion: reduce`), tải lại http://localhost:5175.
- [ ] Mong đợi: intro hiện sẵn tên đầy đủ, chỉ mờ dần lớp phủ sau ~1,6 s; không nảy/bay; nhân vật nền đứng yên.
- [ ] Nếu sai: viết test trong `src/ui/introTimeline.test.ts` cho mốc `INTRO.reducedFade` rồi mới sửa CSS. Ghi kết quả vào phần "Trạng thái" của file này.

#### Task A2: Bỏ nền gradient của lớp mây xa (dùng thuần sprite)

**Files:** sửa `src/ui/introTimeline.ts` (`cloudField("back")`), `src/ui/IntroOverlay.module.css` (`.back`); test `src/ui/introTimeline.test.ts`
**Assets:** `cloud.big` (492×336), `cloud.small2`, `cloud.small3`

- [ ] **Test trước:** thêm test "lớp back phủ kín nửa màn hình chỉ bằng sprite": lấy lưới điểm mẫu 20×20 trên nửa màn hình (1600×900, vmax = 1600), mỗi puff là hình chữ nhật `w vmax × w·336/492 vmax` tại (`x`%, `y`%); khẳng định mọi điểm nằm trong ít nhất một puff. Chạy `node --test src/ui/introTimeline.test.ts` → phải **hỏng** với lưới hiện tại.
- [ ] Tăng `rows`/`cols`/`w` của lớp `back` cho tới khi test qua.
- [ ] Xoá dòng `background: linear-gradient(...)` trong `.back`.
- [ ] Mở trình duyệt, tua tới ~1 s: không lộ bản đồ qua kẽ mây.

#### Task A3: Màn Đường đua đang vẽ bằng `fillRect` — **cần người dùng duyệt trước**

**Files:** `src/render/scenes.ts` (`drawTrack`, `drawStartGate`, đoạn cờ đích dòng ~194–200)
**Assets đề xuất (phải hỏi trước):** cây `sheet.sv-tree1-spring` / `sheet.sv-tree2-spring` / thông trong `sheet.sv-spring-outdoors` (crop 160,0,48,96); rào `sheet.sv-fence-wood`, `sheet.sv-fence-iron`; mặt sân `sheet.sv-flooring` (autotile đất 64,64)

- [ ] **Dừng và hỏi người dùng** trước khi code: (a) giữ nguyên màn đua vẽ tay; (b) thay từng phần bằng crop Stardew — cần chép crop ra `public/assets/race/` bằng script Aseprite chỉ-crop (giống `cut-clouds.lua`) và thêm vào manifest; (c) cách khác.
- [ ] Nếu chọn (b): mỗi phần (cây, rào, cổng, cờ) là một task riêng; test vẽ bằng canvas giả (`drawImage` được gọi với đúng `src`, `fillRect` không được gọi cho phần đó).

#### Task A4: Cảnh báo chunk > 500 kB khi build

**Files:** `vite.config.ts`, `src/hub/farmLayout.ts` (import `farm-layout.json`)

- [ ] So với v2: chạy `npm run build` trong `Racehorse_Simulator_Web_v2/`; nếu v2 cũng cảnh báo → ghi nhận, không sửa.
- [ ] Nếu chỉ v3 có: hỏi người dùng trước khi tách chunk (đổi cách nạp layout là đổi kiến trúc).

#### Task A5: Chim đậu nhỏ khó thấy khi nhìn xa

**Files:** `src/hub/ambientScene.ts` (`perchedBirds`, `PERCH_KINDS`), `art/map/gen-layout.ts` (`perchedTree`)
**Assets:** `critter.critters` (hàng 1 quạ, 2 sẻ, 4 chim xanh; khung 32×32)

- [ ] Hỏi người dùng muốn: thêm chim, thêm cử động (vỗ cánh: quạ bay hàng 2 cột 0–4, chim xanh bay hàng 5 cột 0–3), hay để nguyên. Không phóng to sprite.

### Nhóm B — Công thức cho yêu cầu mới (dùng làm khuôn)

#### Công thức B1: Thêm / dời đồ trên bản đồ (cây, rào, đèn, công trình)

**Files:** `art/map/gen-layout.ts`; test `src/hub/farmLayout.test.ts`
**Assets:** chỉ các `sheet.*` có `layer: "map-source-sheet"`

- [ ] Test trước nếu thêm ràng buộc mới (vd. "cây không đè đường xe hàng") trong `src/hub/farmLayout.test.ts`.
- [ ] Sửa `gen-layout.ts` (đơn vị ô 16 px; `stand(...)` đặt đáy sprite ở hàng; `tree/bush/decor/fenceH/fenceV`).
- [ ] Dựng lại:
  ```bash
  node art/map/gen-layout.ts
  "D:/Users/ASUS/Downloads/Programs/Aseprite-v1.3.18.6-Windows/aseprite.exe" -b --script-param root=. --script art/aseprite/build-farm-map.lua
  npm run stamp:map
  npm test
  npm run verify:map
  node scripts/gen-asset-manifest.mjs
  ```
- [ ] Đồ trang trí rời không được đè `RESERVED_CORRIDORS` hay khung công trình (`validateDecorCorridors`). Đồ thuộc công trình (vd. đèn cổng đường đua) thì đặt vào list của object đó.
- [ ] Đổi vị trí công trình → cập nhật `anchors` trong `gen-layout.ts` và các tuyến trong `src/hub/ambientScene.ts`/`paths.ts`.

#### Công thức B2: Thêm con vật / nhân vật nền

**Files:** `src/hub/ambientScene.ts` (id, đường đi, hàm tư thế thuần), `src/hub/ambient.ts` (danh sách vẽ), test `src/hub/ambientScene.test.ts`
**Assets:** `critter.*` (Stardew) hoặc `sprite.s06-people`, `sprite.s01-horse`, `sprite.s15-vehicles`

- [ ] Test trước: con mới nằm trên đường đi ở `t = 0, 3.7, 1e6`; khung thuộc tập khung hợp lệ; đứng yên khi `reducedMotion`; cập nhật test đếm `AMBIENT_ACTOR_IDS`.
- [ ] Thêm id vào `AmbientActorId` + `AMBIENT_ACTOR_IDS`, đường đi (toạ độ pixel thế giới 1280×768, đặt trên cỏ/đất, không đè công trình), nhánh tư thế.
- [ ] Con vật Stardew khác hướng mặt → dùng `flip` (bộ vẽ đã hỗ trợ). Sheet mới → thêm vào `CRITTER_URLS` trong `src/render/farmAssets.ts` (tự được nạp).
- [ ] Không thêm bò (quyết định của người dùng).

#### Công thức B3: Dùng thêm sheet Stardew mới

- [ ] Chép **nguyên byte** từ `Racehorse_Simulator_Web_v2/Stardrew Valley/<thư mục>/<file>.png` vào `art/png/sv/sv-<tên>.png` (bản đồ) hoặc `public/assets/sprites/sv/` (nhân vật).
- [ ] Bản đồ: thêm vào `SHEET_SIZES` (`src/hub/farmLayout.ts`), bảng `allowed` (`art/aseprite/build-farm-map.lua`), mảng `sheets` (`art/verify-farm-map.mjs`), sửa số đếm trong test `farmLayout.test.ts`.
- [ ] Thiếu trong bộ có sẵn → được tải từ https://www.spriters-resource.com/pc_computer/stardewvalley/ (người dùng cho phép), lưu vào `Stardrew Valley/` của v2 trước rồi mới chép.
- [ ] Chạy lại manifest.

#### Công thức B4: Sprite tự vẽ mới (S-sheet)

- [ ] Vẽ bằng code trong `art/gen/*.ts` → `art/aseprite/build-sheet.lua` → PNG xem trước trong `art/preview/`.
- [ ] **Gửi ảnh xem trước cho người dùng duyệt** trước khi chép vào `public/assets/sprites/`. Ô 32×32, sheet 6×6, chân y = 30.

#### Công thức B5: Chỉnh intro

**Files:** `src/ui/introTimeline.ts` (mốc thời gian, mây), `IntroOverlay.module.css`; test `src/ui/introTimeline.test.ts`

- [ ] Đổi mốc → sửa test kịch bản trước (`0–1.2 s / 1.2–2.8 s / 2.8–4.2 s`), rồi sửa hằng số; CSS nhận mốc qua biến `--*` nên không sửa số trong CSS.
- [ ] Chữ tiêu đề nổi 3D dùng gradient (người dùng yêu cầu; đã ghi ngoại lệ cho detector thiết kế).

---

## 4. Định nghĩa "xong" cho mọi task

```bash
npm run typecheck
npm test
npm run build
npm run verify:map            # khi đổi bản đồ
node scripts/gen-asset-manifest.mjs   # khi thêm/đổi asset
```

- [ ] Mở http://localhost:5175 (desktop), xem tận mắt phần vừa đổi, bật cả chế độ giảm chuyển động.
- [ ] `grep -rn "fillRect\|border-radius\|background-color" src` không có dòng mới nào giả lập sprite.
- [ ] Cập nhật mục "Trạng thái kiểm tra" ở đầu file này.
