# 🐎 EquiFlow Simulator Web (IoT ảo / Digital Twin)

> **Phân hệ 1 theo SRS & Design Handoff v2.0** (`horse simulation model/`).  
> Ứng dụng web độc lập, đồ họa **Pixel Art trên HTML5 Canvas 2D**, giao diện tương tác phong cách **Hay Day** thân thiện với người dùng (viên/nút tròn phồng, bảng gỗ nảy nổi, âm hưởng nông trại).  
> Tích hợp động cơ mô phỏng sinh trắc học ngựa (Telemetry Math Engine), quản lý kho vật tư, khu chuồng trại, trạm thú y và trường đua kịch tính.

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
| *Lưới thẻ chiến mã với avatar pixel art, tình trạng sức khỏe (Đủ điều kiện, Cần theo dõi, Khóa)* | *Chân dung hoạt ảnh, thanh đo nhịp tim (BPM) 3 dải màu, thể lực, tốc độ km/h và nút bật/tắt Khóa y tế* |

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

## ⚙ Cài Đặt & Khởi Chạy (Installation & Setup)

### Yêu Cầu Môi Trường
- **Node.js**: Phiên bản `≥ 20.19.0` (khuyên dùng Node 22 hoặc 24 LTS).
- **Trình duyệt**: Chrome, Edge, Firefox, Brave (hỗ trợ HTML5 Canvas 2D và Web Components / Dialog).

### Các Bước Cài Đặt

1. **Di chuyển vào thư mục dự án**:
   ```bash
   cd Racehorse_Simulator_Web
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies)**:
   ```bash
   npm install
   ```

3. **Khởi chạy môi trường phát triển (Dev Server)**:
   ```bash
   npm run dev
   ```
   > Ứng dụng sẽ chạy tại địa chỉ: **`http://localhost:5174`**

4. **Biên dịch và kiểm tra bản phát hành (Production Build & Preview)**:
   ```bash
   npm run build
   npm run preview
   ```

---

## 🧪 Hướng Dẫn Kiểm Thử (Testing Guide)

Dự án cung cấp bộ kiểm thử tự động toàn diện đi kèm hướng dẫn kiểm thử tương tác trên giao diện.

### 1. Kiểm Thử Tự Động (Automated Testing)

Chạy bộ kiểm thử unit/integration (46 bài test độc lập không phụ thuộc DOM) sử dụng bộ test runner gốc của Node.js:

```bash
# 1. Chạy toàn bộ 46 test case (Telemetry math engine, camera, layout, hit-test, kho, ambient life, stall clipping...)
npm test

# 2. Kiểm tra an toàn kiểu dữ liệu TypeScript (Strict mode)
npm run typecheck

# 3. Xác thực nguồn gốc và bảng màu bản đồ đã sinh
npm run verify:map
```

**Các nhóm chức năng được test tự động:**
- `Telemetry Math Engine`: Kiểm tra mô hình sinh lý nhịp tim (BPM) khi chạy bài nặng/nhẹ, sức cản sân cỏ vs sân cát, phản ứng khi gặp chấn thương nặng (`ABORTED_INJURY`), xác định thứ hạng đua 6 làn và vượt chướng ngại vật.
- `Camera & Physics`: Bán kính kẹp biên bản đồ, ngưỡng kích hoạt kéo chuột (6px drag threshold), làm mịn quán tính (inertia decay), phóng to/thu nhỏ giữ tâm con trỏ chuột (`zoomAt`).
- `Hit-Testing & Layout`: Kiểm tra va chạm tọa độ pixel chính xác kể cả với ảnh có độ trong suốt (alpha), thứ tự z-index của công trình và ngựa, hành lang cách ly vật phẩm (`RESERVED_CORRIDORS`).
- `Inventory & Logistics`: Định mức tiêu hao theo thời gian, phân loại trạng thái kho (`OK`, `LOW`, `OUT`), logic xe tải gom đơn đặt hàng.
- `Ambient Life & Population`: Gán ngựa bãi thả & chuồng cố định danh tính (`farmPopulation`), cắt ghép đầu ngựa thật S01 trong ô cửa mở S07 (`stableHorses`), bộ sprite S16 sinh vật môi trường (Chim, Mèo, Bướm, Cờ gió), cùng cơ chế giảm chuyển động toàn diện (`ambientScene`).

---

### 2. Kịch Bản Kiểm Thử Thủ Công Trên Giao Diện (Manual UI Test Scenarios)

