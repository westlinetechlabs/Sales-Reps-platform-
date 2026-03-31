"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show once per browser session
    if (sessionStorage.getItem("wl-splash-seen")) return;
    sessionStorage.setItem("wl-splash-seen", "1");
    setVisible(true);

    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#0a0700",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Ambient radial glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              position: "absolute",
              width: 480,
              height: 480,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(245,168,0,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Logo + ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ position: "relative", marginBottom: 28 }}
          >
            {/* Pulsing gold ring */}
            <motion.div
              animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.15, 0.5] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                inset: -14,
                borderRadius: "50%",
                border: "1.5px solid rgba(245,168,0,0.5)",
                pointerEvents: "none",
              }}
            />
            {/* Outer static ring */}
            <div
              style={{
                position: "absolute",
                inset: -6,
                borderRadius: "50%",
                border: "1px solid rgba(245,168,0,0.18)",
                pointerEvents: "none",
              }}
            />

            {/* Logo image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/djayrwxns/image/upload/v1772931726/westline_favicon_wwht4g.png"
              alt="Westline Techlabs"
              width={80}
              height={80}
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                display: "block",
                objectFit: "cover",
              }}
            />
          </motion.div>

          {/* Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.55, ease: "easeOut" }}
            style={{ textAlign: "center" }}
          >
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "#e8e4dc",
                marginBottom: 6,
              }}
            >
              WESTLINE TECHLABS
            </p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.22em",
                color: "#F5A800",
                textTransform: "uppercase",
              }}
            >
              Sales Portal
            </motion.p>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.4 }}
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "rgba(232,228,220,0.28)",
              letterSpacing: "0.06em",
            }}
          >
            Design. Build. Deliver.
          </motion.p>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.5, duration: 1.8, ease: [0.4, 0, 0.6, 1] }}
              style={{
                height: "100%",
                background: "linear-gradient(90deg, rgba(245,168,0,0.6), #F5A800, rgba(245,168,0,0.6))",
                boxShadow: "0 0 12px rgba(245,168,0,0.6)",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
