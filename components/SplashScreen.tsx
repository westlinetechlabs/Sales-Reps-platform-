"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show on every fresh page load (not just once per session)
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2400);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
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
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ marginBottom: 32 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/djayrwxns/image/upload/v1770785602/westline_logo_bmusvy.png"
              alt="Westline Techlabs"
              style={{ height: 64, width: "auto", display: "block" }}
            />
          </motion.div>

          {/* Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.45, ease: "easeOut" }}
            style={{ textAlign: "center" }}
          >
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: "#e8e4dc",
                marginBottom: 8,
              }}
            >
              WESTLINE TECHLABS
            </p>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.25em",
                color: "#F5A800",
                textTransform: "uppercase",
              }}
            >
              Sales Portal
            </p>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            style={{
              marginTop: 14,
              fontSize: 13,
              color: "rgba(232,228,220,0.32)",
              letterSpacing: "0.08em",
            }}
          >
            Design. Build. Deliver.
          </motion.p>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.2 }}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.3, duration: 1.8, ease: "easeInOut" }}
              style={{
                height: "100%",
                background: "#F5A800",
                opacity: 0.7,
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
