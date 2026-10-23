// Quản lý trạng thái và tính toán tư thế, tọa độ của các nhân vật chuyển động nền (ambient actors) trên bản đồ.
// Tách biệt hoàn toàn tính toán đường đi thuần túy khỏi việc vẽ Canvas.
import { FARM_ANCHORS } from "./farmLayout.ts";
import { along, type Path } from "./paths.ts";

export interface AmbientSceneState {
  readonly reducedMotion: boolean;
  readonly simulationRunning: boolean;
  readonly hasHay: boolean;
}

export interface AmbientClock {
  readonly time: number;
  readonly lastNow: number;
}

/** Advance only while the simulation runs, while always consuming real elapsed time. */
export function advanceAmbientClock(clock: AmbientClock, now: number, running: boolean): AmbientClock {
  const elapsed = Math.max(0, now - clock.lastNow);
  return {
    time: running ? clock.time + elapsed : clock.time,
    lastNow: now,
  };
}

export type AmbientActorId =
  | "TRACK_RIDER_1"
  | "TRACK_RIDER_2"
  | "STABLE_GROOM"
  | "CLINIC_VET"
  | "HOUSE_MANAGER"
  | "HOUSE_OWNER"
  | "SUPPLY_BARROW"
  | "HOUSE_CART"
  | "LEFT_RIDER"
  | "LEFT_COACH"
  | "ROAD_CART"
  | "SUPPLY_HAYCART"
  | "BARN_GROOMING"
  | "CHAT_A"
  | "CHAT_B"
  | "SV_CHICKEN_1"
  | "SV_CHICKEN_2"
  | "SV_CHICKEN_3"
  | "SV_DUCK"
  | "SV_DOG"
  | "SV_CAT"
  | "WILD_BLUEBIRD_1"
  | "WILD_BLUEBIRD_2"
  | "WILD_SPARROW_1"
  | "WILD_SPARROW_2"
  | "WILD_RABBIT"
  | "WILD_SQUIRREL";

export const AMBIENT_ACTOR_IDS: readonly AmbientActorId[] = [
  "TRACK_RIDER_1",
  "TRACK_RIDER_2",
  "STABLE_GROOM",
  "CLINIC_VET",
  "HOUSE_MANAGER",
  "HOUSE_OWNER",
  "SUPPLY_BARROW",
  "HOUSE_CART",
  "LEFT_RIDER",
  "LEFT_COACH",
  "ROAD_CART",
  "SUPPLY_HAYCART",
  "BARN_GROOMING",
  "CHAT_A",
  "CHAT_B",
  "SV_CHICKEN_1",
  "SV_CHICKEN_2",
  "SV_CHICKEN_3",
  "SV_DUCK",
  "SV_DOG",
  "SV_CAT",
  "WILD_BLUEBIRD_1",
  "WILD_BLUEBIRD_2",
  "WILD_SPARROW_1",
  "WILD_SPARROW_2",
  "WILD_RABBIT",
  "WILD_SQUIRREL",
] as const;

/** PNG con vật Stardew trong public/assets/sprites/sv/ (hàng 0 xuống, 1 phải, 2 lên, 3 trái; mèo hàng 7 ngủ). */
export type CritterSheet = "whiteChicken" | "brownChicken" | "duck" | "dog" | "cat" | "wild";

export interface AmbientPose {
  readonly x: number;
  readonly y: number;
  readonly dir: 1 | -1;
  readonly frame: number;
  readonly row?: number;
  readonly flip: boolean;
  readonly active: boolean;
  /** Chỉ con vật Stardew: sheet và cỡ khung vuông. */
  readonly sheet?: CritterSheet;
  readonly size?: 16 | 32;
}

