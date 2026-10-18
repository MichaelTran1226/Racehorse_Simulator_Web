// Bus sự kiện cục bộ mang đúng tên sự kiện SRS §8. Giai đoạn nối dữ liệu chỉ cần thay `publish`
// bằng socket.emit / socket.on (Socket.IO) — giao diện không phải sửa.
import { useSyncExternalStore } from "react";

export type SimEvent =
  | "sim:device_status"
  | "sim:workout_command"
  | "sim:telemetry_tick"
  | "sim:incident_report"
  | "sys:medical_lock_sync"
  | "sim:race_progress"
  | "sim:session_finished";

export interface LogEntry {
  id: number;
  at: number;
  event: SimEvent;
  /** OUT = Simulator → Main Web, IN = Main Web → Simulator. */
  direction: "OUT" | "IN";
  payload: Record<string, unknown>;
}

const MAX = 200;
let entries: LogEntry[] = [];
let seq = 0;
const listeners = new Set<() => void>();

export function publish(event: SimEvent, direction: LogEntry["direction"], payload: Record<string, unknown>): void {
  entries = [{ id: ++seq, at: Date.now(), event, direction, payload }, ...entries].slice(0, MAX);
  listeners.forEach((l) => l());
}

export function clearLog(): void {
  entries = [];
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useLog(): LogEntry[] {
  return useSyncExternalStore(subscribe, () => entries);
}
