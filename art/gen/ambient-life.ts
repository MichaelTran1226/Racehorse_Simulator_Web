// Sinh đề xuất S16 (Ambient Life — Sinh vật & chi tiết sống động trên trang trại).
// Chỉ tạo file preview (chưa nạp vào public/assets hay allowlist cho đến khi người dùng duyệt).
// 6×6 ô 32×32 (192×192 px):
// Hàng 0: Chim sẻ (đứng 2 · nhảy 2 · bay 2)
// Hàng 1: Mèo chuồng (nghỉ 2 · đi 2 · vươn vai 2)
// Hàng 2: Bướm (đậu 2 · đập cánh bay 4)
// Hàng 3: Túi gió đường đua (lặng gió 2 · gió thổi 4)
// Hàng 4–5: Dự trữ (trong suốt)
import { readFileSync } from "node:fs";
import { hex, Img, preview, savePng, sheet, type RGBA } from "./pixel.ts";

/** Approval manifest. Keep empty until the user explicitly approves rows from the previews. */
export const APPROVED_S16_ROWS: readonly string[] = [];

export const S16_PALETTE_HEX: readonly string[] = [
  "#1D130E", // Viền mực sẫm (INK)
  "#2A1A12", // Mắt / nét tối
  "#141414", // Đen sâu
  "#FFFFFF", // Trắng tinh
  "#ECECEC", // Trắng ngà
  "#D9DFE2", // Trắng xám
  "#CDCDCD", // Xám sáng
  "#9B9B9B", // Xám vừa
  "#737373", // Xám tối
  "#47474E", // Xám than
  "#24242A", // Xám đậm
  "#E28743", // Lông hung vàng
  "#B85C38", // Lông nâu hung
  "#B2531B", // Lông nâu đỏ
  "#8B3C1B", // Lông nâu sẫm
  "#5A2510", // Nâu tối
  "#E8B48A", // Da / màu be
  "#C98F66", // Nâu be đậm
  "#ECC082", // Vàng rơm sáng
  "#F0A15E", // Cam cát sáng
  "#F3E6C4", // Kem sáng
  "#FFD54F", // Vàng rực (mỏ chim / hoa văn)
  "#FFA000", // Vàng cam
  "#1976D2", // Lam đậm (cánh bướm)
  "#42A5F5", // Lam vừa (cánh bướm)
  "#90CAF9", // Lam nhạt
  "#0D47A1", // Lam sẫm
  "#D32F2F", // Đỏ túi gió
  "#F44336", // Đỏ sáng túi gió
  "#FF8A80", // Đỏ nhạt
  "#388E3C", // Xanh lá
  "#66BB6A", // Xanh lá sáng
] as const;

const INK = hex("#1D130E");
const EYE = hex("#2A1A12");
const WHITE = hex("#FFFFFF");
const GRAY = hex("#9B9B9B");
const DARK_GRAY = hex("#47474E");
const BEAK_YELLOW = hex("#FFD54F");
const BIRD_BROWN = hex("#8B3C1B");
const BIRD_LIGHT = hex("#E8B48A");
const BIRD_WING = hex("#5A2510");

const CAT_ORANGE = hex("#E28743");
const CAT_DARK = hex("#B2531B");
const CAT_WHITE = hex("#ECECEC");
const CAT_NOSE = hex("#FF8A80");

const BUTTERFLY_BLUE = hex("#1976D2");
const BUTTERFLY_LIGHT = hex("#42A5F5");
const BUTTERFLY_PALE = hex("#90CAF9");
const BUTTERFLY_BODY = hex("#24242A");

const SOCK_RED = hex("#D32F2F");
const SOCK_WHITE = hex("#FFFFFF");
const POLE_GRAY = hex("#737373");
const POLE_DARK = hex("#24242A");

// ------------------------------------------------------------------ Hàng 0: Chim sẻ (baseline y = 30)

