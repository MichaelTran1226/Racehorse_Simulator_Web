# Bản đồ trang trại dựng lại bằng asset Stardew (bố cục B, mùa xuân) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nền bản đồ trang trại (đất, cỏ, đường, rào, cây, nhà) và các con vật nền được thay hoàn toàn bằng asset Stardew ở kích thước gốc (ô 16 px), theo bố cục B mùa xuân đã duyệt. Ngựa, người, xe và mọi logic giữ nguyên.

**Architecture:**
- `art/map/gen-layout.ts` viết lại để đặt crop từ các sheet Stardew. Sheet được chép nguyên byte vào `art/png/sv/`.
- Đất và đường dùng autotile 4×4 của `Flooring.png`, tính bằng hàm thuần `art/map/autotile.ts`.
- Layout JSON có thêm khối `anchors` (cửa chuồng, cửa kho, cửa nhà, cửa phòng khám). Nhờ vậy toạ độ gắn với công trình chỉ có một nguồn duy nhất.
- Mọi đường đi khác được đặt lại trong `paths.ts` và `ambientScene.ts`.
- Các con vật Stardew (gà, vịt, chó, mèo) thay S16, vẽ thẳng từ PNG Stardew ở `public/assets/sprites/sv/`.

**Tech Stack:** React 19.2, TypeScript ~6.0 strict (`erasableSyntaxOnly`, `allowImportingTsExtensions`), Canvas 2D, `node --test` (Node 24), Aseprite 1.3.18 CLI.

**Spec:** Ý định chốt với người dùng ngày 20/10/2026 (trong phiên chat), tóm ở Global Constraints. Hình mẫu đã duyệt là `art/preview/stardew/layout-B-spring.png`. Script dựng hình mẫu là `art/preview/stardew/compose.ts`, nhánh `else` (bố cục B) là nguồn toạ độ gốc, khi bảng dưới và script lệch nhau thì bảng dưới thắng.

## Global Constraints

- **Nhánh:** `feature/farm-map-life-and-ambient-content` (tip `7b579d2`, có thư mục `Stardrew Valley/`). Working tree hiện đang ở `main`, vì vậy bước đầu tiên là `git switch feature/farm-map-life-and-ambient-content`. Người dùng dặn **không commit và không push**, nên plan không có bước commit.
- **Chỉ đổi lớp hình ảnh của bản đồ.** Giữ nguyên ngựa (S01/S14), người (S06), xe (S15), hiệu ứng (S13), HUD, popup, thẻ ngựa, màn Chuồng, màn Đường đua, gói tin và bus.
- **Nền bản đồ chỉ được crop/copy/place từ sheet Stardew** trong bảng "Sheet nguồn". Không scale, xoay, tô màu, sửa pixel hay vẽ primitive. Ghép hai crop để né pixel thừa thì được. `npm run verify:map` phải đạt.
- **Bố cục B, mùa xuân, thế giới 1280×768 px** (80×48 ô 16 px). Kích thước thế giới không đổi, nên camera không phải sửa.
- **Không có bò.** Con vật nền chỉ gồm gà trắng, gà nâu, vịt, chó, mèo. S16 bị rút khỏi runtime.
- **Nhà:** 2 Barn làm khu chuồng, cụm silo + Shed + thùng/rương làm kho, nhà lớn hai tầng làm nhà cho NPC ra vào, phòng khám Harvey cắt từ `spring_town.png` làm phòng khám.
- **`prefers-reduced-motion`:** mọi nhân vật trả tư thế tĩnh, không phụ thuộc thời gian. **Khi tạm dừng** thì giữ nguyên vị trí, về khung đứng.
- **Hiệu năng và kỹ thuật:** ≥ 55 fps ở 1920×1080. Không thêm dependency. Chữ hiển thị viết tiếng Việt.
- **Ngoài phạm vi:** đổi ngựa, người hay xe sang Stardew; NPC Stardew; restyle UI; đổi mùa theo thời gian; bò; bố cục A.

## Sheet nguồn

Chép **nguyên byte** từ `Stardrew Valley/…` sang `art/png/sv/<key>.png`. Đây là các sheet duy nhất Lua và `verify:map` chấp nhận.

