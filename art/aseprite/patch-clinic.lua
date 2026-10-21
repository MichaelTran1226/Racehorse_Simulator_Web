-- Approved exception (user, 21/10/2026): Harvey's clinic in sv-spring-town is joined to Pierre's shop, so its right
-- half is hidden. Rebuild a symmetric clinic: keep the original left half (x 0..55 of the crop) and mirror it onto the
-- right about the door/cross axis. Only source pixels are used (copy + horizontal mirror); output art/png/sv/sv-clinic.png.
local root = app.fs.normalizePath(app.params["root"] or app.fs.currentPath)
local town = Image { fromFile = app.fs.joinPath(root, "art/png/sv/sv-spring-town.png") }
local SX, SY, HALF, H = 0, 176, 56, 128 -- clinic crop origin in the town sheet, half width, height
local out = Image(HALF * 2, H, ColorMode.RGB)
for y = 0, H - 1 do
  for x = 0, HALF - 1 do
    local px = town:getPixel(SX + x, SY + y)
    -- A gravestone from the sheet pokes into the top-left corner above the roof; leave it out.
    if x < 20 and y < 32 then px = 0 end
    out:drawPixel(x, y, px)
    out:drawPixel(HALF * 2 - 1 - x, y, px)
  end
end
out:saveAs(app.fs.joinPath(root, "art/png/sv/sv-clinic.png"))
print("saved sv-clinic.png " .. out.width .. "x" .. out.height)
