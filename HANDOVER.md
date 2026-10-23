# HANDOVER — EquiFlow Simulator Web (phiên 18–19/10/2026)

> Phạm vi phiên này: **chỉ `Racehorse_Simulator_Web/`**. BE và Main Web **không bị sửa** (cả hai repo `git status` sạch).
> Quy tắc dự án: `AGENTS.md` → `CLAUDE.md` → `CONSTRAINTS.md`.

## 0. Việc phải làm NGAY trước khi chia sẻ thư mục

1. **`Racehorse_Simulator_Web/claude_data/` chứa bản xuất lịch sử chat cá nhân** (`conversations.json`, nhiều file `.zip`). Xóa hoặc chuyển ra ngoài trước khi gửi thư mục cho người khác hay đưa lên git.
2. **Simulator đã có git** (remote `origin` = `github.com/MichaelTran1226/Racehorse_Simulator_Web`, nhánh `main`). `.gitignore` đã chặn `claude_data/`. Không commit `aseprite.exe`.
   - Nhánh đang làm: `feature/farm-map-life-and-ambient-content`, chỉ làm đẹp lại bản đồ (ngựa thật trong chuồng, chi tiết môi trường, chuyển động nhẹ; không thêm gameplay). Kế hoạch: `docs/superpowers/plans/2026-10-19-farm-map-life-and-ambient-content.md`. Việc hiện mã chip trong thẻ ngựa cũng được làm trên nhánh này.
3. Các file rác trong `Racehorse_Simulator_Web/`: `dashboard-preview.png`, `manifest-…-2026-10-18-19-18-01.json` (sinh ra khi thử ChatGPT). Xóa được sau khi người phụ trách xác nhận.

## 1. Current State & Completed

Kiểm tra lần cuối (20/10/2026, bản đồ Stardew): `npm run typecheck` sạch · `npm test` **79/79 đạt** · `npm run build` đạt · `npm run verify:map` đạt · thử trên trình duyệt: bản đồ hiện đúng bố cục B, 4 công trình bấm mở đúng bảng, không lỗi console. **Chưa đo được fps thật** (khung trình duyệt bị ẩn khi đo).

| Phần | Trạng thái | File chính |
|---|---|---|
| Bộ sprite chính thức (S01 ngựa, S14 nài, S07/S08/S10 bản đồ, S06 người, S15 xe, S13 hiệu ứng, S11 biểu tượng) vẽ bằng code → `.aseprite` | Xong, người dùng đã duyệt 4 đợt | `art/gen/*.ts`, `art/aseprite/*.lua`, `public/assets/sprites/` |
| S16 sinh vật môi trường (Chim sẻ, Mèo, Bướm, Túi gió) | **Rút khỏi runtime 20/10/2026**: con vật Stardew thay thế. Sheet vẫn sinh được bằng code | `art/gen/ambient-life.ts` |
| **Bản đồ trang trại Stardew** (bố cục B mùa xuân, duyệt 20/10/2026): nền ghép từ 16 sheet Stardew chép nguyên byte (`art/png/sv/`), ô 16 px, đất/đường autotile từ `Flooring.png`; 2 Barn = Khu chuồng, Silo + Shed + thùng/rương = Kho, nhà hai tầng = nhà NPC (quản lý, chủ ngựa ra vào, ẩn khi ở trong nhà), phòng khám Harvey (ghép 2 crop từ `spring_town.png`) = Phòng khám. Con vật nền: gà, vịt, chó, mèo Stardew (không có bò) | Xong (20/10), có test; `verify:map` kiểm 16 sheet `sv-*` (thêm luật trộn alpha của Aseprite trong `art/map/source-over.mjs`). Bấm Barn/Kho/Phòng khám/đường đua (kể cả cây giữa sân) đã thử trên trình duyệt | `art/map/gen-layout.ts`, `art/map/autotile.ts`, `farm-layout.json` (`anchors`), `src/hub/ambientScene.ts` (`doorTrip`, `SV_*`), `src/render/farmAssets.ts` (`CRITTER_URLS`), `docs/superpowers/plans/2026-10-20-stardew-farm-map.md` |
| Hoạt động tự chạy: nài cưỡi ngựa nước kiệu vòng ô đất mép trái + HLV bấm giờ; khu kho–phòng khám có xe điện, xe kéo cỏ (ẩn khi hết cỏ), groom chải ngựa, bác sĩ dừng khám, hai người trò chuyện. Xe không còn ghép cứng trong ảnh nền | Xong (20/10), có test; mọi nhân vật đứng yên khi giảm chuyển động | `src/hub/ambientScene.ts` (`walkPause`), `src/hub/ambient.ts`, `art/map/gen-layout.ts` |
| Thẻ ngựa: thanh nhịp tim 3 vùng có tên (Nghỉ / Vận động / Quá sức) + câu giải thích; mã chip 15 số | Xong (20/10), có test | `src/ui/heartZones.ts`, `src/ui/HorseCard.tsx` |
| Màn chính kiểu Hay Day: bản đồ phủ kín, HUD 4 góc (giờ, ngày/đêm, bộ đếm ngựa/sự cố/khóa y tế/kho sắp hết, nút Ngựa/Kho/Tốc độ) | Xong (T1) | `src/ui/FarmHub.tsx` |
| Camera: kéo + quán tính, lăn chuột phóng quanh con trỏ, lướt tới công trình, phóng sát vào Đường đua và lùi ra khi quay về | Xong (T1, T7, T11) | `src/hub/camera.ts`, `useFarmCamera.ts`, `src/ui/FarmMapCanvas.tsx` |
| Bảng nổi dùng chung (nảy mở/thu đóng, Esc, giữ focus, trả focus) | Xong (T2) | `src/ui/Popup.tsx` |
| Ẩn chữ kỹ thuật, gỡ bảng gói tin; bus vẫn publish gói SRS | Xong (T3) | `src/sim/bus.ts`, `packets.ts` |
| Thẻ ngựa + Đàn ngựa; gắn ngựa thật tại 2 ô bãi thả và **3 chỗ đứng chuồng** (ô cửa 2 Barn + mái che Stable; lấp bằng 3 ngựa đầu tiên theo ô chuồng không ra bãi thả) | Xong (T4, T13; đổi 7 → 3 chỗ khi sang bản đồ Stardew 20/10) | `HorseCard.tsx`, `HorseList.tsx`, `src/hub/farmPopulation.ts`, `src/render/stableHorses.ts` |
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
| Hiển thị | **Hiện đủ 15 số, không che, cho mọi người xem (kể cả người dùng phổ thông)** — chỉ trong thẻ ngựa (`HorseCard`), dòng "Mã chip", chia nhóm 3 số bằng `formatMicrochip` (`src/sim/engine.ts`). Không hiện ở Đàn ngựa, ô chuồng, khung chọn ngựa, nhãn trên bản đồ. Icon "chip RFID" trong S11 (`art/gen/fx-icons.ts:352`) chưa dùng | Main Web hiện ở danh sách/chi tiết/form ngựa, hồ sơ y tế |

