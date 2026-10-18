// Phòng khám (bảng nổi trên bản đồ): cảnh báo sự cố + ngựa xếp theo mức khẩn, chạm để mở thẻ ngựa.
// Khám, chẩn đoán, kê đơn làm trên Main Web (M5 đã bị loại khỏi Simulator theo kết quả duyệt).
import { useLog } from "../sim/bus";
import type { HorseProfile } from "../sim/engine";
import { HEALTH_LABEL } from "../sim/horses";
import { drawFrame, type Sprites } from "../render/sprites";
import { PixelCanvas } from "./PixelCanvas";
import c from "./VetZone.module.css";
import s from "./ui.module.css";

interface Props {
  horses: HorseProfile[];
  sprites: Sprites;
  reported: Set<string>;
  onToggleLock: (id: string) => void;
  onOpenCard: (id: string) => void;
}

interface IncidentPayload {
  horse?: { horse_id?: string };
  incident?: { label?: string; location?: string };
  notify?: { veterinarian_scope?: string };
}

const SCOPE_LABEL: Record<string, string> = {
  ALL_HORSES_ON_TRACK: "mọi ngựa trên đường đua",
  ALL_HORSES_IN_STALLS: "mọi ngựa trong khu chuồng",
};

/** 0 = khẩn nhất: đã báo sự cố → đang khóa y tế → chấn thương/cách ly → cần theo dõi → khỏe. */
function urgency(h: HorseProfile, reported: Set<string>): number {
  if (reported.has(h.id)) return 0;
  if (h.medicalLock) return 1;
  if (h.health === "INJURED" || h.health === "ISOLATED") return 2;
  return h.health === "WATCH" ? 3 : 4;
}

export function VetZone({ horses, sprites, reported, onToggleLock, onOpenCard }: Props) {
  const ranked = horses.map((h) => ({ h, u: urgency(h, reported) })).sort((a, b) => a.u - b.u);
  const incidents = useLog().filter((e) => e.event === "sim:incident_report");
  const byId = new Map(horses.map((h) => [h.id, h]));

  return (
    <div className={c.stack}>
      <section className={s.card}>
        <div className={c.banner}>
          <PixelCanvas
            aspect={0.22}
            label="Bác sĩ thú y đi kiểm tra chuồng"
            onFrame={(ctx, w, h) => {
              const t = performance.now() / 1000;
              ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--parchment-2");
              ctx.fillRect(0, 0, w, h);
              // vạch gạch nền phòng khám
              ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--parchment-3");
              for (let x = 0; x < w; x += 24) ctx.fillRect(x, h * 0.82, 12, 4);
              // VET đi tới giữa rồi nghe tim, rồi đi tiếp (chu kỳ 10 s)
              const cyc = t % 10;
              const walking = cyc < 4 || cyc > 7;
              const x = cyc < 4 ? (cyc / 4) * w * 0.5 : cyc > 7 ? w * 0.5 + ((cyc - 7) / 3) * w * 0.6 : w * 0.5;
              drawFrame(ctx, sprites.people, sprites.people.canvas, walking ? Math.floor(t * 6) % 4 : 5, 2, x, h * 0.86, h * 0.95);
              // ngựa đứng chờ khám
              drawFrame(ctx, sprites.horse, sprites.horse.canvas, Math.floor(t * 3) % 6, 0, w * 0.68, h * 0.9, h * 1.05);
              if (!walking) drawFrame(ctx, sprites.fx, sprites.fx.canvas, 4 + (Math.floor(t * 3) % 2), 4, w * 0.6, h * 0.35, h * 0.4);
            }}
          />
        </div>
        <div className={s.cardBody}>
          <p className={s.hint}>
            Bác sĩ thú y nhận cảnh báo của mọi ngựa trong khu có sự cố. Khi cần, bác sĩ khóa y tế để ngựa
            nghỉ đua và tập nặng tới khi hồi phục.
          </p>
        </div>
      </section>

      <section className={s.card}>
        <div className={s.cardHead}>
          <h3 className={s.cardTitle}>Cảnh báo sự cố</h3>
          <span className={incidents.length ? s.INJURED : s.badge}>{incidents.length} cảnh báo</span>
        </div>
        <div className={s.cardBody}>
          {incidents.length === 0 ? (
            <p className={s.hint}>Chưa có sự cố. Thử “Gãy xương chân” khi chạy thử hoặc “Đau bụng” tại chuồng.</p>
          ) : (
            <ul className={c.feed}>
              {incidents.slice(0, 12).map((e) => {
                const p = e.payload as IncidentPayload;
                const h = byId.get(p.horse?.horse_id ?? "");
                return (
                  <li key={e.id} className={c.alert}>
                    <span className={c.alertIcon} aria-hidden>
                      !
                    </span>
                    <div>
                      <div className={c.alertTitle}>
                        {p.incident?.label} · {h?.name ?? p.horse?.horse_id}
                      </div>
                      <div className={s.hint}>
                        {new Date(e.at).toLocaleTimeString("vi-VN", { hour12: false })} · {p.incident?.location === "TRACK" ? "Đường đua" : "Khu chuồng"} · đã báo bác sĩ thú y
                        nhận cho {SCOPE_LABEL[p.notify?.veterinarian_scope ?? ""] ?? "khu vực"}
                      </div>
                    </div>
                    {h && (
                      <button type="button" className={h.medicalLock ? `${s.btn} ${s.small}` : `${s.danger} ${s.small}`} onClick={() => onToggleLock(h.id)}>
                        {h.medicalLock ? "Gỡ khóa" : "Khóa"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className={s.card}>
        <div className={s.cardHead}>
          <h3 className={s.cardTitle}>Sức khỏe đàn ngựa</h3>
        </div>
        <ul className={c.herd}>
          {ranked.map(({ h, u }) => (
            <li key={h.id}>
              <button type="button" className={c.tile} data-urgency={u} onClick={() => onOpenCard(h.id)}>
                <span className={c.tileName}>{h.name}</span>
                <span className={c.tileMeta}>
                  Ô {String.fromCharCode(65 + h.stall.row)}
                  {h.stall.col + 1}
                </span>
                <span className={c.tileTags}>
                  <span className={s[h.health]}>{HEALTH_LABEL[h.health]}</span>
                  {h.medicalLock && <span className={s.lock}>Khóa y tế</span>}
                  {reported.has(h.id) && <span className={c.flag}>! Sự cố</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
