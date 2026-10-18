// Bảng "Danh sách ngựa" trên HUD: lưới thẻ nhỏ (hình đúng màu lông + tên + tình trạng), chạm để mở thẻ ngựa.
import { useEffect, useRef } from "react";
import { drawFrame, ROW, tinted, type Sprites } from "../render/sprites";
import type { HorseProfile } from "../sim/engine";
import { HEALTH_LABEL } from "../sim/horses";
import c from "./HorseList.module.css";
import { Popup } from "./Popup";
import s from "./ui.module.css";

const MAX_HORSES = 36; // lưới chuồng 6×6

interface Props {
  horses: HorseProfile[];
  sprites: Sprites;
  reported: Set<string>;
  onOpen: (id: string) => void;
  onRandom: () => void;
  onClose: () => void;
}

export function HorseList({ horses, sprites, reported, onOpen, onRandom, onClose }: Props) {
  return (
    <Popup title={`Đàn ngựa · ${horses.length}`} onClose={onClose}>
      <ul className={c.grid}>
        {horses.map((h, i) => (
          <li key={h.id} style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
            <button type="button" className={c.tile} data-health={h.health} onClick={() => onOpen(h.id)}>
              <Thumb sprites={sprites} horse={h} />
              <span className={c.name}>{h.name}</span>
              <span className={c.tags}>
                <span className={s[h.health]}>{HEALTH_LABEL[h.health]}</span>
                {h.medicalLock && <span className={s.lock}>Khóa</span>}
                {reported.has(h.id) && <span className={c.alert} aria-label="Đã báo sự cố">!</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className={c.actions}>
        <button type="button" className={`${s.btn} ${s.primary} ${s.puffy}`} onClick={onRandom} disabled={horses.length >= MAX_HORSES}>
          + Thêm ngựa mới
        </button>
      </div>
    </Popup>
  );
}

/** Hình tĩnh (một khung) — tránh chạy hàng chục vòng rAF cho cả lưới. */
export function Thumb({ sprites, horse }: { sprites: Sprites; horse: HorseProfile }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 64, 64);
    drawFrame(ctx, sprites.horse, tinted(sprites.horse, horse.coat), 0, ROW.IDLE, 32, 62, 60);
  }, [sprites, horse.coat]);
  return <canvas ref={ref} width={64} height={64} className={c.thumb} aria-hidden />;
}