| key | Nguồn trong `Stardrew Valley/` | Kích thước |
|---|---|---|
| `sv-spring-outdoors` | `03_Tilesets_and_Terrain/spring_outdoorsTileSheet.png` | 400×1264 |
| `sv-flooring` | `03_Tilesets_and_Terrain/Flooring.png` | 256×256 |
| `sv-fence-wood` | `Full_Raw_Assets/LooseSprites/Fence1.png` | 48×192 |
| `sv-fence-iron` | `Full_Raw_Assets/LooseSprites/Fence3.png` | 48×192 |
| `sv-barn` | `02_Stables_and_Buildings/Barn.png` | 112×128 |
| `sv-shed` | `02_Stables_and_Buildings/Shed.png` | 112×128 |
| `sv-silo` | `02_Stables_and_Buildings/Silo.png` | 48×128 |
| `sv-stable` | `02_Stables_and_Buildings/Stable.png` | 64×96 |
| `sv-coop` | `02_Stables_and_Buildings/Coop.png` | 96×128 |
| `sv-well` | `02_Stables_and_Buildings/Well.png` | 48×80 |
| `sv-houses` | `02_Stables_and_Buildings/houses.png` | 272×432 |
| `sv-spring-town` | `03_Tilesets_and_Terrain/spring_town.png` | 512×992 |
| `sv-tree1-spring` | `03_Tilesets_and_Terrain/tree1_spring.png` | 48×160 |
| `sv-tree2-spring` | `03_Tilesets_and_Terrain/tree2_spring.png` | 48×160 |
| `sv-bushes` | `03_Tilesets_and_Terrain/bushes.png` | 128×256 |
| `sv-craftables` | `03_Tilesets_and_Terrain/Craftables.png` | 128×736 |

**Runtime con vật:** chép nguyên byte sang `public/assets/sprites/sv/`:

| File đích | Nguồn `05_Animals_and_Ambient_Life/` | Kích thước, khung |
|---|---|---|
| `white-chicken.png` | `White Chicken.png` | 64×112, khung 16×16 |
| `brown-chicken.png` | `Brown Chicken.png` | 64×112, khung 16×16 |
| `duck.png` | `Duck.png` | 64×112, khung 16×16 |
| `dog.png` | `dog.png` | 128×288, khung 32×32 |
| `cat.png` | `cat.png` | 128×256, khung 32×32 |

Hàng khung của con vật Stardew:
- Hàng 0: đi xuống. Hàng 1: đi sang phải. Hàng 2: đi lên. Hàng 3: đi sang trái. Mỗi hàng có cột 0–3.
- Mèo: hàng 7, cột 0–1 là cuộn tròn ngủ.

## Bảng crop (toạ độ px trong sheet)

| Thứ | Sheet | Crop `x,y,w,h` | Ghi chú |
|---|---|---|---|
| Cỏ nền | `sv-spring-outdoors` | `0,112,16,16` | ô (0,7) |
| Cỏ hoa vàng / hoa trắng / cỏ nhạt | `sv-spring-outdoors` | `0,96` / `16,96` / `0,176`, đều 16×16 | ô (0,6), (1,6), (0,11) |
| Đất (autotile) | `sv-flooring` | gốc `64,64`, khối 4×4 ô 16 px | xem Task 2 |
| Rào ngang: đầu trái / giữa / đầu phải | `sv-fence-wood`, `sv-fence-iron` | `0,64` / `16,64` / `32,64`, đều 16×32 | dest y = ô y × 16 − 16 |
| Cọc rào dọc | cùng sheet | `0,32,16,32` | |
| Barn | `sv-barn` | `0,0,96,128` | bỏ mảnh cửa ở x 96–112 |
| Shed | `sv-shed` | `0,0,112,128` | |
| Silo | `sv-silo` | `0,0,48,128` | |
| Stable (mái che cạnh bãi thả) | `sv-stable` | `0,0,64,96` | |
| Coop | `sv-coop` | hai crop: `0,0,96,112` rồi `0,112,64,16` | né mảng trắng ở góc dưới phải (x64–80, y112–128 là 256 pixel trắng đục; crop đã sửa theo nguồn) |
| Giếng | `sv-well` | `0,0,48,80` | |
| Nhà NPC (nhà lớn hai tầng) | `sv-houses` | `0,288,160,144` | |
| Phòng khám | `sv-spring-town` | hai crop: `16,176,64,128` đặt lệch +16 px; `0,208,16,96` đặt lệch +0,+32 | né bia đá ở `0..16,176..208` |
| Cây | `sv-tree1-spring`, `sv-tree2-spring` | `0,0,48,96` | dest x = ô x × 16 − 16; chân = (ô y + 1) × 16 |
| Bụi nhỏ / bụi hoa / bụi to | `sv-bushes` | `0,98,31,29` / `32,98,31,29` / `1,132,47,43` | chân = (ô y + 1) × 16 |
| Thùng gỗ / thùng tối / rương | `sv-craftables` | `96,448,16,32` / `32,448,16,32` / `32,512,16,32` | |

## Bố cục B (đơn vị ô 16 px; "trên" = hàng đầu của sprite)

