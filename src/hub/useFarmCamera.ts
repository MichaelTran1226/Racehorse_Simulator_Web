import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { clampCamera, classifyPointerGesture, decayVelocity, MIN_SPEED, type Size } from "./camera";
import { FARM_WORLD, type Point } from "./farmLayout";

/** Chỉ tính vận tốc thả tay từ các mẫu trong khoảng này (ms) — dừng tay lâu rồi mới thả thì không trượt. */
const SAMPLE_MS = 80;

export function useFarmCamera(viewport: Size, initial: Point, scale = 1) {
  const [camera, setCamera] = useState(() => clampCamera(initial, viewport, FARM_WORLD));
  const gesture = useRef<{ pointerId: number; start: Point; origin: Point; dragged: boolean; samples: { t: number; x: number; y: number }[] } | null>(null);
  const momentum = useRef(0);
  const view = useRef(viewport);
  view.current = viewport;

  const stopMomentum = useCallback(() => {
    cancelAnimationFrame(momentum.current);
    momentum.current = 0;
  }, []);
  useEffect(() => stopMomentum, [stopMomentum]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    stopMomentum();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: camera, dragged: false, samples: [] };
  }, [camera, stopMomentum]);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const now = { x: event.clientX, y: event.clientY };
    active.dragged ||= classifyPointerGesture(active.start, now) === "drag";
    if (!active.dragged) return;
    const t = performance.now();
    active.samples.push({ t, ...now });
    while (active.samples.length > 2 && t - active.samples[0].t > SAMPLE_MS) active.samples.shift();
    setCamera(clampCamera({ x: active.origin.x - (now.x - active.start.x) / scale, y: active.origin.y - (now.y - active.start.y) / scale }, viewport, FARM_WORLD));
  }, [scale, viewport]);

  /** Thả tay sau khi kéo: camera trượt tiếp theo vận tốc cuối rồi chậm dần (bỏ qua khi giảm chuyển động). */
  const glideOut = useCallback((samples: { t: number; x: number; y: number }[]) => {
    if (samples.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const a = samples[0];
    const b = samples[samples.length - 1];
    const dt = b.t - a.t;
    if (dt <= 0 || performance.now() - b.t > SAMPLE_MS) return;
    let v = { x: -(b.x - a.x) / dt / scale, y: -(b.y - a.y) / dt / scale }; // px thế giới / ms
    let last = performance.now();
    const step = (now: number) => {
      const ms = now - last;
      last = now;
      v = decayVelocity(v, ms);
      if (Math.hypot(v.x, v.y) < MIN_SPEED) return stopMomentum();
      setCamera((cam) => clampCamera({ x: cam.x + v.x * ms, y: cam.y + v.y * ms }, view.current, FARM_WORLD));
      momentum.current = requestAnimationFrame(step);
    };
    momentum.current = requestAnimationFrame(step);
  }, [scale, stopMomentum]);

  const finishPointer = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return false;
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (active.dragged) glideOut(active.samples);
    return !active.dragged;
  }, [glideOut]);

  return { camera, setCamera, onPointerDown, onPointerMove, finishPointer, stopMomentum };
}
