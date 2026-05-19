"use client";

import { useState } from "react";
import Link from "next/link";

const GOLD        = "#c6973f";
const GOLD_LIGHT  = "#e8c27a";
const BLUE        = "#002145";
const BLUE_DARK   = "#001830";

// ─── PITFALL DATA ─────────────────────────────────────────────────────────────

interface Pitfall {
  id: string;
  title: string;
  misconception: string;
  correction: string;
  example?: string;
  tip?: string;
}

const PITFALLS: Pitfall[] = [
  {
    id: "p-gt-05",
    title: "P > 0.05 means the null hypothesis is true",
    misconception: "\"We found P = 0.23, so there is no effect.\"",
    correction:
      "Failing to reject H₀ is not the same as evidence that H₀ is true. A non-significant P-value means only that the data are not inconsistent with H₀ — it could equally reflect low power (small n), high variability, or a real effect that was too small to detect. Absence of evidence is not evidence of absence.",
    example:
      "A study tests whether a new drug reduces blood pressure. With n = 8 per group, P = 0.18. The drug could still have a real effect — the study was simply underpowered to detect it.",
    tip: "Always report confidence intervals alongside P-values. A wide CI that includes 0 communicates far more than 'P > 0.05' alone.",
  },
  {
    id: "ci-interpretation",
    title: "\"There is a 95% chance the true mean is in this interval\"",
    misconception: "\"The 95% CI is (4.2, 8.7), so the true mean μ has a 95% probability of being between 4.2 and 8.7.\"",
    correction:
      "The true population parameter μ is fixed — it either is or is not in any particular interval. What is random is the interval itself, which changes from sample to sample. The correct interpretation: if you repeated the study many times and computed a 95% CI each time, 95% of those intervals would contain the true μ. This specific interval either contains μ or it doesn't — we just don't know which.",
    example:
      "After collecting one sample, you compute the 95% CI (4.2, 8.7). This interval was constructed by a procedure that captures μ 95% of the time, not that this particular interval has a 95% chance of containing μ.",
    tip: "Think of it as: 95% of intervals built this way will contain μ — not a probability statement about this specific interval.",
  },
  {
    id: "causation",
    title: "Statistical significance implies causation",
    misconception:
      "\"The regression of forest cover on bird diversity was highly significant (P < 0.001, r² = 0.71), so forest cover causes higher bird diversity.\"",
    correction:
      "Statistical significance tells you the association is unlikely to be due to chance alone — it says nothing about the causal direction or mechanism. Causation requires experimental manipulation (random assignment of treatments), biological plausibility, ruling out confounders, and replication. Observational studies can identify associations but cannot establish causation on their own.",
    example:
      "Ice cream sales and drowning rates are positively correlated (both peak in summer). A regression would be highly significant. Ice cream does not cause drowning — temperature is the confounding variable.",
    tip: "Reserve causal language (\"causes\", \"leads to\", \"drives\") for properly designed experiments. For observational data, use \"is associated with\" or \"predicts\".",
  },
  {
    id: "proof",
    title: "Statistics can \"prove\" a hypothesis",
    misconception:
      "\"Our results prove that the two populations have different means.\" or \"We proved the treatment has no effect.\"",
    correction:
      "Statistical hypothesis testing never proves anything — it quantifies evidence. Rejecting H₀ means the data would be unlikely if H₀ were true (at the chosen α level), not that H₀ is false. Science works by accumulating evidence and updating beliefs, not by logical proof. Results should be interpreted as \"consistent with\", \"provides evidence for\", or \"supports\" a hypothesis.",
    example:
      "A t-test gives P = 0.003. The correct phrasing is: \"We found strong evidence that the means differ (t₂₄ = 3.8, P = 0.003)\" — not \"we proved the means are different\".",
    tip: "Use phrases like \"the data are consistent with\", \"we found evidence that\", or \"results support the hypothesis\". Acknowledge that future data could overturn current conclusions.",
  },
];

// ─── SCENARIO QUESTIONS ───────────────────────────────────────────────────────

