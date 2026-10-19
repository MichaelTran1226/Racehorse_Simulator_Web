# HANDOVER — EquiFlow Simulator Web (phiên 18–19/10/2026)

> Phạm vi phiên này: **chỉ `Racehorse_Simulator_Web/`**. BE và Main Web **không bị sửa** (cả hai repo `git status` sạch).
> Quy tắc dự án: `AGENTS.md` → `CLAUDE.md` → `CONSTRAINTS.md`.

## 0. Việc phải làm NGAY trước khi chia sẻ thư mục

1. **`Racehorse_Simulator_Web/claude_data/` chứa bản xuất lịch sử chat cá nhân** (`conversations.json`, nhiều file `.zip`). Xóa hoặc chuyển ra ngoài trước khi gửi thư mục cho người khác hay đưa lên git.
2. **Simulator chưa có git.** Toàn bộ công việc của phiên chỉ nằm trên ổ đĩa. Cần `git init` (hoặc đưa vào repo nhóm) với `.gitignore` gồm `node_modules/`, `dist/`, `claude_data/`, `*.zip`. Không commit `aseprite.exe`.
3. Các file rác trong `Racehorse_Simulator_Web/`: `dashboard-preview.png`, `manifest-…-2026-10-18-19-18-01.json` (sinh ra khi thử ChatGPT). Xóa được sau khi người phụ trách xác nhận.

## 1. Current State & Completed

Kiểm tra lần cuối (19/10/2026): `npm run typecheck` sạch · `npm test` **48/48 đạt** · `npm run build` đạt · `npm run verify:map` đạt · kiểm tra Chromium headless không có lỗi console hoặc request thất bại; hai ảnh Canvas cách nhau 1 giây khi Pause có cùng SHA-256.

| Phần | Trạng thái | File chính |
|---|---|---|
| Bộ sprite chính thức (S01 ngựa, S14 nài, S07/S08/S10 bản đồ, S06 người, S15 xe, S13 hiệu ứng, S11 biểu tượng) vẽ bằng code → `.aseprite` | Xong, người dùng đã duyệt 4 đợt | `art/gen/*.ts`, `art/aseprite/*.lua`, `public/assets/sprites/` |
| Đề xuất S16 sinh vật môi trường (Chim, Mèo, Bướm, Cờ gió), ô 32×32, sheet 192×192, baseline y=30 | **Chưa duyệt**; chỉ giữ preview, không có trong runtime | `art/gen/ambient-life.ts`, `art/preview/s16-ambient-life-*.png` |
| Bản đồ trang trại 1280×768 theo bố cục M1, ghép từ sprite đã duyệt + 14 vật phẩm tĩnh không lấn hành lang | Đã rebuild; hash layout bảo vệ khỏi PNG cũ | `art/map/gen-layout.ts`, `art/map/farm-layout.sha256`, `public/assets/maps/` |
| Màn chính kiểu Hay Day: bản đồ phủ kín, HUD 4 góc (giờ, ngày/đêm, bộ đếm ngựa/sự cố/khóa y tế/kho sắp hết, nút Ngựa/Kho/Tốc độ) | Xong (T1) | `src/ui/FarmHub.tsx` |
| Camera: kéo + quán tính, lăn chuột phóng quanh con trỏ, lướt tới công trình, phóng sát vào Đường đua và lùi ra khi quay về | Xong (T1, T7, T11) | `src/hub/camera.ts`, `useFarmCamera.ts`, `src/ui/FarmMapCanvas.tsx` |
| Bảng nổi dùng chung (nảy mở/thu đóng, Esc, giữ focus, trả focus) | Xong (T2) | `src/ui/Popup.tsx` |
| Ẩn chữ kỹ thuật, gỡ bảng gói tin; bus vẫn publish gói SRS | Xong (T3) | `src/sim/bus.ts`, `packets.ts` |
| Thẻ ngựa + Đàn ngựa; gắn ngựa thật tại 2 ô bãi thả và 7 ô cửa chuồng mở (không đổi màu hay nhảy ô khi khóa y tế) | Xong (T4, T13); cửa chuồng đã mở rộng để đầu ngựa dễ đọc hơn | `HorseCard.tsx`, `HorseList.tsx`, `src/hub/farmPopulation.ts`, `src/render/stableHorses.ts` |
| Khu chuồng, Phòng khám thành bảng nổi | Xong (T5, T6) | `StallTab.tsx`, `VetZone.tsx` |
| Đường đua (Chạy thử 1 ngựa, Đua 6 làn), chọn ngựa bằng chân dung | Xong (T7) | `TrialTab.tsx`, `RaceTab.tsx`, `HorsePicker.tsx` |
| Kho vật tư: mô hình tồn kho, bảng Kho, xe tải giao hàng, icon bay vào kho, số đếm | Xong (T8–T10) | `src/sim/inventory.ts`, `SupplyPanel.tsx`, `paths.ts` (`truckPose`) |
| Hệ thống chuyển động nền & giảm chuyển động (`prefers-reduced-motion` & `?reducedMotion=1`): đứng yên ở khung chuẩn, tắt bụi, barrow dừng khi hết cỏ/tạm dừng | Xong; Pause giữ nguyên tọa độ bằng đồng hồ ambient tích lũy | `src/hub/ambientScene.ts`, `src/hub/ambient.ts`, `FarmMapCanvas.tsx` |
| Bốn hướng phong cách map (cao nguyên Việt Nam, điền trang châu Âu, đồng quê truyện tranh, sinh thái hiện đại) | Preview-only, chờ người dùng chọn; không dùng làm nguồn sprite | `docs/design/map-style-proposals.md`, `art/preview/map-style-directions.png` |
| Telemetry engine (gait, nhịp tim, thể lực, mặt sân, tình trạng sân, chướng ngại, đua nhiều ngựa) | Xong từ trước, có test | `src/sim/engine.ts` |

