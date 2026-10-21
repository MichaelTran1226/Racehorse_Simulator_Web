# Racehorse Simulator Web v3 — Layout Preview

Bản mẫu tĩnh để duyệt bố cục bản đồ trang trại. Không có gameplay, dữ liệu hoặc tích hợp với v2.

```powershell
npm install
npm run dev
```

Mở `http://localhost:5175`.

## Bản đồ từ bố cục tham khảo (Aseprite)

Chỉ ghép bằng crop nguyên khối từ sheet Stardew trong `art/sv/` (chép nguyên byte từ v2 `Stardrew Valley/`), không scale/xoay/sửa pixel, không chèn chữ.

```powershell
& "D:\Users\ASUS\Downloads\Programs\Aseprite-v1.3.18.6-Windows\aseprite.exe" -b --script-param root=$PWD --script art/aseprite/build-ref-map.lua
```

Ra `art/aseprite/farm-ref-map.aseprite` (layer Ground, Paths, Decorations, Structures) và `public/assets/maps/farm-ref-map.png` (1280×768, ô 16 px, 80×48 ô).

## Intro mở đầu (`index.html`)

Mây Stardew (`art/sv/sv-clouds.png` → cắt bằng `art/aseprite/cut-clouds.lua` ra `public/assets/clouds/`) che kín màn hình rồi tách sang hai bên theo 2 lớp parallax; camera lướt từ trời xuống, vượt nhẹ rồi dừng trên 4 công trình chính; biển tên bật lên lần lượt. Chạm hoặc nhấn phím bất kỳ để bỏ qua; `prefers-reduced-motion` chỉ còn mờ dần. Toạ độ công trình lấy từ `public/assets/maps/farm-ref-map.json` do `build-ref-map.lua` sinh ra. Mẫu bố cục cũ chuyển sang `mock.html`.

```powershell
npm test   # kiểm hàm camera thuần src/intro-camera.js
```
