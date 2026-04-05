"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Config ─────────────────────────────────────────────────────────────────
const LOGO_URL =
  "https://res.cloudinary.com/djayrwxns/image/upload/v1772931726/westline_favicon_wwht4g.png";

const P_COUNT   = 450;   // number of particles
const LOGO_PX   = 160;   // logo rasterised at this size for sampling
const CV_SIZE   = 220;   // canvas CSS size (square)

// Absolute timing from mount (ms)
const T_FORM_END  = 1100; // particles fully formed
const T_TEXT_IN   = 1180; // text starts entering
const T_EXIT      = 2700; // exit begins
const T_HIDE      = 3600; // component removed

// Typewriter
const PORTAL_TEXT  = "Sales Portal";
const CHAR_MS      = 52;

// Tagline words
const TAGLINE = ["Design.", "Build.", "Deliver."];

// ── Easing ─────────────────────────────────────────────────────────────────
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

// ── Particle type ──────────────────────────────────────────────────────────
interface Particle {
  tx: number; ty: number; // target (logo pixel, CSS coords)
  ox: number; oy: number; // scattered origin
  r:  number;
  color: string;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function SplashScreen() {
  const [visible,     setVisible]     = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [exiting,     setExiting]     = useState(false);
  const [charCount,   setCharCount]   = useState(0);

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const loopRef      = useRef<number | null>(null);
  const mountRef     = useRef<number>(0);
  const typeIvRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Master timer ───────────────────────────────────────────────────────
  useEffect(() => {
    setVisible(true);
    mountRef.current = performance.now();

    // Start text enter
    const t1 = setTimeout(() => {
      setTextVisible(true);
      let n = 0;
      typeIvRef.current = setInterval(() => {
        n++;
        setCharCount(n);
        if (n >= PORTAL_TEXT.length) {
          clearInterval(typeIvRef.current!);
          typeIvRef.current = null;
        }
      }, CHAR_MS);
    }, T_TEXT_IN);

    // Start exit
    const t2 = setTimeout(() => {
      setExiting(true);
      setTextVisible(false);
      if (typeIvRef.current) {
        clearInterval(typeIvRef.current);
        typeIvRef.current = null;
      }
      // Typewriter delete
      let n = PORTAL_TEXT.length;
      typeIvRef.current = setInterval(() => {
        n--;
        setCharCount(Math.max(0, n));
        if (n <= 0) {
          clearInterval(typeIvRef.current!);
          typeIvRef.current = null;
        }
      }, CHAR_MS);
    }, T_EXIT);

    // Hide
    const t3 = setTimeout(() => setVisible(false), T_HIDE);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (typeIvRef.current) clearInterval(typeIvRef.current);
    };
  }, []);

  // ── Load logo → sample pixels → build particles ────────────────────────
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const off = document.createElement("canvas");
        off.width  = LOGO_PX;
        off.height = LOGO_PX;
        const ctx2 = off.getContext("2d")!;
        ctx2.drawImage(img, 0, 0, LOGO_PX, LOGO_PX);
        const { data } = ctx2.getImageData(0, 0, LOGO_PX, LOGO_PX);

        const step = Math.max(1, Math.ceil(Math.sqrt((LOGO_PX * LOGO_PX) / (P_COUNT * 2.5))));
        const cx = CV_SIZE / 2;
        const cy = CV_SIZE / 2;
        const offsetX = cx - LOGO_PX / 2;
        const offsetY = cy - LOGO_PX / 2;
        const list: Particle[] = [];

        for (let y = 0; y < LOGO_PX; y += step) {
          for (let x = 0; x < LOGO_PX; x += step) {
            const idx = (y * LOGO_PX + x) * 4;
            if (data[idx + 3] > 40) {
              const angle = Math.random() * Math.PI * 2;
              const dist  = 90 + Math.random() * 200;
              list.push({
                tx: x + offsetX,
                ty: y + offsetY,
                ox: cx + Math.cos(angle) * dist,
                oy: cy + Math.sin(angle) * dist,
                r:  0.7 + Math.random() * 1.3,
                color: `rgba(${data[idx]},${data[idx+1]},${data[idx+2]},${(data[idx+3]/255).toFixed(2)})`,
              });
            }
          }
        }