function drawBird(variant: "idle0" | "idle1" | "hop0" | "hop1" | "fly0" | "fly1"): Img {
  const img = new Img(32, 32);
  const cx = 16;

  if (variant === "idle0" || variant === "idle1") {
    const headTilt = variant === "idle1" ? 1 : 0;
    // Chân tại y = 30
    img.set(cx - 2, 30, INK);
    img.set(cx - 1, 30, INK);
    img.set(cx + 1, 30, INK);
    img.set(cx + 2, 30, INK);
    img.set(cx - 1, 29, BEAK_YELLOW);
    img.set(cx + 1, 29, BEAK_YELLOW);

    // Thân chim (y: 24..28)
    for (let dy = 0; dy <= 4; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        img.set(cx + dx, 24 + dy, BIRD_BROWN);
      }
    }
    // Ngực sáng
    img.set(cx + 1, 25, BIRD_LIGHT);
    img.set(cx + 2, 25, BIRD_LIGHT);
    img.set(cx + 1, 26, BIRD_LIGHT);
    // Cánh nâu sẫm
    img.set(cx - 2, 25, BIRD_WING);
    img.set(cx - 1, 25, BIRD_WING);
    img.set(cx - 2, 26, BIRD_WING);
    img.set(cx - 3, 27, BIRD_WING);

    // Đầu chim (y: 20..23)
    const hx = cx + headTilt;
    for (let dy = 0; dy <= 3; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        img.set(hx + dx, 20 + dy, BIRD_BROWN);
      }
    }
    // Mắt & Mỏ nhọn hướng phải
    img.set(hx + 1, 21, EYE);
    img.set(hx + 3, 21, BEAK_YELLOW);
    img.set(hx + 4, 21, BEAK_YELLOW);
    img.set(hx + 3, 22, INK);
  } else if (variant === "hop0" || variant === "hop1") {
    // Nhảy: hơi chồm về trước, chân tại y=30 (hop0) hoặc co lên y=28 (hop1)
    const dy = variant === "hop1" ? -2 : 0;
    if (variant === "hop0") {
      img.set(cx - 2, 30, INK);
      img.set(cx + 1, 30, INK);
    }
    img.set(cx - 1, 29 + dy, BEAK_YELLOW);
    img.set(cx + 1, 29 + dy, BEAK_YELLOW);

    // Thân chồm
    for (let y = 23 + dy; y <= 27 + dy; y++) {
      for (let dx = -3; dx <= 4; dx++) {
        img.set(cx + dx, y, BIRD_BROWN);
      }
    }
    img.set(cx + 2, 24 + dy, BIRD_LIGHT);
    img.set(cx + 3, 25 + dy, BIRD_LIGHT);
    img.set(cx - 2, 24 + dy, BIRD_WING);
    img.set(cx - 1, 25 + dy, BIRD_WING);

    // Đầu
    for (let y = 19 + dy; y <= 22 + dy; y++) {
      for (let dx = 0; dx <= 4; dx++) {
        img.set(cx + dx, y, BIRD_BROWN);
      }
    }
    img.set(cx + 3, 20 + dy, EYE);
    img.set(cx + 5, 20 + dy, BEAK_YELLOW);
    img.set(cx + 6, 21 + dy, BEAK_YELLOW);
  } else {
    // Bay: lưng chừng trời (y: 16..24), không chạm đất
    const wingUp = variant === "fly0";
    // Thân
    for (let y = 20; y <= 23; y++) {
      for (let dx = -3; dx <= 3; dx++) {
        img.set(cx + dx, y, BIRD_BROWN);
      }
    }
    img.set(cx + 2, 21, BIRD_LIGHT);
    img.set(cx + 4, 20, EYE);
    img.set(cx + 5, 20, BEAK_YELLOW);

    // Cánh giương lên hoặc sải ngang
    if (wingUp) {
      for (let dy = 0; dy <= 4; dy++) {
        img.set(cx - 1 - dy, 19 - dy, BIRD_WING);
        img.set(cx - dy, 19 - dy, BIRD_WING);
      }
    } else {
      for (let dx = -5; dx <= -1; dx++) {
        img.set(cx + dx, 22, BIRD_WING);
        img.set(cx + dx, 23, BIRD_WING);
      }
    }
  }

  return img;
}

