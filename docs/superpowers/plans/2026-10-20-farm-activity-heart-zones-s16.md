# Hoạt động trang trại, vùng nhịp tim và S16 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thẻ ngựa có thanh nhịp tim chia 3 vùng có tên; ô đất mép trái và khu kho–phòng khám có người, ngựa, xe tự chuyển động; xe điện/xe kéo cỏ không còn đứng cứng trong ảnh nền; S16 (chim sẻ, mèo, bướm, túi gió) được duyệt và chạy trên bản đồ.

**Architecture:** Tư thế mọi nhân vật mới tính trong module thuần `src/hub/ambientScene.ts` (switch theo `AmbientActorId`, có nhánh `reducedMotion`), vẽ trong `src/hub/ambient.ts`. Vùng nhịp tim tính bằng hàm thuần mới `src/ui/heartZones.ts`. S16 được gắn lại bằng cách đảo ngược có chọn lọc commit `49606b9` (đã từng gắn rồi rút về preview).

**Tech Stack:** React 19.2, TypeScript ~6.0 strict (`erasableSyntaxOnly`, `allowImportingTsExtensions`), Canvas 2D, CSS Modules, `node --test` (Node 24), Aseprite 1.3.18 CLI để dựng lại bản đồ.

**Spec:** Ý định đã chốt với người dùng ngày 20/10/2026 (trong phiên chat), tóm tắt ở Global Constraints. Bối cảnh: `HANDOVER.md`, `CLAUDE.md`, `docs/superpowers/plans/2026-10-19-farm-map-life-and-ambient-content.md`.

## Global Constraints

- Nhánh: `feature/farm-map-life-and-ambient-content`. Không tạo nhánh mới.
- Người xem là người dùng phổ thông, **chỉ đứng xem**: không gameplay, không cho bấm vào người/xe/con vật, không bóng chữ hội thoại.
- Chỉ dùng sprite đã duyệt: S01, S06, S13, S14, S15 và **S16 (cả 4 hàng: BIRD, CAT, BUTTERFLY, WINDSOCK — người dùng duyệt nguyên bản preview ngày 20/10/2026)**. Không vẽ sprite mới.
- Bản đồ nền chỉ crop/copy/place sprite đã duyệt; `npm run verify:map` phải đạt sau khi dựng lại.
- `prefers-reduced-motion`: mọi nhân vật mới trả về tư thế tĩnh không phụ thuộc thời gian.
- Khi tạm dừng mô phỏng (`simulationRunning = false`): giữ nguyên vị trí theo thời gian truyền vào, khung đứng yên (người: cột 4, xe/ngựa/sinh vật: khung 0).
- Hiệu năng: ≥ 55 fps ở 1920×1080 khi đang mở một bảng nổi.
- Không thêm dependency. Màu mới (nếu có) thêm token trong `src/ui/tokens.css`. Chữ tiếng Việt dùng VT323.
- Thanh Sức khỏe, Thể trạng, Tốc độ trong thẻ ngựa **giữ nguyên**.
- Ngoài phạm vi: đổi phong cách sang đồng bằng / 4 hướng trong `map-style-directions.png`; chuyển động ở khu khác ngoài các mục dưới đây.

## Bản đồ toạ độ (world 1280×768, ô 32 px, toạ độ là chân nhân vật)

| Khu | Mốc trong `art/map/gen-layout.ts` | Toạ độ dùng trong plan |
|---|---|---|
| Ô đất mép trái giữa | Rào hàng 12 cột 0–5, cổng (5,12); cỏ trống hàng 9–11 | Vòng cưỡi `LEFT_RIDE_PATH`: (32,316)→(200,316)→(200,372)→(32,372)→(32,316); HLV đứng `LEFT_COACH_POS` = (216,412), cạnh cổng |
| Đường đất chính | Hàng 18 (y ≈ 576–608) | Xe điện `ROAD_CART_PATH`: (40,596)→(1240,596) |
| Giữa kho và phòng khám | Kho cột 19–24 hàng 19–21; phòng khám cột 33–38; cột 26–31 hàng 21 trống sau khi bỏ xe kéo cỏ cứng | Xe kéo cỏ `HAYCART_PATH`: (820,700)→(1010,700); groom chải ngựa `GROOMING_POS` = (884,756) (ngựa) và (856,756) (groom); hai người trò chuyện `CHAT_POS_A` = (960,640), `CHAT_POS_B` = (988,640) |
| S16 | Giữ đúng toạ độ đã có ở commit `49606b9` | `BIRD_PATH` (220,284)→(310,284); `CAT_PATH` (710,610)→(790,610); `BUTTERFLY_PATH` (990,420)→(1060,440)→(1010,450); `WINDSOCK_POS` (840,260) |

