// Danh mục toàn bộ ảnh trích từ bản chat "Từ Khóa Làm Game Cơ Bản Trong Godot.html" (26 ảnh, theo thứ tự xuất hiện)
// đối chiếu với quy chuẩn SRS v2.0 §11–13. Dùng cho màn "Tổng quan tài nguyên" — duyệt trước, đi sâu từng asset sau.

export type AssetGroup = "P0" | "SPRITE" | "SCENE" | "G1";
export type AssetKind = "SHEET" | "SCENE";

export interface AssetFile {
  /** đường dẫn trong public/ */
  src: string;
  /** thứ tự ảnh trong bản chat (01–26) */
  index: number;
}

export interface Asset {
  code: string;
  name: string;
  group: AssetGroup;
  kind: AssetKind;
  files: AssetFile[];
  /** Nội dung từng hàng theo đề bài (H1…H6) — để soát ảnh có đúng không. */
  rows: string[];
  /** Màn hình / yêu cầu Simulator dùng tới asset này. */
  usedIn: string[];
  /** Nhận xét đã kiểm tra khi trích ảnh (chưa phải đánh giá chi tiết). */
  notes: string[];
  /** Bảng màu đổi bằng code áp dụng cho asset (SRS §12). */
  palette?: "COAT" | "SILK" | "STALL";
}

const f = (index: number, ext: "png" | "jpg" = "jpg"): AssetFile => ({
  index,
  src: `/assets/concept/raw/i${String(index).padStart(2, "0")}.${ext}`,
});

export const GROUP_LABEL: Record<AssetGroup, string> = {
  P0: "Mẫu thử P0",
  SPRITE: "Bộ sprite S01–S15",
  SCENE: "Cảnh xem trước M1–M5",
  G1: "Nháp thế hệ 1 (trước quy tắc)",
};

