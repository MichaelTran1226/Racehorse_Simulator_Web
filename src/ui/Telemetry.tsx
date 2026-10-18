// HUD 8 chỉ số (SRS SIM-04) + biểu đồ trượt 120 điểm vận tốc/nhịp tim (SRS 4.3).
import { alertsOf, type HorseProfile, type RunState } from "../sim/engine";
import { PixelCanvas } from "./PixelCanvas";
import s from "./ui.module.css";

export interface HudSnapshot {
  v: number;
  hr: number;
  stamina: number;
  tempC: number;
  strideLenM: number;
  strideFreqHz: number;
  kcal: number;
  distance: number;
  targetM: number;
  overload: boolean;
  heat: boolean;
  t: number;
}

export function snapshotOf(run: RunState): HudSnapshot {
  const a = alertsOf(run);
  return {
    v: run.v,
    hr: run.hr,
    stamina: run.stamina,
    tempC: run.tempC,
    strideLenM: run.strideLenM,
    strideFreqHz: run.strideFreqHz,
    kcal: run.kcal,
    distance: Math.min(run.distance, run.targetM),
    targetM: run.targetM,
    overload: a.overload_warning,
    heat: a.heat_stress,
    t: run.t,
  };
}

function Metric(props: { label: string; value: string; unit: string; sub?: string; alert?: boolean }) {
  return (
    <div className={props.alert ? s.metricAlert : s.metric}>
      <div className={s.metricLabel}>{props.label}</div>
      <div className={s.metricValue}>
        {props.value}
        <span className={s.metricUnit}>{props.unit}</span>
      </div>
      {props.sub && <div className={s.metricSub}>{props.sub}</div>}
    </div>
  );
}

export function Hud({ snap, horse }: { snap: HudSnapshot; horse: HorseProfile }) {
  return (
    <div className={s.metrics}>
      <Metric label="Vận tốc" value={(snap.v * 3.6).toFixed(1)} unit="km/h" sub={`${snap.v.toFixed(1)} m/s`} />
      <Metric
        label="Nhịp tim"
        value={String(Math.round(snap.hr))}
        unit="bpm"
        sub={`ngưỡng ${horse.hrAlert} · max ${horse.hrMax}`}
        alert={snap.hr >= horse.hrAlert}
      />
      <Metric label="Thể lực" value={snap.stamina.toFixed(0)} unit="%" alert={snap.stamina < 20} />
      <Metric label="Thân nhiệt" value={snap.tempC.toFixed(1)} unit="°C" alert={snap.heat} />
      <Metric label="Chiều dài sải" value={snap.strideLenM.toFixed(2)} unit="m" />
      <Metric label="Tần số sải" value={String(Math.round(snap.strideFreqHz * 60))} unit="sải/phút" sub={`${snap.strideFreqHz.toFixed(2)} Hz`} />
      <Metric label="Calo tiêu hao" value={snap.kcal.toFixed(0)} unit="kcal" />
      <Metric
        label="Quãng đường"
        value={String(Math.round(snap.distance))}
        unit={`/ ${snap.targetM} m`}
        sub={`t = ${formatTime(snap.t)}`}
      />
    </div>
  );
}

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const r = sec - m * 60;
  return `${String(m).padStart(2, "0")}:${r.toFixed(1).padStart(4, "0")}`;
}

export interface ChartPoint {
  speedKmh: number;
  hr: number;
}

export const CHART_POINTS = 120;

const readVar = (name: string, el: Element) => getComputedStyle(el).getPropertyValue(name).trim();

/** Đọc mảng điểm qua ref để vẽ mỗi khung mà không render lại React. */
export function LiveChart({ series }: { series: { current: ChartPoint[] } }) {
  return (
    <PixelCanvas
      aspect={0.28}
      label="Biểu đồ vận tốc và nhịp tim theo thời gian"
      onFrame={(ctx, w, h) => {
        const root = document.documentElement;
        const pad = { l: 34, r: 34, t: 10, b: 16 };
        ctx.fillStyle = readVar("--surface", root);
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = readVar("--chart-grid", root);
        ctx.lineWidth = 1;
        ctx.font = "16px VT323, monospace";
        ctx.textBaseline = "middle";
        const ih = h - pad.t - pad.b;
        for (let i = 0; i <= 4; i++) {
          const y = Math.round(pad.t + (ih * i) / 4) + 0.5;
          ctx.beginPath();
          ctx.moveTo(pad.l, y);
          ctx.lineTo(w - pad.r, y);
          ctx.stroke();
          ctx.fillStyle = readVar("--chart-speed", root);
          ctx.textAlign = "right";
          ctx.fillText(String(80 - i * 20), pad.l - 6, y);
          ctx.fillStyle = readVar("--chart-hr", root);
          ctx.textAlign = "left";
          ctx.fillText(String(240 - i * 60), w - pad.r + 6, y);
        }
        const pts = series.current;
        const x = (i: number) => pad.l + ((w - pad.l - pad.r) * i) / (CHART_POINTS - 1);
        const line = (color: string, val: (p: ChartPoint) => number, max: number) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          pts.forEach((p, i) => {
            const y = pad.t + ih * (1 - Math.min(1, val(p) / max));
            if (i === 0) ctx.moveTo(x(i), y);
            else ctx.lineTo(x(i), y);
          });
          ctx.stroke();
        };
        line(readVar("--chart-speed", root), (p) => p.speedKmh, 80);
        line(readVar("--chart-hr", root), (p) => p.hr, 240);
        ctx.textAlign = "left";
        ctx.fillStyle = readVar("--muted", root);
        ctx.fillText("km/h", 2, h - 7);
        ctx.textAlign = "right";
        ctx.fillText("bpm", w - 2, h - 7);
        ctx.textAlign = "center";
        ctx.fillText(`${CHART_POINTS} giây gần nhất (thời gian mô phỏng)`, w / 2, h - 7);
      }}
    />
  );
}