Toạ độ là điểm khởi đầu; Task 6 chỉnh ±16 px nếu nhìn trên trình duyệt thấy đè lên rào, cây hoặc đường.

## Bảng sprite dùng

| Nhân vật | Sheet | Hàng / ô |
|---|---|---|
| Ngựa chạy nước kiệu có nài | S01 + S14 | S01 hàng `ROW.TROT` (2), cùng cột, phủ S14 hàng 1 (lớp nài nước kiệu); tô màu bằng `tinted(sprites.horse, "BAY")` |
| Ngựa đứng được chải lông | S01 | hàng `ROW.IDLE` (0) |
| HLV trưởng | S06 | hàng 1; cột 4 đứng, cột 5 giơ đồng hồ |
| Groom | S06 | hàng 3; cột 0–3 đi, 4 đứng, 5 chải lông |
| Bác sĩ thú y | S06 | hàng 2; cột 5 khom nghe tim |
| Hai người trò chuyện | S06 | A = chủ ngựa hàng 4 (cột 5 vỗ tay); B = nài đi bộ hàng 5 (cột 5 giơ roi chào) |
| Xe điện có người lái | S15 | `VEHICLE_RECT.cartDriver` |
| Xe kéo cỏ | S15 | `VEHICLE_RECT.hayCart` |
| S16 | S16 | hàng 0 chim (đứng 0–1, nhảy 2–3, bay 4–5), 1 mèo (nghỉ 0–1, đi 2–3, vươn 4–5), 2 bướm (đậu 0–1, bay 2–5), 3 túi gió (lặng 0–1, thổi 2–5) |

## Review Focus

- **Tạm dừng giữa lúc nhân vật đang "dừng tay"** (bác sĩ khom, HLV giơ đồng hồ): khi pause phải về khung đứng (cột 4), không kẹt ở khung hành động. Test ở Task 2 và Task 3.
- **Giảm chuyển động với nhân vật đi theo vòng kín** (`LEFT_RIDE_PATH`, `pingPong = false`): tư thế phải giống hệt nhau ở mọi thời điểm. Test chung `reduced motion returns a stable pose for every ambient actor` tự phủ khi id mới vào `AMBIENT_ACTOR_IDS`.
- **Kho hết cỏ**: xe kéo cỏ chỉ hiện khi `hasHay`, giống xe cút kít hiện có. Test ở Task 3.
- **Ẩn tab rồi quay lại sau lâu** (`time` rất lớn, ví dụ 1e6 s): `walkPause` và `along` vẫn trả toạ độ nằm trên đường đi. Test ở Task 2.
- **Bỏ xe cứng khỏi bản đồ** làm hở ô cỏ hoặc đụng hành lang dành riêng: `verify:map` và test `loose decor placements do not overlap reserved corridors` phải đạt sau khi dựng lại. Task 4.

---

### Task 1: Thanh nhịp tim 3 vùng có tên

**Files:**
- Create: `src/ui/heartZones.ts`, `src/ui/heartZones.test.ts`
- Modify: `src/ui/HorseCard.tsx` (khối `c.heart`, khoảng dòng 59–71), `src/ui/HorseCard.module.css` (`.heartBar`…`.heartScale`, dòng 103–134)

**Interfaces:**
- Produces: `heartZones(h: Pick<HorseProfile, "hrRest" | "hrAlert" | "hrMax">): readonly HeartZone[]`, với `HeartZone = { key: "REST" | "WORK" | "OVER"; label: string; from: number; to: number; widthPct: number }`. Nhãn đúng: `"Nghỉ"`, `"Vận động"`, `"Quá sức"`. `from`/`to` theo nhịp/phút: REST 0→hrRest, WORK hrRest→hrAlert, OVER hrAlert→hrMax. `widthPct` = (to − from) / hrMax × 100.
- Produces: `heartHint(h): string` = `` `Khi tập, nhịp tim vượt ${h.hrAlert} là ngựa quá sức.` ``

- [ ] **Step 1: Viết test lỗi** trong `src/ui/heartZones.test.ts` (import `./heartZones.ts`)

