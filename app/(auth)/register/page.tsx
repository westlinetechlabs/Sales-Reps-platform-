"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Loader2, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    region: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name },
      },
    });

    if (authError) {
      setLoading(false);
      toast.error(authError.message);
      return;
    }

    if (!authData.user) {
      setLoading(false);
      toast.error("Registration failed. Please try again.");
      return;
    }

    // 2. Create profile — status: 'inactive' until admin approves
    const { error: profileError } = await supabase.from("sales_reps").insert({
      user_id: authData.user.id,
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || null,
      region: form.region || null,
      role: "rep",        // always rep — only admin can promote
      status: "inactive", // must be approved before access is granted
    });

    setLoading(false);

    if (profileError) {
      toast.error("Account created but profile setup failed. Contact admin.");
      console.error(profileError);
      return;
    }

    setSubmitted(true);
  }

  // ── Pending screen (shown after successful registration) ──
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0700" }}>
        <div className="w-full max-w-md animate-fade-in text-center">
          <div className="glass-card p-10">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(245,168,0,0.1)" }}
            >
              <Clock size={32} style={{ color: "#F5A800" }} />
            </div>
            <h2
              className="text-2xl font-bold text-white mb-3"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Request submitted
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(232,228,220,0.5)" }}>
              Your account has been created and is <strong className="text-white">pending approval</strong> by
              the admin. You&apos;ll be able to log in once your account is activated.
            </p>
            <p className="text-xs mt-4" style={{ color: "rgba(232,228,220,0.3)" }}>
              Contact your manager if you need urgent access.
            </p>
            <Link href="/login" className="btn-ghost w-full mt-6 inline-flex items-center justify-center">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0700" }}>
      <div className="w-full max-w-lg animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <img
            src="https://res.cloudinary.com/djayrwxns/image/upload/v1770785602/westline_logo_bmusvy.png"
            alt="Westline Techlabs"
            className="h-10"
          />
        </div>

        <div className="glass-card p-8">
          <h2
            className="text-2xl font-bold text-white mb-1"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Request access
          </h2>
          <p className="text-sm mb-6" style={{ color: "rgba(232,228,220,0.5)" }}>
            Submit your details — an admin will approve your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.7)" }}>
                Full Name *
              </label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                placeholder="John Smith"
                className="input-dark"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.7)" }}>
                Email *
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="john@company.com"
                className="input-dark"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.7)" }}>
                Password *
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                className="input-dark"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.7)" }}>
                  Phone
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+233 xxx xxxx"
                  className="input-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.7)" }}>
                  Region
                </label>
                <input
                  name="region"
                  value={form.region}
                  onChange={handleChange}
                  placeholder="e.g. Greater Accra"
                  className="input-dark"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-full">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Request access
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: "rgba(232,228,220,0.4)" }}>
            Already approved?{" "}
            <Link href="/login" className="font-medium hover:underline" style={{ color: "#F5A800" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
