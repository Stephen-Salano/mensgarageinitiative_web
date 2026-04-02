import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

const PARTICLE_COUNT = 110;

function initParticle(id: number, W: number, H: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  // Varied speeds: slow drifters + faster movers for depth
  const speed = Math.random() * 1.1 + 0.3;
  return {
    id,
    x: Math.random() * W,
    y: Math.random() * H,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: Math.random() * 1.4 + 0.3,
    opacity: Math.random() * 0.55 + 0.10,
    twinklePhase: Math.random() * Math.PI * 2,
    twinkleSpeed: Math.random() * 0.04 + 0.01,
  };
}

interface ArcDims {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  W: number;
  H: number;
}

export default function ComingSoon() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animFrameRef = useRef<number>(0);
  const [arcDims, setArcDims] = useState<ArcDims | null>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Arc geometry — peak sits ~30% from bottom, wide flat curve like the reference
  const computeArc = useCallback((): ArcDims => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    // Wide flat ellipse — rx much larger than ry gives gentle slope
    const rx = W * 0.68;
    const ry = H * 0.38;
    const cx = W / 2;
    // Peak of arc = cy - ry = 0.68*H  →  cy = 0.68*H + ry
    const cy = H * 0.68 + ry;
    return { cx, cy, rx, ry, W, H };
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    const hasMouse = mx > 0 && my > 0 && mx < canvas.width;

    particlesRef.current.forEach((p) => {
      // Strong random walk — constantly steers each particle in a new direction
      p.vx += (Math.random() - 0.5) * 0.10;
      p.vy += (Math.random() - 0.5) * 0.10;

      // Mouse repulsion — scatter particles on hover
      if (hasMouse) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140 && dist > 0) {
          const force = ((140 - dist) / 140) * 0.22;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      // Very soft damping — barely touches momentum so particles keep drifting
      p.vx *= 0.9985;
      p.vy *= 0.9985;

      // Speed cap — clamp so they look natural not frantic
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const MAX = 1.6;
      if (speed > MAX) { p.vx = (p.vx / speed) * MAX; p.vy = (p.vy / speed) * MAX; }

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -4) p.x = canvas.width + 4;
      if (p.x > canvas.width + 4) p.x = -4;
      if (p.y < -4) p.y = canvas.height + 4;
      if (p.y > canvas.height + 4) p.y = -4;

      p.twinklePhase += p.twinkleSpeed;
      const twinkle = 0.65 + 0.35 * Math.sin(p.twinklePhase);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.opacity * twinkle})`;
      ctx.fill();
    });

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setArcDims(computeArc());
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, (_, i) =>
        initParticle(i, canvas.width, canvas.height)
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    animate();
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [animate, computeArc]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseleave", onLeave); };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) { setError("Please enter a valid email address."); return; }
    setError("");
    setSubmitted(true);
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.20 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 36 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.0, ease: [0.22, 1, 0.36, 1] } },
  };

  const glowVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1.8, ease: "easeOut", delay: 0.05 } },
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-black flex flex-col items-center"
      style={{ minHeight: "100vh" }}
    >
      {/* Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} />

      {/* ── Glow — small quiet radial bloom centered at the arc peak ── */}
      <motion.div
        variants={glowVariants} initial="hidden" animate="visible"
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 2 }}
      >
        {/* Outer soft haze — moderate size, centered at arc peak */}
        <div style={{
          position: "absolute",
          left: "50%", top: "68%",
          transform: "translate(-50%, -50%)",
          width: "60vw", height: "60vw",
          background: "radial-gradient(circle, rgba(85,65,115,0.42) 0%, rgba(50,42,80,0.12) 40%, transparent 68%)",
          filter: "blur(22px)",
        }} />
        {/* Inner bright core — tight, right at the peak */}
        <div style={{
          position: "absolute",
          left: "50%", top: "68%",
          transform: "translate(-50%, -50%)",
          width: "26vw", height: "26vw",
          background: "radial-gradient(circle, rgba(210,200,245,0.65) 0%, rgba(155,138,200,0.18) 45%, transparent 70%)",
          filter: "blur(4px)",
        }} />
      </motion.div>

      {/* ── SVG arc — proper curved ellipse, peak at 68% from top ── */}
      {arcDims && (
        <motion.svg
          variants={glowVariants} initial="hidden" animate="visible"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            zIndex: 3, pointerEvents: "none", overflow: "visible",
          }}
        >
          <defs>
            {/* Glow filter */}
            <filter id="rim-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="b2" />
              <feMerge><feMergeNode in="b1" /><feMergeNode in="b2" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* Sharp rim line — bright only at the center ~22% of arc, pure black beyond */}
            <linearGradient id="rim-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="rgba(0,0,0,0)" />
              <stop offset="37%"  stopColor="rgba(0,0,0,0)" />
              <stop offset="45%"  stopColor="rgba(215,208,245,0.50)" />
              <stop offset="50%"  stopColor="rgba(240,236,255,0.97)" />
              <stop offset="55%"  stopColor="rgba(215,208,245,0.50)" />
              <stop offset="63%"  stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>

            {/* Soft halo stroke — slightly wider than rim, still tight, pure black at edges */}
            <linearGradient id="rim-grad-wide" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="rgba(0,0,0,0)" />
              <stop offset="33%"  stopColor="rgba(0,0,0,0)" />
              <stop offset="43%"  stopColor="rgba(125,105,168,0.20)" />
              <stop offset="50%"  stopColor="rgba(148,130,195,0.48)" />
              <stop offset="57%"  stopColor="rgba(125,105,168,0.20)" />
              <stop offset="67%"  stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>

            {/* Clip to viewport — hide the ellipse below the fold */}
            <clipPath id="vp-clip">
              <rect x="0" y="0" width={arcDims.W} height={arcDims.H} />
            </clipPath>
          </defs>

          {/* Dark planet body */}
          <ellipse
            cx={arcDims.cx} cy={arcDims.cy}
            rx={arcDims.rx} ry={arcDims.ry}
            fill="#050508"
            clipPath="url(#vp-clip)"
          />

          {/* Soft halo — just a faint glow sitting above the rim, center only */}
          <ellipse
            cx={arcDims.cx} cy={arcDims.cy}
            rx={arcDims.rx} ry={arcDims.ry}
            fill="none"
            stroke="url(#rim-grad-wide)"
            strokeWidth="10"
            opacity="0.85"
            filter="url(#rim-glow)"
            clipPath="url(#vp-clip)"
          />

          {/* Thin bright rim line — the only lit part of the arc */}
          <ellipse
            cx={arcDims.cx} cy={arcDims.cy}
            rx={arcDims.rx} ry={arcDims.ry}
            fill="none"
            stroke="url(#rim-grad)"
            strokeWidth="1.5"
            clipPath="url(#vp-clip)"
          />
        </motion.svg>
      )}

      {/* ── Content — pushed upward with pb so arc has breathing room ── */}
      <motion.div
        className="relative flex flex-col items-center text-center px-6 max-w-2xl w-full"
        style={{
          zIndex: 10,
          // Top padding + bottom padding shifts the effective centre upward
          // so content sits clearly above the arc
          paddingTop: "12vh",
          paddingBottom: "32vh",
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="mb-8">
          <span
            style={{
              display: "inline-block",
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "6px 16px",
              borderRadius: "9999px",
              border: "1px solid rgba(203,197,234,0.18)",
              background: "rgba(115,98,138,0.12)",
              color: "rgba(203,197,234,0.60)",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Mens Garage Initiative
          </span>
        </motion.div>

        {/* Headline — sans bold + italic serif mix */}
        <motion.div variants={itemVariants} className="mb-5">
          <h1
            style={{
              fontSize: "clamp(2.4rem, 5.5vw, 4rem)",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              color: "#ffffff",
              margin: 0,
            }}
          >
            Good things come
            <br />
            <span style={{ fontWeight: 700 }}>to those </span>
            <em
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
                letterSpacing: "0.01em",
              }}
            >
              who wait.
            </em>
          </h1>
        </motion.div>

        {/* Subtext */}
        <motion.div variants={itemVariants} className="mb-10">
          <p
            style={{
              color: "rgba(203,197,234,0.45)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.92rem",
              letterSpacing: "0.01em",
            }}
          >
            Community, brotherhood, and mental wellness — launching soon.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div variants={itemVariants} style={{ width: "100%", maxWidth: "360px" }}>
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                exit={{ opacity: 0, y: -10 }}
                style={{ display: "flex", gap: "8px", width: "100%" }}
                data-testid="form-notify"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="Your Email Address"
                  data-testid="input-email"
                  style={{
                    flex: 1, padding: "12px 16px", fontSize: "0.875rem",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(203,197,234,0.14)",
                    color: "rgba(255,255,255,0.80)",
                    fontFamily: "'Inter', sans-serif",
                    borderRadius: "8px", outline: "none",
                  }}
                  onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(203,197,234,0.34)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                  onBlur={(e)  => { e.currentTarget.style.border = "1px solid rgba(203,197,234,0.14)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                />
                <button
                  type="submit"
                  data-testid="button-submit"
                  style={{
                    padding: "12px 20px", fontSize: "0.875rem", fontWeight: 500,
                    background: "#ffffff", color: "#0a0a0a",
                    fontFamily: "'Inter', sans-serif",
                    borderRadius: "8px", border: "none", cursor: "pointer",
                    letterSpacing: "0.01em", whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#ece9f4"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
                >
                  Get Notified
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 0" }}
                data-testid="text-success"
              >
                <span style={{ width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", background: "rgba(203,197,234,0.2)", color: "#CBC5EA" }}>✓</span>
                <span style={{ color: "rgba(203,197,234,0.65)", fontSize: "0.9rem" }}>You're on the list. We'll be in touch.</span>
              </motion.div>
            )}
          </AnimatePresence>
          {error && <p style={{ marginTop: 8, fontSize: "0.75rem", color: "rgba(255,120,100,0.8)", textAlign: "center" }} data-testid="text-error">{error}</p>}
        </motion.div>
      </motion.div>
    </div>
  );
}