| Thứ | Vị trí | Thuộc |
|---|---|---|
| Đường đất chính | ô (1,14)–(78,15) | lớp `paths` |
| Lối dọc xuống đường đua | (39,16)–(40,27) | `paths` |
| Sân tập (đất) | (4,3)–(18,12); rào gỗ `pen(3,2,19,13)`, cổng 2 ô ở cột 10–11 hàng 13 | `paths` + `fences` |
| Lối vào cửa | các cột x ∈ {27, 35, 48, 58, 71}, rộng 2 ô, hàng 10–13 | `paths` |
| Đường đua | vành đất `ring(2,28,77,46, rộng 3)`, cắt bậc 3 ô ở 4 góc ngoài; rào sắt `pen(5,31,74,43)`, không cổng; cây (24,37), (44,40), (60,36); bụi (15,36), (33,38), (52,35), (66,39) | object `track` (TRACK) |
| Khu chuồng | Barn trên tại (22,1) và (31,1) | object `stable` (STALL) |
| Kho | Silo (42,0), Shed (45,1), thùng gỗ (44,10) và (45,10), thùng tối (51,10), rương (52,10); hàng = hàng chân − 1 vì cao 32 px | object `barn` (SUPPLY) |
| Phòng khám | trên-trái (69,1) | object `vet` (VET) |
| Nhà NPC | (54,1) | `decor` |
| Coop | (22,17) | `decor` |
| Mái che Stable | (73,18) | `decor` |
| Giếng | dest px (1216,32), chân y = 112 | `decor` |
| Bãi thả | rào gỗ `pen(43,18,70,26)`, cổng 2 ô ở cột 55–56 hàng 26 | `fences` |
| Cây | (1,18), (3,23), (7,20), (12,25), (16,19), (79,25), (76,21), (20,9), (0,0) | `decor` |
| Bụi | (10,17), (18,23), (74,26), (64,12), (30,24), (52,24) | `decor` |

Bụi thứ i trong danh sách dùng biến thể `i % 3`. Cây chọn sheet theo `(x + y) % 2` (0 dùng tree1, 1 dùng tree2). Cỏ nền chọn theo `n = (x*7 + y*13) % 37`: n = 0 là hoa vàng, n = 1 là hoa trắng, `n % 5 === 2` là cỏ nhạt, còn lại là cỏ nền.

### `anchors` ghi trong `farm-layout.json` (px, chân nhân vật)

| key | Giá trị | Ý nghĩa |
|---|---|---|
| `stableStalls` | `[{x:416,y:142},{x:560,y:142},{x:1200,y:372}]` | ngựa đứng ở ô cửa Barn 1, Barn 2 và dưới mái Stable |
| `supplyDoor` | `{x:784,y:176}` | cửa Shed: xe tải dừng, xe cút kít xuất phát |
| `houseDoor` | `{x:960,y:160}` | cửa nhà NPC |
| `clinicDoor` | `{x:1160,y:142}` | cửa phòng khám |

Các giá trị này là điểm khởi đầu. Task 7 cho phép chỉnh ±8 px theo hình thật, rồi cập nhật cả bảng này.

### Đường đi (px, chân nhân vật)

| Hằng | Giá trị mới |
|---|---|
| `HORSE_PATH`, `HORSE2_PATH` (bãi thả) | (730,400)→(1080,400); (760,340)→(900,340) |
| `TRUCK_Y`, `TRUCK_STOP_X` | 250; `anchors.supplyDoor.x` |
| `BARN_DOOR` (`FarmMapCanvas.tsx`) | `anchors.supplyDoor` |
| `RIDER_PATH` (làn dưới) / `RIDER2_PATH` (làn trên) | (96,734)→(1200,734) / (96,478)→(1200,478) |
| `GROOM_PATH` | (360,168)→(600,168) |
| `VET_PATH` | `anchors.clinicDoor` → (1240,176) |
| `MANAGER_PATH` | `houseDoor` → (960,248) → (1120,248) |
| `OWNER_PATH` | `houseDoor` → (960,248) → (820,248) |
| `BARROW_PATH` | `supplyDoor` → (784,248) → (560,248) → (560,168) → (416,168) |
| `CART_PATH` | (640,264)→(640,440) |
| `LEFT_RIDE_PATH` | (96,80)→(272,80)→(272,190)→(96,190)→(96,80) |
| `LEFT_COACH_POS` | (280,200) |
| `ROAD_CART_PATH` | (24,248)→(1256,248) |
| `HAYCART_PATH` | (700,276)→(1100,276) |
| `GROOMING_POS` | (1140,420), ngựa ở x + 28 |
| `CHAT_POS_A`, `CHAT_POS_B` | (1010,200), (1038,200) |
| `CHICKEN_PATHS` (3) | (380,420)→(470,428); (400,436)→(500,432); (430,416)→(520,424) |
| `DUCK_PATH` | (540,420)→(600,424) |
| `DOG_PATH` | (300,262)→(560,262) |
| `CAT_POS` | (1120,196) |

