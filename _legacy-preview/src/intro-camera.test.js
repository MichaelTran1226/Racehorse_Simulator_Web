import assert from "node:assert/strict";
import test from "node:test";
import { clampToWorld, focusCamera, introFrames, unionBox } from "./intro-camera.js";

const world = { width: 1280, height: 768 };
const houses = [
  { x: 240, y: 160, w: 112, h: 128 },
  { x: 448, y: 160, w: 96, h: 128 },
  { x: 688, y: 160, w: 80, h: 128 },
  { x: 848, y: 208, w: 80, h: 80 },
];

test("unionBox pads the outer bounds of every building", () => {
  assert.deepEqual(unionBox(houses, 16), { x: 224, y: 144, w: 720, h: 160 });
});

test("focus shot keeps all four houses inside the view and the map covering it", () => {
  for (const view of [{ w: 1920, h: 1080 }, { w: 1366, h: 768 }, { w: 390, h: 844 }]) {
    const box = unionBox(houses, 16);
    const cam = focusCamera(view, box, world);
    assert.ok(cam.x <= 0 && cam.y <= 0, "no empty edge at top/left");
    assert.ok(cam.x + world.width * cam.s >= view.w - 1e-6 && cam.y + world.height * cam.s >= view.h - 1e-6, "no empty edge at bottom/right");
    // Landscape screens fit the whole box; a phone shows its centre (the box is wider than the screen).
    if (view.w > view.h) {
      assert.ok(box.x * cam.s + cam.x >= -1e-6 && (box.x + box.w) * cam.s + cam.x <= view.w + 1e-6);
      assert.ok(box.y * cam.s + cam.y >= -1e-6 && (box.y + box.h) * cam.s + cam.y <= view.h + 1e-6);
    }
  }
});

test("clampToWorld centres an axis the world cannot fill", () => {
  assert.deepEqual(clampToWorld({ s: 0.5, x: 999, y: -999 }, { w: 1000, h: 600 }, world), { s: 0.5, x: 180, y: 108 });
});

test("intro starts zoomed out with the map low in the view, overshoots, then lands on the focus shot", () => {
  const view = { w: 1600, h: 900 };
  const box = unionBox(houses, 16);
  const [start, over, end] = introFrames(view, box, world);
  assert.deepEqual({ s: end.s, x: end.x, y: end.y }, focusCamera(view, box, world));
  assert.ok(start.s < end.s && over.s > end.s);
  assert.ok(start.y > view.h / 2, "camera begins above the farm, looking down onto sky");
  assert.deepEqual([start.offset, over.offset, end.offset], [0, 0.86, 1]);
});
