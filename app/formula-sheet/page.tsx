"use client";

import { useState } from "react";
import Link from "next/link";
import katex from "katex";
import { SECTIONS, type Formula } from "../lib/formulaData";

const GOLD = "#c6973f";
const GOLD_LIGHT = "#e8c27a";
const BLUE = "#002145";
const BLUE_DARK = "#001830";

// ─── FORMULA CARD ─────────────────────────────────────────────────────────────

export function FormulaCard({ f }: { f: Formula }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 12,
        border: `1px solid ${hovered ? "rgba(198,151,63,0.5)" : "rgba(198,151,63,0.14)"}`,
        background: hovered ? "rgba(198,151,63,0.06)" : "rgba(255,255,255,0.025)",
        padding: "14px 18px",
        cursor: "default",
        transform: hovered ? "translateY(-2px) scale(1.01)" : "translateY(0) scale(1)",
        transition: "transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease",
        boxShadow: hovered ? "0 8px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(198,151,63,0.18)" : "none",
        position: "relative",
        zIndex: hovered ? 2 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        {f.chapter !== undefined && (
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", color: "rgba(198,151,63,0.45)", background: "rgba(198,151,63,0.08)", border: "1px solid rgba(198,151,63,0.15)", borderRadius: 100, padding: "2px 7px", flexShrink: 0 }}>
            Ch.{f.chapter}
          </span>
        )}
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.38)" }}>
          {f.name}
        </span>
      </div>

      <div
        style={{ color: hovered ? GOLD_LIGHT : "rgba(255,255,255,0.85)", fontSize: "0.9em", overflowX: "auto", transition: "color 0.2s ease" }}
        dangerouslySetInnerHTML={{ __html: katex.renderToString(f.latex, { throwOnError: false, displayMode: true }) }}
      />

      {!hovered && (
        <div style={{ marginTop: 6, fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: "0.04em" }}>
          hover for explanation
        </div>
      )}

      <div style={{ maxHeight: hovered ? "240px" : "0px", opacity: hovered ? 1 : 0, overflow: "hidden", transition: "max-height 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease" }}>
        <div style={{ borderTop: "1px solid rgba(198,151,63,0.16)", marginTop: 12, paddingTop: 12 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.65, margin: "0 0 10px" }}>{f.explanation}</p>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: GOLD, opacity: 0.7, flexShrink: 0, marginTop: 2 }}>When</span>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.6, margin: 0 }}>{f.when}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function FormulaSheetPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const lq = query.toLowerCase();
  const visibleSections = (activeSection
    ? SECTIONS.filter(s => s.id === activeSection)
    : SECTIONS
  ).map(s => ({
    ...s,
    formulas: lq
      ? s.formulas.filter(f => f.name.toLowerCase().includes(lq))
      : s.formulas,
  })).filter(s => s.formulas.length > 0);

  return (
    <>
      <style>{`
        .fchip { transition: background 0.15s, border-color 0.15s, color 0.15s; }
        .fchip:hover { border-color: rgba(198,151,63,0.5) !important; color: rgba(255,255,255,0.9) !important; }
      `}</style>

      <div style={{ minHeight: "100vh", background: BLUE_DARK }}>

        <header style={{ background: BLUE, borderBottom: "1px solid rgba(198,151,63,0.18)", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
              <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: GOLD, textDecoration: "none" }}>BIOL 300 Practice Hub</Link>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 14 }}>/</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Formula Sheet</span>
            </div>
            <Link href="/practice" style={{ fontSize: 12, fontWeight: 600, color: GOLD_LIGHT, textDecoration: "none", opacity: 0.7 }}>Practice →</Link>
          </div>
        </header>

        <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 72px" }}>
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(198,151,63,0.55)", margin: "0 0 10px" }}>Reference</p>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", margin: "0 0 8px" }}>Formula Sheet</h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", margin: 0 }}>
              Hover any formula for a plain-English explanation and guidance on when to use it.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search formulas…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", marginBottom: 20, padding: "9px 14px", borderRadius: 8, border: "1px solid rgba(198,151,63,0.22)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, outline: "none" }}
          />

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 36 }}>
            <button type="button" onClick={() => setActiveSection(null)} className="fchip"
              style={{ padding: "5px 14px", borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${!activeSection ? "rgba(198,151,63,0.6)" : "rgba(255,255,255,0.12)"}`, background: !activeSection ? "rgba(198,151,63,0.14)" : "transparent", color: !activeSection ? GOLD_LIGHT : "rgba(255,255,255,0.45)" }}>
              All
            </button>
            {SECTIONS.map(s => (
              <button key={s.id} type="button" onClick={() => setActiveSection(activeSection === s.id ? null : s.id)} className="fchip"
                style={{ padding: "5px 14px", borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${activeSection === s.id ? "rgba(198,151,63,0.6)" : "rgba(255,255,255,0.12)"}`, background: activeSection === s.id ? "rgba(198,151,63,0.14)" : "transparent", color: activeSection === s.id ? GOLD_LIGHT : "rgba(255,255,255,0.45)" }}>
                {s.title}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {visibleSections.map(section => (
              <div key={section.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 3, height: 18, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: 0 }}>{section.title}</h2>
                  <div style={{ flex: 1, height: 1, background: "rgba(198,151,63,0.1)" }} />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{section.formulas.length} formula{section.formulas.length !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 10, alignItems: "start" }}>
                  {section.formulas.map(f => <FormulaCard key={f.id} f={f} />)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 48, padding: "18px 24px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>
              Whitlock &amp; Schluter, <em>The Analysis of Biological Data</em>, 3rd ed. · BIOL 300 · UBC
            </p>
          </div>

          <footer style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", paddingBottom: 16 }}>
            BIOL 300 Practice Hub &nbsp;·&nbsp;{" "}
            <Link href="/" style={{ color: GOLD, textDecoration: "none", opacity: 0.7 }}>Home</Link>
            &nbsp;·&nbsp;
            <Link href="/practice" style={{ color: GOLD, textDecoration: "none", opacity: 0.7 }}>Practice</Link>
          </footer>
        </main>
      </div>
    </>
  );
}
