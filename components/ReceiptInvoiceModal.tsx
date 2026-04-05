"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Download, Share2, FileText, Receipt } from "lucide-react";
import { jsPDF } from "jspdf";
import type { Booking } from "@/types";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Props {
  booking: Booking;
  type: "receipt" | "invoice";
  repName: string;
  repPhone?: string;
  onClose: () => void;
}

interface DocForm {
  docType: "receipt" | "invoice";
  pdfTheme: "dark" | "light";
  docNumber: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  serviceDescription: string;
  amount: string;
  vatPercent: string;
  paymentMethod: string;
  notes: string;
  repName: string;
  repPhone: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function buildDocNumber(type: "receipt" | "invoice"): string {
  const prefix = type === "receipt" ? "RCP" : "INV";
  const today = todayISO().replace(/-/g, "");
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `${prefix}-${today}-${seq}`;
}

function toBase64(url: string): Promise<string> {
  return fetch(url)
    .then((r) => r.blob())
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );
}

// ─── PDF generator ──────────────────────────────────────────────────────────

function generatePDF(form: DocForm, logoB64: string | null, markB64: string | null): Blob {
  const dark = form.pdfTheme === "dark";
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();   // 210
  const pageH = doc.internal.pageSize.getHeight();  // 297

  const GOLD    = [245, 168, 0]     as [number, number, number];
  const BG      = (dark ? [10, 7, 0]       : [255, 255, 255]) as [number, number, number];
  const TEXT    = (dark ? [232, 228, 220]   : [28, 26, 18])   as [number, number, number];
  const MUTED   = (dark ? [160, 148, 120]   : [110, 102, 80]) as [number, number, number];
  const SURFACE = (dark ? [24, 20, 4]       : [248, 244, 236]) as [number, number, number];
  const BORDER  = (dark ? [50, 44, 20]      : [220, 212, 190]) as [number, number, number];

  // ── Fill background ────────────────────────────────────────────────────
  doc.setFillColor(...BG);
  doc.rect(0, 0, pageW, pageH, "F");

  // ── Diagonal watermark (favicon) ──────────────────────────────────────
  if (markB64) {
    try {
      doc.saveGraphicsState();
      // @ts-expect-error – jsPDF GState is accessible via doc.GState
      const gs = new doc.GState({ opacity: dark ? 0.055 : 0.04, "fill-opacity": dark ? 0.055 : 0.04 });
      doc.setGState(gs);
      // Rotate around page center
      const cx = pageW / 2;
      const cy = pageH / 2;
      const sz = 130;
      // Apply 45° rotation via internal transform
      const rad = (-45 * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      // jsPDF supports transform via internal matrix – use addImage with rotation via canvas workaround:
      // Instead, place three watermarks diagonally tiled for coverage
      const positions = [
        [cx - sz / 2, cy - sz / 2],
        [cx - sz / 2 - 60, cy - sz / 2 - 70],
        [cx - sz / 2 + 60, cy - sz / 2 + 70],
      ];
      for (const [x, y] of positions) {
        doc.addImage(markB64, "PNG", x, y, sz, sz);
      }
      doc.restoreGraphicsState();
      // Suppress unused variable warnings
      void cos; void sin;
    } catch {
      // Watermark failure is non-fatal
    }
  }

  // ── Header bar ────────────────────────────────────────────────────────
  const HEADER_H = 48;
  doc.setFillColor(...(dark ? [16, 12, 2] as [number, number, number] : [20, 16, 4] as [number, number, number]));
  doc.rect(0, 0, pageW, HEADER_H, "F");

  // Gold accent strip at bottom of header
  doc.setFillColor(...GOLD);
  doc.rect(0, HEADER_H - 1.5, pageW, 1.5, "F");

  // Logo image in header
  const LOGO_H = 16;
  const LOGO_W = 48;
  const LOGO_X = 14;
  const LOGO_Y = (HEADER_H - LOGO_H) / 2 - 2;
  if (logoB64) {
    try {
      doc.addImage(logoB64, "PNG", LOGO_X, LOGO_Y, LOGO_W, LOGO_H);
    } catch {
      // Fallback: text logo
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...GOLD);
      doc.text("WESTLINE", LOGO_X, LOGO_Y + 10);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...GOLD);
    doc.text("WESTLINE TECHLABS", LOGO_X, LOGO_Y + 10);
  }

  // Tagline below logo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text("Design. Build. Deliver.", LOGO_X, LOGO_Y + LOGO_H + 3);

  // Doc type label (right side of header)
  const docLabel = form.docType === "receipt" ? "RECEIPT" : "INVOICE";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...GOLD);
  doc.text(docLabel, pageW - 14, 22, { align: "right" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(`#${form.docNumber}`, pageW - 14, 32, { align: "right" });
  doc.text(`Issued: ${fmtDate(form.issueDate)}`, pageW - 14, 38, { align: "right" });

  // ── Section helpers ───────────────────────────────────────────────────
  let y = HEADER_H + 14;

  function sectionLabel(title: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...GOLD);
    doc.text(title.toUpperCase(), 14, y);
    y += 2;
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.25);
    doc.line(14, y, pageW - 14, y);
    y += 5;
  }

  function kv(label: string, value: string, xLabel = 14, xValue = 55, bold = false) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(label, xLabel, y);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...TEXT);
    const lines = doc.splitTextToSize(value, pageW / 2 - xValue - 6);
    doc.text(lines, xValue, y);
    y += 5.5 * lines.length;
  }

  // ── Bill From / Bill To (two columns) ────────────────────────────────
  const COL_MID = pageW / 2 + 4;
  const Y_PARTY_START = y;

  // Left: Bill From
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD);
  doc.text("BILL FROM", 14, y);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.25);
  doc.line(14, y + 1.5, COL_MID - 8, y + 1.5);

  // Right: Bill To
  doc.text("BILL TO", COL_MID, y);
  doc.line(COL_MID, y + 1.5, pageW - 14, y + 1.5);
  y += 7;

  // From details
  const fromY = y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT);
  doc.text("Westline Techlabs", 14, y);
  y += 5.5;

  if (form.repName) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text("Sales Rep:", 14, y);
    doc.setTextColor(...TEXT);
    doc.text(form.repName, 36, y);
    y += 5.5;
  }
  if (form.repPhone) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text("Phone:", 14, y);
    doc.setTextColor(...TEXT);
    doc.text(form.repPhone, 36, y);
    y += 5.5;
  }

  const fromEndY = y;

  // To details
  y = fromY;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT);
  doc.text(form.clientName, COL_MID, y);
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  if (form.clientPhone) {
    doc.setTextColor(...MUTED);
    doc.text("Phone:", COL_MID, y);
    doc.setTextColor(...TEXT);
    doc.text(form.clientPhone, COL_MID + 22, y);
    y += 5.5;
  }
  if (form.clientEmail) {
    doc.setTextColor(...MUTED);
    doc.text("Email:", COL_MID, y);
    doc.setTextColor(...TEXT);
    const emailLines = doc.splitTextToSize(form.clientEmail, pageW - 14 - (COL_MID + 22));
    doc.text(emailLines, COL_MID + 22, y);
    y += 5.5 * emailLines.length;
  }
  if (form.clientAddress) {
    doc.setTextColor(...MUTED);
    doc.text("Address:", COL_MID, y);
    doc.setTextColor(...TEXT);
    const addrLines = doc.splitTextToSize(form.clientAddress, pageW - 14 - (COL_MID + 22));
    doc.text(addrLines, COL_MID + 22, y);
    y += 5.5 * addrLines.length;
  }

  const toEndY = y;
  y = Math.max(fromEndY, toEndY) + 10;

  // ── Service table ─────────────────────────────────────────────────────
  sectionLabel("Services");

  // Table header
  const TABLE_L = 14;
  const TABLE_R = pageW - 14;
  const TABLE_W = TABLE_R - TABLE_L;
  const COL_DESC_W = TABLE_W * 0.68;
  const COL_AMT_X = TABLE_L + COL_DESC_W;
  const ROW_H = 8;

  // Header row fill
  doc.setFillColor(...SURFACE);
  doc.rect(TABLE_L, y - 1, TABLE_W, ROW_H, "F");

  // Header row border
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.rect(TABLE_L, y - 1, TABLE_W, ROW_H, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("DESCRIPTION", TABLE_L + 3, y + 4);
  doc.text("AMOUNT", COL_AMT_X + 3, y + 4);
  y += ROW_H + 1;

  const amount = parseFloat(form.amount) || 0;
  const vatPct = parseFloat(form.vatPercent) || 0;
  const vatAmt = vatPct > 0 ? (amount * vatPct) / 100 : 0;
  const total  = amount + vatAmt;

  // Service row
  const descLines = doc.splitTextToSize(form.serviceDescription || "Professional Services", COL_DESC_W - 6);
  const serviceRowH = Math.max(ROW_H, 5.5 * descLines.length + 4);

  doc.setFillColor(...BG);
  doc.rect(TABLE_L, y - 1, TABLE_W, serviceRowH, "F");
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.15);
  doc.line(TABLE_L, y - 1 + serviceRowH, TABLE_R, y - 1 + serviceRowH);
  // Vertical divider
  doc.line(COL_AMT_X, y - 1, COL_AMT_X, y - 1 + serviceRowH);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT);
  doc.text(descLines, TABLE_L + 3, y + 4);
  doc.text(`GH\u20B5${amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`, COL_AMT_X + 3, y + 4);
  y += serviceRowH + 1;

  // VAT row
  if (vatPct > 0) {
    doc.setFillColor(...BG);
    doc.rect(TABLE_L, y - 1, TABLE_W, ROW_H, "F");
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.15);
    doc.line(TABLE_L, y - 1 + ROW_H, TABLE_R, y - 1 + ROW_H);
    doc.line(COL_AMT_X, y - 1, COL_AMT_X, y - 1 + ROW_H);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(`VAT (${vatPct}%)`, TABLE_L + 3, y + 4);
    doc.setTextColor(...TEXT);
    doc.text(`GH\u20B5${vatAmt.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`, COL_AMT_X + 3, y + 4);
    y += ROW_H + 1;
  }

  // Total row
  doc.setFillColor(...GOLD);
  doc.rect(TABLE_L, y - 1, TABLE_W, ROW_H + 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(10, 7, 0);
  doc.text("TOTAL", TABLE_L + 3, y + 5);
  doc.text(
    `GH\u20B5${total.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`,
    COL_AMT_X + 3,
    y + 5
  );
  y += ROW_H + 6;

  // ── Payment method ────────────────────────────────────────────────────
  if (form.paymentMethod.trim()) {
    y += 4;
    sectionLabel("Payment Information");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text("Payment via:", 14, y);
    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "bold");
    doc.text(form.paymentMethod, 44, y);
    y += 9;
  }

  // ── Due date (invoice only) ───────────────────────────────────────────
  if (form.docType === "invoice" && form.dueDate) {
    y += 2;
    // Highlighted due date box
    doc.setFillColor(...(dark ? [30, 18, 0] as [number, number, number] : [255, 244, 220] as [number, number, number]));
    doc.setDrawColor(245, 168, 0);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, y - 3, pageW - 28, 14, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...GOLD);
    doc.text("Payment Due:", 20, y + 5);
    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "normal");
    doc.text(fmtDate(form.dueDate), 58, y + 5);
    y += 18;
  }

  // ── Notes ─────────────────────────────────────────────────────────────
  if (form.notes.trim()) {
    y += 2;
    sectionLabel("Notes");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT);
    const noteLines = doc.splitTextToSize(form.notes, pageW - 28);
    doc.text(noteLines, 14, y);
    y += 5.5 * noteLines.length + 4;
  }

  // ── Footer ────────────────────────────────────────────────────────────
  const footerY = pageH - 18;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(14, footerY, pageW - 14, footerY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...GOLD);
  doc.text("Thank you for choosing Westline Techlabs", pageW / 2, footerY + 6, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(fmtDate(form.issueDate), pageW / 2, footerY + 11, { align: "center" });

  return doc.output("blob");
}

