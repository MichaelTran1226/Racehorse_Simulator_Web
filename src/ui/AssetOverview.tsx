// Tổng quan tài nguyên: đối chiếu 26 ảnh concept với quy chuẩn SRS §11–13, duyệt từng asset trước khi đi sâu.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ASSETS,
  COAT_PALETTE,
  DEFAULT_REVIEWS,
  GROUP_LABEL,
  SCENE_MIN,
  SHEET_SPEC,
  SILK_PALETTE,
  SPEC_RULES,
  STALL_PALETTE,
  type Asset,
  type AssetGroup,
} from "../assets/manifest";
import c from "./AssetOverview.module.css";
import s from "./ui.module.css";

type Review = "TODO" | "OK" | "FIX" | "DROP";
const REVIEW_LABEL: Record<Review, string> = { TODO: "Chưa duyệt", OK: "Hợp lệ", FIX: "Cần sửa", DROP: "Loại" };
const REVIEW_CLASS: Record<Review, string> = { TODO: s.badge, OK: s.FIT, FIX: s.WATCH, DROP: s.INJURED };
type Reviews = Record<string, { status: Review; comment: string }>;

const STORE_KEY = "equiflow.assetReview.v1";
function loadReviews(): Reviews {
  try {
    return { ...DEFAULT_REVIEWS, ...(JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}") as Reviews) };
  } catch {
    return { ...DEFAULT_REVIEWS };
  }
}
function saveReviews(r: Reviews) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(r));
  } catch {
    // trình duyệt chặn lưu trữ: kết quả vẫn xuất được bằng nút "Sao chép kết quả"
  }
}

interface Probe {
  w: number;
  h: number;
  format: string;
  bg: string;
  bgOk: boolean;
}

/** Đọc kích thước + màu nền góc trên-trái để tự kiểm quy chuẩn. */
function useProbe(src: string): Probe | null {
  const [p, setP] = useState<Probe | null>(null);
  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = 4;
      cv.height = 4;
      const ctx = cv.getContext("2d");
      let bg = "?";
      let bgOk = false;
      if (ctx) {
        ctx.drawImage(img, 2, 2, 4, 4, 0, 0, 4, 4);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        bg = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
        bgOk = Math.abs(r - 0xcf) < 14 && Math.abs(g - 0xd8) < 14 && Math.abs(b - 0xdc) < 14;
      }
      if (alive) setP({ w: img.naturalWidth, h: img.naturalHeight, format: src.endsWith(".png") ? "PNG" : "JPEG", bg, bgOk });
    };
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);
  return p;
}

function checksOf(a: Asset, p: Probe | null) {
  if (!p) return [];
  const sheet = a.kind === "SHEET";
  return [
    {
      label: sheet ? `Kích thước ${SHEET_SPEC.width}×${SHEET_SPEC.height}` : `Cảnh từ ${SCENE_MIN} px`,
      ok: sheet ? p.w === SHEET_SPEC.width && p.h === SHEET_SPEC.height : Math.min(p.w, p.h) >= SCENE_MIN,
      actual: `${p.w}×${p.h}`,
    },
    { label: "Định dạng PNG", ok: p.format === "PNG", actual: p.format },
    ...(sheet ? [{ label: `Nền ${SHEET_SPEC.bg}`, ok: p.bgOk, actual: p.bg }] : []),
    ...(sheet ? [{ label: "Tỉ lệ vuông (6×6)", ok: Math.abs(p.w - p.h) <= 2, actual: (p.w / p.h).toFixed(2) }] : []),
  ];
}

const FILTERS: ("ALL" | AssetGroup)[] = ["ALL", "SPRITE", "SCENE", "P0", "G1"];

