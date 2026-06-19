"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  generateQuestion,
  generateIdentifyOnly,
  GeneratedQuestion,
  AnswerBlock,
  TestType,
  TEST_LABELS,
  TEST_CHAPTER,
} from "../questionGenerator";
import katex from "katex";
import { SECTIONS, type Formula } from "../lib/formulaData";

// ─── CONSTANTS ──────────────────────────────────────────────────────────────────

const IDENTIFY_ONLY_TYPES: TestType[] = [
  "mann-whitney", "kruskal-wallis", "spearman", "fishers-exact",
  "ancova", "multifactor-anova",
];

const CALCULABLE_TYPES: TestType[] = [
  "ci-mean", "binomial", "chi-square-gof", "poisson-gof",
  "chi-square-contingency", "one-sample-t", "two-sample-t",
  "paired-t", "anova", "correlation", "regression",
];

const CHAPTER_OPTIONS = [
  { value: 4,  label: "Ch. 4 — Estimating with uncertainty" },
  { value: 5,  label: "Ch. 5 — Probability" },
  { value: 6,  label: "Ch. 6 — Hypothesis testing (intro)" },
  { value: 7,  label: "Ch. 7 — Analyzing proportions" },
  { value: 8,  label: "Ch. 8 — Fitting probability models" },
  { value: 9,  label: "Ch. 9 — Contingency analysis" },
  { value: 10, label: "Ch. 10 — The normal distribution" },
  { value: 11, label: "Ch. 11 — One-sample t-test" },
  { value: 12, label: "Ch. 12 — Comparing two means" },
  { value: 13, label: "Ch. 13 — Handling violations" },
  { value: 14, label: "Ch. 14 — Designing experiments" },
  { value: 15, label: "Ch. 15 — Comparing means of 3+ groups" },
  { value: 16, label: "Ch. 16 — Correlation" },
  { value: 17, label: "Ch. 17 — Regression" },
  { value: 18, label: "Ch. 18 — Multiple explanatory variables" },
];

const GOLD = "var(--gold)";
const GOLD_LIGHT = "var(--gold-light)";
const BLUE = "var(--surface)";
const BLUE_DARK = "var(--bg)";
const BLUE_MID = "var(--surface-mid)";

// ─── INLINE MATH RENDERER ────────────────────────────────────────────────────────

function renderInlineMath(text: string): string {
  return text.split(/\$([^$]+)\$/g).map((part, i) => {
    if (i % 2 === 1) {
      try { return katex.renderToString(part, { throwOnError: false, displayMode: false }); }
      catch { return part; }
    }
    return part
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");
  }).join("");
}

// ─── TABLE RENDERER ─────────────────────────────────────────────────────────────

