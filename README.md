# 🐎 EquiFlow Simulator Web — Phiên Bản 1 (v1: Original Pixel-Art)

[![Release](https://img.shields.io/badge/Release-v1.0.0-blue.svg)](https://github.com/MichaelTran1226/Racehorse_Simulator_Web/releases/tag/v1.0.0)
[![Branch](https://img.shields.io/badge/Branch-v1-success.svg)](https://github.com/MichaelTran1226/Racehorse_Simulator_Web/tree/v1)
[![Tests](https://img.shields.io/badge/Tests-64%2F64%20Pass-brightgreen.svg)](https://github.com/MichaelTran1226/Racehorse_Simulator_Web)
[![Style](https://img.shields.io/badge/Art-Code--Gen%20Pixel%20Art%20%2B%20Hay%20Day%20UI-orange.svg)](https://github.com/MichaelTran1226/Racehorse_Simulator_Web)

> **Phân hệ 1 theo SRS & Design Handoff v2.0** (`horse simulation model/`).  
> Ứng dụng web độc lập, đồ họa **Pixel Art trên HTML5 Canvas 2D**, giao diện tương tác phong cách **Hay Day** thân thiện với người dùng (viên/nút tròn phồng, bảng gỗ nảy nổi, âm hưởng nông trại).  
> Tích hợp động cơ mô phỏng sinh trắc học ngựa (Telemetry Math Engine), quản lý kho vật tư, khu chuồng trại, trạm thú y và trường đua kịch tính.

---

> [!NOTE]
> **Bạn đang xem Phiên Bản 1 (v1.0.0 — Bản đầy đủ gốc theo chuẩn SRS):**
> - **Mã nguồn:** Toàn bộ bản đồ thế giới và sprite đều là pixel-art độc quyền vẽ bằng code sinh (`art/gen/*.ts`) và đóng gói qua Aseprite CLI (`farm-day.aseprite`).
> - **Sinh vật môi trường:** Bộ S16 độc quyền gồm chim sẻ, mèo cam lười, bướm vàng và túi gió.
> - **Hiệu ứng thời gian:** Có đầy đủ chu kỳ **Ban Ngày (Day Mode)** & **Ban Đêm (Night Mode)** với đèn lồng chuồng trại ấm áp và đom đóm lập lòe.
> - **Chuyển sang Phiên bản 2 (Stardew Valley):** Xem nhánh [`v2-stardew-valley`](https://github.com/MichaelTran1226/Racehorse_Simulator_Web/tree/v2-stardew-valley) hoặc đọc [VERSIONS.md](VERSIONS.md).

---

## 📸 Showcase Giao Diện Thực Tế (v1 Visual Showcase)

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
| *Lưới thẻ chiến mã với avatar pixel art, tình trạng sức khỏe (Đủ điều kiện, Cần theo dõi, Khóa)* | *Chân dung hoạt ảnh, thanh đo nhịp tim (BPM) 3 dải màu, thể lực, tốc độ km/h, mã chip 15 số ISO và nút bật/tắt Khóa y tế* |

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

## 🎨 Bộ Tài Nguyên Sprite Độc Quyền (v1 Official Code-Gen Sprites)

Toàn bộ đồ họa phiên bản v1 được tạo ra bởi pipeline TypeScript độc quyền, kiểm soát từng pixel màu theo bảng màu chuẩn của dự án:

| Mã Sheet | Tên gọi | Kích thước | Mô tả chi tiết |
|---|---|---|---|
| **S01** | Ngựa đua | 256×256 px | 7 dáng điệu (đứng, bước, phi nước kiệu, phi nước đại, gặm cỏ, vẫy đuôi, ngủ) với 4 màu lông |
| **S06** | Nhân sự | 128×128 px | Groom chải ngựa, Huấn luyện viên bấm giờ, Bác sĩ thú y khom người khám |
| **S07** | Mặt đất & Lối đi | 128×128 px | Cỏ xanh, đường đất nện, viền hoa dại, thảm rơm chuồng trại |
| **S08** | Công trình | 256×256 px | Chuồng ngựa mái đỏ, Nhà kho silo, Trạm xá thú y, Cổng trang trại |
| **S10** | Đường đua | 256×256 px | Khán đài cổ động, cọc rào phân làn, cổng xuất phát 6 ô |
| **S11** | Biểu tượng & HUD | 128×128 px | Nút điều hướng, icon thể trạng, thời tiết, tim mạch |
| **S13** | Hiệu ứng (VFX) | 128×128 px | Bụi móng ngựa tung bay, mồ hôi chiến mã, bong bóng "zzz" |
| **S14** | Nài ngựa (Jockeys) | 128×128 px | Nài ngựa trong trang phục lụa thi đấu 6 màu sắc |
| **S15** | Xe cộ | 128×128 px | Xe cút kít chở cỏ, xe điện buggy tuần tra, xe tải giao cỏ |
| **S16** | Sinh vật môi trường | 192×192 px | Chim sẻ mổ hạt, mèo mướp sưởi nắng, bướm vàng vờn hoa, túi gió |

---

## 🧪 Kiểm Thử & Đảm Bảo Chất Lượng (Quality Gates)

Phiên bản v1 tuân thủ nghiêm ngặt nguyên tắc **Constraint-Driven Development (CDD)**:

- `npm run typecheck`: **0 lỗi TypeScript** (chế độ strict).
- `npm test`: **64/64 bài kiểm thử tự động đạt 100%**.
- `npm run build`: Tạo bản đóng gói production hoàn hảo (`dist/`).

```bash
# Khởi chạy kiểm thử
npm test

# Khởi chạy server phát triển
npm run dev
```

---

## 🧭 Điều Hướng Giữa Các Phiên Bản

| Phiên bản | Nhánh | Lệnh chuyển nhanh |
|---|---|---|
| **Bản v1 (Hiện tại)** | `v1` | `git checkout v1` |
| **Bản v2 (Stardew Valley)** | `v2-stardew-valley` | `git checkout v2-stardew-valley` |
| **Tài liệu so sánh** | `main` | Xem tệp [VERSIONS.md](VERSIONS.md) |
