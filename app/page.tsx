"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const GOLD = "var(--gold)";
const GOLD_LIGHT = "var(--gold-light)";
const BLUE_DARK = "var(--bg)";
const BLUE = "var(--surface)";
const BLUE_MID = "var(--surface-mid)";

const SYMBOLS = ["Σ", "χ²", "μ", "σ", "H₀", "Hₐ", "α", "β", "ρ", "r²", "F", "t", "p", "df", "SE"];

function FloatingSymbols() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let iv: ReturnType<typeof setInterval>;

    function spawn() {
      if (!el) return;
      const s = document.createElement("span");
      const dur = 22 + Math.random() * 20;
      const delay = Math.random() * 2;
      s.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      s.style.cssText = [
        "position:absolute",
        `font-size:${14 + Math.random() * 24}px`,
        `left:${Math.random() * 100}%`,
        "bottom:-30px",
        "color:rgba(var(--gold-rgb),0.09)",
        "font-family:ui-serif,Georgia,serif",
        "user-select:none",
        "pointer-events:none",
        `animation:symRise ${dur}s ${delay}s linear forwards`,
      ].join(";");
      el.appendChild(s);
      timers.push(setTimeout(() => s.remove(), (dur + delay + 1) * 1000));
    }

    for (let i = 0; i < 10; i++) timers.push(setTimeout(spawn, i * 500));
    iv = setInterval(spawn, 2000);
    return () => { clearInterval(iv); timers.forEach(clearTimeout); };
  }, []);
  return <div ref={ref} style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }} aria-hidden />;
}

const FEATURES = [
  {
    href: "/practice", symbol: "∑", title: "Hypothesis Test Generator", live: true,
    badge: "Available now",
    description: "Generate unlimited practice questions for every test type in BIOL 300. Full step-by-step worked solutions with P-values from the course statistical tables.",
  },
  {
    href: "/formula-sheet", symbol: "μ", title: "Formula Sheet", live: true,
    badge: "Available now",
    description: "Interactive formula sheet organized by topic. Hover any formula for a plain-English explanation and guidance on when to use it.",
  },
  {
    href: "/flowchart", symbol: "→", title: "What Test? Flowchart", live: true,
    badge: "Available now",
    description: "Step-by-step interactive flowchart based on the lecture decision tree. Filter by chapter to see only the tests covered so far in the course.",
  },
  {
    href: "/pitfalls", symbol: "!", title: "Statistical Pitfalls", live: true,
    badge: "Available now",
    description: "Four common misconceptions — P-values, confidence intervals, causation, and proof — each with a self-test scenario to evaluate your reasoning.",
  },
];

const STATS = [
  { value: "11", label: "Calculable tests" },
  { value: "4",  label: "Identify-only tests" },
  { value: "17", label: "Chapters covered" },
  { value: "∞",  label: "Practice questions" },
];

