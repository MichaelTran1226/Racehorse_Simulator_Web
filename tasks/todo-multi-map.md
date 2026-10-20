# Multi-Map System & Interactive Prototype Tasks

## Phase 1: Kiến trúc & Đặc tả Quy trình

- [x] **Task 1: Xây dựng Tài liệu Kiến trúc Hệ thống Đa Bản đồ (`Map/MAP_ARCHITECTURE.md`)**
  - **Mô tả:** Soạn thảo tài liệu thiết kế kỹ thuật hoàn chỉnh: ma trận không gian 4 bản đồ (kích thước, vị trí tọa độ, điểm spawn, hitboxes), máy trạng thái chuyển cảnh, thông số camera easing và giao thức HUD.
  - **Acceptance criteria:**
    - [x] Có bảng quy chuẩn kích thước, tile grid, bounding box cho cả 4 bản đồ.
    - [x] Sơ đồ ASCII/Mermaid mô tả trọn vẹn luồng điều hướng 2 chiều (Hub ↔ Sub-maps).
    - [x] Quy định rõ ràng điểm vào (Entry Point), điểm ra (Exit Gate) và cơ chế quay về.
  - **Verification:**
    - [x] Markdown format kiểm tra đạt chuẩn, đường dẫn tệp `file://` chính xác.
  - **Dependencies:** None
  - **Files:** `Map/MAP_ARCHITECTURE.md`
  - **Scope:** Small (1 file)

- [x] **Task 2: Xây dựng Cẩm nang Quy trình Tạo Map & Hoạt ảnh Sprite (`Map/MAP_PIPELINE_GUIDE.md`)**
  - **Mô tả:** Hướng dẫn chi tiết từng bước cho đội ngũ: cách cắt sprite từ `Stardrew Valley/`, cách sắp xếp layer không gian, thuật toán quản lý depth sort (`z-index = y`), công thức chu kỳ animation 7 frames của ngựa và thuật toán sinh chim/bướm bay ngẫu nhiên (`critters`).
  - **Acceptance criteria:**
    - [x] Có ví dụ mã code mẫu cho: (1) Cắt frame ngựa 32×32 theo hướng và hành vi, (2) Lọc sprite nhân sự (Groom, Vet), (3) Vẽ thảm cỏ và đường đi liền mạch.
    - [x] Có bảng tra cứu tọa độ offset chính xác của các sprite then chốt trong thư mục `Stardrew Valley/`.
  - **Verification:**
    - [x] Các đoạn mã mẫu biên dịch sạch và khớp với kích thước tệp PNG thật trong `Stardrew Valley/`.
  - **Dependencies:** Task 1
  - **Files:** `Map/MAP_PIPELINE_GUIDE.md`
  - **Scope:** Small (1 file)

## Checkpoint: Hoàn thiện Đặc tả & Kiến trúc
- [x] Tài liệu kiến trúc và hướng dẫn quy trình được lập đầy đủ, rõ ràng.
- [x] Các thông số kỹ thuật khớp chính xác 100% với tài nguyên sprite hiện có.

---

## Phase 2: Xây dựng Cấu trúc Dữ liệu Layout cho 4 Bản đồ

- [x] **Task 3: Khởi tạo Dữ liệu Layout & Tọa độ Lưới 4 Bản đồ (`Map/layouts/`)**
  - **Mô tả:** Tạo các tệp dữ liệu cấu trúc (JSON/TypeScript) định nghĩa cấu trúc gạch nền, vật thể cố định, vùng va chạm, điểm xuất hiện nhân vật cho cả 4 bản đồ (`world-hub.json`, `stall-interior.json`, `race-track.json`, `vet-clinic.json`).
  - **Acceptance criteria:**
    - [x] Mỗi tệp layout có đầy đủ các trường: `world`, `layers` (`ground`, `paths`, `buildings`, `decor`), `triggers` (cổng chuyển cảnh), `spawnPoints`.
    - [x] Dữ liệu tọa độ chuẩn hóa theo bước lưới 32 px, không bị tràn ra ngoài biên bản đồ.
  - **Verification:**
    - [x] Script kiểm tra tính hợp lệ dữ liệu (JSON Schema / validator) chạy đạt không báo lỗi.
  - **Dependencies:** Task 1, Task 2
  - **Files:**
    - `Map/layouts/types.ts`
    - `Map/layouts/world-hub.json`
    - `Map/layouts/stall-interior.json`
    - `Map/layouts/race-track.json`
    - `Map/layouts/vet-clinic.json`
  - **Scope:** Medium (5 files)

