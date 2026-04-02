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
}

const PARTICLE_COUNT = 80;

function createParticle(id: number): Particle {
  return {
    id,
    x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1440),
    y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 900),
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    size: Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.55 + 0.1,
  };
}

export default function ComingSoon() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animFrameRef = useRef<number>(0);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const initParticles = useCallback(() => {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, (_, i) =>
      createParticle(i)
    );
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    const cursorActive = mx > -100 && my > -100 && mx < canvas.width && my < canvas.height;

    particlesRef.current.forEach((p) => {
      if (cursorActive) {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 160;
        if (dist < maxDist && dist > 0) {
          const force = (maxDist - dist) / maxDist;
          p.vx += (dx / dist) * force * 0.05;
          p.vy += (dy / dist) * force * 0.05;
        }
      }

      p.vx += (Math.random() - 0.5) * 0.018;
      p.vy += (Math.random() - 0.5) * 0.018;

      const maxSpeed = 1.2;
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      p.vx *= 0.97;
      p.vy *= 0.97;

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
      ctx.fill();
    });

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    initParticles();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [initParticles, animate]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
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
    visible: {
      transition: { staggerChildren: 0.18 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center">
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ display: "block" }}
      />

      {/* ── Planet arc ── */}
      {/* 1. Wide purple atmospheric glow rising from horizon */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-0 pointer-events-none"
        style={{
          bottom: "8%",
          width: "130vw",
          height: "60vh",
          background:
            "radial-gradient(ellipse 65% 50% at 50% 100%, rgba(115,98,138,0.42) 0%, rgba(49,61,90,0.20) 45%, transparent 70%)",
          filter: "blur(10px)",
        }}
      />

      {/* 2. Tight bright core at the horizon */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-0 pointer-events-none"
        style={{
          bottom: "9%",
          width: "80vw",
          height: "28vh",
          background:
            "radial-gradient(ellipse 55% 55% at 50% 100%, rgba(203,197,234,0.65) 0%, rgba(115,98,138,0.22) 45%, transparent 70%)",
          filter: "blur(5px)",
        }}
      />

      {/* 3. The dark planet body — large ellipse sitting below the fold */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          zIndex: 1,
          bottom: "-58vh",
          width: "140vw",
          height: "72vh",
          borderRadius: "50%",
          background: "#060608",
          boxShadow: "0 -1px 0 0 rgba(160,148,200,0.25), 0 -8px 40px 0 rgba(115,98,138,0.18)",
        }}
      />

      {/* 4. The thin bright horizon rim on top of the planet */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          zIndex: 2,
          bottom: "calc(14vh - 1px)",
          width: "110vw",
          height: "2px",
          background:
            "radial-gradient(ellipse 55% 100% at 50% 50%, rgba(225,220,245,0.90) 0%, rgba(160,148,200,0.40) 38%, transparent 68%)",
          filter: "blur(0.8px)",
        }}
      />

      {/* Content */}
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
              color: "rgba(203,197,234,0.65)",
              letterSpacing: "0.15em",
              fontFamily: "'Inter', sans-serif",
              textTransform: "uppercase",
            }}
          >
            Mens Garage Initiative
          </span>
        </motion.div>

        {/* Headline — sans for main text, italic serif for "who wait." */}
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
                color: "rgba(255,255,255,0.92)",
              }}
            >
              who wait.
            </em>
          </h1>
        </motion.div>

        {/* Subtext — one short line */}
        <motion.div variants={itemVariants} className="mb-10">
          <p
            style={{
              color: "rgba(203,197,234,0.50)",
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
                    border: "1px solid rgba(203,197,234,0.15)",
                    color: "rgba(255,255,255,0.80)",
                    fontFamily: "'Inter', sans-serif",
                    borderRadius: "8px",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(203,197,234,0.35)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(203,197,234,0.15)";
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
