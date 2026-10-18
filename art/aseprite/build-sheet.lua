-- Đóng gói một sprite sheet PNG (ô 32×32) thành file nguồn .aseprite: mỗi ô = 1 frame, gắn tag theo hoạt ảnh.
-- Gọi: aseprite -b --script-param src=... --script-param dst=... --script-param tags="idle:1-6:5;walk:7-12:6" --script build-sheet.lua
local src = app.params["src"]
local dst = app.params["dst"]
local tags = app.params["tags"] or ""
local cell = tonumber(app.params["cell"] or "32")

local sheet = Image{ fromFile = src }
local cols = sheet.width // cell
local rows = sheet.height // cell

local spr = Sprite(cell, cell, ColorMode.RGB)
local layer = spr.layers[1]
layer.name = "sprite"

-- Chỉ lấy những ô có điểm ảnh (bỏ hàng/cột trống của lưới 6×6).
local frames = {}
for r = 0, rows - 1 do
  for c = 0, cols - 1 do
    local img = Image(sheet, Rectangle(c * cell, r * cell, cell, cell))
    if not img:isEmpty() then table.insert(frames, img) end
  end
end

for i, img in ipairs(frames) do
  if i > 1 then spr:newEmptyFrame() end
  spr:newCel(layer, i, img, Point(0, 0))
end

-- tags: "tên:từ-đến:fps;..." (số frame tính từ 1)
for spec in string.gmatch(tags, "[^;]+") do
  local name, a, b, fps = string.match(spec, "([^:]+):(%d+)%-(%d+):(%d+)")
  if name then
    local tag = spr:newTag(tonumber(a), tonumber(b))
    tag.name = name
    for f = tonumber(a), tonumber(b) do spr.frames[f].duration = 1 / tonumber(fps) end
  end
end

spr:saveAs(dst)
print("saved " .. dst .. " (" .. #frames .. " frames)")
