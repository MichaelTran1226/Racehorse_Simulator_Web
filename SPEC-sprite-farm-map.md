# Spec: Bản đồ trang trại dựng hoàn toàn từ sprite

## Trạng thái

Đã được người dùng duyệt ngày 19/10/2026 với điều kiện bổ sung: pipeline chỉ được crop, copy và bố trí lại pixel từ các sprite đã duyệt để tự build map.

## Objective

Thay trang HUB hiện tại bằng một bản đồ trang trại ban ngày có thể kéo camera, được ghép hoàn toàn từ các sprite Đợt 1–4 đã duyệt. Không dùng ảnh concept M1/M2 hoặc bất kỳ ảnh nền phong cảnh nào.

Trải nghiệm đích:

1. Người dùng kéo chuột hoặc cảm ứng để di chuyển camera trên bản đồ lớn hơn viewport.
2. Con trỏ chỉ kích hoạt công trình khi nằm trên pixel hữu hình của công trình đó.
3. Hover tạo viền ôm sát silhouette của công trình; không dùng polygon hoặc mảng phủ vàng.
4. Click hợp lệ làm camera lướt tới công trình, sau đó toàn cảnh mờ dần và chuyển sang màn hình tương ứng.
5. Chỉ có cảnh ban ngày. Chế độ ban đêm và mọi điều khiển ngày/đêm bị xóa hoàn toàn.

## Assumptions

1. Bản đồ logic dùng lưới 32 px và kích thước 2048 × 1536 px, đủ lớn để camera có khoảng kéo rõ ràng trên màn hình desktop.
2. Bản đồ được tạo từ các sheet đã duyệt: `s01-horse`, `s06-people`, `s07-stall`, `s08-farm`, `s10-arena`, `s11-icons`, `s13-fx`, `s14-rider`, `s15-vehicles`.
3. Script được phép lặp, cắt và bố trí pixel từ các sprite đã duyệt; không được vẽ thêm hình minh họa hoặc lấy pixel từ asset khác.
4. Dashboard/HUD hoàn chỉnh chưa thuộc phạm vi. HUB trong giai đoạn này ưu tiên bản đồ và tương tác camera.
5. Các màn hình STALL, TRACK, VET và OFFICE giữ nguyên hành vi nghiệp vụ hiện tại.

## Tech Stack

- React 19.2.8, TypeScript, Vite 8.3.0.
- HTML Canvas 2D cho bản đồ, camera, hit testing và hoạt ảnh.
- CSS Modules và token trong `src/ui/tokens.css`; không thêm UI kit hoặc Tailwind.
- Aseprite 1.3.18 CLI tại:
  `D:\Users\ASUS\Downloads\Programs\Aseprite-v1.3.18.6-Windows\aseprite.exe`
- Lua cho pipeline Aseprite; Node/TypeScript cho kiểm thử logic và metadata bản đồ.

## Commands

```powershell
# Sinh file nguồn .aseprite và PNG xem trước từ đúng các sheet đã duyệt
& "D:\Users\ASUS\Downloads\Programs\Aseprite-v1.3.18.6-Windows\aseprite.exe" `
  -b `
  --script "art/aseprite/build-farm-map.lua"

# Kiểm thử
npm test
npm run typecheck
npm run build

# Xem giao diện
npm run dev -- --host 127.0.0.1
```

## Project Structure

```text
art/aseprite/build-farm-map.lua       Tạo source map từ các sprite đã duyệt
art/aseprite/farm-day.aseprite        File nguồn nhiều layer của bản đồ
art/preview/farm-day-x1.png           Bản xem trước phẳng để duyệt
public/assets/maps/farm-day.png       PNG xuất tự động; không phải ảnh concept
src/hub/farmLayout.ts                 Metadata lưới, công trình và điểm camera
src/hub/farmLayout.test.ts            Test tính hợp lệ của layout
src/hub/camera.ts                     Pan, clamp, tween và phân biệt drag/click
src/hub/camera.test.ts                Test logic camera
src/hub/pixelHitTest.ts               Hit test alpha và tạo mask viền silhouette
src/hub/pixelHitTest.test.ts          Test hit/mask bằng dữ liệu pixel nhỏ
src/ui/FarmHub.tsx                    Điều phối input, render và chuyển cảnh
src/ui/FarmHub.module.css             Khung viewport và fade; không có HUD tạm
src/render/sprites.ts                 Chỉ nạp sprite/asset ban ngày chính thức
src/hub/ambient.ts                    Hoạt cảnh ban ngày dùng sprite đã duyệt
```

