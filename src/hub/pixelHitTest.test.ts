import assert from "node:assert/strict";
import { test } from "node:test";
import { hitTestObjects, type AlphaMask } from "./pixelHitTest.ts";

const mask = (alpha: number[]): AlphaMask => ({ width: 2, height: 2, alpha: Uint8ClampedArray.from(alpha) });
const low = { id: "low", z: 1, bounds: { x: 10, y: 10, w: 2, h: 2 } };
const high = { id: "high", z: 2, bounds: { x: 10, y: 10, w: 2, h: 2 } };

test("hit testing accounts for camera, transparency, bounds and z order", () => {
  const masks = new Map([["low", mask([255, 255, 255, 255])], ["high", mask([0, 255, 0, 0])]]);
  assert.equal(hitTestObjects({ x: 10, y: 10 }, { x: 0, y: 0 }, [low, high], masks)?.id, "low");
  assert.equal(hitTestObjects({ x: 11, y: 10 }, { x: 0, y: 0 }, [low, high], masks)?.id, "high");
  assert.equal(hitTestObjects({ x: 1, y: 0 }, { x: 10, y: 10 }, [low, high], masks)?.id, "high");
  assert.equal(hitTestObjects({ x: 99, y: 99 }, { x: 0, y: 0 }, [low, high], masks), null);
});
