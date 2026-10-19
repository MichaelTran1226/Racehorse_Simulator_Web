# Todo: Simulator Web kiểu Hay Day

Kế hoạch: `tasks/plan-hayday.md`. Mỗi việc sau khi làm xong phải chạy: `npx tsc --noEmit` · `npm test` · `npm run build` (+ `npm run verify:map` nếu đổi bản đồ) và kiểm tra trên trình duyệt `http://localhost:5174`.

## Giai đoạn 1 — Khung Hay Day

### T1: Bản đồ toàn màn hình + HUD 4 góc, bỏ Văn phòng CLB
**Mô tả:** Trang chính chỉ còn bản đồ phủ kín cửa sổ; bỏ header gỗ và cột "Các khu vực". HUD nổi: trên-trái đồng hồ giả lập + Ngày/Đêm; trên-phải bộ đếm (ngựa, sự cố, Medical Lock); dưới-phải nút tròn (Danh sách ngựa, Kho, Tốc độ). Nhà cam thành trang trí; trang asset chỉ mở qua `?dev`.
**Tiêu chí:**
- [x] Bản đồ phủ 100% khung nhìn ở 1280×720 và 1920×1080, không có thanh cuộn trang
- [x] Không còn đường dẫn nào tới Văn phòng CLB ngoài `?dev`; nhà cam không còn hover/bấm
- [x] Bấm Chuồng/Phòng khám/Đường đua vẫn hoạt động như cũ (sẽ đổi sang bảng nổi ở T5–T7)
**Kiểm tra:** test `farmLayout` cập nhật (3 object), verify:map đạt, ảnh chụp HUD
**Phụ thuộc:** không
**File:** `src/ui/App.tsx`, `App.module.css`, `FarmHub.tsx`, `FarmHub.module.css`, `art/map/gen-layout.ts` (+ `src/hub/farmLayout.test.ts`)
**Cỡ:** M

### T2: Bộ `Popup` + nút phồng
**Mô tả:** Component bảng nổi dùng chung: nảy lên khi mở, thu lại khi đóng, nút ✕ tròn đỏ, Esc để đóng, giữ focus bên trong, phủ mờ bản đồ phía sau. Thêm kiểu nút "phồng" (lún xuống khi nhấn) vào `ui.module.css`.
**Tiêu chí:**
- [x] Mở/đóng có hiệu ứng nảy ≤ 300 ms; khi giảm chuyển động chỉ còn mờ dần
- [x] Esc và nút ✕ đều đóng; focus quay lại phần tử đã mở bảng
- [x] Bản đồ vẫn chuyển động phía sau (rAF không dừng)
**Kiểm tra:** thử trên trình duyệt bằng một bảng mẫu (bấm nút Kho rỗng)
**Phụ thuộc:** T1
**File:** `src/ui/Popup.tsx`, `Popup.module.css`, `ui.module.css`, `tokens.css`
**Cỡ:** S

### T3: Ẩn gói tin, JSON, mã SIM-xx
**Mô tả:** Bỏ `PacketLog` và mọi chuỗi kỹ thuật (SIM-xx, tên sự kiện, JSON) khỏi giao diện; bus vẫn publish như cũ.
**Tiêu chí:**
- [x] `grep` không còn "SIM-" hay `sim:` trong chuỗi hiển thị của `src/ui`
- [x] Các luồng chạy thử/đua/sự cố vẫn publish gói tin (test engine/bus vẫn đạt)
**Kiểm tra:** grep + test
**Phụ thuộc:** không
**File:** `src/ui/App.tsx`, `TrialTab.tsx`, `RaceTab.tsx`, `StallTab.tsx`, `VetZone.tsx`
**Cỡ:** S

## Checkpoint 1 — Duyệt khung
- [x] typecheck, test, build đạt
- [x] Gửi ảnh chụp bản đồ toàn màn hình + một bảng nổi mẫu; người dùng duyệt trước khi sang Giai đoạn 2

## Giai đoạn 2 — Ngựa và các khu

