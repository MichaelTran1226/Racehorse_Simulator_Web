import { drawFrame, drawRect, ROW, tinted, VEHICLE_RECT, type Sprites } from "../render/sprites.ts";
import type { Coat } from "../sim/engine.ts";
import { FARM_ANCHORS, type Point } from "./farmLayout.ts";
import { PADDOCK_SLOTS, paddockHorse } from "./paths.ts";
import {
  ambientActorPose,
  getActiveSpeechBubbles,
  getChimneySmokePuffs,
  getFlyingBirds,
  perchedBirds,
  type AmbientSceneState,
} from "./ambientScene.ts";

/** h của drawFrame tính theo ô concept 127.5 px; 32 ⇒ sprite 32 px vẽ đúng 1:1 trong thế giới. */
const CELL = 32;

const defaultState: AmbientSceneState = {
  reducedMotion: false,
  simulationRunning: true,
  hasHay: true,
};

export function drawFarmActors(
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  time: number,
  paddockCoats: readonly (Coat | null | undefined)[] = [],
  ambientState: AmbientSceneState = defaultState,
): void {
  // 1. Ngựa đua có nài chạy qua lại trên sân cát, kèm bụi khi không bật reducedMotion
  const r1 = ambientActorPose("TRACK_RIDER_1", time, ambientState);
  if (!ambientState.reducedMotion) {
    drawFrame(ctx, sprites.fx, sprites.fx.canvas, r1.frame % 4, 0, r1.x - r1.dir * 16, r1.y, CELL, r1.flip);
  }
  drawFrame(ctx, sprites.rider, sprites.rider.canvas, r1.frame, 4, r1.x, r1.y, CELL, r1.flip);

  const r2 = ambientActorPose("TRACK_RIDER_2", time, ambientState);
  if (!ambientState.reducedMotion) {
    drawFrame(ctx, sprites.fx, sprites.fx.canvas, r2.frame % 4, 0, r2.x - r2.dir * 16, r2.y, CELL, r2.flip);
  }
  drawFrame(ctx, sprites.rider, sprites.rider.canvas, r2.frame, 4, r2.x, r2.y, CELL, r2.flip);

  // 2. Ngựa thật trong bãi thả, đúng màu lông
  paddockCoats.slice(0, PADDOCK_SLOTS).forEach((coat, slot) => {
    if (!coat) return;
    const h = paddockHorse(slot, ambientState.reducedMotion ? 0 : time);
    const frame = ambientState.reducedMotion ? 0 : h.frame;
    const row = ambientState.reducedMotion ? 0 : h.row;
    drawFrame(ctx, sprites.horse, tinted(sprites.horse, coat), frame, row, h.x, h.y, CELL, h.flip);
  });

  // 3. Người đi lại: groom, VET, quản lý, và chủ ngựa đi dạo vườn nhà cam
  const groom = ambientActorPose("STABLE_GROOM", time, ambientState);
  drawFrame(ctx, sprites.people, sprites.people.canvas, groom.frame, groom.row ?? 3, groom.x, groom.y, CELL, groom.flip);

  const vet = ambientActorPose("CLINIC_VET", time, ambientState);
  drawFrame(ctx, sprites.people, sprites.people.canvas, vet.frame, vet.row ?? 2, vet.x, vet.y, CELL, vet.flip);

  const manager = ambientActorPose("HOUSE_MANAGER", time, ambientState);
  if (manager.active) {
    drawFrame(ctx, sprites.people, sprites.people.canvas, manager.frame, manager.row ?? 0, manager.x, manager.y, CELL, manager.flip);
  }

  const owner = ambientActorPose("HOUSE_OWNER", time, ambientState);
  if (owner.active) {
    drawFrame(ctx, sprites.people, sprites.people.canvas, owner.frame, owner.row ?? 4, owner.x, owner.y, CELL, owner.flip);
  }

  // 4. Xe: xe cút kít chở cỏ (chỉ hiện khi kho còn cỏ & đang chạy mô phỏng), xe điện sân vườn
  const barrow = ambientActorPose("SUPPLY_BARROW", time, ambientState);
  if (barrow.active) {
    drawRect(ctx, sprites.vehicles, VEHICLE_RECT.barrowLoaded, barrow.x + barrow.dir * 14, barrow.y, 1, barrow.flip);
    drawFrame(ctx, sprites.people, sprites.people.canvas, barrow.frame, 3, barrow.x - barrow.dir * 6, barrow.y, CELL, barrow.flip);
  }

  const cart = ambientActorPose("HOUSE_CART", time, ambientState);
  drawRect(ctx, sprites.vehicles, VEHICLE_RECT.cartDriver, cart.x, cart.y, 1, cart.flip);

  // 5. Ô đất mép trái: nài cưỡi ngựa chạy nước kiệu vòng quanh, HLV đứng cạnh cổng bấm giờ
  const ride = ambientActorPose("LEFT_RIDER", time, ambientState);
  drawFrame(ctx, sprites.horse, tinted(sprites.horse, "BAY"), ride.frame, ROW.TROT, ride.x, ride.y, CELL, ride.flip);
  drawFrame(ctx, sprites.rider, sprites.rider.canvas, ride.frame, 1, ride.x, ride.y, CELL, ride.flip);
  const coach = ambientActorPose("LEFT_COACH", time, ambientState);
  drawFrame(ctx, sprites.people, sprites.people.canvas, coach.frame, coach.row ?? 1, coach.x, coach.y, CELL, coach.flip);

  // 6. Khu kho – phòng khám (vẽ theo y tăng dần để người phía trước che người phía sau)
  const roadCart = ambientActorPose("ROAD_CART", time, ambientState);
  drawRect(ctx, sprites.vehicles, VEHICLE_RECT.cartDriver, roadCart.x, roadCart.y, 1, roadCart.flip);

  for (const id of ["CHAT_A", "CHAT_B"] as const) {
    const p = ambientActorPose(id, time, ambientState);
    drawFrame(ctx, sprites.people, sprites.people.canvas, p.frame, p.row ?? 4, p.x, p.y, CELL, p.flip);
  }

  const hayCart = ambientActorPose("SUPPLY_HAYCART", time, ambientState);
  if (hayCart.active) {
    drawRect(ctx, sprites.vehicles, VEHICLE_RECT.hayCart, hayCart.x, hayCart.y, 1, hayCart.flip);
    drawFrame(ctx, sprites.people, sprites.people.canvas, hayCart.frame, 3, hayCart.x + hayCart.dir * 18, hayCart.y, CELL, hayCart.flip);
  }

  const grooming = ambientActorPose("BARN_GROOMING", time, ambientState);
  drawFrame(ctx, sprites.horse, tinted(sprites.horse, "CHESTNUT"), 0, ROW.IDLE, grooming.x + 28, grooming.y, CELL);
  drawFrame(ctx, sprites.people, sprites.people.canvas, grooming.frame, grooming.row ?? 3, grooming.x, grooming.y, CELL, grooming.flip);

  // 7. Con vật Stardew (gà, vịt, chó, mèo) — khung vuông 16/32 px, vẽ 1:1, chân tại y
  const critters = [
    ...(["SV_CHICKEN_1", "SV_CHICKEN_2", "SV_CHICKEN_3", "SV_DUCK", "SV_DOG", "SV_CAT", "WILD_BLUEBIRD_1", "WILD_BLUEBIRD_2", "WILD_SPARROW_1", "WILD_SPARROW_2", "WILD_RABBIT", "WILD_SQUIRREL"] as const).map((id) => ambientActorPose(id, time, ambientState)),
    ...perchedBirds(time, ambientState), // chim đậu trên tán cây
    ...getFlyingBirds(time, ambientState), // chim bay lượn vồng giữa các tán cây
  ];
  for (const p of critters) {
    if (!p.sheet || !p.size) continue;
    const s = p.size;
    const sheet = sprites.critters[p.sheet];
    if (!p.flip) {
      ctx.drawImage(sheet, p.frame * s, (p.row ?? 0) * s, s, s, Math.round(p.x - s / 2), Math.round(p.y - s + 2), s, s);
      continue;
    }
    ctx.save();
    ctx.translate(Math.round(p.x), 0);
    ctx.scale(-1, 1);
    ctx.drawImage(sheet, p.frame * s, (p.row ?? 0) * s, s, s, -s / 2, Math.round(p.y - s + 2), s, s);
    ctx.restore();
  }

  // 8. Khói từ ống khói nhà nhân viên (Groom House)
  drawChimneySmoke(ctx, time, ambientState.reducedMotion);

  // 9. Khung chat bong bóng (speech bubbles) của NPC
  drawSpeechBubbles(ctx, time, ambientState);
}

