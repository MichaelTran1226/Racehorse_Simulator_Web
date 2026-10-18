import { useEffect, useRef, useState } from "react";
import { SCREEN_LABEL, type Screen } from "../hub/zones";
import { publish } from "../sim/bus";
import type { HorseProfile } from "../sim/engine";
import { randomHorse, seedHorses } from "../sim/horses";
import { consume, deliver, initialInventory, placeOrder, type Inventory, type SupplyId } from "../sim/inventory";
import { lockSyncPacket } from "../sim/packets";
import { useSprites } from "../render/sprites";
import c from "./App.module.css";
import { AssetOverview } from "./AssetOverview";
import { FarmHub } from "./FarmHub";
import { RaceTab } from "./RaceTab";
import { HorsePicker } from "./HorsePicker";
import { TrialTab } from "./TrialTab";
import s from "./ui.module.css";

type TrackTab = "TRIAL" | "RACE";
const NAV: Screen[] = ["HUB", "TRACK"];
// Trang tổng quan asset chỉ dành cho người làm dự án: mở bằng ?dev
const DEV = new URLSearchParams(window.location.search).has("dev");
// SRS: nút điều khiển tốc độ mô phỏng 1× · 10× · 60× · Tạm dừng
const SPEEDS = [1, 10, 60, 0];
const FADE_MS = 450;
let announced = false; // StrictMode chạy effect 2 lần — chỉ báo ONLINE một lần

