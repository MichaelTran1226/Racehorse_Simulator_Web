// Quản lý trạng thái và tính toán tư thế, tọa độ của các nhân vật chuyển động nền (ambient actors) trên bản đồ.
// Tách biệt hoàn toàn tính toán đường đi thuần túy khỏi việc vẽ Canvas.
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
  "LEFT_RIDER",
  "LEFT_COACH",
  "ROAD_CART",
  "SUPPLY_HAYCART",
  "BARN_GROOMING",
  "CHAT_A",
  "CHAT_B",
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

export const LEFT_RIDE_PATH: Path = [{ x: 32, y: 316 }, { x: 200, y: 316 }, { x: 200, y: 372 }, { x: 32, y: 372 }, { x: 32, y: 316 }]; // vòng cưỡi ô đất mép trái
export const LEFT_COACH_POS = { x: 216, y: 412 }; // HLV đứng cạnh cổng ô đất trái

export const ROAD_CART_PATH: Path = [{ x: 40, y: 596 }, { x: 1240, y: 596 }]; // xe điện trên đường đất chính
export const HAYCART_PATH: Path = [{ x: 820, y: 700 }, { x: 1010, y: 700 }]; // xe kéo cỏ giữa kho và phòng khám
export const GROOMING_POS = { x: 856, y: 756 }; // groom; ngựa đứng lệch phải 28 px
export const CHAT_POS_A = { x: 960, y: 640 };
export const CHAT_POS_B = { x: 988, y: 640 };

// S16 (duyệt 20/10/2026): chim trên rào bãi thả, mèo đường kho, bướm khóm hoa nhà cam, túi gió ngoài đường đua
export const BIRD_PATH: Path = [{ x: 220, y: 284 }, { x: 310, y: 284 }];
export const CAT_PATH: Path = [{ x: 710, y: 610 }, { x: 790, y: 610 }];
export const BUTTERFLY_PATH: Path = [{ x: 990, y: 420 }, { x: 1060, y: 440 }, { x: 1010, y: 450 }];
export const WINDSOCK_POS = { x: 840, y: 260 };

/** Chu kỳ "đi walkS giây rồi dừng tay pauseS giây": quãng đã đi không lùi khi dừng. */
export function walkPause(time: number, walkS: number, pauseS: number): { walkedS: number; paused: boolean } {
  const cycle = walkS + pauseS;
  const rest = time % cycle;
  return { walkedS: Math.floor(time / cycle) * walkS + Math.min(rest, walkS), paused: rest >= walkS };
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
      case "S16_BIRD":
        return { ...BIRD_PATH[0], dir: 1, frame: 0, row: 0, flip: false, active: true };
      case "S16_CAT":
        return { ...CAT_PATH[0], dir: 1, frame: 0, row: 1, flip: false, active: true };
      case "S16_BUTTERFLY":
        return { ...BUTTERFLY_PATH[0], dir: 1, frame: 0, row: 2, flip: false, active: true };
      case "S16_WINDSOCK":
        return { ...WINDSOCK_POS, dir: 1, frame: 0, row: 3, flip: false, active: true };
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
    case "S16_BIRD": {
      // nhảy 1 s (khung 2–3) rồi đứng 1 s (khung 0–1): chỉ dời chỗ khi đang nhảy
      const w = walkPause(effectiveTime, 1, 1);
      const p = along(BIRD_PATH, w.walkedS * 15, true);
      const frame = !state.simulationRunning ? 0 : w.paused ? Math.floor(time * 4) % 2 : 2 + (Math.floor(time * 6) % 2);
      return { x: p.x, y: p.y, dir: p.dir, frame, row: 0, flip: p.dir < 0, active: true };
    }
    case "S16_CAT": {
      // đi 2 s (khung 2–3) rồi vươn vai 1 s (khung 4–5) tại chỗ
      const w = walkPause(effectiveTime, 2, 1);
      const p = along(CAT_PATH, w.walkedS * 12, true);
      const frame = !state.simulationRunning ? 0 : w.paused ? 4 + (Math.floor(time * 2) % 2) : 2 + (Math.floor(time * 4) % 2);
      return { x: p.x, y: p.y, dir: p.dir, frame, row: 1, flip: p.dir < 0, active: true };
    }
    case "S16_BUTTERFLY": {
      const p = along(BUTTERFLY_PATH, effectiveTime * 20, true);
      const frame = state.simulationRunning ? 2 + (Math.floor(time * 8) % 4) : 0;
      return { x: p.x, y: p.y, dir: p.dir, frame, row: 2, flip: p.dir < 0, active: true };
    }
    case "S16_WINDSOCK": {
      const frame = state.simulationRunning ? 2 + (Math.floor(time * 6) % 4) : 0;
      return { ...WINDSOCK_POS, dir: 1, frame, row: 3, flip: false, active: true };
    }
  }
}
