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
  baseX: number;
  baseY: number;
}

const PARTICLE_COUNT = 80;

function createParticle(id: number): Particle {
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight;
  return {
    id,
    x,
    y,
    baseX: x,
    baseY: y,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    size: Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.6 + 0.1,
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
    const cursorActive = mx > 0 && my > 0;

    particlesRef.current.forEach((p) => {
      if (cursorActive) {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 150;
        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          p.vx += (dx / dist) * force * 0.04;
          p.vy += (dy / dist) * force * 0.04;
        }
      }

      p.vx += (Math.random() - 0.5) * 0.02;
      p.vy += (Math.random() - 0.5) * 0.02;

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
      transition: {
        staggerChildren: 0.18,
      },
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
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ display: "block" }}
      />

      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 z-0 pointer-events-none"
        style={{
          width: "900px",
          height: "500px",
          background:
            "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(200,190,160,0.18) 0%, rgba(180,160,120,0.10) 40%, transparent 70%)",
          filter: "blur(1px)",
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 z-0 pointer-events-none"
        style={{
          width: "600px",
          height: "320px",
          background:
            "radial-gradient(ellipse 50% 35% at 50% 100%, rgba(255,245,220,0.22) 0%, rgba(220,200,150,0.08) 50%, transparent 70%)",
          filter: "blur(2px)",
        }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <span
            className="inline-block text-xs tracking-[0.25em] uppercase px-4 py-1.5 rounded-full border"
            style={{
              borderColor: "rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.2em",
            }}
          >
            Mens Garage Initiative
          </span>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-5">
          <h1
            className="text-5xl md:text-6xl lg:text-7xl leading-tight font-light text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Something bold
            <br />
            is{" "}
            <em
              className="font-normal"
              style={{
                fontStyle: "italic",
                color: "rgba(240,225,190,0.9)",
              }}
            >
              being built.
            </em>
          </h1>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-10">
          <p
            className="text-base md:text-lg leading-relaxed max-w-md mx-auto"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            A space for Kenyan men to find community, support, and purpose.
            <br />
            We are launching soon — leave your email and be first in.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full max-w-md">
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
                <div className="flex-1 relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="Your email address"
                    data-testid="input-email"
                    className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.85)",
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.border =
                        "1px solid rgba(255,255,255,0.28)";
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.09)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.border =
                        "1px solid rgba(255,255,255,0.12)";
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.06)";
                    }}
                  />
                </div>
                <button
                  type="submit"
                  data-testid="button-submit"
                  className="px-5 py-3 text-sm font-medium rounded-lg transition-all shrink-0"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    color: "#0a0a0a",
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.92)";
                  }}
                >
                  Notify me
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
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  ✓
                </span>
                <span
                  className="text-sm"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
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

        <motion.div
          variants={itemVariants}
          className="mt-16 flex items-center gap-6"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          <div className="h-px w-16" style={{ background: "rgba(255,255,255,0.1)" }} />
          <span className="text-xs tracking-widest uppercase" style={{ letterSpacing: "0.2em" }}>
            mensgarageinitiative.org
          </span>
          <div className="h-px w-16" style={{ background: "rgba(255,255,255,0.1)" }} />
        </motion.div>
      </motion.div>

      <div
        className="absolute bottom-0 left-0 right-0 h-64 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 120%, rgba(160,140,100,0.20) 0%, rgba(100,80,50,0.08) 50%, transparent 70%)",
        }}
      />
    </div>
  );
}
