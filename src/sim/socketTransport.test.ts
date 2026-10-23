import test from 'node:test';
import assert from 'node:assert/strict';
import {
  connectSimulatorTransport,
  disconnectSimulatorTransport,
  getTransportState,
  subscribeTransportState,
  type SocketLike,
  type SocketFactory,
} from './socketTransport.ts';
import { publish, getLog, clearLog } from './bus.ts';

class FakeSocket implements SocketLike {
  connected = false;
  auth: { token?: string } = {};
  emitted: { event: string; payload: any; ack?: (res: any) => void; volatile?: boolean }[] = [];
  listeners: Record<string, ((...args: any[]) => void)[]> = {};

  volatile = {
    emit: (event: string, payload: any) => {
      this.emitted.push({ event, payload, volatile: true });
    },
  };

  on(event: string, fn: (...args: any[]) => void) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(fn);
    return this;
  }

  off(event: string, fn?: (...args: any[]) => void) {
    if (!fn) {
      delete this.listeners[event];
    } else if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((f) => f !== fn);
    }
    return this;
  }

  emit(event: string, payload: any, ack?: (res: any) => void) {
    this.emitted.push({ event, payload, ack, volatile: false });
    return this;
  }

  disconnect() {
    this.connected = false;
    this.trigger('disconnect');
    return this;
  }

  trigger(event: string, ...args: any[]) {
    this.listeners[event]?.slice().forEach((fn) => fn(...args));
  }
}

test('socketTransport: connection status lifecycle is observable', () => {
  let fakeSocket: FakeSocket | null = null;
  const states: string[] = [];

  const factory: SocketFactory = (_url, opts) => {
    fakeSocket = new FakeSocket();
    fakeSocket.auth = opts.auth;
    return fakeSocket;
  };

  const unsub = subscribeTransportState(() => {
    states.push(getTransportState());
  });

  disconnectSimulatorTransport();
  states.length = 0;

  connectSimulatorTransport('mock-jwt-token', { socketFactory: factory });
  assert.equal(getTransportState(), 'CONNECTING');

  fakeSocket!.connected = true;
  fakeSocket!.trigger('connect');
  assert.equal(getTransportState(), 'ONLINE');

  fakeSocket!.connected = false;
  fakeSocket!.trigger('disconnect');
  assert.equal(getTransportState(), 'OFFLINE');

  unsub();
  disconnectSimulatorTransport();
});

test('socketTransport: OUT packets emit to socket once, IN packets never echo', () => {
  let fakeSocket: FakeSocket | null = null;
  const factory: SocketFactory = () => {
    fakeSocket = new FakeSocket();
    return fakeSocket;
  };

  connectSimulatorTransport('mock-jwt-token', { socketFactory: factory });
  fakeSocket!.connected = true;
  fakeSocket!.trigger('connect');
  fakeSocket!.emitted.length = 0;

  // Publish OUT packet via bus
  publish('sim:workout_command', 'OUT', { command: 'START' });
  assert.equal(fakeSocket!.emitted.length, 1);
  assert.equal(fakeSocket!.emitted[0].event, 'sim:workout_command');

  // Publish IN packet via bus (e.g. from local simulation or incoming socket)
  publish('sim:workout_command', 'IN', { command: 'START' });
  // Should NOT echo out to socket
  assert.equal(fakeSocket!.emitted.length, 1);

  disconnectSimulatorTransport();
});

test('socketTransport: inbound sys:medical_lock_sync from socket reaches local bus as IN', () => {
  let fakeSocket: FakeSocket | null = null;
  const factory: SocketFactory = () => {
    fakeSocket = new FakeSocket();
    return fakeSocket;
  };

  clearLog();
  connectSimulatorTransport('mock-jwt-token', { socketFactory: factory });
  fakeSocket!.connected = true;
  fakeSocket!.trigger('connect');

  // Simulate socket receiving sys:medical_lock_sync from BE
  fakeSocket!.trigger('sys:medical_lock_sync', {
    event: 'sys:medical_lock_sync',
    horse_id: 'test-horse-123',
    medical_lock: true,
  });

  const entries = getLog();
  const lockEntry = entries.find((e) => e.event === 'sys:medical_lock_sync');
  assert.ok(lockEntry, 'entry must be found in bus log');
  assert.equal(lockEntry.direction, 'IN');
  assert.equal((lockEntry.payload as any).horse_id, 'test-horse-123');
  assert.equal((lockEntry.payload as any).medical_lock, true);

  disconnectSimulatorTransport();
});

test('socketTransport: incident and finished packets require ack while telemetry is volatile', () => {
  let fakeSocket: FakeSocket | null = null;
  const factory: SocketFactory = () => {
    fakeSocket = new FakeSocket();
    return fakeSocket;
  };

  connectSimulatorTransport('mock-jwt-token', { socketFactory: factory });
  fakeSocket!.connected = true;
  fakeSocket!.trigger('connect');
  fakeSocket!.emitted.length = 0;

  // Telemetry tick uses volatile emit
  publish('sim:telemetry_tick', 'OUT', { tick: 1 });
  assert.equal(fakeSocket!.emitted.length, 1);
  assert.equal(fakeSocket!.emitted[0].volatile, true);

  // Incident report uses regular emit with ack callback
  publish('sim:incident_report', 'OUT', { packet_id: 'p-1', incident: 'COLIC' });
  assert.equal(fakeSocket!.emitted.length, 2);
  assert.equal(fakeSocket!.emitted[1].volatile, false);
  assert.ok(typeof fakeSocket!.emitted[1].ack === 'function');

  // Session finished uses regular emit with ack callback
  publish('sim:session_finished', 'OUT', { packet_id: 'p-2', status: 'COMPLETED' });
  assert.equal(fakeSocket!.emitted.length, 3);
  assert.equal(fakeSocket!.emitted[2].volatile, false);
  assert.ok(typeof fakeSocket!.emitted[2].ack === 'function');

  disconnectSimulatorTransport();
});

test('socketTransport: disconnect disposes socket and listeners', () => {
  let fakeSocket: FakeSocket | null = null;
  const factory: SocketFactory = () => {
    fakeSocket = new FakeSocket();
    return fakeSocket;
  };

  connectSimulatorTransport('mock-jwt-token', { socketFactory: factory });
  assert.ok(fakeSocket);
  const s = fakeSocket as FakeSocket;
  assert.ok(s.listeners['connect']?.length);

  disconnectSimulatorTransport();
  assert.equal(getTransportState(), 'OFFLINE');
  assert.equal(s.connected, false);
});