export const ASSETS: Asset[] = [
  {
    code: "P0",
    name: "Mẫu thử ngựa Bay — bản 1",
    group: "P0",
    kind: "SHEET",
    files: [f(9)],
    rows: ["H1 đứng yên 6", "H2 phi nước đại 6", "H3 K1 ngựa có nài (áo đỏ)", "Bảng màu + bản phóng to 8×"],
    usedIn: ["Duyệt phong cách"],
    notes: ["Nền magenta #FF00FF — đã được thay bằng bản 2 (nền #CFD8DC)."],
    palette: "COAT",
  },
  {
    code: "P0b",
    name: "Mẫu thử ngựa Bay — bản bổ sung (đã duyệt phong cách)",
    group: "P0",
    kind: "SHEET",
    files: [f(10)],
    rows: [
      "H1 đứng yên 6",
      "H2 phi nước đại 6",
      "H3 C1 có nài · C2 lớp Roan · C3 sao trán · C4 vớ chân trắng · C5 kết hợp",
      "H4 bảng 8 màu lông + quy đổi",
      "H5–H6 bản phóng to 8×",
    ],
    usedIn: ["Duyệt phong cách", "Bảng màu lông"],
    notes: ["Ngựa ở H1–H2 đang đeo yên — S01 yêu cầu ngựa trơn, không yên."],
    palette: "COAT",
  },
  {
    code: "S01",
    name: "Ngựa gốc màu Bay (trơn, không yên)",
    group: "SPRITE",
    kind: "SHEET",
    files: [f(11)],
    rows: [
      "H1 đứng yên 6",
      "H2 đi bộ 6",
      "H3 nước kiệu 6",
      "H4 phi nước đại 6 (K1–K6 theo nhịp phi)",
      "H5 ăn cỏ 3 + nằm nghỉ 3",
      "H6 dừng khựng 2 + khập khiễng 2 (có “!”) + giật mình 1 + chồm lên 1",
    ],
    usedIn: ["SIM-02 Chuồng", "SIM-03 Chạy thử", "SIM-06 Sự cố", "Hồ sơ ngựa"],
    notes: ["ĐÃ VẼ LẠI (đợt 1): art/gen/horse.ts → art/aseprite/s01-horse.aseprite + public/assets/sprites/s01-horse.png (192×192, đúng 8 mã màu lông).", "Ảnh concept bên trái chỉ còn làm mẫu tham khảo."],
    palette: "COAT",
  },
  {
    code: "S06",
    name: "Nhân vật 5 vai trò RBAC + nài",
    group: "SPRITE",
    kind: "SHEET",
    files: [f(12)],
    rows: [
      "H1 Quản lý CLB — đi 4 · đứng 1 · ký duyệt tablet",
      "H2 HLV trưởng — đi 4 · đứng 1 · bấm giờ",
      "H3 Bác sĩ thú y — đi 4 · đứng 1 · nghe tim",
      "H4 Groom — đi 4 · đứng 1 · chải lông",
      "H5 Chủ ngựa — đi 4 · đứng 1 · vỗ tay",
      "H6 Nài đi bộ — đi 4 · đứng 1 · giơ roi chào",
    ],
    usedIn: ["M1 toàn cảnh", "M3 HLV bấm giờ"],
    notes: ["ĐÃ VẼ LẠI (đợt 3): art/gen → art/aseprite/s06-people.aseprite + public/assets/sprites/s06-people.png (192×192)."],
    palette: "SILK",
  },
  {
    code: "S07",
    name: "Chuồng (Stall tileset)",
    group: "SPRITE",
    kind: "SHEET",
    files: [f(13)],
    rows: [
      "H1 tường gỗ ngang/dọc · vách lưới · góc · khung ô · cánh cửa rời",
      "H2 cửa đóng · mở hé · mở hẳn · rơm A · rơm B · bảng tên",
      "H3 máng cỏ / ngũ cốc / nước (đầy · vơi)",
      "H4 đèn tắt/sáng · móc · móc có dây · kiện rơm · bao cám",
      "H5 viền Rule C #00E5FF (4 góc + 2 cạnh)",
      "H6 xem trước viền xanh · vàng · đỏ “!” · tím · chân cột · mái",
    ],
    usedIn: ["SIM-02 Chuồng"],
    notes: ["ĐÃ VẼ LẠI (đợt 2): art/gen → art/aseprite/s07-stall.aseprite + public/assets/sprites/s07-stall.png (192×192)."],
    palette: "STALL",
  },
  {
    code: "S08",
    name: "Khu trang trại (Farm terrain)",
    group: "SPRITE",
    kind: "SHEET",
    files: [f(14)],
    rows: [
      "H1 cỏ 3 kiểu · viền cỏ-đường · đường đất ngang · cong",
      "H2 ngã tư · rào ngang/dọc/góc · cổng bãi thả đóng/mở",
      "H3 tán cây · thân cây · bụi · khóm hoa · bờ ao góc/cạnh",
      "H4 kiện cỏ · bao cám · nhà kho (mái · tường) · văn phòng (mái · tường)",
      "H5 phòng khám (mái · tường chữ thập · cửa) · cửa sổ · biển · đống rơm",
      "H6 gốc cây · vệt bánh xe · rào hỏng · cây dại · đá · giếng",
    ],
    usedIn: ["M1/M2 toàn cảnh"],
    notes: ["ĐÃ VẼ LẠI (đợt 2): art/gen → art/aseprite/s08-farm.aseprite + public/assets/sprites/s08-farm.png (192×192)."],
  },
  {
    code: "S09",
    name: "Đường đua 3 mặt sân",
    group: "SPRITE",
    kind: "SHEET",
    files: [f(15)],
    rows: [
      "H1–H2 cỏ: thẳng trên/dưới · cua · chéo · mốc cự ly · cảm biến · dấu móng …",
      "H3–H4 cát: cùng bộ ô như cỏ",
      "H5–H6 hỗn hợp: cùng bộ ô như cỏ",
    ],
    usedIn: ["SIM-03 Chạy thử", "SIM-05 Đua"],
    notes: ["Ảnh 1024×1024 (vuông), ô có viền/bóng riêng nên không ghép liền thành dải đường; Simulator đang vẽ mặt sân bằng code."],
  },
  {
    code: "S10",
    name: "Thi đấu (Race arena)",
    group: "SPRITE",
    kind: "SHEET",
    files: [f(16)],
    rows: [
      "H1 cổng xuất phát đóng · đang mở · mở · vạch đích · cột đích · bảng điện tử",
      "H2 mái khán đài · bậc trống · khán đài đông · khán giả · bục vinh quang · loa/máy quay",
      "H3 cúp vàng/bạc/đồng · huy chương 1–3",
      "H4 nơ danh hiệu · túi tiền thưởng · cờ đỏ · cờ caro · vòng nguyệt quế · cờ hoa",
      "H5 rào đỏ trắng · rào di động · cọc · đèn tín hiệu · băng rôn · pháo giấy",
      "H6 cổng chào (mái · trụ) · thảm đỏ · máy quay · bồn hoa · cờ phướn",
    ],
    usedIn: ["SIM-05 Đua"],
    notes: ["ĐÃ VẼ LẠI (đợt 2): art/gen → art/aseprite/s10-arena.aseprite + public/assets/sprites/s10-arena.png (192×192)."],
  },
  {
    code: "S11",
    name: "Biểu tượng nghiệp vụ (36 icon)",
    group: "SPRITE",
    kind: "SHEET",
    files: [f(17)],
    rows: [
      "6 trạng thái ngựa (sẵn sàng · đang tập · theo dõi · chấn thương · cách ly · nghỉ)",
      "khóa đỏ · mở khóa · “!” · nhịp tim · thân nhiệt · tốc độ",
      "sải bước · tần số sải · calo · thể lực · vi mạch Microchip · cây phả hệ",
      "ống tiêm · thuốc tẩy giun · móng sắt · bao thức ăn · vòi tắm · xô đá",
      "báo cáo sự cố · chuông · đồng hồ · mặt trời · mặt trăng · cân",
      "thước · xe chở ngựa thu nhỏ · …",
    ],
    usedIn: ["HUD", "Danh sách ngựa", "Chuồng"],
    notes: ["ĐÃ VẼ LẠI (đợt 4): art/gen → art/aseprite/s11-icons.aseprite + public/assets/sprites/s11-icons.png (192×192)."],
  },
  {
    code: "S12",
    name: "Giao diện HUD",
    group: "SPRITE",
    kind: "SHEET",
    files: [f(18)],
    rows: [
      "khung bảng 9 mảnh (4 góc · 4 cạnh · giữa)",
      "nút thường · rê chuột · nhấn · khóa",
      "thanh nhịp tim / thể lực (khung + ruột)",
      "nút tốc độ 1× · 10× · 60× · tạm dừng · chạy · hộp thoại",
      "dòng bảng xếp hạng · huy hiệu P1–P6",
      "khung bản đồ nhỏ · khung chú thích · mũi tên chọn",
    ],
    usedIn: ["Khung HUD trong canvas (tùy chọn)"],
    notes: ["Giao diện Simulator hiện dùng HTML/CSS theo token EquiFlow, chưa dùng bộ HUD pixel này."],
  },
  {
    code: "S13",
    name: "Hiệu ứng (FX)",
    group: "SPRITE",
    kind: "SHEET",
    files: [f(19)],
    rows: [
      "bụi khi phi 4",
      "giọt mồ hôi 2 · dấu móng 2 · lấp lánh 2",
      "lấp lánh · chớp đỏ sự cố 4",
      "mưa 4",
      "quầng đèn 2 · “zzz” 2 · trái tim 2",
    ],
    usedIn: ["SIM-03 bụi khi phi", "SIM-06 chớp đỏ", "SIM-02 zzz"],
    notes: ["ĐÃ VẼ LẠI (đợt 4): art/gen → art/aseprite/s13-fx.aseprite + public/assets/sprites/s13-fx.png (192×192)."],
  },
  {
    code: "S14",
    name: "Lớp chồng yên + nài",
    group: "SPRITE",
    kind: "SHEET",
    files: [f(20)],
    rows: [
      "H1 yên + nài khớp 6 khung phi (S01 H4)",
      "H2 yên + nài khớp 6 khung kiệu (S01 H3)",
      "H3 yên + nài ngồi khớp 6 khung đứng (S01 H1)",
      "H4 chỉ yên, khớp 6 khung phi",
      "H5 ghép thử S01 + yên + nài (6 khung phi)",
    ],
    usedIn: ["SIM-03 Chạy thử", "SIM-05 Đua 6 làn"],
    notes: [
      "ĐÃ VẼ LẠI (đợt 1): art/gen/horse.ts → art/aseprite/s14-rider.aseprite + public/assets/sprites/s14-rider.png — 6 khung khớp đúng S01.",
    ],
    palette: "SILK",
  },
  {
    code: "S15",
    name: "Xe chở ngựa & phương tiện",
    group: "SPRITE",
    kind: "SHEET",
    files: [f(21)],
    rows: [
      "xe tải kéo thùng nhìn ngang (đóng · mở cầu dắt · bánh lăn 4)",
      "thùng xe nhìn từ trên xuống",
      "xe cút kít (rỗng · chở cỏ)",
      "xe kéo chở cỏ khô",
      "xe điện chạy trong sân",
    ],
    usedIn: ["M1 toàn cảnh"],
    notes: ["ĐÃ VẼ LẠI (đợt 3): art/gen → art/aseprite/s15-vehicles.aseprite + public/assets/sprites/s15-vehicles.png (192×192)."],
  },
  {
    code: "M1",
    name: "Toàn cảnh trang trại — ban ngày",
    group: "SCENE",
    kind: "SCENE",
    files: [f(22)],
    rows: ["Nhìn từ trên xuống: chuồng nhiều ô, bãi thả, đường đua, nhà kho, phòng khám, văn phòng, nhân vật, xe chở ngựa"],
    usedIn: ["Màn hình chờ / tổng quan"],
    notes: ["Góc nhìn chéo 3/4 chứ không phải top-down thuần như đề bài."],
  },
  {
    code: "M2",
    name: "Toàn cảnh trang trại — ban đêm",
    group: "SCENE",
    kind: "SCENE",
    files: [f(23)],
    rows: ["Cùng cảnh M1 ban đêm: đèn chuồng sáng, ngựa nằm nghỉ"],
    usedIn: ["Chế độ ban đêm"],
    notes: [],
  },
  {
    code: "M3",
    name: "Màn chạy thử nhìn ngang",
    group: "SCENE",
    kind: "SCENE",
    files: [f(24)],
    rows: ["1 ngựa có nài phi trên sân cỏ · HLV bấm giờ bên lan can · HUD 6 chỉ số"],
    usedIn: ["Tham chiếu bố cục SIM-03"],
    notes: [],
  },
  {
    code: "M4",
    name: "Màn đua xuất phát 6 làn",
    group: "SCENE",
    kind: "SCENE",
    files: [f(25)],
    rows: ["6 ngựa có nài (6 màu áo) ra khỏi cổng · khán đài · bảng xếp hạng P1–P6"],
    usedIn: ["Tham chiếu bố cục SIM-05"],
    notes: [],
  },
  {
    code: "M5",
    name: "Hồ sơ & giáo án (HLV + VET)",
    group: "SCENE",
    kind: "SCENE",
    files: [f(26)],
    rows: ["Danh sách ngựa · chi tiết ngựa trong chuồng · Medical Lock · cấu hình bài tập · nút bắt đầu chạy thử"],
    usedIn: ["Tham chiếu (phần này thuộc Main Web)"],
    notes: ["Ngoài danh sách đề bài (đề bài dừng ở M4)."],
  },
  {
    code: "G1-A",
    name: "Nháp: ngựa & chỉ số",
    group: "G1",
    kind: "SHEET",
    files: [f(3, "png"), f(5)],
    rows: ["H1–H4 đứng · đi · kiệu · phi", "H5 ăn / nghỉ", "H6 icon chỉ số (tim · thể lực · tốc độ · chip …)"],
    usedIn: ["—"],
    notes: ["Có chữ nhãn trong ảnh (Idle, Walk, Gallop…) — vi phạm quy tắc “không chữ”; đã được thay bằng S01/S11."],
  },
  {
    code: "G1-B",
    name: "Nháp: chuồng ngựa",
    group: "G1",
    kind: "SHEET",
    files: [f(2, "png"), f(6)],
    rows: ["H1–H2 tường, cửa", "H3–H4 nền rơm, máng", "H5–H6 huy hiệu trạng thái"],
    usedIn: ["—"],
    notes: ["Đã được thay bằng S07."],
  },
  {
    code: "G1-C",
    name: "Nháp: đường chạy 3 mặt sân",
    group: "G1",
    kind: "SHEET",
    files: [f(4, "png"), f(7)],
    rows: ["H1–H2 cỏ", "H3–H4 cát", "H5–H6 hỗn hợp"],
    usedIn: ["—"],
    notes: ["Có chữ/số trong ảnh; đã được thay bằng S09."],
  },
  {
    code: "G1-D",
    name: "Nháp: giải đấu & thành tích",
    group: "G1",
    kind: "SHEET",
    files: [f(1, "png"), f(8)],
    rows: ["H1–H2 cổng xuất phát 6 làn", "H3–H4 vạch đích, bảng điện tử", "H5–H6 cúp, huy chương, tiền thưởng"],
    usedIn: ["—"],
    notes: ["Có chữ (FINISH, LAP) — vi phạm quy tắc; đã được thay bằng S10."],
  },
];

