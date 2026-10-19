// Phân bổ và sắp xếp đàn ngựa thật vào các vị trí trực quan trên bản đồ:
// - Bãi thả: 2 ô chuyển động cố định (paddock slots), ưu tiên ổn định theo mã ô chuồng.
// - Dãy chuồng: 7 ô chuồng mở S07 nhìn thấy đầu ngựa đứng bên trong.
import type { HorseProfile } from "../sim/engine.ts";
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

/** Tọa độ pixel thế giới của 7 ô chuồng mở S07 (0,1): 3 ô dãy 1 và 4 ô dãy 2. */
export const VISIBLE_STABLE_STALLS: readonly StableStallAnchor[] = [
  { index: 0, cellX: 0, cellY: 1, x: 0 * 32, y: 1 * 32 },
  { index: 1, cellX: 4, cellY: 1, x: 4 * 32, y: 1 * 32 },
  { index: 2, cellX: 6, cellY: 1, x: 6 * 32, y: 1 * 32 },
  { index: 3, cellX: 3, cellY: 4, x: 3 * 32, y: 4 * 32 },
  { index: 4, cellX: 5, cellY: 4, x: 5 * 32, y: 4 * 32 },
  { index: 5, cellX: 9, cellY: 4, x: 9 * 32, y: 4 * 32 },
  { index: 6, cellX: 11, cellY: 4, x: 11 * 32, y: 4 * 32 },
] as const;

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
 * Gán ngựa vào 7 ô chuồng có thể nhìn thấy (chỉ hiển thị khi stall index 0–6 và không ở ngoài bãi thả).
 */
export function assignStableHorses(
  horses: readonly HorseProfile[],
  paddockIds: ReadonlySet<string>,
): readonly StableHorseAssignment[] {
  const assignments: StableHorseAssignment[] = [];
  for (const horse of horses) {
    if (paddockIds.has(horse.id)) continue;
    const idx = numericStallIndex(horse.stall);
    if (idx >= 0 && idx < VISIBLE_STABLE_STALLS.length) {
      assignments.push({
        horse,
        anchor: VISIBLE_STABLE_STALLS[idx],
      });
    }
  }
  return assignments;
}
