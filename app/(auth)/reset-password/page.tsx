"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Loader2, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // Listen for the PASSWORD_RECOVERY event — fires when Supabase
    // processes the reset token from the URL hash.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setDone(true);
      setTimeout(() => router.replace("/dashboard"), 2500);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0700" }}>
        <div className="w-full max-w-md animate-fade-in text-center">
          <div className="glass-card p-10">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(34,197,94,0.1)" }}
            >
              <CheckCircle size={32} style={{ color: "#22c55e" }} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Password updated
            </h2>
            <p className="text-sm" style={{ color: "rgba(232,228,220,0.5)" }}>
              Redirecting you to the dashboard…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0700" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#F5A800", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "rgba(232,228,220,0.4)" }}>Verifying reset link…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0700" }}>
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <img
            src="https://res.cloudinary.com/djayrwxns/image/upload/v1770785602/westline_logo_bmusvy.png"
            alt="Westline Techlabs"
            className="h-10"
          />
        </div>

        <div className="glass-card p-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "rgba(245,168,0,0.1)" }}
          >
            <Lock size={22} style={{ color: "#F5A800" }} />
          </div>
          <h2
            className="text-2xl font-bold text-white mb-1"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Set new password
          </h2>
          <p className="text-sm mb-6" style={{ color: "rgba(232,228,220,0.5)" }}>
            Choose a strong password for your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.7)" }}>
                New password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                  className="input-dark pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(232,228,220,0.3)" }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(232,228,220,0.7)" }}>
                Confirm password
              </label>
              <input
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Same password again"
                className="input-dark"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              Update password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