        // Shuffle then cap
        list.sort(() => Math.random() - 0.5);
        particlesRef.current = list.slice(0, P_COUNT);
      } catch {
        // CORS or canvas taint — particles stay empty, just canvas blank
      }
    };
    img.src = LOGO_URL;
  }, []);

  // ── Canvas animation loop ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // DPR-aware sizing
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = CV_SIZE * dpr;
    canvas.height = CV_SIZE * dpr;
    canvas.style.width  = CV_SIZE + "px";
    canvas.style.height = CV_SIZE + "px";
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    function tick() {
      const elapsed = performance.now() - mountRef.current;
      ctx.clearRect(0, 0, CV_SIZE, CV_SIZE);

      const pts = particlesRef.current;
      if (pts.length === 0) {
        if (elapsed < T_HIDE) loopRef.current = requestAnimationFrame(tick);
        return;
      }

      if (elapsed < T_FORM_END) {
        // Forming: scattered → target
        const progress = easeOut(elapsed / T_FORM_END);
        for (const p of pts) {
          ctx.beginPath();
          ctx.arc(
            p.ox + (p.tx - p.ox) * progress,
            p.oy + (p.ty - p.oy) * progress,
            p.r,
            0, Math.PI * 2,
          );
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      } else if (elapsed < T_EXIT) {
        // Hold: fully formed
        for (const p of pts) {
          ctx.beginPath();
          ctx.arc(p.tx, p.ty, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      } else {
        // Dispersing: target → scattered
        const raw  = Math.min((elapsed - T_EXIT) / (T_HIDE - T_EXIT), 1);
        const prog = easeInOut(raw);
        for (const p of pts) {
          ctx.beginPath();
          ctx.arc(
            p.tx + (p.ox - p.tx) * prog,
            p.ty + (p.oy - p.ty) * prog,
            p.r * (1 - prog * 0.6),
            0, Math.PI * 2,
          );
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      }

      if (elapsed < T_HIDE) loopRef.current = requestAnimationFrame(tick);
    }

    loopRef.current = requestAnimationFrame(tick);
    return () => { if (loopRef.current) cancelAnimationFrame(loopRef.current); };
  }, []);

  // ── Tagline word variants ──────────────────────────────────────────────
  function wordVariants(i: number) {
    const inDelay  = i * 0.18;
    const outDelay = (TAGLINE.length - 1 - i) * 0.09;
    return {
      hidden:  { opacity: 0, y: 18 },
      visible: { opacity: 1, y: 0,  transition: { duration: 0.38, delay: inDelay,  ease: "easeOut" as const } },
      exit:    { opacity: 0, y: 18, transition: { duration: 0.3,  delay: outDelay, ease: "easeIn"  as const } },
    };
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{
            position:       "fixed",
            inset:          0,
            zIndex:         9999,
            background:     "#0a0700",
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            overflow:       "hidden",
          }}
        >
          {/* ── Particle canvas (logo) ─────────────────────────────────── */}
          <canvas
            ref={canvasRef}
            style={{ display: "block", marginBottom: 28 }}
          />

          {/* ── "Sales Portal" typewriter ──────────────────────────────── */}
          <div
            style={{
              fontFamily:    "'Space Grotesk', sans-serif",
              fontSize:      26,
              fontWeight:    700,
              letterSpacing: "0.18em",
              color:         "#F5A800",
              textTransform: "uppercase" as const,
              height:        36,
              display:       "flex",
              alignItems:    "center",
              marginBottom:  14,
            }}
          >
            {PORTAL_TEXT.slice(0, charCount)}
            {charCount > 0 && charCount < PORTAL_TEXT.length && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                style={{ marginLeft: 1, color: "#F5A800" }}
              >
                |
              </motion.span>
            )}
          </div>

          {/* ── Tagline: Design. Build. Deliver. ──────────────────────── */}
          <div
            style={{
              display:       "flex",
              gap:           10,
              fontSize:      13,
              letterSpacing: "0.06em",
              color:         "rgba(232,228,220,0.45)",
              height:        20,
            }}
          >
            {TAGLINE.map((word, i) => (
              <motion.span
                key={word}
                variants={wordVariants(i)}
                initial="hidden"
                animate={textVisible && !exiting ? "visible" : "hidden"}
                exit="exit"
              >
                {word}
              </motion.span>
            ))}
          </div>

          {/* ── Gold progress bar ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.2 }}
            style={{
              position:   "absolute",
              bottom:     0,
              left:       0,
              right:      0,
              height:     2,
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: (T_HIDE / 1000) * 0.92, ease: "easeInOut" }}
              style={{ height: "100%", background: "#F5A800", opacity: 0.65 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
