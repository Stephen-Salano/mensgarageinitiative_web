import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  size: number;
  opacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

const PARTICLE_COUNT = 90;

function initParticle(id: number, W: number, H: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * 0.25 + 0.05;
  return {
    id,
    x: Math.random() * W,
    y: Math.random() * H,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    ax: 0,
    ay: 0,
    size: Math.random() * 1.4 + 0.4,
    opacity: Math.random() * 0.55 + 0.15,
    twinklePhase: Math.random() * Math.PI * 2,
    twinkleSpeed: Math.random() * 0.02 + 0.005,
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
  const svgRef = useRef<SVGSVGElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animFrameRef = useRef<number>(0);
  const arcRef = useRef<ArcDims | null>(null);
  const [arcDims, setArcDims] = useState<ArcDims | null>(null);

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const computeArc = useCallback((): ArcDims => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const rx = W * 0.74;
    const ry = H * 0.82;
    const cx = W / 2;
    // place center below viewport so the top of the ellipse is ~27% from bottom
    const cy = H + ry * 0.67;
    return { cx, cy, rx, ry, W, H };
  }, []);

  // Particles: pure autonomous drift + gentle mouse repulsion
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
      // Slow random walk — constant gentle turbulence
      p.ax = (Math.random() - 0.5) * 0.012;
      p.ay = (Math.random() - 0.5) * 0.012;

      // Mouse repulsion only — push away, don't attract
      if (hasMouse) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repelRadius = 120;
        if (dist < repelRadius && dist > 0) {
          const force = ((repelRadius - dist) / repelRadius) * 0.06;
          p.ax += (dx / dist) * force;
          p.ay += (dy / dist) * force;
        }
      }

      p.vx += p.ax;
      p.vy += p.ay;

      // Cap speed
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const maxSpeed = 0.55;
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      // Very light damping so they keep drifting
      p.vx *= 0.992;
      p.vy *= 0.992;

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < -5) p.x = canvas.width + 5;
      if (p.x > canvas.width + 5) p.x = -5;
      if (p.y < -5) p.y = canvas.height + 5;
      if (p.y > canvas.height + 5) p.y = -5;

      // Twinkle
      p.twinklePhase += p.twinkleSpeed;
      const twinkle = 0.7 + 0.3 * Math.sin(p.twinklePhase);
      const finalOpacity = p.opacity * twinkle;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
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
      const dims = computeArc();
      arcRef.current = dims;
      setArcDims(dims);
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
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.20 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 36 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1.0, ease: [0.22, 1, 0.36, 1] },
    },
  };

  // Light column animation — fades in with content
  const lightVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 1.6, ease: "easeOut", delay: 0.1 },
    },
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center">

      {/* ── Particle canvas ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* ── Light column: rises from arc centre up through headline ── */}
      <motion.div
        variants={lightVariants}
        initial="hidden"
        animate="visible"
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 2 }}
      >
        {/* Wide atmospheric bloom — full viewport height */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 0,
            width: "120vw",
            height: "100vh",
            background:
              "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(115,98,138,0.65) 0%, rgba(49,61,90,0.30) 40%, transparent 68%)",
            filter: "blur(14px)",
          }}
        />

        {/* Mid column — reaches headline area */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 0,
            width: "80vw",
            height: "90vh",
            background:
              "radial-gradient(ellipse 48% 70% at 50% 100%, rgba(160,148,200,0.60) 0%, rgba(115,98,138,0.25) 42%, transparent 68%)",
            filter: "blur(8px)",
          }}
        />

        {/* Tight bright core — concentrated near horizon, punches highest */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "15%",
            width: "45vw",
            height: "65vh",
            background:
              "radial-gradient(ellipse 42% 65% at 50% 100%, rgba(203,197,234,0.70) 0%, rgba(160,148,200,0.30) 42%, transparent 68%)",
            filter: "blur(4px)",
          }}
        />
      </motion.div>

      {/* ── SVG planet arc — proper curved geometry ── */}
      {arcDims && (
        <motion.svg
          ref={svgRef}
          variants={lightVariants}
          initial="hidden"
          animate="visible"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 3,
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          <defs>
            {/* Glow filter for the rim */}
            <filter id="rim-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur2" />
              <feMerge>
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gradient for the rim stroke — bright centre, fades to sides */}
            <linearGradient id="rim-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(160,148,200,0)" />
              <stop offset="25%" stopColor="rgba(200,193,230,0.5)" />
              <stop offset="50%" stopColor="rgba(225,220,248,0.92)" />
              <stop offset="75%" stopColor="rgba(200,193,230,0.5)" />
              <stop offset="100%" stopColor="rgba(160,148,200,0)" />
            </linearGradient>

            {/* Clip: only render the portion of the ellipse above the fold */}
            <clipPath id="above-fold">
              <rect x="0" y="0" width={arcDims.W} height={arcDims.H} />
            </clipPath>
          </defs>

          {/* Dark planet body */}
          <ellipse
            cx={arcDims.cx}
            cy={arcDims.cy}
            rx={arcDims.rx}
            ry={arcDims.ry}
            fill="#05050a"
            clipPath="url(#above-fold)"
          />

          {/* Outer glow halo — wide soft stroke */}
          <ellipse
            cx={arcDims.cx}
            cy={arcDims.cy}
            rx={arcDims.rx}
            ry={arcDims.ry}
            fill="none"
            stroke="url(#rim-gradient)"
            strokeWidth="12"
            opacity="0.35"
            filter="url(#rim-glow)"
            clipPath="url(#above-fold)"
          />

          {/* Bright thin rim */}
          <ellipse
            cx={arcDims.cx}
            cy={arcDims.cy}
            rx={arcDims.rx}
            ry={arcDims.ry}
            fill="none"
            stroke="url(#rim-gradient)"
            strokeWidth="1.5"
            opacity="0.9"
            clipPath="url(#above-fold)"
          />
        </motion.svg>
      )}

      {/* ── Content ── */}
      <motion.div
        className="relative flex flex-col items-center text-center px-6 max-w-2xl w-full"
        style={{ zIndex: 10 }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="mb-8">
          <span
            className="inline-block text-xs px-4 py-1.5 rounded-full border"
            style={{
              borderColor: "rgba(203,197,234,0.18)",
              background: "rgba(115,98,138,0.12)",
              color: "rgba(203,197,234,0.60)",
              letterSpacing: "0.15em",
              fontFamily: "'Inter', sans-serif",
              textTransform: "uppercase",
            }}
          >
            Mens Garage Initiative
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div variants={itemVariants} className="mb-5">
          <h1
            className="leading-tight text-white"
            style={{
              fontSize: "clamp(2.6rem, 6vw, 4.2rem)",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            Good things come
            <br />
            <span style={{ fontWeight: 600 }}>to those </span>
            <em
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
                letterSpacing: "0",
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
              color: "rgba(203,197,234,0.48)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.95rem",
              letterSpacing: "0.01em",
            }}
          >
            Community, brotherhood, and mental wellness — launching soon.
          </p>
        </motion.div>

        {/* Email form */}
        <motion.div variants={itemVariants} className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-2 w-full"
                data-testid="form-notify"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Your Email Address"
                  data-testid="input-email"
                  className="flex-1 px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(203,197,234,0.14)",
                    color: "rgba(255,255,255,0.80)",
                    fontFamily: "'Inter', sans-serif",
                    borderRadius: "8px",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(203,197,234,0.34)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(203,197,234,0.14)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }}
                />
                <button
                  type="submit"
                  data-testid="button-submit"
                  className="px-5 py-3 text-sm font-medium shrink-0 transition-all"
                  style={{
                    background: "#ffffff",
                    color: "#0a0a0a",
                    fontFamily: "'Inter', sans-serif",
                    borderRadius: "8px",
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#ece9f4";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                  }}
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
                className="flex items-center justify-center gap-2 py-3"
                data-testid="text-success"
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  style={{ background: "rgba(203,197,234,0.2)", color: "#CBC5EA" }}
                >
                  ✓
                </span>
                <span style={{ color: "rgba(203,197,234,0.65)", fontSize: "0.9rem" }}>
                  You're on the list. We'll be in touch.
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          {error && (
            <p
              className="mt-2 text-xs text-center"
              style={{ color: "rgba(255,120,100,0.8)" }}
              data-testid="text-error"
            >
              {error}
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