```ts
test("ba vùng nhịp tim liền nhau, đúng nhãn và cộng đủ 100%", () => {
  const z = heartZones({ hrRest: 38, hrAlert: 211, hrMax: 221 });
  assert.deepEqual(z.map((x) => [x.key, x.label, x.from, x.to]), [
    ["REST", "Nghỉ", 0, 38], ["WORK", "Vận động", 38, 211], ["OVER", "Quá sức", 211, 221],
  ]);
  assert.ok(Math.abs(z.reduce((s, x) => s + x.widthPct, 0) - 100) < 1e-9);
});
test("câu giải thích nêu đúng ngưỡng báo động", () => {
  assert.equal(heartHint({ hrRest: 38, hrAlert: 211, hrMax: 221 }), "Khi tập, nhịp tim vượt 211 là ngựa quá sức.");
});
```

- [ ] **Step 2: Chạy** `node --test src/ui/heartZones.test.ts` → FAIL (module chưa có).
- [ ] **Step 3: Viết `heartZones` và `heartHint`** trong `src/ui/heartZones.ts`; chỉ `import type { HorseProfile } from "../sim/engine.ts"`.
- [ ] **Step 4: Chạy lại** → PASS.
- [ ] **Step 5: Thay khối nhịp tim trong `HorseCard`**: thanh gồm 3 `<span>` nối nhau theo `widthPct`, `data-zone={key}` (màu: REST `--grass`, WORK `--gold`, OVER `--red`, đều là token sẵn có). Bên dưới là chú giải 3 mục "■ Nghỉ 0–38 · ■ Vận động 38–211 · ■ Quá sức 211–221" (ô màu cùng token), rồi `<p className={s.hint}>{heartHint(h)}</p>`. Thanh có `role="img"` và `aria-label` dạng "Nhịp tim: nghỉ dưới 38, vận động 38 đến 211, quá sức trên 211 nhịp mỗi phút". Xóa `.heartRest`, `.heartAlert`, `.heartScale` và biến `--rest`/`--alert` không còn dùng.
- [ ] **Step 6: Kiểm** `npm run typecheck` và `npm test` → đạt.
- [ ] **Step 7: Commit**

```bash
git add src/ui/heartZones.ts src/ui/heartZones.test.ts src/ui/HorseCard.tsx src/ui/HorseCard.module.css
git commit -m "feat: label heart-rate zones on the horse card"
```

---

### Task 2: Ô đất mép trái — nài cưỡi ngựa đi vòng, HLV bấm giờ

**Files:**
- Modify: `src/hub/ambientScene.ts`, `src/hub/ambientScene.test.ts`, `src/hub/ambient.ts`

**Interfaces:**
- Produces: `walkPause(time: number, walkS: number, pauseS: number): { walkedS: number; paused: boolean }` — chu kỳ `walkS + pauseS`; `walkedS` = số chu kỳ trọn × `walkS` + min(phần dư, `walkS`); `paused` = phần dư ≥ `walkS`.
- Produces: `AmbientActorId` thêm `"LEFT_RIDER"`, `"LEFT_COACH"`; hằng `LEFT_RIDE_PATH`, `LEFT_COACH_POS` (toạ độ ở bảng trên).
- `LEFT_RIDER`: `along(LEFT_RIDE_PATH, time * 30, false)`, `frame = floor(time * 8) % 6` (pause: 0), `row: 2` (S01 TROT).
- `LEFT_COACH`: đứng yên tại `LEFT_COACH_POS`, `row: 1`, quay mặt về phía vòng cưỡi (`flip: true`); `frame = walkPause(time, 6, 2).paused ? 5 : 4` (pause/reduced: 4).

- [ ] **Step 1: Viết test lỗi** trong `ambientScene.test.ts`

```ts
test("walkPause đi rồi dừng theo chu kỳ, không lùi quãng đường", () => {
  assert.deepEqual(walkPause(0, 10, 3), { walkedS: 0, paused: false });
  assert.deepEqual(walkPause(11, 10, 3), { walkedS: 10, paused: true });
  assert.deepEqual(walkPause(14, 10, 3), { walkedS: 11, paused: false });
  const far = walkPause(1e6, 10, 3);
  assert.ok(far.walkedS > 0 && Number.isFinite(far.walkedS));
});
test("nài trên ô đất trái luôn nằm trong khung vòng cưỡi, kể cả thời gian rất lớn", () => {
  for (const t of [0, 7.3, 1e6]) {
    const p = ambientActorPose("LEFT_RIDER", t, runningState);
    assert.ok(p.x >= 32 && p.x <= 200 && p.y >= 316 && p.y <= 372);
  }
});
test("HLV giơ đồng hồ khi đang chạy, đứng yên khi tạm dừng", () => {
  assert.equal(ambientActorPose("LEFT_COACH", 7, runningState).frame, 5);
  assert.equal(ambientActorPose("LEFT_COACH", 7, { ...runningState, simulationRunning: false }).frame, 4);
});
```