interface Scenario {
  id: string;
  pitfallId: string;
  premise: string;
  claimA: string;
  claimB: string;
  correctAnswer: "A" | "B";
  explanation: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "s1",
    pitfallId: "causation",
    premise:
      "A researcher runs a simple linear regression of exercise frequency (hours/week) on resting heart rate in 120 university students. The result is significant: b = −2.4 bpm per hour/week, P < 0.001, r² = 0.38.",
    claimA: "\"Exercise significantly predicts resting heart rate (P < 0.001). More exercise is associated with lower resting heart rate, explaining 38% of variability in this sample.\"",
    claimB: "\"The regression was significant (P < 0.001), so exercising more causes a lower resting heart rate.\"",
    correctAnswer: "A",
    explanation:
      "Claim A is correct. This is an observational study — students were not randomly assigned to exercise levels. Claim B commits the causation fallacy: the association could reflect reverse causality (fitter people choose to exercise more), confounders (diet, genetics), or other variables. Only Claim A uses appropriately cautious language ('predicts', 'associated with').",
  },
  {
    id: "s2",
    pitfallId: "p-gt-05",
    premise:
      "A clinical trial of a new antibiotic compares recovery time in n = 12 patients (antibiotic) vs. n = 12 (placebo). Welch's t-test gives t₂₂ = 1.8, P = 0.085. The mean difference is 1.4 days (95% CI: −0.2 to 3.0 days).",
    claimA: "\"There was no significant difference in recovery time (P = 0.085), providing evidence that the antibiotic has no effect.\"",
    claimB: "\"The study did not detect a significant difference at α = 0.05 (P = 0.085). The 95% CI (−0.2 to 3.0 days) is wide and consistent with a clinically meaningful benefit — a larger study would be needed to draw firm conclusions.\"",
    correctAnswer: "B",
    explanation:
      "Claim A misinterprets P > 0.05 as evidence of no effect. With only n = 12 per group, statistical power is low. The CI actually includes differences as large as 3 days faster recovery — potentially clinically important. Claim B correctly acknowledges the limitation of the study and avoids the false equivalence of 'not significant = no effect'.",
  },
  {
    id: "s3",
    pitfallId: "proof",
    premise:
      "A genetics study tests whether a point mutation affects enzyme activity. An ANOVA comparing three genotype groups gives F₂,₈₇ = 6.4, P = 0.002.",
    claimA: "\"Our results proved that the point mutation affects enzyme activity (F₂,₈₇ = 6.4, P = 0.002).\"",
    claimB: "\"We found strong evidence that enzyme activity differs among genotypes (F₂,₈₇ = 6.4, P = 0.002). The data are inconsistent with the null hypothesis of equal means.\"",
    correctAnswer: "B",
    explanation:
      "Claim A uses the word 'proved', which is inappropriate in science — statistical tests quantify evidence, not logical certainty. The result could reflect Type I error, an uncontrolled confound, or a real effect — all we know is P = 0.002 is unlikely under H₀. Claim B correctly reports the result as evidence and references the null hypothesis.",
  },
];

// ─── SCENARIO CARD ────────────────────────────────────────────────────────────