// ------------------------------------------------------------------ Quy chuẩn & bảng màu (SRS §11–12)

export const SHEET_SPEC = { cell: 32, cols: 6, rows: 6, width: 192, height: 192, bg: "#CFD8DC" } as const;
export const SCENE_MIN = 512;

export const SPEC_RULES = [
  "Ô 32×32 px · tấm 6 cột × 6 hàng = 192×192 px",
  "PNG không nén mất dữ liệu · hiển thị nearest-neighbor",
  "Nền phẳng #CFD8DC (bản chạy thật: nền trong suốt)",
  "Không chữ · không nhãn · không kẻ lưới",
  "Tối đa 32 màu chung · viền tối 1 px · sáng từ trên-trái",
  "Nhìn ngang, quay phải · chân trên đường nền y = 30",
  "Không giải phẫu cơ/xương, không máu me",
];

export const COAT_PALETTE = {
  columns: ["Bay (gốc)", "Chestnut", "Black", "Gray"],
  rows: [
    ["Thân · sáng", "#B85C38", "#E28743", "#38383F", "#ECECEC"],
    ["Thân · vừa", "#8B3C1B", "#B2531B", "#24242A", "#CDCDCD"],
    ["Thân · tối", "#5A2510", "#7E3108", "#121216", "#9B9B9B"],
    ["Thân · bóng", "#D77B54", "#F0A15E", "#4E4E57", "#FFFFFF"],
    ["Bờm/đuôi · sáng", "#2E2E2E", "#ECC082", "#47474E", "#A8A8A8"],
    ["Bờm/đuôi · tối", "#141414", "#B07C3D", "#1D1D21", "#737373"],
    ["Cẳng/móng · sáng", "#212121", "#8A3D16", "#323238", "#8E8E8E"],
    ["Cẳng/móng · tối", "#0D0D0D", "#5C280C", "#17171C", "#5A5A5A"],
  ],
};