Khai báo `runningState = { reducedMotion: false, simulationRunning: true, hasHay: true }` ở đầu file. Cập nhật test `ambient actor ids contain only approved existing actors` thêm 2 id mới (đếm 10).

- [ ] **Step 2: Chạy** `node --test src/hub/ambientScene.test.ts` → FAIL.
- [ ] **Step 3: Thêm `walkPause`, 2 id, 2 nhánh pose** (cả nhánh `reducedMotion` lẫn nhánh thường) trong `ambientScene.ts`.
- [ ] **Step 4: Chạy lại** → PASS (gồm test giảm chuyển động chung).
- [ ] **Step 5: Vẽ trong `drawFarmActors`** (mục mới "5. Ô đất mép trái"): ngựa `drawFrame(ctx, sprites.horse, tinted(sprites.horse, "BAY"), f, ROW.TROT, x, y, CELL, flip)` rồi nài `drawFrame(ctx, sprites.rider, sprites.rider.canvas, f, 1, x, y, CELL, flip)`; HLV `drawFrame(ctx, sprites.people, sprites.people.canvas, frame, 1, …)`. Import `ROW` từ `../render/sprites.ts`.
- [ ] **Step 6: Kiểm** `npm run typecheck`, `npm test` → đạt.
- [ ] **Step 7: Commit** `git commit -m "feat: add trotting rider and coach to the west field"` (kèm 3 file).

---

### Task 3: Khu kho – phòng khám — xe chạy, chải ngựa, khám, trò chuyện

**Files:**
- Modify: `src/hub/ambientScene.ts`, `src/hub/ambientScene.test.ts`, `src/hub/ambient.ts`

**Interfaces:**
- Consumes: `walkPause` (Task 2).
- Produces: `AmbientActorId` thêm `"ROAD_CART"`, `"SUPPLY_HAYCART"`, `"BARN_GROOMING"`, `"CHAT_A"`, `"CHAT_B"`; hằng `ROAD_CART_PATH`, `HAYCART_PATH`, `GROOMING_POS`, `CHAT_POS_A`, `CHAT_POS_B`.
- `ROAD_CART`: `along(ROAD_CART_PATH, time * 45, true)`, frame 0.
- `SUPPLY_HAYCART`: `along(HAYCART_PATH, time * 20, true)`; `active = hayCartActive(state)` với `hayCartActive = barrowActive` (dùng lại, cùng quy tắc kho).
- `BARN_GROOMING`: đứng tại `GROOMING_POS` (groom), `row: 3`, `frame = walkPause(time, 2, 2).paused ? 5 : 4`.
- `CHAT_A` / `CHAT_B`: đứng tại `CHAT_POS_A` / `CHAT_POS_B`, quay mặt vào nhau (`flip` false / true), `row` 4 / 5; A hành động khi `walkPause(time, 3, 1).paused`, B khi `walkPause(time + 2, 3, 1).paused` (lệch pha để không cùng lúc).
- `CLINIC_VET` (sửa): `const w = walkPause(time, 10, 3)`; vị trí `along(VET_PATH, w.walkedS * 18, true)`; khi `w.paused` → `frame: 5`.
- Pause/reduced: người cột 4, xe frame 0; `SUPPLY_HAYCART.active = false` khi reduced (giống `SUPPLY_BARROW`).

- [ ] **Step 1: Viết test lỗi**

