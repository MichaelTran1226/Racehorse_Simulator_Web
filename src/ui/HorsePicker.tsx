// Chọn ngựa chạy thử bằng chân dung (thay cột danh sách cũ). Ngựa đang khóa y tế vẫn chọn được — TrialTab chỉ cho bài nhẹ.
import type { Sprites } from "../render/sprites";
import type { HorseProfile } from "../sim/engine";
import c from "./HorsePicker.module.css";
import { Thumb } from "./HorseList";
import s from "./ui.module.css";

interface Props {
  horses: HorseProfile[];
  sprites: Sprites;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function HorsePicker({ horses, sprites, selectedId, onSelect }: Props) {
  return (
    <div className={c.strip} role="radiogroup" aria-label="Chọn ngựa chạy thử">
      {horses.map((h) => (
        <button
          key={h.id}
          type="button"
          role="radio"
          aria-checked={h.id === selectedId}
          className={c.pick}
          data-locked={h.medicalLock}
          onClick={() => onSelect(h.id)}
        >
          <Thumb sprites={sprites} horse={h} />
          <span className={c.name}>{h.name}</span>
          {h.medicalLock && <span className={`${s.lock} ${c.lock}`}>Khóa</span>}
        </button>
      ))}
    </div>
  );
}
