import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("E:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Training_Management_System_MT_FE/node_modules/playwright");

const rootDir = process.cwd();
const outDir = path.join(rootDir, "docs", "screenshots");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  console.log("Launching Chromium to capture fresh v3 showcase screenshots...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log("Navigating to http://localhost:5175 (v3)...");
  await page.goto("http://localhost:5175", { waitUntil: "domcontentloaded" });

  // 0. Chụp snapshot Intro TMEC đang hiện chữ
  console.log("Capturing 00-tmec-intro.png...");
  await page.waitForTimeout(1400); // Lúc này chữ THIEN MA EQUESTRIAN CLUB đang bung nảy
  await page.screenshot({ path: path.join(outDir, "00-tmec-intro.png") });

  // Chờ hết intro (4.5s) để vào hẳn màn hình chính Farm Hub
  console.log("Waiting for Intro to complete and enter Farm Hub...");
  await page.waitForTimeout(3500);

  // 1. Toàn cảnh ban ngày bố cục mới v3
  console.log("Capturing 01-farm-hub-day.png...");
  await page.screenshot({ path: path.join(outDir, "01-farm-hub-day.png") });

  // 2. Toàn cảnh ban đêm v3
  console.log("Switching to night mode...");
  const dayNightBtn = page.locator('button[data-tone="sun"], button[data-tone="moon"]');
  if (await dayNightBtn.count() > 0) {
    await dayNightBtn.click();
    await page.waitForTimeout(1000);
    console.log("Capturing 02-farm-hub-night.png...");
    await page.screenshot({ path: path.join(outDir, "02-farm-hub-night.png") });

    // Quay lại ban ngày
    await dayNightBtn.click();
    await page.waitForTimeout(800);
  }

  // 3. Mở popup Đàn ngựa
  console.log("Opening Horse List...");
  const horseListBtn = page.locator('button:has(span:text-is("Ngựa"))');
  if (await horseListBtn.count() > 0) {
    await horseListBtn.click();
    await page.waitForTimeout(1000);
    console.log("Capturing 03-horse-roster.png...");
    await page.screenshot({ path: path.join(outDir, "03-horse-roster.png") });

    // 4. Mở thẻ chi tiết ngựa (Horse Card)
    console.log("Opening Horse Card from list...");
    const horseTile = page.locator('button[class*="tile"]').first();
    if ((await horseTile.count()) > 0) {
      await horseTile.click();
      await page.waitForTimeout(1000);
      console.log("Capturing 04-horse-card-telemetry.png...");
      await page.screenshot({ path: path.join(outDir, "04-horse-card-telemetry.png") });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(600);
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
  }

  // 5. Mở Kho vật tư
  console.log("Opening Supply Barn popup...");
  const supplyBtn = page.locator('button:has(span:text-is("Kho"))');
  if (await supplyBtn.count() > 0) {
    await supplyBtn.click();
    await page.waitForTimeout(1000);
    console.log("Capturing 05-supply-inventory.png...");
    await page.screenshot({ path: path.join(outDir, "05-supply-inventory.png") });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
  }

  // 6. Khu chuồng
  console.log("Opening Stalls popup...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav[aria-label="Khu vực"] button, nav[aria-label="Đi tới khu vực"] button'));
    const btn = btns.find((b) => b.textContent.includes("Khu chuồng"));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1600);
  console.log("Capturing 06-stalls-management.png...");
  await page.screenshot({ path: path.join(outDir, "06-stalls-management.png") });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);

  // 7. Trạm khám thú y
  console.log("Opening Vet clinic popup...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav[aria-label="Khu vực"] button, nav[aria-label="Đi tới khu vực"] button'));
    const btn = btns.find((b) => b.textContent.includes("Phòng khám") || b.textContent.includes("Trạm Y tế"));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1600);
  console.log("Capturing 07-vet-clinic.png...");
  await page.screenshot({ path: path.join(outDir, "07-vet-clinic.png") });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);

  // 8. Chuyển sang Đường đua (Chạy thử)
  console.log("Navigating to Track screen...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav[aria-label="Khu vực"] button, nav[aria-label="Đi tới khu vực"] button'));
    const btn = btns.find((b) => b.textContent.includes("Đường đua"));
    if (btn) btn.click();
  });
  await page.waitForTimeout(2600);
  console.log("Capturing 08-track-trial-simulation.png...");
  await page.screenshot({ path: path.join(outDir, "08-track-trial-simulation.png") });

  // 9. Tab Đua 6 làn
  console.log("Switching to 6-lane Race tab...");
  const raceTab = page.locator('button:has-text("Đua 6 làn")');
  if (await raceTab.count() > 0) {
    await raceTab.click();
    await page.waitForTimeout(1500);
    console.log("Capturing 09-track-6lanes-race.png...");
    await page.screenshot({ path: path.join(outDir, "09-track-6lanes-race.png") });
  }

  await browser.close();
  console.log("All fresh v3 screenshots captured successfully in docs/screenshots/!");
}

run().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
