// Bus sự kiện cục bộ mang đúng tên sự kiện SRS §8. Giai đoạn nối dữ liệu chỉ cần thay `publish`
// bằng socket.emit / socket.on (Socket.IO) — giao diện không phải sửa.
import { useSyncExternalStore } from "react";
import { handleBusPublish } from "./socketTransport.ts";

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
export type BusListener = (entry: LogEntry) => void;
const busSubscribers = new Set<BusListener>();

export function onBusEvent(listener: BusListener): () => void {
  busSubscribers.add(listener);
  return () => busSubscribers.delete(listener);
}

export function publish(event: SimEvent, direction: LogEntry["direction"], payload: Record<string, unknown>): void {
  const entry: LogEntry = { id: ++seq, at: Date.now(), event, direction, payload };
  entries = [entry, ...entries].slice(0, MAX);
  listeners.forEach((l) => l());
  busSubscribers.forEach((l) => l(entry));
  if (direction === "OUT") {
    handleBusPublish(event, payload);
  }
}

export function clearLog(): void {
  entries = [];
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getLog(): LogEntry[] {
  return entries;
}

export function useLog(): LogEntry[] {
  return useSyncExternalStore(subscribe, getLog);
}
