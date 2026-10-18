// Biểu tượng vật tư lấy nguyên ô 32 px từ sheet đã duyệt — dùng chung cho bảng Kho (CSS) và hoạt cảnh dỡ hàng (canvas).
// S11 hàng 3 = ống tiêm · thuốc · móng sắt · bao thức ăn; S07 (4,3) kiện rơm, (4,1) rơm dày.
import type { SupplyId } from "../sim/inventory";

export const SUPPLY_ICON: Record<SupplyId, { url: string; c: number; r: number }> = {
  HAY: { url: "/assets/sprites/s07-stall.png", c: 4, r: 3 },
  FEED: { url: "/assets/sprites/s11-icons.png", c: 3, r: 3 },
  BEDDING: { url: "/assets/sprites/s07-stall.png", c: 4, r: 1 },
  MEDS: { url: "/assets/sprites/s11-icons.png", c: 1, r: 3 },
  SHOES: { url: "/assets/sprites/s11-icons.png", c: 2, r: 3 },
};
