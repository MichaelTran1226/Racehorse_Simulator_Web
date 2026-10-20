# Implementation Plan: Multi-Map System Architecture & Interactive Prototype

## Overview

Dự án nghiên cứu, thiết kế kiến trúc và xây dựng bản mẫu thử nghiệm cho hệ thống **Đa bản đồ (Multi-Map System — Phương án B)** trong thư mục `Map/` của `Racehorse_Simulator_Web`. Hệ thống bao gồm 1 Bản đồ Tổng quan (World Hub) và 3 Bản đồ Con chuyên biệt (Chuồng ngựa `Stall`, Trường đua `Track`, Phòng khám thú y `Vet`), đi kèm chuỗi điều hướng mượt mà (Camera Zoom → Fade → Transition → Back to Hub) và hoạt cảnh sprite sống động từ kho tài nguyên Stardew Valley đã tuyển chọn.

Toàn bộ quá trình thực hiện độc lập trong thư mục `Map/` và bảo đảm an toàn tuyệt đối, không gây ảnh hưởng hay xung đột với mã nguồn chính của dự án.

---

## Architecture Decisions

1. **Kiến trúc Không gian Lưới (Grid Matrix Standards):**
   - Đơn vị logic cơ bản: Lưới `32 × 32` px (tương đồng với `SPEC-sprite-farm-map.md` và các asset 16/32 px của Stardew Valley).
   - **World Hub:** Kích thước logic `1280 × 768` px (40 × 24 tiles), có camera kéo pan tự do, bao gồm các công trình ngoại thất: Chuồng nuôi, Bãi đua, Phòng khám, Nhà kho, Đồng cỏ chăn thả.
   - **Stall Interior (Sub-map 1):** Kích thước `960 × 640` px (30 × 20 tiles). Gồm 6 ô chuồng cá nhân (box stalls), máng ăn, lối đi rải rơm của groom, cửa chính nối ra sân farm.
   - **Race Track (Sub-map 2):** Kích thước `1600 × 960` px (50 × 30 tiles). Đường đua cát/đất hình oval, khán đài, vạch xuất phát, bãi chuẩn bị (Paddock) và cổng quay lại trang trại.
   - **Vet Clinic (Sub-map 3):** Kích thước `800 × 576` px (25 × 18 tiles). Phòng khám thú y vô trùng, bàn khám lâm sàng, tủ thuốc tiêm, khu lưu chuồng cách ly cho ngựa bị chấn thương (`RULE-MED-01`).

2. **Cơ chế Điều hướng & Máy trạng thái Chuyển cảnh (Transition State Machine):**
   - Vòng đời chuyển cảnh:
     `IDLE` → `HOVER_BUILDING` (hiển thị viền silhouette / prompt) → `CLICK_BUILDING` → `CAMERA_FOCUS_TWEEN` (lướt camera 400ms) → `FADE_OUT` (200ms) → `LOAD_SUBMAP` (hoán đổi context bản đồ) → `FADE_IN` (200ms) → `ACTIVE_SUBMAP`.
   - Cơ chế thoát về World Hub:
     Người dùng có 2 cách trực quan: (1) Nút điều hướng cố định trên HUD góc trên bên trái `[← Về Trang Trại]`, hoặc (2) Click trực tiếp vào ô sàn `Doorway/Exit Gate` dưới chân bản đồ.

3. **Pipeline Phân lớp Đồ họa (Layer Composition Pipeline):**
   - Mọi bản đồ được cấu tạo chuẩn từ 6 lớp (Layers):
     1. `ground`: Thảm cỏ, nền đất, sàn gỗ, gạch lát.
     2. `paths`: Lối đi, thảm rơm, viền đường đua.
     3. `fences_walls`: Hàng rào, vách tường, cửa chuồng.
     4. `buildings_fixtures`: Kết cấu kiến trúc, máng cỏ, tủ thuốc, khán đài.
     5. `actors_dynamic`: Ngựa (đứng/chạy/gặm cỏ), NPC (Groom, Bác sĩ, Kỵ thủ), Thú cưng, Hiệu ứng cảm xúc (Emotes).
     6. `decor_ambient`: Cây cối che phủ (có z-index xuyên qua), chim bướm bay lượn (`critters`), bóng râm.

4. **Độc lập Sandbox (`Map/` Isolation):**
   - Tất cả tài liệu, layout metadata, engine renderer demo được gói gọn trong thư mục `Map/`.
   - Tận dụng các sprite đã phân loại chuẩn trong thư mục `Stardrew Valley/`.
   - Không sửa đổi mã nguồn trong `src/` hoặc `art/` của dự án chính.

---

## Task List

### Phase 1: Kiến trúc & Đặc tả Quy trình

