// Khu chuồng 6×6 (SIM-02, hiện trong bảng nổi trên bản đồ): hoạt cảnh đứng/ăn/nằm, viền 4 màu sức khỏe, hồi thể lực + nhịp tim nghỉ, sự cố tại chuồng.
import { useRef, useState } from "react";
import { publish } from "../sim/bus";
import { stepRest, type HorseProfile, type StallHealth } from "../sim/engine";
import { HEALTH_LABEL, LIFECYCLE_LABEL } from "../sim/horses";
import { INCIDENT_LABEL, incidentPacket, horseRef } from "../sim/packets";
import { drawStalls, HEALTH_COLOR, stallActivity } from "../render/scenes";
import type { Sprites } from "../render/sprites";
import { PixelCanvas } from "./PixelCanvas";
import s from "./ui.module.css";
import t from "./Tabs.module.css";

type Vitals = { hr: number; stamina: number; tempC: number; rng: number };
const SNAPSHOT_EVERY_S = 10;

interface Props {
  horses: HorseProfile[];
  sprites: Sprites;
  speed: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onIncident: (horseId: string) => void;
  onOpenCard: (horseId: string) => void;
}

const ACTIVITY_LABEL = { IDLE: "Đứng thở", GRAZE: "Ăn cỏ / ngũ cốc", LIE: "Nằm nghỉ" } as const;

export function StallTab({ horses, sprites, speed, selectedId, onSelect, onIncident, onOpenCard }: Props) {
  const vitals = useRef(new Map<string, Vitals>());
  const loop = useRef({ simT: 0, realT: 0, snapAcc: 0, uiAcc: 0 });
  const [, force] = useState(0);
  const horsesRef = useRef(horses);
  horsesRef.current = horses;

  for (const h of horses) {
    if (!vitals.current.has(h.id)) {
      vitals.current.set(h.id, { hr: h.hrRest + 4, stamina: 72 + (h.weightKg % 25), tempC: 37.9, rng: h.weightKg * 977 });
    }
  }

  const onFrame = (ctx: CanvasRenderingContext2D, w: number, h: number, dtReal: number) => {
    const L = loop.current;
    L.realT += dtReal;
    const simDt = dtReal * speed;
    L.simT += simDt;
    for (const hz of horsesRef.current) {
      const v = vitals.current.get(hz.id);
      if (v && simDt > 0) stepRest(v, hz, simDt);
    }
    L.snapAcc += simDt;
    if (L.snapAcc >= SNAPSHOT_EVERY_S) {
      L.snapAcc = 0;
      publish("sim:telemetry_tick", "OUT", {
        event: "sim:telemetry_tick",
        mode: "STALL_REST",
        timestamp_ms: Date.now(),
        sim_speed_multiplier: speed,
        stall_vitals: horsesRef.current.map((hz) => {
          const v = vitals.current.get(hz.id);
          return {
            ...horseRef(hz),
            stall: hz.stall,
            heart_rate_bpm: v ? Math.round(v.hr) : null,
            stamina_pct: v ? Math.round(v.stamina * 10) / 10 : null,
            body_temp_c: v ? Math.round(v.tempC * 10) / 10 : null,
            stamina_recovery_pct_per_min: 2,
          };
        }),
      });
    }
    L.uiAcc += dtReal;
    if (L.uiAcc > 0.5) {
      L.uiAcc = 0;
      force((n) => n + 1);
    }
    drawStalls(ctx, w, h, sprites, horsesRef.current, vitals.current, selectedId, L.realT);
  };

  const selected = horses.find((h) => h.id === selectedId) ?? null;
  const sv = selected ? vitals.current.get(selected.id) : undefined;

  function report(kind: "COLIC" | "FEVER") {
    if (!selected) return;
    publish("sim:incident_report", "OUT", incidentPacket(null, selected, kind, "STALL"));
    onIncident(selected.id);
  }

  return (
    <div className={t.stack}>
      <section className={s.card}>
        <div className={s.cardHead}>
          <div className={t.legend}>
            {(Object.keys(HEALTH_LABEL) as StallHealth[]).map((k) => (
              <span key={k} className={s[k]}>
                {HEALTH_LABEL[k]}
              </span>
            ))}
          </div>
        </div>
        <div className={s.sceneFrame}>
          <PixelCanvas
            aspect={0.66}
            onFrame={onFrame}
            label="Sơ đồ chuồng ngựa 6 nhân 6 ô"
            onPointer={(x, y, w, h) => {
              const col = Math.floor((x / w) * 6);
              const row = Math.floor((y / h) * 6);
              const hit = horses.find((hz) => hz.stall.col === col && hz.stall.row === row);
              if (hit) onSelect(hit.id);
            }}
          />
        </div>
        <div className={s.cardBody}>
          <p className={s.hint}>
            Chạm vào ô chuồng để xem ngựa. Ngựa nghỉ trong chuồng hồi thể lực khoảng 2% mỗi phút, nhịp tim nghỉ 38–45 nhịp/phút.
          </p>
        </div>
      </section>

      {selected && sv && (
        <section className={s.card}>
          <div className={s.cardHead}>
            <h3 className={s.cardTitle}>
              Ô chuồng {String.fromCharCode(65 + selected.stall.row)}
              {selected.stall.col + 1} · <span className={t.horseName}>{selected.name}</span>
            </h3>
            <span className={t.stallInfo}>
              <span className={s.badge} style={{ color: HEALTH_COLOR[selected.health] }}>
                {LIFECYCLE_LABEL[selected.lifecycle]}
              </span>
              <span className={s.hint}>{ACTIVITY_LABEL[stallActivity(selected, loop.current.realT)]}</span>
            </span>
          </div>
          <div className={s.cardBody}>
            <div className={t.vitals}>
              <div className={s.metric}>
                <div className={s.metricLabel}>Nhịp tim nghỉ</div>
                <div className={s.metricValue}>
                  {Math.round(sv.hr)}
                  <span className={s.metricUnit}>bpm</span>
                </div>
              </div>
              <div className={s.metric}>
                <div className={s.metricLabel}>Thể lực</div>
                <div className={s.metricValue}>
                  {sv.stamina.toFixed(1)}
                  <span className={s.metricUnit}>%</span>
                </div>
              </div>
              <div className={s.metric}>
                <div className={s.metricLabel}>Thân nhiệt</div>
                <div className={s.metricValue}>
                  {sv.tempC.toFixed(1)}
                  <span className={s.metricUnit}>°C</span>
                </div>
              </div>
            </div>
          </div>
          <div className={`${s.cardBody} ${t.incidentBar}`}>
            <button type="button" className={`${s.btn} ${s.primary} ${s.puffy}`} onClick={() => onOpenCard(selected.id)}>
              Xem thẻ ngựa
            </button>
            <span className={s.hint}>Tạo sự cố tại chuồng (bác sĩ thú y được báo cho cả khu chuồng):</span>
            <button type="button" className={s.danger} onClick={() => report("COLIC")}>
              {INCIDENT_LABEL.COLIC}
            </button>
            <button type="button" className={s.btn} onClick={() => report("FEVER")}>
              {INCIDENT_LABEL.FEVER}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
