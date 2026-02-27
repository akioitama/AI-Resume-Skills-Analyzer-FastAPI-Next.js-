"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

// Particle background component
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 202, 183, ${p.opacity})`;
        ctx.fill();

        particles.slice(i + 1).forEach((p2) => {
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 202, 183, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

// Circular progress ring
function ProgressRing({ percentage }: { percentage: number }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const color = percentage > 75 ? "#63cab7" : percentage > 50 ? "#f5c842" : "#f0614a";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
      <svg width="180" height="180" className="rotate-[-90deg]">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <motion.circle
          cx="90" cy="90" r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (percentage / 100) * circumference }}
          transition={{ duration: 1.6, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-4xl font-black"
          style={{ color, fontFamily: "'Syne', sans-serif", textShadow: `0 0 20px ${color}` }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {percentage}%
        </motion.span>
        <span className="text-xs text-white/40 tracking-widest uppercase mt-1">Match</span>
      </div>
    </div>
  );
}

// Skill pill component
function SkillPill({ skill, type, delay }: { skill: string; type: "match" | "missing"; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: type === "match" ? -20 : 20, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, type: "spring", stiffness: 200 }}
      className={`relative group px-4 py-2 rounded-full text-sm font-semibold cursor-default overflow-hidden`}
      style={{
        background: type === "match"
          ? "linear-gradient(135deg, rgba(99,202,183,0.15), rgba(99,202,183,0.05))"
          : "linear-gradient(135deg, rgba(240,97,74,0.15), rgba(240,97,74,0.05))",
        border: `1px solid ${type === "match" ? "rgba(99,202,183,0.3)" : "rgba(240,97,74,0.3)"}`,
        color: type === "match" ? "#63cab7" : "#f0614a",
        fontFamily: "'Space Mono', monospace",
      }}
    >
      <span className="relative z-10 flex items-center gap-2">
        <span className="text-xs">{type === "match" ? "✓" : "✗"}</span>
        {skill}
      </span>
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: type === "match"
            ? "linear-gradient(135deg, rgba(99,202,183,0.25), rgba(99,202,183,0.1))"
            : "linear-gradient(135deg, rgba(240,97,74,0.25), rgba(240,97,74,0.1))",
        }}
      />
    </motion.div>
  );
}

export default function Home() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [skills, setSkills] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateX = useTransform(mouseY, [-300, 300], [4, -4]);
  const rotateY = useTransform(mouseX, [-300, 300], [-4, 4]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) setResumeFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile || !skills) return alert("Please provide both file and skills");
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("required_skills", skills);
    setLoading(true);
    try {
      const res = await fetch("/api/match_skills", { method: "POST", body: formData });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Error calling backend");
    }
    setLoading(false);
  };

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=Space+Mono:wght@400;700&display=swap');

        * { box-sizing: border-box; }

        body {
          background: #080c12;
          font-family: 'Space Mono', monospace;
        }

        .noise-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
          opacity: 0.4;
        }

        .glow-border {
          position: relative;
        }
        .glow-border::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(99,202,183,0.4), transparent 40%, rgba(99,202,183,0.1) 100%);
          z-index: -1;
        }

        .input-glow:focus {
          box-shadow: 0 0 0 1px rgba(99,202,183,0.4), 0 0 20px rgba(99,202,183,0.1);
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #63cab7 0%, #a8eddf 40%, #63cab7 80%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        .scan-line {
          background: linear-gradient(transparent 50%, rgba(99,202,183,0.03) 50%);
          background-size: 100% 4px;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,202,183,0.3); border-radius: 2px; }
      `}</style>

      <div className="noise-bg min-h-screen relative overflow-x-hidden" style={{ background: "#080c12" }}>
        <ParticleField />

        {/* Ambient glows */}
        <div className="fixed pointer-events-none z-0">
          <div style={{
            position: "absolute", top: "-20%", left: "-10%",
            width: 600, height: 600, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,202,183,0.07) 0%, transparent 70%)",
          }} />
          <div style={{
            position: "absolute", bottom: "10%", right: "-10%",
            width: 500, height: 500, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,100,240,0.06) 0%, transparent 70%)",
          }} />
        </div>

        <div className="relative z-10 flex flex-col items-center py-16 px-4 min-h-screen">

          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#63cab7",
                boxShadow: "0 0 12px #63cab7",
                animation: "pulse 2s ease-in-out infinite",
              }} />
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.3em",
                color: "rgba(99,202,183,0.7)",
                textTransform: "uppercase",
              }}>AI-Powered Analysis Engine</span>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#63cab7",
                boxShadow: "0 0 12px #63cab7",
                animation: "pulse 2s ease-in-out infinite 0.5s",
              }} />
            </div>
            <h1 className="shimmer-text" style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: "1rem",
            }}>
              Resume Skills<br />Analyzer
            </h1>
            <p style={{
              color: "rgba(255,255,255,0.35)",
              fontFamily: "'Space Mono', monospace",
              fontSize: 13,
              letterSpacing: "0.05em",
              maxWidth: 400,
              margin: "0 auto",
            }}>
              Upload your resume. Define the required skills.<br />Get instant intelligence on your match.
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              rotateX,
              rotateY,
              transformPerspective: 1200,
              transformStyle: "preserve-3d",
            }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="glow-border w-full max-w-2xl"
          >
            <form
              onSubmit={handleSubmit}
              className="scan-line relative w-full"
              style={{
                background: "linear-gradient(145deg, rgba(15,22,33,0.95), rgba(10,14,22,0.98))",
                border: "1px solid rgba(99,202,183,0.12)",
                borderRadius: 20,
                padding: "2.5rem",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Top bar decoration */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(99,202,183,0.5), transparent)",
                borderRadius: "20px 20px 0 0",
              }} />

              {/* Corner accents */}
              {[["top-0 left-0", "border-t border-l"], ["top-0 right-0", "border-t border-r"],
                ["bottom-0 left-0", "border-b border-l"], ["bottom-0 right-0", "border-b border-r"]].map(([pos, borders], i) => (
                <div key={i} className={`absolute ${pos} w-4 h-4 ${borders}`} style={{ borderColor: "rgba(99,202,183,0.4)" }} />
              ))}

              <div className="flex flex-col gap-7">
                {/* Skills Input */}
                <div className="flex flex-col gap-2">
                  <label style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    letterSpacing: "0.25em",
                    color: "rgba(99,202,183,0.7)",
                    textTransform: "uppercase",
                  }}>
                    01 — Required Skills
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="Python, SQL, Machine Learning..."
                      className="input-glow w-full transition-all duration-300"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(99,202,183,0.15)",
                        borderRadius: 10,
                        padding: "14px 16px",
                        color: "rgba(255,255,255,0.85)",
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 13,
                        outline: "none",
                        caretColor: "#63cab7",
                      }}
                    />
                    {skills && (
                      <div style={{
                        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                        background: "rgba(99,202,183,0.1)",
                        border: "1px solid rgba(99,202,183,0.2)",
                        borderRadius: 20, padding: "2px 10px",
                        fontSize: 10, color: "rgba(99,202,183,0.7)",
                        fontFamily: "'Space Mono', monospace",
                      }}>
                        {skills.split(",").filter(s => s.trim()).length} skills
                      </div>
                    )}
                  </div>
                </div>

                {/* File Upload */}
                <div className="flex flex-col gap-2">
                  <label style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    letterSpacing: "0.25em",
                    color: "rgba(99,202,183,0.7)",
                    textTransform: "uppercase",
                  }}>
                    02 — Resume Document
                  </label>
                  <motion.div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    animate={{
                      borderColor: isDragging ? "rgba(99,202,183,0.6)" : resumeFile ? "rgba(99,202,183,0.3)" : "rgba(255,255,255,0.08)",
                      background: isDragging ? "rgba(99,202,183,0.05)" : "rgba(255,255,255,0.02)",
                    }}
                    style={{
                      border: "1px dashed rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      padding: "2rem",
                      display: "flex", flexDirection: "column", alignItems: "center",
                      gap: 12, cursor: "pointer", position: "relative",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {resumeFile ? (
                        <motion.div
                          key="file"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex flex-col items-center gap-3"
                        >
                          <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: "linear-gradient(135deg, rgba(99,202,183,0.2), rgba(99,202,183,0.05))",
                            border: "1px solid rgba(99,202,183,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#63cab7" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                              <line x1="16" y1="13" x2="8" y2="13"/>
                              <line x1="16" y1="17" x2="8" y2="17"/>
                              <polyline points="10 9 9 9 8 9"/>
                            </svg>
                          </div>
                          <div className="text-center">
                            <div style={{ color: "#63cab7", fontSize: 14, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                              {resumeFile.name}
                            </div>
                            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4 }}>
                              {(resumeFile.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center gap-3"
                        >
                          <div style={{
                            width: 56, height: 56, borderRadius: "50%",
                            background: "rgba(99,202,183,0.06)",
                            border: "1px solid rgba(99,202,183,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <svg width="24" height="24" fill="none" stroke="rgba(99,202,183,0.6)" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, fontFamily: "'Space Mono', monospace" }}>
                              Drop your resume here
                            </div>
                            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 4 }}>
                              PDF, DOC, DOCX supported
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </motion.div>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  style={{
                    position: "relative",
                    background: loading
                      ? "rgba(99,202,183,0.1)"
                      : "linear-gradient(135deg, #63cab7 0%, #3da898 100%)",
                    border: "none",
                    borderRadius: 12,
                    padding: "15px 24px",
                    color: loading ? "rgba(99,202,183,0.5)" : "#080c12",
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: 15,
                    letterSpacing: "0.05em",
                    cursor: loading ? "not-allowed" : "pointer",
                    overflow: "hidden",
                    boxShadow: loading ? "none" : "0 4px 30px rgba(99,202,183,0.25)",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{
                          width: 16, height: 16,
                          border: "2px solid rgba(99,202,183,0.3)",
                          borderTopColor: "#63cab7",
                          borderRadius: "50%",
                        }}
                      />
                      Processing Resume...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Analyze Resume
                    </span>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-2xl mt-10"
              >
                <div
                  className="glow-border"
                  style={{
                    background: "linear-gradient(145deg, rgba(15,22,33,0.97), rgba(10,14,22,0.99))",
                    border: "1px solid rgba(99,202,183,0.12)",
                    borderRadius: 20,
                    padding: "2.5rem",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {/* Top bar */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 1,
                    background: "linear-gradient(90deg, transparent, rgba(99,202,183,0.5), transparent)",
                    borderRadius: "20px 20px 0 0",
                  }} />

                  {/* Section Label */}
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10, letterSpacing: "0.25em",
                    color: "rgba(99,202,183,0.7)", marginBottom: "2rem",
                    textTransform: "uppercase",
                  }}>
                    ── Analysis Report ──
                  </div>

                  {/* Score center piece */}
                  <div className="flex flex-col items-center mb-10">
                    <ProgressRing percentage={result.match_percentage} />
                    <div style={{
                      marginTop: "1.5rem",
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 13,
                      color: "rgba(255,255,255,0.3)",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                    }}>
                      {result.match_percentage > 75 ? "Excellent Match" :
                       result.match_percentage > 50 ? "Partial Match" : "Low Match"}
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: "2rem" }} />

                  {/* Two column skills */}
                  <div className="grid grid-cols-1 gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <div>
                      <div style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 10, letterSpacing: "0.2em",
                        color: "#63cab7", marginBottom: "1rem",
                        textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#63cab7", boxShadow: "0 0 8px #63cab7" }} />
                        Matched ({result.matched_skills.length})
                      </div>
                      <div className="flex flex-col gap-2">
                        {result.matched_skills.length > 0
                          ? result.matched_skills.map((s: string, i: number) => (
                              <SkillPill key={s} skill={s} type="match" delay={i * 0.08} />
                            ))
                          : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>None found</span>
                        }
                      </div>
                    </div>

                    <div>
                      <div style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 10, letterSpacing: "0.2em",
                        color: "#f0614a", marginBottom: "1rem",
                        textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f0614a", boxShadow: "0 0 8px #f0614a" }} />
                        Missing ({result.missing_skills.length})
                      </div>
                      <div className="flex flex-col gap-2">
                        {result.missing_skills.length > 0
                          ? result.missing_skills.map((s: string, i: number) => (
                              <SkillPill key={s} skill={s} type="missing" delay={i * 0.08} />
                            ))
                          : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>None missing</span>
                        }
                      </div>
                    </div>
                  </div>

                  {/* Footer note */}
                  <div style={{
                    marginTop: "2rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.2)",
                    letterSpacing: "0.05em",
                  }}>
                    Analysis powered by AI · Results may vary based on resume format
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}