- [ ] **Task 1: Xây dựng Tài liệu Kiến trúc Hệ thống Đa Bản đồ (`Map/MAP_ARCHITECTURE.md`)**
  - **Mô tả:** Soạn thảo tài liệu thiết kế kỹ thuật hoàn chỉnh: ma trận không gian 4 bản đồ (kích thước, vị trí tọa độ, điểm spawn, hitboxes), máy trạng thái chuyển cảnh, thông số camera easing và giao thức HUD.
  - **Acceptance Criteria:**
    - Có bảng quy chuẩn kích thước, tile grid, bounding box cho cả 4 bản đồ.
    - Sơ đồ ASCII/Mermaid mô tả trọn vẹn luồng điều hướng 2 chiều (Hub ↔ Sub-maps).
    - Quy định rõ ràng điểm vào (Entry Point), điểm ra (Exit Gate) và cơ chế quay về.
  - **Verification:** Kiểm tra tài liệu hiển thị chuẩn định dạng Markdown, đường dẫn file `file://` hợp lệ.
  - **Files:** `Map/MAP_ARCHITECTURE.md`
  - **Scope:** Small (1 file)

- [ ] **Task 2: Xây dựng Cẩm nang Quy trình Tạo Map & Hoạt ảnh Sprite (`Map/MAP_PIPELINE_GUIDE.md`)**
  - **Mô tả:** Hướng dẫn chi tiết từng bước cho đội ngũ: cách cắt sprite từ `Stardrew Valley/`, cách sắp xếp layer không gian, thuật toán quản lý depth sort (`z-index = y`), công thức chu kỳ animation 7 frames của ngựa và thuật toán sinh chim/bướm bay ngẫu nhiên (`critters`).
  - **Acceptance Criteria:**
    - Có ví dụ mã code mẫu TypeScript/Canvas cho: (1) Cắt frame ngựa 32×32 theo hướng và hành vi, (2) Lọc sprite nhân sự (Groom, Vet), (3) Vẽ thảm cỏ và đường đi liền mạch.
    - Có bảng tra cứu tọa độ offset chính xác của các sprite then chốt trong thư mục `Stardrew Valley/`.
  - **Verification:** Các đoạn mã mẫu biên dịch sạch và khớp với kích thước tệp PNG thật trong `Stardrew Valley/`.
  - **Files:** `Map/MAP_PIPELINE_GUIDE.md`
  - **Scope:** Small (1 file)

### Checkpoint: Hoàn thiện Đặc tả & Kiến trúc
- [ ] Tài liệu kiến trúc và hướng dẫn quy trình được lập đầy đủ, rõ ràng.
- [ ] Các thông số kỹ thuật khớp chính xác 100% với tài nguyên sprite hiện có.

---

### Phase 2: Xây dựng Cấu trúc Dữ liệu Layout cho 4 Bản đồ

- [ ] **Task 3: Khởi tạo Dữ liệu Layout & Tọa độ Lưới 4 Bản đồ (`Map/layouts/`)**
  - **Mô tả:** Tạo các tệp dữ liệu cấu trúc (JSON/TypeScript) định nghĩa cấu trúc gạch nền, vật thể cố định, vùng va chạm, điểm xuất hiện nhân vật cho cả 4 bản đồ:
    1. `Map/layouts/world-hub.json`
    2. `Map/layouts/stall-interior.json`
    3. `Map/layouts/race-track.json`
    4. `Map/layouts/vet-clinic.json`
  - **Acceptance Criteria:**
    - Mỗi tệp layout có đầy đủ các trường: `world`, `layers` (`ground`, `paths`, `buildings`, `decor`), `triggers` (cổng chuyển cảnh), `spawnPoints`.
    - Dữ liệu tọa độ chuẩn hóa theo bước lưới 32 px, không bị tràn ra ngoài biên bản đồ.
  - **Verification:** Script kiểm tra tính hợp lệ dữ liệu (JSON Schema / validator) chạy đạt không báo lỗi.
  - **Files:**
    - `Map/layouts/types.ts`
    - `Map/layouts/world-hub.json`
    - `Map/layouts/stall-interior.json`
    - `Map/layouts/race-track.json`
    - `Map/layouts/vet-clinic.json`
  - **Scope:** Medium (5 files)

### Checkpoint: Dữ liệu Layout Hợp lệ
- [ ] Toàn bộ 4 tệp layout được khởi tạo đầy đủ và khớp với tài nguyên đồ họa.
- [ ] Tọa độ cổng dịch chuyển (triggers) giữa World Hub và các Sub-map đối ứng chuẩn xác.

---

### Phase 3: Xây dựng Bản mẫu Trực quan Tương tác (Interactive Canvas Prototype)

