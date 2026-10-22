// Phân khu chuồng ngựa A, B, C chuẩn hóa theo CSDL EquiFlow (SRS SC-1.07 & RULE-MED-01)
// Tối giản hóa giao diện: Canvas sơ đồ chuồng 2D làm trọng tâm, hỗ trợ gán / rút ngựa tương tác tức thì.
import { useRef, useState } from "react";
import { publish } from "../sim/bus";
import { stepRest, type HorseProfile } from "../sim/engine";
import { LIFECYCLE_LABEL } from "../sim/horses";
import { INCIDENT_LABEL, incidentPacket, horseRef } from "../sim/packets";
import { drawZoneStalls, HEALTH_COLOR, stallActivity } from "../render/scenes";
import type { Sprites } from "../render/sprites";
import { MOCK_STALL_ZONES, type MockStallZone, type MockStall } from "../sim/mockData";
import { initStalls, assignHorseToStall, unassignHorseFromStall } from "../sim/stallAllocation";
import { AssignHorseModal } from "./AssignHorseModal";
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
  /** Danh sách ô chuồng được truyền từ ngoài hoặc tự quản lý nội bộ */
  stalls?: MockStall[];
  onStallsChange?: (stalls: MockStall[]) => void;
}

const ACTIVITY_LABEL = { IDLE: "Đứng thở", GRAZE: "Ăn cỏ / ngũ cốc", LIE: "Nằm nghỉ" } as const;

