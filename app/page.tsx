import Link from "next/link";

const PRACTICE = [
  {
    href: "/practice",
    symbol: "∑",
    title: "Question Generator",
    description: "Unlimited worked questions for every test in BIOL 300, with step-by-step solutions.",
  },
  {
    href: "/r-coding",
    symbol: "R",
    title: "R Coding Questions",
    description: "Exam-style code review: spot the statistical error (or confirm there isn't one).",
  },
  {
    href: "/r-fix",
    symbol: "✎",
    title: "Fix the Code",
    description: "Each question shows broken R code. Edit it directly to fix the mistake and get instant feedback.",
  },
];

const REFERENCE = [
  {
    href: "/formula-sheet",
    symbol: "μ",
    title: "Formula Sheet",
    description: "All key formulas by topic. Hover any formula for a plain-English explanation.",
  },
  {
    href: "/flowchart",
    symbol: "→",
    title: "What Test? Flowchart",
    description: "Interactive decision tree to identify the right test. Filter by chapter covered.",
  },
  {
    href: "/pitfalls",
    symbol: "!",
    title: "Statistical Pitfalls",
    description: "Four common misconceptions with self-test scenarios to check your reasoning.",
  },
];


export default function Home() {
  return (
    <>
      <style>{`
        .card-tool {
          display: flex;
          flex-direction: column;
          text-decoration: none;
          border-radius: 8px;
          padding: 28px;
          background: var(--surface);
          border: 1px solid rgba(var(--text-rgb), 0.08);
          border-left: 3px solid var(--gold);
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s;
        }
        .card-tool:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          transform: translateY(-2px);
          border-color: rgba(var(--text-rgb), 0.12);
          border-left-color: var(--gold);
        }
        .btn-primary {
          display: inline-block;
          padding: 12px 28px;
          border-radius: 6px;
          background: var(--gold);
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          letter-spacing: 0.01em;
          transition: opacity 0.15s, transform 0.1s;
        }
        .btn-primary:hover { opacity: 0.88; }
        .btn-primary:active { transform: scale(0.97); }
        .btn-secondary {
          display: inline-block;
          padding: 9px 22px;
          border-radius: 6px;
          border: 1.5px solid rgba(var(--text-rgb), 0.18);
          color: rgba(var(--text-rgb), 0.6);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-secondary:hover {
          border-color: rgba(var(--text-rgb), 0.35);
          color: rgba(var(--text-rgb), 0.85);
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

        {/* Nav */}
        <header>
          <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: "var(--gold)", flexShrink: 0 }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
                BIOL 300 <span style={{ color: "var(--gold)", fontWeight: 400 }}>Practice Hub</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Link href="/about" style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>About</Link>
              <Link href="/start" className="btn-primary" style={{ padding: "7px 18px", fontSize: 13 }}>Practise</Link>
            </div>
          </div>
        </header>

        {/* Page header — compact, light background */}
        <section style={{ background: "var(--surface)", borderBottom: "1px solid rgba(var(--text-rgb),0.08)", padding: "32px 28px 28px" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--gold)", margin: "0 0 8px" }}>
              BIOL 300 · University of British Columbia
            </p>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 8px" }}>
                  Fundamentals of Biostatistics: Practice Hub
                </h1>
                <p style={{ fontSize: 14, color: "rgba(var(--text-rgb),0.45)", margin: 0, lineHeight: 1.5 }}>
                  Practice problems, worked solutions, and interactive tools for exam preparation.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
                <Link href="/start" className="btn-primary" style={{ padding: "9px 22px", fontSize: 13 }}>Start practising</Link>
                <a
                  href="https://biologyprogram-2023.sites.olt.ubc.ca/files/2025/08/Syllabus_BIOL300_2025.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  Course syllabus
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Practice */}
        <section style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 28px 0" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(var(--text-rgb),0.35)", margin: "0 0 8px" }}>Practice</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", margin: "0 0 20px" }}>Practice questions</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {PRACTICE.map((f) => (
              <Link key={f.title} href={f.href} className="card-tool">
                <div style={{ width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, fontFamily: "ui-serif, Georgia, serif", background: "rgba(var(--gold-rgb),0.1)", color: "var(--gold)", marginBottom: 16 }}>
                  {f.symbol}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.01em" }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.5)", lineHeight: 1.65, margin: "0 0 16px", flex: 1 }}>{f.description}</p>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gold)" }}>Open tool →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Reference */}
        <section style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 28px 72px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(var(--text-rgb),0.35)", margin: "0 0 8px" }}>Reference</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", margin: "0 0 20px" }}>Reference material</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {REFERENCE.map((f) => (
              <Link key={f.title} href={f.href} className="card-tool">
                <div style={{ width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, fontFamily: "ui-serif, Georgia, serif", background: "rgba(var(--gold-rgb),0.1)", color: "var(--gold)", marginBottom: 16 }}>
                  {f.symbol}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.01em" }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.5)", lineHeight: 1.65, margin: "0 0 16px", flex: 1 }}>{f.description}</p>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gold)" }}>Open tool →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid rgba(var(--text-rgb),0.08)", padding: "28px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 12 }}>
            {[
              { href: "/practice",      label: "Practice" },
              { href: "/formula-sheet", label: "Formulas" },
              { href: "/flowchart",     label: "Flowchart" },
              { href: "/pitfalls",      label: "Pitfalls" },
              { href: "/r-coding",      label: "R Coding" },
              { href: "/about",         label: "About" },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.4)", textDecoration: "none" }}>{l.label}</Link>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "rgba(var(--text-rgb),0.25)", margin: 0 }}>
            BIOL 300 Practice Hub · University of British Columbia
          </p>
        </footer>
      </div>
    </>
  );
}
