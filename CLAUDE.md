# CLAUDE.md — EquiFlow (SWP391)

> **`AGENTS.md` là quy tắc gốc (Level 1) và luôn thắng file này.** File này tóm tắt để vào việc nhanh và bổ sung phần **Simulator Web** mà AGENTS.md chưa có.
> Đọc thêm trước khi code: `CONSTRAINTS.md` (ngưỡng chất lượng, không được hạ), `TECH_STACK.md`, `Tai_Lieu/AI_PROJECT_CONTEXT_INDEX.md`, `HANDOVER.md` (trạng thái bàn giao mới nhất).

## 1. Thư mục gốc gồm gì

| Thư mục | Vai trò | Git |
|---|---|---|
| `Racehorse_Training_Management_System_MT_BE/` | Backend NestJS 11 + Prisma 6 + PostgreSQL (Docker) | **repo riêng** |
| `Racehorse_Training_Management_System_MT_FE/` | Main Web: React 19 + Vite 8 + React Router 7 | **repo riêng** |
| `Racehorse_Simulator_Web/` | Simulator Web (Digital Twin / IoT ảo), pixel art Canvas 2D, giao diện kiểu Hay Day | **chưa có git** |
| `horse simulation model/` | SRS & Design Handoff v2.0 của Simulator (PDF) + bản chat concept (ảnh tham khảo) | — |
| `Tai_Lieu/`, `docs/`, `srsv4.txt` | Đặc tả nghiệp vụ. `docs/EquiFlow_TaiLieu_BanGiao_MoHinhGiaLap_3GiaiDoan.md` đã **OUTDATED** (thay bằng SRS v2.0) | — |
| `start.bat` / `stop.bat` / `setup-db.bat` | Chạy/dừng BE + FE, dựng DB (không chạy Simulator) | — |

Thư mục gốc **không** phải git repo: commit trong từng repo con.

## 2. Tech stack

| Phần | Công nghệ |
|---|---|
| BE | NestJS ^11, Node ≥ 20.19, TypeScript strict, Prisma 6, PostgreSQL, JWT (access 15 phút trong bộ nhớ, refresh 7 ngày HttpOnly cookie), RBAC 5 vai trò, REST `/api`, Swagger `/api/docs`, cổng 3000 |
| Main Web | React 19.2, Vite 8, TypeScript, React Router 7, CSS thuần + CSS Modules, **không** Tailwind/UI kit, i18n Việt–Anh qua `tr()` |
| Simulator | React 19.2, Vite 8 (cổng **5174**), TypeScript ~6.0 (strict, `erasableSyntaxOnly`, `allowImportingTsExtensions`), Canvas 2D, CSS Modules; test bằng `node --test` (Node 24 chạy thẳng `.ts`). Sprite vẽ bằng code → đóng gói `.aseprite` qua Aseprite CLI (exe nằm ngoài repo, không commit) |

## 3. Lệnh chuẩn (đã đối chiếu `package.json`)

**BE** (`Racehorse_Training_Management_System_MT_BE/`)
```bash
npm run start:dev      # dev
npm run typecheck
npm run lint           # eslint --max-warnings=0
npm run test:unit
npm run test:e2e
npm run db:up          # docker compose up -d
npm run db:setup       # prisma db push + seed
```

**Main Web** (`Racehorse_Training_Management_System_MT_FE/`)
```bash
npm run dev            # cổng 5173
npm run typecheck
npm run lint           # oxlint
npx playwright test
```

**Simulator** (`Racehorse_Simulator_Web/`) — không có lint script; cổng chất lượng là typecheck + test + verify:map
```bash
npm run dev            # http://localhost:5174
npm run typecheck
npm test               # node --test: engine, layout, camera, hit-test, đường đi, kho, renderer
npm run build
npm run verify:map     # chỉ cần khi đổi bản đồ
```
Dựng lại bản đồ (khi sửa `art/map/gen-layout.ts`):
```bash
node art/map/gen-layout.ts
aseprite -b --script-param root=<đường dẫn Racehorse_Simulator_Web> --script art/aseprite/build-farm-map.lua
npm run verify:map
```
Trên Windows, gọi Aseprite bằng `Start-Process -NoNewWindow -Wait` (gọi bằng `&` trong PowerShell thì không ghi ra file).

## 4. Quy ước bắt buộc

### Chung (từ AGENTS.md / CONSTRAINTS.md)
- Bất biến nghiệp vụ: `RULE-MED-01` (khóa y tế chặn đua và bài nặng), `RULE-RBAC-01` (phạm vi dữ liệu theo vai trò), `RULE-AI-01` (AI chỉ gợi ý, không tự đổi dữ liệu), `RULE-CONC-01` (trừ kho, đăng ký giải đấu dùng transaction). Không đổi khi chưa có người duyệt.
- Spec và code mâu thuẫn → **dừng và hỏi**, không tự chọn.
- Không hạ `CONSTRAINTS.md` để cho qua kiểm tra.

