# Kế hoạch: Simulator Web kiểu Hay Day

> Ý định đã chốt với người dùng ngày 19/10/2026 (phỏng vấn interview-me). Danh sách việc: `tasks/todo-hayday.md`.
> `tasks/plan.md` / `todo.md` cũ (map 2048×1536 của ChatGPT) đã bị thay thế bởi bản đồ M1 1280×768 — chờ người dùng cho phép lưu trữ.

## Tổng quan
Biến Simulator Web thành một "nông trại Hay Day" dùng bộ sprite pixel đã duyệt: bản đồ toàn màn hình, HUD nổi 4 góc, chạm ngựa/công trình → bảng nổi bật lên tại chỗ; riêng Chạy thử/Đua "phóng vào" màn riêng. Người dùng là người không rành kỹ thuật (hội đồng khi demo, chủ ngựa, groom); trọng tâm là **thông tin ngựa đầy đủ** bằng thanh, đồng hồ, icon. Thêm **Kho vật tư**. Mọi thứ chuyển động mượt.

## Quyết định kiến trúc
- **Giữ sprite pixel** (S01–S15, `.aseprite`), chỉ đổi lớp giao diện sang kiểu Hay Day: nút phồng bo tròn, bảng nổi viền dày, nút ✕ tròn đỏ. Chỉ mô phỏng bố cục và cách tương tác của Hay Day, không chép hình ảnh hay thương hiệu của họ.
- **Một màn hình chính duy nhất** là bản đồ trang trại; Chuồng / Phòng khám / Kho mở dưới dạng `Popup` đè lên bản đồ (bản đồ vẫn chạy). Chỉ Đường đua có màn riêng (camera phóng vào → mờ chéo → màn chạy thử/đua → "Về trang trại" phóng ra).
- **Ẩn mọi thứ kỹ thuật** khỏi giao diện: `PacketLog`, mã SIM-xx, JSON. Bus sự kiện vẫn chạy bên dưới (để nối Backend sau).
- **Văn phòng CLB bị bỏ** khỏi bản đồ và menu; nhà cam trở thành trang trí không tương tác. Trang tổng quan asset chỉ mở qua `?dev`.
- **Kho vật tư là mô hình thuần** (`src/sim/inventory.ts`, có test): tồn kho giảm theo thời gian giả lập, ngưỡng cảnh báo, đặt hàng → xe tải giao. Không ảnh hưởng sức khỏe ngựa, không nối Backend.
- **Chuyển động**: dùng CSS transitions/keyframes + rAF có sẵn, không thêm thư viện. Mọi hiệu ứng có nhánh `prefers-reduced-motion` (giữ mờ dần, bỏ dịch chuyển/nảy).
- Màu/kích thước mới đi qua `src/ui/tokens.css` (bảng màu pixel riêng của Simulator).

## Danh sách việc (chi tiết trong `todo-hayday.md`)

### Giai đoạn 1 — Khung Hay Day
- [x] T1: Bản đồ toàn màn hình + HUD 4 góc, bỏ Văn phòng CLB
- [x] T2: Bộ `Popup` + nút phồng (nảy mở/đóng, Esc, focus)
- [x] T3: Ẩn gói tin, JSON, mã SIM-xx

### Checkpoint 1 — duyệt khung (ảnh chụp + thử trên trình duyệt)

### Giai đoạn 2 — Ngựa và các khu
- [x] T4: Thẻ ngựa (trọng tâm) — chạm ngựa trên bản đồ hoặc nút Danh sách ngựa
- [x] T5: Bảng Chuồng nổi trên bản đồ
- [x] T6: Bảng Phòng khám nổi trên bản đồ
- [x] T7: Đường đua: phóng vào màn chạy thử/đua và phóng ra

### Checkpoint 2 — duyệt luồng ngựa từ đầu đến cuối

### Giai đoạn 3 — Kho vật tư
- [x] T8: Mô hình tồn kho (thuần, có test)
- [x] T9: Bảng Kho + bộ đếm HUD + cảnh báo sắp hết
- [ ] T10: Xe tải giao hàng, icon bay vào kho, groom chở cỏ

### Checkpoint 3 — duyệt kho

### Giai đoạn 4 — Hoàn thiện chuyển động
- [x] T11: Camera có quán tính, công trình nhún, số đếm, nút lún
- [x] T12: Kiểm thử trình duyệt, giảm chuyển động, màn nhỏ, README

### Checkpoint cuối — typecheck, test, build, verify:map, trình duyệt đều đạt; người dùng duyệt

## Rủi ro
| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Ngựa trên bản đồ là hoạt cảnh (`ambient.ts`), chưa gắn với ngựa thật nên không bấm vào được | Cao | T4 làm sớm: gán `horseId` cho ngựa trên bản đồ, xuất vị trí từng khung để kiểm tra trúng |
| Bảng nổi đè lên canvas rAF làm giật | Trung bình | Bảng nổi là DOM; canvas vẫn chạy rAF và chỉ giảm độ sáng khi có bảng mở; đo trên trình duyệt ở T2 |
| Gom StallTab/VetZone vào bảng nổi làm vỡ bố cục cũ | Trung bình | Tái dùng component, chỉ đổi vỏ; bỏ `Sidebar` sau khi T4 thay thế xong |
| Không giống Hay Day đủ để người dùng hài lòng | Trung bình | Checkpoint có ảnh sau mỗi giai đoạn, giống quy trình 4 đợt sprite |
| Bộ test hiện tại phụ thuộc layout có object `office` | Thấp | T1 cập nhật `farmLayout.test.ts` và `gen-layout.ts` cùng lúc |

## Câu hỏi còn mở (mình đã đoán, chỉnh lại khi duyệt)
- Nhà cam sau khi bỏ Văn phòng CLB: **đoán là giữ làm trang trí** (nhà ở), không tương tác.
- Ngựa trên bản đồ: **đoán là** vài ngựa ở bãi thả là ngựa thật (chạm được), số còn lại ở trong chuồng, xem qua bảng Chuồng.
- Thanh trên-trái: **đoán là** đồng hồ giả lập + nút Ngày/Đêm thay cho "cấp độ/xu" của Hay Day.