// ------------------------------------------------------------------ Hàng 1: Mèo chuồng (baseline y = 30)

function drawCat(variant: "idle0" | "idle1" | "walk0" | "walk1" | "stretch0" | "stretch1"): Img {
  const img = new Img(32, 32);
  const cx = 15;

  if (variant === "idle0" || variant === "idle1") {
    // Ngồi: chân chạm y = 30
    for (let dx = -4; dx <= 4; dx++) img.set(cx + dx, 30, INK);
    for (let dx = -3; dx <= 3; dx++) img.set(cx + dx, 29, CAT_WHITE);

    // Thân tròn (y: 23..28)
    for (let y = 23; y <= 28; y++) {
      for (let dx = -5; dx <= 4; dx++) {
        img.set(cx + dx, y, CAT_ORANGE);
      }
    }
    // Vệt vằn
    img.set(cx - 2, 24, CAT_DARK);
    img.set(cx + 1, 24, CAT_DARK);
    img.set(cx - 1, 26, CAT_DARK);
    img.set(cx + 2, 26, CAT_DARK);

    // Đầu (y: 18..22)
    const headTilt = variant === "idle1" ? 1 : 0;
    for (let y = 18; y <= 22; y++) {
      for (let dx = 0; dx <= 5; dx++) {
        img.set(cx + dx + headTilt, y, CAT_ORANGE);
      }
    }
    // Tai nhọn
    img.set(cx + 1 + headTilt, 17, CAT_DARK);
    img.set(cx + 4 + headTilt, 17, CAT_DARK);
    // Mắt & Mũi
    img.set(cx + 3 + headTilt, 19, EYE);
    img.set(cx + 5 + headTilt, 20, CAT_NOSE);

    // Đuôi cong sau lưng
    img.set(cx - 6, 26, CAT_ORANGE);
    img.set(cx - 7, 25, CAT_DARK);
    img.set(cx - 7, 24, CAT_ORANGE);
    img.set(cx - 6, 23, CAT_DARK);
  } else if (variant === "walk0" || variant === "walk1") {
    // Đi bộ: 4 chân bước, chạm y=30
    const step = variant === "walk0" ? 1 : -1;
    img.set(cx - 4 + step, 30, INK);
    img.set(cx - 1 - step, 30, INK);
    img.set(cx + 2 + step, 30, INK);
    img.set(cx + 5 - step, 30, INK);

    for (let y = 27; y <= 29; y++) {
      img.set(cx - 4 + step, y, CAT_WHITE);
      img.set(cx - 1 - step, y, CAT_ORANGE);
      img.set(cx + 2 + step, y, CAT_ORANGE);
      img.set(cx + 5 - step, y, CAT_WHITE);
    }

    // Thân dài ngang (y: 22..26)
    for (let y = 22; y <= 26; y++) {
      for (let dx = -5; dx <= 5; dx++) {
        img.set(cx + dx, y, CAT_ORANGE);
      }
    }
    img.set(cx - 2, 23, CAT_DARK);
    img.set(cx + 1, 23, CAT_DARK);

    // Đầu vươn phía trước
    for (let y = 19; y <= 23; y++) {
      for (let dx = 4; dx <= 8; dx++) {
        img.set(cx + dx, y, CAT_ORANGE);
      }
    }
    img.set(cx + 5, 18, CAT_DARK);
    img.set(cx + 8, 18, CAT_DARK);
    img.set(cx + 7, 20, EYE);
    img.set(cx + 9, 21, CAT_NOSE);

    // Đuôi vểnh
    img.set(cx - 6, 23, CAT_ORANGE);
    img.set(cx - 7, 21, CAT_DARK);
    img.set(cx - 6, 20, CAT_ORANGE);
  } else {
    // Vươn vai (stretch): 2 chân trước duỗi thẳng dài về phía trước, mông nhổm cao
    const deep = variant === "stretch1" ? 1 : 0;
    // Chân trước tại y=30
    img.set(cx + 4 + deep, 30, INK);
    img.set(cx + 6 + deep, 30, INK);
    // Chân sau tại y=30
    img.set(cx - 5, 30, INK);
    img.set(cx - 3, 30, INK);

    // Thân dốc nghiêng: mông y=21..25, ngực y=25..28
    for (let dx = -5; dx <= -1; dx++) {
      for (let y = 21; y <= 26; y++) img.set(cx + dx, y, CAT_ORANGE);
    }
    for (let dx = 0; dx <= 4; dx++) {
      for (let y = 24 + deep; y <= 28; y++) img.set(cx + dx, y, CAT_ORANGE);
    }
    img.set(cx - 3, 22, CAT_DARK);
    img.set(cx + 1, 25 + deep, CAT_DARK);

    // Đầu thấp sát đất
    for (let y = 25 + deep; y <= 28; y++) {
      for (let dx = 4; dx <= 7; dx++) img.set(cx + dx, y, CAT_ORANGE);
    }
    img.set(cx + 5, 24 + deep, CAT_DARK);
    img.set(cx + 7, 24 + deep, CAT_DARK);
    img.set(cx + 7, 26 + deep, EYE);

    // Đuôi giơ cao
    img.set(cx - 6, 20, CAT_ORANGE);
    img.set(cx - 7, 18, CAT_DARK);
    img.set(cx - 6, 17, CAT_ORANGE);
  }

  return img;
}