export function AssetOverview() {
  const [reviews, setReviews] = useState<Reviews>(loadReviews);
  const [group, setGroup] = useState<"ALL" | AssetGroup>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Review>("ALL");
  const [open, setOpen] = useState<Asset | null>(null);
  const [copied, setCopied] = useState(false);

  const review = (code: string) => reviews[code] ?? { status: "TODO" as Review, comment: "" };
  function setReview(code: string, patch: Partial<{ status: Review; comment: string }>) {
    setReviews((r) => {
      const next = { ...r, [code]: { ...review(code), ...patch } };
      saveReviews(next);
      return next;
    });
  }

  const counts = useMemo(() => {
    const out: Record<Review, number> = { TODO: 0, OK: 0, FIX: 0, DROP: 0 };
    ASSETS.forEach((a) => out[(reviews[a.code]?.status ?? "TODO") as Review]++);
    return out;
  }, [reviews]);

  const list = ASSETS.filter(
    (a) => (group === "ALL" || a.group === group) && (statusFilter === "ALL" || review(a.code).status === statusFilter),
  );

  async function exportReviews() {
    const payload = ASSETS.map((a) => ({ code: a.code, name: a.name, ...review(a.code) }));
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Sao chép kết quả duyệt:", text);
    }
  }

  return (
    <div className={c.page}>
      <section className={c.hero}>
        <div>
          <h1 className={c.h1}>Tổng quan tài nguyên đồ họa</h1>
          <p className={s.hint}>
            {ASSETS.length} asset · 26 ảnh trích từ bản chat Godot, đối chiếu quy chuẩn SRS v2.0 §11–13. Duyệt tổng quan trước, sau đó đi
            sâu từng asset hợp lệ.
          </p>
        </div>
        <div className={c.stats}>
          {(Object.keys(REVIEW_LABEL) as Review[]).map((k) => (
            <button
              key={k}
              type="button"
              className={c.stat}
              aria-pressed={statusFilter === k}
              onClick={() => setStatusFilter(statusFilter === k ? "ALL" : k)}
            >
              <span className={c.statNum}>{counts[k]}</span>
              <span className={REVIEW_CLASS[k]}>{REVIEW_LABEL[k]}</span>
            </button>
          ))}
          <button type="button" className={s.primary} onClick={exportReviews}>
            {copied ? "Đã sao chép!" : "Sao chép kết quả duyệt"}
          </button>
        </div>
      </section>

      <div className={c.columns}>
        <div className={c.mainCol}>
          <div className={s.segmented} role="group" aria-label="Lọc nhóm">
            {FILTERS.map((g) => (
              <button key={g} type="button" className={s.segment} aria-pressed={group === g} onClick={() => setGroup(g)}>
                {g === "ALL" ? `Tất cả (${ASSETS.length})` : `${GROUP_LABEL[g]} (${ASSETS.filter((a) => a.group === g).length})`}
              </button>
            ))}
          </div>
          <ul className={c.grid}>
            {list.map((a) => (
              <AssetCard key={a.code} a={a} status={review(a.code).status} onOpen={() => setOpen(a)} onReview={(st) => setReview(a.code, { status: st })} />
            ))}
            {list.length === 0 && <li className={s.hint}>Không có asset nào khớp bộ lọc.</li>}
          </ul>
        </div>

        <aside className={c.sideCol}>
          <section className={s.card}>
            <div className={s.cardHead}>
              <h2 className={s.cardTitle}>Quy chuẩn bàn giao (SRS §11)</h2>
            </div>
            <ul className={c.rules}>
              {SPEC_RULES.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>
          <PaletteCard title="A · Màu lông (8 màu dành riêng)" table={COAT_PALETTE} />
          <PaletteCard title="B · Áo nài theo 6 làn" table={SILK_PALETTE} />
          <PaletteCard title="C · Viền ô chuồng" table={STALL_PALETTE} />
        </aside>
      </div>

      {open && (
        <AssetDetail
          a={open}
          review={review(open.code)}
          onClose={() => setOpen(null)}
          onReview={(patch) => setReview(open.code, patch)}
        />
      )}
    </div>
  );
}

function AssetCard({ a, status, onOpen, onReview }: { a: Asset; status: Review; onOpen: () => void; onReview: (s: Review) => void }) {
  const probe = useProbe(a.files[0].src);
  const checks = checksOf(a, probe);
  const passed = checks.filter((x) => x.ok).length;
  return (
    <li className={c.card} data-status={status}>
      <button type="button" className={c.thumbBtn} onClick={onOpen} aria-label={`Mở chi tiết ${a.code} ${a.name}`}>
        <img className={c.thumb} src={a.files[0].src} alt="" loading="lazy" />
        <span className={c.code}>{a.code}</span>
        <span className={c.index}>#{a.files.map((x) => String(x.index).padStart(2, "0")).join(" · ")}</span>
      </button>
      <div className={c.cardBody}>
        <div className={c.cardTitleRow}>
          <h3 className={c.cardTitle}>{a.name}</h3>
          <span className={REVIEW_CLASS[status]}>{REVIEW_LABEL[status]}</span>
        </div>
        <div className={c.meta}>
          <span>{GROUP_LABEL[a.group]}</span>
          {probe && (
            <span>
              {probe.w}×{probe.h} {probe.format}
            </span>
          )}
          {checks.length > 0 && (
            <span className={passed === checks.length ? c.pass : c.fail}>
              Quy chuẩn {passed}/{checks.length}
            </span>
          )}
        </div>
        <div className={c.tags}>
          {a.usedIn.map((u) => (
            <span key={u} className={c.tag}>
              {u}
            </span>
          ))}
        </div>
        <div className={c.actions} role="group" aria-label={`Duyệt ${a.code}`}>
          {(["OK", "FIX", "DROP"] as Review[]).map((k) => (
            <button key={k} type="button" className={c.reviewBtn} data-kind={k} aria-pressed={status === k} onClick={() => onReview(status === k ? "TODO" : k)}>
              {REVIEW_LABEL[k]}
            </button>
          ))}
        </div>
      </div>
    </li>
  );
}

