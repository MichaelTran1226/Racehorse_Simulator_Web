// Phân bổ và sắp xếp đàn ngựa thật vào các vị trí trực quan trên bản đồ:
// - Bãi thả: 2 ô chuyển động cố định (paddock slots), ưu tiên ổn định theo mã ô chuồng.
// - Dãy chuồng: 3 chỗ đứng nhìn thấy lấy từ anchors của bản đồ.
import type { HorseProfile } from "../sim/engine.ts";
import { FARM_ANCHORS } from "./farmLayout.ts";
import { PADDOCK_SLOTS } from "./paths.ts";

export interface StableStallAnchor {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly cellX: number;
  readonly cellY: number;
}

export interface StableHorseAssignment {
  readonly horse: HorseProfile;
  readonly anchor: StableStallAnchor;
}

/** Tọa độ pixel thế giới của 3 chỗ đứng trước cửa chuồng. */
export const VISIBLE_STABLE_STALLS: readonly StableStallAnchor[] = Object.freeze(
  FARM_ANCHORS.stableStalls.map(({ x, y }, index) => Object.freeze({
    index, x, y, cellX: Math.floor(x / 16), cellY: Math.floor(y / 16),
  })),
);

export function numericStallIndex(stall: { col: number; row: number }): number {
  return stall.row * 6 + stall.col;
}

/**
 * Gán ngựa ra bãi thả với 2 làn ổn định danh tính.
 * Ngựa đủ điều kiện: !medicalLock && (health === "FIT" || health === "WATCH").
 * Mỗi ngựa ưu tiên ô (stallIndex % PADDOCK_SLOTS), nếu ô đã có ngựa thì điền vào ô trống còn lại.
 */
export function assignPaddockHorses(
  horses: readonly HorseProfile[],
): readonly (HorseProfile | null)[] {
  const slots: (HorseProfile | null)[] = Array.from({ length: PADDOCK_SLOTS }, () => null);

  const eligible = horses.filter(
    (h) => !h.medicalLock && (h.health === "FIT" || h.health === "WATCH"),
  );

  const sorted = [...eligible].sort(
    (a, b) => numericStallIndex(a.stall) - numericStallIndex(b.stall),
  );

  for (const horse of sorted) {
    if (slots.every((s) => s !== null)) break;
    const preferred = numericStallIndex(horse.stall) % PADDOCK_SLOTS;
    if (slots[preferred] === null) {
      slots[preferred] = horse;
    } else {
      const emptyIndex = slots.findIndex((s) => s === null);
      if (emptyIndex !== -1) {
        slots[emptyIndex] = horse;
      }
    }
  }

  return slots;
}

/**
 * Gán 3 ngựa đầu tiên (theo ô chuồng) không ra bãi thả vào 3 chỗ chuồng nhìn thấy: 2 ô cửa Barn và mái che Stable.
 */
export function assignStableHorses(
  horses: readonly HorseProfile[],
  paddockIds: ReadonlySet<string>,
): readonly StableHorseAssignment[] {
  // Bản đồ Stardew chỉ có 3 chỗ nhìn thấy: lấp bằng ngựa ở trong chuồng theo thứ tự ô, để Barn không trống khi ngựa ô đầu ra bãi thả.
  return horses
    .filter((horse) => !paddockIds.has(horse.id))
    .sort((a, b) => numericStallIndex(a.stall) - numericStallIndex(b.stall))
    .slice(0, VISIBLE_STABLE_STALLS.length)
    .map((horse, index) => ({ horse, anchor: VISIBLE_STABLE_STALLS[index] }));
}
