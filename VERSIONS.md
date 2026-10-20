# 📦 EquiFlow Simulator — Danh Sách & Hướng Dẫn Đóng Gói Các Phiên Bản (Release Guide)

Dự án mô phỏng **EquiFlow Simulator Web (IoT ảo / Digital Twin)** được đóng gói thành hai phiên bản mô hình hoàn chỉnh, độc lập trên GitHub và có thể chuyển đổi dễ dàng:

---

## 🗺 So Sánh Tổng Quan Hai Phiên Bản

| Tiêu chí | Phiên bản 1: v1 (Original Pixel-Art) | Phiên bản 2: v2 (Stardew Valley) |
|---|---|---|
| **Mục đích** | Mô phỏng số hóa trang trại ngựa đua hoàn chỉnh theo đặc tả SRS v2.0 | Nâng cấp bản đồ thế giới bằng tài nguyên pixel art Stardew Valley |
| **Đồ họa nền** | Sprite độc quyền do code tự sinh (S07, S08, S10) kết hợp Aseprite | 16 bộ sheet gốc ConcernedApe từ Stardew Valley (`Flooring`, `Town`, `Barn`, ...) |
| **Bản đồ** | Bản đồ trang trại M1 1280×768 (ô 32px), có ngày/đêm | Bản đồ trang trại Bố cục B mùa xuân 1280×768 (ô 16px), Autotile 4×4 |
| **Sinh vật môi trường** | Bộ S16 code-gen: Chim sẻ, mèo cam, bướm vàng, túi gió | Bộ sinh vật Stardew: Gà trắng, gà nâu, vịt, chó cưng, mèo |
| **Công trình** | Chuồng 6×6, Kho vật tư, Phòng khám thú y, Đường đua 6 làn | 2 Barns (khu chuồng), Silo + Shed (kho), Nhà 2 tầng (NPCs), Phòng khám Harvey |
| **Tọa độ & Cửa** | Tọa độ tĩnh theo lưới pixel | Hệ thống **Anchors** động (cửa nhà, điểm đứng chuồng ngựa, điểm spawn) |
| **UI & Tương tác** | Hay Day UI (nút tròn phồng, bảng gỗ popup, HUD 4 góc) | Hay Day UI tích hợp các điểm tương tác Stardew Valley |
| **Động cơ Telemetry** | 100% (HR, Gait, Bề mặt sân, Chướng ngại vật, Microchip 15 số) | 100% (Kế thừa nguyên vẹn từ v1) |
| **Trạng thái Git** | Nhánh `main` & `v1` · Tag `v1.0.0` | Nhánh `v2-stardew-valley` · Tag `v2.0.0` |
| **Kiểm thử tự động** | 64/64 tests đạt (100% pass) | 79/79 tests đạt (100% pass) |

---

## 🚀 Cách Chuyển Đổi & Khởi Chạy Từng Phiên Bản

### 1. Khởi chạy Phiên bản 1 (v1 — Bản đầy đủ chuẩn SRS trên GitHub)

Phiên bản v1 nằm mặc định trên nhánh `main` và nhánh `v1`:

```bash
# Chuyển sang nhánh v1 (hoặc main)
git checkout main
# hoặc: git checkout v1

# Cài đặt thư viện (nếu chưa cài)
npm install

# Kiểm tra chất lượng & chạy test (64/64 bài kiểm thử)
npm run typecheck
npm test

# Khởi chạy máy chủ phát triển
npm run dev
```
> Trình duyệt mở tại `http://localhost:5173`. Giao diện trang trại sử dụng bản đồ pixel art nguyên bản với sinh vật S16, xe cút kít chở cỏ và hiệu ứng ngày/đêm.

---

### 2. Khởi chạy Phiên bản 2 (v2 — Bản đồ Stardew Valley & Autotile)

Phiên bản v2 nằm trên nhánh `v2-stardew-valley`:

```bash
# Chuyển sang nhánh v2
git checkout v2-stardew-valley

# Kiểm tra chất lượng & chạy test (79/79 bài kiểm thử bao gồm autotile & SV)
npm run typecheck
npm test

# Khởi chạy máy chủ phát triển
npm run dev
```
> Trình duyệt mở tại `http://localhost:5173`. Giao diện trang trại hiển thị bố cục B mùa xuân Stardew Valley với 2 Barns, phòng khám Harvey, kho silo và đàn gia cầm/thú cưng Stardew di chuyển sống động.

---

## ⚡ Mẹo: Chạy Song Song Cả Hai Phiên Bản Không Cần Chuyển Nhánh (Git Worktree)

Nếu muốn mở cả hai phiên bản cùng một lúc để so sánh hoặc trình chiếu cho hội đồng:

```bash
# Tạo thư mục làm việc song song cho v2 ngay bên ngoài
git worktree add ../Racehorse_Simulator_Web_v2 v2-stardew-valley

# Vào thư mục v2 và khởi chạy ở cổng khác
cd ../Racehorse_Simulator_Web_v2
npm run dev -- --port 5174
```
- **Bản v1:** chạy tại `http://localhost:5173` (thư mục hiện tại)
- **Bản v2:** chạy tại `http://localhost:5174` (thư mục worktree `Racehorse_Simulator_Web_v2`)