### Mã chip ngựa (microchip / RFID)

| | Simulator (hiện tại) | Backend (nguồn chuẩn khi nối dữ liệu) |
|---|---|---|
| Trường | `HorseProfile.microchip` (`src/sim/engine.ts:37`) | `Horse.microchip` (`String? @unique`), `Horse.rfid` (`String? @unique`), `Horse.microchipRfid` (`@unique`, cột cũ, BE gán bằng `microchip` khi tạo) — `prisma/schema.prisma:344-346` |
| Định dạng microchip | 15 chữ số ISO 11784/11785: `985141` + 9 số ngẫu nhiên (`src/sim/horses.ts:69`) | Đúng 15 chữ số `/^\d{15}$/` (`create-horse.dto.ts`); không nhập thì tự sinh `985` + 12 số, kiểm tra trùng (`horses.service.ts` `generateMicrochip`) |
| RFID | **Chưa có** | `RFID_RE = /^[A-Z0-9-]{4,32}$/`, tự viết hoa; không nhập thì tự sinh `RFID-XXXXXX####` |
| Trùng mã | Không kiểm (dữ liệu mẫu, seed cố định) | 409 `DUPLICATE_MICROCHIP`; nếu trùng hồ sơ đã xóa thì yêu cầu khôi phục thay vì tạo mới |
| Phân quyền | Không có | GROOM chỉ thấy 4 số cuối (`maskMicrochip`), áp cho cả `microchipRfid` |
| Trong gói tin | `horse.microchip_id` của mọi gói có `horseRef` (`src/sim/packets.ts:14`), theo SRS §9 | — |
| Hiển thị | **Không hiện trên UI** (chữ kỹ thuật, theo ADR-7). Icon "chip RFID" có trong S11 (`art/gen/fx-icons.ts:352`) nhưng chưa dùng | Main Web hiện ở danh sách/chi tiết/form ngựa, hồ sơ y tế |

Khi nối dữ liệu (mục 6, bước 6): lấy `microchip` từ API thay vì tự sinh, giữ nguyên chuỗi đã bị che với GROOM (không cố "giải mã"), và không dùng `microchip_id` làm khóa nội bộ — khóa vẫn là `horse_id`.

