// Aseprite rgba_blender_normal integer math (opacity 255):
// https://github.com/aseprite/aseprite/blob/main/src/doc/blend_funcs.cpp
export function isExactTranslucentComposite(color, sources) {
  if (color[3] <= 0 || color[3] >= 255) return false;
  for (const front of sources) {
    for (const back of sources) {
      const product = back[3] * front[3] + 128;
      const alpha = front[3] + back[3] - (((product >> 8) + product) >> 8);
      if (alpha !== color[3]) continue;
      if ([0, 1, 2].every((i) => back[i] + Math.trunc((front[i] - back[i]) * front[3] / alpha) === color[i])) return true;
    }
  }
  return false;
}
