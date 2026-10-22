// Bảng danh bạ nhân sự & ca trực Nhà Ban Điều Hành / Groom (EquiFlow Simulator v3)
// Thiết kế Tối giản (Minimalist) theo nguyên lý Progressive Disclosure:
// Mặc định hiển thị danh sách mini-chips gọn gàng; chỉ mở panel chi tiết khi người dùng chủ động chọn.
import { useState } from "react";
import { MOCK_USERS, type Role, type UserStatus, type MockUser } from "../sim/mockData";
import type { HorseProfile } from "../sim/engine";
import s from "./ui.module.css";
import g from "./GroomTab.module.css";

interface Props {
  horses?: HorseProfile[];
  onOpenHorseCard?: (horseId: string) => void;
}

type FilterKey = "ALL" | Role;

const FILTER_TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "ALL", label: "Tất cả" },
  { key: "GROOM", label: "Groom" },
  { key: "HEAD_TRAINER", label: "HLV" },
  { key: "VETERINARIAN", label: "Thú y" },
  { key: "CLUB_MANAGER", label: "Quản lý" },
  { key: "HORSE_OWNER", label: "Chủ ngựa" },
];

const ROLE_LABEL: Record<Role, string> = {
  CLUB_MANAGER: "Trưởng ban điều hành câu lạc bộ",
  HEAD_TRAINER: "Huấn luyện viên trưởng",
  VETERINARIAN: "Bác sĩ thú y chuyên trách",
  GROOM: "Người chăm sóc ngựa (Groom)",
  HORSE_OWNER: "Chủ sở hữu chiến mã",
};

const STATUS_CONFIG: Record<UserStatus, { label: string; dotColor: string; className: string }> = {
  ACTIVE: { label: "HOẠT ĐỘNG", dotColor: "#2e7d32", className: g.badgeActive },
  PENDING_APPROVAL: { label: "CHỜ DUYỆT", dotColor: "#f57c00", className: g.badgePending },
  INVITED: { label: "ĐƯỢC MỜI", dotColor: "#1976d2", className: g.badgeInvited },
  LOCKED: { label: "BỊ KHÓA", dotColor: "#c62828", className: g.badgeLocked },
  INACTIVE: { label: "NGỪNG DÙNG", dotColor: "#455a64", className: g.badgeInactive },
};

const MOOD_LABEL: Record<string, string> = {
  HAPPY: "😊 Hăng hái",
  BUSY: "⏳ Bận rộn",
  TIRED: "💤 Mệt mỏi",
  NEUTRAL: "☕ Bình thường",
};

const ROLE_ICON: Record<Role, string> = {
  CLUB_MANAGER: "🏛️",
  HEAD_TRAINER: "🏇",
  VETERINARIAN: "🩺",
  GROOM: "🧹",
  HORSE_OWNER: "👑",
};

