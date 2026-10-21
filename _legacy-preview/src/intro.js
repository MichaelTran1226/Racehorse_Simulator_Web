// Intro: cloud walls part (two parallax layers), the camera glides down from the sky onto the four main
// buildings with a small overshoot, then their signs pop in. Any tap or key skips to the final shot.
import { focusCamera, introFrames, unionBox } from "./intro-camera.js";

const stage = document.getElementById("stage");
const world = document.getElementById("world");
const signs = document.getElementById("signs");
const clouds = document.getElementById("clouds");
const hint = document.getElementById("skipHint");
const map = world.querySelector(".map");

const meta = await fetch("/assets/maps/farm-ref-map.json").then((r) => r.json());
// Wait for the map, not img.decode(): Chromium can leave decode() pending for a covered image. A broken image still runs the intro.
if (!map.complete) await new Promise((done) => { map.addEventListener("load", done, { once: true }); map.addEventListener("error", done, { once: true }); });

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const box = unionBox(meta.buildings, 24);
const view = () => ({ w: innerWidth, h: innerHeight });
const transform = (c) => `translate(${c.x}px, ${c.y}px) scale(${c.s})`;
const settle = () => { world.style.transform = transform(focusCamera(view(), box, meta.world)); };

const signEls = meta.buildings.map((b) => {
  const li = document.createElement("li");
  li.className = "sign";
  li.textContent = b.name;
  li.style.left = `${b.x + b.w / 2}px`;
  li.style.top = `${b.y + b.h * 0.42}px`;
  signs.append(li);
  return li;
});

const anims = [];
const run = (el, frames, options) => anims.push(el.animate(frames, { fill: "forwards", ...options }));
const SIGN_SHOWN = { opacity: 1, transform: "translate(-50%, -50%) scale(1)" };

if (reduceMotion) {
  // Reduced motion: no travel, everything only fades.
  settle();
  run(clouds, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 });
  signEls.forEach((el) => run(el, [{ opacity: 0 }, SIGN_SHOWN], { duration: 300, delay: 200 }));
} else {
  const CAMERA_DELAY = 400, CAMERA_MS = 3000, SIGNS_AT = CAMERA_DELAY + CAMERA_MS;
  run(world, introFrames(view(), box, meta.world).map((f) => ({ transform: transform(f), offset: f.offset })), {
    duration: CAMERA_MS, delay: CAMERA_DELAY, easing: "cubic-bezier(.45, 0, .25, 1)",
  });
  const part = (sel, to, duration) =>
    run(clouds.querySelector(sel), [{ transform: "translateX(0)" }, { transform: to }], { duration, delay: 250, easing: "cubic-bezier(.6, 0, .3, 1)" });
  part(".near-left", "translateX(calc(-100% - 24vmax))", 1100);
  part(".near-right", "translateX(calc(100% + 24vmax))", 1100);
  // Far layer drifts slower and fades: depth, like passing through the cloud deck.
  run(clouds.querySelector(".far-left"), [{ transform: "translateX(0)", opacity: 1 }, { transform: "translateX(-40vw)", opacity: 0 }], { duration: 1900, delay: 250, easing: "ease-out" });
  run(clouds.querySelector(".far-right"), [{ transform: "translateX(0)", opacity: 1 }, { transform: "translateX(40vw)", opacity: 0 }], { duration: 1900, delay: 250, easing: "ease-out" });
  signEls.forEach((el, i) => run(el, [
    { opacity: 0, transform: "translate(-50%, -50%) scale(.3)" },
    { opacity: 1, transform: "translate(-50%, -50%) scale(1.12)", offset: 0.6 },
    SIGN_SHOWN,
  ], { duration: 380, delay: SIGNS_AT + i * 150, easing: "ease-out" }));
  run(hint, [{ opacity: 1 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: SIGNS_AT });
}

let done = false;
const skip = () => anims.forEach((a) => a.finish());
stage.addEventListener("pointerdown", skip);
addEventListener("keydown", skip);
addEventListener("resize", () => (done ? settle() : skip()));

await Promise.all(anims.map((a) => a.finished));
done = true;
settle(); // commit the final camera so later resizes can recompute it
anims.forEach((a) => { if (a.effect.target === world) a.cancel(); });
clouds.remove();
hint.remove();
stage.removeEventListener("pointerdown", skip);
removeEventListener("keydown", skip);
stage.style.cursor = "default";
