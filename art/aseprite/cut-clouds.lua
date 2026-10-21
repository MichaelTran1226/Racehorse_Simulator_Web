-- Cut the Stardew title-screen clouds (art/png/sv/sv-clouds.png) into separate PNGs for the intro. Crops only.
local root = app.fs.normalizePath(app.params["root"] or app.fs.currentPath)
local sheet = Image { fromFile = app.fs.joinPath(root, "art/png/sv/sv-clouds.png") }
local out = app.fs.joinPath(root, "public/assets/clouds")
app.fs.makeDirectory(out)
local cuts = {
  big = { 10, 0, 492, 336 },
  mid1 = { 110, 340, 136, 96 },
  mid2 = { 256, 336, 184, 124 },
  small1 = { 14, 404, 94, 60 },
  small2 = { 146, 440, 136, 64 },
  small3 = { 402, 460, 80, 48 },
}
for name, r in pairs(cuts) do
  assert(r[1] + r[3] <= sheet.width and r[2] + r[4] <= sheet.height, "cut outside sheet: " .. name)
  Image(sheet, Rectangle(r[1], r[2], r[3], r[4])):saveAs(app.fs.joinPath(out, name .. ".png"))
end
print("clouds cut")