Khi nối dữ liệu (mục 6, bước 6): lấy `microchip` từ API thay vì tự sinh, giữ nguyên chuỗi đã bị che với GROOM (không cố "giải mã"; `formatMicrochip` chỉ nhóm chữ số liền nhau, với chuỗi `***********1234` sẽ ra `***********123 4`, nên sửa lại hàm khi nối API), và không dùng `microchip_id` làm khóa nội bộ — khóa vẫn là `horse_id`.

## 2. In-Progress & Uncommitted

- **Uncommitted:** toàn bộ `Racehorse_Simulator_Web/` (trên nhánh `feature/farm-map-life-and-ambient-content`).
- **Chờ duyệt:** Chọn một hướng trong `art/preview/map-style-directions.png` (người dùng có nghiêng về vùng đồng bằng, chưa chốt).
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
    - Khi bật `reducedMotion`, ngựa bãi thả được vẽ ở pose thời gian 0 nhưng hit-test vẫn dùng đồng hồ ambient hiện tại; hover/click có thể lệch khỏi hình. Đây là lỗi có sẵn ngoài phạm vi remediation hiện tại.
    - `Popup.tsx`: `onClose` truyền inline bị tạo lại mỗi 0,5 giây nên đếm giờ đóng bị khởi động lại; cần giữ `onClose` trong ref.
    - `Popup.tsx`: bôi đen chữ rồi thả chuột ra ngoài bảng sẽ đóng bảng.
    - `FarmMapCanvas.tsx`: canvas có `tabIndex=0` nhưng không xử lý phím nào.
    - Ô chuồng phải bấm thêm "Xem thẻ ngựa" mới mở thẻ (plan T5 nói chạm ô là mở thẻ); lưới chuồng chỉ bấm được bằng chuột.
    - Một số màu hex viết cứng trong canvas (`drawRoofTag`, `ambient.ts`).
    - Chú thích trong `ambient.ts` còn nhắc "văn phòng".
    - Hiệu ứng `glide` không hủy rAF khi unmount.
- **Đã chốt ngày 21/10/2026:** `CONSTRAINTS.md` RULE-MED-02 đã được sửa theo ADR-3: chấn thương nặng dừng phiên và gửi cảnh báo `CRITICAL`, nhưng chỉ Veterinarian mới được tạo bệnh án và bật MedicalLock sau khi xác nhận.

## 3. Architectural Decisions (ADR)

| # | Quyết định | Lý do | Phương án bị loại |
|---|---|---|---|
| ADR-1 | SRS & Design Handoff **v2.0** là nguồn chuẩn: Simulator là web riêng, Canvas 2D pixel art | Người dùng chốt 18/10; v2.0 mới hơn tài liệu "3 giai đoạn" | Godot WASM, Three.js; tài liệu 3GiaiDoan (đánh dấu OUTDATED) |
| ADR-2 | **UI trước, nối dữ liệu sau.** Mọi dữ liệu chạy trên bus cục bộ với tên sự kiện đúng SRS §8 | Cần bản trình diễn được trước khi nối NestJS; đổi bus sang Socket.IO sẽ không phải sửa UI | Nối Socket hub ngay từ đầu |
| ADR-3 | **Không tự động khóa y tế.** Sự cố → `sim:incident_report` → hệ thống báo các actor quản lý; bác sĩ thú y nhận cảnh báo cho mọi ngựa trên sân/trong chuồng | Quyết định của người dùng 18/10 và xác nhận lại 21/10, đúng RULE-AI-01 và RULE-MED-02 đã cập nhật | Tự bật MedicalLock từ Simulator |
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