| # | Kịch bản kiểm thử | Thao tác thực hiện | Kết quả mong đợi |
|:---:|:---|:---|:---|
| **TC-01** | **Điều khiển Bản đồ & Camera** | Giữ chuột trái và kéo trên bản đồ; thả tay; lăn con lăn chuột. | Camera lướt mượt mà, khi thả tay có trôi quán tính chậm dần rồi dừng lại; lăn chuột phóng to (tối đa ×3) và thu nhỏ (vừa khít khung hình) quanh con trỏ chuột. |
| **TC-02** | **Chuyển đổi Ngày / Đêm** | Bấm vào nút tròn biểu tượng mặt trời ☀ ở góc trên bên trái (hoặc thêm `?tod=DAY` / `?tod=NIGHT` trên URL). | Bầu trời chuyển sang ban đêm, ánh sáng chuồng trại bật sáng vàng ấm, xuất hiện đom đóm lập lòe; nút chuyển sang hình trăng khuyết ☾. Bấm lại để về ban ngày. |
| **TC-03** | **Tương tác Chiến Mã & Khóa Y Tế** | Chạm vào ngựa đang thong thả đi trên bãi cỏ (hoặc mở nút **Ngựa** → chọn 1 con). | Bảng **Thẻ ngựa** bật nảy lên. Xem được chỉ số nhịp tim, tốc độ, thể lực. Bấm **Khóa y tế**: nhãn trạng thái đổi thành "Khóa y tế", ngựa bị cách ly không được tham gia đua; danh tính 2 ô bãi thả giữ nguyên không bị nhảy vị trí. |
| **TC-04** | **Quản Lý & Tiếp Tế Kho Vật Tư** | Bấm nút **Kho** (góc dưới bên phải). Quan sát các thanh tài nguyên vơi dần. Bấm **Đặt hàng** một mục sắp hết. | Bảng kho hiển thị thời gian xe tải đến. Khi đóng bảng, quan sát thấy xe tải màu trắng chạy từ cổng vào cửa kho, hạ cầu bốc hàng và số lượng tồn kho tự động nhảy tăng lên. |
| **TC-05** | **Xem Khu Chuồng & Thú Y** | Bấm vào tòa nhà Chuồng trại hoặc Phòng khám trên bản đồ. | Camera tự động lướt đến công trình đó; công trình nhún nhẹ và bảng nổi tương ứng mở ra (hiển thị lưới chuồng với tình trạng ngựa, 7 ô cửa mở hiển thị đầu ngựa thật, hoặc danh sách sự cố tại trạm thú y). |
| **TC-06** | **Chạy Thử Đường Đua (Trial)** | Bấm vào khu vực Đường đua (hoặc bấm tab "Đường đua" trên thanh điều hướng). Chọn ngựa, chọn cự ly (1200m), mặt sân Cát, đặt rào thấp. Bấm **Bắt đầu chạy thử**. | Chuyển cảnh mượt mà. Ngựa phi nước đại trên đường đua, thanh telemetry nhảy nhịp tim, tốc độ tức thời và hiển thị hoạt ảnh bật nhảy khi qua rào; cờ gió S16 phấp phới ngoài hàng rào. |
| **TC-07** | **Đua Ngựa 6 Làn (Race)** | Tại màn hình Đường đua, chuyển sang tab **Đua 6 làn**. Chọn cự ly và bấm **Mở cổng xuất phát**. | Cổng bật mở, 6 nài ngựa trong trang phục nhiều màu cùng phi nước đại. Bảng xếp hạng bên phải cập nhật vị trí và khoảng cách liên tục cho tới khi qua vạch đích. |
| **TC-08** | **Điều Tốc Mô Phỏng** | Bấm nút tốc độ ở góc dưới phải (hoặc góc trên phải khi ở đường đua) để chuyển qua lại `1×` → `10×` → `60×` → `II` (Tạm dừng). | Tốc độ tiêu hao kho, nhịp di chuyển và thời gian mô phỏng tăng tốc hoặc đứng yên tương ứng; xe cút kít chở cỏ và sinh vật môi trường tạm dừng chuyển động khi ở trạng thái `II`. |
| **TC-09** | **Hỗ Trợ Giảm Chuyển Động** | Bật tùy chọn `prefers-reduced-motion` trong cài đặt trợ năng của HĐH hoặc thêm `?reducedMotion=1` trên thanh địa chỉ. | Các hiệu ứng nảy/phóng camera tự động chuyển sang hiệu ứng mờ dần (fade); mọi nhân vật và động vật S16 đứng yên ở tư thế tĩnh chuẩn (frame 0/4); tắt bụi cát đường đua và bỏ hiệu ứng icon bay vào kho. |
| **TC-10** | **Sinh Vật Môi Trường S16** | Quan sát các góc trang trại trên bản đồ chính. | Chim sẻ nhảy trên cọc rào bãi thả, mèo hoa đi dạo lối nhà kho, bướm lượn khóm hoa nhà cam, cờ gió phất phơ ngoài đường đua; phối màu SRS §12 hài hòa không rối mắt. |

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
│       └── sprites/               # Sprite sheet s01-s15 chuẩn hóa 192×192
├── scripts/                       # Các tiện ích tự động hóa (chụp ảnh showcase...)
│   └── capture-screenshots.mjs    # Kịch bản Playwright tự động chụp ảnh giao diện
├── src/                           # Mã nguồn chính của ứng dụng
│   ├── assets/manifest.ts         # Danh mục asset, quy chuẩn và bảng màu SRS §12
│   ├── hub/                       # Logic camera (quán tính, zoom), hit-test, layout, đường đi
│   ├── render/                    # Đổi màu lông/áo nài, nạp sprite, vẽ cảnh canvas
│   ├── sim/                       # Động cơ mô phỏng: telemetry, bus sự kiện, kho vật tư
│   └── ui/                        # Các React component (FarmHub, FarmMapCanvas, Popups...)
├── index.html                     # Điểm vào ứng dụng web
├── package.json                   # Cấu hình dự án & scripts
├── tsconfig.json                  # Cấu hình TypeScript nghiêm ngặt
└── vite.config.ts                 # Cấu hình Vite bundler
```

---

## 🎨 Tự Sinh & Đóng Gói Lại Sprite (Tùy Chọn Mở Rộng)

Sprite chính thức được vẽ bằng code và đóng gói thành file `.aseprite` để có thể chỉnh sửa thủ công nếu muốn:

```bash
# 1. Sinh lại sprite sheet cho ngựa và nài
node art/gen/horse.ts

# 2. Sinh lại bố cục bản đồ trang trại 1280×768 (bố cục M1)
node art/map/gen-layout.ts

# 3. Đóng gói bản đồ bằng Aseprite CLI (thay đường dẫn aseprite trên máy bạn)
aseprite -b --script art/aseprite/build-farm-map.lua

# 4. Xác minh màu sắc đạt chuẩn
npm run verify:map
```

*(Lưu ý: Không commit file thực thi `aseprite.exe` vào repository).*

---