export default function Home() {
  return (
    <>
      <style>{`
        @keyframes symRise {
          from { transform: translateY(0) rotate(0deg); opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          to   { transform: translateY(-110vh) rotate(15deg); opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .a1 { animation: fadeUp 0.65s 0.05s cubic-bezier(0.16,1,0.3,1) both; }
        .a2 { animation: fadeUp 0.65s 0.15s cubic-bezier(0.16,1,0.3,1) both; }
        .a3 { animation: fadeUp 0.65s 0.25s cubic-bezier(0.16,1,0.3,1) both; }
        .a4 { animation: fadeUp 0.65s 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .a5 { animation: fadeUp 0.65s 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .card-live {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .card-live:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(var(--gold-rgb),0.5);
          border-color: rgba(var(--gold-rgb),0.5) !important;
        }
        .btn-main {
          transition: opacity 0.15s, transform 0.1s;
        }
        .btn-main:hover { opacity: 0.9; }
        .btn-main:active { transform: scale(0.97); }
        .btn-ghost {
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-ghost:hover {
          border-color: rgba(var(--gold-rgb),0.5) !important;
          color: rgba(var(--text-rgb),0.9) !important;
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: BLUE_DARK }}>

        {/* ── Nav ── */}
        <header style={{ background: BLUE, borderBottom: "1px solid rgba(var(--gold-rgb),0.18)", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 1020, margin: "0 auto", padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 22, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
                BIOL 300{" "}
                <span style={{ color: GOLD, fontWeight: 400 }}>Practice Hub</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Link href="/about" style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.35)", textDecoration: "none" }}>About</Link>
              <Link
                href="/practice"
                className="btn-main"
                style={{ display: "inline-block", padding: "7px 18px", borderRadius: 8, background: GOLD, color: "#002145", fontSize: 13, fontWeight: 700, textDecoration: "none", letterSpacing: "0.01em" }}
              >
                Practice
              </Link>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section style={{ position: "relative", overflow: "hidden", background: `linear-gradient(160deg, ${BLUE} 0%, ${BLUE_MID} 50%, ${BLUE_DARK} 100%)`, borderBottom: "1px solid rgba(var(--gold-rgb),0.12)" }}>
          <FloatingSymbols />

          {/* subtle radial glow */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 65% 55% at 50% 65%, rgba(var(--gold-rgb),0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ position: "relative", maxWidth: 1020, margin: "0 auto", padding: "88px 28px 80px", textAlign: "center" }}>

            <div className="a1" style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid rgba(var(--gold-rgb),0.35)", background: "rgba(var(--gold-rgb),0.08)", borderRadius: 100, padding: "5px 16px", fontSize: 11, fontWeight: 500, color: GOLD_LIGHT, marginBottom: 30, letterSpacing: "0.02em" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, display: "inline-block", flexShrink: 0 }} />
              BIOL 300 · Fundamentals of Biostatistics · University of British Columbia
            </div>

            <h1 className="a2" style={{ fontSize: "clamp(54px, 10vw, 82px)", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.03, margin: "0 0 12px", fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif" }}>
              Practice Hub
            </h1>

            <p className="a3" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, marginBottom: 22 }}>
              BIOL 300 · UBC
            </p>

            <p className="a4" style={{ fontSize: 17, color: "rgba(var(--text-rgb),0.5)", maxWidth: 460, margin: "0 auto 40px", lineHeight: 1.65 }}>
              Practice problems and worked solutions following the{" "}
              <strong style={{ color: "rgba(var(--text-rgb),0.8)", fontWeight: 500 }}>BIOL 300 curriculum</strong>.
              Built for exam preparation at UBC.
            </p>

            <div className="a5" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/practice"
                className="btn-main"
                style={{ display: "inline-block", padding: "13px 32px", borderRadius: 10, background: GOLD, color: "#002145", fontSize: 14, fontWeight: 700, textDecoration: "none", letterSpacing: "0.01em", boxShadow: "0 4px 24px rgba(var(--gold-rgb),0.35)" }}
              >
                Start practising
              </Link>
              <a
                href="https://biologyprogram-2023.sites.olt.ubc.ca/files/2025/08/Syllabus_BIOL300_2025.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
                style={{ display: "inline-block", padding: "13px 32px", borderRadius: 10, border: "1.5px solid rgba(var(--gold-rgb),0.25)", background: "transparent", color: "rgba(var(--text-rgb),0.55)", fontSize: 14, fontWeight: 500, textDecoration: "none", letterSpacing: "0.01em" }}
              >
                Course page
              </a>
            </div>
          </div>

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 48, background: `linear-gradient(to bottom, transparent, ${BLUE_DARK})`, pointerEvents: "none" }} />
        </section>

        {/* ── Stats ── */}
        <section style={{ background: BLUE, borderBottom: "1px solid rgba(var(--gold-rgb),0.12)" }}>
          <div style={{ maxWidth: 1020, margin: "0 auto", padding: "0 28px", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
            {STATS.map((s, i) => (
              <div key={s.label} style={{ textAlign: "center", padding: "30px 16px", borderRight: i < 3 ? "1px solid rgba(var(--gold-rgb),0.12)" : "none" }}>
                <div style={{ fontSize: 38, fontWeight: 800, color: GOLD, lineHeight: 1, marginBottom: 6, textShadow: "0 0 28px rgba(var(--gold-rgb),0.4)" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "rgba(var(--text-rgb),0.35)", letterSpacing: "0.04em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature cards ── */}
        <section style={{ maxWidth: 1020, margin: "0 auto", padding: "52px 28px 80px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(var(--gold-rgb),0.55)", marginBottom: 20 }}>Tools</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {FEATURES.map((f) => {
              const cardStyle: React.CSSProperties = {
                borderRadius: 16, padding: 28,
                background: f.live ? "rgba(var(--text-rgb),0.04)" : "rgba(var(--text-rgb),0.02)",
                border: f.live ? "1.5px solid rgba(var(--gold-rgb),0.28)" : "1px solid rgba(var(--text-rgb),0.06)",
                height: "100%",
              };
              const inner = (
                <div className={f.live ? "card-live" : ""} style={cardStyle}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, fontFamily: "ui-serif,Georgia,serif", background: f.live ? "rgba(var(--gold-rgb),0.12)" : "rgba(var(--text-rgb),0.04)", border: f.live ? "1px solid rgba(var(--gold-rgb),0.25)" : "1px solid rgba(var(--text-rgb),0.06)", color: f.live ? GOLD : "rgba(var(--text-rgb),0.2)" }}>
                      {f.symbol}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 100, padding: "4px 10px", background: f.live ? "rgba(var(--gold-rgb),0.12)" : "rgba(var(--text-rgb),0.04)", color: f.live ? GOLD_LIGHT : "rgba(var(--text-rgb),0.25)", border: f.live ? "1px solid rgba(var(--gold-rgb),0.3)" : "1px solid rgba(var(--text-rgb),0.08)" }}>
                      {f.badge}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: f.live ? "var(--text)" : "rgba(var(--text-rgb),0.3)", marginBottom: 8, letterSpacing: "-0.01em" }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: f.live ? "rgba(var(--text-rgb),0.5)" : "rgba(var(--text-rgb),0.2)", lineHeight: 1.65, margin: "0 0 20px" }}>{f.description}</p>
                  {f.live && <div style={{ fontSize: 13, fontWeight: 600, color: GOLD }}>Open tool &rarr;</div>}
                </div>
              );
              return f.live
                ? <Link key={f.title} href={f.href} style={{ textDecoration: "none", display: "block" }}>{inner}</Link>
                : <div key={f.title}>{inner}</div>;
            })}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: "1px solid rgba(var(--gold-rgb),0.1)", padding: "28px 28px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 22, height: 1, background: GOLD, opacity: 0.5 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: GOLD, letterSpacing: "0.05em" }}>BIOL 300 Practice Hub</span>
            <div style={{ width: 22, height: 1, background: GOLD, opacity: 0.5 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 8 }}>
            {[
              { href: "/practice",     label: "Practice" },
              { href: "/formula-sheet",label: "Formulas" },
              { href: "/flowchart",    label: "Flowchart" },
              { href: "/pitfalls",     label: "Pitfalls" },
              { href: "/about",        label: "About" },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: 11, color: GOLD, textDecoration: "none", opacity: 0.6 }}>{l.label}</Link>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "rgba(var(--text-rgb),0.2)", margin: 0 }}>
            BIOL 300 Practice Hub · University of British Columbia
          </p>
        </footer>
      </div>
    </>
  );
}