## Map Composition Contract

- Mọi pixel của nền cỏ, đường đất, hàng rào, ao, cây, bụi, chuồng, phòng khám, đấu trường và vật thể trang trí phải bắt nguồn từ PNG trong `art/png/` tương ứng với các sheet đã duyệt.
- Script không được gọi primitive tạo pixel mới (`drawPixel`, `drawLine`, `drawRect`, `fill`, brush, shape hoặc text). Chỉ được copy vùng ảnh nguồn không scale, không rotate và đặt lại tại tọa độ đích.
- `build-farm-map.lua` tạo các layer tối thiểu: `ground`, `paths`, `fences`, `buildings`, `decor`, `markers`.
- File `.aseprite` là nguồn chỉnh sửa; PNG là sản phẩm sinh lại được.
- Không đọc hoặc sao chép từ `public/assets/concept/**`.
- Không dùng `ctx.drawImage()` với M1/M2 hoặc ảnh phong cảnh toàn cảnh.
- Nhân vật, ngựa, xe và hiệu ứng động tiếp tục được vẽ từ sheet riêng ở runtime, không bake vào nền tĩnh.

## Interaction Contract

### Camera

- Pointer down bắt đầu trạng thái có thể kéo.
- Camera chỉ chuyển sang trạng thái drag sau khi pointer đi ít nhất 6 CSS px.
- Khi drag, vị trí camera được clamp trong biên bản đồ; không để lộ khoảng trống ngoài map.
- Pointer up sau drag không được phát click công trình.
- Camera tween tới tâm công trình bằng easing `cubic-bezier(0.22, 1, 0.36, 1)` trong khoảng 550–750 ms.
- `prefers-reduced-motion` rút tween xuống chuyển trạng thái gần như tức thời nhưng vẫn giữ đúng thứ tự focus → fade → navigate.

### Hover và hit testing

- Mỗi công trình có một offscreen alpha mask được dựng từ chính các sprite tạo nên công trình.
- Bounding box chỉ dùng để loại nhanh; kết quả cuối phải kiểm tra alpha tại pixel dưới con trỏ.
- Pixel alpha bằng 0 không được hover hoặc click, kể cả khi nằm trong bounding box.
- Viền hover được tạo bằng phép giãn alpha mask rồi trừ mask gốc, vì vậy ôm đúng silhouette.
- Màu viền dùng token giao diện và không phủ một mảng vàng lên bên trong công trình.
- Khi camera đang kéo hoặc đang tween, hover tạm ngừng để tránh nhấp nháy.

### Click và chuyển cảnh

- Click hợp lệ chỉ xảy ra khi không vượt ngưỡng drag và hit test alpha trả về công trình.
- Sau click: khóa input → tween camera tới điểm focus → bắt đầu fade toàn cảnh → gọi `onEnter`.
- Click nền trống chỉ bỏ hover; không tự chọn công trình và không hiển thị vùng vàng.
- Điều hướng bàn phím vẫn cho phép duyệt danh sách công trình vô hình với focus indicator và Enter/Space.

## Day-only Contract

- Xóa type và state `TimeOfDay` khỏi HUB.
- Xóa `timeOfDayNow`, nhánh `NIGHT`, tọa độ polygon ban đêm và logic `drawNight`.
- Xóa trường `night` khỏi `Sprites` và không tải `i23.jpg`.
- Xóa nút mặt trời/mặt trăng cùng mọi copy “Ban ngày/Ban đêm”.
- README chỉ mô tả bản đồ ban ngày dựng từ sprite.

