"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import {
  UserCircle, Lock, DollarSign, Loader2,
  Calendar, MapPin, Phone, Mail,
} from "lucide-react";
import type { SalesRep, Booking } from "@/types";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const [rep, setRep] = useState<SalesRep | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [changingPw, setChangingPw] = useState(false);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("sales_reps")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (profile) {
      setRep(profile);
      const { data: bks } = await supabase
        .from("sales_bookings")
        .select("*")
        .eq("rep_id", profile.id)
        .order("created_at", { ascending: false });
      setBookings(bks || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error("Passwords don't match");
      return;
    }
    if (passwordForm.new.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPw(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.new,
    });

    setChangingPw(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated!");
      setPasswordForm({ current: "", new: "", confirm: "" });
    }
  }

  // Commission history — group by month
  const commissionByMonth = bookings.reduce((acc: Record<string, { total: number; count: number }>, b) => {
    const d = new Date(b.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = { total: 0, count: 0 };
    acc[key].total += b.commission_earned;
    acc[key].count++;
    return acc;
  }, {});

  const monthlyData = Object.entries(commissionByMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={28} className="animate-spin" style={{ color: "#F5A800" }} />
      </div>
    );
  }

  if (!rep) return null;

  const totalCommission = bookings.reduce((s, b) => s + b.commission_earned, 0);

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto animate-fade-in">
      <h1
        className="text-2xl font-bold text-white mb-6 pt-12 lg:pt-0"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Profile
      </h1>

      {/* Profile card */}
      <div className="glass-card p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
            style={{ background: "linear-gradient(135deg, #F5A800, #D4920A)", color: "#000" }}
          >
            {rep.full_name[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{rep.full_name}</h2>
            <p className="text-sm" style={{ color: "rgba(245,168,0,0.6)" }}>
              {rep.role === "admin" ? "Owner / Manager" : "Sales Representative"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
            <Mail size={15} style={{ color: "rgba(232,228,220,0.3)" }} />
            <span className="text-sm text-white">{rep.email}</span>
          </div>
          {rep.phone && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
              <Phone size={15} style={{ color: "rgba(232,228,220,0.3)" }} />
              <span className="text-sm text-white">{rep.phone}</span>
            </div>
          )}
          {rep.region && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
              <MapPin size={15} style={{ color: "rgba(232,228,220,0.3)" }} />
              <span className="text-sm text-white">{rep.region}</span>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
            <Calendar size={15} style={{ color: "rgba(232,228,220,0.3)" }} />
            <span className="text-sm text-white">Joined {new Date(rep.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="glass-card p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} style={{ color: "#F5A800" }} />
          <h3 className="text-sm font-semibold text-white">Change Password</h3>
        </div>
        <form onSubmit={changePassword} className="space-y-3">
          <input
            type="password"
            value={passwordForm.new}
            onChange={(e) => setPasswordForm((p) => ({ ...p, new: e.target.value }))}
            placeholder="New password"
            className="input-dark"
            required
            minLength={6}
          />
          <input
            type="password"
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
            placeholder="Confirm new password"
            className="input-dark"
            required
          />
          <button type="submit" disabled={changingPw} className="btn-gold">
            {changingPw ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            Update Password
          </button>
        </form>
      </div>

      {/* Commission history */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign size={16} style={{ color: "#F5A800" }} />
            <h3 className="text-sm font-semibold text-white">Commission History</h3>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: "rgba(232,228,220,0.35)" }}>Total earned</p>
            <p className="text-lg font-bold" style={{ color: "#F5A800", fontFamily: "'Space Grotesk', sans-serif" }}>
              GHS {totalCommission}
            </p>
          </div>
        </div>

        {monthlyData.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: "rgba(232,228,220,0.3)" }}>
            No commission history yet
          </p>
        ) : (
          <div className="space-y-2">
            {monthlyData.map(([month, data]) => {
              const [y, m] = month.split("-");
              const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              });
              return (
                <div
                  key={month}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs" style={{ color: "rgba(232,228,220,0.3)" }}>
                      {data.count} booking{data.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="font-bold" style={{ color: "#F5A800", fontFamily: "'Space Grotesk', sans-serif" }}>
                    GHS {data.total}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