export function GroomTab({ horses: _horses, onOpenHorseCard }: Props) {
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const filteredUsers = filter === "ALL" ? MOCK_USERS : MOCK_USERS.filter((u) => u.role === filter);

  const activeCount = MOCK_USERS.filter((u) => u.status === "ACTIVE").length;
  const pendingCount = MOCK_USERS.filter((u) => u.status === "PENDING_APPROVAL").length;
  const lockedCount = MOCK_USERS.filter((u) => u.status === "LOCKED").length;

  const selectedUser = selectedUserId ? MOCK_USERS.find((u) => u.id === selectedUserId) ?? null : null;

  const handleChipClick = (id: string) => {
    setSelectedUserId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={g.container}>
      {/* 1. Bộ lọc vai trò tinh gọn */}
      <div className={g.filterBar}>
        {FILTER_TABS.map((tab) => {
          const isActive = filter === tab.key;
          const count = tab.key === "ALL" ? MOCK_USERS.length : MOCK_USERS.filter((u) => u.role === tab.key).length;
          return (
            <button
              key={tab.key}
              type="button"
              className={`${s.btn} ${isActive ? s.primary : ""}`}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "14px",
                padding: "3px 10px",
              }}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* 2. Dòng tóm tắt trạng thái một dòng */}
      <div className={g.summaryBanner}>
        <span>
          Nhân sự: <strong>{MOCK_USERS.length} tài khoản</strong>
        </span>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <span>✓ Hoạt động: <strong>{activeCount}</strong></span>
          {pendingCount > 0 && <span style={{ color: "#FFE082" }}>⏳ Chờ duyệt: <strong>{pendingCount}</strong></span>}
          {lockedCount > 0 && <span style={{ color: "#FF8A80" }}>🔒 Bị khóa: <strong>{lockedCount}</strong></span>}
        </div>
      </div>

      {/* 3. Lưới các mini-chips gọn gàng */}
      <div className={g.staffChipsGrid}>
        {filteredUsers.map((user: MockUser) => {
          const isSelected = user.id === selectedUserId;
          const statusCfg = STATUS_CONFIG[user.status];
          const isLocked = user.status === "LOCKED";
          const isPending = user.status === "PENDING_APPROVAL";

          return (
            <button
              key={user.id}
              type="button"
              className={`${g.staffChip} ${isSelected ? g.staffChipSelected : ""} ${isLocked ? g.staffChipLocked : isPending ? g.staffChipPending : ""}`}
              onClick={() => handleChipClick(user.id)}
              title={`${user.fullName} (${user.code}) - Bấm để xem chi tiết`}
            >
              <span className={g.chipIcon}>{ROLE_ICON[user.role]}</span>
              <div className={g.chipInfo}>
                <span className={g.chipName}>{user.fullName.split(" (")[0]}</span>
                <div className={g.chipMeta}>
                  <span className={g.chipCode}>{user.code}</span>
                  <span
                    className={g.chipStatusDot}
                    style={{ backgroundColor: statusCfg.dotColor }}
                    title={statusCfg.label}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. Panel Chi Tiết Mở Rộng khi Click (Progressive Disclosure) */}
      {selectedUser ? (
        <section className={g.detailPanel}>
          <div className={g.detailHead}>
            <div className={g.detailTitleGroup}>
              <div className={g.detailAvatar}>
                <span>{ROLE_ICON[selectedUser.role]}</span>
              </div>
              <div>
                <div className={g.detailNameRow}>
                  <h4 className={g.detailFullName}>{selectedUser.fullName}</h4>
                  <span className={STATUS_CONFIG[selectedUser.status].className}>
                    {STATUS_CONFIG[selectedUser.status].label}
                  </span>
                </div>
                <div className={g.detailRoleSub}>
                  {ROLE_LABEL[selectedUser.role]} · Mã: <strong>{selectedUser.code}</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              className={g.detailCloseBtn}
              onClick={() => setSelectedUserId(null)}
              title="Đóng chi tiết"
            >
              ✕ Thu gọn
            </button>
          </div>

          <div className={g.detailGrid}>
            <div className={g.detailItem}>
              <span className={g.detailItemLabel}>Ca trực & Thời gian</span>
              <span className={g.detailItemValue}>
                {selectedUser.shiftHours ?? (selectedUser.shift === "MORNING" ? "Ca sáng (05:00 - 13:00)" : selectedUser.shift === "AFTERNOON" ? "Ca chiều (13:00 - 21:00)" : "Toàn thời gian")}
              </span>
            </div>

            {selectedUser.assignedZoneCode && (
              <div className={g.detailItem}>
                <span className={g.detailItemLabel}>Khu phụ trách</span>
                <span className={g.detailItemValue}>
                  {selectedUser.assignedZoneCode === "ZONE-A" ? "🚩 Khu A · Chuồng Đua" : selectedUser.assignedZoneCode === "ZONE-B" ? "🏇 Khu B · Chuồng Tập" : "🏥 Khu C · Cách Ly"}
                </span>
              </div>
            )}

            <div className={g.detailItem}>
              <span className={g.detailItemLabel}>Liên hệ & Kinh nghiệm</span>
              <span className={g.detailItemValue}>
                {selectedUser.phoneNumber} {selectedUser.experienceYears ? `(${selectedUser.experienceYears} năm)` : ""}
              </span>
            </div>

            {selectedUser.mood && (
              <div className={g.detailItem}>
                <span className={g.detailItemLabel}>Tâm trạng làm việc</span>
                <span className={g.detailItemValue}>
                  {MOOD_LABEL[selectedUser.mood] ?? selectedUser.mood}
                </span>
              </div>
            )}
          </div>

          {selectedUser.assignedHorses && selectedUser.assignedHorses.length > 0 && (
            <div className={g.horseSection}>
              <span className={g.detailItemLabel}>
                {selectedUser.role === "HORSE_OWNER" ? "Chiến mã sở hữu (Bấm xem thẻ):" : "Ngựa được giao phụ trách (Bấm xem thẻ):"}
              </span>
              <div className={g.horseList}>
                {selectedUser.assignedHorses.map((hName) => (
                  <button
                    key={hName}
                    type="button"
                    className={g.horseChip}
                    style={{ cursor: onOpenHorseCard ? "pointer" : "default" }}
                    onClick={() => {
                      if (onOpenHorseCard && _horses) {
                        const match = _horses.find((h) => h.name.toLowerCase().includes(hName.toLowerCase()));
                        if (match) onOpenHorseCard(match.id);
                      }
                    }}
                    title={`Xem thẻ chiến mã ${hName}`}
                  >
                    ♞ {hName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedUser.note && (
            <div className={g.detailNote}>
              “{selectedUser.note}”
            </div>
          )}
        </section>
      ) : (
        <div className={g.hintPrompt}>
          💡 Nhấp vào bất kỳ nhân viên nào ở trên để xem chi tiết ca trực, khu vực phụ trách và chiến mã liên quan.
        </div>
      )}
    </div>
  );
}