// Các tuyến đường di chuyển cố định của nhân vật trên bản đồ v3 1280×768 (đường xe hàng y 304–352)
export const RIDER_PATH: Path = [{ x: 420, y: 708 }, { x: 860, y: 708 }]; // thẳng nam đường đua
export const RIDER2_PATH: Path = [{ x: 420, y: 430 }, { x: 860, y: 430 }]; // thẳng bắc đường đua
export const GROOM_PATH: Path = [{ x: 368, y: 298 }, { x: 560, y: 298 }]; // trước kho và chuồng
export const VET_PATH: Path = [FARM_ANCHORS.clinicDoor, { x: 728, y: 316 }, { x: 830, y: 316 }];
export const MANAGER_PATH: Path = [FARM_ANCHORS.houseDoor, { x: 920, y: 330 }, { x: 1040, y: 330 }];
export const OWNER_PATH: Path = [FARM_ANCHORS.houseDoor, { x: 920, y: 330 }, { x: 800, y: 330 }];
export const BARROW_PATH: Path = [FARM_ANCHORS.supplyDoor, { x: 304, y: 330 }, { x: 512, y: 330 }, { x: 512, y: 298 }];
export const CART_PATH: Path = [{ x: 40, y: 104 }, { x: 1240, y: 104 }]; // đường ngang trên cùng

export const LEFT_RIDE_PATH: Path = [{ x: 1024, y: 200 }, { x: 1200, y: 200 }, { x: 1200, y: 256 }, { x: 1024, y: 256 }, { x: 1024, y: 200 }]; // vòng tập trong sân cát
export const LEFT_COACH_POS = { x: 1112, y: 232 };

export const ROAD_CART_PATH: Path = [{ x: 24, y: 322 }, { x: 1256, y: 322 }];
export const HAYCART_PATH: Path = [{ x: 100, y: 348 }, { x: 520, y: 348 }]; // từ vườn cỏ khô phía tây tới chuồng, làn dưới đường xe hàng
export const GROOMING_POS = { x: 1158, y: 392 }; // groom; ngựa đứng lệch phải 28 px
export const CHAT_POS_A = { x: 1000, y: 300 };
export const CHAT_POS_B = { x: 1028, y: 300 };

const MANAGER_PATH_LENGTH = MANAGER_PATH.slice(1).reduce((length, p, i) => length + Math.hypot(p.x - MANAGER_PATH[i].x, p.y - MANAGER_PATH[i].y), 0);
const OWNER_PATH_LENGTH = OWNER_PATH.slice(1).reduce((length, p, i) => length + Math.hypot(p.x - OWNER_PATH[i].x, p.y - OWNER_PATH[i].y), 0);

// Con vật Stardew (không có bò): gà vịt trong vườn rào phía tây trên (cạnh cối xay), chó dưới đường xe hàng, mèo ngủ cạnh phòng khám
export const POULTRY_YARD = { x: 96, y: 192, w: 64, h: 64 } as const; // cột 6–9, hàng 12–15 của vườn trên
export const CHICKEN_PATHS: readonly Path[] = [
  [{ x: 100, y: 214 }, { x: 150, y: 216 }],
  [{ x: 104, y: 236 }, { x: 154, y: 234 }],
  [{ x: 98, y: 252 }, { x: 140, y: 254 }],
];
export const DUCK_PATH: Path = [{ x: 108, y: 198 }, { x: 150, y: 200 }];
export const DOG_PATH: Path = [{ x: 260, y: 366 }, { x: 400, y: 366 }];
export const CAT_POS = { x: 792, y: 298 };
// Con vật hoang Stardew (critters_ambient.png, khung 32×32) ở hai vườn cảnh phía tây.
export const WILD_PATHS = {
  WILD_BLUEBIRD_1: [{ x: 90, y: 410 }, { x: 136, y: 412 }],
  WILD_SPARROW_1: [{ x: 110, y: 650 }, { x: 150, y: 652 }],
  WILD_BLUEBIRD_2: [{ x: 112, y: 560 }, { x: 138, y: 560 }],
  WILD_SPARROW_2: [{ x: 36, y: 604 }, { x: 80, y: 604 }],
  WILD_RABBIT: [{ x: 36, y: 528 }, { x: 88, y: 530 }],
  WILD_SQUIRREL: [{ x: 36, y: 690 }, { x: 84, y: 694 }],
} as const satisfies Record<string, Path>;
type WildId = keyof typeof WILD_PATHS;
/** Hàng trong sheet, khung khi đi/nhảy và khi đứng mổ/ngồi, hướng mặt gốc của khung (-1 trái, 1 phải). */
export const WILD_KINDS = {
  bluebird: { row: 4, walk: [5, 7], idle: [8, 9, 5], faces: -1 },
  sparrow: { row: 2, walk: [5, 7], idle: [8, 9, 5], faces: -1 },
  rabbit: { row: 5, walk: [4, 5, 6, 7, 8, 9], idle: [4], faces: 1 },
  squirrel: { row: 6, walk: [2, 3, 4, 5, 6, 7], idle: [0, 1], faces: 1 },
  crow: { row: 1, walk: [4, 5], idle: [4, 5, 9], faces: -1 },
} as const;