`RESERVED_CORRIDORS` mới:

| Hành lang | Hình chữ nhật (x, y, w, h) |
|---|---|
| Đường chính | (16, 224, 1248, 32) |
| Lối dọc | (624, 256, 32, 192) |
| Làn đua trên | (32, 448, 1216, 48) |
| Làn đua dưới | (32, 688, 1216, 48) |
| Cua trái | (32, 448, 48, 288) |
| Cua phải | (1200, 448, 48, 288) |
| Làn bãi thả 1 | (720, 384, 380, 32) |
| Làn bãi thả 2 | (750, 324, 160, 32) |
| Sân tập | (64, 48, 240, 160) |

## Review Focus

- **Hai vùng đất chạm nhau** (lối dọc hàng 27 nối vào vành đua hàng 28; lối vào cửa nối đường chính): autotile phải tính trên mặt nạ đất chung của cả bản đồ, không tính riêng từng vùng, để chỗ nối liền mạch. Test ở Task 2 (`dirtTiles nối liền lối dọc với vành đua`).
- **Bấm vào cây hay bụi trong lòng đường đua:** chúng thuộc object `track` nên phải mở Đường đua, không rơi xuống bãi cỏ. Test ở Task 3 (object `track` chứa placement cây).
- **Ngựa trong chuồng chỉ còn 3 chỗ nhìn thấy (trước là 7).** Ngựa có `stall` index ≥ 3 không hiện và không bị nhân đôi. Test ở Task 4.
- **Nhân vật đang "ở trong nhà" lúc tạm dừng hoặc giảm chuyển động:** khi giảm chuyển động phải hiện đứng ở cửa (`active: true`), không biến mất vĩnh viễn. Test ở Task 5.
- **Ẩn tab lâu rồi quay lại** (time = 1e6 s): con vật và người ra vào nhà vẫn nằm trên đường đi của mình. Test ở Task 5 và Task 6.

---

### Task 1: Đưa sheet Stardew vào pipeline và bộ kiểm

**Files:**
- Create: `art/png/sv/*.png` (16 file trong bảng "Sheet nguồn", chép nguyên byte)
- Modify: `art/aseprite/build-farm-map.lua` (allowlist và đường dẫn)
- Modify: `art/verify-farm-map.mjs` (danh sách sheet duyệt)
- Modify: `src/hub/farmLayout.ts` (`ALLOWED_MAP_SHEETS`, `SHEET_SIZES`, `validateFarmLayout`)
- Test: `src/hub/farmLayout.test.ts`

**Interfaces:**
- Produces:
  - `export const SHEET_SIZES: Readonly<Record<string, { w: number; h: number }>>` gồm đúng 16 key của bảng.
  - `ALLOWED_MAP_SHEETS = new Set(Object.keys(SHEET_SIZES))`.
  - `validateFarmLayout()` kiểm crop theo `SHEET_SIZES[sheet]` thay cho số 192 cố định, và kiểm thế giới `{width:1280,height:768,tile:16}`.

- [ ] **Step 1:** `git switch feature/farm-map-life-and-ambient-content`. Chép 16 file sang `art/png/sv/` (giữ nguyên byte, `cp`).
- [ ] **Step 2: Viết test lỗi** trong `farmLayout.test.ts`:

```ts
test("mọi sheet bản đồ là PNG Stardew chép nguyên byte, đúng kích thước khai báo", () => {
  for (const [key, size] of Object.entries(SHEET_SIZES)) {
    const png = readFileSync(new URL(`../../art/png/sv/${key}.png`, import.meta.url));
    assert.deepEqual({ w: png.readUInt32BE(16), h: png.readUInt32BE(20) }, size, key);
  }
  assert.equal(SHEET_SIZES["sv-barn"].w, 112);
  assert.ok([...ALLOWED_MAP_SHEETS].every((s) => s.startsWith("sv-")));
});
```

  Sửa test `Aseprite map builder only copies from the approved sheet allowlist` để kiểm thêm `assert.match(script, /art\/png\/sv\//)`.
- [ ] **Step 3:** Chạy `node --test src/hub/farmLayout.test.ts`. Kỳ vọng FAIL vì `SHEET_SIZES` chưa có.
- [ ] **Step 4: Sửa `farmLayout.ts`.**
  - Khai báo `SHEET_SIZES` và `ALLOWED_MAP_SHEETS` như phần Interfaces.
  - Trong `validateFarmLayout`, đổi `tile !== 32` thành `tile !== 16` và kiểm crop theo `SHEET_SIZES`.
- [ ] **Step 5: Sửa Lua và bộ kiểm.**
  - Lua: allowlist chỉ gồm 16 key `sv-*`, đọc ảnh từ `art/png/sv/<key>.png`. Vẫn lưu bản chuẩn hoá vào `art/preview/provenance/<key>.png`.
  - `verify-farm-map.mjs`: `sheets` đổi thành 16 key `sv-*`.