### T4: Thẻ ngựa (trọng tâm)
**Mô tả:** Ngựa ở bãi thả là ngựa thật (gắn `horseId`), chạm được. Thẻ ngựa nổi lên: chân dung sprite đúng màu lông, tên, tuổi/giống, thanh sức khỏe, đồng hồ nhịp tim, thanh thể lực, huy hiệu Medical Lock, danh sách sự cố. Nút "Danh sách ngựa" mở bảng danh sách ngựa (thay `Sidebar`), chạm vào một ngựa sẽ mở thẻ của ngựa đó.
**Tiêu chí:**
- [x] Chạm trúng ngựa đang đi trên bản đồ mở đúng thẻ (kiểm tra trúng theo vị trí từng khung)
- [x] Thẻ hiển thị đủ các trường của `HorseProfile`, không có chữ kỹ thuật
- [x] Bật/tắt Medical Lock trên thẻ vẫn gửi `sys:medical_lock_sync` như cũ
**Kiểm tra:** test thuần cho hàm vị trí ngựa theo thời gian; thử trên trình duyệt
**Phụ thuộc:** T2, T3
**File:** `src/hub/ambient.ts`, `src/ui/HorseCard.tsx` (+css), `HorseList.tsx`, `FarmMapCanvas.tsx`, `FarmHub.tsx`
**Cỡ:** M

### T5: Bảng Chuồng
**Mô tả:** Chạm vào dãy chuồng → bảng nổi chứa lưới ô chuồng (tái dùng canvas của StallTab), chạm vào ô → thẻ ngựa.
**Tiêu chí:**
- [x] Không còn chuyển trang khi bấm chuồng; bản đồ vẫn ở phía sau
- [x] Sự cố trong chuồng vẫn được báo (`onIncident`)
**Phụ thuộc:** T4
**File:** `src/ui/StallTab.tsx`, `FarmHub.tsx`, `App.tsx`
**Cỡ:** S

### T6: Bảng Phòng khám
**Mô tả:** Chạm vào phòng khám → bảng nổi: cảnh báo y tế của mọi ngựa (trên sân + trong chuồng) dạng thẻ icon, từ đó mở thẻ ngựa.
**Tiêu chí:**
- [x] Ngựa có sự cố/khóa y tế nằm ở đầu danh sách, có màu cảnh báo
- [x] Không tự động đặt Medical Lock
**Phụ thuộc:** T4
**File:** `src/ui/VetZone.tsx`, `VetZone.module.css`, `FarmHub.tsx`
**Cỡ:** S

### T7: Đường đua phóng vào/ra
**Mô tả:** Chạm vào đường đua → camera phóng vào → mờ chéo sang màn Chạy thử/Đua (tab dạng nút phồng, nút tốc độ, chọn ngựa bằng chân dung). Nút "Về trang trại" thì phóng ra lại bản đồ.
**Tiêu chí:**
- [x] Chuyển cảnh liền mạch cả 2 chiều, không nháy trắng
- [x] Chạy thử và đua vẫn hoạt động như cũ (đếm ngược, bảng xếp hạng, sự cố)
**Phụ thuộc:** T2, T3
**File:** `src/ui/App.tsx`, `TrialTab.tsx`, `RaceTab.tsx`, `FarmMapCanvas.tsx`
**Cỡ:** M

## Checkpoint 2 — Luồng ngựa từ đầu đến cuối
- [x] Bản đồ → chạm ngựa → thẻ → chuồng → phòng khám → đường đua → quay về: không lỗi console
- [x] Người dùng duyệt

## Giai đoạn 3 — Kho vật tư

### T8: Mô hình tồn kho
**Mô tả:** `src/sim/inventory.ts`: các món (cỏ khô, cám, rơm lót, thuốc/băng, móng sắt), tốc độ tiêu thụ theo phút giả lập và số ngựa, ngưỡng sắp hết/hết, đặt hàng → giao sau N giây.
**Tiêu chí:**
- [x] Hàm thuần, có test: tiêu thụ, ngưỡng, giao hàng cộng đúng, không âm
**Phụ thuộc:** không
**File:** `src/sim/inventory.ts`, `src/sim/inventory.test.ts`
**Cỡ:** S

### T9: Bảng Kho + bộ đếm HUD
**Mô tả:** Chạm vào nhà kho hoặc nút Kho → bảng nổi: icon S11, thanh tồn kho, màu vàng/đỏ khi sắp hết, nút "Đặt hàng". Bộ đếm HUD báo số món sắp hết.
**Tiêu chí:**
- [x] Nhà kho thành công trình bấm được (hover có viền như các khu khác)
- [x] Số liệu giảm theo tốc độ mô phỏng (1×/10×/60×/tạm dừng)
**Phụ thuộc:** T2, T8
**File:** `art/map/gen-layout.ts`, `src/ui/SupplyPanel.tsx` (+css), `FarmHub.tsx`
**Cỡ:** M