const PERCH_KINDS = ["sparrow", "crow", "bluebird", "sparrow", "bluebird"] as const;

/** Chim đậu trên tán cây (FARM_ANCHORS.perches): đổi tư thế chậm, thỉnh thoảng quay đầu; đứng im khi giảm chuyển động. */
export function perchedBirds(time: number, state: AmbientSceneState): AmbientPose[] {
  return FARM_ANCHORS.perches.map((p, i) => {
    const kind = WILD_KINDS[PERCH_KINDS[i % PERCH_KINDS.length]];
    const live = !state.reducedMotion && state.simulationRunning;
    const t = time + i * 1.7;
    const frame = live ? kind.idle[Math.floor(t * 0.8) % kind.idle.length] : kind.idle[0];
    const flip = !state.reducedMotion && Math.floor((t + i) / 4) % 2 === 1;
    return { x: p.x, y: p.y, dir: flip ? 1 : -1, frame, row: kind.row, flip, active: true, sheet: "wild", size: 32 };
  });
}
export interface BirdFlightRoute {
  readonly fromIdx: number;
  readonly toIdx: number;
  readonly kind: keyof typeof WILD_KINDS;
  readonly phaseOffset: number;
  readonly duration: number;
  readonly cyclePeriod: number;
  readonly arcHeight: number;
}

export const BIRD_FLIGHT_ROUTES: readonly BirdFlightRoute[] = [
  // Chim sẻ bay từ cây tây-bắc (Perch 4) sang cây giữa bắc (Perch 5)
  { fromIdx: 4, toIdx: 5, kind: "sparrow", phaseOffset: 0, duration: 4.5, cyclePeriod: 16, arcHeight: 38 },
  // Chim xanh bay từ cây giữa bắc (Perch 5) sang cây đông cạnh nhà Groom (Perch 6)
  { fromIdx: 5, toIdx: 6, kind: "bluebird", phaseOffset: 5.5, duration: 4.8, cyclePeriod: 18, arcHeight: 42 },
  // Quạ bay lượn dọc theo rào nam đường đua (Perch 0 sang Perch 1)
  { fromIdx: 0, toIdx: 1, kind: "crow", phaseOffset: 11, duration: 5.2, cyclePeriod: 22, arcHeight: 32 },
] as const;

/** Chim bay qua lại giữa các tán cây theo đường cong parabol nhấp nhô tuyệt đẹp. */
export function getFlyingBirds(time: number, state: AmbientSceneState): AmbientPose[] {
  if (state.reducedMotion) return [];

  const flying: AmbientPose[] = [];
  for (const route of BIRD_FLIGHT_ROUTES) {
    const cycleT = (time + route.phaseOffset) % route.cyclePeriod;
    if (cycleT >= route.duration) continue; // đang đậu trên cây, không trong pha bay

    const fromPerch = FARM_ANCHORS.perches[route.fromIdx];
    const toPerch = FARM_ANCHORS.perches[route.toIdx];
    if (!fromPerch || !toPerch) continue;

    const p = cycleT / route.duration; // 0..1
    const x = fromPerch.x + (toPerch.x - fromPerch.x) * p;
    // Đường cong parabol: bay vồng lên trời ở giữa chặng
    const y = fromPerch.y + (toPerch.y - fromPerch.y) * p - Math.sin(Math.PI * p) * route.arcHeight;

    const dir: 1 | -1 = toPerch.x >= fromPerch.x ? 1 : -1;
    const kind = WILD_KINDS[route.kind];

    // Khung hình vỗ cánh liên tục (cột 0..3 trong critters sheet)
    const frame = state.simulationRunning ? Math.floor(time * 12) % 4 : 0;
    const flip = dir !== kind.faces;

    flying.push({
      x: Math.round(x),
      y: Math.round(y),
      dir,
      frame,
      row: kind.row,
      flip,
      active: true,
      sheet: "wild",
      size: 32,
    });
  }

  return flying;
}

