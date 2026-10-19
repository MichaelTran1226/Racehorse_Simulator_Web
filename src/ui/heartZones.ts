// Thang nhịp tim của thẻ ngựa: 3 vùng có tên để người xem phổ thông đọc được ngay.
import type { HorseProfile } from "../sim/engine.ts";

type HeartRange = Pick<HorseProfile, "hrRest" | "hrAlert" | "hrMax">;

export interface HeartZone {
  key: "REST" | "WORK" | "OVER";
  label: string;
  from: number;
  to: number;
  widthPct: number;
}

export function heartZones(h: HeartRange): readonly HeartZone[] {
  const zone = (key: HeartZone["key"], label: string, from: number, to: number): HeartZone => ({
    key,
    label,
    from,
    to,
    widthPct: ((to - from) / h.hrMax) * 100,
  });
  return [zone("REST", "Nghỉ", 0, h.hrRest), zone("WORK", "Vận động", h.hrRest, h.hrAlert), zone("OVER", "Quá sức", h.hrAlert, h.hrMax)];
}

export const heartHint = (h: HeartRange) => `Khi tập, nhịp tim vượt ${h.hrAlert} là ngựa quá sức.`;
