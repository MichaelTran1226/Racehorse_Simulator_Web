# Sprite-only Farm Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay HUB bằng bản đồ trang trại ban ngày 2048 × 1536 được Aseprite CLI tự build chỉ bằng thao tác crop/copy các sprite Đợt 1–4, có camera kéo, alpha hover và chuyển cảnh focus → fade.

**Architecture:** Một file JSON là nguồn sự thật cho layout và provenance. Lua/Aseprite đọc JSON để tạo `.aseprite`, preview phẳng, nền runtime và từng PNG công trình; React/Canvas đọc cùng metadata để render, hit test alpha và điều khiển camera. Logic camera và mask là hàm thuần có unit test; React chỉ điều phối pointer, frame và điều hướng.

**Tech Stack:** Aseprite 1.3.18 CLI + Lua, React 19, TypeScript, Canvas 2D, CSS Modules, Node test runner, Playwright/Edge dùng từ môi trường kiểm thử hiện có.

**Spec:** `SPEC-sprite-farm-map.md`

## Global Constraints

- Chỉ đọc pixel từ `art/png/s01-horse.png`, `s06-people.png`, `s07-stall.png`, `s08-farm.png`, `s10-arena.png`, `s11-icons.png`, `s13-fx.png`, `s14-rider.png`, `s15-vehicles.png`.
- Pipeline map chỉ crop/copy/place nguyên tỉ lệ; không vẽ primitive, scale, rotate, text hoặc dùng ảnh concept.
- World cố định 2048 × 1536, lưới 32 px; cần hỏi trước nếu thay đổi.
- Chỉ có ban ngày; xóa toàn bộ nhánh và UI ban đêm.
- Không thêm dependency mới.
- Mọi màu CSS mới đi qua `src/ui/tokens.css`.
- Không thay đổi nghiệp vụ Medical Lock hoặc các màn hình mô phỏng phía sau.
- Workspace hiện không có Git repository hoạt động; mỗi task dùng checkpoint test/build thay cho commit.

## Dependency Graph

```text
layout + provenance contract
        │
        ├── Aseprite compositor + generated map assets
        │          │
        │          └── day-only runtime renderer
        │                         │
camera model ─────────────────────┤
alpha hit/outline model ──────────┤
                                  └── FarmHub integration
                                              │
                                              └── browser verification + cleanup
```

## Review Focus

1. Pointer di chuyển đúng 6 px phải được coi là drag và tuyệt đối không điều hướng — Task 4 có test biên 5.99/6 px.
2. Viewport lớn hơn world không được tạo camera âm hoặc lộ nền — Task 4 có test viewport quá khổ.
3. Pixel trong suốt nằm trong bounding box không được hover/click — Task 5 có alpha test ở mép trong suốt.
4. Hai công trình chồng bounding box phải chọn pixel hữu hình trên layer trên cùng — Task 5 có test thứ tự z.
5. Pipeline không được lén lấy concept hoặc tạo màu mới bằng primitive — Task 1 kiểm provenance; Task 2 kiểm script và palette đầu ra.

---

### Task 1: Khóa layout và nguồn pixel được phép