- [ ] **Step 6:** Chạy `node --test src/hub/farmLayout.test.ts`. Kỳ vọng: test mới PASS. Các test layout cũ sẽ FAIL vì `farm-layout.json` còn sheet `s0x`; chúng được sửa ở Task 3.

### Task 2: Autotile đất từ `Flooring.png`

**Files:**
- Create: `art/map/autotile.ts`, `art/map/autotile.test.ts`

**Interfaces:**
- Produces:
  - `export function dirtTile(n: boolean, e: boolean, s: boolean, w: boolean): { c: number; r: number }`. Kết quả là ô trong khối 4×4. Crop thật là `x = 64 + c*16`, `y = 64 + r*16`.
  - `export type Mask = boolean[][]` (kích thước `[48][80]`).
  - `export function fillRect(m: Mask, x0: number, y0: number, x1: number, y1: number, v?: boolean): void`.
  - `export function ring(m: Mask, x0: number, y0: number, x1: number, y1: number, w: number): void`. Hàm tô vành rộng `w`, khoét lõi, và cắt bậc ở 4 góc ngoài: hàng k (0..2) bỏ `3 − k` ô tính từ góc.
  - `export function dirtTiles(m: Mask): { x: number; y: number; c: number; r: number }[]`.

Luật chọn ô, giữ đúng như `compose.ts`:

```ts
if (!e && !w) return { c: 0, r: n && s ? 2 : s ? 1 : n ? 3 : 0 };
if (!n && !s) return { c: e && w ? 2 : e ? 1 : 3, r: 3 };
return { c: !w ? 1 : !e ? 3 : 2, r: !n ? 0 : !s ? 2 : 1 };
```

- [ ] **Step 1: Viết test lỗi:**
  - `dirtTile đủ 16 tổ hợp`: kiểm cụ thể `(T,T,T,T)→{c:2,r:1}`, `(F,T,T,F)→{c:1,r:0}`, `(T,F,F,T)→{c:3,r:2}`, `(F,F,F,F)→{c:0,r:0}`, `(T,F,T,F)→{c:0,r:2}`, `(F,T,F,T)→{c:2,r:3}`. Kiểm thêm rằng mọi kết quả nằm trong 0..3.
  - `ring cắt bậc góc`: với `ring(m,2,28,77,46,3)` thì `m[28][2]`, `m[28][4]` và `m[29][2]` là false; `m[28][5]`, `m[30][2]` và `m[31][2]` là true; `m[31][5]` là false (lõi).
  - `dirtTiles nối liền lối dọc với vành đua`: tô `fillRect(39,16,40,27)` và `ring(2,28,77,46,3)`. Ô (39,27) có `s = true`, và ô (39,28) không phải ô cạnh trên (r ≠ 0).
- [ ] **Step 2:** Chạy `node --test art/map/autotile.test.ts`. Kỳ vọng FAIL vì module chưa có.
- [ ] **Step 3:** Viết `autotile.ts` theo Interfaces.
- [ ] **Step 4:** Chạy lại lệnh trên. Kỳ vọng PASS.

### Task 3: Viết lại `gen-layout.ts` theo bố cục B và dựng bản đồ

**Files:**
- Modify: `art/map/gen-layout.ts` (thay toàn bộ phần bố cục, giữ khung `place`/`building`/`objects`)
- Modify: `src/hub/farmLayout.ts` (`FARM_ANCHORS`, `RESERVED_CORRIDORS`)
- Regenerate:
  - `art/map/farm-layout.json`, `art/aseprite/farm-day.aseprite`, `art/preview/farm-day-x1.png`
  - `public/assets/maps/farm-ground.png`, `public/assets/maps/objects/{stable,barn,vet,track}.png`
  - `art/map/farm-build-manifest.json`
- Test: `src/hub/farmLayout.test.ts`

**Interfaces:**
- Consumes: `dirtTile`, `fillRect`, `ring`, `dirtTiles` (Task 2); `SHEET_SIZES` (Task 1).
- Produces:
  - `farm-layout.json` có `version: 4`, `world: {width:1280,height:768,tile:16}`, giữ các khối `fills`, `placements`, `objects`, và thêm `anchors` theo bảng `anchors`.
  - `export const FARM_ANCHORS: { stableStalls: Point[]; supplyDoor: Point; houseDoor: Point; clinicDoor: Point }` trong `farmLayout.ts`.
  - Object id vẫn là `stable`, `barn`, `vet`, `track`, nên `farmAssets.ts` và bộ manifest không phải đổi.

