import { useEffect, useRef } from "react";

export type FrameFn = (ctx: CanvasRenderingContext2D, w: number, h: number, dtReal: number) => void;

interface Props {
  /** Gọi mỗi khung hình (requestAnimationFrame) — vừa bước mô phỏng vừa vẽ. */
  onFrame: FrameFn;
  /** Tỉ lệ cao/rộng của khung vẽ. */
  aspect: number;
  onPointer?: (x: number, y: number, w: number, h: number) => void;
  label: string;
}

/** Canvas tự co theo bề ngang khung chứa, nét pixel (không làm mờ), chạy vòng lặp rAF riêng. */
export function PixelCanvas({ onFrame, aspect, onPointer, label }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(onFrame);
  frameRef.current = onFrame;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth;
      h = Math.round(w * aspect);
      canvas.style.height = `${h}px`;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };
    resize();
    // đổi chiều cao ngay trong callback làm ResizeObserver báo vòng lặp → dời sang khung hình kế
    let pending = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(resize);
    });
    ro.observe(canvas);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); // tab bị ẩn lâu không nhảy cóc mô phỏng
      last = now;
      ctx.imageSmoothingEnabled = false;
      frameRef.current(ctx, w, h, dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(pending);
      ro.disconnect();
    };
  }, [aspect]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label}
      style={{ width: "100%" }}
      onClick={(e) => {
        if (!onPointer || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        onPointer(e.clientX - r.left, e.clientY - r.top, r.width, r.height);
      }}
    />
  );
}
