// Pure camera math for the intro (no DOM). A camera is { s, x, y }: world point p shows at p * s + (x, y).

/** Union box of the buildings, padded by `pad` world px. */
export function unionBox(boxes, pad = 0) {
  const x0 = Math.min(...boxes.map((b) => b.x)) - pad;
  const y0 = Math.min(...boxes.map((b) => b.y)) - pad;
  const x1 = Math.max(...boxes.map((b) => b.x + b.w)) + pad;
  const y1 = Math.max(...boxes.map((b) => b.y + b.h)) + pad;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Camera at scale `s` that centres world point (cx, cy) in the view. */
export function centred(view, cx, cy, s) {
  return { s, x: view.w / 2 - cx * s, y: view.h / 2 - cy * s };
}

/** Keep the world covering the view on each axis where it is big enough; centre it where it is not. */
export function clampToWorld(cam, view, world) {
  const axis = (pos, viewLen, worldLen) => {
    const len = worldLen * cam.s;
    return len <= viewLen ? (viewLen - len) / 2 : Math.min(0, Math.max(viewLen - len, pos));
  };
  return { s: cam.s, x: axis(cam.x, view.w, world.width), y: axis(cam.y, view.h, world.height) };
}

/** Final shot: the box fills the view (never below the scale that covers the whole world), clamped to the map. */
export function focusCamera(view, box, world) {
  const cover = Math.max(view.w / world.width, view.h / world.height);
  const s = Math.max(cover, Math.min(view.w / box.w, view.h / box.h));
  return clampToWorld(centred(view, box.x + box.w / 2, box.y + box.h / 2, s), view, world);
}

/**
 * Intro keyframes: start high in the sky (map small, its top edge low in the view), glide down while zooming in,
 * overshoot slightly, then settle on the focus shot (the Hay Day "landing").
 */
export function introFrames(view, box, world) {
  const end = focusCamera(view, box, world);
  const cx = (view.w / 2 - end.x) / end.s; // world point at the view centre in the final shot
  const s0 = end.s * 0.45;
  const start = { s: s0, x: view.w / 2 - cx * s0, y: view.h * 0.72 };
  const over = clampToWorld(centred(view, cx, (view.h / 2 - end.y) / end.s - 6, end.s * 1.04), view, world);
  return [
    { ...start, offset: 0 },
    { ...over, offset: 0.86 },
    { ...end, offset: 1 },
  ];
}