**Files:**
- Create: `art/map/farm-layout.json`
- Create: `src/hub/farmLayout.ts`
- Create: `src/hub/farmLayout.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `FARM_WORLD`, `FARM_OBJECTS`, `FARM_PLACEMENTS`, `validateFarmLayout()`.
- JSON placement gồm `sheet`, `src: {x,y,w,h}`, `dest: {x,y}`, `layer`; object tương tác thêm `id`, `target`, `focus`, `z`.

- [ ] Viết test thất bại xác nhận world 2048 × 1536, mọi placement dùng một trong chín sheet cho phép, src/dest nằm trong biên, không ID trùng và không có key day/night.
- [ ] Thêm test thất bại xác nhận object tương tác có target hợp lệ `STALL|TRACK|VET|OFFICE`, focus nằm trong world và layer/z xác định.
- [ ] Chạy `npm test` và quan sát FAIL vì module/layout chưa tồn tại.
- [ ] Tạo layout JSON cùng adapter/validator TypeScript tối thiểu; cập nhật script test thành `node --test` để tự tìm mọi `*.test.ts`.
- [ ] Chạy `npm test`; yêu cầu toàn bộ suite xanh.

**Checkpoint:** Layout có thể được review độc lập trước khi sinh bất kỳ ảnh map nào.

### Task 2: Tạo map bằng Aseprite CLI chỉ với thao tác copy

**Files:**
- Create: `art/aseprite/build-farm-map.lua`
- Create/generated: `art/aseprite/farm-day.aseprite`
- Create/generated: `art/preview/farm-day-x1.png`
- Create/generated: `public/assets/maps/farm-ground.png`
- Create/generated: `public/assets/maps/objects/*.png`

**Interfaces:**
- Consumes: `art/map/farm-layout.json` và chín sheet `art/png/*.png` được phép.
- Produces: source nhiều layer, preview phẳng, ground runtime và một ảnh RGBA khít cho mỗi object tương tác.

- [ ] Thêm kiểm tra contract thất bại vào `farmLayout.test.ts`: script phải khai báo allowlist và không chứa API primitive/scale/rotate/text bị cấm.
- [ ] Chạy `npm test`; quan sát FAIL vì script chưa tồn tại.
- [ ] Viết Lua đọc JSON, crop `Image(source, Rectangle(...))`, rồi `drawImage`/cel copy nguyên kích thước vào layer đích; không dùng primitive tạo pixel.
- [ ] Chạy Aseprite CLI theo đúng command trong spec để sinh các output.
- [ ] Thêm kiểm tra palette provenance: mọi RGBA khác trong suốt của các PNG sinh ra phải thuộc tập RGBA của chín sheet nguồn.
- [ ] Chạy lại CLI lần hai và so SHA-256 output PNG giữa hai lần; yêu cầu deterministic.
- [ ] Mở `art/preview/farm-day-x1.png` để kiểm tra không có khoảng trống, seam rõ hoặc phần tử nằm ngoài canvas.

**Checkpoint:** Người dùng có thể xem riêng bản map phẳng sinh từ sprite trước khi nối runtime.

### Task 3: Renderer ban ngày không phụ thuộc concept

**Files:**
- Create: `src/render/farmAssets.ts`
- Create: `src/render/farmScene.ts`
- Modify: `src/render/sprites.ts`
- Modify: `src/hub/ambient.ts`
- Test: `src/render/farmScene.test.ts`

**Interfaces:**
- Produces: `loadFarmAssets(): Promise<FarmAssets>` và `drawFarmScene(ctx, assets, layout, time)`.
- `FarmAssets` chứa ground, object images và các sheet động; không có `day`, `night` hoặc concept URL.

- [ ] Viết test thất bại xác nhận danh sách URL runtime không chứa `/assets/concept/`, `night`, `i22.jpg` hoặc `i23.jpg`.
- [ ] Viết test thất bại xác nhận draw order là ground → object theo z → actor/fx sprite.
- [ ] Chạy `npm test`; quan sát FAIL vì loader/renderer chưa tồn tại.
- [ ] Cài loader và renderer tối thiểu từ generated PNG + sheet chính thức.
- [ ] Thu gọn `ambient.ts`: chỉ animate horse/rider/people/vehicles/fx từ sheet; xóa toàn bộ primitive butterfly, bird, cloud, glow và night.
- [ ] Chạy `npm test` và `npm run typecheck`.

### Task 4: Camera kéo, clamp và focus tween

**Files:**
- Create: `src/hub/camera.ts`
- Create: `src/hub/camera.test.ts`
- Create: `src/hub/useFarmCamera.ts`

**Interfaces:**
- Produces: `clampCamera(camera, viewport, world)`, `classifyPointerGesture(start, current, threshold = 6)`, `cameraForFocus(focus, viewport, world)`, `interpolateCamera(from, to, progress)` và hook pointer controller.

- [ ] Viết test thất bại cho clamp bốn biên, viewport lớn hơn world, focus gần mép và camera center.
- [ ] Viết test thất bại: 5.99 px = click; 6 px = drag; sau drag không phát click.
- [ ] Viết test thất bại cho tween tại progress 0, 0.5, 1 và reduced-motion.
- [ ] Chạy focused test và quan sát FAIL vì API chưa tồn tại.
- [ ] Implement các hàm thuần tối thiểu, sau đó hook dùng Pointer Events và pointer capture.
- [ ] Chạy `npm test` và `npm run typecheck`.

### Task 5: Alpha hit testing và outline silhouette

**Files:**
- Create: `src/hub/pixelHitTest.ts`
- Create: `src/hub/pixelHitTest.test.ts`
- Create: `src/render/silhouette.ts`
- Create: `src/render/silhouette.test.ts`

**Interfaces:**
- Produces: `hitTestObjects(point, camera, objects, masks)`, `dilateAlpha(alpha, width, height, radius)`, `outlineAlpha(...)`.
- Hit test duyệt object theo z giảm dần, bounding-box reject trước, alpha reject sau.

- [ ] Viết test thất bại cho pixel trong suốt/hữu hình, camera offset, ngoài bounds và hai object chồng nhau theo z.
- [ ] Viết test thất bại cho mask 3 × 3: outline chỉ xuất hiện ngoài alpha gốc, không phủ nội thất.
- [ ] Chạy focused test và quan sát FAIL vì module chưa tồn tại.
- [ ] Implement hit test và dilation trên `Uint8ClampedArray`; cache mask theo object image sau khi load.
- [ ] Chạy `npm test` và `npm run typecheck`.

**Checkpoint:** Camera và hit testing đều xanh độc lập trước khi nối React.

### Task 6: Tích hợp FarmHub và chuỗi focus → fade → navigate

**Files:**
- Create: `src/ui/FarmMapCanvas.tsx`
- Modify: `src/ui/FarmHub.tsx`
- Modify: `src/ui/FarmHub.module.css`
- Modify: `src/ui/App.tsx`
- Modify: `src/ui/App.module.css`

**Interfaces:**
- Consumes: Task 1–5.
- Produces: HUB tương tác chỉ có map, callbacks `onHoverObject` và `onActivateObject`; `App.go()` chỉ bắt đầu fade sau khi camera focus callback hoàn tất.

- [ ] Viết test/harness tối thiểu xác nhận click nền không gọi `onEnter`, drag không gọi `onEnter`, click object gọi đúng target một lần.
- [ ] Chạy test và quan sát FAIL với FarmHub cũ.
- [ ] Thay FarmHub bằng viewport Canvas, resize observer, pointer controller, alpha hover và keyboard object navigation.
- [ ] Xóa HUD tạm, map tools ngày/đêm, polygon SVG và zone yellow fill.
- [ ] Kết nối chuỗi khóa input → tween 550–750 ms → fade App → `onEnter`; reduced motion giữ thứ tự nhưng rút thời gian.
- [ ] Chạy `npm test`, `npm run typecheck`, `npm run build`.

### Task 7: Xóa legacy night/concept và kiểm thử trình duyệt

**Files:**
- Modify: `README.md`
- Delete if unused: `src/hub/farmDashboard.ts`
- Delete if unused: `src/hub/farmDashboard.test.ts`
- Modify/delete if replaced: `src/hub/zones.ts`
- Modify: `src/ui/tokens.css`

**Interfaces:**
- Consumes: HUB hoàn chỉnh từ Task 6.
- Produces: tài liệu và codebase chỉ còn sprite-day map; không có đường tải concept/night.

- [ ] Chạy `rg -n "NIGHT|night|timeOfDay|assets/concept|i22.jpg|i23.jpg" src README.md` và loại mọi kết quả thuộc HUB/loader.
- [ ] Cập nhật README với lệnh Aseprite CLI, generated outputs, camera và quy tắc sprite-only.
- [ ] Chạy Playwright/Edge ở 768 × 1024, 1024 × 768, 1440 × 900: kéo bốn hướng, drag-over-object, blank click, transparent-edge hover, visible hover, click-transition.
- [ ] Ghi lại console, failed requests và network URLs; yêu cầu 0 lỗi, 0 request `/assets/concept/`.
- [ ] Chụp screenshot map ban ngày ở 1440 × 900 để người dùng duyệt.
- [ ] Chạy mới toàn bộ `npm test`, `npm run typecheck`, `npm run build` và lệnh Aseprite build map.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Sheet hiện có thiếu tile chuyển tiếp để phủ map lớn mà không seam | Cao | Dùng lặp có chủ đích và bố trí decor che seam; không tự vẽ bù. Nếu vẫn không đạt, dừng xin duyệt sprite bổ sung. |
| Lua JSON/API khác giữa bản Aseprite | Trung bình | Chạy script smoke sớm ở Task 2; giữ cú pháp tương thích 1.3.18. |
| Object PNG lớn làm alpha hit test chậm | Trung bình | Crop khít, cache alpha một lần và bounding-box reject trước. |
| Click bị phát sau drag | Cao | Pure gesture classifier + pointer capture + test đúng ngưỡng 6 px. |
| Generated PNG vô tình tạo màu mới do scale/blend | Cao | Cấm scale/rotate, copy integer coordinates, kiểm palette provenance và deterministic SHA. |

## Open Questions

Không có. Nếu map không thể phủ kín đẹp chỉ bằng sprite hiện tại, execution phải dừng để xin duyệt asset bổ sung thay vì tự vẽ.

## Self-review

- Spec coverage: đủ pipeline Aseprite, provenance, day-only, camera, alpha hover, transition, accessibility và browser verification.
- Dependency order: layout → generated assets/renderer; camera và alpha độc lập; React tích hợp sau cùng.
- Task size: mỗi task tối đa 5 source/test files, generated output được xem là một artifact set.
- Type consistency: layout/object/camera/mask APIs được định nghĩa một lần tại task cung cấp và chỉ được consume ở task sau.
- Review focus: cả năm rủi ro đầu vào đều có test hoặc browser check tương ứng.