// ------------------------------------------------------------------ Hàng 2: Bướm (bay lượn)

function drawButterfly(frame: number): Img {
  const img = new Img(32, 32);
  const cx = 16;
  const cy = 16;

  // Thân bướm nhỏ
  img.set(cx, cy - 2, BUTTERFLY_BODY);
  img.set(cx, cy - 1, BUTTERFLY_BODY);
  img.set(cx, cy, BUTTERFLY_BODY);
  img.set(cx, cy + 1, BUTTERFLY_BODY);
  img.set(cx, cy + 2, BUTTERFLY_BODY);

  // Râu bướm
  img.set(cx - 1, cy - 3, BUTTERFLY_BODY);
  img.set(cx + 1, cy - 3, BUTTERFLY_BODY);

  if (frame === 0 || frame === 1) {
    // Đậu (cánh khép hờ hoặc rung nhẹ)
    const span = frame === 0 ? 3 : 4;
    for (let dx = 1; dx <= span; dx++) {
      for (let dy = -3; dy <= 2; dy++) {
        img.set(cx - dx, cy + dy, BUTTERFLY_BLUE);
        img.set(cx + dx, cy + dy, BUTTERFLY_BLUE);
      }
    }
    img.set(cx - 2, cy - 1, BUTTERFLY_LIGHT);
    img.set(cx + 2, cy - 1, BUTTERFLY_LIGHT);
    img.set(cx - 2, cy, BUTTERFLY_PALE);
    img.set(cx + 2, cy, BUTTERFLY_PALE);
  } else {
    // Đập cánh: frame 2 (xòe rộng), 3 (hơi nghiêng), 4 (gập lên), 5 (sải xuống)
    const mode = frame - 2;
    if (mode === 0) {
      // Cánh xòe to nhất
      for (let dy = -4; dy <= 3; dy++) {
        for (let dx = 1; dx <= 6; dx++) {
          img.set(cx - dx, cy + dy, BUTTERFLY_BLUE);
          img.set(cx + dx, cy + dy, BUTTERFLY_BLUE);
        }
      }
      img.set(cx - 3, cy - 2, BUTTERFLY_PALE);
      img.set(cx + 3, cy - 2, BUTTERFLY_PALE);
      img.set(cx - 4, cy - 1, BUTTERFLY_LIGHT);
      img.set(cx + 4, cy - 1, BUTTERFLY_LIGHT);
    } else if (mode === 1) {
      // Cánh xòe vừa
      for (let dy = -3; dy <= 2; dy++) {
        for (let dx = 1; dx <= 5; dx++) {
          img.set(cx - dx, cy + dy, BUTTERFLY_BLUE);
          img.set(cx + dx, cy + dy, BUTTERFLY_BLUE);
        }
      }
      img.set(cx - 2, cy - 1, BUTTERFLY_PALE);
      img.set(cx + 2, cy - 1, BUTTERFLY_PALE);
    } else if (mode === 2) {
      // Cánh gập đứng lên cao
      for (let dy = -6; dy <= 0; dy++) {
        for (let dx = 1; dx <= 2; dx++) {
          img.set(cx - dx, cy + dy, BUTTERFLY_LIGHT);
          img.set(cx + dx, cy + dy, BUTTERFLY_BLUE);
        }
      }
    } else {
      // Cánh vẫy xuống thấp
      for (let dy = 0; dy <= 4; dy++) {
        for (let dx = 1; dx <= 4; dx++) {
          img.set(cx - dx, cy + dy, BUTTERFLY_BLUE);
          img.set(cx + dx, cy + dy, BUTTERFLY_BLUE);
        }
      }
      img.set(cx - 2, cy + 2, BUTTERFLY_PALE);
      img.set(cx + 2, cy + 2, BUTTERFLY_PALE);
    }
  }

  return img;
}

