"use client";

import { useState } from "react";
import Link from "next/link";

const GOLD       = "var(--gold)";
const GOLD_LIGHT = "var(--gold-light)";
const BLUE       = "var(--surface)";
const BLUE_DARK  = "var(--bg)";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type ErrorType = "silent" | "wrong-arg" | "no-error";

interface RQuestion {
  id: string;
  title: string;
  topic: string;
  errorType: ErrorType;
  body: React.ReactNode;
  answer: React.ReactNode;
}

// ─── CODE BLOCK COMPONENTS ────────────────────────────────────────────────────

function Code({ children }: { children: string }) {
  return (
    <pre style={{
      margin: "10px 0",
      padding: "12px 16px",
      borderRadius: 8,
      background: "rgba(var(--text-rgb),0.05)",
      border: "1px solid rgba(var(--text-rgb),0.08)",
      fontFamily: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace",
      fontSize: 13,
      lineHeight: 1.6,
      color: "var(--text)",
      overflowX: "auto",
      whiteSpace: "pre",
    }}>
      {children}
    </pre>
  );
}

function ROutput({ children }: { children: string }) {
  return (
    <pre style={{
      margin: "10px 0",
      padding: "12px 16px",
      borderRadius: 8,
      background: "rgba(var(--gold-rgb),0.04)",
      border: "1px solid rgba(var(--gold-rgb),0.15)",
      fontFamily: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace",
      fontSize: 12.5,
      lineHeight: 1.7,
      color: "rgba(var(--text-rgb),0.75)",
      overflowX: "auto",
      whiteSpace: "pre",
    }}>
      {children}
    </pre>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13.5, color: "rgba(var(--text-rgb),0.65)", lineHeight: 1.75, margin: "10px 0" }}>
      {children}
    </p>
  );
}

// ─── QUESTION CARD ────────────────────────────────────────────────────────────

const ERROR_LABELS: Record<ErrorType, { label: string; color: string; bg: string }> = {
  "silent":    { label: "Silent error",   color: "var(--feedback-wrong-label)",   bg: "rgba(220,80,80,0.06)" },
  "wrong-arg": { label: "Wrong argument", color: "var(--feedback-example-label)", bg: "rgba(var(--gold-rgb),0.06)" },
  "no-error":  { label: "No error",       color: "var(--feedback-correct-label)", bg: "rgba(134,197,120,0.06)" },
};