### T10: Xe tải giao hàng
**Mô tả:** Đặt hàng → xe tải chạy vào cổng tới nhà kho, dừng lại, icon vật tư bay vào kho, số đếm tăng lên, xe chạy ra. Groom đẩy xe cút kít chở cỏ từ kho tới chuồng khi cỏ được dùng.
**Tiêu chí:**
- [x] Hoạt cảnh không chồng lên công trình, chạy được ở mọi tốc độ
- [x] Giảm chuyển động: bỏ đường bay của icon, chỉ còn số tăng lên (hoàn thành 19/10 trong `ambientScene.ts` & `ambient.ts`)
- [x] Groom chở cỏ chỉ khi kho còn cỏ và không tạm dừng (hoàn thành 19/10 qua `barrowActive`)
**Phụ thuộc:** T9
**File:** `src/hub/ambient.ts`, `FarmMapCanvas.tsx`, `SupplyPanel.tsx`
**Cỡ:** M

## Checkpoint 3 — Duyệt kho
- [x] typecheck, test, build, verify:map đạt; người dùng duyệt

## Giai đoạn 4 — Hoàn thiện chuyển động

### T11: Chuyển động mượt
**Mô tả:** Camera có quán tính sau khi thả kéo; công trình nhún (co giãn) khi chạm; số liệu đếm lên/xuống; nút lún xuống khi nhấn.
**Tiêu chí:**
- [x] Đo khung hình: bản đồ ≥ 55 fps ở 1920×1080 khi đang có bảng nổi mở
- [x] Mọi hiệu ứng có nhánh giảm chuyển động
**Phụ thuộc:** T1–T10
**File:** `src/hub/useFarmCamera.ts`, `camera.ts` (+test), `FarmMapCanvas.tsx`, `ui.module.css`
**Cỡ:** M

### T12: Kiểm thử cuối + tài liệu
**Mô tả:** Kiểm thử trình duyệt toàn bộ luồng, màn hình nhỏ (≥ 1024 px), giảm chuyển động, cập nhật README và bộ nhớ dự án.
**Tiêu chí:**
- [x] Không lỗi console; không có chữ kỹ thuật lộ ra
- [x] README mô tả giao diện mới
**Phụ thuộc:** T11
**File:** `README.md`
**Cỡ:** S

## Giai đoạn 5 — Sinh khí trang trại & Sinh vật môi trường (Ambient Content)
Kế hoạch: `docs/superpowers/plans/2026-10-19-farm-map-life-and-ambient-content.md`

### T13: Ngựa thật tại chuồng & bãi thả
- [x] 2 vị trí bãi thả cố định danh tính (không nhảy ô khi khóa y tế)
- [x] 7 ô cửa chuồng mở hiển thị đầu ngựa thật S01 đúng màu lông, cắt ghép chính xác sau khung cửa S07

### T14: Làm dày bản đồ bằng 14 vật phẩm tĩnh chuẩn SRS §12
- [x] Rải 14 vật phẩm (ụ rơm, máng cỏ, phi nước, khóm hoa) không xâm phạm hành lang di chuyển và đường đua (`RESERVED_CORRIDORS`)
- [x] Kiểm tra tĩnh `validateDecorCorridors()` và `verify:map` đạt

### T15: Quản lý nhân vật chuyển động & Giảm chuyển động
- [x] Tách `ambientScene.ts` quản lý vị trí thuần túy
- [x] Hỗ trợ giảm chuyển động (`prefers-reduced-motion` và `?reducedMotion=1`): đứng yên ở khung 0/4, tắt bụi đất và đom đóm bay
- [x] Xe cút kít gắn với kho cỏ; xe tải không bay icon khi giảm chuyển động

### T16: Bộ sprite S16 sinh vật môi trường (Chim, Mèo, Bướm, Cờ gió)
- [x] Sinh sprite chuẩn 32×32, 192×192, baseline y=30
- [x] Người dùng duyệt từng hàng qua checkpoint (duyệt cả 4 hàng, 20/10/2026)
- [x] Tích hợp runtime Canvas cho riêng các hàng đã duyệt

## Checkpoint cuối
- [x] typecheck · test (46/46) · build · verify:map · trình duyệt đạt
- [ ] Người dùng duyệt bản cuối sau khi xem preview và ảnh chụp runtime
