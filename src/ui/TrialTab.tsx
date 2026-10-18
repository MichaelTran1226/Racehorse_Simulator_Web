// Chạy thử 1 ngựa trên 3 mặt sân (SIM-03, SIM-04) + sự cố trên đường chạy (SIM-06) + chặn theo Medical Lock (SIM-07).
import { useRef, useState } from "react";
import { publish } from "../sim/bus";
import {
  createRun,
  INTENSITY_PACE,
  jumpLift,
  stepRun,
  summarize,
  triggerIncident,
  type HorseProfile,
  type Intensity,
  type Obstacle,
  type RunState,
  type RunSummary,
  type Surface,
  type TrackCondition,
} from "../sim/engine";
import { blockReason } from "../sim/horses";
import { incidentPacket, newSessionId, tickPacket, workoutFinishedPacket } from "../sim/packets";
import { drawObstacles, drawRunner, drawTrack, drawWeather } from "../render/scenes";
import type { Sprites } from "../render/sprites";
import { PixelCanvas } from "./PixelCanvas";
import { CHART_POINTS, formatTime, Hud, LiveChart, snapshotOf, type ChartPoint, type HudSnapshot } from "./Telemetry";
import s from "./ui.module.css";
import t from "./Tabs.module.css";
import { CONDITION_LABEL, TrackSetup } from "./TrackSetup";

export const SURFACE_LABEL: Record<Surface, string> = { GRASS: "Cỏ", SAND: "Cát", MIXED: "Hỗn hợp" };
const INTENSITY_LABEL: Record<Intensity, string> = { LIGHT: "Nhẹ", MODERATE: "Vừa", HEAVY: "Nặng" };
export const DISTANCES = [800, 1000, 1200, 1600, 2000];
const SUBSTEP = 0.05;

type Phase = "IDLE" | "RUNNING" | "COOLDOWN" | "DONE" | "ABORTED";

interface Props {
  horse: HorseProfile;
  sprites: Sprites;
  speed: number;
  onIncident: (horseId: string) => void;
}