const WILD_KIND: Record<WildId, keyof typeof WILD_KINDS> = {
  WILD_BLUEBIRD_1: "bluebird", WILD_BLUEBIRD_2: "bluebird", WILD_SPARROW_1: "sparrow", WILD_SPARROW_2: "sparrow", WILD_RABBIT: "rabbit", WILD_SQUIRREL: "squirrel",
};
const WILD_PHASE: Record<WildId, number> = { WILD_BLUEBIRD_1: 0, WILD_BLUEBIRD_2: 2.3, WILD_SPARROW_1: 1.1, WILD_SPARROW_2: 3.4, WILD_RABBIT: 0.7, WILD_SQUIRREL: 1.9 };
const isWild = (id: AmbientActorId): id is WildId => id.startsWith("WILD_");

/** Chim nhảy rồi mổ, thỏ nhảy, sóc chạy rồi ngồi; lật khung để luôn quay mặt theo hướng đi. */
function wildCritter(id: WildId, time: number, running: boolean): AmbientPose {
  const kind = WILD_KINDS[WILD_KIND[id]];
  const t = time + WILD_PHASE[id];
  const w = walkPause(t, 2, 3);
  const p = along(WILD_PATHS[id], w.walkedS * 16, true);
  const moving = running && !w.paused;
  const frames: readonly number[] = moving ? kind.walk : kind.idle;
  const frame = running ? frames[Math.floor(t * (moving ? 10 : 2.5)) % frames.length] : frames[0];
  return { x: p.x, y: p.y, dir: p.dir, frame, row: kind.row, flip: p.dir !== kind.faces, active: true, sheet: "wild", size: 32 };
}

const CHICKEN_SHEET = ["whiteChicken", "brownChicken", "whiteChicken"] as const;
const CHICKEN_PHASE = [0, 1.7, 3.1] as const;
const chickenIndex = (id: AmbientActorId) => Number(id.slice(-1)) - 1;

/** Con vật đi rồi đứng: khi đi dùng hàng phải (1) / trái (3); khi đứng hoặc tạm dừng dùng hàng 0 cột 0. */
function critterWalk(path: Path, sheet: CritterSheet, size: 16 | 32, time: number, walkS: number, pauseS: number, speed: number, running: boolean): AmbientPose {
  const w = walkPause(time, walkS, pauseS);
  const p = along(path, w.walkedS * speed, true);
  const moving = running && !w.paused;
  return { x: p.x, y: p.y, dir: p.dir, frame: moving ? Math.floor(time * 8) % 4 : 0, row: moving ? (p.dir > 0 ? 1 : 3) : 0, flip: false, active: true, sheet, size };
}

/** Chu kỳ "đi walkS giây rồi dừng tay pauseS giây": quãng đã đi không lùi khi dừng. */
export function walkPause(time: number, walkS: number, pauseS: number): { walkedS: number; paused: boolean } {
  const cycle = walkS + pauseS;
  const rest = time % cycle;
  return { walkedS: Math.floor(time / cycle) * walkS + Math.min(rest, walkS), paused: rest >= walkS };
}

/** Ra khỏi cửa rồi trở về trước khi nghỉ trong nhà; mỗi chu kỳ bắt đầu lại tại cửa. */
export function doorTrip(time: number, outS: number, inS: number): { walkedS: number; inside: boolean } {
  const rest = time % (outS + inS);
  return { walkedS: Math.min(rest, outS), inside: rest >= outS };
}

/** Xe cút kít còn hiện khi kho có cỏ; đồng hồ ambient quyết định chạy hay đứng yên khi Pause. */
export function barrowActive(state: AmbientSceneState): boolean {
  return !state.reducedMotion && state.hasHay;
}

/**
 * Tính toán tư thế (tọa độ, hướng nhìn, khung hình) cho từng nhân vật ambient.
 * Khi bật reducedMotion: giữ nguyên vị trí tĩnh và đứng yên (khung 4 cho người, khung 0 cho xe/ngựa/sinh vật).
 */
