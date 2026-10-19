import assert from "node:assert/strict";
import { test } from "node:test";
import { heartHint, heartZones } from "./heartZones.ts";

test("ba vùng nhịp tim liền nhau, đúng nhãn và cộng đủ 100%", () => {
  const z = heartZones({ hrRest: 38, hrAlert: 211, hrMax: 221 });
  assert.deepEqual(z.map((x) => [x.key, x.label, x.from, x.to]), [
    ["REST", "Nghỉ", 0, 38],
    ["WORK", "Vận động", 38, 211],
    ["OVER", "Quá sức", 211, 221],
  ]);
  assert.ok(Math.abs(z.reduce((s, x) => s + x.widthPct, 0) - 100) < 1e-9);
});

test("câu giải thích nêu đúng ngưỡng báo động", () => {
  assert.equal(heartHint({ hrRest: 38, hrAlert: 211, hrMax: 221 }), "Khi tập, nhịp tim vượt 211 là ngựa quá sức.");
});
