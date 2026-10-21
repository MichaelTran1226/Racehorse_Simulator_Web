// Mốc thời gian intro TMEC (ms) và cách tách tiêu đề thành chữ — thuần, không chạm DOM.

export const INTRO_TITLE = "THIEN MA EQUESTRIAN CLUB";

export const INTRO = {
  /** Pha 1: "TMEC" bật nảy ở giữa mây. */
  acronymPop: { start: 150, duration: 700 },
  /** Pha 2: các chữ còn lại giãn ra lần lượt thành tên đầy đủ, rồi giữ và bồng bềnh. */
  expand: { start: 1200, duration: 800 },
  /** Mỗi chữ giãn ra trong bấy nhiêu ms (nằm trong `expand`). */
  letterGrow: 300,
  /** Pha 3: tiêu đề mờ dần, mây tách sang hai bên, màn chính lùi từ 1.06 về 1. */
  part: { start: 2800, duration: 1400 },
  /** Lớp gần tách nhanh hơn lớp xa (parallax): tỉ lệ thời lượng theo lớp. */
  layerSpeed: { front: 0.8, mid: 0.9, back: 1 },
  /** Giảm chuyển động: hiện sẵn tên đầy đủ, chỉ mờ dần lớp phủ. */
  reducedFade: { start: 1200, duration: 400 },
} as const;

export const INTRO_TOTAL_MS = INTRO.part.start + INTRO.part.duration;
export const INTRO_REDUCED_TOTAL_MS = INTRO.reducedFade.start + INTRO.reducedFade.duration;

export interface TitleLetter {
  readonly char: string;
  /** Chữ cái đầu của mỗi từ: tạo thành "TMEC", hiện ngay từ pha 1. */
  readonly initial: boolean;
  /** Độ trễ (ms) khi giãn ra ở pha 2; chữ đầu từ = 0. */
  readonly delay: number;
}

/** Tách tên thành từng từ/chữ; chữ không phải chữ đầu được rải đều độ trễ trong `span` ms theo thứ tự đọc. */
export function titleLetters(title: string, span: number): TitleLetter[][] {
  const words = title.split(" ");
  const rest = words.reduce((n, w) => n + w.length - 1, 0);
  let k = 0;
  return words.map((word) =>
    [...word].map((char, i) => (i === 0 ? { char, initial: true, delay: 0 } : { char, initial: false, delay: rest > 1 ? Math.round((k++ / (rest - 1)) * span) : 0 })),
  );
}

export type CloudLayer = "back" | "mid" | "front";
export const CLOUD_SPRITES = ["big", "mid1", "mid2", "small1", "small2", "small3"] as const;

export interface CloudPuff {
  readonly sprite: (typeof CLOUD_SPRITES)[number];
  /** Khoảng cách từ mép ngoài màn hình, % bề rộng nửa màn hình (có thể vượt 100 để lấn sang giữa). */
  readonly x: number;
  /** % chiều cao màn hình. */
  readonly y: number;
  /** Bề rộng, đơn vị vmax. */
  readonly w: number;
  /** Chu kỳ nhấp nhô (s) và độ lệch pha âm (s). */
  readonly bob: number;
  readonly phase: number;
}

/**
 * Lưới mây dày cho một nửa màn hình ở lớp `layer`: lớp xa to và thưa, lớp gần nhỏ hơn và dày, lấn qua giữa
 * để hai nửa khép kín. Lệch vị trí theo hàm băm cố định (không ngẫu nhiên) để lần nào mở cũng giống nhau.
 */
export function cloudField(layer: CloudLayer): CloudPuff[] {
  // Chỉ dùng mây sáng (big, small2, small3): mid1/mid2/small1 là mây xám, chồng nhiều lớp thành mây giông.
  const spec = { back: { cols: 3, rows: 4, w: 46, sprites: [0, 0, 0] }, mid: { cols: 4, rows: 5, w: 34, sprites: [0, 4, 0, 5] }, front: { cols: 4, rows: 6, w: 24, sprites: [4, 0, 5, 4] } }[layer];
  const salt = { back: 1, mid: 7, front: 13 }[layer];
  const puffs: CloudPuff[] = [];
  for (let r = 0; r < spec.rows; r++) {
    for (let c = 0; c < spec.cols; c++) {
      const h = (r * 31 + c * 17 + salt * 7) % 23; // 0..22
      puffs.push({
        sprite: CLOUD_SPRITES[spec.sprites[(r + c) % spec.sprites.length]],
        x: -15 + (c / (spec.cols - 1)) * 115 + (h % 7) - 3,
        y: -18 + (r / (spec.rows - 1)) * 110 + (h % 5) - 2,
        w: spec.w + (h % 4) * 2,
        bob: 3 + (h % 5) * 0.4,
        phase: -(h % 9) * 0.35,
      });
    }
  }
  return puffs;
}

/** Chữ viết tắt hiện ở pha 1 (luôn khớp với các chữ đầu từ). */
export const acronymOf = (title: string) => title.split(" ").map((w) => w[0]).join("");