## Code Style

Logic hình học và camera là hàm thuần, tách khỏi React để kiểm thử trực tiếp:

```ts
export function clampCamera(camera: Camera, viewport: Size, world: Size): Camera {
  return {
    x: Math.min(world.width - viewport.width, Math.max(0, camera.x)),
    y: Math.min(world.height - viewport.height, Math.max(0, camera.y)),
  };
}
```

- Component dùng named export và React hooks.
- Không hardcode màu trong CSS Module; màu lấy từ `tokens.css`.
- Không thêm dependency mới nếu chưa hỏi người dùng.
- Không đặt logic hit testing hoặc camera trực tiếp trong JSX.

## Testing Strategy

### Unit tests — Node test runner

- Layout nằm trong biên 2048 × 1536 và không có ID/target trùng.
- Camera clamp đúng ở bốn biên và khi viewport lớn hơn world.
- Chuyển động dưới 6 px là click; từ 6 px trở lên là drag.
- Alpha hit test từ chối pixel trong suốt và chấp nhận pixel hữu hình.
- Outline mask chỉ nằm ngoài silhouette gốc.
- Không còn asset hoặc nhánh code ban đêm trong loader/HUB.

### Browser verification — Playwright + Edge

- Kéo camera theo bốn hướng không làm lộ nền ngoài map.
- Kéo rồi thả trên công trình không điều hướng.
- Click nền trống không tạo highlight.
- Hover mép trong suốt của bounding box không kích hoạt công trình.
- Hover pixel hữu hình cho viền ôm công trình.
- Click công trình chạy theo thứ tự camera tween → fade → màn hình đích.
- Không có nút hoặc nội dung ban đêm.
- Không có lỗi console, request 404 hoặc tải asset từ `/assets/concept/`.
- Kiểm tra viewport 768 × 1024, 1024 × 768 và 1440 × 900.

## Boundaries

### Always do

- Chỉ dùng sprite Đợt 1–4 đã duyệt để tạo bản đồ.
- Giữ file `.aseprite`, PNG xuất và script Lua có thể tái tạo đồng bộ.
- Viết test thất bại trước khi viết logic camera/hit testing.
- Kiểm tra bằng trình duyệt thật trước khi báo hoàn thành.

### Ask first

- Vẽ thêm sprite hoặc thay đổi hình dáng sprite đã duyệt.
- Thêm thư viện render, physics hoặc gesture.
- Thay đổi hành vi nghiệp vụ của STALL/TRACK/VET/OFFICE.
- Thay đổi kích thước lưới 32 px hoặc kích thước world 2048 × 1536.

### Never do

- Dùng M1/M2, ảnh screenshot tham khảo hoặc ảnh concept làm nền.
- Chồng sprite lên một ảnh phong cảnh có sẵn.
- Dùng polygon phủ màu để giả lập hover silhouette.
- Khôi phục chế độ ban đêm.
- Tự động thay đổi Medical Lock hoặc trạng thái nghiệp vụ trong lúc điều hướng.

## Success Criteria

1. `farm-day.aseprite` và `farm-day.png` được tái tạo thành công bằng một lệnh Aseprite CLI.
2. Việc kiểm tra nguồn pixel xác nhận pipeline chỉ đọc các sheet Đợt 1–4.
3. HUB không tải bất kỳ file nào dưới `public/assets/concept/`.
4. Camera kéo được, clamp đúng và drag không bị hiểu thành click.
5. Nền trống không hover/click công trình.
6. Hover tạo outline bám silhouette alpha, không có vùng vàng polygon.
7. Click công trình lướt camera tới mục tiêu rồi fade và điều hướng đúng.
8. Không còn code hoặc UI chế độ ban đêm.
9. `npm test`, `npm run typecheck` và `npm run build` đều thành công.
10. Playwright xác minh tương tác và console sạch ở ba viewport mục tiêu.

## Open Questions

Không có. Các giả định phía trên cần được người dùng duyệt cùng đặc tả.