export function ambientActorPose(
  actor: AmbientActorId,
  time: number,
  state: AmbientSceneState,
): AmbientPose {
  if (isWild(actor)) {
    if (!state.reducedMotion) return wildCritter(actor, time, state.simulationRunning);
    const kind = WILD_KINDS[WILD_KIND[actor]];
    return { ...WILD_PATHS[actor][0], dir: 1, frame: kind.idle[0], row: kind.row, flip: kind.faces < 0, active: true, sheet: "wild", size: 32 };
  }
  if (state.reducedMotion) {
    switch (actor) {
      case "TRACK_RIDER_1": {
        const p = along(RIDER_PATH, 0, true);
        return { x: p.x, y: p.y, dir: 1, frame: 0, flip: false, active: true };
      }
      case "TRACK_RIDER_2": {
        const p = along(RIDER2_PATH, 0, true);
        return { x: p.x, y: p.y, dir: 1, frame: 0, flip: false, active: true };
      }
      case "STABLE_GROOM": {
        const p = along(GROOM_PATH, 0, true);
        return { x: p.x, y: p.y, dir: 1, frame: 4, row: 3, flip: false, active: true };
      }
      case "CLINIC_VET": {
        const p = along(VET_PATH, 0, true);
        return { x: p.x, y: p.y, dir: 1, frame: 4, row: 2, flip: false, active: true };
      }
      case "HOUSE_MANAGER": {
        const p = along(MANAGER_PATH, 0, true);
        return { x: p.x, y: p.y, dir: 1, frame: 4, row: 0, flip: false, active: true };
      }
      case "HOUSE_OWNER": {
        const p = along(OWNER_PATH, 0, true);
        return { x: p.x, y: p.y, dir: 1, frame: 4, row: 4, flip: false, active: true };
      }
      case "SUPPLY_BARROW": {
        const p = along(BARROW_PATH, 0, true);
        return { x: p.x, y: p.y, dir: 1, frame: 4, row: 3, flip: false, active: false };
      }
      case "HOUSE_CART": {
        const p = along(CART_PATH, 0, true);
        return { x: p.x, y: p.y, dir: 1, frame: 0, flip: false, active: true };
      }
      case "LEFT_RIDER": {
        const p = along(LEFT_RIDE_PATH, 0, false);
        return { x: p.x, y: p.y, dir: 1, frame: 0, row: 2, flip: false, active: true };
      }
      case "LEFT_COACH":
        return { ...LEFT_COACH_POS, dir: -1, frame: 4, row: 1, flip: true, active: true };
      case "ROAD_CART": {
        const p = along(ROAD_CART_PATH, 0, true);
        return { x: p.x, y: p.y, dir: 1, frame: 0, flip: false, active: true };
      }
      case "SUPPLY_HAYCART": {
        const p = along(HAYCART_PATH, 0, true);
        return { x: p.x, y: p.y, dir: 1, frame: 4, row: 3, flip: false, active: false };
      }
      case "BARN_GROOMING":
        return { ...GROOMING_POS, dir: 1, frame: 4, row: 3, flip: false, active: true };
      case "CHAT_A":
        return { ...CHAT_POS_A, dir: 1, frame: 4, row: 4, flip: false, active: true };
      case "CHAT_B":
        return { ...CHAT_POS_B, dir: -1, frame: 4, row: 5, flip: true, active: true };
      case "SV_CHICKEN_1":
      case "SV_CHICKEN_2":
      case "SV_CHICKEN_3": {
        const i = chickenIndex(actor);
        return { ...CHICKEN_PATHS[i][0], dir: 1, frame: 0, row: 0, flip: false, active: true, sheet: CHICKEN_SHEET[i], size: 16 };
      }
      case "SV_DUCK":
        return { ...DUCK_PATH[0], dir: 1, frame: 0, row: 0, flip: false, active: true, sheet: "duck", size: 16 };
      case "SV_DOG":
        return { ...DOG_PATH[0], dir: 1, frame: 0, row: 0, flip: false, active: true, sheet: "dog", size: 32 };
      case "SV_CAT":
        return { ...CAT_POS, dir: 1, frame: 0, row: 7, flip: false, active: true, sheet: "cat", size: 32 };
    }
  }

  const effectiveTime = time;

  switch (actor) {
    case "TRACK_RIDER_1": {
      const p = along(RIDER_PATH, effectiveTime * 120, true);
      const frame = state.simulationRunning ? Math.floor(time * 12) % 6 : 0;
      return { x: p.x, y: p.y, dir: p.dir, frame, flip: p.dir < 0, active: true };
    }
    case "TRACK_RIDER_2": {
      const p = along(RIDER2_PATH, effectiveTime * 100 + 400, true);
      const frame = state.simulationRunning ? Math.floor(time * 12 + 400) % 6 : 0;
      return { x: p.x, y: p.y, dir: p.dir, frame, flip: p.dir < 0, active: true };
    }
    case "STABLE_GROOM": {
      const p = along(GROOM_PATH, effectiveTime * 26, true);
      const frame = state.simulationRunning ? Math.floor(time * 6) % 4 : 4;
      return { x: p.x, y: p.y, dir: p.dir, frame, row: 3, flip: p.dir < 0, active: true };
    }
    case "CLINIC_VET": {
      const w = walkPause(effectiveTime, 10, 3);
      const p = along(VET_PATH, w.walkedS * 18, true);
      const frame = !state.simulationRunning ? 4 : w.paused ? 5 : Math.floor(time * 6) % 4;
      return { x: p.x, y: p.y, dir: p.dir, frame, row: 2, flip: p.dir < 0, active: true };
    }
    case "HOUSE_MANAGER": {
      const trip = doorTrip(effectiveTime, 16, 6);
      const p = along(MANAGER_PATH, trip.walkedS * (2 * MANAGER_PATH_LENGTH / 16), true);
      const frame = state.simulationRunning ? Math.floor(time * 6) % 4 : 4;
      return { x: p.x, y: p.y, dir: p.dir, frame, row: 0, flip: p.dir < 0, active: !trip.inside };
    }
    case "HOUSE_OWNER": {
      const trip = doorTrip(effectiveTime + 11, 14, 8);
      const p = along(OWNER_PATH, trip.walkedS * (2 * OWNER_PATH_LENGTH / 14), true);
      const frame = state.simulationRunning ? Math.floor(time * 6) % 4 : 4;
      return { x: p.x, y: p.y, dir: p.dir, frame, row: 4, flip: p.dir < 0, active: !trip.inside };
    }
    case "SUPPLY_BARROW": {
      const active = barrowActive(state);
      const p = along(BARROW_PATH, effectiveTime * 22, true);
      const frame = state.simulationRunning ? Math.floor(time * 6) % 4 : 4;
      return { x: p.x, y: p.y, dir: p.dir, frame, row: 3, flip: p.dir < 0, active };
    }
    case "HOUSE_CART": {
      const p = along(CART_PATH, effectiveTime * 40, true);
      return { x: p.x, y: p.y, dir: p.dir, frame: 0, flip: p.dir < 0, active: true };
    }
    case "LEFT_RIDER": {
      const p = along(LEFT_RIDE_PATH, effectiveTime * 30, false);
      const frame = state.simulationRunning ? Math.floor(time * 8) % 6 : 0;
      return { x: p.x, y: p.y, dir: p.dir, frame, row: 2, flip: p.dir < 0, active: true };
    }
    case "LEFT_COACH": {
      const frame = state.simulationRunning && walkPause(time, 6, 2).paused ? 5 : 4;
      return { ...LEFT_COACH_POS, dir: -1, frame, row: 1, flip: true, active: true };
    }
    case "ROAD_CART": {
      const p = along(ROAD_CART_PATH, effectiveTime * 45, true);
      return { x: p.x, y: p.y, dir: p.dir, frame: 0, flip: p.dir < 0, active: true };
    }
    case "SUPPLY_HAYCART": {
      const p = along(HAYCART_PATH, effectiveTime * 20, true);
      const frame = state.simulationRunning ? Math.floor(time * 6) % 4 : 4;
      return { x: p.x, y: p.y, dir: p.dir, frame, row: 3, flip: p.dir < 0, active: barrowActive(state) };
    }
    case "BARN_GROOMING": {
      const frame = state.simulationRunning && walkPause(time, 2, 2).paused ? 5 : 4;
      return { ...GROOMING_POS, dir: 1, frame, row: 3, flip: false, active: true };
    }
    case "CHAT_A": {
      const frame = state.simulationRunning && walkPause(time, 3, 1).paused ? 5 : 4;
      return { ...CHAT_POS_A, dir: 1, frame, row: 4, flip: false, active: true };
    }
    case "CHAT_B": {
      const frame = state.simulationRunning && walkPause(time + 2, 3, 1).paused ? 5 : 4;
      return { ...CHAT_POS_B, dir: -1, frame, row: 5, flip: true, active: true };
    }
    case "SV_CHICKEN_1":
    case "SV_CHICKEN_2":
    case "SV_CHICKEN_3": {
      const i = chickenIndex(actor);
      return critterWalk(CHICKEN_PATHS[i], CHICKEN_SHEET[i], 16, time + CHICKEN_PHASE[i], 3, 2, 10, state.simulationRunning);
    }
    case "SV_DUCK":
      return critterWalk(DUCK_PATH, "duck", 16, time, 2, 3, 10, state.simulationRunning);
    case "SV_DOG":
      return critterWalk(DOG_PATH, "dog", 32, time, 6, 3, 30, state.simulationRunning);
    case "SV_CAT": {
      const frame = state.simulationRunning ? Math.floor(time * 1.5) % 2 : 0;
      return { ...CAT_POS, dir: 1, frame, row: 7, flip: false, active: true, sheet: "cat", size: 32 };
    }
  }
}

