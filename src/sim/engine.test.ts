// Chạy: npm test  (Node ≥ 22.6 tự bỏ kiểu TypeScript, không cần thư viện test).
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createRace,
  jumpLift,
  createRun,
  formatMicrochip,
  INTENSITY_PACE,
  standings,
  stepRace,
  stepRun,
  summarize,
  triggerIncident,
  type HorseProfile,
  type Surface,
} from "./engine.ts";

const horse: HorseProfile = {
  id: "HRS-T",
  code: "HR-TEST",
  name: "Test",
  breed: "Thoroughbred",
  coat: "BAY",
  gender: "STALLION",
  ageYears: 4,
  weightKg: 485,
  microchip: "985141000000001",
  lifecycle: "DANG_TAP_LUYEN",
  health: "FIT",
  medicalLock: false,
  stall: { col: 0, row: 0 },
  topSpeedMps: 17.5,
  hrRest: 36,
  hrMax: 226,
  hrAlert: 216,
  fitness: 1,
  strategy: "STALKER",
};

function runToEnd(surface: Surface, distanceM: number, pace: number, seed = 1) {
  const run = createRun(horse, { surface, distanceM, pace }, seed);
  while (run.status !== "FINISHED" && run.t < 2000) stepRun(run, horse, 0.05);
  return run;
}

test("bài nặng 1600 m sân cỏ nằm trong dải sinh lý", () => {
  const s = summarize(runToEnd("GRASS", 1600, INTENSITY_PACE.HEAVY));
  assert.ok(s.durationS > 85 && s.durationS < 110, `thời gian ${s.durationS}s`);
  assert.ok(s.topSpeedKmh > 55 && s.topSpeedKmh < 70, `top ${s.topSpeedKmh} km/h`);
  assert.ok(s.peakHr > 190 && s.peakHr <= horse.hrMax, `HR đỉnh ${s.peakHr}`);
  assert.ok(s.avgStrideLenM > 5.5 && s.avgStrideLenM < 7.6, `sải ${s.avgStrideLenM} m`);
  assert.ok(s.avgStrideFreqHz > 2.0 && s.avgStrideFreqHz < 2.5, `tần số ${s.avgStrideFreqHz} Hz`);
  assert.ok(s.finalTempC > 38 && s.finalTempC < 40.5, `thân nhiệt ${s.finalTempC}`);
  assert.ok(s.hrRecovery5m !== null && s.hrRecovery5m > 55 && s.hrRecovery5m < 120, `HR hồi phục ${s.hrRecovery5m}`);
});

test("bài nhẹ giữ nhịp tim ở mức nước kiệu", () => {
  const s = summarize(runToEnd("GRASS", 1000, INTENSITY_PACE.LIGHT));
  assert.ok(s.peakHr > 80 && s.peakHr < 140, `HR đỉnh ${s.peakHr}`);
});

test("sân cát chậm hơn sân cỏ", () => {
  const grass = summarize(runToEnd("GRASS", 1200, INTENSITY_PACE.HEAVY));
  const sand = summarize(runToEnd("SAND", 1200, INTENSITY_PACE.HEAVY));
  assert.ok(sand.durationS > grass.durationS);
});

test("cùng seed cho cùng kết quả", () => {
  assert.deepEqual(
    summarize(runToEnd("MIXED", 800, 0.8, 42)),
    summarize(runToEnd("MIXED", 800, 0.8, 42)),
  );
});

test("gãy chân: dừng hẳn, HR vọt, trạng thái ABORTED_INJURY", () => {
  const run = createRun(horse, { surface: "GRASS", distanceM: 1600, pace: 0.95 }, 3);
  while (run.t < 20) stepRun(run, horse, 0.05);
  triggerIncident(run, "FRACTURE");
  while (run.t < 32) stepRun(run, horse, 0.05);
  assert.equal(run.status, "ABORTED_INJURY");
  assert.ok(run.v < 0.5, `v ${run.v}`);
  assert.ok(run.hr > 195, `HR ${run.hr}`);
});

test("đua 6 ngựa: thứ hạng duy nhất, thời gian tăng dần", () => {
  const field = [17.2, 17.4, 17.6, 17.0, 17.8, 17.3].map((top, i) => ({
    ...horse,
    id: `H${i}`,
    topSpeedMps: top,
    strategy: (["FRONT", "STALKER", "CLOSER"] as const)[i % 3],
  }));
  const race = createRace(field, 1200, "GRASS", 7);
  while (!race.done && race.t < 300) stepRace(race, 0.05);
  const order = standings(race);
  assert.equal(new Set(order.map((e) => e.horse.id)).size, 6);
  for (let i = 1; i < order.length; i++) {
    assert.ok((order[i].run.finishTime ?? 0) >= (order[i - 1].run.finishTime ?? 0));
  }
});

test("chướng ngại & sân lầy làm chậm, đếm đủ số lần vượt", () => {
  const plain = runToEnd("GRASS", 1000, INTENSITY_PACE.HEAVY);
  const run = createRun(horse, { surface: "GRASS", distanceM: 1000, pace: INTENSITY_PACE.HEAVY, condition: "HEAVY", obstacles: [{ atM: 300, kind: "RAIL" }, { atM: 500, kind: "MUD" }, { atM: 700, kind: "HAY" }] }, 1);
  let maxLift = 0;
  while (run.status !== "FINISHED" && run.t < 2000) {
    stepRun(run, horse, 0.05);
    maxLift = Math.max(maxLift, jumpLift(run));
  }
  const s = summarize(run);
  assert.ok(s.durationS > summarize(plain).durationS, "phải chậm hơn khi có chướng ngại + sân lầy");
  assert.equal(s.obstaclesCleared, 3);
  assert.ok(maxLift > 0.9, `nhảy cao ${maxLift}`);
});

test("mã chip 15 số được chia nhóm 3 số cho dễ đọc", () => {
  assert.equal(formatMicrochip("985141000000001"), "985 141 000 000 001");
  assert.equal(formatMicrochip("9851"), "985 1");
});