function ScenarioCard({ s }: { s: Scenario }) {
  const [choice, setChoice] = useState<"A" | "B" | null>(null);
  const revealed = choice !== null;
  const correct = choice === s.correctAnswer;

  return (
    <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)", padding: "20px 22px", marginBottom: 14 }}>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.65, margin: "0 0 18px", fontStyle: "italic" }}>
        {s.premise}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {(["A", "B"] as const).map(opt => {
          const isCorrect = opt === s.correctAnswer;
          const chosen = choice === opt;
          let border = "rgba(255,255,255,0.12)";
          let bg = "transparent";
          let color = "rgba(255,255,255,0.6)";
          if (revealed) {
            if (isCorrect)    { border = "rgba(134,197,120,0.55)"; bg = "rgba(134,197,120,0.08)"; color = "#a8e09a"; }
            else if (chosen)  { border = "rgba(220,80,80,0.5)"; bg = "rgba(220,80,80,0.07)"; color = "rgba(255,130,130,0.9)"; }
            else              { color = "rgba(255,255,255,0.2)"; }
          } else if (chosen) {
            border = "rgba(198,151,63,0.5)"; bg = "rgba(198,151,63,0.08)"; color = GOLD_LIGHT;
          }
          return (
            <button
              key={opt}
              type="button"
              onClick={() => { if (!revealed) setChoice(opt); }}
              style={{ textAlign: "left", padding: "11px 16px", borderRadius: 10, border: `1.5px solid ${border}`, background: bg, color, fontSize: 13, cursor: revealed ? "default" : "pointer", lineHeight: 1.5, transition: "border-color 0.18s, background 0.18s, color 0.18s" }}
            >
              <span style={{ fontWeight: 700, marginRight: 8 }}>
                {revealed && isCorrect && "✓ "}
                {revealed && chosen && !isCorrect && "✗ "}
                {opt}.
              </span>
              {opt === "A" ? s.claimA : s.claimB}
            </button>
          );
        })}
      </div>
      {revealed && (
        <div style={{ padding: "14px 16px", borderRadius: 10, border: `1px solid ${correct ? "rgba(134,197,120,0.3)" : "rgba(220,80,80,0.25)"}`, background: correct ? "rgba(134,197,120,0.06)" : "rgba(220,80,80,0.06)" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: correct ? "#a8e09a" : "rgba(255,130,130,0.9)", margin: "0 0 6px" }}>
            {correct ? "Correct!" : `Incorrect — the better statement is ${s.correctAnswer}`}
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: 0 }}>{s.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function PitfallsPage() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: BLUE_DARK }}>

      {/* Nav */}
      <header style={{ background: BLUE, borderBottom: "1px solid rgba(198,151,63,0.18)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 3, height: 20, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: GOLD, textDecoration: "none" }}>BIOL 300 Practice Hub</Link>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 14 }}>/</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Statistical Pitfalls</span>
          </div>
          <Link href="/practice" style={{ fontSize: 12, fontWeight: 600, color: GOLD_LIGHT, textDecoration: "none", opacity: 0.7 }}>Practice →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "36px 24px 72px" }}>

        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(198,151,63,0.55)", margin: "0 0 8px" }}>Common Misconceptions</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", margin: "0 0 8px" }}>Statistical Pitfalls</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", margin: 0 }}>
            Four misconceptions that appear frequently on exams — and in published papers. Click a pitfall to expand it, then test yourself with the scenarios below.
          </p>
        </div>

        {/* Pitfall cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 48 }}>
          {PITFALLS.map(p => {
            const open = activeId === p.id;
            return (
              <div key={p.id} style={{ borderRadius: 12, border: `1px solid ${open ? "rgba(198,151,63,0.35)" : "rgba(255,255,255,0.07)"}`, background: open ? "rgba(198,151,63,0.05)" : "rgba(255,255,255,0.02)", overflow: "hidden", transition: "border-color 0.2s, background 0.2s" }}>
                <button
                  type="button"
                  onClick={() => setActiveId(open ? null : p.id)}
                  style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}
                >
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(220,80,80,0.7)", marginBottom: 5 }}>Misconception</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: open ? "#fff" : "rgba(255,255,255,0.75)", lineHeight: 1.45 }}>{p.title}</div>
                    {!open && (
                      <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.3)", fontStyle: "italic", lineHeight: 1.4 }}>
                        {p.misconception}
                      </div>
                    )}
                  </div>
                  <span style={{ color: GOLD, fontSize: 13, flexShrink: 0, marginTop: 2 }}>{open ? "▲" : "▼"}</span>
                </button>

                {open && (
                  <div style={{ padding: "0 20px 20px" }}>
                    {/* Example wrong statement */}
                    <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(220,80,80,0.07)", border: "1px solid rgba(220,80,80,0.2)", marginBottom: 16 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(220,80,80,0.6)", marginBottom: 5 }}>Common (wrong) statement</div>
                      <p style={{ fontSize: 13, color: "rgba(255,150,150,0.85)", lineHeight: 1.55, margin: 0, fontStyle: "italic" }}>{p.misconception}</p>
                    </div>

                    {/* Correction */}
                    <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(134,197,120,0.06)", border: "1px solid rgba(134,197,120,0.2)", marginBottom: p.example || p.tip ? 16 : 0 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(134,197,120,0.6)", marginBottom: 5 }}>Correction</div>
                      <p style={{ fontSize: 13, color: "rgba(200,240,190,0.85)", lineHeight: 1.6, margin: 0 }}>{p.correction}</p>
                    </div>

                    {p.example && (
                      <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(99,164,255,0.06)", border: "1px solid rgba(99,164,255,0.18)" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(99,164,255,0.6)", marginBottom: 5 }}>Example</div>
                        <p style={{ fontSize: 13, color: "rgba(160,200,255,0.8)", lineHeight: 1.6, margin: 0 }}>{p.example}</p>
                      </div>
                    )}

                    {p.tip && (
                      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: GOLD, opacity: 0.7, flexShrink: 0, marginTop: 1 }}>Tip</span>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0 }}>{p.tip}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scenario section */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: 0 }}>Evaluate these conclusions</h2>
            <div style={{ flex: 1, height: 1, background: "rgba(198,151,63,0.1)" }} />
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "0 0 20px", lineHeight: 1.55 }}>
            Two researchers write up the same result differently. Which statement is more appropriate?
          </p>
          {SCENARIOS.map(s => <ScenarioCard key={s.id} s={s} />)}
        </div>

        <footer style={{ marginTop: 32, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", paddingBottom: 16 }}>
          BIOL 300 Practice Hub · Whitlock &amp; Schluter, 3rd ed. · UBC &nbsp;·&nbsp;
          <Link href="/" style={{ color: GOLD, textDecoration: "none", opacity: 0.7 }}>Home</Link>
        </footer>
      </main>
    </div>
  );
}
