"use client";

import Link from "next/link";

const GOLD       = "var(--gold)";
const GOLD_LIGHT = "var(--gold-light)";
const BLUE       = "var(--surface)";
const BLUE_DARK  = "var(--bg)";

const PHILOSOPHY = [
  {
    icon: "⚠",
    title: "Silent errors",
    desc: "Code that runs without crashing but produces the wrong statistical result — the hardest class of mistake to catch.",
  },
  {
    icon: "⚙",
    title: "Misused functions",
    desc: "Functions called with the wrong arguments for the situation, e.g. applying paired = TRUE to a two-sample test.",
  },
  {
    icon: "✓",
    title: "Correct code",
    desc: "Some questions have no errors at all — a reminder that critical thinking means questioning everything, not assuming something must be wrong.",
  },
];

export default function RCodingPage() {
  return (
    <div style={{ minHeight: "100vh", background: BLUE_DARK }}>

      {/* Nav */}
      <header style={{ background: BLUE, borderBottom: "1px solid rgba(var(--gold-rgb),0.18)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 3, height: 20, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: GOLD, textDecoration: "none" }}>BIOL 300 Practice Hub</Link>
            <span style={{ color: "rgba(var(--text-rgb),0.2)", fontSize: 14 }}>/</span>
            <span style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.55)" }}>R Coding</span>
          </div>
          <Link href="/practice" style={{ fontSize: 12, fontWeight: 600, color: GOLD_LIGHT, textDecoration: "none", opacity: 0.7 }}>Practice →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "44px 24px 80px" }}>

        {/* Heading */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(var(--gold-rgb),0.55)", margin: "0 0 10px" }}>Practice</p>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.025em", margin: "0 0 14px" }}>R Coding Questions</h1>
          <p style={{ fontSize: 15, color: "rgba(var(--text-rgb),0.5)", lineHeight: 1.7, margin: 0 }}>
            Exam-style R code review questions for BIOL 300. Each question presents a snippet of R code and asks you to identify whether it correctly addresses the stated biological question — and if not, why not.
          </p>
        </div>

        {/* Philosophy cards */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "rgba(var(--text-rgb),0.7)", margin: 0 }}>What to expect</h2>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {PHILOSOPHY.map(p => (
              <div key={p.title} style={{ flex: "1 1 220px", padding: "16px 18px", borderRadius: 12, border: "1px solid rgba(var(--text-rgb),0.07)", background: "rgba(var(--text-rgb),0.02)" }}>
                <div style={{ fontSize: 18, marginBottom: 8 }}>{p.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(var(--text-rgb),0.8)", marginBottom: 6 }}>{p.title}</div>
                <p style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.45)", lineHeight: 1.65, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to approach */}
        <section style={{ marginBottom: 40, padding: "20px 24px", borderRadius: 14, border: "1px solid rgba(var(--gold-rgb),0.2)", background: "rgba(var(--gold-rgb),0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "rgba(var(--text-rgb),0.7)", margin: 0 }}>How to approach these questions</h2>
          </div>
          <p style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.5)", lineHeight: 1.75, margin: "0 0 10px" }}>
            For each snippet, ask yourself: <em>does this code correctly answer the biological question described?</em> Focus on the statistical logic first — is the right test chosen, are the assumptions respected, is the hypothesis set up correctly? Syntax details (capitalisation, brackets) matter less than whether the analysis is fundamentally sound.
          </p>
          <p style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.5)", lineHeight: 1.75, margin: 0 }}>
            Remember that some questions present perfectly correct code. Resist the urge to find a problem where none exists.
          </p>
        </section>

        {/* Questions placeholder */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "rgba(var(--text-rgb),0.85)", margin: 0 }}>Questions</h2>
            <div style={{ flex: 1, height: 1, background: "rgba(var(--gold-rgb),0.1)" }} />
          </div>

          <div style={{ padding: "48px 24px", borderRadius: 14, border: "1px dashed rgba(var(--text-rgb),0.12)", background: "rgba(var(--text-rgb),0.015)", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.25 }}>{"{ }"}</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(var(--text-rgb),0.35)", margin: "0 0 6px" }}>Questions coming soon</p>
            <p style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.25)", margin: 0 }}>This section is under construction.</p>
          </div>
        </section>

        <footer style={{ marginTop: 48, textAlign: "center", fontSize: 11, color: "rgba(var(--text-rgb),0.2)", paddingBottom: 8 }}>
          BIOL 300 Practice Hub · University of British Columbia
        </footer>
      </main>
    </div>
  );
}
