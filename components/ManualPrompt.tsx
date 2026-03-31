"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { SalesRep } from "@/types";

export default function ManualPrompt({ rep }: { rep: SalesRep }) {
  const [show, setShow] = useState(false);
  const router = useRouter();
  const key = `wl-welcome-${rep.id}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(key)) return;
    // Only show to reps (not managers/owners who already know the system)
    if (rep.role !== "rep") return;
    const t = setTimeout(() => setShow(true), 3500);
    return () => clearTimeout(t);
  }, [rep.id, rep.role, key]);

  function dismiss() {
    localStorage.setItem(key, "1");
    setShow(false);
  }

  function openManual() {
    localStorage.setItem(key, "1");
    setShow(false);
    router.push("/dashboard/profile");
    // small delay so navigation completes before scroll
    setTimeout(() => {
      document.getElementById("platform-manual")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 600);
  }

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop blur on mobile */}
          <motion.div
            key="manual-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] lg:hidden"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            onClick={dismiss}
          />

          <motion.div
            key="manual-prompt"
            initial={{ opacity: 0, y: 80, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            style={{
              position: "fixed",
              bottom: 24,
              left: 16,
              right: 16,
              zIndex: 70,
              maxWidth: 420,
              margin: "0 auto",
              background: "var(--sidebar-bg)",
              border: "1px solid var(--gold-20)",
              borderRadius: 20,
              padding: "20px 20px 16px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,168,0,0.1)",
            }}
          >
            {/* Close */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 p-1 rounded-lg"
              style={{ color: "var(--text-30)" }}
            >
              <X size={16} />
            </button>

            {/* Icon */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "var(--gold-10)", border: "1px solid var(--gold-20)" }}
            >
              <BookOpen size={22} style={{ color: "#F5A800" }} />
            </div>

            {/* Text */}
            <p
              className="font-bold mb-1"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 16,
                color: "var(--text)",
              }}
            >
              Welcome to Westline Techlabs!
            </p>
            <p className="text-sm mb-4" style={{ color: "var(--text-50)", lineHeight: 1.5 }}>
              You&apos;re now part of the sales team. Read the Platform Manual to learn how bookings,
              commissions, targets and withdrawals work — everything you need to succeed.
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={openManual}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: "linear-gradient(135deg, #F5A800, #D4920A)",
                  color: "#0a0700",
                }}
              >
                Read Manual <ArrowRight size={15} />
              </button>
              <button
                onClick={dismiss}
                className="px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "var(--surface-4)", color: "var(--text-40)", border: "1px solid var(--border-8)" }}
              >
                Later
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