## 2. In-Progress & Uncommitted

- **Uncommitted:** toàn bộ `Racehorse_Simulator_Web/` (trên nhánh `feature/farm-map-life-and-ambient-content`).
- **Chờ duyệt:** Chọn một hướng trong `art/preview/map-style-directions.png`. S16 cũ vẫn chỉ là preview và chưa được phép vào runtime.
- **Kế hoạch cũ chưa đóng:** `tasks/plan.md` (42 ô chưa tích) và `tasks/todo.md` (9 ô) là kế hoạch bản đồ 2048×1536, bỏ ban đêm, do ChatGPT viết. Kế hoạch này **đã bị thay** bằng bản đồ M1 1280×768 có ngày/đêm, nhưng chưa được lưu trữ vì cần người dùng đồng ý. Đừng làm theo nó. `SPEC-sprite-farm-map.md` cũng thuộc hướng cũ đó (yêu cầu "chỉ crop/copy" vẫn còn đúng).
- **Giới hạn đã ghi trong code (`shortcut:`):**
  - `src/sim/inventory.ts:15`: tốc độ tiêu hao được tăng tốc cho demo (cỏ khô cạn sau khoảng 5 phút ở 1×). Khi nối kho thật thì thay bằng định mức/ngày.
  - `src/ui/FarmMapCanvas.tsx:22`: zoom không nguyên (×1.15, ×1.5) làm pixel không đều. Nếu nhìn thấy rõ thì đổi sang bước nguyên.
- **Những gì chưa làm:** mức zoom không được nhớ khi quay lại trang trại. Nhãn tên ngựa chỉ có ở 2 con trong bãi thả, số còn lại xem qua Chuồng/Đàn ngựa. Kho không ảnh hưởng sức khỏe ngựa (cố ý, theo quyết định).
- **Tình trạng các lỗi tìm thấy ở review trước (19/10):**
  - *Quan trọng:*
    1. `src/ui/FarmMapCanvas.tsx` `drawDelivery`: **ĐÃ SỬA** (hỗ trợ giảm chuyển động, bỏ icon bay, chỉ tăng số).
    2. `src/hub/ambient.ts` (xe cút kít): **ĐÃ SỬA** (`barrowActive`: dừng khi kho hết cỏ hoặc tạm dừng hoặc giảm chuyển động).
    3. `src/ui/FarmHub.tsx` & `farmPopulation.ts`: **ĐÃ SỬA** (ổn định danh tính ngựa bãi thả và chuồng theo `id`, không nhảy ô khi đổi trạng thái y tế).
    4. `src/ui/App.tsx` (interval kho): tính tiêu hao theo số lần tick, không theo thời gian thực đã trôi, nên tab bị ẩn thì kho ngừng vơi. Cần lưu mốc thời gian lần trước và dùng thời gian thực × tốc độ, có giới hạn trên.
  - *Nhỏ còn lại:*
    - `Popup.tsx`: `onClose` truyền inline bị tạo lại mỗi 0,5 giây nên đếm giờ đóng bị khởi động lại; cần giữ `onClose` trong ref.
    - `Popup.tsx`: bôi đen chữ rồi thả chuột ra ngoài bảng sẽ đóng bảng.
    - `FarmMapCanvas.tsx`: canvas có `tabIndex=0` nhưng không xử lý phím nào.
    - Ô chuồng phải bấm thêm "Xem thẻ ngựa" mới mở thẻ (plan T5 nói chạm ô là mở thẻ); lưới chuồng chỉ bấm được bằng chuột.
    - Một số màu hex viết cứng trong canvas (`drawRoofTag`, `ambient.ts`).
    - Chú thích trong `ambient.ts` còn nhắc "văn phòng".
    - Hiệu ứng `glide` không hủy rAF khi unmount.