### BE
- Envelope: thành công `{ statusCode, success: true, data, timestamp }`; lỗi `{ statusCode, success: false, error, code, message, timestamp, path, method }`.
- DTO luôn có `class-validator` + `class-transformer`. Guard toàn cục `JwtAuthGuard` + `RolesGuard`; decorator `@Public()`, `@Roles()`, `@CurrentUser()`.

### Main Web
- Mọi màu, bo góc, cỡ chữ, khoảng cách lấy từ `src/shared/styles/tokens.css`; không hardcode hex.
- Mọi chữ hiển thị bọc `tr("English")` và khai báo trong `src/shared/i18n/vi-text.ts` (không trùng khóa).
- Component hàm + hooks, named export, CSS Module đặt cạnh component. Mock/real API qua `VITE_USE_MOCK`.

### Simulator Web
- **Phong cách riêng, không dùng token của Main Web.** Token ở `src/ui/tokens.css`; mọi màu mới phải thêm token ở đó.
- **Giao diện cho người dùng phổ thông kiểu Hay Day:** bản đồ là màn chính; chuồng, phòng khám, kho mở bằng `Popup` (dựa trên `<dialog>` gốc); chỉ Đường đua là màn riêng. Không hiện chữ kỹ thuật (mã SIM-xx, tên sự kiện `sim:*`, JSON). Chữ hiển thị viết thẳng tiếng Việt (Simulator không dùng `tr()`).
- **Gói tin vẫn phải publish** qua `src/sim/bus.ts` với tên sự kiện đúng SRS §8 (`sim:telemetry_tick`, `sim:incident_report`, `sys:medical_lock_sync`, …) để sau này thay bằng Socket.IO.
- **Không tự động khóa y tế:** sự cố chỉ gửi `sim:incident_report`; khóa/gỡ khóa là thao tác bấm của người.
- **Logic thuần tách khỏi DOM** (`src/hub/camera.ts`, `paths.ts`, `farmLayout.ts`, `src/sim/*`, `src/render/farmScene.ts`): không import module chạm DOM/canvas. Test import kèm đuôi `.ts`, vì Node không tự tìm file `.ts` khi import không có đuôi.
- **Logic mới không tầm thường phải có test** `*.test.ts` đặt cạnh file.
- **Bản đồ chỉ crop/copy/place sprite đã duyệt** (không vẽ primitive, scale, rotate, chèn chữ, không dùng ảnh concept). `verify:map` kiểm điều này.
- Sprite: ô 32×32, sheet 6×6 = 192×192, nền trong suốt, chân y = 30, đúng bảng màu SRS §12; đổi màu bằng `src/render/palette.ts`.
- Mọi hiệu ứng có nhánh `prefers-reduced-motion` (chỉ còn mờ dần).
- Font: chữ có dấu tiếng Việt dùng VT323; Silkscreen không có dấu, chỉ dùng cho chữ ASCII.
- **Mã chip ngựa:** `microchip` là 15 chữ số (ISO 11784/11785), khớp ràng buộc BE `/^\d{15}$/`; Simulator tự sinh `985141` + 9 số trong `src/sim/horses.ts` và gửi đi dưới tên `microchip_id` (`horseRef` trong `packets.ts`). Không hiện mã chip trên UI. Khóa nội bộ luôn là `horse_id`, không phải mã chip. Simulator chưa có `rfid`; khi nối API phải tôn trọng việc BE che mã chip với GROOM (chỉ 4 số cuối). Chi tiết: `HANDOVER.md` mục "Mã chip ngựa".
- Không thêm dependency khi chưa hỏi.

## 5. Cấu trúc Simulator (`Racehorse_Simulator_Web/`)

| Đường dẫn | Nội dung |
|---|---|
| `src/sim/` | `engine.ts` (telemetry), `packets.ts` (gói SRS §9), `bus.ts` (bus cục bộ), `horses.ts`, `inventory.ts` (kho) |
| `src/hub/` | `farmLayout.ts` (đọc layout sinh sẵn), `camera.ts` (clamp/zoom/quán tính), `paths.ts` (đường đi ngựa/xe tải, thuần), `ambient.ts` (vẽ nhân vật + đêm), `useFarmCamera.ts`, `pixelHitTest.ts` |
| `src/render/` | Nạp sprite, đổi màu, `farmScene.ts`, `scenes.ts` (chuồng/đua), `silhouette.ts` |
| `src/ui/` | `App`, `FarmHub` (HUD), `FarmMapCanvas`, `Popup`, `HorseCard`, `HorseList`, `HorsePicker`, `StallTab`, `VetZone`, `SupplyPanel`, `TrialTab`, `RaceTab`, `AssetOverview` (`/?dev`) |
| `art/gen/` | Script vẽ sprite bằng code → `art/png`, `public/assets/sprites` |
| `art/map/gen-layout.ts` → `farm-layout.json` | Bố cục bản đồ 40×24 ô (1280×768), kiểu M1 |
| `art/aseprite/*.lua` | Build `.aseprite` + PNG bản đồ |
| `tasks/plan-hayday.md`, `tasks/todo-hayday.md` | Kế hoạch giao diện Hay Day (T1–T12; T10 còn 2 ô chưa làm, xem HANDOVER.md) |
