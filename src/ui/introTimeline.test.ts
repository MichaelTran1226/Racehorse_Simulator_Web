import assert from "node:assert/strict";
import { test } from "node:test";
import { acronymOf, cloudField, INTRO, INTRO_REDUCED_TOTAL_MS, INTRO_TITLE, INTRO_TOTAL_MS, titleLetters } from "./introTimeline.ts";

test("các pha nối tiếp đúng kịch bản 0–1.2 s, 1.2–2.8 s, 2.8–4.2 s", () => {
  assert.ok(INTRO.acronymPop.start + INTRO.acronymPop.duration <= INTRO.expand.start);
  assert.equal(INTRO.expand.start, 1200);
  // Giãn chữ xong rồi còn giữ ít nhất 0.8 s trước khi tách mây
  assert.ok(INTRO.part.start - (INTRO.expand.start + INTRO.expand.duration) >= 800, "giữ tên đầy đủ ≥ 0.8 s");
  assert.ok(INTRO.letterGrow < INTRO.expand.duration);
  assert.equal(INTRO.part.start, 2800);
  assert.equal(INTRO_TOTAL_MS, 4200);
  assert.ok(INTRO_REDUCED_TOTAL_MS < INTRO_TOTAL_MS);
  assert.ok(INTRO.layerSpeed.front < INTRO.layerSpeed.mid && INTRO.layerSpeed.mid < INTRO.layerSpeed.back, "lớp gần tách nhanh hơn");
});

test("chữ đầu mỗi từ ghép thành TMEC và hiện ngay; các chữ khác giãn ra theo thứ tự đọc", () => {
  const words = titleLetters(INTRO_TITLE, 600);
  assert.equal(acronymOf(INTRO_TITLE), "TMEC");
  assert.equal(words.map((w) => w.filter((l) => l.initial).map((l) => l.char).join("")).join(""), "TMEC");
  assert.equal(words.map((w) => w.map((l) => l.char).join("")).join(" "), INTRO_TITLE);
  const delays = words.flat().filter((l) => !l.initial).map((l) => l.delay);
  assert.equal(delays[0], 0);
  assert.equal(delays.at(-1), 600);
  assert.ok(delays.every((d, i) => i === 0 || d >= delays[i - 1]), "độ trễ không giảm");
});

test("tên một chữ hoặc toàn chữ cái đầu vẫn không chia cho 0", () => {
  assert.deepEqual(titleLetters("AB", 500), [[{ char: "A", initial: true, delay: 0 }, { char: "B", initial: false, delay: 0 }]]);
  assert.deepEqual(titleLetters("A B", 500), [[{ char: "A", initial: true, delay: 0 }], [{ char: "B", initial: true, delay: 0 }]]);
});

test("mây mỗi lớp trải kín nửa màn hình và lấn qua giữa; lớp gần dày hơn lớp xa", () => {
  const counts = (["back", "mid", "front"] as const).map((layer) => {
    const puffs = cloudField(layer);
    assert.ok(Math.min(...puffs.map((p) => p.x)) <= 0 && Math.max(...puffs.map((p) => p.x)) >= 95, `${layer}: từ mép ngoài tới giữa`);
    assert.ok(Math.min(...puffs.map((p) => p.y)) <= 0 && Math.max(...puffs.map((p) => p.y)) >= 85, `${layer}: từ trên xuống dưới`);
    assert.ok(puffs.every((p) => p.bob > 0 && p.phase <= 0 && p.w > 0));
    return puffs.length;
  });
  assert.ok(counts[0] < counts[1] && counts[1] < counts[2]);
  assert.deepEqual(cloudField("mid"), cloudField("mid"), "cố định giữa các lần mở");
});