// ------------------------------------------------------------------ Hàng 3: Túi gió đường đua (windsock)

function drawWindsock(variant: "calm0" | "calm1" | "breeze0" | "breeze1" | "breeze2" | "breeze3"): Img {
  const img = new Img(32, 32);
  const cx = 8;

  // Cột đỡ (pole): từ chân y = 30 lên đỉnh y = 10
  for (let y = 10; y <= 30; y++) {
    img.set(cx, y, POLE_GRAY);
  }
  img.set(cx - 1, 30, POLE_DARK);
  img.set(cx + 1, 30, POLE_DARK);
  img.set(cx, 9, POLE_DARK); // chóp xoay

  if (variant === "calm0" || variant === "calm1") {
    // Lặng gió: túi rủ xuống tự nhiên
    const drop = variant === "calm1" ? 1 : 0;
    // Vòng miệng túi đỏ
    for (let y = 10; y <= 13; y++) {
      img.set(cx + 1, y, SOCK_RED);
      img.set(cx + 2, y, SOCK_RED);
    }
    // Đoạn trắng rủ xuống
    for (let y = 14; y <= 17; y++) {
      img.set(cx + 2, y, SOCK_WHITE);
      img.set(cx + 3, y, SOCK_WHITE);
    }
    // Đoạn đỏ tiếp
    for (let y = 18; y <= 21 + drop; y++) {
      img.set(cx + 2, y, SOCK_RED);
    }
    // Đuôi thon nhọn
    img.set(cx + 2, 22 + drop, SOCK_WHITE);
  } else {
    // Gió thổi: túi bay ngang sang phải nhấp nhô theo 4 khung
    const angle =
      variant === "breeze0" ? 0 : variant === "breeze1" ? 1 : variant === "breeze2" ? -1 : 0;

    // Miệng túi (rộng 4 px)
    for (let dy = 0; dy <= 3; dy++) {
      img.set(cx + 1, 10 + dy, SOCK_RED);
      img.set(cx + 2, 10 + dy, SOCK_RED);
      img.set(cx + 3, 10 + dy, SOCK_RED);
    }
    // Khoang trắng
    for (let dx = 4; dx <= 8; dx++) {
      for (let dy = 0; dy <= 2; dy++) {
        img.set(cx + dx, 11 + dy + angle, SOCK_WHITE);
      }
    }
    // Khoang đỏ
    for (let dx = 9; dx <= 13; dx++) {
      for (let dy = 0; dy <= 2; dy++) {
        img.set(cx + dx, 11 + dy - angle, SOCK_RED);
      }
    }
    // Khoang trắng đuôi
    for (let dx = 14; dx <= 17; dx++) {
      img.set(cx + dx, 12 + angle, SOCK_WHITE);
      img.set(cx + dx, 13 + angle, SOCK_WHITE);
    }
    // Đuôi nhọn đỏ
    img.set(cx + 18, 12 + angle, SOCK_RED);
    img.set(cx + 19, 12 + angle, SOCK_RED);
  }

  return img;
}

