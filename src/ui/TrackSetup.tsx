// Dựng sân trước khi chạy thử (M3): chọn tình trạng mặt sân + đặt chướng ngại lên dải sân bằng cách bấm.
import { useState } from "react";
import { OBSTACLE, type Obstacle, type ObstacleKind, type TrackCondition } from "../sim/engine";
import c from "./TrackSetup.module.css";
import s from "./ui.module.css";

export const CONDITION_LABEL: Record<TrackCondition, string> = { GOOD: "Tốt (khô)", WET: "Ướt", HEAVY: "Lầy" };
export const OBSTACLE_LABEL: Record<ObstacleKind, string> = { RAIL: "Rào thấp", HAY: "Kiện rơm", MUD: "Vũng bùn" };

const MAX = 8;
const MIN_GAP_M = 30;
const START_CLEAR_M = 60;
const FINISH_CLEAR_M = 40;

interface Props {
  distance: number;
  condition: TrackCondition;
  obstacles: Obstacle[];
  disabled: boolean;
  onCondition: (c: TrackCondition) => void;
  onObstacles: (o: Obstacle[]) => void;
}

function fits(list: Obstacle[], o: Obstacle, distance: number) {
  const end = o.atM + OBSTACLE[o.kind].lengthM;
  return (
    o.atM >= START_CLEAR_M &&
    end <= distance - FINISH_CLEAR_M &&
    list.every((x) => o.atM > x.atM + OBSTACLE[x.kind].lengthM + MIN_GAP_M || end < x.atM - MIN_GAP_M)
  );
}

export function TrackSetup({ distance, condition, obstacles, disabled, onCondition, onObstacles }: Props) {
  const [kind, setKind] = useState<ObstacleKind>("RAIL");
  const [hint, setHint] = useState<string | null>(null);

  function place(e: React.MouseEvent<HTMLDivElement>) {
    if (disabled) return;
    const r = e.currentTarget.getBoundingClientRect();
    const atM = Math.round((((e.clientX - r.left) / r.width) * distance) / 10) * 10;
    const o = { atM, kind };
    if (obstacles.length >= MAX) return setHint(`Tối đa ${MAX} chướng ngại.`);
    if (!fits(obstacles, o, distance)) return setHint(`Cách vạch xuất phát ≥ ${START_CLEAR_M} m, vạch đích ≥ ${FINISH_CLEAR_M} m và cách nhau ≥ ${MIN_GAP_M} m.`);
    setHint(null);
    onObstacles([...obstacles, o].sort((a, b) => a.atM - b.atM));
  }

  function random() {
    const kinds: ObstacleKind[] = ["RAIL", "HAY", "MUD"];
    const out: Obstacle[] = [];
    const n = 3 + Math.floor(Math.random() * 3);
    for (let tries = 0; out.length < n && tries < 60; tries++) {
      const o = { atM: Math.round((START_CLEAR_M + Math.random() * (distance - 140)) / 10) * 10, kind: kinds[Math.floor(Math.random() * 3)] };
      if (fits(out, o, distance)) out.push(o);
    }
    setHint(null);
    onObstacles(out.sort((a, b) => a.atM - b.atM));
  }

  const marks = Array.from({ length: Math.floor(distance / 200) + 1 }, (_, i) => i * 200);

  return (
    <div className={c.setup}>
      <div className={s.row}>
        <div className={s.field}>
          Tình trạng sân
          <div className={s.segmented} role="group" aria-label="Tình trạng sân">
            {(Object.keys(CONDITION_LABEL) as TrackCondition[]).map((k) => (
              <button key={k} type="button" className={s.segment} aria-pressed={condition === k} disabled={disabled} onClick={() => onCondition(k)}>
                {CONDITION_LABEL[k]}
              </button>
            ))}
          </div>
        </div>
        <div className={s.field}>
          Chướng ngại để đặt
          <div className={s.segmented} role="group" aria-label="Loại chướng ngại">
            {(Object.keys(OBSTACLE_LABEL) as ObstacleKind[]).map((k) => (
              <button key={k} type="button" className={s.segment} aria-pressed={kind === k} disabled={disabled} onClick={() => setKind(k)}>
                <span className={c.icon} data-kind={k} aria-hidden /> {OBSTACLE_LABEL[k]}
              </button>
            ))}
          </div>
        </div>
        <div className={s.spacer} />
        <button type="button" className={`${s.btn} ${s.small}`} disabled={disabled} onClick={random}>
          Ngẫu nhiên
        </button>
        <button type="button" className={`${s.btn} ${s.small}`} disabled={disabled || obstacles.length === 0} onClick={() => onObstacles([])}>
          Xóa hết
        </button>
      </div>

      <div className={c.stripWrap}>
        <div
          className={c.strip}
          data-condition={condition}
          data-disabled={disabled}
          onClick={place}
          role="presentation"
          title={disabled ? undefined : `Bấm để đặt ${OBSTACLE_LABEL[kind].toLowerCase()}`}
        >
          {marks.map((m) => (
            <span key={m} className={c.tick} style={{ left: `${(m / distance) * 100}%` }}>
              {m}
            </span>
          ))}
          <span className={c.gate} aria-hidden />
          <span className={c.finish} aria-hidden />
          {obstacles.map((o) => (
            <button
              key={`${o.kind}-${o.atM}`}
              type="button"
              className={c.marker}
              data-kind={o.kind}
              disabled={disabled}
              style={{ left: `${(o.atM / distance) * 100}%`, width: o.kind === "MUD" ? `${(OBSTACLE.MUD.lengthM / distance) * 100}%` : undefined }}
              aria-label={`${OBSTACLE_LABEL[o.kind]} tại ${o.atM} m — bấm để gỡ`}
              onClick={(e) => {
                e.stopPropagation();
                onObstacles(obstacles.filter((x) => x !== o));
              }}
            />
          ))}
        </div>
        <p className={s.hint}>
          {hint ??
            (obstacles.length
              ? `${obstacles.length} chướng ngại: ${obstacles.map((o) => `${OBSTACLE_LABEL[o.kind]} ${o.atM} m`).join(" · ")} — bấm vào dấu để gỡ.`
              : "Bấm lên dải sân để đặt chướng ngại (tùy chọn). Rào/kiện rơm: ngựa giảm tốc và bật nhảy; vũng bùn 12 m: chậm và hao sức.")}
        </p>
      </div>
    </div>
  );
}
