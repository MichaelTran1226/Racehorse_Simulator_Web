import assert from "node:assert/strict";
import { test } from "node:test";
import { MOCK_STALL_ZONES, MOCK_USERS, MOCK_STALLS, getStallsByZone, type Role, type UserStatus } from "./mockData.ts";

test("mock stall zones contain Zone A, B, and C with matching grid dimensions", () => {
  assert.equal(MOCK_STALL_ZONES.length, 3);
  const [za, zb, zc] = MOCK_STALL_ZONES;

  assert.equal(za.code, "ZONE-A");
  assert.equal(za.rows * za.cols, 8);

  assert.equal(zb.code, "ZONE-B");
  assert.equal(zb.rows * zb.cols, 8);

  assert.equal(zc.code, "ZONE-C");
  assert.equal(zc.rows * zc.cols, 4);
});

test("mock stalls cover 20 stalls in total and contain special status cases", () => {
  assert.equal(MOCK_STALLS.length, 20);

  const zoneAStalls = getStallsByZone("ZONE-A");
  assert.equal(zoneAStalls.length, 8);

  const zoneBStalls = getStallsByZone("ZONE-B");
  assert.equal(zoneBStalls.length, 8);
  const maintenanceStall = zoneBStalls.find((s) => s.status === "MAINTENANCE");
  assert.ok(maintenanceStall, "Zone B must contain a MAINTENANCE stall");
  assert.equal(maintenanceStall.code, "B-08");

  const zoneCStalls = getStallsByZone("ZONE-C");
  assert.equal(zoneCStalls.length, 4);
  const inactiveStall = zoneCStalls.find((s) => s.status === "INACTIVE");
  assert.ok(inactiveStall, "Zone C must contain an INACTIVE stall");
  assert.equal(inactiveStall.code, "C-04");
});

test("mock users cover all 5 roles and lifecycle spectrum from best to worst", () => {
  const roles = new Set<Role>(MOCK_USERS.map((u) => u.role));
  assert.ok(roles.has("CLUB_MANAGER"));
  assert.ok(roles.has("HEAD_TRAINER"));
  assert.ok(roles.has("VETERINARIAN"));
  assert.ok(roles.has("GROOM"));
  assert.ok(roles.has("HORSE_OWNER"));

  const statuses = new Set<UserStatus>(MOCK_USERS.map((u) => u.status));
  assert.ok(statuses.has("ACTIVE"));
  assert.ok(statuses.has("PENDING_APPROVAL"));
  assert.ok(statuses.has("INVITED"));
  assert.ok(statuses.has("LOCKED"));
});
