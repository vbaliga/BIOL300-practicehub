import Link from "next/link";

const GOLD      = "var(--gold)";
const GOLD_LIGHT = "var(--gold-light)";

const OPTIONS = [
  {
    href: "/practice",
    symbol: "∑",
    label: "Question Generator",
    description: "Unlimited worked practice questions for every test in BIOL 300 — chi-square, t-tests, ANOVA, regression, and more. Full step-by-step solutions included.",
    cta: "Start practicing →",
  },
  {
    href: "/r-coding",
    symbol: "R",
    label: "R Coding Questions",
    description: "Exam-style code review questions. Read a biological scenario and a block of R code, then identify any statistical errors — or confirm the code is correct.",
    cta: "Open questions →",
  },
  {
    href: "/r-fix",
    symbol: "✎",
    label: "Fix the Code",
    description: "Each question shows broken R code. Edit it directly to fix the mistake, run it, and get instant feedback with the answer revealed.",
    cta: "Start fixing →",
  },
];

export default function StartPage() {
  return (
    <>
      <style>{`
        .option-card {
          display: flex;
          flex-direction: column;
          text-decoration: none;
          border-radius: 16px;
          padding: 36px 32px 30px;
          background: var(--surface);
          border: 1.5px solid rgba(var(--text-rgb), 0.08);
          border-top: 4px solid var(--gold);
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s;
          flex: 1 1 0;
          min-width: 0;
        }
        .option-card:hover {
          box-shadow: 0 8px 32px rgba(0,0,0,0.13);
          transform: translateY(-3px);
          border-color: rgba(var(--text-rgb), 0.13);
          border-top-color: var(--gold);
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>

        {/* Nav */}
        <header style={{ background: "var(--surface)", borderBottom: "1px solid rgba(var(--text-rgb),0.08)" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
              <Link href="/" style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", textDecoration: "none", letterSpacing: "-0.01em" }}>
                BIOL 300 <span style={{ color: GOLD, fontWeight: 400 }}>Practice Hub</span>
              </Link>
            </div>
            <Link href="/about" style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.45)", textDecoration: "none" }}>About</Link>
          </div>
        </header>

        {/* Main */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 28px 80px" }}>

          {/* Heading */}
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: GOLD, margin: "0 0 12px" }}>
              BIOL 300 · Practice
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em", margin: "0 0 12px", lineHeight: 1.2 }}>
              What would you like to practice?
            </h1>
            <p style={{ fontSize: 15, color: "rgba(var(--text-rgb),0.45)", margin: 0, lineHeight: 1.6, maxWidth: 420 }}>
              Choose a question type to get started.
            </p>
          </div>

          {/* Cards */}
          <div style={{ display: "flex", gap: 20, width: "100%", maxWidth: 760, flexWrap: "wrap" }}>
            {OPTIONS.map((opt) => (
              <Link key={opt.href} href={opt.href} className="option-card">
                {/* Icon */}
                <div style={{ width: 52, height: 52, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, fontFamily: "ui-serif, Georgia, serif", background: "rgba(var(--gold-rgb),0.1)", color: GOLD, marginBottom: 20, flexShrink: 0 }}>
                  {opt.symbol}
                </div>

                {/* Label */}
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
                  {opt.label}
                </h2>

                {/* Description */}
                <p style={{ fontSize: 13.5, color: "rgba(var(--text-rgb),0.5)", lineHeight: 1.75, margin: "0 0 24px", flex: 1 }}>
                  {opt.description}
                </p>

                {/* CTA */}
                <span style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>
                  {opt.cta}
                </span>
              </Link>
            ))}
          </div>

          {/* Reference links */}
          <div style={{ marginTop: 48, display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { href: "/formula-sheet", label: "Formula Sheet" },
              { href: "/flowchart",     label: "What Test? Flowchart" },
              { href: "/pitfalls",      label: "Statistical Pitfalls" },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.35)", textDecoration: "none", borderBottom: "1px solid rgba(var(--text-rgb),0.15)", paddingBottom: 1, transition: "color 0.15s" }}>
                {l.label}
              </Link>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
