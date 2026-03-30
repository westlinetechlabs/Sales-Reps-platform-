"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { calculateCommission } from "@/lib/commission";
import { SERVICE_TYPES } from "@/types";
import { ArrowLeft, Loader2, DollarSign } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NewBookingPage() {
  const router = useRouter();
  const [repId, setRepId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    client_location: "",
    service_type: "Logo & Branding",
    service_details: "",
    project_value: "",
    notes: "",
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .from("sales_reps")
        .select("id")
        .eq("user_id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) setRepId(data.id);
        });
    });
  }, []);

  const projectValue = parseFloat(form.project_value) || 0;
  const commission = calculateCommission(projectValue);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!repId) {
      toast.error("Profile not loaded. Please refresh.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from("sales_bookings").insert({
      rep_id: repId,
      client_name: form.client_name,
      client_phone: form.client_phone,
      client_email: form.client_email || null,
      client_location: form.client_location || null,
      service_type: form.service_type,
      service_details: { description: form.service_details },
      project_value: projectValue,
      commission_earned: commission,
      notes: form.notes || null,
      status: "new",
    });

    setLoading(false);

    if (error) {
      toast.error("Failed to save booking");
      console.error(error);
    } else {
      toast.success("Booking created!");
      router.push("/dashboard");
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto animate-fade-in">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm mb-6 pt-12 lg:pt-0"
        style={{ color: "rgba(232,228,220,0.4)" }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <h1
        className="text-2xl font-bold text-white mb-1"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        New Booking
      </h1>
      <p className="text-sm mb-6" style={{ color: "rgba(232,228,220,0.4)" }}>
        Record a new client booking
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Client info */}
        <div className="glass-card p-5">
          <p className="text-sm font-semibold text-white mb-4">Client Information</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.5)" }}>
                Client Name *
              </label>
              <input
                name="client_name"
                value={form.client_name}
                onChange={handleChange}
                required
                placeholder="Full name"
                className="input-dark"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.5)" }}>
                  Phone / WhatsApp *
                </label>
                <input
                  name="client_phone"
                  value={form.client_phone}
                  onChange={handleChange}
                  required
                  placeholder="+233 xxx xxx xxxx"
                  className="input-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.5)" }}>
                  Email (optional)
                </label>
                <input
                  name="client_email"
                  type="email"
                  value={form.client_email}
                  onChange={handleChange}
                  placeholder="client@email.com"
                  className="input-dark"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.5)" }}>
                Client Location
              </label>
              <input
                name="client_location"
                value={form.client_location}
                onChange={handleChange}
                placeholder="e.g. Accra, East Legon"
                className="input-dark"
              />
            </div>
          </div>
        </div>

        {/* Service info */}
        <div className="glass-card p-5">
          <p className="text-sm font-semibold text-white mb-4">Service Details</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.5)" }}>
                Service Type *
              </label>
              <select
                name="service_type"
                value={form.service_type}
                onChange={handleChange}
                className="input-dark"
              >
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.5)" }}>
                Service Details
              </label>
              <textarea
                name="service_details"
                value={form.service_details}
                onChange={handleChange}
                rows={3}
                placeholder="Describe what the client needs..."
                className="input-dark resize-none"
              />
            </div>
          </div>
        </div>

        {/* Value & Notes */}
        <div className="glass-card p-5">
          <p className="text-sm font-semibold text-white mb-4">Pricing & Notes</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.5)" }}>
                Estimated Project Value (GHS) *
              </label>
              <input
                name="project_value"
                type="number"
                min="0"
                step="0.01"
                value={form.project_value}
                onChange={handleChange}
                required
                placeholder="e.g. 500"
                className="input-dark"
              />
            </div>

            {/* Commission preview */}
            {projectValue > 0 && (
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(245,168,0,0.08)", border: "1px solid rgba(245,168,0,0.15)" }}
              >
                <DollarSign size={18} style={{ color: "#F5A800" }} />
                <div>
                  <p className="text-xs" style={{ color: "rgba(245,168,0,0.6)" }}>Your commission</p>
                  <p className="text-lg font-bold" style={{ color: "#F5A800", fontFamily: "'Space Grotesk', sans-serif" }}>
                    GHS {commission}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.5)" }}>
                Notes
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Any additional notes..."
                className="input-dark resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-gold flex-1">
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Save Booking
          </button>
          <Link href="/dashboard" className="btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