```ts
test("bác sĩ đứng yên đúng chỗ khi khom khám", () => {
  const a = ambientActorPose("CLINIC_VET", 10.5, runningState);
  const b = ambientActorPose("CLINIC_VET", 12.5, runningState);
  assert.equal(a.frame, 5);
  assert.deepEqual({ x: a.x, y: a.y }, { x: b.x, y: b.y });
  assert.equal(ambientActorPose("CLINIC_VET", 10.5, { ...runningState, simulationRunning: false }).frame, 4);
});
test("xe kéo cỏ ẩn khi kho hết cỏ", () => {
  assert.equal(ambientActorPose("SUPPLY_HAYCART", 3, runningState).active, true);
  assert.equal(ambientActorPose("SUPPLY_HAYCART", 3, { ...runningState, hasHay: false }).active, false);
});
test("hai người trò chuyện quay mặt vào nhau và không cùng làm động tác", () => {
  const a = ambientActorPose("CHAT_A", 3.5, runningState);
  const b = ambientActorPose("CHAT_B", 3.5, runningState);
  assert.notEqual(a.flip, b.flip);
  assert.ok(!(a.frame === 5 && b.frame === 5));
});
test("xe điện chạy trên đường chính", () => {
  const p = ambientActorPose("ROAD_CART", 1e6, runningState);
  assert.equal(p.y, 596);
  assert.ok(p.x >= 40 && p.x <= 1240);
});
```

Cập nhật test danh sách id (đếm 15).

- [ ] **Step 2: Chạy** → FAIL.
- [ ] **Step 3: Thêm id, hằng, nhánh pose; sửa `CLINIC_VET`.**
- [ ] **Step 4: Chạy lại** → PASS.
- [ ] **Step 5: Vẽ trong `drawFarmActors`** (mục mới "6. Khu kho – phòng khám"): xe điện `drawRect(..., VEHICLE_RECT.cartDriver, …)`; xe kéo cỏ `drawRect(..., VEHICLE_RECT.hayCart, …)` khi `active`, kèm groom (S06 hàng 3, khung đi) đi trước đầu xe 18 px theo `dir`; ngựa đứng `drawFrame(ctx, sprites.horse, tinted(sprites.horse, "CHESTNUT"), 0, ROW.IDLE, GROOMING_POS.x + 28, GROOMING_POS.y, CELL)` rồi groom; hai người trò chuyện. Thứ tự vẽ theo y tăng dần để người đứng sau bị che đúng.
- [ ] **Step 6: Kiểm** `npm run typecheck`, `npm test` → đạt.
- [ ] **Step 7: Commit** `git commit -m "feat: bring the barn and clinic yard to life"`.

---

### Task 4: Bỏ xe đứng cứng khỏi ảnh nền bản đồ

**Files:**
- Modify: `art/map/gen-layout.ts` (xóa dòng 208 `xe kéo cỏ` và dòng 244 `xe điện đỗ bên đường`), `src/hub/farmLayout.test.ts`
- Regenerate: `art/map/farm-layout.json`, `public/assets/maps/*` (qua Aseprite)

**Interfaces:**
- Produces: bản đồ nền không còn placement nào lấy từ `s15-vehicles` (xe chỉ còn là nhân vật runtime từ Task 3).

- [ ] **Step 1: Viết test lỗi** trong `farmLayout.test.ts`

```ts
test("xe không còn bị ghép cứng vào bản đồ nền", () => {
  assert.equal(layout.placements.some((p) => p.sheet === "s15-vehicles"), false);
});
```

(dùng đúng biến layout và tên trường mà các test cùng file đang dùng).

- [ ] **Step 2: Chạy** `node --test src/hub/farmLayout.test.ts` → FAIL.
- [ ] **Step 3: Xóa 2 dòng decor** trong `gen-layout.ts`; chạy `node art/map/gen-layout.ts`.
- [ ] **Step 4: Dựng lại PNG bản đồ**: `Start-Process -FilePath <aseprite.exe> -ArgumentList '-b','--script-param','root=<đường dẫn Racehorse_Simulator_Web>','--script','art/aseprite/build-farm-map.lua' -NoNewWindow -Wait` (đường dẫn exe theo máy, xem HANDOVER mục 5).
- [ ] **Step 5: Kiểm** `npm run verify:map` → đạt; `npm test` → đạt (gồm test hành lang dành riêng).
- [ ] **Step 6: Commit** `git commit -m "fix: drop parked vehicles from the static farm map"` (gen-layout, farm-layout.json, ảnh map, test).

---

### Task 5: Duyệt và gắn S16

**Files:**
- Modify: `art/gen/ambient-life.ts`, `art/gen/ambient-life.test.ts`, `src/render/farmAssets.ts`, `src/render/sprites.ts`, `src/hub/ambientScene.ts`, `src/hub/ambientScene.test.ts`, `src/hub/ambient.ts`
- Create (sinh ra): `art/png/s16-ambient-life.png`, `public/assets/sprites/s16-ambient-life.png`, `art/preview/provenance/s16-ambient-life.png`