export function TrialTab({ horse, sprites, speed, onIncident }: Props) {
  const [surface, setSurface] = useState<Surface>("GRASS");
  const [distance, setDistance] = useState(1000);
  const [intensity, setIntensity] = useState<Intensity>("MODERATE");
  const [condition, setCondition] = useState<TrackCondition>("GOOD");
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [phase, setPhase] = useState<Phase>("IDLE");
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [summary, setSummary] = useState<RunSummary | null>(null);

  const runRef = useRef<RunState | null>(null);
  const sessionRef = useRef("");
  const horseRef = useRef(horse);
  horseRef.current = horse;
  const series = useRef<ChartPoint[]>([]);
  const anim = useRef({ phase: 0, tickAcc: 0, hudAcc: 0, finishedSent: false, realT: 0 });

  // Đổi ngựa khi đang chạy → hủy phiên hiện tại để không lẫn dữ liệu.
  const runningHorseId = useRef<string | null>(null);
  if (runningHorseId.current !== null && runningHorseId.current !== horse.id) {
    runningHorseId.current = null;
    runRef.current = null;
    series.current = [];
  }

  const blocked = blockReason(horse);
  const heavyBlocked = blocked !== null && intensity !== "LIGHT";
  const busy = phase === "RUNNING" || phase === "COOLDOWN";

  function start() {
    const seed = (Date.now() & 0x7fffffff) | 0;
    const cfg = { surface, distanceM: distance, pace: INTENSITY_PACE[intensity], condition, obstacles };
    sessionRef.current = newSessionId("WRK");
    publish("sim:workout_command", "IN", {
      event: "sim:workout_command",
      session_id: sessionRef.current,
      horse_id: horse.id,
      action: "START",
      surface,
      target_distance_m: distance,
      intensity,
      track_condition: condition,
      obstacles: obstacles.map((o) => ({ kind: o.kind, at_m: o.atM })),
      source: "LOCAL_OPERATOR",
    });
    runRef.current = createRun(horse, cfg, seed);
    runningHorseId.current = horse.id;
    series.current = [];
    anim.current = { phase: 0, tickAcc: 0, hudAcc: 0, finishedSent: false, realT: 0 };
    setSummary(null);
    setPhase("RUNNING");
    setHud(snapshotOf(runRef.current));
  }

  function stop() {
    runRef.current = null;
    runningHorseId.current = null;
    setPhase("IDLE");
    setHud(null);
  }

  function incident(kind: "FRACTURE" | "LAMENESS") {
    const run = runRef.current;
    if (!run || run.status !== "RUNNING") return;
    triggerIncident(run, kind);
    publish("sim:incident_report", "OUT", incidentPacket(sessionRef.current, horse, kind, "TRACK", run));
    onIncident(horse.id);
    if (kind === "FRACTURE") setPhase("ABORTED");
  }

  function finish(run: RunState) {
    anim.current.finishedSent = true;
    publish("sim:session_finished", "OUT", workoutFinishedPacket(sessionRef.current, horseRef.current, run));
    setSummary(summarize(run));
    setPhase(run.status === "ABORTED_INJURY" ? "ABORTED" : "DONE");
  }

  const onFrame = (ctx: CanvasRenderingContext2D, w: number, h: number, dtReal: number) => {
    const a = anim.current;
    const run = runRef.current;
    a.realT += dtReal;
    if (run && !a.finishedSent) {
      let simDt = dtReal * speed;
      while (simDt > 1e-6) {
        const step = Math.min(SUBSTEP, simDt);
        simDt -= step;
        stepRun(run, horseRef.current, step);
        const cyclesPerSec = run.v < 2.6 ? run.v * 0.55 : run.strideFreqHz;
        a.phase += cyclesPerSec * step;
        a.tickAcc += step;
        if (a.tickAcc >= 1) {
          a.tickAcc -= 1; // 1 gói/giây mô phỏng (CONSTRAINTS: 1.0 Hz ở tốc độ 1×)
          publish("sim:telemetry_tick", "OUT", tickPacket(sessionRef.current, horseRef.current, run, speed));
          series.current = [...series.current, { speedKmh: run.v * 3.6, hr: run.hr }].slice(-CHART_POINTS);
        }
        const injuredStopped = run.status === "ABORTED_INJURY" && run.v < 0.1;
        if (run.status === "FINISHED" || injuredStopped) {
          finish(run);
          break;
        }
      }
      a.hudAcc += dtReal;
      if (a.hudAcc > 0.15) {
        a.hudAcc = 0;
        setHud(snapshotOf(run));
        if (run.status === "COOLDOWN") setPhase((p) => (p === "RUNNING" ? "COOLDOWN" : p));
      }
    }

    // ---- vẽ
    const ppm = w / 42;
    const dist = run?.distance ?? 0;
    const target = run?.targetM ?? distance;
    const cameraM = dist - (w * 0.38) / ppm;
    const railTop = h * 0.4;
    const railBottom = h * 0.93;
    const layout = { cameraM, ppm, railTop, railBottom };
    const baseY = h * 0.86;
    drawTrack(ctx, w, h, run?.surface ?? surface, target, layout);
    drawObstacles(ctx, run?.obstacles ?? obstacles, layout, baseY, h * 0.44, a.realT, run && run.v > 1 ? run.distance : null);
    drawRunner(
      ctx,
      sprites,
      horseRef.current,
      {
        v: run?.v ?? 0,
        status: run?.status ?? "RUNNING",
        incident: run?.incident ?? null,
        phase: a.phase,
        t: run ? run.t : a.realT,
      },
      (dist - cameraM) * ppm,
      baseY - (run ? jumpLift(run) : 0) * h * 0.2,
      h * 0.44,
    );
    drawWeather(ctx, w, h, run?.condition ?? condition, a.realT, railTop, railBottom);
  };

  const cooldownLeft = hud && phase === "COOLDOWN" && runRef.current?.finishTime != null
    ? Math.max(0, 300 - (hud.t - runRef.current.finishTime))
    : null;

  return (
    <div className={t.stack}>
      <section className={s.card}>
        <div className={s.cardHead}>
          <h2 className={s.cardTitle}>
            Chạy thử · <span className={t.horseName}>{horse.name}</span>
          </h2>
          <PhasePill phase={phase} cooldownLeft={cooldownLeft} />
        </div>
        <div className={s.cardBody}>
          <div className={s.row}>
            <div className={s.field}>
              Mặt sân
              <div className={s.segmented} role="group" aria-label="Mặt sân">
                {(Object.keys(SURFACE_LABEL) as Surface[]).map((k) => (
                  <button key={k} type="button" className={s.segment} aria-pressed={surface === k} disabled={busy} onClick={() => setSurface(k)}>
                    {SURFACE_LABEL[k]}
                  </button>
                ))}
              </div>
            </div>
            <div className={s.field}>
              Cự ly
              <div className={s.segmented} role="group" aria-label="Cự ly">
                {DISTANCES.map((d) => (
                  <button key={d} type="button" className={s.segment} aria-pressed={distance === d} disabled={busy} onClick={() => setDistance(d)}>
                    {d}m
                  </button>
                ))}
              </div>
            </div>
            <div className={s.field}>
              Cường độ
              <div className={s.segmented} role="group" aria-label="Cường độ">
                {(Object.keys(INTENSITY_LABEL) as Intensity[]).map((k) => (
                  <button key={k} type="button" className={s.segment} aria-pressed={intensity === k} disabled={busy} onClick={() => setIntensity(k)}>
                    {INTENSITY_LABEL[k]}
                  </button>
                ))}
              </div>
            </div>
            <div className={s.spacer} />
            {busy ? (
              <button type="button" className={s.btn} onClick={stop}>
                Dừng phiên
              </button>
            ) : (
              <button type="button" className={s.primary} onClick={start} disabled={heavyBlocked}>
                » Bắt đầu chạy thử
              </button>
            )}
          </div>
          {blocked && (
            <p className={heavyBlocked ? s.noticeDanger : s.notice}>
              {heavyBlocked
                ? `${blocked}: bài Vừa/Nặng bị chặn vì đang khóa y tế. Chỉ được chạy bài Nhẹ phục hồi theo chỉ định của bác sĩ thú y.`
                : `${blocked}: đang chạy bài Nhẹ phục hồi — cần bác sĩ thú y giám sát.`}
            </p>
          )}
          <TrackSetup
            distance={distance}
            condition={condition}
            obstacles={obstacles}
            disabled={busy}
            onCondition={setCondition}
            onObstacles={setObstacles}
          />
        </div>
        <div className={s.sceneFrame}>
          <PixelCanvas aspect={0.34} onFrame={onFrame} label={`Đường chạy thử mặt sân ${SURFACE_LABEL[surface]}`} />
        </div>
        <div className={`${s.cardBody} ${t.incidentBar}`}>
          <span className={s.hint}>Tạo sự cố trên đường chạy (hệ thống báo cho người quản lý và bác sĩ thú y):</span>
          <button type="button" className={s.danger} disabled={phase !== "RUNNING"} onClick={() => incident("FRACTURE")}>
            !! Gãy xương chân cấp tính
          </button>
          <button type="button" className={`${s.btn}`} disabled={phase !== "RUNNING"} onClick={() => incident("LAMENESS")}>
            ! Khập khiễng
          </button>
        </div>
      </section>

      {hud && (
        <section className={s.card}>
          <div className={s.cardHead}>
            <h3 className={s.cardTitle}>Chỉ số realtime</h3>
            {hud.overload && <span className={s.INJURED}>overload_warning</span>}
          </div>
          <div className={s.cardBody}>
            <Hud snap={hud} horse={horse} />
          </div>
          <div className={s.cardBody}>
            <LiveChart series={series} />
          </div>
        </section>
      )}

      {summary && <ResultCard summary={summary} aborted={phase === "ABORTED"} />}
    </div>
  );
}