## 6. Real-Time Integration Status (Phiên 21–22/10/2026 — Hoàn thành)

1. **Khởi động 1-Click trọn gói (`start.bat` / `stop.bat`):** Đã tích hợp Simulator (Cổng `5175`), tự động cài đặt dependency, giải phóng cổng và mở trình duyệt đồng thời cùng FE (5173) và BE (3000).
2. **Xác thực & Đồng bộ danh mục cá thể ngựa (REST API):** Đã kết nối API đăng nhập `/auth/login`, đồng bộ cá thể thật từ CSDL `/horses`, hỗ trợ Club Manager tạo ngựa mới trực tiếp từ Simulator.
3. **Truyền dẫn Real-time & Đồng bộ 2 chiều (Socket.IO `/simulator`):**
   - Stream 1 Hz telemetry (`sim:telemetry_tick`) và tiến độ đua 6 làn (`sim:race_progress`).
   - Sự cố khẩn cấp (`sim:incident_report`) và tổng kết hoàn thành (`sim:session_finished`) được gửi tin cậy với ACK và lưu trữ bền vững vào PostgreSQL (`SimulatorSession` & `IncidentReport`).
   - Khóa Y Tế 2 chiều: Khi Bác sĩ Thú y đặt/hủy khóa trên Web, backend phát `sys:medical_lock_sync` tới Simulator để lập tức khóa/mở quyền chạy thử nặng hoặc thi đấu.
4. **Giám sát trực tiếp trên Frontend (`/training/monitor`):** Màn hình Live Monitor chuyển đổi từ dữ liệu tĩnh sang tích hợp song song REST snapshot và luồng Socket.IO trực tiếp; trang sự cố `/incidents` tự động làm mới khi có gói tin chấn thương.
5. **Căn chỉnh nhãn nhà Nhân sự & Pipeline đối tượng bản đồ:**
   - Chuyển `groom-house` thành đối tượng chính thức trong `art/map/gen-layout.ts` (`building("groom-house", "Nhân viên", "GROOM", 60, ...)`), tạo `objects/groom-house.png` (52, 17, 144×144).
   - Tên hiển thị thống nhất là `Nhân viên` (thay cho nhãn cũ `Nhà nhân viên & Groom`).
   - Tự động vẽ viền vàng (`--map-outline`) chuẩn pixel art khi rê chuột và mở đúng Popup Quản lý/Nhân sự khi click.
   - Ảnh chụp minh chứng nghiệm thu thực tế trên trình duyệt:
     - Rê chuột hiển thị viền vàng + nhãn nóc: `docs/evidence/staff-house-hover.png`
     - Bấm mở bảng nổi Nhân viên: `docs/evidence/staff-house-popup.png`
6. **Khôi phục cổng chất lượng Frontend Zero-Warning:**
   - Cập nhật script `lint` thành `oxlint --deny-warnings` (chặn đứng mọi warning phát sinh).
   - Đã xử lý triệt để toàn bộ **103 warnings trên 59 files** (về 0 warnings tuyệt đối không dùng suppression/disable):
     - `10d17a9` fix(fe): remove unused declarations and enable deny-warnings
     - `00b5b97` fix(fe): separate non-component exports for Fast Refresh
     - `44c8460` fix(fe): eliminate set-state-in-effect and purity warnings for zero-warning quality gate
7. **Bằng chứng kiểm thử toàn diện (Chạy lại ngày 22/10/2026):**
   - **Simulator (`Racehorse_Simulator_Web_v3`):**
     - Unit & Engine tests: **115/115 tests pass** (`npm test`)
     - Typecheck: **0 lỗi** (`npm run typecheck`)
     - Map Provenance & Build Manifest: **Đạt** (`npm run verify:map` — kiểm tra 7 ảnh PNG sinh ra khớp với 18 sheet Stardew)
     - Production Build: **Đạt** (`npm run build`)
   - **Frontend (`Racehorse_Training_Management_System_MT_FE`):**
     - Linter: **0 warnings, 0 errors** (`npm run lint` với `oxlint --deny-warnings`)
     - Typecheck: **0 lỗi** (`npm run typecheck`)
     - Playwright E2E: **12/12 tests pass** (`npx playwright test tests/e2e/simulator.spec.ts tests/e2e/i18n.spec.ts`)
   - **Backend (`Racehorse_Training_Management_System_MT_BE`):**
     - Unit tests: **51/51 test suites pass, 430/430 tests pass** (`npm run test:unit`)
     - Typecheck: **0 lỗi** (`npm run typecheck`)
     - Linter: **0 cảnh báo** (`npm run lint` với `--max-warnings=0`)
     - Prettier: **100% khớp chuẩn** (`npx prettier --check "src/**/*.ts" "test/**/*.ts"`)