**Interfaces:**
- Produces: `APPROVED_S16_ROWS = ["BIRD", "CAT", "BUTTERFLY", "WINDSOCK"] as const`; `Sprites.ambientLife: Sheet`; `FARM_ASSET_URLS.sprites.ambientLife = "/assets/sprites/s16-ambient-life.png"`; `AmbientActorId` thêm `"S16_BIRD" | "S16_CAT" | "S16_BUTTERFLY" | "S16_WINDSOCK"`; hằng `BIRD_PATH`, `CAT_PATH`, `BUTTERFLY_PATH`, `WINDSOCK_POS`.
- Nguồn: đảo ngược đúng các hunk của commit `49606b9` ở 7 file trên (`git show 49606b9 -- <file>`), **trừ** `barrowActive` (giữ bản hiện tại, không đưa lại điều kiện `simulationRunning`). Hàm pose S16 lấy lại từ bản trước commit đó, nhưng khi pause dùng khung 0.

- [ ] **Step 1: Viết test lỗi**
  - `art/gen/ambient-life.test.ts`: thay test `unapproved S16 proposal stays out of runtime assets` bằng bản trước `49606b9` (khi `APPROVED_S16_ROWS` khác rỗng thì `FARM_ASSET_URLS` phải chứa `s16-ambient-life.png`), thêm `assert.deepEqual([...APPROVED_S16_ROWS], ["BIRD", "CAT", "BUTTERFLY", "WINDSOCK"])`.
  - `src/hub/ambientScene.test.ts`: xóa test `unapproved S16 row ids never appear…`; thêm 4 id S16 vào test danh sách (đếm 19); thêm:

```ts
test("túi gió đứng yên một chỗ và chỉ phất khi đang chạy", () => {
  const a = ambientActorPose("S16_WINDSOCK", 1, runningState);
  const b = ambientActorPose("S16_WINDSOCK", 9, runningState);
  assert.deepEqual({ x: a.x, y: a.y }, { x: b.x, y: b.y });
  assert.ok(a.frame >= 2 && a.frame <= 5);
  assert.equal(ambientActorPose("S16_WINDSOCK", 9, { ...runningState, simulationRunning: false }).frame, 0);
});
```

- [ ] **Step 2: Chạy** `node --test art/gen/ambient-life.test.ts src/hub/ambientScene.test.ts` → FAIL.
- [ ] **Step 3: Đảo ngược các hunk của `49606b9`** như mô tả ở Interfaces.
- [ ] **Step 4: Xuất bản sheet**: `node art/gen/ambient-life.ts` → sinh 3 file PNG ở mục Create.
- [ ] **Step 5: Chạy lại** test → PASS; `npm test` đạt toàn bộ (gồm `farm runtime asset list contains only generated maps and approved sprite PNGs`).
- [ ] **Step 6: Commit** `git commit -m "feat: approve S16 ambient life and show it on the farm"` (kèm PNG).

---

### Task 6: Kiểm trên trình duyệt, hiệu năng, tài liệu

**Files:**
- Modify: `HANDOVER.md` (mục 1 thêm dòng hoạt động mới + S16 đã duyệt; mục 2 bỏ "S16 cũ vẫn chỉ là preview"), `CLAUDE.md` (mục 5: `src/hub/ambientScene.ts`, S16 trong danh sách sheet), `tasks/todo-hayday.md` nếu có ô S16 tương ứng.

- [ ] **Step 1:** `npm run typecheck`, `npm test`, `npm run build`, `npm run verify:map` → tất cả đạt.
- [ ] **Step 2:** Mở `http://localhost:5174` (khung trình duyệt phải đang hiện). Phóng tới ô đất trái và khu kho–phòng khám: nhân vật không đè rào, cây, nhà; xe không đi xuyên nhà. Chỉnh toạ độ ±16 px nếu cần, chạy lại test.
- [ ] **Step 3:** Mở thẻ ngựa: thấy 3 vùng Nghỉ / Vận động / Quá sức và câu giải thích; console không lỗi.
- [ ] **Step 4:** Bật giảm chuyển động (DevTools emulate `prefers-reduced-motion: reduce`): mọi nhân vật mới đứng yên; tạm dừng mô phỏng: nhân vật giữ vị trí, khung đứng.
- [ ] **Step 5:** Đo fps ở 1920×1080 khi mở một bảng nổi: ≥ 55.
- [ ] **Step 6:** Cập nhật tài liệu như mục Files; commit `git commit -m "docs: record farm activity, heart zones and approved S16"`.