function AssetDetail({
  a,
  review,
  onClose,
  onReview,
}: {
  a: Asset;
  review: { status: Review; comment: string };
  onClose: () => void;
  onReview: (patch: Partial<{ status: Review; comment: string }>) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [fileIdx, setFileIdx] = useState(0);
  const [grid, setGrid] = useState(a.kind === "SHEET");
  const file = a.files[fileIdx];
  const probe = useProbe(file.src);
  const checks = checksOf(a, probe);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const palette = a.palette === "COAT" ? COAT_PALETTE : a.palette === "SILK" ? SILK_PALETTE : a.palette === "STALL" ? STALL_PALETTE : null;

  return (
    <dialog ref={ref} className={c.dialog} onClose={onClose} aria-labelledby="asset-title">
      <div className={c.dialogHead}>
        <div>
          <span className={c.dialogCode}>{a.code}</span>
          <h2 id="asset-title" className={c.dialogTitle}>
            {a.name}
          </h2>
        </div>
        <button type="button" className={s.btn} onClick={() => ref.current?.close()}>
          Đóng [X]
        </button>
      </div>
      <div className={c.dialogBody}>
        <div className={c.viewer}>
          <div className={c.viewerTools}>
            {a.files.length > 1 &&
              a.files.map((x, i) => (
                <button key={x.src} type="button" className={`${s.btn} ${s.small}`} aria-pressed={i === fileIdx} onClick={() => setFileIdx(i)}>
                  Ảnh #{String(x.index).padStart(2, "0")} · {x.src.endsWith(".png") ? "PNG" : "JPEG"}
                </button>
              ))}
            {a.kind === "SHEET" && (
              <label className={c.check}>
                <input type="checkbox" checked={grid} onChange={(e) => setGrid(e.target.checked)} /> Phủ lưới 6×6 đều (soát lệch ô)
              </label>
            )}
            <a className={c.link} href={file.src} target="_blank" rel="noreferrer">
              Mở ảnh gốc »
            </a>
          </div>
          <div className={c.stage}>
            <div className={c.imgWrap}>
              <img src={file.src} alt={`${a.code} ${a.name}`} className={c.big} />
              {grid && <div className={c.gridOverlay} aria-hidden />}
            </div>
          </div>
        </div>

        <div className={c.info}>
          <section>
            <h3 className={c.h3}>Kiểm tra tự động</h3>
            <ul className={c.checks}>
              {checks.map((x) => (
                <li key={x.label} className={x.ok ? c.pass : c.fail}>
                  {x.ok ? "ĐẠT" : "LỖI"} · {x.label} <span className={c.actual}>({x.actual})</span>
                </li>
              ))}
              <li className={c.manual}>SOÁT · Không chữ / nhãn — soát bằng mắt</li>
              <li className={c.manual}>SOÁT · Chân trên đường nền y = 30 — soát bằng mắt</li>
            </ul>
          </section>
          <section>
            <h3 className={c.h3}>Nội dung theo đề bài</h3>
            <ol className={c.rowsList}>
              {a.rows.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          </section>
          {a.notes.length > 0 && (
            <section>
              <h3 className={c.h3}>Nhận xét khi trích ảnh</h3>
              <ul className={c.notes}>
                {a.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </section>
          )}
          {palette && (
            <div className={c.paletteScroll}>
              <PaletteTable table={palette} />
            </div>
          )}
          <section className={c.reviewBox}>
            <h3 className={c.h3}>Kết luận duyệt</h3>
            <div className={c.actions} role="group" aria-label="Kết luận">
              {(["OK", "FIX", "DROP"] as Review[]).map((k) => (
                <button key={k} type="button" className={c.reviewBtn} data-kind={k} aria-pressed={review.status === k} onClick={() => onReview({ status: review.status === k ? "TODO" : k })}>
                  {REVIEW_LABEL[k]}
                </button>
              ))}
            </div>
            <label className={s.field}>
              Ghi chú cho bước đi sâu
              <textarea
                className={c.textarea}
                rows={3}
                value={review.comment}
                placeholder="VD: H4 phi nước đại cần đúng nhịp K1–K6; bỏ yên ở H1…"
                onChange={(e) => onReview({ comment: e.target.value })}
              />
            </label>
          </section>
        </div>
      </div>
    </dialog>
  );
}

type Table = { columns: string[]; rows: string[][] };

function PaletteTable({ table }: { table: Table }) {
  return (
    <table className={c.palette}>
      <thead>
        <tr>
          <th />
          {table.columns.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map(([label, ...hexes]) => (
          <tr key={label}>
            <th>{label}</th>
            {hexes.map((hex, i) => (
              <td key={i} title={hex}>
                <span className={c.swatch} style={{ background: hex }} />
                <code>{hex}</code>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PaletteCard({ title, table }: { title: string; table: Table }) {
  return (
    <section className={s.card}>
      <div className={s.cardHead}>
        <h2 className={s.cardTitle}>{title}</h2>
      </div>
      <div className={c.paletteScroll}>
        <PaletteTable table={table} />
      </div>
    </section>
  );
}
