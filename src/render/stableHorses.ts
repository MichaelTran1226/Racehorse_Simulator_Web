// Vẽ đầu ngựa thật ló ra từ 7 ô chuồng mở S07 trên bản đồ trang trại.
// Giữ nguyên khung cửa, cột trụ và nửa cánh cửa dưới của S07; chỉ mở phần chấn song giữa.
import type { StableHorseAssignment } from "../hub/farmPopulation.ts";
import { tinted, type Sprites } from "./sprites.ts";

/** Kích thước và tọa độ cửa sổ mở chấn song trong ô chuồng 32×32 của S07 (0,1). */
export const STALL_OPENING = {
  offsetX: 7,
  offsetY: 3,
  w: 19,
  h: 12,
} as const;

/** Màu nền tối bên trong ô chuồng (pixel chuẩn S07 tại x=5, y=36). */
export const STALL_INTERIOR_COLOR = "#4e2f1a";

/**
 * Chọn khung hình nhàn rỗi (idle frames 0, 1, 2 của S01) cho ngựa trong chuồng.
 * Nếu bật reducedMotion: luôn cố định ở khung 0 (không nhúc nhích).
 */
export function stableHorseFrame(time: number, reducedMotion: boolean, phase: number): 0 | 1 | 2 {
  if (reducedMotion) return 0;
  const raw = Math.floor((time + phase * 0.7) * 2) % 3;
  return (((raw % 3) + 3) % 3) as 0 | 1 | 2;
}

/**
 * Vẽ tất cả ngựa được xếp vào ô chuồng nhìn thấy.
 * Vẽ ngay sau lớp công trình (buildings) và trước các nhân vật chuyển động tự do.
 */
export function drawStableHorses(
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  assignments: readonly StableHorseAssignment[],
  time: number,
  reducedMotion: boolean,
): void {
  for (const { horse, anchor } of assignments) {
    const frame = stableHorseFrame(time, reducedMotion, anchor.index);
    const horseCanvas = tinted(sprites.horse, horse.coat);

    // 1. Phủ màu tối bên trong và cắt (clip) theo cửa sổ mở chấn song
    ctx.save();
    ctx.fillStyle = STALL_INTERIOR_COLOR;
    ctx.fillRect(
      anchor.x + STALL_OPENING.offsetX,
      anchor.y + STALL_OPENING.offsetY,
      STALL_OPENING.w,
      STALL_OPENING.h,
    );

    ctx.beginPath();
    ctx.rect(
      anchor.x + STALL_OPENING.offsetX,
      anchor.y + STALL_OPENING.offsetY,
      STALL_OPENING.w,
      STALL_OPENING.h,
    );
    ctx.clip();

    // 2. Vẽ đầu và cổ ngựa S01 (hàng 0) dịch chuyển chính xác theo bản mẫu đã duyệt
    ctx.drawImage(
      horseCanvas,
      frame * 32,
      0,
      32,
      32,
      anchor.x - 8,
      anchor.y + 1,
      32,
      32,
    );
    ctx.restore();

    // 3. Khôi phục các thanh viền, cột trụ và nửa cánh cửa dưới của S07 đảm bảo sắc nét
    if (sprites.stall?.canvas) {
      // Thanh xà ngang trên (y: 0..2)
      ctx.drawImage(sprites.stall.canvas, 0, 32, 32, 3, anchor.x, anchor.y, 32, 3);
      // Trụ mép trái (x: 0..6, y: 3..14)
      ctx.drawImage(sprites.stall.canvas, 0, 35, 7, 12, anchor.x, anchor.y + 3, 7, 12);
      // Trụ mép phải (x: 26..31, y: 3..14)
      ctx.drawImage(sprites.stall.canvas, 26, 35, 6, 12, anchor.x + 26, anchor.y + 3, 6, 12);
      // Nửa cánh cửa dưới (y: 15..31)
      ctx.drawImage(sprites.stall.canvas, 0, 47, 32, 17, anchor.x, anchor.y + 15, 32, 17);
    }
  }
}
