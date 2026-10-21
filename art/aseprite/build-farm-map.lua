-- EquiFlow sprite-only farm compositor for Aseprite 1.3.18.
-- Every destination pixel comes from an exact source crop. No source crop is scaled or transformed.

local root = app.fs.normalizePath(app.params["root"] or app.fs.currentPath)
local layoutPath = app.fs.joinPath(root, "art/map/farm-layout.json")

local handle = assert(io.open(layoutPath, "r"))
local layout = json.decode(handle:read("*a"))
handle:close()

local allowed = {
  ["sv-spring-outdoors"] = true,
  ["sv-flooring"] = true,
  ["sv-fence-wood"] = true,
  ["sv-fence-iron"] = true,
  ["sv-barn"] = true,
  ["sv-shed"] = true,
  ["sv-silo"] = true,
  ["sv-stable"] = true,
  ["sv-coop"] = true,
  ["sv-well"] = true,
  ["sv-houses"] = true,
  ["sv-spring-town"] = true,
  ["sv-tree1-spring"] = true,
  ["sv-tree2-spring"] = true,
  ["sv-bushes"] = true,
  ["sv-craftables"] = true,
  ["sv-mill"] = true,
  ["sv-clinic"] = true,
}

local sources = {}
local normalizedDir = app.fs.joinPath(root, "art/preview/provenance")
app.fs.makeDirectory(normalizedDir)
for name, _ in pairs(allowed) do
  sources[name] = Image { fromFile = app.fs.joinPath(root, "art/png/sv/" .. name .. ".png") }
  sources[name]:saveAs(app.fs.joinPath(normalizedDir, name .. ".png"))
end

local worldWidth = layout.world.width
local worldHeight = layout.world.height
local layerOrder = { "ground", "paths", "fences", "buildings", "decor", "markers" }
local layers = {}
for _, name in ipairs(layerOrder) do layers[name] = Image(worldWidth, worldHeight, ColorMode.RGB) end

local function copyCrop(entry, destination, offsetX, offsetY)
  assert(allowed[entry.sheet], "sheet not allowed: " .. tostring(entry.sheet))
  local source = sources[entry.sheet]
  local crop = Image(source, Rectangle(entry.src.x, entry.src.y, entry.src.w, entry.src.h))
  destination:drawImage(crop, Point(entry.dest.x - offsetX, entry.dest.y - offsetY))
end

local function copyRepeat(entry, destination, offsetX, offsetY)
  local spec = entry["repeat"]
  local cols = spec and spec.cols or 1
  local rows = spec and spec.rows or 1
  for row = 0, rows - 1 do
    for col = 0, cols - 1 do
      local expanded = {
        sheet = entry.sheet,
        src = entry.src,
        dest = {
          x = entry.dest.x + col * entry.src.w,
          y = entry.dest.y + row * entry.src.h,
        },
      }
      copyCrop(expanded, destination, offsetX, offsetY)
    end
  end
end

for _, region in ipairs(layout.fills) do
  for y = region.area.y, region.area.y + region.area.h - region.step.y, region.step.y do
    for x = region.area.x, region.area.x + region.area.w - region.step.x, region.step.x do
      copyCrop({ sheet = region.sheet, src = region.src, dest = { x = x, y = y } }, layers[region.layer], 0, 0)
    end
  end
end

for _, entry in ipairs(layout.placements) do copyRepeat(entry, layers[entry.layer], 0, 0) end
for _, object in ipairs(layout.objects) do
  for _, entry in ipairs(object.placements) do copyRepeat(entry, layers[entry.layer], 0, 0) end
end

local sourceSprite = Sprite(worldWidth, worldHeight, ColorMode.RGB)
sourceSprite.layers[1].name = layerOrder[1]
sourceSprite:newCel(sourceSprite.layers[1], 1, layers[layerOrder[1]], Point(0, 0))
for index = 2, #layerOrder do
  local name = layerOrder[index]
  local layer = sourceSprite:newLayer()
  layer.name = name
  sourceSprite:newCel(layer, 1, layers[name], Point(0, 0))
end

local mapsDir = app.fs.joinPath(root, "public/assets/maps")
local objectsDir = app.fs.joinPath(mapsDir, "objects")
app.fs.makeDirectory(mapsDir)
app.fs.makeDirectory(objectsDir)

local sourcePath = app.fs.joinPath(root, "art/aseprite/farm-day.aseprite")
sourceSprite:saveAs(sourcePath)

local ground = Image(worldWidth, worldHeight, ColorMode.RGB)
for _, name in ipairs({ "ground", "paths", "fences", "decor", "markers" }) do
  ground:drawImage(layers[name], Point(0, 0))
end
ground:saveAs(app.fs.joinPath(mapsDir, "farm-ground.png"))

local preview = Image(worldWidth, worldHeight, ColorMode.RGB)
preview:drawImage(ground, Point(0, 0))
preview:drawImage(layers.buildings, Point(0, 0))
preview:saveAs(app.fs.joinPath(root, "art/preview/farm-day-x1.png"))

for _, object in ipairs(layout.objects) do
  local bounds = object.bounds
  local image = Image(bounds.w, bounds.h, ColorMode.RGB)
  for _, entry in ipairs(object.placements) do copyRepeat(entry, image, bounds.x, bounds.y) end
  image:saveAs(app.fs.joinPath(objectsDir, object.id .. ".png"))
end

print(string.format("saved sprite-only farm map %dx%d", worldWidth, worldHeight))