- [ ] **Step 1: Viết test lỗi** trong `farmLayout.test.ts`:
  - `FARM_WORLD` deepEqual `{width:1280,height:768,tile:16}`, và `FARM_PLACEMENTS.length > 80*48`.
  - `FARM_ANCHORS.stableStalls.length === 3`. Mỗi chỗ đứng nằm trong `bounds` của object `stable` (so sánh bao gồm biên, `x <= bounds.x + bounds.w`), trừ chỗ thứ 3 (mái Stable) chỉ cần nằm trong thế giới.
  - `supplyDoor` nằm trong bounds của `barn`, `clinicDoor` nằm trong bounds của `vet`.
  - Object `track` có ít nhất 1 placement sheet `sv-tree1-spring` hoặc `sv-tree2-spring`.
  - Không placement nào dùng sheet bắt đầu bằng `s0` hoặc `s1`. Test này thay cho `xe không còn bị ghép cứng vào bản đồ nền`.
  - Giữ nguyên `validateDecorCorridors() === true` với `RESERVED_CORRIDORS` mới.
- [ ] **Step 2:** Chạy `node --test src/hub/farmLayout.test.ts`. Kỳ vọng FAIL (tile 32, chưa có anchors).
- [ ] **Step 3: Viết lại `gen-layout.ts`** theo hai bảng "Bảng crop" và "Bố cục B".
  - `T = 16`, `W = 80`, `H = 48`.
  - Cỏ nền là một `fills` cỏ nền. Các biến thể cỏ đặt trên lớp `ground`, z 1.
  - Mặt nạ đất dựng một lần cho cả bản đồ. Ô thuộc vành đua đưa vào object `track`, ô còn lại vào lớp `paths`.
  - Decor sắp theo chân (y đáy) tăng dần trước khi ghi.
  - Phòng khám và Coop ghép từ hai crop như trong bảng.
  - Ghi `anchors` vào JSON.
  - Gán `focus` của object bằng tâm bounds, như hàm `building` hiện có.
- [ ] **Step 4:** Trong `farmLayout.ts`, export `FARM_ANCHORS = rawLayout.anchors` và thay `RESERVED_CORRIDORS` bằng 9 hình chữ nhật trong bảng.
- [ ] **Step 5: Dựng bản đồ.**
  - Chạy `node art/map/gen-layout.ts`.
  - Chạy Aseprite: `Start-Process -NoNewWindow -Wait <aseprite.exe> -ArgumentList '-b','--script-param','root=<repo>','--script','art/aseprite/build-farm-map.lua'`.
  - Chạy `npm run stamp:map`, rồi `npm run verify:map`. Kỳ vọng in ra `verified 6 generated PNGs against 16 approved sprite sheets…`.
- [ ] **Step 6:** Chạy `node --test src/hub/farmLayout.test.ts`. Kỳ vọng PASS.
- [ ] **Step 7:** So `art/preview/farm-day-x1.png` với `art/preview/stardew/layout-B-spring.png` (bỏ qua ngựa, người, con vật vẽ thêm trong hình mẫu). Công trình, rào, đường, cây phải trùng vị trí.

### Task 4: Đặt lại đường đi ngựa, xe tải và chuồng nhìn thấy

**Files:**
- Modify: `src/hub/paths.ts` (`HORSE_PATH`, `HORSE2_PATH`, `TRUCK_Y`, `TRUCK_STOP_X`)
- Modify: `src/hub/farmPopulation.ts` (`VISIBLE_STABLE_STALLS` lấy từ `FARM_ANCHORS.stableStalls`)
- Modify: `src/ui/FarmMapCanvas.tsx:322` (`BARN_DOOR = FARM_ANCHORS.supplyDoor`)
- Test: `src/hub/paths.test.ts`, `src/hub/farmPopulation.test.ts`

**Interfaces:**
- Consumes: `FARM_ANCHORS` (Task 3).
- Produces: `VISIBLE_STABLE_STALLS` có 3 phần tử `{ index, x, y, cellX, cellY }`, trong đó `cellX = Math.floor(x/16)` và `cellY = Math.floor(y/16)`. `TRUCK_STOP_X === FARM_ANCHORS.supplyDoor.x`.

- [ ] **Step 1: Sửa test.**
  - `visible stable anchors are 7 immutable positions…` đổi thành `chỗ đứng chuồng nhìn thấy là 3 vị trí lấy từ anchors`: deepEqual toạ độ với `FARM_ANCHORS.stableStalls`, và `Object.isFrozen`.
  - Thêm test `ngựa ở ô chuồng index ≥ 3 không hiện và không trùng`: dùng 6 ngựa khoẻ ở ô 0..5 và `paddockIds` rỗng. Kết quả đúng 3 phần tử với anchor index 0, 1, 2.
  - Trong `paths.test.ts`, điểm chạm ngựa bãi thả dùng toạ độ của `paddockHorse(slot, t)` (không ghi cứng), và kiểm `truckPose(...).y === 250`.
