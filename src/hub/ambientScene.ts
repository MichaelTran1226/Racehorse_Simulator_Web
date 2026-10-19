// Quản lý trạng thái và tính toán tư thế, tọa độ của các nhân vật chuyển động nền (ambient actors) trên bản đồ.
// Tách biệt hoàn toàn tính toán đường đi thuần túy khỏi việc vẽ Canvas.
import { along, type Path } from "./paths.ts";

export interface AmbientSceneState {
  readonly reducedMotion: boolean;
  readonly simulationRunning: boolean;
  readonly hasHay: boolean;
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
  | "S16_BIRD"
  | "S16_CAT"
  | "S16_BUTTERFLY"
  | "S16_WINDSOCK";

export const AMBIENT_ACTOR_IDS: readonly AmbientActorId[] = [
  "TRACK_RIDER_1",
  "TRACK_RIDER_2",
  "STABLE_GROOM",
  "CLINIC_VET",
  "HOUSE_MANAGER",
  "HOUSE_OWNER",
  "SUPPLY_BARROW",
  "HOUSE_CART",
  "S16_BIRD",
  "S16_CAT",
  "S16_BUTTERFLY",
  "S16_WINDSOCK",
] as const;

export interface AmbientPose {
  readonly x: number;
  readonly y: number;
  readonly dir: 1 | -1;
  readonly frame: number;
  readonly row?: number;
  readonly flip: boolean;
  readonly active: boolean;
}

// Các tuyến đường di chuyển cố định của nhân vật trên bản đồ 1280×768
export const RIDER_PATH: Path = [{ x: 660, y: 236 }, { x: 1170, y: 236 }]; // làn dưới đường đua
export const RIDER2_PATH: Path = [{ x: 600, y: 84 }, { x: 1220, y: 84 }]; // làn trên đường đua
export const GROOM_PATH: Path = [{ x: 50, y: 186 }, { x: 360, y: 186 }]; // lối đi trước dãy chuồng 2
export const VET_PATH: Path = [{ x: 1000, y: 734 }, { x: 1240, y: 734 }]; // trước phòng khám thú y
export const MANAGER_PATH: Path = [{ x: 900, y: 474 }, { x: 1150, y: 474 }]; // trước văn phòng
export const OWNER_PATH: Path = [{ x: 920, y: 474 }, { x: 1140, y: 474 }]; // đi dạo vườn nhà cam
export const BARROW_PATH: Path = [{ x: 620, y: 620 }, { x: 240, y: 620 }, { x: 240, y: 284 }, { x: 140, y: 284 }]; // kho → dãy chuồng
export const CART_PATH: Path = [{ x: 870, y: 346 }, { x: 1240, y: 346 }]; // xe điện nhánh tới văn phòng

// S16 Ambient Life positions/paths:
export const BIRD_PATH: Path = [{ x: 220, y: 284 }, { x: 310, y: 284 }]; // đậu nhảy trên hàng rào bãi thả
export const CAT_PATH: Path = [{ x: 710, y: 610 }, { x: 790, y: 610 }]; // đi dạo đường nối kho - nhà
export const BUTTERFLY_PATH: Path = [{ x: 990, y: 420 }, { x: 1060, y: 440 }, { x: 1010, y: 450 }]; // bay lượn khóm hoa nhà cam
export const WINDSOCK_POS = { x: 840, y: 260 }; // cọc cờ gió bên ngoài hàng rào phía nam đường đua

/** Xe cút kít chở cỏ chỉ chạy khi đang chạy mô phỏng và kho còn cỏ, và không bật chế độ giảm chuyển động. */
export function barrowActive(state: AmbientSceneState): boolean {
  return !state.reducedMotion && state.simulationRunning && state.hasHay;
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
      case "S16_BIRD": {
        return { x: BIRD_PATH[0].x, y: BIRD_PATH[0].y, dir: 1, frame: 0, row: 0, flip: false, active: true };
      }
      case "S16_CAT": {
        return { x: CAT_PATH[0].x, y: CAT_PATH[0].y, dir: 1, frame: 0, row: 1, flip: false, active: true };
      }
      case "S16_BUTTERFLY": {
        return { x: BUTTERFLY_PATH[0].x, y: BUTTERFLY_PATH[0].y, dir: 1, frame: 0, row: 2, flip: false, active: true };
      }
      case "S16_WINDSOCK": {
        return { x: WINDSOCK_POS.x, y: WINDSOCK_POS.y, dir: 1, frame: 0, row: 3, flip: false, active: true };
      }
    }
  }

  const effectiveTime = state.simulationRunning ? time : 0;

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
      const p = along(VET_PATH, effectiveTime * 18, true);
      const frame = state.simulationRunning ? Math.floor(time * 6) % 4 : 4;
      return { x: p.x, y: p.y, dir: p.dir, frame, row: 2, flip: p.dir < 0, active: true };
    }
    case "HOUSE_MANAGER": {
      const p = along(MANAGER_PATH, effectiveTime * 16, true);
      const frame = state.simulationRunning ? Math.floor(time * 6) % 4 : 4;
      return { x: p.x, y: p.y, dir: p.dir, frame, row: 0, flip: p.dir < 0, active: true };
    }
    case "HOUSE_OWNER": {
      const p = along(OWNER_PATH, effectiveTime * 14, true);
      const frame = state.simulationRunning ? Math.floor(time * 6) % 4 : 4;
      return { x: p.x, y: p.y, dir: p.dir, frame, row: 4, flip: p.dir < 0, active: true };
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
    case "S16_BIRD": {
      const p = along(BIRD_PATH, effectiveTime * 15, true);
      const frame = state.simulationRunning
        ? (Math.floor(time * 3) % 2 === 0 ? Math.floor(time * 4) % 2 : 2 + (Math.floor(time * 6) % 2))
        : 0;
      return { x: p.x, y: p.y, dir: p.dir, frame, row: 0, flip: p.dir < 0, active: true };
    }
    case "S16_CAT": {
      const p = along(CAT_PATH, effectiveTime * 12, true);
      const phase = Math.floor(time * 2) % 6;
      const frame = state.simulationRunning
        ? (phase < 4 ? 2 + (Math.floor(time * 4) % 2) : 4 + (Math.floor(time * 2) % 2))
        : 0;
      return { x: p.x, y: p.y, dir: p.dir, frame, row: 1, flip: p.dir < 0, active: true };
    }
    case "S16_BUTTERFLY": {
      const p = along(BUTTERFLY_PATH, effectiveTime * 20, true);
      const frame = state.simulationRunning ? 2 + (Math.floor(time * 8) % 4) : 0;
      return { x: p.x, y: p.y, dir: p.dir, frame, row: 2, flip: p.dir < 0, active: true };
    }
    case "S16_WINDSOCK": {
      const frame = state.simulationRunning ? 2 + (Math.floor(time * 6) % 4) : 0;
      return { x: WINDSOCK_POS.x, y: WINDSOCK_POS.y, dir: 1, frame, row: 3, flip: false, active: true };
    }
  }
}
