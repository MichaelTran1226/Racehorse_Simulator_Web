import assert from "node:assert/strict";
import { test } from "node:test";
import { outlineAlpha } from "./silhouette.ts";

test("outline expands around but never covers original alpha", () => {
  const alpha = Uint8ClampedArray.from([0, 0, 0, 0, 255, 0, 0, 0, 0]);
  assert.deepEqual([...outlineAlpha(alpha, 3, 3, 1)], [255, 255, 255, 255, 0, 255, 255, 255, 255]);
});
