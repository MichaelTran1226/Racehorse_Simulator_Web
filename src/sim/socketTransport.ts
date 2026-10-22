import { io } from 'socket.io-client';
import { useSyncExternalStore } from 'react';
import { publish, type SimEvent } from './bus.ts';

export type TransportState = 'OFFLINE' | 'CONNECTING' | 'ONLINE';

export interface SocketLike {
  connected: boolean;
  auth: { token?: string };
  volatile?: {
    emit: (event: string, payload: any) => void;
  };
  on: (event: string, fn: (...args: any[]) => void) => any;
  off: (event: string, fn?: (...args: any[]) => void) => any;
  emit: (event: string, payload: any, ack?: (res: any) => void) => any;
  disconnect: () => any;
}

export type SocketFactory = (url: string, opts: any) => SocketLike;

let currentSocket: SocketLike | null = null;
let transportState: TransportState = 'OFFLINE';
let lastError: string | null = null;
const stateListeners = new Set<() => void>();

function notifyState(): void {
  stateListeners.forEach((l) => l());
}

export function getTransportState(): TransportState {
  return transportState;
}

export function getLastError(): string | null {
  return lastError;
}

export function subscribeTransportState(listener: () => void): () => void {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

export function useTransportState(): TransportState {
  return useSyncExternalStore(subscribeTransportState, getTransportState);
}

export function connectSimulatorTransport(
  token: string,
  options?: {
    url?: string;
    socketFactory?: SocketFactory;
  },
): void {
  if (currentSocket) {
    disconnectSimulatorTransport();
  }

  transportState = 'CONNECTING';
  lastError = null;
  notifyState();

  const baseUrl = options?.url || (typeof window !== 'undefined' && (import.meta as any).env?.VITE_SOCKET_URL) || 'http://localhost:3000/simulator';
  const factory = options?.socketFactory || ((url: string, opts: any) => io(url, opts) as unknown as SocketLike);

  const socket = factory(baseUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  currentSocket = socket;

  socket.on('connect', () => {
    transportState = 'ONLINE';
    lastError = null;
    notifyState();
  });

  socket.on('disconnect', () => {
    transportState = 'OFFLINE';
    notifyState();
  });

  socket.on('connect_error', (err: any) => {
    transportState = 'OFFLINE';
    lastError = err?.message || 'Connection error';
    notifyState();
  });

  // Inbound broadcast from server: sys:medical_lock_sync
  socket.on('sys:medical_lock_sync', (payload: any) => {
    publish('sys:medical_lock_sync', 'IN', payload);
  });
}

export function disconnectSimulatorTransport(): void {
  if (currentSocket) {
    try {
      currentSocket.off('connect');
      currentSocket.off('disconnect');
      currentSocket.off('connect_error');
      currentSocket.off('sys:medical_lock_sync');
      currentSocket.disconnect();
    } catch {
      // ignore teardown errors
    }
    currentSocket = null;
  }
  transportState = 'OFFLINE';
  notifyState();
}

/**
 * Forwards an OUT event to the active Socket.IO transport.
 * Volatile events (telemetry, progress) are dropped if disconnected.
 * Critical events (incident, finished) use reliable acks and track error states.
 */
export function handleBusPublish(event: SimEvent, payload: Record<string, unknown>): void {
  if (!currentSocket || !currentSocket.connected) {
    if (event === 'sim:incident_report' || event === 'sim:session_finished') {
      lastError = `Cannot send ${event}: socket is offline`;
      notifyState();
    }
    return;
  }

  if (event === 'sim:telemetry_tick' || event === 'sim:race_progress') {
    if (currentSocket.volatile?.emit) {
      currentSocket.volatile.emit(event, payload);
    } else {
      currentSocket.emit(event, payload);
    }
    return;
  }

  if (event === 'sim:incident_report' || event === 'sim:session_finished') {
    currentSocket.emit(event, payload, (ack: any) => {
      if (ack && ack.accepted === false) {
        lastError = `Server rejected ${event}: ${ack.code || 'UNKNOWN_ERROR'}`;
        notifyState();
      }
    });
    return;
  }

  // Any other OUT event (e.g. sim:workout_command, sim:device_status)
  currentSocket.emit(event, payload);
}