- [ ] **Step 2:** Chạy `node --test src/hub/paths.test.ts src/hub/farmPopulation.test.ts`. Kỳ vọng FAIL.
- [ ] **Step 3:** Cập nhật hằng theo bảng "Đường đi", và dựng `VISIBLE_STABLE_STALLS` từ anchors (`Object.freeze`).
- [ ] **Step 4:** Chạy lại lệnh trên. Kỳ vọng PASS.

### Task 5: Đặt lại nhân vật nền và cho người ra vào nhà NPC

**Files:**
- Modify: `src/hub/ambientScene.ts` (hằng đường đi; `HOUSE_MANAGER` và `HOUSE_OWNER` ra vào nhà)
- Test: `src/hub/ambientScene.test.ts`

**Interfaces:**
- Consumes: `FARM_ANCHORS`, `along`, `walkPause`.
- Produces:
  - `export function doorTrip(time: number, outS: number, inS: number): { walkedS: number; inside: boolean }`.
  - Chu kỳ dài `outS + inS`. Trong `[0, outS)` thì `inside = false` và `walkedS` tăng từ 0 tới `outS`.
  - Trong `[outS, outS+inS)` thì `inside = true` và `walkedS = outS`.
  - `HOUSE_MANAGER` dùng `doorTrip(t, 16, 6)`, `HOUSE_OWNER` dùng `doorTrip(t + 11, 14, 8)`. Cả hai đi ping-pong trên đường của mình với tốc độ `2 * pathLength / outS`, để về tới cửa đúng lúc vào nhà.
  - Khi `inside` thì `active: false`. Khi giảm chuyển động thì đứng ở `houseDoor`, `active: true`.

- [ ] **Step 1: Viết test lỗi:**
  - `doorTrip ra rồi vào, không lùi quãng đường`: với t = 0, 8, 15.9, 16, 21.9, 22 thì `inside` lần lượt là F, F, F, T, T, F, và `walkedS` không giảm trong một chu kỳ.
  - `người trong nhà ẩn đi, ra tới cửa thì hiện`: tại thời điểm `inside` thì `ambientActorPose("HOUSE_MANAGER", …).active === false`. Tại t = 0 thì `{x,y}` bằng `FARM_ANCHORS.houseDoor`.
  - `người ra vào nhà vẫn trên đường đi khi time = 1e6`: toạ độ nằm trong khung bao của `MANAGER_PATH`.
  - Sửa test `xe điện chạy trên đường chính` để kỳ vọng y = 248.
- [ ] **Step 2:** Chạy `node --test src/hub/ambientScene.test.ts`. Kỳ vọng FAIL.
- [ ] **Step 3:** Thêm `doorTrip`, đổi mọi hằng theo bảng "Đường đi", và nối hai actor nhà NPC như phần Interfaces.
- [ ] **Step 4:** Chạy lại lệnh trên. Kỳ vọng PASS. Test chung `reduced motion returns a stable pose for every ambient actor` phải vẫn PASS.

### Task 6: Con vật Stardew thay S16

**Files:**
- Create: `public/assets/sprites/sv/{white-chicken,brown-chicken,duck,dog,cat}.png` (chép nguyên byte)
- Delete: `public/assets/sprites/s16-ambient-life.png`
- Modify:
  - `src/render/sprites.ts`: bỏ `ambientLife`, thêm `critters: Record<CritterSheet, HTMLImageElement>`.
  - `src/render/farmAssets.ts`: bỏ `ambientLife`, thêm 5 URL `sv/*`.
  - `src/hub/ambientScene.ts`: bỏ `S16_*`, thêm id con vật.
  - `src/hub/ambient.ts`: section 7 vẽ con vật.
- Test: `src/hub/ambientScene.test.ts`, `src/render/farmScene.test.ts`, `art/gen/ambient-life.test.ts`

**Interfaces:**
- Produces:
  - `export type CritterSheet = "whiteChicken" | "brownChicken" | "duck" | "dog" | "cat"`.
  - Id mới trong `AMBIENT_ACTOR_IDS`: `SV_CHICKEN_1`, `SV_CHICKEN_2`, `SV_CHICKEN_3`, `SV_DUCK`, `SV_DOG`, `SV_CAT`. Các id `S16_*` bị xoá.
  - Pose của con vật có thêm `sheet: CritterSheet` và `size: 16 | 32`. `frame` là cột, `row` là hàng của sheet Stardew.
  - `ambient.ts` vẽ bằng `ctx.drawImage(img, frame*size, row*size, size, size, round(x - size/2), round(y - size + 2), size, size)`, không flip.

