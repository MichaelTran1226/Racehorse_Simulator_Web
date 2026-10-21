import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("E:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Training_Management_System_MT_FE/node_modules/playwright");

const rootDir = process.cwd();
const outDir = path.join(rootDir, "docs", "showcase");
const framesDir = path.join(outDir, "frames");
if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
}

async function record() {
  console.log("Launching Chromium for showcase recording...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: outDir,
      size: { width: 960, height: 576 },
    },
    viewport: { width: 960, height: 576 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  console.log("Navigating to http://localhost:5175...");
  await page.goto("http://localhost:5175");

  // Capture frame-by-frame for GIF generation (12 FPS for 5.5s = ~66 frames)
  const totalFrames = 66;
  const intervalMs = 85;
  console.log(`Capturing ${totalFrames} frames for GIF animation...`);

  for (let i = 0; i < totalFrames; i++) {
    const framePath = path.join(framesDir, `frame_${String(i).padStart(3, "0")}.png`);
    await page.screenshot({ path: framePath });
    await page.waitForTimeout(intervalMs);
  }

  await context.close();
  await browser.close();
  console.log("Video and frames captured successfully in:", outDir);
}

record().catch((err) => {
  console.error("Recording error:", err);
  process.exit(1);
});