## Checkpoint: Dữ liệu Layout Hợp lệ
- [x] Toàn bộ 4 tệp layout được khởi tạo đầy đủ và khớp với tài nguyên đồ họa.
- [x] Tọa độ cổng dịch chuyển (triggers) giữa World Hub và các Sub-map đối ứng chuẩn xác.

---

## Phase 3: Xây dựng Bản mẫu Trực quan Tương tác (Interactive Canvas Prototype)

- [x] **Task 4: Xây dựng Engine Bản đồ & Bộ điều hướng Chuyển cảnh Canvas (`Map/demo/`)**
  - **Mô tả:** Tạo bộ thử nghiệm chạy trực tiếp trên nền web độc lập trong `Map/demo/`, gồm Canvas 2D render vòng lặp, camera kéo thả pan/clamp mượt mà, bộ phát hiện click vào công trình, chuỗi hoạt ảnh tween camera và hiệu ứng fade chuyển đổi tức thì giữa World Hub và 3 Sub-maps.
  - **Acceptance criteria:**
    - [x] Kéo chuột/cảm ứng để di chuyển camera trên World Hub.
    - [x] Click vào Chuồng ngựa / Trường đua / Phòng khám kích hoạt chuyển cảnh mượt mà vào Sub-map tương ứng.
    - [x] Nút HUD "Về Trang Trại" hoặc bước vào cổng ra đưa camera trở lại đúng vị trí công trình trên World Hub.
    - [x] Tốc độ khung hình duy trì ổn định 60 FPS, không rò rỉ bộ nhớ.
  - **Verification:**
    - [x] Mở trang demo trên trình duyệt, thực hiện liên tục chuỗi chuyển cảnh vào/ra cả 3 phân khu không gặp lỗi console.
  - **Dependencies:** Task 3
  - **Files:**
    - `Map/demo/index.html`
    - `Map/demo/map-engine.js`
    - `Map/demo/map-data.js`
  - **Scope:** Medium (3 files)

- [x] **Task 5: Tích hợp Hoạt cảnh Sprite Động & Sinh vật Môi trường vào Bản mẫu**
  - **Mô tả:** Đưa các hoạt cảnh chuyển động thực tế vào bản demo: ngựa gặm cỏ trên bãi thả, bướm bay lượn ngẫu nhiên (`critters`), chó cưng chạy loanh quanh, ngựa vẫy đuôi trong ô chuồng, Groom Marnie đi lại kiểm tra máng cỏ, ngựa phi nước kiệu dọc đường đua với jockey, ngựa nằm nghỉ dưỡng bệnh, bác sĩ thú y Harvey đứng cạnh bàn khám.
  - **Acceptance criteria:**
    - [x] Hoạt cảnh ngựa và nhân vật chuyển frame nhịp nhàng đúng tốc độ frame rate.
    - [x] Sprite được vẽ theo đúng trật tự chiều sâu y-sort (vật ở dưới vẽ đè lên vật ở trên).
  - **Verification:**
    - [x] Quan sát trực quan trên bản demo: các nhân vật và ngựa cử động tự nhiên, không bị giật hình hoặc lỗi vẽ sai lớp.
  - **Dependencies:** Task 4
  - **Files:**
    - `Map/demo/map-engine.js`
  - **Scope:** Small (1 file)

## Checkpoint: Bản mẫu Trực quan Hoạt động Hoàn hảo
- [x] Bản demo tương tác chạy mượt mà, đầy đủ 4 bản đồ, chuyển cảnh êm ái và hoạt cảnh sống động.
- [x] Người dùng có thể kiểm nghiệm toàn diện trải nghiệm phương án B trực tiếp trên màn hình.

---

## Phase 4: Kiểm tra Độ cô lập & Nghiệm thu Không xung đột