export interface SmokePuff {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly alpha: number;
}

export function getChimneySmokePuffs(time: number, reducedMotion: boolean): readonly SmokePuff[] {
  const CHIMNEY_X = 955;
  const CHIMNEY_Y = 148;
  if (reducedMotion) {
    return [{ x: CHIMNEY_X, y: CHIMNEY_Y - 4, size: 4, alpha: 0.45 }];
  }
  const PERIOD = 3.5;
  const PUFFS = 5;
  const list: SmokePuff[] = [];
  for (let i = 0; i < PUFFS; i++) {
    const t = (time + (i * PERIOD) / PUFFS) % PERIOD;
    const p = t / PERIOD; // 0..1
    const y = CHIMNEY_Y - p * 34;
    const x = CHIMNEY_X + p * 8 + Math.sin(p * Math.PI * 2) * 3;
    const size = Math.round(2 + p * 4);
    const alpha = (1 - p) * 0.7;
    list.push({ x: Math.round(x), y: Math.round(y), size, alpha });
  }
  return list;
}

export interface SpeechBubble {
  readonly actorId: AmbientActorId;
  readonly text: string;
}

export function getActiveSpeechBubbles(time: number): readonly SpeechBubble[] {
  const bubbles: SpeechBubble[] = [];

  // 1. Đối thoại giữa CHAT_A và CHAT_B (chu kỳ 20 giây)
  const chatCycle = time % 20;
  if (chatCycle >= 1 && chatCycle < 5) {
    bubbles.push({ actorId: "CHAT_A", text: "Nghe nói đợt cỏ mới thơm lắm!" });
  } else if (chatCycle >= 5.5 && chatCycle < 9.5) {
    bubbles.push({ actorId: "CHAT_B", text: "Ừ, kho vừa nhập sáng nay đấy." });
  } else if (chatCycle >= 11 && chatCycle < 15) {
    bubbles.push({ actorId: "CHAT_A", text: "Chiều nay huấn luyện mấy giờ?" });
  } else if (chatCycle >= 15.5 && chatCycle < 19.5) {
    bubbles.push({ actorId: "CHAT_B", text: "Tầm 3 giờ là bắt đầu ra sân." });
  }

  // 2. Lời thoại của các nhân viên khác (chu kỳ lệch nhau)
  const vetCycle = (time + 4) % 18;
  if (vetCycle >= 0 && vetCycle < 4) {
    bubbles.push({ actorId: "CLINIC_VET", text: "Nhịp tim các bé rất đều." });
  }

  const groomCycle = (time + 10) % 22;
  if (groomCycle >= 0 && groomCycle < 4) {
    bubbles.push({ actorId: "STABLE_GROOM", text: "Máng ăn đã sạch bong!" });
  }

  const groomingCycle = (time + 16) % 24;
  if (groomingCycle >= 0 && groomingCycle < 4) {
    bubbles.push({ actorId: "BARN_GROOMING", text: "Lông mượt thế này vào giải chắc thắng!" });
  }

  const coachCycle = (time + 7) % 16;
  if (coachCycle >= 0 && coachCycle < 4) {
    bubbles.push({ actorId: "LEFT_COACH", text: "Giữ vững nhịp kiệu nhé!" });
  }

  return bubbles;
}

