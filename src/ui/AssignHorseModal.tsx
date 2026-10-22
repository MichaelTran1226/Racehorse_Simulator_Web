import { useState } from "react";
import type { HorseProfile, Coat } from "../sim/engine";
import { canAssignHorseToStall, getUnassignedHorses } from "../sim/stallAllocation";
import type { MockStall } from "../sim/mockData";
import { HEALTH_LABEL, LIFECYCLE_LABEL } from "../sim/horses";
import m from "./AssignHorseModal.module.css";

interface Props {
  stall: MockStall;
  horses: HorseProfile[];
  stalls: MockStall[];
  onAssign: (stallCode: string, horse: HorseProfile) => void;
  onClose: () => void;
}

const COAT_COLOR: Record<Coat, string> = {
  BAY: "#8B4513",
  CHESTNUT: "#B85D3B",
  BLACK: "#262626",
  GRAY: "#B0BEC5",
  ROAN: "#8D6E63",
};

export function AssignHorseModal({ stall, horses, stalls, onAssign, onClose }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [pendingWarningHorse, setPendingWarningHorse] = useState<{ horse: HorseProfile; warning: string } | null>(null);

  const unassignedHorses = getUnassignedHorses(horses, stalls);
  const displayHorses = showAll ? horses : unassignedHorses;

  const handleSelectHorse = (horse: HorseProfile) => {
    const check = canAssignHorseToStall(stall, horse);
    if (!check.allowed) {
      alert(check.reason ?? "Không thể gán ngựa này vào ô chuồng đã chọn.");
      return;
    }

    if (check.warning) {
      setPendingWarningHorse({ horse, warning: check.warning });
      return;
    }

    onAssign(stall.code, horse);
    onClose();
  };

  const confirmWarningAssignment = () => {
    if (pendingWarningHorse) {
      onAssign(stall.code, pendingWarningHorse.horse);
      onClose();
    }
  };

  return (
    <div className={m.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={m.modal} onClick={(e) => e.stopPropagation()}>
        <div className={m.header}>
          <h3 className={m.title}>
            Gán Ngựa Vào Ô Chuồng {stall.code}
          </h3>
          <button type="button" className={m.closeBtn} onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        <div className={m.subHeader}>
          <span>
            {stall.zoneCode === "ZONE-A"
              ? "🚩 Khu A · Chuồng Đua"
              : stall.zoneCode === "ZONE-B"
              ? "🏇 Khu B · Chuồng Tập"
              : "🏥 Khu C · Cách Ly Thú Y"}
          </span>
          <div className={m.filterTabs}>
            <button
              type="button"
              className={`${m.filterTabBtn} ${!showAll ? m.filterTabActive : ""}`}
              onClick={() => setShowAll(false)}
            >
              Chưa có chuồng ({unassignedHorses.length})
            </button>
            <button
              type="button"
              className={`${m.filterTabBtn} ${showAll ? m.filterTabActive : ""}`}
              onClick={() => setShowAll(true)}
            >
              Tất cả ({horses.length})
            </button>
          </div>
        </div>

        {pendingWarningHorse && (
          <div className={m.warningBanner}>
            <div>{pendingWarningHorse.warning}</div>
            <div style={{ marginTop: "8px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className={m.filterTabBtn}
                onClick={() => setPendingWarningHorse(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className={m.actionBtn}
                style={{ background: "#d32f2f", color: "#ffffff" }}
                onClick={confirmWarningAssignment}
              >
                Tôi hiểu, vẫn gán
              </button>
            </div>
          </div>
        )}

        <div className={m.horseList}>
          {displayHorses.length === 0 ? (
            <div className={m.emptyState}>
              <p>Hiện không có ngựa nào khả dụng để gán vào ô này.</p>
              {!showAll && (
                <button
                  type="button"
                  className={m.actionBtn}
                  style={{ marginTop: "8px" }}
                  onClick={() => setShowAll(true)}
                >
                  Xem danh sách tất cả ngựa
                </button>
              )}
            </div>
          ) : (
            displayHorses.map((h) => {
              const currentStall = stalls.find((s) => s.status === "OCCUPIED" && (s.horseId === h.id || s.horseName?.toLowerCase() === h.name.toLowerCase()));
              const isCurrentStall = currentStall?.code === stall.code;

              return (
                <div key={h.id} className={m.horseRow}>
                  <div className={m.horseInfo}>
                    <span
                      className={m.coatDot}
                      style={{ backgroundColor: COAT_COLOR[h.coat] }}
                      title={`Lông: ${h.coat}`}
                    />
                    <div className={m.horseMeta}>
                      <div className={m.horseNameRow}>
                        <span className={m.horseName}>{h.name}</span>
                        <span style={{ fontSize: "11px", color: "#777" }}>({h.code})</span>
                        {h.medicalLock && <span className={m.lockBadge}>🔒 Khóa y tế</span>}
                      </div>
                      <div className={m.horseSub}>
                        <span>{HEALTH_LABEL[h.health]}</span> ·
                        <span>{LIFECYCLE_LABEL[h.lifecycle]}</span>
                        {currentStall ? (
                          <span style={{ color: "#d97706" }}> · Đang ở ô {currentStall.code}</span>
                        ) : (
                          <span style={{ color: "#2e7d32" }}> · Đang ở Bãi thả</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isCurrentStall ? (
                      <span style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic" }}>
                        Đang ở ô này
                      </span>
                    ) : (
                      <button
                        type="button"
                        className={m.actionBtn}
                        onClick={() => handleSelectHorse(h)}
                      >
                        + Gán vào ô {stall.code}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