- **Mâu thuẫn chưa xử lý:** `CONSTRAINTS.md` RULE-MED-02 nói chấn thương nặng sẽ **tự động** tạo MedicalRecord và bật MedicalLock. Ngày 18/10/2026 người dùng quyết định Simulator **không** tự khóa (chỉ báo sự cố, bác sĩ thú y quyết định). CONSTRAINTS.md chưa được cập nhật. Nhóm cần chốt và sửa văn bản; không tự ý sửa trong code.

## 3. Architectural Decisions (ADR)

| # | Quyết định | Lý do | Phương án bị loại |
|---|---|---|---|
| ADR-1 | SRS & Design Handoff **v2.0** là nguồn chuẩn: Simulator là web riêng, Canvas 2D pixel art | Người dùng chốt 18/10; v2.0 mới hơn tài liệu "3 giai đoạn" | Godot WASM, Three.js; tài liệu 3GiaiDoan (đánh dấu OUTDATED) |
| ADR-2 | **UI trước, nối dữ liệu sau.** Mọi dữ liệu chạy trên bus cục bộ với tên sự kiện đúng SRS §8 | Cần bản trình diễn được trước khi nối NestJS; đổi bus sang Socket.IO sẽ không phải sửa UI | Nối Socket hub ngay từ đầu |
| ADR-3 | **Không tự động khóa y tế.** Sự cố → `sim:incident_report` → hệ thống báo các actor quản lý; bác sĩ thú y nhận cảnh báo cho mọi ngựa trên sân/trong chuồng | Quyết định của người dùng 18/10, đúng RULE-AI-01 (máy không tự đổi trạng thái) | Tự bật MedicalLock theo RULE-MED-02 (xem mâu thuẫn ở mục 2) |
| ADR-4 | **Vẽ lại toàn bộ sprite bằng code**, đóng gói `.aseprite` | Ảnh concept AI bị chồng hình, cắt nửa, sai kích thước; người dùng muốn bản "chính thức" sửa được trong Aseprite | Cắt/thu nhỏ ảnh concept JPEG |
| ADR-5 | Bản đồ **chỉ crop/copy/place** từ sprite đã duyệt, kiểm bằng `verify:map` | Giữ đúng provenance màu, không lẫn ảnh concept | Vẽ primitive/scale/rotate trong Lua; ảnh nền M1/M2 |
| ADR-6 | Bản đồ **1280×768, bố cục M1**, kéo + lăn chuột (mặc định ×1.5) | Người dùng thấy bản 2048×1536 quá rộng và thưa; muốn dày đặc như M1 | Bản 2048×1536 của ChatGPT; ×2 cố định |
| ADR-7 | **Giao diện Hay Day cho người dùng phổ thông** (19/10): bản đồ là màn duy nhất, các khu là bảng nổi, chỉ Đường đua có màn riêng, ẩn chữ kỹ thuật, bỏ Văn phòng CLB | Người xem là hội đồng/chủ ngựa/groom, không phải dev; thông tin ngựa là trọng tâm | Header + cột "Các khu vực" + trang riêng cho từng khu |
| ADR-8 | Giữ sprite pixel, chỉ đổi lớp UI (nút/bảng bo tròn, phồng) | Sprite vừa duyệt xong, có `.aseprite` | Vẽ lại kiểu hoạt hình như Hay Day |
| ADR-9 | `Popup` dùng **`<dialog>` gốc** + `showModal()` | Trình duyệt lo giữ focus, Esc, trả focus và `::backdrop`; ít code, đúng a11y | Tự viết modal |
| ADR-10 | Logic thuần tách khỏi DOM, test bằng `node --test` (không thêm Jest/Vitest) | Không thêm dependency; Node 24 chạy thẳng `.ts` | Thêm framework test |
| ADR-11 | Kho tiêu hao theo **thời gian mô phỏng**, xe tải chạy theo **đồng hồ thật** | Ở 60× một chuyến 10 giây mô phỏng chỉ kéo dài 0.17 giây thật, không kịp nhìn | Xe tải theo thời gian mô phỏng |
| ADR-12 | Đơn đặt khi xe đang tới thì **đi chung chuyến** | Tránh nhiều xe chồng lên nhau trên cùng một con đường | Mỗi đơn một xe |

