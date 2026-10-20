# 🐎 EquiFlow Simulator Web (IoT ảo / Digital Twin)

[![Release v1.0.0](https://img.shields.io/badge/Release-v1.0.0-blue.svg)](https://github.com/MichaelTran1226/Racehorse_Simulator_Web/releases/tag/v1.0.0)
[![Release v2.0.0](https://img.shields.io/badge/Release-v2.0.0-blue.svg)](https://github.com/MichaelTran1226/Racehorse_Simulator_Web/releases/tag/v2.0.0)
[![Branch v1](https://img.shields.io/badge/Branch-v1-success.svg)](https://github.com/MichaelTran1226/Racehorse_Simulator_Web/tree/v1)
[![Branch v2](https://img.shields.io/badge/Branch-v2--stardew--valley-success.svg)](https://github.com/MichaelTran1226/Racehorse_Simulator_Web/tree/v2-stardew-valley)
[![Tests v1](https://img.shields.io/badge/Tests%20v1-64%2F64%20Pass-brightgreen.svg)](https://github.com/MichaelTran1226/Racehorse_Simulator_Web/tree/v1)
[![Tests v2](https://img.shields.io/badge/Tests%20v2-79%2F79%20Pass-brightgreen.svg)](https://github.com/MichaelTran1226/Racehorse_Simulator_Web/tree/v2-stardew-valley)

> **Phân hệ 1 theo SRS & Design Handoff v2.0** (`horse simulation model/`).  
> Ứng dụng web độc lập, đồ họa **Pixel Art trên HTML5 Canvas 2D**, giao diện tương tác phong cách **Hay Day** thân thiện với người dùng (viên/nút tròn phồng, bảng gỗ nảy nổi, âm hưởng nông trại).  
> Tích hợp động cơ mô phỏng sinh trắc học ngựa (Telemetry Math Engine), quản lý kho vật tư, khu chuồng trại, trạm thú y và trường đua kịch tính.

---

## 📦 Các Phiên Bản Mô Hình Được Đóng Gói (Packaged Versions)

Dự án được phân nhánh và đóng gói chính thức thành **2 phiên bản độc lập hoàn chỉnh** trên GitHub:

| Phiên bản | Nhánh Git | Thẻ Phát Hành | Đặc điểm nổi bật | Bộ kiểm thử |
|---|---|---|---|:---:|
| **Phiên bản 1 (v1)** | [`v1`](https://github.com/MichaelTran1226/Racehorse_Simulator_Web/tree/v1) | [`v1.0.0`](https://github.com/MichaelTran1226/Racehorse_Simulator_Web/releases/tag/v1.0.0) | **Bản gốc chuẩn SRS**: Đồ họa pixel-art độc quyền tự sinh bằng code (S01–S16), chu kỳ Ngày/Đêm (đèn lồng & đom đóm), sinh vật S16 (chim sẻ, mèo cam, bướm, túi gió), xe cút kít chở cỏ, **Mã chip 15 số ISO 11784/11785** trên thẻ ngựa. | **64/64 tests pass** |
| **Phiên bản 2 (v2)** | [`v2-stardew-valley`](https://github.com/MichaelTran1226/Racehorse_Simulator_Web/tree/v2-stardew-valley) | [`v2.0.0`](https://github.com/MichaelTran1226/Racehorse_Simulator_Web/releases/tag/v2.0.0) | **Bản Stardew Valley**: Nền bản đồ Bố cục B mùa xuân 1280×768 (ô 16px) từ 16 bộ sheet ConcernedApe nguyên bản, thuật toán **Autotile 4×4** đất/đường, 2 Barns, Silo + Shed, phòng khám Harvey, thú cưng & gia cầm Stardew (gà, vịt, chó, mèo), hệ thống anchors. | **79/79 tests pass** |

👉 *Xem chi tiết bảng so sánh chuyên sâu và hướng dẫn chạy song song 2 cổng tại tệp [VERSIONS.md](VERSIONS.md).*

---

## 🚀 Hướng Dẫn Chuyển Đổi & Khởi Chạy

### 1. Khởi chạy Bản v1 (Original Pixel-Art Edition — Cổng 5173)
```bash
git checkout v1
npm test          # Chạy 64/64 bài kiểm thử
npm run dev       # Mở tại http://localhost:5173
```

### 2. Khởi chạy Bản v2 (Stardew Valley Edition — Cổng 5174)
```bash
git checkout v2-stardew-valley
npm test          # Chạy 79/79 bài kiểm thử
npm run dev -- --port 5174  # Mở tại http://localhost:5174
```

### 3. Mẹo: Mở Song Song Cả Hai Bản (Git Worktree)
```bash
# Tạo thư mục song song cho v2 (chỉ cần làm 1 lần)
git worktree add ../Racehorse_Simulator_Web_v2 v2-stardew-valley

# Chạy v1 tại thư mục hiện tại (cổng 5173)
npm run dev

# Mở terminal mới, chạy v2 tại thư mục worktree (cổng 5174)
cd ../Racehorse_Simulator_Web_v2 && npm run dev -- --port 5174
```

---

## 📸 Showcase Giao Diện Thực Tế (Visual Showcase)

Hệ thống được thiết kế theo phong cách game quản lý nông trại Hay Day kết hợp pixel art cổ điển. Toàn bộ bản đồ thế giới 1280×768 được dựng từ các bộ sprite độc quyền đã qua kiểm định màu sắc.

### 1. Bản Đồ Trang Trại Chính (Farm Hub) — Ban Ngày & Ban Đêm
Bản đồ trang trại phủ kín màn hình với cơ chế camera trượt mượt mà (kéo chuột để đi dạo, có quán tính vật lý khi thả tay, lăn chuột để phóng to/thu nhỏ quanh con trỏ). Bãi thả ngựa có các chiến mã thong thả gặm cỏ, xe cút kít chở cỏ chạy dọc đường mòn, cùng HUD nổi 4 góc theo dõi thời gian thực.

| ☀ Toàn cảnh ban ngày (Day Mode) | ☾ Ánh đèn & đom đóm ban đêm (Night Mode) |
|:---:|:---:|
| ![Farm Hub Day](docs/screenshots/01-farm-hub-day.png) | ![Farm Hub Night](docs/screenshots/02-farm-hub-night.png) |
| *Bãi cỏ xanh mát, đàn ngựa gặm cỏ, xe buggy tuần tra, HUD chỉ số 4 góc* | *Hiệu ứng đèn lồng chuồng trại ấm áp, đom đóm lập lòe và trăng khuyết* |

---

### 2. Thẻ Theo Dõi Chiến Mã (Telemetry) & Quản Lý Đàn Ngựa
Chạm trực tiếp vào bất kỳ chú ngựa nào trên bãi cỏ hoặc bấm nút tròn **♞ Ngựa** ở góc phải dưới để mở bảng danh mục đàn ngựa và thẻ chiến mã chi tiết.

| 📋 Danh sách đàn ngựa (Horse Roster) | 🩺 Thẻ Telemetry chi tiết (Horse Card) |
|:---:|:---:|
| ![Horse Roster](docs/screenshots/03-horse-roster.png) | ![Horse Card Telemetry](docs/screenshots/04-horse-card-telemetry.png) |
| *Lưới thẻ chiến mã với avatar pixel art, tình trạng sức khỏe (Đủ điều kiện, Cần theo dõi, Khóa)* | *Chân dung hoạt ảnh, thanh đo nhịp tim (BPM) 3 dải màu, thể lực, tốc độ km/h, **dòng hiển thị Mã chip 15 số ISO** và nút bật/tắt Khóa y tế* |

---

### 3. Khu Chuồng Trại & Trạm Thú Y (Stalls & Vet Clinic)
Bấm vào công trình trên bản đồ: camera lướt tới vị trí công trình và mở bảng nổi gỗ đặc trưng.

| 🏠 Khu chuồng trại (6×6 Stalls Grid) | 🏥 Trạm khám thú y (Vet Clinic) |
|:---:|:---:|
| ![Stalls Management](docs/screenshots/06-stalls-management.png) | ![Vet Clinic](docs/screenshots/07-vet-clinic.png) |
| *Phân bổ ngựa vào các ô chuồng nghỉ ngơi; mã màu phân loại thể trạng; ngựa ngủ có bong bóng "zzz"* | *Khu cách ly theo dõi chấn thương, bảng cảnh báo sự cố thời gian thực và quản lý khóa y tế* |

---

### 4. Bảng Quản Lý Kho Vật Tư & Xe Giao Hàng (Supply Barn)
Mô phỏng tiêu hao tài nguyên (cỏ khô, yến mạch, rơm lót chuồng, thuốc men, móng sắt) theo số lượng ngựa và thời gian mô phỏng. Khi đặt hàng, xe tải sẽ lăn bánh từ cổng vào tận cửa kho để bốc dỡ hàng.

<p align="center">
  <img src="docs/screenshots/05-supply-inventory.png" alt="Supply Inventory" width="85%" />
  <br />
  <em>Bảng theo dõi định mức tồn kho, cảnh báo khi sắp cạn và nút Đặt hàng gọi xe tải giao tận nơi</em>
</p>

---

### 5. Khu Vực Đường Đua (Track Arena) — Chạy Thử & Đua 6 Làn
Đường đua là phân hệ mô phỏng vận động chuyên sâu với 2 chế độ: **Chạy thử 1 ngựa** và **Đua 6 làn**.

| ⏱ Chế độ Chạy thử (Trial Simulation) | 🏁 Trường đua 6 làn (6-Lanes Race) |
|:---:|:---:|
| ![Track Trial](docs/screenshots/08-track-trial-simulation.png) | ![Track 6-Lanes Race](docs/screenshots/09-track-6lanes-race.png) |
| *Tùy chọn cự ly (800m - 2000m), mặt sân (Cỏ/Cát/Hỗn hợp), tình trạng (Khô/Lầy) và đặt rào cản* | *Khán đài sôi động, 6 nài ngựa trong trang phục thi đấu tại cổng xuất phát, tính toán thứ hạng theo thời gian thực* |

---

## 🏛 Kiến Trúc & Công Nghệ Cốt Lõi

1. **Hiển Thị Đồ Họa Tốc Độ Cao (Canvas 2D):**
   - Vòng lặp `requestAnimationFrame` duy trì ổn định **60 FPS**.
   - Phân lớp đồ họa chuyên nghiệp: Lớp nền tĩnh (Ground Map) → Lớp chiều sâu (Z-Sorted Objects) → Lớp động (Dynamic Actors & Critters).
2. **Động Cơ Mô Phỏng Toán Học (Telemetry Engine):**
   - Tính toán nhịp tim (Heart Rate BPM), thể lực (Stamina Drain/Recovery) theo từng nhịp bước chạy (Walk, Trot, Canter, Gallop).
   - Tác động của mặt sân (Cỏ nhanh & ít hao, Cát chậm & tiêu hao nhiều, Hỗn hợp trung tính) và tình trạng thời tiết (Khô ráo / Lầy lội).
3. **Mã Chip Định Danh 15 Số (ISO 11784/11785):**
   - Cung cấp mã định danh chuẩn quốc tế cho từng cá thể ngựa, chia nhóm 3 số dễ đọc (ví dụ: `985 141 000 000 001`).
4. **Mô Phỏng Tiêu Hao Tài Nguyên & Hậu Cần Kho:**
   - Định mức tiêu hao tự động theo số lượng đàn ngựa.
   - Cơ chế xe tải giao hàng thông minh: gộp các đơn hàng cùng thời điểm vào một chuyến xe chuyên chở.
5. **Bus Sự Kiện Cục Bộ (Event Bus):**
   - Phân tách hoàn toàn giữa giao diện người dùng (UI) và động cơ mô phỏng, sẵn sàng tích hợp với Backend NestJS qua Socket.IO.

---

## 📋 Kịch Bản Kiểm Thử & Nghiệm Thu (Acceptance Test Scenarios)

| Mã | Kịch bản | Thao tác thực hiện | Kết quả kỳ vọng |
|---|---|---|---|
| **TC-01** | **Khởi Động & Tải Sprite** | Mở trình duyệt tại địa chỉ web. | Màn hình tải mượt mà, toàn bộ tài nguyên bản đồ và sprite nạp đầy đủ; không có thông báo lỗi trong DevTools console. |
| **TC-02** | **Điều Hướng Camera** | Giữ chuột trái và kéo trên bản đồ; thả chuột với tốc độ nhanh. Lăn chuột tại một điểm bất kỳ. | Camera di chuyển theo tay kéo; khi thả tay có quán tính lướt nhẹ và dừng êm; lăn chuột phóng to/thu nhỏ chính xác quanh vị trí con trỏ chuột. |
| **TC-03** | **Tương Tác Thẻ Ngựa** | Chạm vào một chú ngựa đang gặm cỏ trên bãi thả (hoặc bấm nút "Ngựa" ở góc phải dưới). | Thẻ thông tin ngựa bật mở với hoạt ảnh phồng nảy mượt mà; chân dung ngựa cử động; thanh nhịp tim nhảy số liên tục; hiển thị mã chip 15 số rõ ràng. |
| **TC-04** | **Đặt Hàng & Giao Cỏ** | Bấm vào Nhà kho (hoặc nút "Kho"), bấm nút "Đặt thêm" tại mục Cỏ khô. | Số lượng tồn kho chuyển trạng thái đặt hàng; xe tải xuất hiện từ cổng vào, di chuyển đến trước cửa kho dỡ hàng và rời đi; kho được lấp đầy. |
| **TC-05** | **Xem Chi Tiết Chuồng / Trạm Xá** | Bấm vào Chuồng ngựa hoặc Trạm thú y trên bản đồ. | Camera lướt đến công trình; công trình nhún nhẹ và bảng nổi tương ứng mở ra với đầy đủ thông số quản lý. |
| **TC-06** | **Chạy Thử Đường Đua (Trial)** | Chuyển sang khu vực Đường đua. Chọn ngựa, chọn cự ly, mặt sân Cát. Bấm "Bắt đầu chạy thử". | Ngựa phi nước đại trên đường đua, thanh telemetry nhảy nhịp tim, tốc độ tức thời và hiển thị hoạt ảnh bật nhảy khi qua rào. |
| **TC-07** | **Đua Ngựa 6 Làn (Race)** | Tại màn hình Đường đua, chuyển sang tab Đua 6 làn. Bấm "Mở cổng xuất phát". | Cổng bật mở, 6 nài ngựa cùng phi nước đại. Bảng xếp hạng bên phải cập nhật vị trí và khoảng cách liên tục cho tới khi qua đích. |
| **TC-08** | **Điều Tốc Mô Phỏng** | Bấm nút tốc độ ở góc dưới phải để chuyển qua lại `1×` → `10×` → `60×` → `II` (Tạm dừng). | Tốc độ tiêu hao kho, nhịp di chuyển và thời gian mô phỏng tăng tốc hoặc đứng yên tương ứng; xe cút kít và sinh vật tạm dừng khi ở trạng thái `II`. |
| **TC-09** | **Hỗ Trợ Giảm Chuyển Động** | Bật tùy chọn `prefers-reduced-motion` của HĐH hoặc thêm `?reducedMotion=1` trên URL. | Hiệu ứng nảy/phóng camera tự động chuyển sang hiệu ứng mờ dần (fade); mọi nhân vật đứng yên ở tư thế tĩnh chuẩn; tắt bụi cát đường đua. |

---

## 📁 Cấu Trúc Dự Án (Project Structure)

```
Racehorse_Simulator_Web/
├── art/                           # Tài nguyên nguồn và script vẽ đồ họa
│   ├── aseprite/                  # Script tự động hóa đóng gói Lua cho Aseprite CLI
│   ├── gen/                       # Script TypeScript sinh sprite pixel bằng thuật toán
│   ├── map/                       # Bố cục bản đồ farm-layout.json & script sinh
│   └── preview/                   # Ảnh xem trước các sheet sprite và bản đồ
├── docs/                          # Tài liệu & hình ảnh showcase
│   └── screenshots/               # Ảnh chụp thực tế các màn hình ứng dụng
├── public/                        # Static assets phục vụ Vite
│   └── assets/
│       ├── maps/                  # Bản đồ farm-ground.png và từng PNG công trình
│       └── sprites/               # Sprite sheet s01-s16 chuẩn hóa 192×192
├── scripts/                       # Các tiện ích tự động hóa (chụp ảnh showcase...)
│   └── capture-screenshots.mjs    # Kịch bản Playwright tự động chụp ảnh giao diện
├── src/                           # Mã nguồn chính của ứng dụng
│   ├── assets/manifest.ts         # Danh mục asset, quy chuẩn và bảng màu SRS §12
│   ├── hub/                       # Logic camera (quán tính, zoom), hit-test, layout, đường đi
│   ├── render/                    # Đổi màu lông/áo nài, nạp sprite, vẽ cảnh canvas
│   ├── sim/                       # Động cơ mô phỏng: telemetry, bus sự kiện, kho vật tư
│   └── ui/                        # Các React component (FarmHub, FarmMapCanvas, Popups...)
├── VERSIONS.md                    # Hướng dẫn chi tiết hai phiên bản v1 và v2
├── index.html                     # Điểm vào ứng dụng web
├── package.json                   # Cấu hình dự án & scripts
├── tsconfig.json                  # Cấu hình TypeScript nghiêm ngặt
└── vite.config.ts                 # Cấu hình Vite bundler
```