function PhasePill({ phase, cooldownLeft }: { phase: Phase; cooldownLeft: number | null }) {
  const text: Record<Phase, string> = {
    IDLE: "Chờ lệnh",
    RUNNING: "Đang chạy",
    COOLDOWN: `Đi bộ hồi phục · còn ${cooldownLeft !== null ? formatTime(cooldownLeft) : ""}`,
    DONE: "Hoàn thành",
    ABORTED: "ABORTED_INJURY",
  };
  const cls = phase === "ABORTED" ? s.INJURED : phase === "DONE" ? s.FIT : phase === "IDLE" ? s.badge : s.WATCH;
  return (
    <div className={t.pillGroup}>
      <span className={cls}>{text[phase]}</span>
    </div>
  );
}

function ResultCard({ summary: r, aborted }: { summary: RunSummary; aborted: boolean }) {
  const rec = r.hrRecovery5m;
  const recovery =
    rec === null ? null : rec <= 85 ? ["Xuất sắc", s.noticeOk] : rec > 110 ? ["Cảnh báo tim mạch", s.noticeDanger] : ["Bình thường", s.notice];
  return (
    <section className={s.card}>
      <div className={s.cardHead}>
        <h3 className={s.cardTitle}>Kết quả buổi chạy</h3>
        <span className={aborted ? s.INJURED : s.FIT}>{aborted ? "Dừng do chấn thương" : "Hoàn thành"}</span>
      </div>
      <div className={s.cardBody}>
        <table className={s.table}>
          <tbody>
            <tr><th>Quãng đường hoàn thành</th><td className={s.num}>{r.distanceCompletedM} m</td><th>Thời gian</th><td className={s.num}>{formatTime(r.durationS)}</td></tr>
            <tr><th>Vận tốc TB / tối đa</th><td className={s.num}>{r.avgSpeedKmh} / {r.topSpeedKmh} km/h</td><th>Nhịp tim TB / đỉnh</th><td className={s.num}>{r.avgHr} / {r.peakHr} bpm</td></tr>
            <tr><th>Sải TB / tần số TB</th><td className={s.num}>{r.avgStrideLenM} m · {r.avgStrideFreqHz} Hz</td><th>Calo tiêu hao</th><td className={s.num}>{r.kcal} kcal</td></tr>
            <tr><th>Thân nhiệt cuối</th><td className={s.num}>{r.finalTempC} °C</td><th>HR sau 5 phút</th><td className={s.num}>{rec ?? "—"} bpm</td></tr>
            <tr><th>Tình trạng sân</th><td className={s.num}>{CONDITION_LABEL[r.condition]}</td><th>Chướng ngại đã vượt</th><td className={s.num}>{r.obstaclesCleared} / {r.obstaclesTotal}</td></tr>
          </tbody>
        </table>
        {recovery && <p className={recovery[1]}>Hồi phục tim mạch: {recovery[0]} (từ 85 bpm trở xuống: xuất sắc · trên 110 bpm: cảnh báo).</p>}
        {aborted && <p className={s.noticeDanger}>Đã báo sự cố. Người quản lý ngựa và bác sĩ thú y đã nhận thông báo; bác sĩ sẽ quyết định có khóa y tế hay không.</p>}
      </div>
    </section>
  );
}