export function App() {
  const { sprites, error } = useSprites();
  const [horses, setHorses] = useState<HorseProfile[]>(seedHorses);
  const [selectedId, setSelectedId] = useState<string | null>("HRS-001");
  const [screen, setScreen] = useState<Screen>("HUB");
  const [cameFrom, setCameFrom] = useState<Screen | null>(null);
  const [trackTab, setTrackTab] = useState<TrackTab>("TRIAL");
  const [speed, setSpeed] = useState(1);
  const [reported, setReported] = useState<Set<string>>(new Set());
  const [fade, setFade] = useState<{ phase: "out" | "in"; label: string } | null>(null);
  const timers = useRef<number[]>([]);
  const [inventory, setInventory] = useState(initialInventory);
  const inventoryRef = useRef<Inventory>(inventory);
  const [lastTrip, setLastTrip] = useState<{ arriveAt: number; items: SupplyId[] } | null>(null);
  const realNow = () => performance.now() / 1000;

  // Kho tiêu hao theo số ngựa × thời gian mô phỏng (dừng khi tạm dừng); xe giao hàng chạy theo đồng hồ thật — ở mọi màn hình
  useEffect(() => {
    const TICK_S = 0.5;
    const id = window.setInterval(() => {
      const dt = TICK_S * speed;
      const used = dt > 0 ? consume(inventoryRef.current, horses.length, dt) : inventoryRef.current;
      const { inventory: next, arrived } = deliver(used, realNow());
      if (next === inventoryRef.current) return;
      inventoryRef.current = next;
      setInventory(next);
      if (arrived.length) setLastTrip({ arriveAt: arrived[0].arriveAt, items: arrived.map((o) => o.item) });
    }, TICK_S * 1000);
    return () => clearInterval(id);
  }, [speed, horses.length]);

  const orderSupply = (item: SupplyId) => {
    inventoryRef.current = placeOrder(inventoryRef.current, item, realNow());
    setInventory(inventoryRef.current);
  };
  // Chuyến xe đang chạy (đơn chưa tới) hoặc chuyến vừa giao xong (để vẽ cảnh xe rời đi)
  const trip = inventory.orders.length ? { arriveAt: inventory.orders[0].arriveAt, items: inventory.orders.map((o) => o.item) } : lastTrip;

  useEffect(() => {
    if (!announced) {
      announced = true;
      publish("sim:device_status", "OUT", {
        event: "sim:device_status",
        device: "SIMULATOR_WEB",
        status: "ONLINE",
        transport: "LOCAL_BUS",
        horses_online: seedHorses().map((h) => h.id),
      });
    }
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  /** Chuyển cảnh: mờ dần toàn bộ → đổi trang → hiện dần. Chỉ đổi độ mờ (không dịch chuyển) nên vẫn giữ khi bật giảm chuyển động. */
  function go(target: Screen, label = SCREEN_LABEL[target]) {
    if (target === screen || fade) return;
    setFade({ phase: "out", label });
    timers.current.push(
      window.setTimeout(() => {
        setCameFrom(screen);
        setScreen(target);
        window.scrollTo(0, 0);
        setFade({ phase: "in", label });
      }, FADE_MS),
      window.setTimeout(() => setFade(null), FADE_MS * 2 + 150),
    );
  }

  const selected = horses.find((h) => h.id === selectedId) ?? horses[0];

  function toggleLock(id: string) {
    const h = horses.find((x) => x.id === id);
    if (!h) return;
    const next = { ...h, medicalLock: !h.medicalLock };
    publish("sys:medical_lock_sync", "IN", lockSyncPacket(next, next.medicalLock));
    setHorses((list) => list.map((x) => (x.id === id ? next : x)));
  }

  function addRandom() {
    const h = randomHorse(horses);
    if (!h) return;
    setHorses((list) => [...list, h]);
    setSelectedId(h.id);
  }

  const markReported = (id: string) => setReported((r) => new Set(r).add(id));
  const simScreen = screen === "TRACK";
  if (DEV) return <AssetOverview />;

  return (
    <div className={c.shell} data-screen={screen}>
      <header className={c.header}>
        <button type="button" className={c.brand} onClick={() => go("HUB")} aria-label="Về trang trại">
          <span className={c.logo} aria-hidden>
            EF
          </span>
          <span>
            <span className={c.product}>EquiFlow Simulator</span>
            <span className={c.tagline}>Trang trại ngựa đua mô phỏng</span>
          </span>
        </button>
        <nav className={c.views} aria-label="Khu vực">
          {NAV.map((id) => (
            <button key={id} type="button" className={c.viewBtn} aria-current={screen === id} onClick={() => go(id)}>
              {SCREEN_LABEL[id]}
            </button>
          ))}
        </nav>
        <div className={c.headerRight} hidden={!simScreen}>
          <span className={c.device}>
            <span className={c.dot} /> Đang mô phỏng
          </span>
          <div className={c.speed} role="group" aria-label="Tốc độ mô phỏng">
            {SPEEDS.map((v) => (
              <button key={v} type="button" className={c.speedBtn} aria-pressed={speed === v} aria-label={v === 0 ? "Tạm dừng" : `Tốc độ ${v} lần`} onClick={() => setSpeed(v)}>
                {v === 0 ? "II" : `${v}×`}
              </button>
            ))}
          </div>
        </div>
      </header>

      {error && <p className={s.noticeDanger}>{error}</p>}
      {!sprites && !error && <p className={c.loading}>Đang dựng trang trại…</p>}

      {sprites && screen === "HUB" && <FarmHub sprites={sprites} horses={horses} reported={reported} speed={speed} speeds={SPEEDS} onSpeed={setSpeed} onEnterTrack={() => go("TRACK")} onSelect={setSelectedId} onToggleLock={toggleLock} onRandom={addRandom} onIncident={markReported} inventory={inventory} onOrder={orderSupply} trip={trip} arriveFrom={cameFrom === "HUB" ? null : cameFrom} />}

      {sprites && simScreen && (
        <div className={c.layout}>
          <main className={c.main}>
            <div className={c.zoneBar}>
              <button type="button" className={`${s.btn} ${s.puffy}`} onClick={() => go("HUB")}>
                ◀ Về trang trại
              </button>
              <h1 className={c.zoneTitle}>{SCREEN_LABEL[screen]}</h1>
              {screen === "TRACK" && (
                <nav className={c.tabs} aria-label="Hoạt động trên đường đua">
                  {(
                    [
                      ["TRIAL", "Chạy thử", "1 ngựa"],
                      ["RACE", "Đua 6 làn", "tối đa 6 ngựa"],
                    ] as const
                  ).map(([id, label, code]) => (
                    <button key={id} type="button" className={c.tab} aria-current={trackTab === id} onClick={() => setTrackTab(id)}>
                      {label}
                      <span className={c.tabCode}>{code}</span>
                    </button>
                  ))}
                </nav>
              )}
            </div>
            {screen === "TRACK" && trackTab === "TRIAL" && (
              <HorsePicker horses={horses} sprites={sprites} selectedId={selected?.id ?? null} onSelect={setSelectedId} />
            )}
            {screen === "TRACK" && trackTab === "TRIAL" && selected && (
              <TrialTab horse={selected} sprites={sprites} speed={speed} onIncident={markReported} />
            )}
            {screen === "TRACK" && trackTab === "RACE" && (
              <RaceTab horses={horses} sprites={sprites} speed={speed} onIncident={markReported} />
            )}
          </main>

        </div>
      )}

      {fade && (
        <div className={c.curtain} data-phase={fade.phase} aria-hidden>
          <div className={c.curtainCard}>
            <span className={c.curtainKicker}>{fade.phase === "out" ? "Đang vào" : "Đã tới"}</span>
            <span className={c.curtainTitle}>{fade.label}</span>
            <span className={c.curtainDots}>
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
