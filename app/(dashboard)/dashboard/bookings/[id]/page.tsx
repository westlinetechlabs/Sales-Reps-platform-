"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Copy, Download, Phone, Mail, MapPin,
  Loader2, CheckCircle2, MessageCircle, Send,
} from "lucide-react";
import { STATUS_CONFIG } from "@/types";
import type { Booking, BookingStatus } from "@/types";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sales_bookings")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        toast.error("Booking not found");
        router.push("/dashboard");
        return;
      }

      setBooking(data);
      setLoading(false);
    }
    fetch();
  }, [id, router]);

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
      `VALUE: ₵${booking.project_value.toLocaleString()}`,
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

  function downloadPDF() {
    if (!booking) return;
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

    // Section helper
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
    y += 4;

    section("FINANCIALS");
    row("Value", `₵${booking.project_value.toLocaleString()}`);
    row("Commission", `₵${booking.commission_earned}`);
    row("Status", STATUS_CONFIG[booking.status as BookingStatus].label);
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

    doc.save(`booking-${booking.client_name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    toast.success("PDF downloaded!");
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
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm mb-6 pt-12 lg:pt-0"
        style={{ color: "rgba(232,228,220,0.4)" }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      {/* Completed banner */}
      {booking.status === "completed" && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl mb-6"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
        >
          <CheckCircle2 size={20} style={{ color: "#22c55e" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#22c55e" }}>Completed</p>
            <p className="text-xs" style={{ color: "rgba(34,197,94,0.6)" }}>
              Completed on {new Date(booking.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {booking.client_name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              <span className={status.color}>{status.label}</span>
            </span>
            <span className="text-xs" style={{ color: "rgba(232,228,220,0.3)" }}>
              {new Date(booking.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={copyDetails} className="btn-ghost text-xs">
            <Copy size={14} /> Copy Details
          </button>
          <button onClick={downloadPDF} className="btn-gold text-xs">
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Client info */}
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "rgba(245,168,0,0.5)" }}>
            Client Information
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone size={15} style={{ color: "rgba(232,228,220,0.3)" }} />
              <a
                href={`tel:${booking.client_phone}`}
                className="text-sm text-white hover:underline"
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
                <Mail size={15} style={{ color: "rgba(232,228,220,0.3)" }} />
                <a href={`mailto:${booking.client_email}`} className="text-sm text-white hover:underline">
                  {booking.client_email}
                </a>
              </div>
            )}
            {booking.client_location && (
              <div className="flex items-center gap-3">
                <MapPin size={15} style={{ color: "rgba(232,228,220,0.3)" }} />
                <span className="text-sm text-white">{booking.client_location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Service details */}
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "rgba(245,168,0,0.5)" }}>
            Service
          </p>
          <div className="flex items-center gap-3 mb-3">
            <span
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(245,168,0,0.1)", color: "#F5A800", border: "1px solid rgba(245,168,0,0.15)" }}
            >
              {booking.service_type}
            </span>
          </div>
          {details?.description && (
            <p className="text-sm leading-relaxed" style={{ color: "rgba(232,228,220,0.6)" }}>
              {details.description}
            </p>
          )}
        </div>

        {/* Financials */}
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "rgba(245,168,0,0.5)" }}>
            Financials
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs" style={{ color: "rgba(232,228,220,0.35)" }}>Project Value</p>
              <p
                className="text-xl font-bold text-white mt-1"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                ₵{booking.project_value.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "rgba(232,228,220,0.35)" }}>Your Commission</p>
              <p
                className="text-xl font-bold mt-1"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F5A800" }}
              >
                ₵{booking.commission_earned}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "rgba(245,168,0,0.5)" }}>
            Notes
          </p>
          {booking.notes ? (
            <div
              className="text-sm leading-relaxed whitespace-pre-wrap mb-4"
              style={{ color: "rgba(232,228,220,0.6)" }}
            >
              {booking.notes}
            </div>
          ) : (
            <p className="text-sm mb-4" style={{ color: "rgba(232,228,220,0.25)" }}>
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
        </div>
      </div>
    </div>
  );
}
