import rawLayout from "../../art/map/farm-layout.json" with { type: "json" };

export const ALLOWED_MAP_SHEETS: ReadonlySet<string> = new Set([
  "s01-horse",
  "s06-people",
  "s07-stall",
  "s08-farm",
  "s10-arena",
  "s11-icons",
  "s13-fx",
  "s14-rider",
  "s15-vehicles",
] as const);

export type MapSheet = (typeof rawLayout)["placements"][number]["sheet"];
/** Đường đua mở màn riêng; các khu còn lại mở bảng nổi ngay trên bản đồ. */
export type FarmTarget = "STALL" | "TRACK" | "VET" | "SUPPLY";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface FarmPlacement {
  sheet: string;
  src: Rect;
  dest: Point;
  layer: string;
  z: number;
  objectId?: string;
}

export interface FarmObject {
  id: string;
  name: string;
  target: FarmTarget;
  z: number;
  focus: Point;
  bounds: Rect;
  placements: FarmPlacement[];
}

export const FARM_WORLD = rawLayout.world;

function expandRepeated(
  base: Omit<FarmPlacement, "dest"> & { dest: Point },
  cols: number,
  rows: number,
  objectId?: string,
): FarmPlacement[] {
  const placements: FarmPlacement[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      placements.push({
        ...base,
        dest: { x: base.dest.x + col * base.src.w, y: base.dest.y + row * base.src.h },
        objectId,
      });
    }
  }
  return placements;
}

const fillPlacements = rawLayout.fills.flatMap((fill) =>
  expandRepeated(
    { sheet: fill.sheet, src: fill.src, dest: { x: fill.area.x, y: fill.area.y }, layer: fill.layer, z: fill.z },
    Math.floor(fill.area.w / fill.step.x),
    Math.floor(fill.area.h / fill.step.y),
  ),
);

const loosePlacements: FarmPlacement[] = rawLayout.placements.flatMap((placement) =>
  expandRepeated({ ...placement }, placement.repeat?.cols ?? 1, placement.repeat?.rows ?? 1),
);

export const FARM_OBJECTS: FarmObject[] = rawLayout.objects.map((object) => {
  const placements = object.placements.flatMap((placement) =>
    expandRepeated(
      { sheet: placement.sheet, src: placement.src, dest: placement.dest, layer: placement.layer, z: placement.z },
      placement.repeat?.cols ?? 1,
      placement.repeat?.rows ?? 1,
      object.id,
    ),
  );
  return { ...object, target: object.target as FarmTarget, placements };
});

export const FARM_PLACEMENTS: FarmPlacement[] = [
  ...fillPlacements,
  ...loosePlacements,
  ...FARM_OBJECTS.flatMap((object) => object.placements),
].sort((a, b) => a.z - b.z);

export function validateFarmLayout(): true {
  const sheetSize = 192;
  const ids = new Set<string>();
  const targets = new Set<FarmTarget>(["STALL", "TRACK", "VET", "SUPPLY"]);
  if (FARM_WORLD.width !== 1280 || FARM_WORLD.height !== 768 || FARM_WORLD.tile !== 32) throw new Error("Invalid farm world");
  for (const placement of FARM_PLACEMENTS) {
    if (!ALLOWED_MAP_SHEETS.has(placement.sheet)) throw new Error(`Disallowed sheet ${placement.sheet}`);
    if (placement.src.x < 0 || placement.src.y < 0 || placement.src.w <= 0 || placement.src.h <= 0) throw new Error("Invalid source rect");
    if (placement.src.x + placement.src.w > sheetSize || placement.src.y + placement.src.h > sheetSize) throw new Error("Source rect outside sheet");
    if (placement.dest.x < 0 || placement.dest.y < 0 || placement.dest.x + placement.src.w > FARM_WORLD.width || placement.dest.y + placement.src.h > FARM_WORLD.height) throw new Error("Placement outside world");
  }
  for (const object of FARM_OBJECTS) {
    if (ids.has(object.id)) throw new Error(`Duplicate object ${object.id}`);
    ids.add(object.id);
    if (!targets.has(object.target)) throw new Error(`Invalid target ${object.target}`);
    if (object.focus.x < 0 || object.focus.x > FARM_WORLD.width || object.focus.y < 0 || object.focus.y > FARM_WORLD.height) throw new Error("Focus outside world");
  }
  return true;
}
