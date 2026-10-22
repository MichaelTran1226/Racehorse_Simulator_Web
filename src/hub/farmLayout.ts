import rawLayout from "../../art/map/farm-layout.json" with { type: "json" };

export const SHEET_SIZES: Readonly<Record<string, { w: number; h: number }>> = {
  "sv-spring-outdoors": { w: 400, h: 1264 },
  "sv-flooring": { w: 256, h: 256 },
  "sv-fence-wood": { w: 48, h: 192 },
  "sv-fence-iron": { w: 48, h: 192 },
  "sv-barn": { w: 112, h: 128 },
  "sv-shed": { w: 112, h: 128 },
  "sv-silo": { w: 48, h: 128 },
  "sv-stable": { w: 64, h: 96 },
  "sv-coop": { w: 96, h: 128 },
  "sv-well": { w: 48, h: 80 },
  "sv-houses": { w: 272, h: 432 },
  "sv-spring-town": { w: 512, h: 992 },
  "sv-tree1-spring": { w: 48, h: 160 },
  "sv-tree2-spring": { w: 48, h: 160 },
  "sv-bushes": { w: 128, h: 256 },
  "sv-craftables": { w: 128, h: 736 },
  "sv-mill": { w: 224, h: 128 },
  /** Phòng khám Harvey dựng đối xứng từ nửa trái sv-spring-town (art/aseprite/patch-clinic.lua; ngoại lệ người dùng duyệt 21/10/2026). */
  "sv-clinic": { w: 112, h: 128 },
};

export const ALLOWED_MAP_SHEETS: ReadonlySet<string> = new Set(Object.keys(SHEET_SIZES));

export type MapSheet = (typeof rawLayout)["placements"][number]["sheet"];
/** Đường đua mở màn riêng; các khu còn lại mở bảng nổi ngay trên bản đồ. */
export type FarmTarget = "STALL" | "TRACK" | "VET" | "SUPPLY" | "GROOM";

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
export const FARM_ANCHORS: { stableStalls: Point[]; supplyDoor: Point; houseDoor: Point; clinicDoor: Point; mainFocus: Point; perches: Point[] } = rawLayout.anchors;

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

type RepeatedPlacement = FarmPlacement & { repeat?: { cols: number; rows: number } };

const loosePlacements: FarmPlacement[] = rawLayout.placements.flatMap((placement: RepeatedPlacement) =>
  expandRepeated({ ...placement }, placement.repeat?.cols ?? 1, placement.repeat?.rows ?? 1),
);

export const FARM_OBJECTS: FarmObject[] = rawLayout.objects.map((object) => {
  const placements = object.placements.flatMap((placement: RepeatedPlacement) =>
    expandRepeated(
      { sheet: placement.sheet, src: placement.src, dest: placement.dest, layer: placement.layer, z: placement.z },
      placement.repeat?.cols ?? 1,
      placement.repeat?.rows ?? 1,
      object.id,
    ),
  );
  return { ...object, target: object.target as FarmTarget, placements };
});

export const FARM_INTERACTIVE_OBJECTS: readonly FarmObject[] = FARM_OBJECTS;

export const FARM_PLACEMENTS: FarmPlacement[] = [
  ...fillPlacements,
  ...loosePlacements,
  ...FARM_OBJECTS.flatMap((object) => object.placements),
].sort((a, b) => a.z - b.z);

export function validateFarmLayout(): true {
  const ids = new Set<string>();
  const targets = new Set<FarmTarget>(["STALL", "TRACK", "VET", "SUPPLY", "GROOM"]);
  if (FARM_WORLD.width !== 1280 || FARM_WORLD.height !== 768 || FARM_WORLD.tile !== 16) throw new Error("Invalid farm world");
  for (const placement of FARM_PLACEMENTS) {
    if (!ALLOWED_MAP_SHEETS.has(placement.sheet)) throw new Error(`Disallowed sheet ${placement.sheet}`);
    const sheetSize = SHEET_SIZES[placement.sheet];
    if (placement.src.x < 0 || placement.src.y < 0 || placement.src.w <= 0 || placement.src.h <= 0) throw new Error("Invalid source rect");
    if (placement.src.x + placement.src.w > sheetSize.w || placement.src.y + placement.src.h > sheetSize.h) throw new Error("Source rect outside sheet");
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

/** Đường người, xe và ngựa đi qua: đồ trang trí rời không được đè lên. */
export const RESERVED_CORRIDORS: readonly Rect[] = [
  { x: 0, y: 304, w: 1280, h: 48 },   // đường xe hàng 3 ô, mép trái → cửa kho → mép phải
  { x: 16, y: 80, w: 1248, h: 32 },   // đường trên
  { x: 192, y: 80, w: 32, h: 688 },   // đường dọc phía tây
  { x: 608, y: 80, w: 32, h: 208 },   // nhánh giữa chuồng ngựa và trạm y tế
  { x: 624, y: 704, w: 48, h: 64 },   // cổng nam đường đua
] as const;

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function validateDecorCorridors(): true {
  const looseDecor = loosePlacements.filter((p) => p.layer === "decor");
  for (const decor of looseDecor) {
    const rect: Rect = { x: decor.dest.x, y: decor.dest.y, w: decor.src.w, h: decor.src.h };
    if (RESERVED_CORRIDORS.some((corridor) => rectsOverlap(rect, corridor))) {
      throw new Error(`Decor placement at (${decor.dest.x}, ${decor.dest.y}) overlaps reserved corridor`);
    }
    for (const object of FARM_OBJECTS) {
      if (rectsOverlap(rect, object.bounds)) {
        throw new Error(`Decor placement at (${decor.dest.x}, ${decor.dest.y}) overlaps building ${object.id}`);
      }
    }
  }
  return true;
}