export const SILK_PALETTE = {
  columns: ["Làn 1 (gốc)", "Làn 2", "Làn 3", "Làn 4", "Làn 5", "Làn 6"],
  rows: [
    ["Áo chính", "#D32F2F", "#1976D2", "#388E3C", "#F57C00", "#7B1FA2", "#FBC02D"],
    ["Áo phụ / sọc", "#FFFFFF", "#FFEB3B", "#FFFFFF", "#212121", "#FFFFFF", "#1A237E"],
    ["Mũ bảo hiểm", "#D32F2F", "#1976D2", "#388E3C", "#F57C00", "#7B1FA2", "#FBC02D"],
  ],
};

export const STALL_PALETTE = {
  columns: ["Gốc (placeholder)", "Đủ điều kiện", "Cần theo dõi", "Chấn thương", "Cách ly"],
  rows: [["Viền ô chuồng", "#00E5FF", "#2ECC71", "#F1C40F", "#E74C3C", "#9B59B6"]],
};

// ------------------------------------------------------------------ Kết quả duyệt của chủ dự án (19/10/2026)
// Dùng làm giá trị mặc định cho màn Tổng quan; thao tác duyệt mới trong trình duyệt sẽ ghi đè (localStorage).

export const DEFAULT_REVIEWS: Record<string, { status: "OK" | "FIX" | "DROP"; comment: string }> = {
  P0: { status: "DROP", comment: "" },
  P0b: { status: "OK", comment: "" },
  S01: { status: "OK", comment: "" },
  S06: { status: "OK", comment: "" },
  S07: { status: "OK", comment: "" },
  S08: { status: "OK", comment: "" },
  S09: { status: "OK", comment: "" },
  S10: { status: "OK", comment: "" },
  S11: { status: "OK", comment: "" },
  S12: { status: "OK", comment: "" },
  S13: { status: "OK", comment: "" },
  S14: { status: "OK", comment: "" },
  S15: { status: "FIX", comment: "Có thể bổ sung các detail này trong phần dashboard chính (đã đưa người đẩy xe cút kít vào bản đồ trang trại)." },
  M1: {
    status: "OK",
    comment:
      "Trang chính chạy mượt; rê chuột vào khu (VD nhà y tế) nổi viền, bấm vào hiển thị khu làm việc tương ứng; trước khi chuyển trang mờ dần toàn bộ rồi chuyển cảnh.",
  },
  M2: { status: "OK", comment: "Giống M1 (bản ban đêm)." },
  M3: { status: "OK", comment: "Thêm chướng ngại / dựng sân trước khi chạy thử; bỏ HLV khỏi khung hình." },
  M4: { status: "OK", comment: "Thêm hoạt ảnh khi chạy và hiển thị danh sách thật." },
  M5: { status: "DROP", comment: "Không đi sâu khám bệnh ở Simulator — phần làm việc chính ở Main Web." },
  "G1-A": { status: "OK", comment: "" },
  "G1-B": { status: "OK", comment: "" },
  "G1-C": { status: "OK", comment: "" },
  "G1-D": { status: "DROP", comment: "" },
};