function QuestionCard({ q, index }: { q: RQuestion; index: number }) {
  const [revealed, setRevealed] = useState(false);
  const badge = ERROR_LABELS[q.errorType];

  return (
    <div style={{ borderRadius: 14, border: "1px solid rgba(var(--text-rgb),0.08)", background: "var(--surface)", overflow: "hidden", marginBottom: 20 }}>
      {/* Header */}
      <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(var(--text-rgb),0.06)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(var(--text-rgb),0.3)" }}>Q{index + 1}</span>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(var(--gold-rgb),0.7)" }}>{q.topic}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: badge.color, background: badge.bg, border: `1px solid ${badge.color}`, whiteSpace: "nowrap" }}>
            {revealed ? badge.label : "?"}
          </span>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1.4 }}>{q.title}</h3>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 22px" }}>
        {q.body}

        <div style={{ marginTop: 18, padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(var(--text-rgb),0.09)", background: "rgba(var(--text-rgb),0.02)" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(var(--text-rgb),0.45)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Task</p>
          <p style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.65)", margin: 0, lineHeight: 1.6 }}>
            Please identify and explain any mistakes in the analysis or conclusions. If there are none, write <strong>"No mistakes"</strong>.
          </p>
        </div>

        {/* Reveal button */}
        {!revealed && (
          <button
            onClick={() => setRevealed(true)}
            style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, border: "none", background: GOLD, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            Show answer
          </button>
        )}
      </div>

      {/* Answer panel */}
      {revealed && (
        <div style={{ borderTop: "1px solid rgba(var(--text-rgb),0.07)", padding: "18px 22px", background: "rgba(var(--text-rgb),0.015)" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(var(--gold-rgb),0.6)", margin: "0 0 12px" }}>Answer</p>
          {q.answer}
        </div>
      )}
    </div>
  );
}

// ─── QUESTIONS ────────────────────────────────────────────────────────────────

const QUESTIONS: RQuestion[] = [
  {
    id: "q1-poisson-last-bin",
    title: "Poisson Goodness-of-Fit: immune cell counts per microscope field",
    topic: "Poisson GOF",
    errorType: "silent",
    body: (
      <>
        <Prose>
          A biomedical research lab is studying the number of fluorescently labelled immune cells observed per microscope field in tissue sections from an experimental inflammation model. The researchers want to test whether the number of labelled cells per field follows a Poisson distribution (α = 0.05). The true mean is unknown and is estimated from the data.
        </Prose>
        <Prose>The observed frequencies are:</Prose>
        <Code>{`obs <- c(17, 34, 30, 42, 13, 14)
names(obs) <- c("0", "1", "2", "3", "4", "5+")`}</Code>
        <Prose>This gives an estimated mean count of:</Prose>
        <Code>{`lambda <- 2.28`}</Code>
        <Prose>The researcher computes expected frequencies under a Poisson distribution:</Prose>
        <Code>{`exp <- dpois(0:5, lambda) * sum(obs)
exp`}</Code>
        <ROutput>{`        0         1         2         3         4         5
15.34263 34.98120 39.87857 30.30771 17.27540  7.87774`}</ROutput>
        <Prose>They then run:</Prose>
        <Code>{`chisq.test(x = obs, p = exp, rescale.p = TRUE)`}</Code>
        <ROutput>{`\tChi-squared test for given probabilities

data:  obs
X-squared = 12.48, df = 5, p-value = 0.0288`}</ROutput>
        <Prose>
          The researcher concludes: <em>"Because p = 0.029 is less than α = 0.05, we reject the null hypothesis. The labelled immune-cell counts do not appear consistent with a Poisson distribution."</em>
        </Prose>
      </>
    ),
    answer: (
      <>
        <Prose>
          <strong>The last expected frequency uses P(X&nbsp;=&nbsp;5) instead of P(X&nbsp;≥&nbsp;5).</strong>
        </Prose>
        <Prose>
          The observed data correctly pool all counts of 5 or more into a single <code>"5+"</code> bin. However, the expected frequencies are computed with <code>dpois(0:5, lambda)</code>, which gives P(X&nbsp;=&nbsp;5) for the final element. Notice that R's output labels that last column <code>5</code>, not <code>5+</code> — a direct signal of the mismatch.
        </Prose>
        <Prose>
          Because a Poisson variable is unbounded, the last expected bin must capture the entire remaining tail: P(X&nbsp;≥&nbsp;5) = <code>1 − ppois(4, lambda)</code>. The correct code is:
        </Prose>
        <Code>{`exp <- c(dpois(0:4, lambda), 1 - ppois(4, lambda)) * sum(obs)`}</Code>
        <Prose>
          This raises the last expected frequency from 7.88 to <strong>12.22</strong>. Re-running the test with the corrected expected values gives:
        </Prose>
        <ROutput>{`X-squared = 8.48, df = 5, p-value = 0.131`}</ROutput>
        <Prose>
          With p&nbsp;=&nbsp;0.131&nbsp;&gt;&nbsp;0.05, we <strong>fail to reject</strong> H₀ — the opposite conclusion. The researcher's rejection of the Poisson model is an artefact of using the wrong expected probability for the last bin. Using <code>rescale.p = TRUE</code> masked the error by renormalising the incomplete probability vector, which changed the effective null hypothesis without producing any warning.
        </Prose>
      </>
    ),
  },
];

// ─── PHILOSOPHY ───────────────────────────────────────────────────────────────

const PHILOSOPHY = [
  { icon: "⚠", title: "Silent errors",    desc: "Code that runs without crashing but produces the wrong statistical result — the hardest class of mistake to catch." },
  { icon: "⚙", title: "Wrong arguments",  desc: "Functions called with incorrect options for the situation, e.g. paired = TRUE on a two-sample test." },
  { icon: "✓", title: "Correct code",     desc: "Some questions have no errors at all — a reminder to think critically rather than assume something must be wrong." },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────

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
        <section style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "rgba(var(--text-rgb),0.7)", margin: 0 }}>What to expect</h2>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {PHILOSOPHY.map(p => (
              <div key={p.title} style={{ flex: "1 1 200px", padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(var(--text-rgb),0.07)", background: "rgba(var(--text-rgb),0.02)" }}>
                <div style={{ fontSize: 16, marginBottom: 6 }}>{p.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(var(--text-rgb),0.8)", marginBottom: 4 }}>{p.title}</div>
                <p style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.4)", lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Questions */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "rgba(var(--text-rgb),0.85)", margin: 0 }}>Questions</h2>
            <span style={{ fontSize: 11, color: "rgba(var(--text-rgb),0.3)", fontWeight: 600 }}>{QUESTIONS.length} question{QUESTIONS.length !== 1 ? "s" : ""}</span>
            <div style={{ flex: 1, height: 1, background: "rgba(var(--gold-rgb),0.1)" }} />
          </div>

          {QUESTIONS.map((q, i) => <QuestionCard key={q.id} q={q} index={i} />)}
        </section>

        <footer style={{ marginTop: 48, textAlign: "center", fontSize: 11, color: "rgba(var(--text-rgb),0.2)", paddingBottom: 8 }}>
          BIOL 300 Practice Hub · University of British Columbia
        </footer>
      </main>
    </div>
  );
}
