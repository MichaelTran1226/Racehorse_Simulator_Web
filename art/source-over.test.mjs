import assert from "node:assert/strict";
import { test } from "node:test";
import { isExactTranslucentComposite } from "./map/source-over.mjs";

test("Aseprite tree over iron fence produces exact translucent RGBA", () => {
  const sources = [[0, 0, 0, 78], [122, 253, 14, 253]];
  assert.equal(isExactTranslucentComposite([121, 252, 13, 254], sources), true);
  for (let channel = 0; channel < 4; channel++) {
    const altered = [121, 252, 13, 254];
    altered[channel]--;
    assert.equal(isExactTranslucentComposite(altered, sources), false);
  }
  assert.equal(isExactTranslucentComposite([121, 252, 13, 254], [sources[1]]), false);
});
