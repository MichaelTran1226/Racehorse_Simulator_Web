// Bảng Kho vật tư: mỗi món một dòng (biểu tượng pixel, thanh tồn kho, cảnh báo sắp hết/hết, nút Đặt hàng).
import type { CSSProperties } from "react";
import { stockLevel, SUPPLIES, SUPPLY_IDS, type Inventory, type StockLevel, type SupplyId } from "../sim/inventory";
import { Popup } from "./Popup";
import c from "./SupplyPanel.module.css";
import { SUPPLY_ICON } from "./supplyIcons";
import s from "./ui.module.css";
import { useCountUp } from "./useCountUp";

const LEVEL_TEXT: Record<StockLevel, string> = { OK: "Đủ dùng", LOW: "Sắp hết", OUT: "Hết hàng" };

interface Props {
  inventory: Inventory;
  onOrder: (item: SupplyId) => void;
  onClose: () => void;
}

export function SupplyPanel({ inventory, onOrder, onClose }: Props) {
  return (
    <Popup title="Kho vật tư" onClose={onClose}>
      <ul className={c.list}>
        {SUPPLY_IDS.map((id) => {
          const spec = SUPPLIES[id];
          const left = inventory.stock[id];
          const level = stockLevel(inventory, id);
          const pending = inventory.orders.some((o) => o.item === id);
          const full = left >= spec.capacity - 0.5;
          const icon = SUPPLY_ICON[id];
          return (
            <li key={id} className={c.row} data-level={level}>
              <span
                className={c.icon}
                aria-hidden
                style={{ "--sheet": `url(${icon.url})`, "--c": icon.c, "--r": icon.r } as CSSProperties}
              />
              <div className={c.info}>
                <div className={c.top}>
                  <span className={c.name}>{spec.label}</span>
                  <span className={c.amount}>
                    <CountUp value={Math.ceil(left)} /> / {spec.capacity} {spec.unit}
                  </span>
                </div>
                <div className={c.track} role="meter" aria-label={spec.label} aria-valuemin={0} aria-valuemax={spec.capacity} aria-valuenow={Math.ceil(left)} aria-valuetext={LEVEL_TEXT[level]}>
                  <span className={c.fill} style={{ width: `${(left / spec.capacity) * 100}%` }} />
                </div>
                <span className={c.level}>{pending ? "Xe tải đang chở hàng tới…" : LEVEL_TEXT[level]}</span>
              </div>
              <button type="button" className={`${s.btn} ${level === "OK" ? "" : s.primary} ${s.puffy}`} disabled={pending || full} onClick={() => onOrder(id)}>
                {pending ? "Đang giao" : "Đặt hàng"}
              </button>
            </li>
          );
        })}
      </ul>
    </Popup>
  );
}

/** Số tồn kho chạy lên/xuống mượt khi đổi (nhận hàng thì đếm lên). */
function CountUp({ value }: { value: number }) {
  return <>{Math.round(useCountUp(value))}</>;
}
