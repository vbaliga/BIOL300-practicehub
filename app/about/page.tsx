import Link from "next/link";

const GOLD        = "var(--gold)";
const GOLD_LIGHT  = "var(--gold-light)";
const BLUE        = "var(--surface)";
const BLUE_DARK   = "var(--bg)";

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: BLUE_DARK }}>

      {/* Nav */}
      <header style={{ background: BLUE, borderBottom: "1px solid rgba(var(--gold-rgb),0.18)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 3, height: 20, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: GOLD, textDecoration: "none" }}>BIOL 300 Practice Hub</Link>
            <span style={{ color: "rgba(var(--text-rgb),0.2)", fontSize: 14 }}>/</span>
            <span style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.55)" }}>About</span>
          </div>
          <Link href="/start" style={{ fontSize: 12, fontWeight: 600, color: GOLD_LIGHT, textDecoration: "none", opacity: 0.7 }}>Practice →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "44px 24px 80px" }}>

        {/* Heading */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(var(--gold-rgb),0.55)", margin: "0 0 10px" }}>About</p>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.025em", margin: "0 0 14px" }}>BIOL 300 Practice Hub</h1>
          <p style={{ fontSize: 15, color: "rgba(var(--text-rgb),0.5)", lineHeight: 1.7, margin: 0 }}>
            A free study resource for <strong style={{ color: "rgba(var(--text-rgb),0.75)" }}>BIOL 300: Fundamentals of Biostatistics</strong> at the University of British Columbia. The site is designed to help students practice hypothesis testing, write and review R code, navigate the "what test?" decision process, and avoid common statistical misconceptions.
          </p>
        </div>

        {/* Course info */}
        <section style={{ marginBottom: 40, padding: "22px 24px", borderRadius: 14, border: "1px solid rgba(var(--gold-rgb),0.2)", background: "rgba(var(--gold-rgb),0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "rgba(var(--text-rgb),0.7)", margin: 0 }}>About BIOL 300 at UBC</h2>
          </div>
          <p style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.5)", lineHeight: 1.7, margin: "0 0 12px" }}>
            BIOL 300 is a core course in UBC's Biology undergraduate curriculum covering statistical reasoning for life scientists. Topics include probability, hypothesis testing, confidence intervals, chi-square tests, t-tests, ANOVA, correlation, and linear regression, following the statistical methods covered in the BIOL 300 curriculum.
          </p>
          <a
            href="https://www.biology.ubc.ca/course-listing-2/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: GOLD, textDecoration: "none", opacity: 0.8 }}
          >
            UBC Biology course listing →
          </a>
        </section>

        {/* Credits */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "rgba(var(--text-rgb),0.7)", margin: 0 }}>Credits</h2>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { photo: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/daniel-sobat.jpg`, name: "Daniel Sobat", role: "Development & design" },
              { photo: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/vikram-baliga.jpg`, name: "Vikram Baliga", role: "Content & statistical review" },
            ].map(c => (
              <div key={c.name} style={{ flex: "1 1 200px", display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 10, border: "1px solid rgba(var(--text-rgb),0.07)", background: "rgba(var(--text-rgb),0.02)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.photo} alt={c.name} style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(var(--gold-rgb),0.25)", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(var(--text-rgb),0.85)" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.35)", marginTop: 2 }}>{c.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tools */}
        <section style={{ marginBottom: 40, padding: "20px 24px", borderRadius: 14, border: "1px solid rgba(var(--text-rgb),0.06)", background: "rgba(var(--text-rgb),0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "rgba(var(--text-rgb),0.7)", margin: 0 }}>What's on the site</h2>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { href: "/practice",     label: "Question Generator", desc: "Unlimited worked practice questions for every test in BIOL 300" },
              { href: "/r-coding",     label: "R Coding Questions",        desc: "Exam-style code review: spot the statistical error (or confirm there isn't one)" },
              { href: "/formula-sheet", label: "Formula Sheet",            desc: "Hover-to-explain interactive formula reference" },
              { href: "/flowchart",    label: "What Test? Flowchart",      desc: "Interactive decision flowchart with chapter filtering" },
              { href: "/pitfalls",     label: "Statistical Pitfalls",      desc: "Common misconceptions with self-test scenarios" },
            ].map(item => (
              <li key={item.href}>
                <Link href={item.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(var(--gold-rgb),0.12)", background: "rgba(var(--gold-rgb),0.03)", textDecoration: "none", transition: "border-color 0.15s" }}
                  onMouseOver={undefined} onMouseOut={undefined}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(var(--text-rgb),0.35)", marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <span style={{ color: GOLD, fontSize: 12, opacity: 0.6 }}>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* AI disclaimer */}
        <section style={{ marginBottom: 20, padding: "22px 24px", borderRadius: 14, border: "1px solid rgba(var(--text-rgb),0.09)", background: "rgba(var(--text-rgb),0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "rgba(var(--text-rgb),0.7)", margin: 0 }}>AI-generated content</h2>
          </div>
          <p style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.5)", lineHeight: 1.75, margin: "0 0 10px" }}>
            The practice questions on this site (including biological scenarios, organism names, variable descriptions, and numerical values) were generated with the help of <strong style={{ color: "rgba(var(--text-rgb),0.7)" }}>Claude Sonnet 4.6</strong> (Anthropic). These scenarios are <strong style={{ color: "rgba(var(--text-rgb),0.7)" }}>entirely fictional</strong> and should not be treated as real research findings or cited as sources.
          </p>
          <p style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.5)", lineHeight: 1.75, margin: "0 0 10px" }}>
            The statistical methodology (test selection logic, worked solutions, and formula content) has been reviewed for correctness by the course instructor. That said, AI-generated content can occasionally contain errors or quirks. If you notice something that seems wrong or unclear, please use the <strong style={{ color: "rgba(var(--text-rgb),0.7)" }}>Report an issue</strong> button at the bottom of any worked answer to flag it.
          </p>
          <p style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.5)", lineHeight: 1.75, margin: 0 }}>
            In contrast, any data from actual published studies (as seen in the course textbook and lecture slides) would be properly cited. No real study data appear on this site without attribution.
          </p>
        </section>

        {/* Source code */}
        <section style={{ padding: "16px 20px", borderRadius: 12, border: "1px solid rgba(var(--text-rgb),0.06)", background: "rgba(var(--text-rgb),0.02)" }}>
          <p style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.4)", margin: "0 0 6px", lineHeight: 1.6 }}>
            Source code
          </p>
          <a
            href="https://github.com/vbaliga/BIOL300-practicehub"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: GOLD, textDecoration: "none", opacity: 0.85 }}
          >
            github.com/vbaliga/BIOL300-practicehub →
          </a>
        </section>

        <footer style={{ marginTop: 40, textAlign: "center", fontSize: 11, color: "rgba(var(--text-rgb),0.2)", paddingBottom: 8 }}>
          BIOL 300 Practice Hub · University of British Columbia
        </footer>
      </main>
    </div>
  );
}