- [ ] **Task 4: Xây dựng Engine Bản đồ & Bộ điều hướng Chuyển cảnh Canvas (`Map/demo/`)**
  - **Mô tả:** Tạo bộ thử nghiệm chạy trực tiếp trên nền web độc lập trong `Map/demo/` (hoặc `Map/index.html` + standalone script), gồm Canvas 2D render vòng lặp, camera kéo thả pan/clamp mượt mà, bộ phát hiện click vào công trình, chuỗi hoạt ảnh tween camera và hiệu ứng fade chuyển đổi tức thì giữa World Hub và 3 Sub-maps.
  - **Acceptance Criteria:**
    - Kéo chuột/cảm ứng để di chuyển camera trên World Hub.
    - Click vào Chuồng ngựa / Trường đua / Phòng khám kích hoạt chuyển cảnh mượt mà vào Sub-map tương ứng.
    - Nút HUD "Về Trang Trại" hoặc bước vào cổng ra đưa camera trở lại đúng vị trí công trình trên World Hub.
    - Tốc độ khung hình duy trì ổn định 60 FPS, không rò rỉ bộ nhớ.
  - **Verification:** Mở trang demo trên trình duyệt, thực hiện liên tục chuỗi chuyển cảnh vào/ra cả 3 phân khu không gặp lỗi console.
  - **Files:**
    - `Map/demo/index.html`
    - `Map/demo/map-engine.js` (hoặc `.ts`)
    - `Map/demo/map-renderer.js`
  - **Scope:** Medium (3 files)

- [ ] **Task 5: Tích hợp Hoạt cảnh Sprite Động & Sinh vật Môi trường vào Bản mẫu**
  - **Mô tả:** Đưa các hoạt cảnh chuyển động thực tế vào bản demo:
    - Trên World Hub: Ngựa gặm cỏ trên bãi thả, bướm bay lượn ngẫu nhiên (`critters`), chó cưng chạy loanh quanh.
    - Trong Stall Interior: Ngựa vẫy đuôi trong ô chuồng, Groom Marnie đi lại kiểm tra máng cỏ.
    - Trong Race Track: Ngựa phi nước kiệu dọc đường đua với jockey.
    - Trong Vet Clinic: Ngựa nằm nghỉ dưỡng bệnh, bác sĩ thú y Harvey đứng cạnh bàn khám.
  - **Acceptance Criteria:**
    - Hoạt cảnh ngựa và nhân vật chuyển frame nhịp nhàng đúng tốc độ frame rate.
    - Sprite được vẽ theo đúng trật tự chiều sâu y-sort (vật ở dưới vẽ đè lên vật ở trên).
  - **Verification:** Quan sát trực quan trên bản demo: các nhân vật và ngựa cử động tự nhiên, không bị giật hình hoặc lỗi vẽ sai lớp.
  - **Files:**
    - `Map/demo/actors.js`
    - `Map/demo/ambient-critters.js`
  - **Scope:** Small (2 files)

### Checkpoint: Bản mẫu Trực quan Hoạt động Hoàn hảo
- [ ] Bản demo tương tác chạy mượt mà, đầy đủ 4 bản đồ, chuyển cảnh êm ái và hoạt cảnh sống động.
- [ ] Người dùng có thể kiểm nghiệm toàn diện trải nghiệm phương án B trực tiếp trên màn hình.

---

### Phase 4: Kiểm tra Độ cô lập & Nghiệm thu Không xung đột

- [ ] **Task 6: Kiểm tra Tính Biệt lập & Bảo toàn Mã nguồn Chính**
  - **Mô tả:** Chạy kiểm thử toàn bộ dự án chính (`npm run typecheck`, `npm run build`) để bảo đảm 100% các tệp mới trong `Map/` không gây lỗi biên dịch, không import chéo làm hỏng luồng code đang có.
  - **Acceptance Criteria:**
    - `npm run typecheck` đạt 0 lỗi (Exit Code 0).
    - `npm run build` tạo bundle thành công.
    - Git status chỉ ghi nhận các tệp mới nằm trọn vẹn trong `Map/` và các tài liệu kế hoạch.
  - **Verification:** Chạy lệnh `npm run typecheck && npm run build` thành công.
  - **Files:** Không chỉnh sửa file mã nguồn chính.
  - **Scope:** Small (Verification only)

---

## Risks and Mitigations

| Rủi ro kỹ thuật | Mức độ | Biện pháp giảm thiểu |
|---|---|---|
| Kích thước sprite Stardew Valley khác biệt so với logic grid cũ | Thấp | Toàn bộ tileset chuẩn hóa theo đơn vị lưới `32 × 32` px hoặc `16 × 16` px; engine demo hỗ trợ scale 1x/2x pixel-perfect. |
| Hiệu năng giật lag khi tải nhiều texture canvas lớn | Trung bình | Cơ chế Cache Texture & Offscreen Canvas: chỉ load ảnh một lần khi khởi tạo, cắt frame từ bộ nhớ đệm. |
| Chuyển cảnh bị nhấp nháy hoặc xô lệch vị trí camera | Thấp | Áp dụng chuỗi chuyển đổi chuẩn: Fade-to-black → Hoán đổi vị trí camera → Fade-in khi canvas đã sẵn sàng. |

---

## Open Questions

- *Giai đoạn sau (Post-Demo):* Khi bản mẫu trong `Map/` được duyệt hoàn toàn, nhóm có muốn thay thế hẳn `FarmHub.tsx` cũ bằng kiến trúc Đa bản đồ mới này không? (Sẽ được quyết định ở phiên làm việc tiếp theo sau khi bạn trải nghiệm demo).