export function drawChimneySmoke(
  ctx: CanvasRenderingContext2D,
  time: number,
  reducedMotion: boolean,
): void {
  const puffs = getChimneySmokePuffs(time, reducedMotion);
  for (const puff of puffs) {
    const r = puff.size;
    const px = Math.round(puff.x - r / 2);
    const py = Math.round(puff.y - r / 2);
    ctx.fillStyle = `rgba(245, 248, 252, ${puff.alpha.toFixed(2)})`;
    ctx.fillRect(px, py, r, r);
    if (r >= 4) {
      ctx.fillStyle = `rgba(215, 225, 235, ${(puff.alpha * 0.8).toFixed(2)})`;
      ctx.fillRect(px + 1, py + 1, r - 2, r - 2);
    }
  }
}

export function drawSpeechBubbles(
  ctx: CanvasRenderingContext2D,
  time: number,
  ambientState: AmbientSceneState,
): void {
  const bubbles = getActiveSpeechBubbles(time);
  if (bubbles.length === 0) return;

  ctx.save();
  ctx.font = "12px VT323, monospace";
  ctx.textBaseline = "middle";

  for (const b of bubbles) {
    const pose = ambientActorPose(b.actorId, time, ambientState);
    if (!pose.active) continue;

    const text = b.text;
    const textWidth = ctx.measureText(text).width;
    const paddingX = 6;
    const bubbleWidth = Math.round(textWidth + paddingX * 2);
    const bubbleHeight = 16;

    const bubbleX = Math.round(pose.x - bubbleWidth / 2);
    const bubbleY = Math.round(pose.y - 36);

    ctx.fillStyle = "#261b17";
    ctx.fillRect(bubbleX - 1, bubbleY - 1, bubbleWidth + 2, bubbleHeight + 2);

    ctx.fillStyle = "#fffdf5";
    ctx.fillRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);

    const tailX = Math.round(pose.x);
    ctx.fillStyle = "#261b17";
    ctx.fillRect(tailX - 2, bubbleY + bubbleHeight, 4, 1);
    ctx.fillRect(tailX - 1, bubbleY + bubbleHeight + 1, 2, 1);
    ctx.fillStyle = "#fffdf5";
    ctx.fillRect(tailX - 1, bubbleY + bubbleHeight, 2, 1);

    ctx.fillStyle = "#261b17";
    ctx.fillText(text, bubbleX + paddingX, bubbleY + bubbleHeight / 2);
  }

  ctx.restore();
}