export function StallTab({
  horses,
  sprites,
  speed,
  selectedId,
  onSelect,
  onIncident,
  onOpenCard,
  stalls: externalStalls,
  onStallsChange,
}: Props) {
  const [internalStalls, setInternalStalls] = useState<MockStall[]>(() => initStalls());
  const allStalls = externalStalls ?? internalStalls;

  const vitals = useRef(new Map<string, Vitals>());
  const loop = useRef({ simT: 0, realT: 0, snapAcc: 0, uiAcc: 0 });
  const [, force] = useState(0);

  const [activeZoneCode, setActiveZoneCode] = useState<"ZONE-A" | "ZONE-B" | "ZONE-C">("ZONE-A");
  const [selectedStallCode, setSelectedStallCode] = useState<string>("A-01");
  const [assigningStall, setAssigningStall] = useState<MockStall | null>(null);

  const horsesRef = useRef(horses);
  horsesRef.current = horses;

  for (const h of horses) {
    if (!vitals.current.has(h.id)) {
      vitals.current.set(h.id, { hr: h.hrRest + 4, stamina: 72 + (h.weightKg % 25), tempC: 37.9, rng: h.weightKg * 977 });
    }
  }

  const currentZone = MOCK_STALL_ZONES.find((z) => z.code === activeZoneCode) ?? MOCK_STALL_ZONES[0];
  const zoneStalls = allStalls.filter((st) => st.zoneCode === activeZoneCode);

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

    drawZoneStalls(ctx, w, h, sprites, currentZone, zoneStalls, horsesRef.current, vitals.current, selectedStallCode, L.realT);
  };

  // Tìm ô chuồng được chọn và ngựa trong ô (nếu có)
  const currentStall = zoneStalls.find((st) => st.code === selectedStallCode) ?? zoneStalls[0];
  const selectedHorse =
    (currentStall?.horseId
      ? horses.find((h) => h.id === currentStall.horseId) ?? horses.find((h) => currentStall.horseName && h.name.toLowerCase().includes(currentStall.horseName.toLowerCase()))
      : null) ?? (selectedId ? horses.find((h) => h.id === selectedId) ?? null : null);
  const sv = selectedHorse ? vitals.current.get(selectedHorse.id) : undefined;

  function report(kind: "COLIC" | "FEVER") {
    if (!selectedHorse) return;
    publish("sim:incident_report", "OUT", incidentPacket(null, selectedHorse, kind, "STALL"));
    onIncident(selectedHorse.id);
  }

  function handleSelectZone(zone: MockStallZone) {
    setActiveZoneCode(zone.code);
    const firstStall = allStalls.filter((st) => st.zoneCode === zone.code)[0];
    if (firstStall) {
      setSelectedStallCode(firstStall.code);
      if (firstStall.horseId) {
        onSelect(firstStall.horseId);
      }
    }
  }

  const updateStalls = (next: MockStall[]) => {
    if (onStallsChange) {
      onStallsChange(next);
    } else {
      setInternalStalls(next);
    }
  };

  const handleAssignHorse = (stallCode: string, horse: HorseProfile) => {
    try {
      const updated = assignHorseToStall(allStalls, stallCode, horse);
      updateStalls(updated);
      setSelectedStallCode(stallCode);
      onSelect(horse.id);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleUnassignHorse = (stallCode: string) => {
    const updated = unassignHorseFromStall(allStalls, stallCode);
    updateStalls(updated);
  };

  // Thống kê nhanh từng khu
  const occupiedCount = zoneStalls.filter((st) => st.status === "OCCUPIED").length;
  const availableCount = zoneStalls.filter((st) => st.status === "AVAILABLE").length;
  const maintenanceCount = zoneStalls.filter((st) => st.status === "MAINTENANCE").length;
  const inactiveCount = zoneStalls.filter((st) => st.status === "INACTIVE").length;

  return (
    <div className={t.stack}>
      {/* 1. Thanh chuyển đổi Phân khu Chuồng A, B, C */}
      <div className={t.pillGroup} style={{ flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {MOCK_STALL_ZONES.map((z) => {
            const isActive = z.code === activeZoneCode;
            return (
              <button
                key={z.code}
                type="button"
                className={`${s.btn} ${isActive ? s.primary : ""}`}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "15px",
                  padding: "4px 12px",
                }}
                onClick={() => handleSelectZone(z)}
              >
                {z.code === "ZONE-A" ? "🚩 Khu A · Đua (8)" : z.code === "ZONE-B" ? "🏇 Khu B · Tập (8)" : "🏥 Khu C · Cách ly (4)"}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "8px", fontSize: "13px", alignItems: "center" }}>
          <span>Ở: <strong>{occupiedCount}</strong></span> ·
          <span>Trống: <strong>{availableCount}</strong></span>
          {maintenanceCount > 0 && <span> · <strong style={{ color: "#d97706" }}>Bảo trì: {maintenanceCount}</strong></span>}
          {inactiveCount > 0 && <span> · <strong style={{ color: "#78909c" }}>Ngừng: {inactiveCount}</strong></span>}
        </div>
      </div>

      {/* 2. Lưới ô chuồng Canvas 2D */}
      <section className={s.card} style={{ padding: "8px" }}>
        <div className={s.sceneFrame}>
          <PixelCanvas
            aspect={activeZoneCode === "ZONE-C" ? 0.32 : 0.54}
            onFrame={onFrame}
            label={`Sơ đồ ${currentZone.name} gồm ${currentZone.rows} hàng nhân ${currentZone.cols} cột`}
            onPointer={(x, y, w, h) => {
              const col = Math.floor((x / w) * currentZone.cols);
              const row = Math.floor((y / h) * currentZone.rows);
              const hit = zoneStalls.find((st) => st.col === col && st.row === row);
              if (hit) {
                setSelectedStallCode(hit.code);
                if (hit.horseId) {
                  onSelect(hit.horseId);
                }
              }
            }}
          />
        </div>
      </section>

      {/* 3. Khối chi tiết ô chuồng được chọn (Tối giản & Động) */}
      {currentStall && (
        <section className={s.card} style={{ padding: "12px" }}>
          <div className={s.cardHead} style={{ paddingBottom: "8px" }}>
            <h3 className={s.cardTitle} style={{ margin: 0, fontSize: "16px" }}>
              Ô Chuồng <span style={{ color: "#ffe082" }}>{currentStall.code}</span> ·{" "}
              {currentStall.status === "MAINTENANCE" ? (
                <span style={{ color: "#ffa726" }}>Đang Bảo Trì</span>
              ) : currentStall.status === "INACTIVE" ? (
                <span style={{ color: "#b0bec5" }}>Ngừng Sử Dụng</span>
              ) : selectedHorse ? (
                <span className={t.horseName}>{selectedHorse.name}</span>
              ) : (
                <span style={{ color: "#81c784" }}>Ô Chuồng Trống</span>
              )}
            </h3>

            {selectedHorse && (
              <span className={t.stallInfo}>
                <span className={s.badge} style={{ color: HEALTH_COLOR[selectedHorse.health] }}>
                  {LIFECYCLE_LABEL[selectedHorse.lifecycle]}
                </span>
                <span className={s.hint}>{ACTIVITY_LABEL[stallActivity(selectedHorse, loop.current.realT)]}</span>
              </span>
            )}
          </div>

          <div style={{ marginTop: "8px" }}>
            {selectedHorse && sv ? (
              <>
                <div style={{ marginBottom: "8px", display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "13px" }}>
                  <span>Groom: <strong>{currentStall.assignedGroomName ?? "Đang phân công"}</strong></span>
                  {selectedHorse.medicalLock && (
                    <span style={{ color: "#ff5252", fontWeight: 700 }}>
                      🔒 Khóa y tế RULE-MED-01: Cấm chạy nặng!
                    </span>
                  )}
                </div>

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

                <div className={t.incidentBar} style={{ padding: "8px 0 0", marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button type="button" className={`${s.btn} ${s.primary}`} onClick={() => onOpenCard(selectedHorse.id)}>
                    Xem thẻ ngựa
                  </button>
                  <button
                    type="button"
                    className={s.btn}
                    style={{ background: "#f5ebd7", borderColor: "#8c7355" }}
                    onClick={() => handleUnassignHorse(currentStall.code)}
                    title="Đưa ngựa ra bãi thả, giải phóng ô chuồng"
                  >
                    Rút ngựa khỏi chuồng
                  </button>
                  <button type="button" className={s.danger} onClick={() => report("COLIC")}>
                    {INCIDENT_LABEL.COLIC}
                  </button>
                  <button type="button" className={s.btn} onClick={() => report("FEVER")}>
                    {INCIDENT_LABEL.FEVER}
                  </button>
                </div>
              </>
            ) : currentStall.status === "AVAILABLE" ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", padding: "6px 0" }}>
                <span style={{ color: "var(--muted)", fontSize: "14px" }}>
                  Ô chuồng trống sạch sẽ, sẵn sàng đón cá thể mới.
                </span>
                <button
                  type="button"
                  className={`${s.btn} ${s.primary}`}
                  style={{ padding: "6px 14px", fontWeight: 700 }}
                  onClick={() => setAssigningStall(currentStall)}
                >
                  + Gán ngựa vào ô này
                </button>
              </div>
            ) : currentStall.status === "MAINTENANCE" ? (
              <div style={{ padding: "6px 0", color: "#d97706", fontSize: "14px" }}>
                ⚒ {currentStall.notes ?? "Đang bảo trì định kỳ thay đệm lót và van nước."}
              </div>
            ) : (
              <div style={{ padding: "6px 0", color: "#78909c", fontSize: "14px" }}>
                ⊘ {currentStall.notes ?? "Ngừng sử dụng tạm thời."}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Modal Chọn & Gán Ngựa */}
      {assigningStall && (
        <AssignHorseModal
          stall={assigningStall}
          horses={horses}
          stalls={allStalls}
          onAssign={handleAssignHorse}
          onClose={() => setAssigningStall(null)}
        />
      )}
    </div>
  );
}
