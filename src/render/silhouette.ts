export function dilateAlpha(alpha: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  const result = new Uint8ClampedArray(alpha.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let visible = false;
      for (let oy = -radius; oy <= radius && !visible; oy++) {
        for (let ox = -radius; ox <= radius; ox++) {
          const px = x + ox;
          const py = y + oy;
          if (px >= 0 && py >= 0 && px < width && py < height && alpha[py * width + px] > 0) {
            visible = true;
            break;
          }
        }
      }
      if (visible) result[y * width + x] = 255;
    }
  }
  return result;
}

export function outlineAlpha(alpha: Uint8ClampedArray, width: number, height: number, radius = 2): Uint8ClampedArray {
  const expanded = dilateAlpha(alpha, width, height, radius);
  for (let i = 0; i < expanded.length; i++) if (alpha[i] > 0) expanded[i] = 0;
  return expanded;
}

export function createOutlineCanvas(alpha: Uint8ClampedArray, width: number, height: number, color: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D không khả dụng");
  const mask = ctx.createImageData(width, height);
  const outline = outlineAlpha(alpha, width, height, 2);
  for (let i = 0; i < outline.length; i++) mask.data[i * 4 + 3] = outline[i];
  ctx.putImageData(mask, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";
  return canvas;
}
