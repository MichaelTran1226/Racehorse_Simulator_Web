# Stardew Valley Sprite & Asset Library for Racehorse Simulator Web

Bộ sưu tập và tài liệu tra cứu toàn diện về sprites, tilesets và assets Stardew Valley, được tải về, chuẩn hóa và phân loại chuyên biệt cho dự án **Racehorse Simulator Web (EquiFlow)**.

- **Nguồn tham chiếu gốc**: [The Spriters Resource — Stardew Valley (PC/Computer)](https://www.spriters-resource.com/pc_computer/stardewvalley/)
- **Định dạng chuẩn**: PNG 32-bit RGBA (pixel-perfect, nền trong suốt)
- **Hệ lưới chuẩn**: 16×16 px (sub-tile/item), 32×32 px (world tile/character unit) — tương thích 100% với lưới 32 px của `Racehorse_Simulator_Web`.

---

## 📁 Cấu trúc thư mục Assets

```text
Stardrew Valley/
├── 01_Horse_and_Riding/          # Ngựa đua, tư thế cưỡi, jockey và trang phục cưỡi
├── 02_Stables_and_Buildings/     # Chuồng ngựa, nhà kho, silo, đấu trường & phòng khám
├── 03_Tilesets_and_Terrain/      # Bản đồ 4 mùa, bãi cỏ, đường đất, hàng rào & cây cối
├── 04_Staff_and_NPCs/            # Groom, HLV, Bác sĩ thú y, Thợ rèn móng & Quản lý
├── 05_Animals_and_Ambient_Life/  # Thú cưng chuồng, gia súc pasture & sinh vật môi trường
├── 06_Items_Tools_and_UI/        # 800+ icons vật phẩm, thức ăn, dụng cụ chăm sóc & UI
└── Full_Raw_Assets/              # Toàn bộ kho asset gốc Stardew Valley đã giải nén
```

---

## 🐎 1. Chi tiết các bộ sưu tập tuyển chọn (Curated Collections)

### 📌 `01_Horse_and_Riding` (Ngựa & Kỵ thủ)
*Ánh xạ trực tiếp tới sheet `s01-horse.png`, `s14-rider.png` và hệ thống huấn luyện ngựa.*

| Tệp asset | Kích thước | Chi tiết kỹ thuật & Ứng dụng |
|---|---|---|
| [`horse.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/01_Horse_and_Riding/horse.png) | 224 × 128 px | **Sheet chuyển động đầy đủ của ngựa**: 7 frames × 4 hướng (Đứng yên, Đi bộ, Phi nước kiệu/chạy bộ, Vẫy đuôi). Mỗi ô frame 32×32 px. |
| [`farmer_base.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/01_Horse_and_Riding/farmer_base.png) | 384 × 672 px | Nhân vật kỵ sĩ/jockey nam: đầy đủ góc nhìn 4 hướng, động tác cưỡi, cúi người, bước đi. |
| [`farmer_girl_base.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/01_Horse_and_Riding/farmer_girl_base.png) | 384 × 672 px | Nhân vật kỵ sĩ/jockey nữ. |
| [`hats.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/01_Horse_and_Riding/hats.png) | 240 × 240 px | Mũ bảo hiểm kỵ mã, nón jockey, mũ rơm huấn luyện viên. |
| [`shirts.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/01_Horse_and_Riding/shirts.png) | 128 × 224 px | Áo thi đấu jockey nhiều màu sắc và áo bảo hộ huấn luyện. |
| [`hairstyles.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/01_Horse_and_Riding/hairstyles.png) | 128 × 384 px | Các kiểu tóc tùy biến nhân vật kỵ mã. |
| [`sebastianRideTiles.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/01_Horse_and_Riding/sebastianRideTiles.png) | 480 × 256 px | Animation chuyển động cưỡi tốc độ cao trên đường đua. |

---

### 📌 `02_Stables_and_Buildings` (Công trình & Chuồng trại)
*Ánh xạ trực tiếp tới sheet `s07-stall.png`, `s10-arena.png`, khu vực STALL, TRACK, VET và OFFICE.*

| Tệp asset | Kích thước | Chi tiết kỹ thuật & Ứng dụng |
|---|---|---|
| [`Stable.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/02_Stables_and_Buildings/Stable.png) | 64 × 96 px | **Chuồng ngựa chuẩn** (2×3 ô lưới 32 px), có máng ăn và cửa che mưa nắng. |
| [`Barn.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/02_Stables_and_Buildings/Barn.png) | 112 × 128 px | Nhà nuôi ngựa lớn cấp 1 (3.5×4 ô lưới). |
| [`Big Barn.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/02_Stables_and_Buildings/Big%20Barn.png) | 112 × 128 px | Nhà nuôi ngựa lớn nâng cấp cấp 2. |
| [`Deluxe Barn.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/02_Stables_and_Buildings/Deluxe%20Barn.png) | 112 × 128 px | Tổ hợp chuồng huấn luyện chuyên nghiệp cao cấp. |
| [`Silo.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/02_Stables_and_Buildings/Silo.png) | 48 × 128 px | Tháp dự trữ cỏ khô (Hay) và ngũ cốc cho ngựa. |
| [`Shed.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/02_Stables_and_Buildings/Shed.png) | 112 × 128 px | Kho dụng cụ yên cương, đồ chải lông, máy móc bảo dưỡng. |
| [`stadium_tiles.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/02_Stables_and_Buildings/stadium_tiles.png) | 64 × 304 px | Khán đài đua ngựa, hàng rào xuất phát, biển báo đường đua. |
| [`Well.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/02_Stables_and_Buildings/Well.png) | 48 × 80 px | Giếng nước tưới và máng rửa ngựa sau khi tập luyện. |
| [`townInterior.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/02_Stables_and_Buildings/townInterior.png) | 512 × 1088 px | Nội thất phòng khám thú y (Vet Clinic), văn phòng điều hành và phòng giám định. |

---

### 📌 `03_Tilesets_and_Terrain` (Địa hình & Môi trường Bản đồ)
*Ánh xạ trực tiếp tới pipeline dựng bản đồ `FarmMapCanvas.tsx`, `art/aseprite/build-farm-map.lua` và sheet `s08-farm.png`.*

| Tệp asset | Kích thước | Chi tiết kỹ thuật & Ứng dụng |
|---|---|---|
| [`spring_outdoorsTileSheet.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/03_Tilesets_and_Terrain/spring_outdoorsTileSheet.png) | 400 × 1264 px | **Tileset nền tảng hoàn chỉnh**: Thảm cỏ xanh mùa xuân, bờ nước ao hồ, đá cuội, hàng rào gỗ, bồn hoa. |
| [`summer_outdoorsTileSheet.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/03_Tilesets_and_Terrain/summer_outdoorsTileSheet.png) | 400 × 1264 px | Tileset mùa hè: sắc cỏ tươi sáng, đường chạy cát vàng, ánh nắng. |
| [`fall_outdoorsTileSheet.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/03_Tilesets_and_Terrain/fall_outdoorsTileSheet.png) | 400 × 1264 px | Tileset mùa thu: bãi cỏ vàng cam, lá rụng trên đường chạy. |
| [`winter_outdoorsTileSheet.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/03_Tilesets_and_Terrain/winter_outdoorsTileSheet.png) | 400 × 1264 px | Tileset mùa đông: phủ tuyết trắng cho chế độ sự kiện đặc biệt. |
| [`paths.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/03_Tilesets_and_Terrain/paths.png) | 64 × 128 px | Đường mòn đất đỏ, đường chạy đua ngựa, ranh giới chuồng. |
| [`Flooring.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/03_Tilesets_and_Terrain/Flooring.png) | 256 × 256 px | Các loại lát đường: gỗ ghép, đá lát dăm, sỏi, gạch nung. |
| [`grass.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/03_Tilesets_and_Terrain/grass.png) | 66 × 120 px | Bụi cỏ tự nhiên cho ngựa gặm trên đồng cỏ (Paddock). |
| [`tree1_spring.png` ... `tree3_*.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/03_Tilesets_and_Terrain/) | 48 × 160 px | Cây sồi, cây thông, cây phong che mát chuồng trại và dọc đường ray huấn luyện. |
| [`Craftables.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/03_Tilesets_and_Terrain/Craftables.png) | 128 × 736 px | Hàng rào gỗ, cổng chuồng, đèn lồng, thùng gỗ đựng thức ăn, cọc buộc ngựa. |

---

### 📌 `04_Staff_and_NPCs` (Nhân sự & Hình mẫu vai trò)
*Ánh xạ trực tiếp tới sheet `s06-people.png`, phân quyền RBAC và dân cư trang trại `farmPopulation.ts`.*

| Tệp asset | Kích thước | Chi tiết kỹ thuật & Hình mẫu vai trò |
|---|---|---|
| [`Marnie_Groom_Archetype.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/04_Staff_and_NPCs/Marnie_Groom_Archetype.png) | 64 × 224 px | **Groom (Người chăm sóc ngựa)**: Chuyên gia trang trại, đi dạo kiểm tra máng cỏ và tắm ngựa. |
| [`Robin_Builder_Archetype.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/04_Staff_and_NPCs/Robin_Builder_Archetype.png) | 64 × 288 px | **Kỹ sư bảo trì & Nâng cấp cơ sở vật chất**: Thợ xây chuồng trại. |
| [`Robin_AtWork.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/04_Staff_and_NPCs/Robin_AtWork.png) | 320 × 96 px | Animation Robin đang gõ búa, cưa gỗ khi nâng cấp chuồng. |
| [`Harvey_Doctor_Archetype.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/04_Staff_and_NPCs/Harvey_Doctor_Archetype.png) | 64 × 416 px | **Veterinarian (Bác sĩ thú y)**: Phụ trách kiểm tra y tế, Medical Lock (`RULE-MED-01`). |
| [`Maru_Hospital_Nurse_Archetype.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/04_Staff_and_NPCs/Maru_Hospital_Nurse_Archetype.png) | 64 × 256 px | Y tá phòng khám thú y, chuẩn bị thuốc men tiêm phòng. |
| [`Lewis_Manager_Archetype.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/04_Staff_and_NPCs/Lewis_Manager_Archetype.png) | 64 × 224 px | **Club Manager (Quản lý CLB đua ngựa)**: Giám sát tài chính và điều hành. |
| [`Shane_Stable_Hand.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/04_Staff_and_NPCs/Shane_Stable_Hand.png) | 64 × 416 px | Công nhân phụ tá dọn chuồng và rải rơm. |
| [`Clint_Blacksmith_Farrier.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/04_Staff_and_NPCs/Clint_Blacksmith_Farrier.png) | 64 × 336 px | **Farrier (Thợ đóng móng sắt)**: Bảo dưỡng móng guốc cho ngựa thi đấu. |

---

### 📌 `05_Animals_and_Ambient_Life` (Sinh vật sống & Môi trường sinh thái)
*Ánh xạ trực tiếp tới `ambient-life.ts`, `farmPopulation.ts` và sheet `s16-ambient-life.png`.*

| Tệp asset | Kích thước | Chi tiết kỹ thuật & Ứng dụng |
|---|---|---|
| [`critters_ambient.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/05_Animals_and_Ambient_Life/critters_ambient.png) | 320 × 320 px | **Sinh vật bay & bò sống động**: Bướm lượn quanh đồng cỏ, chim sẻ mổ thóc, sóc nhảy trên hàng rào, ếch bên mép hồ, đom đóm ban chiều. |
| [`dog.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/05_Animals_and_Ambient_Life/dog.png) | 128 × 288 px | Chó giữ chuồng: chạy tung tăng, vẫy đuôi, ngủ trưa trước cổng chuồng. |
| [`cat.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/05_Animals_and_Ambient_Life/cat.png) | 128 × 256 px | Mèo bắt chuột trong kho rơm, nằm cuộn tròn trên mái chuồng. |
| [`Brown Cow.png` / `White Cow.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/05_Animals_and_Ambient_Life/) | 128 × 160 px | Bò sữa trên cánh đồng cỏ phụ cận. |
| [`Sheep.png` / `Goat.png` / `Pig.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/05_Animals_and_Ambient_Life/) | 128 × 160 px | Cừu, dê, lợn tạo không khí trang trại nông thôn trù phú. |
| [`rain.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/05_Animals_and_Ambient_Life/rain.png) | 256 × 64 px | Hiệu ứng giọt mưa rơi cho chế độ thời tiết ẩm ướt trên đường ray. |

---

### 📌 `06_Items_Tools_and_UI` (Vật phẩm, Dụng cụ & Giao diện)
*Ánh xạ trực tiếp tới sheet `s11-icons.png`, `s13-fx.png`, kho đồ dinh dưỡng và bảng điều khiển HUD.*

| Tệp asset | Kích thước | Chi tiết kỹ thuật & Ứng dụng |
|---|---|---|
| [`springobjects_all_items.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/06_Items_Tools_and_UI/springobjects_all_items.png) | 384 × 544 px | **816+ Icon 16×16 px đầy đủ**: Cỏ khô (Hay), yến mạch, cà rốt, táo, vitamin tăng lực, thuốc kháng viêm, móng sắt, huân chương, cúp vô địch. |
| [`tools.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/06_Items_Tools_and_UI/tools.png) | 336 × 384 px | Bàn chải ngựa, xô nước cọ rửa, xẻng dọn phân, kéo xén lông. |
| [`BuffsIcons.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/06_Items_Tools_and_UI/BuffsIcons.png) | 192 × 32 px | Icon trạng thái thể lực: Tốc độ (+Speed), Sức bền (+Stamina), Căng thẳng, Hồi phục. |
| [`emotes.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/06_Items_Tools_and_UI/emotes.png) | 64 × 256 px | Bong bóng cảm xúc của ngựa: Trái tim (hài lòng), Dấu chấm than (cảnh giác), Mồ hôi (mệt mỏi), Giọt nước (khát), Zzz (ngủ). |
| [`Cursors.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/06_Items_Tools_and_UI/Cursors.png) | 704 × 2256 px | Toàn bộ con trỏ chuột, mũi tên định hướng, khung ô menu, thanh cuộn, icon thời tiết. |
| [`buildingPlacementTiles.png`](file:///e:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/Stardrew%20Valley/06_Items_Tools_and_UI/buildingPlacementTiles.png) | 384 × 64 px | Lưới xanh/đỏ chỉ thị vị trí hợp lệ hoặc bị chặn khi đặt công trình trong trang trại. |

---

## 🛠️ Hướng dẫn tích hợp vào mã nguồn Canvas

### 1. Tọa độ cắt frame động tác ngựa (`horse.png` - 224 × 128 px)
Ngựa Stardew Valley được bố trí theo ma trận 7 cột × 4 dòng:
- **Frame Size**: `32 × 32` px (tỉ lệ chuẩn)
- **Dòng 0** (`y = 0`): Nhìn xuống (Facing Down / South)
- **Dòng 1** (`y = 32`): Nhìn sang phải (Facing Right / East) — lật gương `ctx.scale(-1, 1)` để sang trái (West)
- **Dòng 2** (`y = 64`): Nhìn lên (Facing Up / North)
- **Dòng 3** (`y = 96`): Động tác rỉa cỏ / gục đầu / vẫy đuôi

```typescript
// Ví dụ vẽ frame ngựa đang phi nước kiệu sang phải
function drawHorseFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  frameIndex: number, // 0..6
  direction: 'down' | 'right' | 'up' | 'left',
  dx: number,
  dy: number
) {
  const frameWidth = 32;
  const frameHeight = 32;
  let row = 0;
  let flip = false;

  switch (direction) {
    case 'down': row = 0; break;
    case 'right': row = 1; break;
    case 'up': row = 2; break;
    case 'left': row = 1; flip = true; break;
  }

  const sx = (frameIndex % 7) * frameWidth;
  const sy = row * frameHeight;

  ctx.save();
  if (flip) {
    ctx.translate(dx + frameWidth, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(img, sx, sy, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
  } else {
    ctx.drawImage(img, sx, sy, frameWidth, frameHeight, dx, dy, frameWidth, frameHeight);
  }
  ctx.restore();
}
```

### 2. Tọa độ trích xuất Icon Vật phẩm (`springobjects_all_items.png` - 384 × 544 px)
Ma trận gồm 24 cột × 34 dòng:
- **Item Index**: `id` từ 0 đến 815
- `sx = (id % 24) * 16`
- `sy = Math.floor(id / 24) * 16`
- `sWidth = 16`, `sHeight = 16`

Các ID vật phẩm thông dụng cho Racehorse:
- **Cỏ khô (Hay)**: `id = 178`
- **Táo đỏ (Apple)**: `id = 613`
- **Thuốc tăng lực (Energy Tonic)**: `id = 349`
- **Thuốc phục hồi cơ bắp (Muscle Remedy)**: `id = 351`

---

## 📜 Giấy phép & Điều khoản sử dụng
- Các tài nguyên đồ họa trên thuộc bản quyền tác giả **ConcernedApe** (nhà sáng tạo game *Stardew Valley*).
- Nguồn trích xuất phục vụ mục đích nghiên cứu, học tập, tham chiếu phong cách đồ họa (Pixel Art Style Guide) cho đồ án học phần SWP391, **không sử dụng cho mục đích thương mại**.