- [x] **Task 6: Kiểm tra Tính Biệt lập & Bảo toàn Mã nguồn Chính**
  - **Mô tả:** Chạy kiểm thử toàn bộ dự án chính (`npm run typecheck`, `npm run build`, `npm test`) để bảo đảm 100% các tệp mới trong `Map/` không gây lỗi biên dịch, không import chéo làm hỏng luồng code đang có.
  - **Acceptance criteria:**
    - [x] `npm run typecheck` đạt 0 lỗi (Exit Code 0).
    - [x] `npm run build` tạo bundle thành công.
    - [x] 64/64 bài kiểm thử `npm test` đều xanh.
    - [x] Git status chỉ ghi nhận các tệp mới nằm trọn vẹn trong `Map/` và các tài liệu kế hoạch.
  - **Verification:**
    - [x] Chạy lệnh `npm run typecheck && npm run build && npm test` thành công.
  - **Dependencies:** Task 1, 2, 3, 4, 5
  - **Files:** None (Verification only)
  - **Scope:** Small (Verification only)

## Phase 5: Tái tạo Đồ họa Bản đồ Bằng Aseprite Compositor (100% Asset Stardew Valley Nguyên Bản)

- [x] **Task 7: Viết Script Aseprite Lua Compositor (`Map/scripts/composite-aseprite.lua`)**
  - **Mô tả:** Sử dụng trực tiếp Aseprite CLI (`D:\Users\ASUS\Downloads\Programs\Aseprite-v1.3.18.6-Windows\aseprite.exe`) để ghép (composite) 4 bản đồ từ các tileset và sprite trong `Stardrew Valley/`.
  - **Acceptance criteria:**
    - [x] Nền cỏ mùa xuân mượt mà từ `spring_outdoorsTileSheet.png` (không dùng fillRect màu phẳng).
    - [x] Công trình chuồng ngựa thật từ `Stable.png`, nhà kho lớn từ `Barn.png`, tháp silo từ `Silo.png`, khán đài trường đua từ `stadium_tiles.png`.
    - [x] Sàn chuồng ngựa ghép gỗ thật từ `Flooring.png` và vách ngăn từ `townInterior.png`.
    - [x] Sinh ra 4 file ảnh PNG pixel-perfect trong `Map/demo/assets/`: `world-hub.png`, `stall-interior.png`, `race-track.png`, `vet-clinic.png`.
  - **Verification:**
    - [x] Aseprite CLI chạy headless thành công, sinh đủ 4 tệp ảnh bản đồ và các asset nhân vật.

- [x] **Task 8: Nâng Cấp Engine Canvas & UI HUD Theo Chuẩn Stardew Valley (`/ui-ux-pro-max`)**
  - **Mô tả:** Loại bỏ 100% các đoạn code vẽ hình khối tạm `fillRect`/`strokeRect` trong `map-engine.js`. Thay thế bằng việc render ảnh nền Aseprite kèm hoạt cảnh sprite nhân vật (`horse.png`, `Marnie`, `Harvey`, `Shane`, `Alex`, `Lewis`).
  - **Acceptance criteria:**
    - [x] Giao diện HUD mang phong cách Stardew Valley (viền gỗ, tone vàng ấm, font chữ pixel sắc nét).
    - [x] Điểm tương tác (triggers) hiển thị khung góc vàng phong cách cổ điển nhấp nháy tinh tế trên công trình.
    - [x] Hoạt cảnh ngựa chuyển động đi/nghỉ/phi nước đại dọc đường đua mượt mà 60 FPS.
  - **Verification:**
    - [x] Chạy script kiểm thử Chrome DevTools Protocol (`node Map/demo/run-devtools-test.mjs`), toàn bộ 5 ảnh chụp màn hình đạt chuẩn pixel-art tuyệt đẹp, 0 lỗi console.

## Final Checkpoint: Hoàn tất Toàn diện & Nghiệm thu Đồ họa Pixel-Art
- [x] 100% hình ảnh hiển thị trên 4 bản đồ đều là pixel-art nguyên bản ConcernedApe từ thư mục `Stardrew Valley/`.
- [x] 0% hình khối thô sơ hay `fillRect` màu đơn sắc.
- [x] 65/65 tests của hệ thống đều xanh, typecheck 0 lỗi, build production thành công.
