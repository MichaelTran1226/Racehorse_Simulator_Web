// Chuyển động thuần (không phụ thuộc canvas) của nhân vật trên bản đồ — tọa độ thế giới 1280×768.
import { FARM_ANCHORS, type Point } from "./farmLayout.ts";

export type Path = readonly Point[];

export function along(path: Path, distance: number, pingPong: boolean): Point & { dir: 1 | -1 } {
  const lengths = path.slice(1).map((point, index) => Math.hypot(point.x - path[index].x, point.y - path[index].y));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let remaining = distance % (pingPong ? total * 2 : total);
  let backwards = false;
  if (pingPong && remaining > total) { remaining = total * 2 - remaining; backwards = true; }
  for (let index = 0; index < lengths.length; index++) {
    if (remaining <= lengths[index] || index === lengths.length - 1) {
      const a = path[index];
      const b = path[index + 1];
      const progress = Math.min(1, remaining / lengths[index]);
      return {
        x: a.x + (b.x - a.x) * progress,
        y: a.y + (b.y - a.y) * progress,
        dir: (b.x >= a.x) !== backwards ? 1 : -1,
      };
    }
    remaining -= lengths[index];
  }
  return { ...path[0], dir: 1 };
}

const HORSE_PATH: Path = [{ x: 730, y: 400 }, { x: 1080, y: 400 }]; // bãi thả
const HORSE2_PATH: Path = [{ x: 760, y: 340 }, { x: 900, y: 340 }];

const PADDOCK_PATHS = [HORSE_PATH, HORSE2_PATH] as const;
const PADDOCK_PHASE = [0, 5] as const;
/** Số ngựa thật thả trong bãi (chạm vào được); số còn lại ở trong chuồng. */
export const PADDOCK_SLOTS = PADDOCK_PATHS.length;

/** Vị trí + tư thế con ngựa ở ô bãi thả `slot` tại thời điểm `time`: đi 7 s rồi gặm cỏ 3 s. */
export function paddockHorse(slot: number, time: number) {
  const t = time + PADDOCK_PHASE[slot];
  const cycle = t % 20;
  const walking = cycle < 7 || (cycle >= 10 && cycle < 17);
  const walked = Math.min(cycle, 7) + Math.max(0, Math.min(cycle - 10, 7));
  const p = along(PADDOCK_PATHS[slot], walked * 16, true);
  return walking
    ? { x: p.x, y: p.y, frame: Math.floor(t * 6) % 6, row: 1, flip: p.dir < 0 }
    : { x: p.x, y: p.y, frame: Math.floor(t * 3) % 3, row: 4, flip: cycle >= 17 };
}

/** Ô bãi thả có con ngựa nằm dưới điểm thế giới `point` (khung 32×32, chân ở y), hoặc -1. */
export function paddockHorseAt(
  point: Point,
  time: number,
  slotsOrCount: number | readonly (unknown | null | undefined)[],
): number {
  const isPresent = (slot: number) => {
    if (typeof slotsOrCount === "number") return slot < slotsOrCount;
    return Boolean(slotsOrCount[slot]);
  };
  for (let slot = PADDOCK_SLOTS - 1; slot >= 0; slot--) {
    if (!isPresent(slot)) continue;
    const h = paddockHorse(slot, time);
    if (Math.abs(point.x - h.x) <= 15 && point.y >= h.y - 26 && point.y <= h.y + 2) return slot;
  }
  return -1;
}


// Xe tải giao hàng: vào từ mép trái theo đường chính, dừng trước cửa kho, hạ cầu dỡ hàng, rồi chạy tiếp sang phải.
export const TRUCK_Y = 250;
export const TRUCK_STOP_X = FARM_ANCHORS.supplyDoor.x;
const TRUCK_START_X = -140;
const TRUCK_END_X = 1420;
export const TRUCK_UNLOAD_S = 1.5;
const TRUCK_EXIT_S = 4;

/** Vị trí xe tại `now` cho chuyến tới nơi lúc `arriveAt` (đi mất `deliveryS` giây); null khi xe không ở trên bản đồ. */
export function truckPose(now: number, arriveAt: number, deliveryS: number): { x: number; y: number; open: boolean } | null {
  const start = arriveAt - deliveryS;
  if (now < start || now > arriveAt + TRUCK_EXIT_S) return null;
  if (now < arriveAt - TRUCK_UNLOAD_S) {
    const p = (now - start) / (deliveryS - TRUCK_UNLOAD_S);
    const e = 1 - Math.pow(1 - p, 3); // chậm dần khi tới cửa kho
    return { x: TRUCK_START_X + (TRUCK_STOP_X - TRUCK_START_X) * e, y: TRUCK_Y, open: false };
  }
  if (now < arriveAt) return { x: TRUCK_STOP_X, y: TRUCK_Y, open: true };
  const p = (now - arriveAt) / TRUCK_EXIT_S;
  return { x: TRUCK_STOP_X + (TRUCK_END_X - TRUCK_STOP_X) * p * p, y: TRUCK_Y, open: false };
}