function esc(s: string) {
  return s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function TableFromText({ text }: { text: string }) {
  const rows = text.split("\n")
    .filter(l => l.trim())
    .map(l => l.split("|").filter((_, i, a) => i > 0 && i < a.length - 1).map(c => c.trim()))
    .filter(cells => !cells.every(c => /^[-: ]+$/.test(c)));
  return (
    <div style={{ overflowX: "auto", margin: "12px 0", borderRadius: 8, border: "1px solid rgba(var(--gold-rgb),0.2)" }}>
      <table style={{ minWidth: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        {rows.map((cells, ri) => (
          <tr key={ri} style={{ borderBottom: `1px solid ${ri === 0 ? "rgba(var(--gold-rgb),0.2)" : "rgba(var(--text-rgb),0.05)"}`, background: ri === 0 ? "rgba(var(--gold-rgb),0.06)" : "transparent" }}>
            {cells.map((cell, ci) => ri === 0 ? (
              <th key={ci} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: GOLD_LIGHT, whiteSpace: "nowrap" }}
                dangerouslySetInnerHTML={{ __html: renderInlineMath(cell) }} />
            ) : (
              <td key={ci} style={{ padding: "8px 12px", fontSize: 13, color: "rgba(var(--text-rgb),0.75)", whiteSpace: "nowrap" }}
                dangerouslySetInnerHTML={{ __html: renderInlineMath(cell) }} />
            ))}
          </tr>
        ))}
      </table>
    </div>
  );
}

// ─── ANSWER BLOCK RENDERER ──────────────────────────────────────────────────────

function Block({ b }: { b: AnswerBlock }) {
  switch (b.kind) {
    case "heading":
      return <div style={{ marginTop: 22, marginBottom: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: GOLD }}>{b.text}</div>;

    case "text":
      if (b.text.includes("|") && b.text.includes("\n")) return <TableFromText text={b.text} />;
      if (/^[\d., ()-]+$/.test(b.text.trim()) && b.text.includes(","))
        return <p style={{ fontFamily: "ui-monospace,monospace", fontSize: 12, color: GOLD_LIGHT, background: "rgba(var(--gold-rgb),0.07)", borderRadius: 8, padding: "10px 14px", margin: "8px 0", lineHeight: 1.7, wordBreak: "break-all" }}>{b.text}</p>;
      return <p style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.6)", lineHeight: 1.65, margin: "5px 0", whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: renderInlineMath(b.text) }} />;

    case "formula":
      return (
        <div style={{ margin: "10px 0", borderRadius: 10, border: "1px solid rgba(var(--gold-rgb),0.25)", background: "rgba(var(--gold-rgb),0.07)", padding: "12px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: GOLD, marginBottom: 4, opacity: 0.7 }}>{b.label}</div>
          <div style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.7)" }}
            dangerouslySetInnerHTML={{ __html: renderInlineMath(b.formula) }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: GOLD_LIGHT, marginTop: 6 }}
        dangerouslySetInnerHTML={{ __html: renderInlineMath(b.result) }} />
        </div>
      );

    case "pvalue": {
      const sig = /P < 0\.0[0-9]|0\.001 < P < 0\.01|0\.01 < P < 0\.02|0\.005 < P < 0\.01|0\.001 < P < 0\.005|P < 0\.0005|0\.01 < P < 0\.025|0\.02 < P < 0\.05/.test(b.range);
      return (
        <div style={{ margin: "10px 0", borderRadius: 10, padding: "12px 16px", textAlign: "center", border: `1px solid ${sig ? "rgba(var(--gold-rgb),0.4)" : "rgba(var(--text-rgb),0.1)"}`, background: sig ? "rgba(var(--gold-rgb),0.1)" : "rgba(var(--text-rgb),0.03)" }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(var(--text-rgb),0.35)", marginRight: 10 }}>P-value</span>
          <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 20, fontWeight: 800, color: sig ? GOLD_LIGHT : "rgba(var(--text-rgb),0.5)" }}>{b.range}</span>
        </div>
      );
    }

    case "conclusion":
      return (
        <div style={{ marginTop: 16, borderRadius: 10, border: "1px solid rgba(var(--gold-rgb),0.19)", background: "rgba(var(--gold-rgb),0.07)", padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: GOLD, opacity: 0.7, marginBottom: 6 }}>Conclusion</div>
          <p style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.85)", lineHeight: 1.65, margin: 0 }}
            dangerouslySetInnerHTML={{ __html: renderInlineMath(b.text) }} />
        </div>
      );

    case "list":
      return (
        <ul style={{ margin: "6px 0 6px 4px", paddingLeft: 18 }}>
          {b.items.map((item, i) => (
            <li key={i} style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.6)", lineHeight: 1.85, listStyleType: "disc" }}
              dangerouslySetInnerHTML={{ __html: renderInlineMath(item) }} />
          ))}
        </ul>
      );

    default: return null;
  }
}

// ─── QUESTION TEXT ───────────────────────────────────────────────────────────────

function QuestionText({ text }: { text: string }) {
  return (
    <div>
      {text.split("\n\n").filter(Boolean).map((para, i) => {
        if (para.includes("|") && para.includes("\n")) return <TableFromText key={i} text={para} />;
        if (/^[\d., ()-]+$/.test(para.trim()) && para.includes(","))
          return <p key={i} style={{ fontFamily: "ui-monospace,monospace", fontSize: 12, color: GOLD_LIGHT, background: "rgba(var(--gold-rgb),0.07)", borderRadius: 8, padding: "10px 14px", margin: "8px 0", lineHeight: 1.7, wordBreak: "break-all" }}>{para}</p>;
        if (para.includes("**"))
          return <p key={i} style={{ fontSize: 14, color: "rgba(var(--text-rgb),0.85)", lineHeight: 1.65, margin: "6px 0" }} dangerouslySetInnerHTML={{ __html: esc(para) }} />;
        return <p key={i} style={{ fontSize: 14, color: "rgba(var(--text-rgb),0.8)", lineHeight: 1.65, margin: "6px 0" }}>{para}</p>;
      })}
    </div>
  );
}

// ─── CUSTOM CHAPTER SELECT ───────────────────────────────────────────────────────

function ChapterSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = CHAPTER_OPTIONS.find(o => o.value === value);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setOpenAbove(window.innerHeight - rect.bottom < 360);
    }
    if (open && listRef.current) {
      const el = listRef.current.querySelector('[data-selected="true"]') as HTMLElement | null;
      if (el) el.scrollIntoView({ block: "center" });
    }
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 14px", borderRadius: 10, border: `1px solid ${open ? "rgba(var(--gold-rgb),0.5)" : "rgba(var(--text-rgb),0.12)"}`, background: "var(--surface)", color: "var(--text)", fontSize: 13, cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ color: "rgba(var(--text-rgb),0.85)" }}>{selected?.label}</span>
        <span style={{ color: GOLD, fontSize: 10, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ position: "absolute", ...(openAbove ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }), left: 0, right: 0, background: "var(--surface)", border: "1px solid rgba(var(--text-rgb),0.12)", borderRadius: 10, overflow: "hidden", zIndex: 100, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
          <div ref={listRef} style={{ maxHeight: 360, overflowY: "auto" }}>
            {CHAPTER_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                data-selected={o.value === value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={{ width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 13, background: o.value === value ? "rgba(var(--gold-rgb),0.12)" : "transparent", color: o.value === value ? GOLD_LIGHT : "rgba(var(--text-rgb),0.7)", border: "none", cursor: "pointer", borderBottom: "1px solid rgba(var(--text-rgb),0.04)" }}
                onMouseOver={e => { if (o.value !== value) e.currentTarget.style.background = "rgba(var(--text-rgb),0.05)"; }}
                onMouseOut={e => { if (o.value !== value) e.currentTarget.style.background = "transparent"; }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FORMULA PANEL ───────────────────────────────────────────────────────────────

function FormulaCardSmall({ f }: { f: Formula }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 10,
        border: `1px solid ${hovered ? "rgba(var(--gold-rgb),0.45)" : "rgba(var(--gold-rgb),0.12)"}`,
        background: hovered ? "rgba(var(--gold-rgb),0.07)" : "rgba(var(--text-rgb),0.02)",
        padding: "11px 14px",
        cursor: "default",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        transition: "transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease",
        boxShadow: hovered ? "0 6px 20px rgba(0,0,0,0.3)" : "none",
        position: "relative",
        zIndex: hovered ? 2 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        {f.chapter !== undefined && (
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.07em", color: "rgba(var(--gold-rgb),0.45)", background: "rgba(var(--gold-rgb),0.08)", border: "1px solid rgba(var(--gold-rgb),0.15)", borderRadius: 100, padding: "1px 6px", flexShrink: 0 }}>
            Ch.{f.chapter}
          </span>
        )}
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(var(--text-rgb),0.35)" }}>
          {f.name}
        </span>
      </div>
      <div
        style={{ color: hovered ? "var(--gold-light)" : "rgba(var(--text-rgb),0.8)", fontSize: "0.8em", overflowX: "auto", transition: "color 0.18s ease" }}
        dangerouslySetInnerHTML={{ __html: katex.renderToString(f.latex, { throwOnError: false, displayMode: false }) }}
      />
      <div style={{ maxHeight: hovered ? "200px" : "0px", opacity: hovered ? 1 : 0, overflow: "hidden", transition: "max-height 0.28s cubic-bezier(0.16,1,0.3,1), opacity 0.22s ease" }}>
        <div style={{ borderTop: "1px solid rgba(var(--gold-rgb),0.15)", marginTop: 10, paddingTop: 10 }}>
          <p style={{ fontSize: 11, color: "rgba(var(--text-rgb),0.65)", lineHeight: 1.6, margin: "0 0 8px" }}>{f.explanation}</p>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold)", opacity: 0.7, flexShrink: 0, marginTop: 2 }}>When</span>
            <p style={{ fontSize: 10, color: "rgba(var(--text-rgb),0.38)", lineHeight: 1.55, margin: 0 }}>{f.when}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolkitPanel({ panel, onClose }: { panel: "formulas" | "flowchart" | null; onClose: () => void }) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const open = panel !== null;
  const visibleSections = activeSection ? SECTIONS.filter(s => s.id === activeSection) : SECTIONS;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200,
          opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 420,
        background: "var(--surface)",
        borderLeft: "1px solid rgba(var(--gold-rgb),0.25)",
        zIndex: 201,
        display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: open ? "-16px 0 60px rgba(0,0,0,0.5)" : "none",
      }}>
        {/* Panel header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(var(--gold-rgb),0.15)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: "var(--gold)", flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
              {panel === "formulas" ? "Formula Sheet" : "What Test? Flowchart"}
            </span>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(var(--text-rgb),0.1)", background: "rgba(var(--text-rgb),0.05)", color: "rgba(var(--text-rgb),0.5)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
            ✕
          </button>
        </div>

        {/* Formula sheet content */}
        {panel === "formulas" && (
          <>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(var(--text-rgb),0.05)", display: "flex", flexWrap: "wrap", gap: 6, flexShrink: 0 }}>
              <button type="button" onClick={() => setActiveSection(null)}
                style={{ padding: "3px 10px", borderRadius: 100, fontSize: 10, fontWeight: 600, cursor: "pointer", border: `1px solid ${!activeSection ? "rgba(var(--gold-rgb),0.6)" : "rgba(var(--text-rgb),0.1)"}`, background: !activeSection ? "rgba(var(--gold-rgb),0.14)" : "transparent", color: !activeSection ? "var(--gold-light)" : "rgba(var(--text-rgb),0.4)" }}>
                All
              </button>
              {SECTIONS.map(s => (
                <button key={s.id} type="button" onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
                  style={{ padding: "3px 10px", borderRadius: 100, fontSize: 10, fontWeight: 600, cursor: "pointer", border: `1px solid ${activeSection === s.id ? "rgba(var(--gold-rgb),0.6)" : "rgba(var(--text-rgb),0.1)"}`, background: activeSection === s.id ? "rgba(var(--gold-rgb),0.14)" : "transparent", color: activeSection === s.id ? "var(--gold-light)" : "rgba(var(--text-rgb),0.4)" }}>
                  {s.title}
                </button>
              ))}
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px 32px" }}>
              <p style={{ fontSize: 10, color: "rgba(var(--text-rgb),0.25)", margin: "0 0 16px", letterSpacing: "0.03em" }}>
                Hover any formula for an explanation.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                {visibleSections.map(section => (
                  <div key={section.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(var(--gold-rgb),0.55)" }}>{section.title}</span>
                      <div style={{ flex: 1, height: 1, background: "rgba(var(--gold-rgb),0.08)" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {section.formulas.map(f => <FormulaCardSmall key={f.id} f={f} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(var(--text-rgb),0.05)", flexShrink: 0 }}>
              <Link href="/formula-sheet" target="_blank" style={{ fontSize: 11, color: "var(--gold)", textDecoration: "none", opacity: 0.7 }}>
                Open full formula sheet →
              </Link>
            </div>
          </>
        )}

        {/* Flowchart content */}
        {panel === "flowchart" && (
          <>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <iframe
                src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/flowchart`}
                style={{ width: "100%", height: "100%", border: "none" }}
                title="What Test? Flowchart"
              />
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(var(--text-rgb),0.05)", flexShrink: 0 }}>
              <Link href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/flowchart`} target="_blank" style={{ fontSize: 11, color: "var(--gold)", textDecoration: "none", opacity: 0.7 }}>
                Open full flowchart →
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────────

const MCQ_DISTRACTORS: Partial<Record<TestType, TestType[]>> = {
  "ci-mean":                ["one-sample-t", "two-sample-t", "paired-t"],
  "binomial":               ["chi-square-gof", "poisson-gof", "fishers-exact"],
  "chi-square-gof":         ["poisson-gof", "binomial", "chi-square-contingency"],
  "poisson-gof":            ["chi-square-gof", "binomial", "chi-square-contingency"],
  "chi-square-contingency": ["fishers-exact", "chi-square-gof", "binomial"],
  "one-sample-t":           ["two-sample-t", "paired-t", "ci-mean"],
  "two-sample-t":           ["paired-t", "one-sample-t", "mann-whitney"],
  "paired-t":               ["two-sample-t", "one-sample-t", "mann-whitney"],
  "anova":                  ["two-sample-t", "kruskal-wallis", "regression"],
  "correlation":            ["regression", "spearman", "anova"],
  "regression":             ["correlation", "anova", "ci-mean"],
  "mann-whitney":           ["two-sample-t", "paired-t", "kruskal-wallis"],
  "kruskal-wallis":         ["anova", "mann-whitney", "chi-square-gof"],
  "spearman":               ["correlation", "regression", "mann-whitney"],
  "fishers-exact":          ["chi-square-contingency", "binomial", "chi-square-gof"],
  "multifactor-anova":      ["anova", "ancova", "regression"],
  "ancova":                 ["anova", "regression", "multifactor-anova"],
};

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────────

export default function PracticePage() {
  const [maxChapter, setMaxChapter] = useState(18);
  const [identifyMode, setIdentifyMode] = useState(false);
  const [selectedTests, setSelectedTests] = useState<Set<TestType>>(new Set([...CALCULABLE_TYPES, ...IDENTIFY_ONLY_TYPES]));
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [seed, setSeed] = useState(0);
  const [toolkitPanel, setToolkitPanel] = useState<"formulas" | "flowchart" | null>(null);
  const [toolkitDropOpen, setToolkitDropOpen] = useState(false);
  const [showTestConfig, setShowTestConfig] = useState(false);
  const [mcqOptions, setMcqOptions] = useState<TestType[]>([]);
  const [mcqChoice, setMcqChoice] = useState<TestType | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportStatus, setReportStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const availableCalculable  = CALCULABLE_TYPES.filter(t => TEST_CHAPTER[t] <= maxChapter);
  const availableIdentifyOnly = IDENTIFY_ONLY_TYPES.filter(t => TEST_CHAPTER[t] <= maxChapter);
  const allAvailable          = [...availableCalculable, ...availableIdentifyOnly];

  // Keep selectedTests in sync when chapter changes
  useEffect(() => {
    setSelectedTests(prev => {
      const next = new Set(prev);
      for (const t of [...CALCULABLE_TYPES, ...IDENTIFY_ONLY_TYPES]) {
        if (TEST_CHAPTER[t] > maxChapter) next.delete(t);
      }
      return next;
    });
  }, [maxChapter]);

  const toggleTest = (t: TestType) => {
    setSelectedTests(prev => {
      const next = new Set(prev);
      if (next.has(t)) { if (next.size > 1) next.delete(t); }
      else next.add(t);
      return next;
    });
  };

  const selectAll  = () => { setIdentifyMode(false); setSelectedTests(new Set(allAvailable)); setShowTestConfig(false); };
  const selectCalc = () => { setIdentifyMode(false); setSelectedTests(new Set(availableCalculable)); setShowTestConfig(false); };
  const selectId   = () => { setIdentifyMode(true);  setSelectedTests(new Set(allAvailable)); setShowTestConfig(false); };

  const rng = useCallback(() => Math.random(), []);

  const generate = useCallback(() => {
    const pool = [...selectedTests].filter(t => allAvailable.includes(t));
    if (pool.length === 0) return;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    const s = Date.now() + Math.floor(Math.random() * 1e9);
    setSeed(s);
    const q = identifyMode
      ? generateIdentifyOnly(chosen, rng)
      : generateQuestion({ maxChapter, testType: chosen }, s);
    setQuestion(q);
    setShowAnswer(false);
    setMcqChoice(null);
    setReportOpen(false);
    setReportText("");
    setReportStatus("idle");
    const fixedDistractors = MCQ_DISTRACTORS[chosen];
    const distractors = fixedDistractors
      ? fixedDistractors
      : shuffleArr(allAvailable.filter(t => t !== chosen)).slice(0, 3);
    setMcqOptions(shuffleArr([chosen, ...distractors]));
  }, [selectedTests, allAvailable, maxChapter, identifyMode, rng]);

  const allCalcSelected = availableCalculable.length > 0 && availableCalculable.every(t => selectedTests.has(t));
  const allTestsSelected = allAvailable.length > 0 && allAvailable.every(t => selectedTests.has(t));
  const isAllPreset  = !identifyMode && allTestsSelected;
  const isCalcPreset = !identifyMode && allCalcSelected && !allTestsSelected;
  const isIdPreset   = identifyMode && allTestsSelected;

  const filterLabel = isAllPreset ? "All tests" : isCalcPreset ? "Calculable only" : isIdPreset ? "Identify only" : `${selectedTests.size} tests`;

  const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid rgba(var(--text-rgb),0.08)", borderLeft: "3px solid var(--gold)", borderRadius: 10, padding: 24, position: "relative", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" };

  return (
    <>
      <style>{`
        .chip-btn { transition: background 0.15s, border-color 0.15s, color 0.15s; }
        .quick-btn { transition: background 0.15s, border-color 0.15s, color 0.15s; }
        .quick-btn:hover { border-color: rgba(var(--gold-rgb),0.5) !important; color: rgba(var(--text-rgb),0.9) !important; }
        .action-btn { transition: opacity 0.15s, transform 0.1s; }
        .action-btn:hover { opacity: 0.88; }
        .action-btn:active { transform: scale(0.97); }
        .reveal-btn { transition: background 0.15s, border-color 0.15s; }
        .new-btn { transition: background 0.15s; }
        .new-btn:hover { background: rgba(var(--text-rgb),0.08) !important; }
      `}</style>

      <div style={{ minHeight: "100vh", background: BLUE_DARK }}>

        {/* Nav */}
        <header style={{ background: BLUE, borderBottom: "1px solid rgba(var(--gold-rgb),0.18)", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
              <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: GOLD, textDecoration: "none" }}>BIOL 300 Practice Hub</Link>
              <span style={{ color: "rgba(var(--text-rgb),0.2)", fontSize: 14 }}>/</span>
              <span style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.55)" }}>Question Generator</span>
            </div>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setToolkitDropOpen(o => !o)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 8, border: `1px solid ${toolkitPanel ? "rgba(var(--gold-rgb),0.5)" : "rgba(var(--gold-rgb),0.22)"}`, background: toolkitPanel ? "rgba(var(--gold-rgb),0.14)" : "transparent", color: toolkitPanel ? "var(--gold-light)" : "rgba(var(--gold-rgb),0.6)", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease" }}
              >
                Toolkit {toolkitDropOpen ? "▲" : "▼"}
              </button>
              {toolkitDropOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--surface)", border: "1px solid rgba(var(--gold-rgb),0.25)", borderRadius: 10, overflow: "hidden", zIndex: 300, minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
                  {[
                    { key: "formulas" as const,  label: "Formula Sheet" },
                    { key: "flowchart" as const, label: "What Test? Flowchart" },
                  ].map(opt => (
                    <button key={opt.key} type="button"
                      onClick={() => { setToolkitPanel(toolkitPanel === opt.key ? null : opt.key); setToolkitDropOpen(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: toolkitPanel === opt.key ? "rgba(var(--gold-rgb),0.1)" : "transparent", border: "none", color: toolkitPanel === opt.key ? "var(--gold-light)" : "rgba(var(--text-rgb),0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                    >
                      {opt.label}
                      {toolkitPanel === opt.key && <span style={{ fontSize: 10, color: "var(--gold)" }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <ToolkitPanel panel={toolkitPanel} onClose={() => setToolkitPanel(null)} />

        <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 64px" }}>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.025em", margin: "0 0 6px" }}>Practice Questions</h1>
            <p style={{ fontSize: 14, color: "rgba(var(--text-rgb),0.4)", margin: 0 }}>
              Select your chapter, pick the tests you want to practice, then generate a worked question.
            </p>
          </div>

          {/* Controls */}
          <div style={{ ...card, marginBottom: 20 }}>

            {/* Chapter selector */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(var(--gold-rgb),0.6)", marginBottom: 8 }}>I have covered up to</div>
              <ChapterSelect value={maxChapter} onChange={v => { setMaxChapter(v); setQuestion(null); }} />
            </div>

            {/* Test type selector — compact row */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(var(--gold-rgb),0.6)", marginBottom: 10 }}>Test types</div>

              {/* Preset buttons + custom toggle */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {[
                  { label: "All",           active: isAllPreset,  fn: selectAll  },
                  { label: "Calculable",    active: isCalcPreset, fn: selectCalc },
                  { label: "Identify only", active: isIdPreset,   fn: selectId   },
                ].map(q => (
                  <button key={q.label} type="button" onClick={q.fn} className="quick-btn"
                    style={{ padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${q.active ? "rgba(var(--gold-rgb),0.6)" : "rgba(var(--text-rgb),0.12)"}`, background: q.active ? "rgba(var(--gold-rgb),0.14)" : "transparent", color: q.active ? GOLD_LIGHT : "rgba(var(--text-rgb),0.45)" }}>
                    {q.label}
                  </button>
                ))}
                <button type="button" onClick={() => setShowTestConfig(v => !v)} className="quick-btn"
                  style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${showTestConfig ? "rgba(var(--text-rgb),0.25)" : "rgba(var(--text-rgb),0.1)"}`, background: showTestConfig ? "rgba(var(--text-rgb),0.07)" : "transparent", color: showTestConfig ? "rgba(var(--text-rgb),0.8)" : "rgba(var(--text-rgb),0.35)", display: "flex", alignItems: "center", gap: 5 }}>
                  Custom {showTestConfig ? "▲" : "▼"}
                </button>
                {/* Status pill */}
                {!isAllPreset && !isCalcPreset && !isIdPreset && (
                  <span style={{ fontSize: 11, color: "rgba(var(--text-rgb),0.28)", marginLeft: 2 }}>{filterLabel}</span>
                )}
              </div>

              {/* Expandable custom chip grid */}
              <div style={{ maxHeight: showTestConfig ? "400px" : "0px", opacity: showTestConfig ? 1 : 0, overflow: "hidden", transition: "max-height 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.2s ease" }}>
                <div style={{ paddingTop: 16 }}>
                  {identifyMode ? (
                    <div>
                      <div style={{ fontSize: 10, color: "rgba(var(--gold-rgb),0.45)", marginBottom: 8, letterSpacing: "0.06em", fontWeight: 600 }}>ALL TESTS — IDENTIFY ONLY</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {allAvailable.map(t => {
                          const on = selectedTests.has(t);
                          return (
                            <button key={t} type="button" onClick={() => toggleTest(t)} className="chip-btn"
                              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer", border: `1px solid ${on ? "rgba(var(--gold-rgb),0.55)" : "rgba(var(--text-rgb),0.1)"}`, background: on ? "rgba(var(--gold-rgb),0.14)" : "rgba(var(--text-rgb),0.03)", color: on ? GOLD_LIGHT : "rgba(var(--text-rgb),0.35)" }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: on ? GOLD : "rgba(var(--text-rgb),0.2)", display: "inline-block", flexShrink: 0 }} />
                              {TEST_LABELS[t]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : availableCalculable.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: "rgba(var(--gold-rgb),0.45)", marginBottom: 8, letterSpacing: "0.06em", fontWeight: 600 }}>FULL CALCULATION</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {availableCalculable.map(t => {
                          const on = selectedTests.has(t);
                          return (
                            <button key={t} type="button" onClick={() => toggleTest(t)} className="chip-btn"
                              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer", border: `1px solid ${on ? "rgba(var(--gold-rgb),0.55)" : "rgba(var(--text-rgb),0.1)"}`, background: on ? "rgba(var(--gold-rgb),0.14)" : "rgba(var(--text-rgb),0.03)", color: on ? GOLD_LIGHT : "rgba(var(--text-rgb),0.35)" }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: on ? GOLD : "rgba(var(--text-rgb),0.2)", display: "inline-block", flexShrink: 0 }} />
                              {TEST_LABELS[t]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {!identifyMode && availableIdentifyOnly.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: "rgba(var(--text-rgb),0.3)", marginBottom: 8, letterSpacing: "0.06em", fontWeight: 600 }}>IDENTIFY ONLY</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {availableIdentifyOnly.map(t => {
                          const on = selectedTests.has(t);
                          return (
                            <button key={t} type="button" onClick={() => toggleTest(t)} className="chip-btn"
                              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer", border: `1px solid ${on ? "rgba(var(--text-rgb),0.3)" : "rgba(var(--text-rgb),0.08)"}`, background: on ? "rgba(var(--text-rgb),0.07)" : "rgba(var(--text-rgb),0.02)", color: on ? "rgba(var(--text-rgb),0.75)" : "rgba(var(--text-rgb),0.3)" }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: on ? "rgba(var(--text-rgb),0.6)" : "rgba(var(--text-rgb),0.15)", display: "inline-block", flexShrink: 0 }} />
                              {TEST_LABELS[t]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {allAvailable.length === 0 && (
                    <p style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.3)", margin: 0 }}>No tests available yet — select a later chapter.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Generate */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={generate} className="action-btn"
                style={{ background: GOLD, color: "#ffffff", border: "none", borderRadius: 9, padding: "11px 26px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(var(--gold-rgb),0.3)", letterSpacing: "0.01em" }}>
                Generate Question
              </button>
            </div>
          </div>

          {/* Question card */}
          {question && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={card}>
                {/* Badges */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                  <span style={{ borderRadius: 100, border: question.category === "calculable" ? "1px solid rgba(var(--gold-rgb),0.4)" : "1px solid rgba(var(--text-rgb),0.12)", background: question.category === "calculable" ? "rgba(var(--gold-rgb),0.1)" : "rgba(var(--text-rgb),0.05)", padding: "3px 12px", fontSize: 11, fontWeight: 600, color: question.category === "calculable" ? GOLD_LIGHT : "rgba(var(--text-rgb),0.4)" }}>
                    {question.category === "calculable" ? "Full Calculation" : "Identify Only"}
                  </span>
                  {mcqChoice && <span style={{ borderRadius: 100, border: "1px solid rgba(var(--text-rgb),0.1)", background: "rgba(var(--text-rgb),0.04)", padding: "3px 12px", fontSize: 11, color: "rgba(var(--text-rgb),0.35)" }}>{TEST_LABELS[question.testType]}</span>}
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(var(--text-rgb),0.25)", marginBottom: 10 }}>Question</div>
                <QuestionText text={question.questionText} />

                {/* MCQ for identify-only */}
                {question.category === "identify-only" && !showAnswer && (
                  <div style={{ marginTop: 22 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(var(--text-rgb),0.25)", marginBottom: 12 }}>
                      Which test should be used?
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {mcqOptions.map(opt => {
                        const isCorrect = opt === question.testType;
                        const chosen = mcqChoice === opt;
                        const revealed = mcqChoice !== null;

                        let borderColor = "rgba(var(--text-rgb),0.12)";
                        let bg = "transparent";
                        let color = "rgba(var(--text-rgb),0.55)";

                        if (revealed) {
                          if (isCorrect) { borderColor = "rgba(134,197,120,0.7)"; bg = "rgba(134,197,120,0.1)"; color = "#a8e09a"; }
                          else if (chosen) { borderColor = "rgba(220,80,80,0.6)"; bg = "rgba(220,80,80,0.1)"; color = "rgba(255,120,120,0.9)"; }
                          else { color = "rgba(var(--text-rgb),0.25)"; }
                        } else if (chosen) {
                          borderColor = "rgba(var(--gold-rgb),0.5)"; bg = "rgba(var(--gold-rgb),0.1)"; color = GOLD_LIGHT;
                        }

                        return (
                          <button key={opt} type="button"
                            onClick={() => { if (!mcqChoice) setMcqChoice(opt); }}
                            style={{ padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${borderColor}`, background: bg, color, fontSize: 13, fontWeight: 500, cursor: mcqChoice ? "default" : "pointer", textAlign: "left", lineHeight: 1.4, transition: "border-color 0.18s, background 0.18s, color 0.18s" }}>
                            {revealed && isCorrect && <span style={{ marginRight: 6 }}>✓</span>}
                            {revealed && chosen && !isCorrect && <span style={{ marginRight: 6 }}>✗</span>}
                            {TEST_LABELS[opt]}
                          </button>
                        );
                      })}
                    </div>

                    {/* Result message */}
                    {mcqChoice && (
                      <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 10, background: mcqChoice === question.testType ? "rgba(134,197,120,0.08)" : "rgba(220,80,80,0.08)", border: `1px solid ${mcqChoice === question.testType ? "rgba(134,197,120,0.3)" : "rgba(220,80,80,0.25)"}` }}>
                        <p style={{ fontSize: 13, color: mcqChoice === question.testType ? "#a8e09a" : "rgba(255,150,150,0.9)", margin: "0 0 4px", fontWeight: 600 }}>
                          {mcqChoice === question.testType ? "Correct!" : `Not quite — the answer is ${TEST_LABELS[question.testType]}`}
                        </p>
                        <button onClick={() => setShowAnswer(true)} style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.4)", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 4 }}>
                          See full explanation →
                        </button>
                      </div>
                    )}

                    {!mcqChoice && (
                      <button onClick={() => setShowAnswer(true)} style={{ marginTop: 12, fontSize: 11, color: "rgba(var(--text-rgb),0.25)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        Skip — show answer directly
                      </button>
                    )}
                  </div>
                )}

                {/* Standard show/hide for calculable, or after MCQ */}
                {(question.category === "calculable" || showAnswer || (question.category === "identify-only" && mcqChoice)) && (
                  <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {question.category === "calculable" && (
                      <button onClick={() => setShowAnswer(v => !v)} className="reveal-btn"
                        style={{ borderRadius: 8, border: `1.5px solid ${showAnswer ? GOLD : "rgba(var(--text-rgb),0.15)"}`, background: showAnswer ? "rgba(var(--gold-rgb),0.15)" : "transparent", color: showAnswer ? GOLD_LIGHT : "rgba(var(--text-rgb),0.6)", padding: "9px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        {showAnswer ? "Hide Answer" : "Show Answer"}
                      </button>
                    )}
                    <button onClick={generate} className="new-btn"
                      style={{ borderRadius: 8, border: "1px solid rgba(var(--text-rgb),0.1)", background: "transparent", color: "rgba(var(--text-rgb),0.4)", padding: "9px 22px", fontSize: 13, cursor: "pointer" }}>
                      New Question
                    </button>
                  </div>
                )}
              </div>

              {showAnswer && (
                <div style={card}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(var(--text-rgb),0.25)", marginBottom: 4 }}>Worked Answer</div>
                  {question.answerBlocks.map((b, i) => <Block key={i} b={b} />)}
                  <div style={{ marginTop: 24, paddingTop: 14, borderTop: "1px solid rgba(var(--text-rgb),0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "rgba(var(--text-rgb),0.2)" }}>Seed {seed}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 10, color: "rgba(var(--text-rgb),0.2)" }}>α = 0.05</span>
                        {reportStatus === "sent" ? (
                          <span style={{ fontSize: 11, color: "rgba(134,197,120,0.9)", fontWeight: 600 }}>✓ Reported</span>
                        ) : (
                          null
                        )}
                      </div>
                    </div>

                    {reportOpen && reportStatus !== "sent" && (
                      <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 10, border: "1px solid rgba(var(--text-rgb),0.1)", background: "rgba(var(--text-rgb),0.03)" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(var(--text-rgb),0.5)", marginBottom: 8 }}>
                          Describe the issue <span style={{ fontWeight: 400, opacity: 0.6 }}>(seed {seed} will be included automatically)</span>
                        </div>
                        <textarea
                          value={reportText}
                          onChange={e => setReportText(e.target.value)}
                          placeholder="e.g. The expected values in the table don't match the null hypothesis stated above."
                          rows={3}
                          style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 7, border: "1px solid rgba(var(--text-rgb),0.15)", background: "var(--surface)", color: "var(--text)", fontSize: 12, resize: "vertical", outline: "none", fontFamily: "inherit" }}
                        />
                        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                          <button
                            disabled={!reportText.trim() || reportStatus === "sending"}
                            onClick={async () => {
                              setReportStatus("sending");
                              try {
                                const res = await fetch("/api/report", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ seed, description: reportText, testType: question.testType }),
                                });
                                setReportStatus(res.ok ? "sent" : "error");
                              } catch {
                                setReportStatus("error");
                              }
                            }}
                            style={{ padding: "6px 16px", borderRadius: 7, border: "none", background: GOLD, color: "#fff", fontSize: 12, fontWeight: 600, cursor: reportText.trim() ? "pointer" : "not-allowed", opacity: reportText.trim() ? 1 : 0.45 }}
                          >
                            {reportStatus === "sending" ? "Sending…" : "Send"}
                          </button>
                          <button onClick={() => setReportOpen(false)} style={{ fontSize: 11, color: "rgba(var(--text-rgb),0.3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            Cancel
                          </button>
                          {reportStatus === "error" && <span style={{ fontSize: 11, color: "rgba(220,80,80,0.8)" }}>Failed to send — please try again.</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!question && (
            <div style={{ border: "1.5px dashed rgba(var(--gold-rgb),0.18)", borderRadius: 14, padding: "60px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 52, color: "rgba(var(--gold-rgb),0.15)", marginBottom: 12, fontFamily: "ui-serif,serif", lineHeight: 1 }}>Σ</div>
              <p style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.25)", margin: 0 }}>Select your tests above and generate a question.</p>
            </div>
          )}

          {/* Quick reference */}
          <div style={{ ...card, marginTop: 28 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(var(--gold-rgb),0.5)", marginBottom: 18 }}>Quick Reference</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, fontSize: 12, color: "rgba(var(--text-rgb),0.45)" }}>
              <div>
                <div style={{ fontWeight: 600, color: "rgba(var(--text-rgb),0.7)", marginBottom: 8 }}>Tests you must calculate</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  {CALCULABLE_TYPES.map(t => (
                    <li key={t} style={{ display: "flex", gap: 8 }}>
                      <span style={{ color: "rgba(var(--gold-rgb),0.35)", fontVariantNumeric: "tabular-nums", minWidth: 30 }}>Ch.{TEST_CHAPTER[t]}</span>
                      {TEST_LABELS[t]}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "rgba(var(--text-rgb),0.7)", marginBottom: 8 }}>Identify-only tests</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
                  {IDENTIFY_ONLY_TYPES.map(t => (
                    <li key={t} style={{ display: "flex", gap: 8 }}>
                      <span style={{ color: "rgba(var(--text-rgb),0.2)", fontVariantNumeric: "tabular-nums", minWidth: 30 }}>Ch.{TEST_CHAPTER[t]}</span>
                      {TEST_LABELS[t]}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <footer style={{ marginTop: 28, textAlign: "center", fontSize: 11, color: "rgba(var(--text-rgb),0.2)", paddingBottom: 16 }}>
            BIOL 300 Practice Hub · UBC &nbsp;·&nbsp;{" "}
            <Link href="/" style={{ color: GOLD, textDecoration: "none", opacity: 0.7 }}>Home</Link>
          </footer>
        </main>
      </div>
    </>
  );
}
