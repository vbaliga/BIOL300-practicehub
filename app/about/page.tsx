import Link from "next/link";

const GOLD        = "#c6973f";
const GOLD_LIGHT  = "#e8c27a";
const BLUE        = "#002145";
const BLUE_DARK   = "#001830";

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: BLUE_DARK }}>

      {/* Nav */}
      <header style={{ background: BLUE, borderBottom: "1px solid rgba(198,151,63,0.18)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 3, height: 20, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: GOLD, textDecoration: "none" }}>BIOL 300 Practice Hub</Link>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 14 }}>/</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>About</span>
          </div>
          <Link href="/practice" style={{ fontSize: 12, fontWeight: 600, color: GOLD_LIGHT, textDecoration: "none", opacity: 0.7 }}>Practice →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "44px 24px 80px" }}>

        {/* Heading */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(198,151,63,0.55)", margin: "0 0 10px" }}>About</p>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", margin: "0 0 14px" }}>BIOL 300 Practice Hub</h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: 0 }}>
            A free study resource for <strong style={{ color: "rgba(255,255,255,0.75)" }}>BIOL 300 — Fundamentals of Biostatistics</strong> at the University of British Columbia. The site is designed to help students practise hypothesis testing, review formulas, navigate the "what test?" decision process, and avoid common statistical misconceptions.
          </p>
        </div>

        {/* Course info */}
        <section style={{ marginBottom: 40, padding: "22px 24px", borderRadius: 14, border: "1px solid rgba(198,151,63,0.2)", background: "rgba(198,151,63,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: 0 }}>About BIOL 300 at UBC</h2>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: "0 0 12px" }}>
            BIOL 300 is a core course in UBC's Biology undergraduate curriculum covering statistical reasoning for life scientists. Topics include probability, hypothesis testing, confidence intervals, chi-square tests, t-tests, ANOVA, correlation, and linear regression, based on <em>The Analysis of Biological Data</em> by Whitlock &amp; Schluter (3rd ed.).
          </p>
          <a
            href="https://www.zoology.ubc.ca/~whitlock/bio300/bio300.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: GOLD, textDecoration: "none", opacity: 0.8 }}
          >
            BIOL 300 course page →
          </a>
        </section>

        {/* Credits */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: 0 }}>Credits</h2>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { initials: "DS", name: "Daniel Sobat", role: "Development & design" },
              { initials: "VB", name: "Vikram Baliga", role: "Content & statistical review" },
            ].map(c => (
              <div key={c.name} style={{ flex: "1 1 200px", display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(198,151,63,0.15)", border: "1px solid rgba(198,151,63,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: GOLD_LIGHT, flexShrink: 0 }}>
                  {c.initials}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{c.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tools */}
        <section style={{ marginBottom: 40, padding: "20px 24px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: 0 }}>What's on the site</h2>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { href: "/practice",     label: "Hypothesis Test Generator", desc: "Unlimited worked practice questions for every test in BIOL 300" },
              { href: "/formula-sheet", label: "Formula Sheet",            desc: "Hover-to-explain interactive formula reference" },
              { href: "/flowchart",    label: "What Test? Flowchart",      desc: "Interactive decision flowchart with chapter filtering" },
              { href: "/pitfalls",     label: "Statistical Pitfalls",      desc: "Common misconceptions with self-test scenarios" },
            ].map(item => (
              <li key={item.href}>
                <Link href={item.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(198,151,63,0.12)", background: "rgba(198,151,63,0.03)", textDecoration: "none", transition: "border-color 0.15s" }}
                  onMouseOver={undefined} onMouseOut={undefined}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <span style={{ color: GOLD, fontSize: 12, opacity: 0.6 }}>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Source code (placeholder) */}
        <section style={{ padding: "16px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0, lineHeight: 1.6 }}>
            Source code will be linked here once the site is made public.
          </p>
        </section>

        <footer style={{ marginTop: 40, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", paddingBottom: 8 }}>
          BIOL 300 Practice Hub · University of British Columbia
        </footer>
      </main>
    </div>
  );
}
