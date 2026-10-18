// Kho vật tư (mô hình thuần, chưa nối Backend): tồn kho giảm theo số ngựa × thời gian mô phỏng,
// đặt hàng → xe tải giao sau DELIVERY_S giây (đồng hồ thật, để xem được xe chạy ở mọi tốc độ) và bù đầy kho. Không ảnh hưởng sức khỏe ngựa (quyết định 19/10/2026).

export type SupplyId = "HAY" | "FEED" | "BEDDING" | "MEDS" | "SHOES";
export type StockLevel = "OK" | "LOW" | "OUT";

interface SupplySpec {
  label: string;
  unit: string;
  capacity: number;
  /** Lượng dùng mỗi ngựa mỗi giây mô phỏng. */
  perHorsePerSec: number;
}

// shortcut: tốc độ tiêu hao được tăng tốc để thấy kho vơi trong vài phút demo (10 ngựa, 1×: cỏ khô cạn sau ~5 phút);
// khi nối kho thật của Backend thì thay bằng định mức/ngày.
export const SUPPLIES: Record<SupplyId, SupplySpec> = {
  HAY: { label: "Cỏ khô", unit: "kg", capacity: 600, perHorsePerSec: 0.2 },
  FEED: { label: "Cám", unit: "kg", capacity: 250, perHorsePerSec: 0.06 },
  BEDDING: { label: "Rơm lót chuồng", unit: "kg", capacity: 400, perHorsePerSec: 0.1 },
  MEDS: { label: "Thuốc & băng", unit: "hộp", capacity: 30, perHorsePerSec: 0.004 },
  SHOES: { label: "Móng sắt", unit: "bộ", capacity: 12, perHorsePerSec: 0.0012 },
};

export const SUPPLY_IDS = Object.keys(SUPPLIES) as SupplyId[];
export const DELIVERY_S = 8;
const LOW_RATIO = 0.25;

export interface SupplyOrder {
  id: number;
  item: SupplyId;
  qty: number;
  arriveAt: number;
}

export interface Inventory {
  stock: Record<SupplyId, number>;
  orders: SupplyOrder[];
  nextOrderId: number;
}

export function initialInventory(): Inventory {
  const stock = {} as Record<SupplyId, number>;
  for (const id of SUPPLY_IDS) stock[id] = SUPPLIES[id].capacity;
  return { stock, orders: [], nextOrderId: 1 };
}

export function consume(inv: Inventory, horses: number, simSeconds: number): Inventory {
  if (horses <= 0 || simSeconds <= 0) return inv;
  const stock = { ...inv.stock };
  for (const id of SUPPLY_IDS) stock[id] = Math.max(0, stock[id] - SUPPLIES[id].perHorsePerSec * horses * simSeconds);
  return { ...inv, stock };
}

export function stockLevel(inv: Inventory, id: SupplyId): StockLevel {
  const v = inv.stock[id];
  if (v <= 0) return "OUT";
  return v < SUPPLIES[id].capacity * LOW_RATIO ? "LOW" : "OK";
}

/** Đặt đủ lượng để bù đầy kho; mỗi món chỉ một đơn đang giao, kho đầy thì không đặt. Đơn đặt khi xe đang tới thì đi chung chuyến. */
export function placeOrder(inv: Inventory, item: SupplyId, now: number): Inventory {
  const qty = Math.ceil(SUPPLIES[item].capacity - inv.stock[item]);
  if (qty <= 0 || inv.orders.some((o) => o.item === item)) return inv;
  const order = { id: inv.nextOrderId, item, qty, arriveAt: inv.orders[0]?.arriveAt ?? now + DELIVERY_S };
  return { ...inv, orders: [...inv.orders, order], nextOrderId: inv.nextOrderId + 1 };
}

/** Nhận các đơn đã tới giờ; trả lại chính `inv` khi chưa có đơn nào tới. */
export function deliver(inv: Inventory, now: number): { inventory: Inventory; arrived: SupplyOrder[] } {
  const arrived = inv.orders.filter((o) => o.arriveAt <= now);
  if (arrived.length === 0) return { inventory: inv, arrived };
  const stock = { ...inv.stock };
  for (const o of arrived) stock[o.item] = Math.min(SUPPLIES[o.item].capacity, stock[o.item] + o.qty);
  return { inventory: { ...inv, stock, orders: inv.orders.filter((o) => o.arriveAt > now) }, arrived };
}