## 4. Failed Approaches — ĐỪNG lặp lại

| Đã thử | Vì sao hỏng | Cách đúng |
|---|---|---|
| Ghép ảnh concept AI (M1/M2) làm nền + hoạt ảnh chồng lên | Hoạt ảnh bị cứng, che thông tin khi hover, sprite đua bị cắt nửa | Vẽ lại sprite (ADR-4) và dựng bản đồ từ sprite (ADR-5) |
| Bản đồ 2048×1536 hiển thị ×2 (ChatGPT) | Quá rộng, thưa, tràn màn hình, không giống M1 | 1280×768 bố cục M1 (ADR-6) |
| Cache sprite đã đổi màu theo khóa `coat:silk` dùng chung cho S01 và S14 | Hai sheet trùng khóa nên sprite đua bị cắt nửa | `WeakMap` theo từng canvas sheet (`src/render/sprites.ts` `tinted`) |
| Viết code chứa `$` hoặc backtick qua heredoc/`node -e "…"` trong Bash | Shell nuốt `${…}`/backtick, sinh code rỗng (vd. `className={}`) hoặc báo "unexpected EOF" | Dùng Edit/Write, hoặc viết script `.mjs` bằng Write rồi chạy `node script.mjs` |
| Ghi đè file CSS bằng `cat > file` khi Vite dev server đang chạy | Vite đọc đúng lúc file đang rỗng và cache module CSS rỗng, nên giao diện mất hết style | Ghi bằng Write; nếu đã lỡ thì "chạm" file (thêm dòng trống) để Vite đọc lại |
| Gọi Aseprite bằng `&` trong PowerShell | Không ghi ra file | `Start-Process -FilePath $ase -ArgumentList … -NoNewWindow -Wait` |
| Lua/TS bỏ qua `repeat` của placement rời | Chỉ hiện 1 ô đường/rào | `copyRepeat` (Lua) và `expandRepeated` (TS) |
| Đặt cọc phân làn chồng lên nhau trong cùng layer | Bóng chồng bóng ra alpha lạ, `verify:map` báo lỗi | Dời cọc sang ô khác; `verify:map` cho phép lệch làm tròn ±1 (`isRoundingOfDerived`) |
| Đặt test cạnh `ambient.ts` (file import `sprites.ts` không có đuôi) | `node --test` báo `ERR_MODULE_NOT_FOUND` | Tách logic thuần sang `src/hub/paths.ts`; test import kèm `.ts` |
| Bật giảm chuyển động thì bỏ luôn màn mờ dần | Chuyển cảnh bị giật | Luôn giữ mờ dần, chỉ bỏ dịch chuyển/nảy |
| Gọi `preventDefault` trong `onWheel` của React | React gắn wheel ở chế độ passive nên trang vẫn cuộn | `addEventListener("wheel", …, { passive: false })` (`FarmMapCanvas.tsx`) |
| Lướt camera mà chỉ `setState` | ResizeObserver chạy sau rAF nhưng trước khi React render lại, đọc `live.current` cũ và ghi đè zoom: kẹt ở ×3 khi quay về từ Đường đua | Ghi luôn `live.current` trong từng bước `glide` |
| Đặt `style.height` ngay trong callback ResizeObserver (`PixelCanvas`) | Cảnh báo "ResizeObserver loop completed with undelivered notifications" | Dời `resize` sang `requestAnimationFrame` |
| Chữ tiếng Việt vẽ bằng font Silkscreen ("EMPTY", "BPM", "TIME", nhãn tab) | Silkscreen không có dấu, hiển thị sai | Dùng VT323 cho mọi chữ có dấu |
| Dùng emoji (🔒) trong UI pixel | Không có trong font pixel, lệch phong cách | Huy hiệu chữ ("Khóa") |
| Đo hiệu năng/hoạt ảnh khi khung trình duyệt của Claude Desktop đang ẩn | rAF bị dừng (0–2 fps), trông như lỗi treo/không chuyển cảnh | Mở khung trình duyệt (hiện pane) trước khi đo; đây không phải lỗi code |
| Thao tác cuộn (scroll) của công cụ trình duyệt để test zoom | Bị gộp còn 1–2 sự kiện wheel, mức zoom không như mong đợi | Phát `WheelEvent` bằng JS khi cần test chính xác |

