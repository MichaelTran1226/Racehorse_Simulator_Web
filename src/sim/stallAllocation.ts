import { MOCK_STALLS, type MockStall } from "./mockData.ts";
import type { HorseProfile } from "./engine.ts";

export interface StallAssignmentCheck {
  allowed: boolean;
  warning?: string;
  reason?: string;
}

/**
 * Khởi tạo danh sách ô chuồng động (bản sao độc lập từ MOCK_STALLS).
 */
export function initStalls(): MockStall[] {
  return MOCK_STALLS.map((s) => ({ ...s }));
}

/**
 * Kiểm tra tính hợp lệ khi muốn gán một con ngựa vào ô chuồng chỉ định.
 * Tuân thủ bất biến RULE-MED-01: cảnh báo nếu ngựa chấn thương/khóa y tế bị xếp vào Khu A/B.
 */
export function canAssignHorseToStall(stall: MockStall | undefined, horse: HorseProfile): StallAssignmentCheck {
  if (!stall) {
    return { allowed: false, reason: "Ô chuồng không tồn tại trong hệ thống." };
  }

  if (stall.status === "MAINTENANCE") {
    return { allowed: false, reason: "Ô chuồng đang trong thời gian bảo trì nâng cấp kỹ thuật." };
  }

  if (stall.status === "INACTIVE") {
    return { allowed: false, reason: "Ô chuồng đang ngừng sử dụng tạm thời." };
  }

  if (stall.status === "OCCUPIED") {
    return { allowed: false, reason: "Ô chuồng hiện đã có ngựa đang lưu trú." };
  }

  // Kiểm tra bất biến RULE-MED-01: Khóa y tế & chấn thương
  const isMedicallyRestricted =
    horse.medicalLock || horse.health === "INJURED" || horse.lifecycle === "CHAN_THUONG" || horse.lifecycle === "CACH_LY";

  if (isMedicallyRestricted) {
    if (stall.zoneCode === "ZONE-A") {
      return {
        allowed: true,
        warning:
          "⚠️ RULE-MED-01: Ngựa có Khóa Y Tế / Chấn thương không được thi đấu & tập nặng. Khuyến nghị chuyển sang Khu C (Cách ly thú y) thay vì Khu A (Chuồng đua)!",
      };
    }
    if (stall.zoneCode === "ZONE-B") {
      return {
        allowed: true,
        warning:
          "⚠️ RULE-MED-01: Ngựa có cảnh báo y tế tại Khu B (Chuồng tập). Cần có sự giám sát của Bác Sĩ Thú Y!",
      };
    }
  }

  return { allowed: true };
}

/**
 * Gán ngựa vào ô chuồng chỉ định (hàm thuần túy, trả về mảng chuồng mới).
 * Tự động giải phóng ô chuồng cũ nếu ngựa đã ở trong chuồng khác.
 */
export function assignHorseToStall(
  stalls: readonly MockStall[],
  stallCode: string,
  horse: HorseProfile,
  groomName?: string
): MockStall[] {
  const target = stalls.find((s) => s.code === stallCode);
  const check = canAssignHorseToStall(target, horse);
  if (!check.allowed) {
    throw new Error(check.reason ?? "Không thể gán ngựa vào ô chuồng này.");
  }

  return stalls.map((s) => {
    // Nếu ngựa này từng ở chuồng khác, giải phóng chuồng cũ
    if ((s.horseId === horse.id || (s.horseName && s.horseName.toLowerCase() === horse.name.toLowerCase())) && s.code !== stallCode) {
      return {
        ...s,
        status: "AVAILABLE" as const,
        horseId: undefined,
        horseName: undefined,
      };
    }

    // Gán vào chuồng mục tiêu
    if (s.code === stallCode) {
      return {
        ...s,
        status: "OCCUPIED" as const,
        horseId: horse.id,
        horseName: horse.name,
        assignedGroomName: groomName ?? s.assignedGroomName ?? "Đang phân công",
      };
    }

    return s;
  });
}

/**
 * Đưa ngựa ra khỏi ô chuồng (rút ngựa về trạng thái tự do/bãi thả).
 */
export function unassignHorseFromStall(stalls: readonly MockStall[], stallCode: string): MockStall[] {
  return stalls.map((s) => {
    if (s.code === stallCode && s.status === "OCCUPIED") {
      return {
        ...s,
        status: "AVAILABLE" as const,
        horseId: undefined,
        horseName: undefined,
      };
    }
    return s;
  });
}

/**
 * Lấy tập hợp ID các cá thể ngựa đã được phân bổ vào các chuồng.
 */
export function getAssignedHorseIds(stalls: readonly MockStall[]): Set<string> {
  const ids = new Set<string>();
  for (const s of stalls) {
    if (s.status === "OCCUPIED" && s.horseId) {
      ids.add(s.horseId);
    }
  }
  return ids;
}

/**
 * Lọc danh sách các con ngựa chưa có chuồng lưu trú (đang ở bãi thả hoặc tự do).
 */
export function getUnassignedHorses(allHorses: readonly HorseProfile[], stalls: readonly MockStall[]): HorseProfile[] {
  const occupiedStallHorses = stalls.filter((s) => s.status === "OCCUPIED");
  const assignedIds = new Set(occupiedStallHorses.flatMap((s) => (s.horseId ? [s.horseId] : [])));
  const assignedNames = new Set(occupiedStallHorses.flatMap((s) => (s.horseName ? [s.horseName.toLowerCase()] : [])));

  return allHorses.filter(
    (h) => !assignedIds.has(h.id) && !assignedNames.has(h.name.toLowerCase())
  );
}