// ─── Modal component ────────────────────────────────────────────────────────

export default function ReceiptInvoiceModal({ booking, type, repName, repPhone = "", onClose }: Props) {
  const details = booking.service_details as { description?: string };
  const today   = todayISO();

  const [form, setForm] = useState<DocForm>(() => ({
    docType:            type,
    pdfTheme:           "dark",
    docNumber:          buildDocNumber(type),
    issueDate:          today,
    dueDate:            addDaysISO(today, 14),
    clientName:         booking.client_name,
    clientPhone:        booking.client_phone,
    clientEmail:        booking.client_email  || "",
    clientAddress:      booking.client_location || "",
    serviceDescription: [booking.service_type, details?.description].filter(Boolean).join(" — "),
    amount:             String(booking.project_value || ""),
    vatPercent:         "",
    paymentMethod:      "",
    notes:              "",
    repName:            repName,
    repPhone:           repPhone,
  }));

  const [logoB64,  setLogoB64]  = useState<string | null>(null);
  const [markB64,  setMarkB64]  = useState<string | null>(null);
  const [imgReady, setImgReady] = useState(false);
  const [genBusy,  setGenBusy]  = useState(false);

  // Pre-load images when modal mounts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [logo, mark] = await Promise.all([
          toBase64("https://res.cloudinary.com/djayrwxns/image/upload/v1770785602/westline_logo_bmusvy.png"),
          toBase64("https://res.cloudinary.com/djayrwxns/image/upload/v1772931726/westline_favicon_wwht4g.png"),
        ]);
        if (!cancelled) {
          setLogoB64(logo);
          setMarkB64(mark);
          setImgReady(true);
        }
      } catch {
        // Images failed to load — we'll generate PDF without them
        if (!cancelled) setImgReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Sync docNumber prefix when type toggles
  const prevDocType = useRef(form.docType);
  useEffect(() => {
    if (form.docType !== prevDocType.current) {
      prevDocType.current = form.docType;
      setForm((f) => ({ ...f, docNumber: buildDocNumber(f.docType) }));
    }
  }, [form.docType]);

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function setField<K extends keyof DocForm>(key: K, value: DocForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleGenerate(mode: "download" | "share") {
    setGenBusy(true);
    try {
      const blob = generatePDF(form, logoB64, markB64);
      const safeName = form.clientName.replace(/\s+/g, "-").toLowerCase();
      const prefix   = form.docType === "receipt" ? "receipt" : "invoice";
      const fileName = `${prefix}-${safeName}-${form.docNumber}.pdf`;

      if (mode === "share") {
        const file = new File([blob], fileName, { type: "application/pdf" });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${form.docType === "receipt" ? "Receipt" : "Invoice"} – ${form.clientName}`,
            text: `${form.serviceDescription} for ${form.clientName}`,
            files: [file],
          });
          return;
        }
        // Fallback to download
      }

      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href     = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setGenBusy(false);
    }
  }

  // ── Label helper ─────────────────────────────────────────────────────────
  function Label({ children }: { children: React.ReactNode }) {
    return (
      <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--text-40)" }}>
        {children}
      </label>
    );
  }

  // ── Toggle pill component ────────────────────────────────────────────────
  function TogglePill<T extends string>({
    options,
    value,
    onChange,
  }: {
    options: { value: T; label: React.ReactNode }[];
    value: T;
    onChange: (v: T) => void;
  }) {
    return (
      <div
        className="inline-flex rounded-full p-0.5 gap-0.5"
        style={{
          background:  "var(--surface-4)",
          border:      "1px solid var(--border-10)",
        }}
      >
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
            style={
              value === opt.value
                ? { background: "linear-gradient(135deg,#F5A800,#D4920A)", color: "#000", fontWeight: 700 }
                : { color: "var(--text-50)" }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        key="rim-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="rim-card"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          className="glass-card w-full max-w-lg max-h-[92dvh] flex flex-col overflow-hidden"
          style={{ background: "var(--card-form-bg)", border: "1px solid var(--border-10)" }}
        >
          {/* ── Modal Header ───────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{ borderBottom: "1px solid var(--border-8)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--gold-15)", border: "1px solid var(--gold-25)" }}
              >
                {form.docType === "receipt"
                  ? <Receipt size={15} style={{ color: "#F5A800" }} />
                  : <FileText size={15} style={{ color: "#F5A800" }} />}
              </div>
              <div>
                <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>
                  Generate {form.docType === "receipt" ? "Receipt" : "Invoice"}
                </h2>
                <p className="text-xs" style={{ color: "var(--text-40)" }}>
                  {booking.client_name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "var(--surface-4)", color: "var(--text-40)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-40)")}
            >
              <X size={15} />
            </button>
          </div>

          {/* ── Scrollable body ────────────────────────────────────────── */}
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

            {/* Image loading notice */}
            {!imgReady && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: "var(--gold-06)", border: "1px solid var(--gold-15)", color: "var(--text-50)" }}
              >
                <Loader2 size={12} className="animate-spin shrink-0" style={{ color: "#F5A800" }} />
                Loading logo assets for PDF…
              </div>
            )}

            {/* Doc type + theme toggles */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs mb-2 font-medium" style={{ color: "var(--text-40)" }}>Document Type</p>
                <TogglePill
                  options={[
                    { value: "receipt" as const, label: <><Receipt size={11} /> Receipt</> },
                    { value: "invoice" as const, label: <><FileText size={11} /> Invoice</> },
                  ]}
                  value={form.docType}
                  onChange={(v) => setField("docType", v)}
                />
              </div>
              <div>
                <p className="text-xs mb-2 font-medium" style={{ color: "var(--text-40)" }}>PDF Theme</p>
                <TogglePill
                  options={[
                    { value: "dark"  as const, label: "Dark" },
                    { value: "light" as const, label: "Light" },
                  ]}
                  value={form.pdfTheme}
                  onChange={(v) => setField("pdfTheme", v)}
                />
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid var(--border-8)" }} />

            {/* Doc meta */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--gold-50)" }}>
                Document Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Document #</Label>
                  <input
                    className="input-dark"
                    value={form.docNumber}
                    onChange={(e) => setField("docNumber", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Issue Date</Label>
                  <input
                    type="date"
                    className="input-dark"
                    value={form.issueDate}
                    onChange={(e) => setField("issueDate", e.target.value)}
                  />
                </div>
                {form.docType === "invoice" && (
                  <div className="col-span-2 sm:col-span-1">
                    <Label>Due Date</Label>
                    <input
                      type="date"
                      className="input-dark"
                      value={form.dueDate}
                      onChange={(e) => setField("dueDate", e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Client info */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--gold-50)" }}>
                Client Information
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Client Name</Label>
                    <input className="input-dark" value={form.clientName} onChange={(e) => setField("clientName", e.target.value)} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <input className="input-dark" value={form.clientPhone} onChange={(e) => setField("clientPhone", e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Email <span style={{ color: "var(--text-30)" }}>(optional)</span></Label>
                  <input className="input-dark" type="email" value={form.clientEmail} onChange={(e) => setField("clientEmail", e.target.value)} placeholder="client@example.com" />
                </div>
                <div>
                  <Label>Address <span style={{ color: "var(--text-30)" }}>(optional)</span></Label>
                  <input className="input-dark" value={form.clientAddress} onChange={(e) => setField("clientAddress", e.target.value)} placeholder="City, Region" />
                </div>
              </div>
            </div>

            {/* Service & financials */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--gold-50)" }}>
                Service & Financials
              </p>
              <div className="space-y-3">
                <div>
                  <Label>Service Description</Label>
                  <textarea
                    className="input-dark resize-none"
                    rows={2}
                    value={form.serviceDescription}
                    onChange={(e) => setField("serviceDescription", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Amount (₵)</Label>
                    <input
                      type="number"
                      className="input-dark"
                      value={form.amount}
                      onChange={(e) => setField("amount", e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label>VAT % <span style={{ color: "var(--text-30)" }}>(optional)</span></Label>
                    <input
                      type="number"
                      className="input-dark"
                      value={form.vatPercent}
                      onChange={(e) => setField("vatPercent", e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0"
                    />
                  </div>
                </div>
                {/* Live total preview */}
                {form.amount && parseFloat(form.amount) > 0 && (
                  <div
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                    style={{ background: "var(--gold-06)", border: "1px solid var(--gold-15)" }}
                  >
                    <span className="text-xs" style={{ color: "var(--text-50)" }}>Total</span>
                    <span className="text-sm font-bold" style={{ color: "#F5A800" }}>
                      ₵{(
                        parseFloat(form.amount) +
                        (parseFloat(form.vatPercent || "0") / 100) * parseFloat(form.amount)
                      ).toLocaleString("en-GH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Additional info */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--gold-50)" }}>
                Additional Information
              </p>
              <div className="space-y-3">
                <div>
                  <Label>Payment Method <span style={{ color: "var(--text-30)" }}>(optional)</span></Label>
                  <input
                    className="input-dark"
                    value={form.paymentMethod}
                    onChange={(e) => setField("paymentMethod", e.target.value)}
                    placeholder="e.g. Mobile Money, Bank Transfer"
                  />
                </div>
                <div>
                  <Label>Notes <span style={{ color: "var(--text-30)" }}>(optional)</span></Label>
                  <textarea
                    className="input-dark resize-none"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    placeholder="Any additional notes for the client…"
                  />
                </div>
              </div>
            </div>

            {/* Rep info */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--gold-50)" }}>
                Sales Rep
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Rep Name</Label>
                  <input className="input-dark" value={form.repName} onChange={(e) => setField("repName", e.target.value)} />
                </div>
                <div>
                  <Label>Rep Phone <span style={{ color: "var(--text-30)" }}>(optional)</span></Label>
                  <input className="input-dark" value={form.repPhone} onChange={(e) => setField("repPhone", e.target.value)} placeholder="+233..." />
                </div>
              </div>
            </div>

          </div>

          {/* ── Footer actions ─────────────────────────────────────────── */}
          <div
            className="shrink-0 px-5 py-4 flex gap-3"
            style={{ borderTop: "1px solid var(--border-8)" }}
          >
            <button
              onClick={() => handleGenerate("share")}
              disabled={genBusy || !imgReady}
              className="btn-ghost flex-1 text-sm"
            >
              {genBusy ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
              Share
            </button>
            <button
              onClick={() => handleGenerate("download")}
              disabled={genBusy || !imgReady}
              className="btn-gold flex-1 text-sm"
            >
              {genBusy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {imgReady ? "Download PDF" : "Loading…"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