## 5. Environment & Secret Notes

- **Simulator: không đọc biến môi trường nào** (chưa có `.env`). Khi nối Backend sẽ cần thêm, ví dụ URL Socket hub (chưa đặt tên, chưa có trong code).
- **BE** (`.env.example`, chỉ liệt kê tên): `PORT, NODE_ENV, API_PREFIX, FRONTEND_URL, DATABASE_URL, DIRECT_URL, JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN, EMAIL_PROVIDER, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, DEV_FIXED_OTP, GITHUB_PROJECT_URL, GITHUB_OWNER, GITHUB_DEFAULT_REPOSITORY, GITHUB_BE_REPOSITORY, GITHUB_FE_REPOSITORY, GITHUB_PROJECT_NUMBER, GITHUB_API_URL, GITHUB_TOKEN, GITHUB_PROJECT_DRY_RUN, GITHUB_DEFAULT_BRANCH`.
- **Main Web:** `VITE_USE_MOCK, VITE_API_URL`.
- Dịch vụ ngoài: PostgreSQL qua Docker (`npm run db:up`), SMTP (gửi mail/OTP), GitHub API (token cho tích hợp project). Có nhiều file `.env` thật trong cây thư mục (BE, FE, `RACEHORSE_TRAINING/`, `.local-review-20260930/`); **không** commit hay chia sẻ chúng. `acc.md` ở thư mục gốc có thể chứa tài khoản, cần kiểm tra trước khi chia sẻ.
- Công cụ: **Aseprite 1.3.18 CLI** (bản cá nhân, đường dẫn trên máy cũ là `D:\Users\ASUS\Downloads\Programs\Aseprite-v1.3.18.6-Windows\aseprite.exe`, cần đổi theo máy mới). Chỉ cần khi dựng lại sprite/bản đồ; chạy web thì không cần.
- Node ≥ 24 cho `npm test` của Simulator (chạy thẳng `.ts`); BE yêu cầu Node ≥ 20.19.

## 6. Next Steps / Action Items (theo thứ tự)

1. Xử lý mục 0: xóa `claude_data/`, `git init` Simulator với `.gitignore`, rồi commit đầu tiên.
2. Sửa 4 lỗi "Quan trọng" của review (mục 2) trước khi người dùng duyệt bản cuối. Hai lỗi đầu là yêu cầu của T10 đã bị tích nhầm.
3. Người dùng duyệt bản cuối giao diện Hay Day (ô cuối `tasks/todo-hayday.md`). Lưu trữ `tasks/plan.md`, `tasks/todo.md` và `SPEC-sprite-farm-map.md` cũ khi được đồng ý.
4. Chốt mâu thuẫn RULE-MED-02 trong `CONSTRAINTS.md` với ADR-3, có xác nhận của người duyệt.
5. Cân nhắc thêm Simulator vào `start.bat`/`stop.bat` (cổng 5174).
6. **Nối dữ liệu** (giai đoạn kế tiếp đã thống nhất): thay `src/sim/bus.ts` bằng client Socket.IO tới NestJS hub; nạp ngựa thật từ API (tôn trọng RULE-RBAC-01); nhận `sys:medical_lock_sync` từ Main Web thay vì nút khóa trong Simulator.
7. Kho vật tư: thay định mức demo bằng định mức thật và nối kho BE (trừ kho phải dùng transaction, RULE-CONC-01).
8. Bảo mật/xác thực thiết bị Simulator (đang hoãn theo quyết định).
9. Việc nhỏ (gồm các lỗi "Nhỏ" của review): zoom theo bước nguyên nếu pixel không đều gây khó chịu; nhớ mức zoom giữa các lần vào/ra.
