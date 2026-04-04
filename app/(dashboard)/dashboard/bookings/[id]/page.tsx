"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Copy, Download, Phone, Mail, MapPin,
  Loader2, CheckCircle2, MessageCircle, Send,
  Pencil, Trash2, RotateCcw, X, Check, AlertTriangle, Share2,
  Receipt, FileText,
} from "lucide-react";
import { STATUS_CONFIG, SERVICE_TYPES } from "@/types";
import type { Booking, BookingStatus } from "@/types";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import ReceiptInvoiceModal from "@/components/ReceiptInvoiceModal";

interface EditForm {
  client_name: string;
  client_phone: string;
  client_email: string;
  client_location: string;
  service_type: string;
  description: string;
  project_value: string;
  commission_earned: string;
  status: BookingStatus;
  notes: string;
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [viewerRole, setViewerRole] = useState<"rep" | "manager" | "owner">("rep");
  const [repName, setRepName] = useState("");
  const [repPhone, setRepPhone] = useState("");
  const [docModal, setDocModal] = useState<"receipt" | "invoice" | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteNote, setDeleteNote] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchBooking() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [{ data: profile }, { data, error }] = await Promise.all([
        supabase.from("sales_reps").select("role, full_name, phone").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("sales_bookings").select("*").eq("id", id).maybeSingle(),
      ]);

      if (profile?.role) setViewerRole(profile.role as "rep" | "manager" | "owner");
      if (profile?.full_name) setRepName(profile.full_name);
      if (profile?.phone)     setRepPhone(profile.phone);

      if (error || !data) {
        toast.error("Booking not found");
        router.back();
        return;
      }

      setBooking(data);
      setLoading(false);
    }
    fetchBooking();
  }, [id, router]);

  const isAdmin = viewerRole === "manager" || viewerRole === "owner";

  function enterEditMode() {
    if (!booking) return;
    const details = booking.service_details as { description?: string };
    setEditForm({
      client_name: booking.client_name,
      client_phone: booking.client_phone,
      client_email: booking.client_email || "",
      client_location: booking.client_location || "",
      service_type: booking.service_type,
      description: details?.description || "",
      project_value: String(booking.project_value),
      commission_earned: String(booking.commission_earned),
      status: booking.status,
      notes: booking.notes || "",
    });
    setEditMode(true);
  }

  async function saveEdits() {
    if (!booking || !editForm) return;
    setSaving(true);
    const supabase = createClient();
    const updates = {
      client_name: editForm.client_name.trim(),
      client_phone: editForm.client_phone.trim(),
      client_email: editForm.client_email.trim() || null,
      client_location: editForm.client_location.trim() || null,
      service_type: editForm.service_type,
      service_details: { description: editForm.description.trim() },
      project_value: parseFloat(editForm.project_value) || 0,
      commission_earned: parseFloat(editForm.commission_earned) || 0,
      status: editForm.status,
      notes: editForm.notes.trim() || null,
      is_edited: true,
      edited_by_admin: isAdmin,
      edited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("sales_bookings")
      .update(updates)
      .eq("id", booking.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to save changes");
    } else {
      setBooking({
        ...booking,
        ...updates,
        service_details: updates.service_details,
      });
      setEditMode(false);
      toast.success("Changes saved!");
    }
  }

  async function confirmDelete() {
    if (!booking || !deleteNote.trim()) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("sales_bookings")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        delete_note: deleteNote.trim(),
      })
      .eq("id", booking.id);

    setDeleting(false);
    if (error) {
      toast.error("Failed to delete booking");
    } else {
      toast.success("Booking deleted");
      router.push(isAdmin ? "/admin" : "/dashboard");
    }
  }

  async function addNote() {
    if (!booking || !newNote.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const updatedNotes = booking.notes
      ? `${booking.notes}\n\n[${new Date().toLocaleDateString()}] ${newNote}`
      : `[${new Date().toLocaleDateString()}] ${newNote}`;

    const { error } = await supabase
      .from("sales_bookings")
      .update({ notes: updatedNotes })
      .eq("id", booking.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to save note");
    } else {
      setBooking({ ...booking, notes: updatedNotes });
      setNewNote("");
      toast.success("Note added!");
    }
  }

  function copyDetails() {
    if (!booking) return;
    const details = booking.service_details as { description?: string };
    const text = [
      `CLIENT: ${booking.client_name}`,
      `PHONE: ${booking.client_phone}`,
      booking.client_email ? `EMAIL: ${booking.client_email}` : null,
      booking.client_location ? `LOCATION: ${booking.client_location}` : null,
      ``,
      `SERVICE: ${booking.service_type}`,
      details?.description ? `DETAILS: ${details.description}` : null,
      ``,
      `STATUS: ${STATUS_CONFIG[booking.status as BookingStatus].label}`,
      booking.notes ? `\nNOTES: ${booking.notes}` : null,
      ``,
      `--- Westline Techlabs Sales Portal ---`,
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  }

  function generatePDFBlob(): Blob {
    if (!booking) throw new Error("No booking");
    const details = booking.service_details as { description?: string };
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();

    // Header bar
    doc.setFillColor(10, 7, 0);
    doc.rect(0, 0, w, 40, "F");
    doc.setFillColor(245, 168, 0);
    doc.rect(0, 38, w, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(245, 168, 0);
    doc.text("WESTLINE TECHLABS", 20, 18);
    doc.setFontSize(9);
    doc.setTextColor(180, 170, 150);
    doc.text("Design. Build. Deliver.", 20, 26);
    doc.setFontSize(8);
    doc.text("BOOKING DETAILS", 20, 34);

    let y = 55;

    function section(title: string) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(245, 168, 0);
      doc.text(title, 20, y);
      y += 2;
      doc.setDrawColor(245, 168, 0);
      doc.setLineWidth(0.3);
      doc.line(20, y, w - 20, y);
      y += 8;
    }

    function row(label: string, value: string) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(130, 120, 110);
      doc.text(label, 20, y);
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      const lines = doc.splitTextToSize(value, w - 80);
      doc.text(lines, 70, y);
      y += 6 * lines.length + 2;
    }

    section("CLIENT INFORMATION");
    row("Name", booking.client_name);
    row("Phone", booking.client_phone);
    if (booking.client_email) row("Email", booking.client_email);
    if (booking.client_location) row("Location", booking.client_location);
    y += 4;

    section("SERVICE");
    row("Type", booking.service_type);
    if (details?.description) row("Details", details.description);
    row("Status", STATUS_CONFIG[booking.status as BookingStatus].label);
    y += 4;

    section("FINANCIALS");
    row("Project Value", `₵${booking.project_value.toLocaleString()}`);
    row("Commission", `₵${booking.commission_earned}`);
    y += 4;

    if (booking.notes) {
      section("NOTES");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const noteLines = doc.splitTextToSize(booking.notes, w - 40);
      doc.text(noteLines, 20, y);
      y += 6 * noteLines.length;
    }

    // Footer
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(20, pageH - 20, w - 20, pageH - 20);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} | Westline Techlabs Sales Portal`,
      20,
      pageH - 14
    );

    return doc.output("blob");
  }

  function downloadPDF() {
    if (!booking) return;
    const blob = generatePDFBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booking-${booking.client_name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("PDF downloaded!");
  }

  async function sharePDF() {
    if (!booking) return;
    const blob = generatePDFBlob();
    const fileName = `booking-${booking.client_name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
    const file = new File([blob], fileName, { type: "application/pdf" });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Booking – ${booking.client_name}`,
          text: `${booking.service_type} booking for ${booking.client_name}`,
          files: [file],
        });
      } catch {
        // User cancelled share sheet — do nothing
      }
    } else {
      // Fallback to download if Web Share not supported
      downloadPDF();
      toast("Sharing not supported on this device — PDF downloaded.");
    }
  }

  if (loading || !booking) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={28} className="animate-spin" style={{ color: "#F5A800" }} />
      </div>
    );
  }

  const status = STATUS_CONFIG[booking.status as BookingStatus];
  const details = booking.service_details as { description?: string };
  const whatsappUrl = `https://wa.me/${booking.client_phone.replace(/[\s\-\(\)]/g, "")}`;

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto animate-fade-in">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm mb-6"
        style={{ color: "var(--text-40)" }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Restored banner */}
      {booking.is_restored && (
        <div
          className="flex items-center gap-3 p-3 rounded-xl mb-4"
          style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}
        >
          <RotateCcw size={14} style={{ color: "#a855f7" }} />
          <p className="text-xs font-medium" style={{ color: "#a855f7" }}>
            Restored{booking.restored_at ? ` · ${new Date(booking.restored_at).toLocaleDateString()}` : ""}
          </p>
        </div>
      )}

      {/* Edited banner */}
      {booking.is_edited && !booking.is_restored && (
        <div
          className="flex items-center gap-3 p-3 rounded-xl mb-4"
          style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)" }}
        >
          <Pencil size={13} style={{ color: "#3b82f6" }} />
          <p className="text-xs" style={{ color: "rgba(59,130,246,0.8)" }}>
            {booking.edited_by_admin ? "Edited by admin" : "Edited"}
            {booking.edited_at ? ` · ${new Date(booking.edited_at).toLocaleDateString()}` : ""}
          </p>
        </div>
      )}

      {/* Completed banner (only if not edited/restored) */}
      {booking.status === "completed" && !booking.is_edited && !booking.is_restored && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl mb-6"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
        >
          <CheckCircle2 size={20} style={{ color: "#22c55e" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#22c55e" }}>Completed</p>
            <p className="text-xs" style={{ color: "rgba(34,197,94,0.6)" }}>
              {new Date(booking.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          {editMode && editForm ? (
            <input
              value={editForm.client_name}
              onChange={(e) => setEditForm((f) => f ? { ...f, client_name: e.target.value } : f)}
              className="input-dark text-2xl font-bold w-full"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            />
          ) : (
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}
            >
              {booking.client_name}
            </h1>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
              style={{ borderColor: "var(--border-10)" }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              <span className={status.color}>{status.label}</span>
            </span>
            <span className="text-xs" style={{ color: "var(--text-30)" }}>
              {new Date(booking.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap shrink-0">
          {!editMode ? (
            <>
              <button onClick={copyDetails} className="btn-ghost text-xs">
                <Copy size={14} /> Copy
              </button>
              <button onClick={downloadPDF} className="btn-ghost text-xs">
                <Download size={14} /> PDF
              </button>
              <button onClick={sharePDF} className="btn-ghost text-xs">
                <Share2 size={14} /> Share
              </button>
              <button onClick={() => setDocModal("receipt")} className="btn-ghost text-xs">
                <Receipt size={14} /> Receipt
              </button>
              <button onClick={() => setDocModal("invoice")} className="btn-ghost text-xs">
                <FileText size={14} /> Invoice
              </button>
              <button onClick={enterEditMode} className="btn-gold text-xs">
                <Pencil size={14} /> Edit
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditMode(false)} className="btn-ghost text-xs">
                <X size={14} /> Cancel
              </button>
              <button onClick={saveEdits} disabled={saving} className="btn-gold text-xs">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Client info */}
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--gold-50)" }}>
            Client Information
          </p>
          {editMode && editForm ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--text-40)" }}>Phone</label>
                <input
                  value={editForm.client_phone}
                  onChange={(e) => setEditForm((f) => f ? { ...f, client_phone: e.target.value } : f)}
                  className="input-dark"
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--text-40)" }}>Email</label>
                <input
                  value={editForm.client_email}
                  onChange={(e) => setEditForm((f) => f ? { ...f, client_email: e.target.value } : f)}
                  className="input-dark"
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--text-40)" }}>Location</label>
                <input
                  value={editForm.client_location}
                  onChange={(e) => setEditForm((f) => f ? { ...f, client_location: e.target.value } : f)}
                  className="input-dark"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone size={15} style={{ color: "var(--text-30)" }} />
                <a
                  href={`tel:${booking.client_phone}`}
                  className="text-sm hover:underline"
                  style={{ color: "var(--text)" }}
                >
                  {booking.client_phone}
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: "rgba(37,211,102,0.15)", color: "#25d366" }}
                >
                  <MessageCircle size={11} /> WhatsApp
                </a>
              </div>
              {booking.client_email && (
                <div className="flex items-center gap-3">
                  <Mail size={15} style={{ color: "var(--text-30)" }} />
                  <a
                    href={`mailto:${booking.client_email}`}
                    className="text-sm hover:underline"
                    style={{ color: "var(--text)" }}
                  >
                    {booking.client_email}
                  </a>
                </div>
              )}
              {booking.client_location && (
                <div className="flex items-center gap-3">
                  <MapPin size={15} style={{ color: "var(--text-30)" }} />
                  <span className="text-sm" style={{ color: "var(--text)" }}>{booking.client_location}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Service */}
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--gold-50)" }}>
            Service
          </p>
          {editMode && editForm ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--text-40)" }}>Service Type</label>
                <select
                  value={editForm.service_type}
                  onChange={(e) => setEditForm((f) => f ? { ...f, service_type: e.target.value } : f)}
                  className="input-dark"
                >
                  {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--text-40)" }}>Details</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => f ? { ...f, description: e.target.value } : f)}
                  className="input-dark resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--text-40)" }}>Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => f ? { ...f, status: e.target.value as BookingStatus } : f)}
                  className="input-dark"
                >
                  {(["new", "in_progress", "completed", "cancelled"] as BookingStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "var(--gold-10)", color: "#F5A800", border: "1px solid var(--gold-15)" }}
                >
                  {booking.service_type}
                </span>
              </div>
              {details?.description && (
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-60)" }}>
                  {details.description}
                </p>
              )}
            </>
          )}
        </div>

        {/* Financials */}
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--gold-50)" }}>
            Financials
          </p>
          {editMode && editForm ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--text-40)" }}>Project Value (₵)</label>
                <input
                  type="number"
                  value={editForm.project_value}
                  onChange={(e) => setEditForm((f) => f ? { ...f, project_value: e.target.value } : f)}
                  className="input-dark"
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--text-40)" }}>Commission (₵)</label>
                <input
                  type="number"
                  value={editForm.commission_earned}
                  onChange={(e) => setEditForm((f) => f ? { ...f, commission_earned: e.target.value } : f)}
                  className="input-dark"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs" style={{ color: "var(--text-35)" }}>Project Value</p>
                <p
                  className="text-xl font-bold mt-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}
                >
                  ₵{booking.project_value.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-35)" }}>
                  {isAdmin ? "Commission" : "Your Commission"}
                </p>
                <p
                  className="text-xl font-bold mt-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F5A800" }}
                >
                  ₵{booking.commission_earned}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--gold-50)" }}>
            Notes
          </p>
          {editMode && editForm ? (
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm((f) => f ? { ...f, notes: e.target.value } : f)}
              className="input-dark resize-none w-full"
              rows={4}
              placeholder="Add notes..."
            />
          ) : (
            <>
              {booking.notes ? (
                <div
                  className="text-sm leading-relaxed whitespace-pre-wrap mb-4"
                  style={{ color: "var(--text-60)" }}
                >
                  {booking.notes}
                </div>
              ) : (
                <p className="text-sm mb-4" style={{ color: "var(--text-25)" }}>
                  No notes yet
                </p>
              )}
              <div className="flex gap-2">
                <input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a follow-up note..."
                  className="input-dark flex-1"
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                />
                <button
                  onClick={addNote}
                  disabled={saving || !newNote.trim()}
                  className="btn-gold px-4"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Delete / Danger Zone */}
        {!editMode && (
          <div className="glass-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "rgba(239,68,68,0.5)" }}>
              Danger Zone
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-danger"
              >
                <Trash2 size={14} /> Delete Booking
              </button>
            ) : (
              <div className="space-y-3">
                <div
                  className="flex items-start gap-2 p-3 rounded-xl"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
                >
                  <AlertTriangle size={15} style={{ color: "#ef4444" }} className="shrink-0 mt-0.5" />
                  <p className="text-xs" style={{ color: "rgba(239,68,68,0.8)" }}>
                    This booking will be moved to the bin. You must provide a reason.
                  </p>
                </div>
                <textarea
                  value={deleteNote}
                  onChange={(e) => setDeleteNote(e.target.value)}
                  placeholder="Reason for deletion (required)..."
                  className="input-dark resize-none w-full"
                  rows={3}
                  style={{ borderColor: deleteNote.trim() ? undefined : "rgba(239,68,68,0.3)" }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteNote(""); }}
                    className="btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleting || !deleteNote.trim()}
                    className="btn-danger flex-1"
                  >
                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Confirm Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {docModal && (
        <ReceiptInvoiceModal
          booking={booking}
          type={docModal}
          repName={repName}
          repPhone={repPhone}
          onClose={() => setDocModal(null)}
        />
      )}
    </div>
  );
}