/** Ban đêm: phủ tối + quầng đèn ở cửa sổ, chuồng, đường đua; đom đóm. Chỉ là lớp phủ lúc chạy, bố cục không đổi. */
const LIGHTS: Point[] = [
  ...FARM_ANCHORS.stableStalls.map((p) => ({ x: p.x, y: p.y - 20 })), // cửa 2 Barn + mái che
  { x: FARM_ANCHORS.houseDoor.x, y: FARM_ANCHORS.houseDoor.y - 24 }, { x: 888, y: 262 }, // cửa + cửa sổ nhà NPC
  { x: FARM_ANCHORS.clinicDoor.x, y: FARM_ANCHORS.clinicDoor.y - 24 }, // phòng khám
  { x: FARM_ANCHORS.supplyDoor.x, y: FARM_ANCHORS.supplyDoor.y - 40 }, // kho
];

export function drawNight(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, reducedMotion = false): void {
  ctx.fillStyle = "rgba(14, 22, 48, 0.55)";
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";
  LIGHTS.forEach((p, i) => {
    const flicker = reducedMotion ? 0.25 : 0.22 + 0.06 * Math.sin(time * 7 + i * 2.3);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 40);
    g.addColorStop(0, `rgba(255, 210, 120, ${flicker})`);
    g.addColorStop(1, "rgba(255, 210, 120, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(p.x - 40, p.y - 40, 80, 80);
  });
  for (let i = 0; i < 40; i++) {
    const x = (i * 331) % width + (reducedMotion ? 0 : Math.sin(time * 0.4 + i) * 14);
    const y = (i * 197) % height + (reducedMotion ? 0 : Math.cos(time * 0.3 + i * 2) * 10);
    const a = reducedMotion ? 0.5 : Math.max(0, Math.sin(time * 1.4 + i * 5)) ** 3;
    ctx.fillStyle = `rgba(230, 255, 150, ${a})`;
    ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
  }
  ctx.globalCompositeOperation = "source-over";
}