Chuyển động:
- **Gà:** `walkPause(t + phase, 3, 2)`. Khi đi dùng hàng 1 (phải) hoặc 3 (trái) theo `dir`, cột `floor(t*6)%4`. Khi dừng dùng hàng 0, cột 0. Gà 1 và 3 dùng `whiteChicken`, gà 2 dùng `brownChicken`. Phase lần lượt là 0, 1.7, 3.1.
- **Vịt:** giống gà, dùng `walkPause(t, 2, 3)`.
- **Chó:** `walkPause(t, 6, 3)`, khung 32. Khi dừng dùng hàng 0, cột 0.
- **Mèo:** đứng tại `CAT_POS`, hàng 7, cột `floor(t*1.5)%2`.
- **Giảm chuyển động:** đứng ở điểm đầu đường, hàng 0, cột 0 (mèo dùng hàng 7, cột 0).

- [ ] **Step 1: Viết hoặc sửa test.**
  - `id con vật nền chỉ gồm gà, vịt, chó, mèo Stardew; không còn S16`.
  - `gà đứng yên tại chỗ khi đang trong khung nghỉ` (theo mẫu test mèo/chim S16 cũ).
  - `con vật vẫn trên đường đi khi time = 1e6`.
  - Trong `farmScene.test.ts`, danh sách asset chứa 5 URL `/assets/sprites/sv/…` và không còn `s16-ambient-life.png`.
  - Trong `ambient-life.test.ts`, test `S16 approved … ships in runtime assets` đổi thành `S16 rút khỏi runtime 20/10/2026, con vật Stardew thay thế`: file `public/assets/sprites/s16-ambient-life.png` không tồn tại và `sprites.ts` không còn chuỗi `ambientLife`.
- [ ] **Step 2:** Chạy `npm test`. Kỳ vọng FAIL ở các test trên.
- [ ] **Step 3:** Chép 5 PNG, xoá PNG S16, sửa `sprites.ts`, `farmAssets.ts`, `ambientScene.ts` và `ambient.ts` theo Interfaces.
- [ ] **Step 4:** Chạy `npm test && npm run typecheck`. Kỳ vọng PASS hết.

### Task 7: Kiểm bằng mắt, đo hiệu năng, cập nhật tài liệu

**Files:**
- Modify: `CLAUDE.md` (gốc), `Racehorse_Simulator_Web/CLAUDE.md`, `HANDOVER.md`
- Có thể sửa: toạ độ trong `farm-layout.json` (`anchors`, qua `gen-layout.ts`) và các hằng đường đi, nhưng chỉ trong phạm vi ±8 px

- [ ] **Step 1:** Chạy `preview_start` cấu hình `simulator-web` (cổng 5174). Mở bản đồ, chụp màn hình và so với `layout-B-spring.png`. Kiểm từng mục:
  - Ngựa đứng trong ô cửa Barn.
  - Xe tải dừng trước cửa Shed.
  - Người ra rồi biến vào cửa nhà NPC.
  - Bác sĩ đi trước cửa phòng khám.
  - Không ai đi xuyên rào hay nhà.
  - Bấm Barn mở Chuồng, bấm Kho mở Kho, bấm Phòng khám mở Y tế, bấm đường đua (kể cả bấm vào cây giữa sân) mở Đường đua.
- [ ] **Step 2:** Lệch thì sửa toạ độ (≤ 8 px). Nếu sửa `anchors`, chạy lại Task 3 Step 5. Sau đó chạy lại `npm test`.
- [ ] **Step 3:** Đo fps bằng `requestAnimationFrame` trong 5 s, khi khung trình duyệt hiển thị và đang mở một bảng nổi. Kỳ vọng ≥ 55. Nếu khung đang ẩn, ghi rõ là chưa đo được fps thật.
- [ ] **Step 4: Cập nhật tài liệu.**
  - Hai file `CLAUDE.md`:
    - Bản đồ nền chỉ crop/copy/place từ sheet Stardew `art/png/sv/` (16 key), ô 16 px, thế giới 80×48 ô.
    - S16 đã rút khỏi runtime.
    - Con vật nền là Stardew (`public/assets/sprites/sv/`), không có bò.
    - Sprite tự vẽ còn dùng: S01, S06, S13, S14, S15 (riêng S07/S08/S10 vẫn dùng cho màn Chuồng và Đường đua nếu các màn đó còn import).
    - Người dùng xác nhận được phép dùng asset Stardew (20/10/2026).
  - `HANDOVER.md`: bố cục B mùa xuân, danh sách nhà, `anchors`, việc bỏ 4 chỗ chuồng nhìn thấy (7 → 3), và những gì chưa kiểm (fps thật nếu chưa đo).
- [ ] **Step 5: Chạy cổng cuối:** `npm run typecheck && npm test && npm run build && npm run verify:map`. Kỳ vọng tất cả đạt.
