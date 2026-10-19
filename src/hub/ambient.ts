// Nhân vật chuyển động trên bản đồ trang trại (tọa độ thế giới 1280×768, 1 px thế giới = 1 px sprite).
// Đường đi bám theo bố cục art/map/gen-layout.ts (ô 32 px): sân cát hàng 3–6, bãi thả hàng 6–9, đường chính hàng 11.
import { drawFrame, drawRect, tinted, VEHICLE_RECT, type Sprites } from "../render/sprites";
import type { Coat } from "../sim/engine";
import type { Point } from "./farmLayout";
import { along, PADDOCK_SLOTS, paddockHorse, type Path } from "./paths";

/** h của drawFrame tính theo ô concept 127.5 px; 32 ⇒ sprite 32 px vẽ đúng 1:1 trong thế giới. */
const CELL = 32;
const RIDER_PATH: Path = [{ x: 660, y: 236 }, { x: 1170, y: 236 }]; // làn dưới đường đua
const RIDER2_PATH: Path = [{ x: 600, y: 84 }, { x: 1220, y: 84 }]; // làn trên
const GROOM_PATH: Path = [{ x: 50, y: 186 }, { x: 360, y: 186 }]; // lối trước dãy chuồng 2
const VET_PATH: Path = [{ x: 1000, y: 734 }, { x: 1240, y: 734 }]; // trước phòng khám
const MANAGER_PATH: Path = [{ x: 900, y: 474 }, { x: 1150, y: 474 }]; // trước văn phòng
const BARROW_PATH: Path = [{ x: 620, y: 620 }, { x: 240, y: 620 }, { x: 240, y: 284 }, { x: 140, y: 284 }]; // kho → dãy chuồng
const CART_PATH: Path = [{ x: 870, y: 346 }, { x: 1240, y: 346 }]; // nhánh tới văn phòng

export function drawFarmActors(ctx: CanvasRenderingContext2D, sprites: Sprites, time: number, paddockCoats: readonly (Coat | null | undefined)[] = []): void {
  // Ngựa đua có nài chạy qua lại trên sân cát, kèm bụi
  for (const [path, speed, offset] of [[RIDER_PATH, 120, 0], [RIDER2_PATH, 100, 400]] as const) {
    const r = along(path, time * speed + offset, true);
    const frame = Math.floor(time * 12 + offset) % 6;
    drawFrame(ctx, sprites.fx, sprites.fx.canvas, frame % 4, 0, r.x - r.dir * 16, r.y, CELL, r.dir < 0);
    drawFrame(ctx, sprites.rider, sprites.rider.canvas, frame, 4, r.x, r.y, CELL, r.dir < 0);
  }

  // Ngựa thật trong bãi thả, đúng màu lông
  paddockCoats.slice(0, PADDOCK_SLOTS).forEach((coat, slot) => {
    if (!coat) return;
    const h = paddockHorse(slot, time);
    drawFrame(ctx, sprites.horse, tinted(sprites.horse, coat), h.frame, h.row, h.x, h.y, CELL, h.flip);
  });

  // Người đi lại: groom trên đường chính, VET trước phòng khám, quản lý trước văn phòng
  for (const [path, row, speed] of [[GROOM_PATH, 3, 26], [VET_PATH, 2, 18], [MANAGER_PATH, 0, 16]] as const) {
    const p = along(path, time * speed, true);
    drawFrame(ctx, sprites.people, sprites.people.canvas, Math.floor(time * 6) % 4, row, p.x, p.y, CELL, p.dir < 0);
  }

  // Xe: người đẩy xe cút kít (groom + xe), xe điện chạy trên đường chính
  const b = along(BARROW_PATH, time * 22, true);
  drawRect(ctx, sprites.vehicles, VEHICLE_RECT.barrowLoaded, b.x + b.dir * 14, b.y, 1, b.dir < 0);
  drawFrame(ctx, sprites.people, sprites.people.canvas, Math.floor(time * 6) % 4, 3, b.x - b.dir * 6, b.y, CELL, b.dir < 0);
  const c = along(CART_PATH, time * 40, true);
  drawRect(ctx, sprites.vehicles, VEHICLE_RECT.cartDriver, c.x, c.y, 1, c.dir < 0);
}

/** Ban đêm: phủ tối + quầng đèn ở cửa sổ, chuồng, đường đua; đom đóm. Chỉ là lớp phủ lúc chạy, bố cục không đổi. */
const LIGHTS: Point[] = [
  { x: 80, y: 48 }, { x: 208, y: 48 }, { x: 112, y: 144 }, { x: 240, y: 144 }, { x: 336, y: 144 }, // cửa chuồng
  { x: 960, y: 424 }, { x: 1070, y: 424 }, { x: 1080, y: 680 }, { x: 1220, y: 680 }, // cửa sổ văn phòng, phòng khám
  { x: 704, y: 680 }, { x: 656, y: 224 }, { x: 1200, y: 224 }, // kho, cổng xuất phát, vạch đích
];

export function drawNight(ctx: CanvasRenderingContext2D, width: number, height: number, time: number): void {
  ctx.fillStyle = "rgba(14, 22, 48, 0.55)";
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";
  LIGHTS.forEach((p, i) => {
    const flicker = 0.22 + 0.06 * Math.sin(time * 7 + i * 2.3);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 40);
    g.addColorStop(0, `rgba(255, 210, 120, ${flicker})`);
    g.addColorStop(1, "rgba(255, 210, 120, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(p.x - 40, p.y - 40, 80, 80);
  });
  for (let i = 0; i < 40; i++) {
    const x = (i * 331) % width + Math.sin(time * 0.4 + i) * 14;
    const y = (i * 197) % height + Math.cos(time * 0.3 + i * 2) * 10;
    const a = Math.max(0, Math.sin(time * 1.4 + i * 5)) ** 3;
    ctx.fillStyle = `rgba(230, 255, 150, ${a})`;
    ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
  }
  ctx.globalCompositeOperation = "source-over";
}