// ------------------------------------------------------------------ Sinh toàn bộ Sheet S16

export function generateAmbientLifeSheet(): Img {
  const birdFrames: Img[] = [
    drawBird("idle0"),
    drawBird("idle1"),
    drawBird("hop0"),
    drawBird("hop1"),
    drawBird("fly0"),
    drawBird("fly1"),
  ];

  const catFrames: Img[] = [
    drawCat("idle0"),
    drawCat("idle1"),
    drawCat("walk0"),
    drawCat("walk1"),
    drawCat("stretch0"),
    drawCat("stretch1"),
  ];

  const butterflyFrames: Img[] = [
    drawButterfly(0),
    drawButterfly(1),
    drawButterfly(2),
    drawButterfly(3),
    drawButterfly(4),
    drawButterfly(5),
  ];

  const windsockFrames: Img[] = [
    drawWindsock("calm0"),
    drawWindsock("calm1"),
    drawWindsock("breeze0"),
    drawWindsock("breeze1"),
    drawWindsock("breeze2"),
    drawWindsock("breeze3"),
  ];

  const grid: (Img | null)[][] = [
    birdFrames,
    catFrames,
    butterflyFrames,
    windsockFrames,
    Array(6).fill(null),
    Array(6).fill(null),
  ];

  return sheet(grid, 32, 6, 6);
}

/** Tạo bảng context preview ghép 4 loài vào các vị trí tiêu biểu trên nền trang trại. */
export function generateContextPreview(): Img {
  // Nền 384×256 chứa 4 góc đại diện
  const board = new Img(480, 320);

  // Tô nền cỏ xanh ấm áp
  for (let y = 0; y < board.h; y++) {
    for (let x = 0; x < board.w; x++) {
      const checker = (Math.floor(x / 32) + Math.floor(y / 32)) % 2 === 0;
      board.set(x, y, checker ? hex("#558B2F") : hex("#4E7C28"));
    }
  }

  // 1. Chim sẻ đậu trên hàng rào bãi thả (x: 60, y: 50)
  const bird = drawBird("idle1");
  board.blit(bird, 60, 50);

  // 2. Mèo chuồng lười biếng gần kho (x: 220, y: 70)
  const cat = drawCat("stretch0");
  board.blit(cat, 220, 70);

  // 3. Bướm bay lượn trên vườn hoa (x: 120, y: 180)
  const butterfly = drawButterfly(2);
  board.blit(butterfly, 120, 180);

  // 4. Túi gió bay phấp phới ngoài đường đua (x: 320, y: 140)
  const windsock = drawWindsock("breeze1");
  board.blit(windsock, 320, 140);

  return board;
}

// Chạy trực tiếp chỉ sinh ảnh đề xuất. Không xuất bản vào runtime trước khi được duyệt.
if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, "/")}`) {
  const sheetImg = generateAmbientLifeSheet();
  savePng("art/preview/s16-ambient-life-x4.png", preview(sheetImg, 4));
  savePng("art/preview/s16-ambient-life-context.png", preview(generateContextPreview(), 2));
  console.log("Generated preview-only S16 proposals; nothing was published to runtime.");
}

