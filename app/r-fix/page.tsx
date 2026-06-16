"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";

const GOLD       = "var(--gold)";
const GOLD_LIGHT = "var(--gold-light)";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type OutputLine = { type: "stdout" | "stderr" | "plot"; data: string };
type CheckState = "idle" | "running" | "correct" | "incorrect";

type Segment =
  | { type: "prose";  content: React.ReactNode }
  | { type: "code";   id: string; defaultCode: string };

interface FixQuestion {
  id: string;
  title: string;
  topic: string;
  segments: Segment[];
  /** Files to write to WebR VFS so read.csv() works */
  csvFiles?: Array<{ path: string; csv: string }>;
  validate: (codes: Record<string, string>, lines: OutputLine[]) => boolean;
  /** Correct version of each code segment, keyed by segment id */
  answerCodes: Record<string, string>;
  answerExplanation: React.ReactNode;
}

// ─── CSV DATA ─────────────────────────────────────────────────────────────────

const MOUSE_CSV = `maze_time,sound_condition
42,silence
45,silence
44,silence
47,silence
43,silence
39,classical
41,classical
38,classical
40,classical
42,classical
35,lofi_beats
37,lofi_beats
36,lofi_beats
34,lofi_beats
38,lofi_beats`;

const COLONY_CSV = `plate,treatment,colonies
1,control,82
2,control,88
3,control,79
4,control,91
5,antibiotic,35
6,antibiotic,42
7,antibiotic,39
8,antibiotic,37`;

// ─── QUESTIONS ────────────────────────────────────────────────────────────────

const QUESTIONS: FixQuestion[] = [
  // ── Q1: ANOVA wrong function ─────────────────────────────────────────────────
  {
    id: "q1-anova",
    title: "One-Way ANOVA: maze-completion time across sound conditions",
    topic: "One-Way ANOVA",
    csvFiles: [{ path: "DataForLabs/MouseMazeMusicData.csv", csv: MOUSE_CSV }],
    segments: [
      {
        type: "prose",
        content: (
          <div style={{ fontSize: 13.5, color: "rgba(var(--text-rgb),0.65)", lineHeight: 1.75 }}>
            <p style={{ margin: "0 0 8px" }}>
              A biology student is studying whether different types of "productivity music"
              affect how quickly lab mice complete a simple maze. Mice are randomly assigned to
              one of three sound conditions: <em>silence</em>, <em>classical</em>, or{" "}
              <em>lofi_beats</em>. The response variable is maze completion time (seconds),
              stored in a CSV file.
            </p>
            <p style={{ margin: 0 }}>The student imports and inspects the data:</p>
          </div>
        ),
      },
      {
        type: "code",
        id: "ab",
        defaultCode:
`# a.
mouseData <-
  read.csv("DataForLabs/MouseMazeMusicData.csv",
           stringsAsFactors = TRUE)

# b.
mouseData`,
      },
      {
        type: "prose",
        content: (
          <p style={{ fontSize: 13.5, color: "rgba(var(--text-rgb),0.65)", lineHeight: 1.75, margin: "0 0 4px" }}>
            The student wants to test H₀: μ<sub>silence</sub> = μ<sub>classical</sub> ={" "}
            μ<sub>lofi_beats</sub> vs. H<sub>A</sub>: at least one group mean differs,
            with α = 0.05. They write:
          </p>
        ),
      },
      {
        type: "code",
        id: "c",
        defaultCode:
`# c.
anova(maze_time ~ sound_condition, data = mouseData)`,
      },
    ],
    validate: (codes, lines) => {
      const ab = codes["ab"] ?? "";
      const c  = codes["c"]  ?? "";
      // Part a: stringsAsFactors = TRUE must be present and intact
      const hasTrue  = /stringsAsFactors\s*=\s*TRUE/.test(ab);
      // Part c: must use lm() then anova()
      const hasLm    = /\blm\s*\(/.test(c);
      const hasAnova = /\banova\s*\(/.test(c);
      // No errors in output (stderr or rlang-style stdout errors)
      const hasError = lines.some(l => l.type === "stderr" && l.data.trim().length > 0)
                    || lines.some(l => l.type === "stdout" && /^Error|^! /.test(l.data));
      // Output must contain the ANOVA table header
      const hasTable = lines.some(l => l.type === "stdout" && l.data.includes("Analysis of Variance Table"));
      return hasTrue && hasLm && hasAnova && !hasError && hasTable;
    },
    answerCodes: {
      ab:
`# a.
mouseData <-
  read.csv("DataForLabs/MouseMazeMusicData.csv",
           stringsAsFactors = TRUE)

# b.
mouseData`,
      c:
`# c.
model <- lm(maze_time ~ sound_condition, data = mouseData)
anova(model)`,
    },
    answerExplanation: (
      <div style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.65)", lineHeight: 1.75 }}>
        <p style={{ margin: "0 0 8px" }}>
          <code>anova()</code> expects a fitted model object — not a formula. Passing a
          formula directly causes R to throw an error. The fix is to first fit the model
          with <code>lm()</code>, then pass the result to <code>anova()</code>:
        </p>
      </div>
    ),
  },

  // ── Q2: filter = vs == ────────────────────────────────────────────────────────
  {
    id: "q2-filter",
    title: "Filtering a Data Frame: bacterial colony counts by treatment condition",
    topic: "R Syntax",
    csvFiles: [{ path: "DataForLabs/BacterialColonyData.csv", csv: COLONY_CSV }],
    segments: [
      {
        type: "prose",
        content: (
          <div style={{ fontSize: 13.5, color: "rgba(var(--text-rgb),0.65)", lineHeight: 1.75 }}>
            <p style={{ margin: "0 0 8px" }}>
              A microbiology lab is studying bacterial colony counts under two treatment
              conditions: <em>control</em> and <em>antibiotic</em>. The student imports
              the data:
            </p>
          </div>
        ),
      },
      {
        type: "code",
        id: "import",
        defaultCode:
`colonyData <-
  read.csv("DataForLabs/BacterialColonyData.csv",
           stringsAsFactors = TRUE)

colonyData`,
      },
      {
        type: "prose",
        content: (
          <p style={{ fontSize: 13.5, color: "rgba(var(--text-rgb),0.65)", lineHeight: 1.75, margin: "0 0 4px" }}>
            The student wants to keep only the antibiotic plates. They run:
          </p>
        ),
      },
      {
        type: "code",
        id: "filter",
        defaultCode: `filter(colonyData, treatment = "antibiotic")`,
      },
    ],
    validate: (codes, lines) => {
      const f = codes["filter"] ?? "";
      const codeFixed = /treatment\s*==\s*["']antibiotic["']/.test(f);
      const hasError  = lines.some(l => l.type === "stderr" && l.data.trim().length > 0)
                     || lines.some(l => l.type === "stdout" && /^Error|^! /.test(l.data));
      return codeFixed && !hasError;
    },
    answerCodes: {
      import:
`colonyData <-
  read.csv("DataForLabs/BacterialColonyData.csv",
           stringsAsFactors = TRUE)

colonyData`,
      filter: `filter(colonyData, treatment == "antibiotic")`,
    },
    answerExplanation: (
      <div style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.65)", lineHeight: 1.75 }}>
        <p style={{ margin: "0 0 8px" }}>
          Inside <code>filter()</code>, conditions are logical expressions — equality
          must be tested with <code>==</code>. A single <code>=</code> is used for
          argument assignment, which causes R to throw an error here.
        </p>
      </div>
    ),
  },
];

// ─── QUESTION CARD ────────────────────────────────────────────────────────────

function QuestionCard({
  q, index, webR, ready,
}: {
  q: FixQuestion;
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webR: any;
  ready: boolean;
}) {
  const codeIds = q.segments.filter(s => s.type === "code").map(s => (s as { type:"code"; id:string; defaultCode:string }).id);
  const initCodes = () => Object.fromEntries(
    q.segments
      .filter(s => s.type === "code")
      .map(s => { const c = s as { type:"code"; id:string; defaultCode:string }; return [c.id, c.defaultCode]; })
  );

  const [codes,      setCodes]      = useState<Record<string, string>>(initCodes);
  const [output,     setOutput]     = useState<OutputLine[]>([]);
  const [checkState, setCheckState] = useState<CheckState>("idle");

  useEffect(() => {
    setCodes(initCodes());
    setOutput([]);
    setCheckState("idle");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id]);

  function setCode(id: string, val: string) {
    setCodes(prev => ({ ...prev, [id]: val }));
    setCheckState("idle");
  }

  async function runAndCheck() {
    if (!webR || !ready) return;
    setCheckState("running");
    setOutput([]);

    try {
      // Write CSV files to WebR VFS so read.csv() works
      if (q.csvFiles) {
        for (const { path, csv } of q.csvFiles) {
          const parts = path.split("/");
          if (parts.length > 1) {
            try { await webR.FS.mkdir(parts.slice(0, -1).join("/")); } catch { /* already exists */ }
          }
          const enc = new TextEncoder();
          await webR.FS.writeFile(path, enc.encode(csv));
        }
      }

      // Flush stale messages
      await webR.flush();

      // Run all code segments in order
      const allCode = codeIds.map(id => codes[id] ?? "").join("\n\n");
      webR.writeConsole(allCode + "\n");

      const lines: OutputLine[] = [];
      let plotCanvas: HTMLCanvasElement | null = null;
      let plotCtx:    CanvasRenderingContext2D | null = null;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msg: any = await webR.read();
        if (msg.type === "prompt") {
          if (plotCanvas) lines.push({ type: "plot", data: plotCanvas.toDataURL() });
          // "+" prompt means R is waiting for more input — incomplete expression
          if (typeof msg.data === "string" && msg.data.trimStart().startsWith("+")) {
            webR.writeConsole("\n"); // cancel the incomplete input
            lines.push({ type: "stderr", data: "Error: unexpected end of input\n(the expression has unbalanced parentheses or is otherwise incomplete)" });
          }
          break;
        }
        if (msg.type === "stdout") {
          lines.push({ type: "stdout", data: msg.data as string });
        } else if (msg.type === "stderr") {
          lines.push({ type: "stderr", data: msg.data as string });
        } else if (msg.type === "canvas") {
          if (msg.data?.event === "canvasNewPage") {
            if (plotCanvas) lines.push({ type: "plot", data: plotCanvas.toDataURL() });
            plotCanvas = document.createElement("canvas");
            plotCtx    = plotCanvas.getContext("2d");
          } else if (msg.data?.event === "canvasImage" && plotCtx && plotCanvas) {
            const bm = msg.data.image as ImageBitmap;
            if (bm.width  > plotCanvas.width)  plotCanvas.width  = bm.width;
            if (bm.height > plotCanvas.height) plotCanvas.height = bm.height;
            plotCtx.drawImage(bm, 0, 0);
          }
        }
      }

      setOutput(lines);
      setCheckState(q.validate(codes, lines) ? "correct" : "incorrect");
    } catch (e) {
      setOutput([{ type: "stderr", data: String(e) }]);
      setCheckState("incorrect");
    }
  }

  const checked = checkState === "correct" || checkState === "incorrect";
  const borderColor =
    checkState === "correct"   ? "#22c55e" :
    checkState === "incorrect" ? "#ef4444" :
    "rgba(var(--text-rgb),0.1)";

  return (
    <div style={{ borderRadius: 14, border: `1.5px solid ${borderColor}`, background: "var(--surface)", overflow: "hidden", transition: "border-color 0.3s" }}>

      {/* Header */}
      <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(var(--text-rgb),0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(var(--text-rgb),0.3)" }}>Q{index + 1}</span>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(var(--gold-rgb),0.7)" }}>{q.topic}</span>
          </div>
          <button
            onClick={() => { setCodes(initCodes()); setOutput([]); setCheckState("idle"); }}
            style={{ fontSize: 11, fontWeight: 600, color: "rgba(var(--text-rgb),0.35)", background: "transparent", border: "1px solid rgba(var(--text-rgb),0.12)", cursor: "pointer", padding: "4px 10px", borderRadius: 6 }}
          >
            Reset all
          </button>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "8px 0 0", lineHeight: 1.4 }}>{q.title}</h3>
      </div>

      {/* Body — segments */}
      <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
        {q.segments.map((seg, i) => {
          if (seg.type === "prose") {
            return <div key={i}>{seg.content}</div>;
          }
          const segCode = seg as { type: "code"; id: string; defaultCode: string };
          return (
            <textarea
              key={segCode.id}
              value={codes[segCode.id] ?? segCode.defaultCode}
              onChange={e => setCode(segCode.id, e.target.value)}
              onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); runAndCheck(); } }}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              rows={Math.max(3, (codes[segCode.id] ?? segCode.defaultCode).split("\n").length + 1)}
              style={{
                width: "100%", boxSizing: "border-box",
                resize: "vertical",
                fontFamily: "ui-monospace,'Cascadia Code','Source Code Pro',Menlo,monospace",
                fontSize: 13, lineHeight: 1.6, padding: "10px 14px",
                borderRadius: 8,
                border: `1.5px solid rgba(var(--text-rgb),0.12)`,
                background: "rgba(var(--text-rgb),0.04)",
                color: "var(--text)", outline: "none",
              }}
            />
          );
        })}

        {/* Task box */}
        <div style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(var(--text-rgb),0.09)", background: "rgba(var(--text-rgb),0.02)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(var(--text-rgb),0.4)", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Task</p>
          <p style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.6)", margin: 0, lineHeight: 1.6 }}>
            Identify and fix any mistakes in the code so it runs correctly.
          </p>
        </div>

        {/* Check button */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={runAndCheck}
            disabled={!ready || checkState === "running"}
            style={{
              padding: "8px 22px", borderRadius: 8, border: "none",
              background: GOLD, color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: ready && checkState !== "running" ? "pointer" : "default",
              opacity: ready && checkState !== "running" ? 1 : 0.45,
            }}
          >
            {checkState === "running" ? "Running…" : "Check Answer  ⌘↵"}
          </button>
          {!ready && <span style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.3)" }}>Waiting for R…</span>}
        </div>

        {/* Output */}
        {output.length > 0 && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(var(--text-rgb),0.03)", border: "1px solid rgba(var(--text-rgb),0.07)", fontFamily: "ui-monospace,monospace", fontSize: 12.5, lineHeight: 1.7 }}>
            {output.map((line, i) =>
              line.type === "plot" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={line.data} alt="R plot" style={{ display: "block", maxWidth: "100%", borderRadius: 6, margin: "4px 0" }} />
              ) : (
                <pre key={i} style={{ margin: 0, color: line.type === "stderr" ? "#ef4444" : "var(--text)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {line.data}
                </pre>
              )
            )}
          </div>
        )}
      </div>

      {/* Feedback + answer */}
      {checked && (
        <div style={{ borderTop: "1px solid rgba(var(--text-rgb),0.07)", padding: "16px 22px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
            borderRadius: 8, marginBottom: 16,
            background: checkState === "correct" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${checkState === "correct" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
          }}>
            <span style={{ fontSize: 16 }}>{checkState === "correct" ? "✓" : "✗"}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: checkState === "correct" ? "#16a34a" : "#dc2626" }}>
              {checkState === "correct" ? "Correct! The code runs as expected." : "Not quite — here's the fix:"}
            </span>
          </div>

          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(var(--text-rgb),0.35)", margin: "0 0 10px" }}>Answer</p>
          {Object.entries(q.answerCodes).map(([id, ansCode]) => (
            <pre key={id} style={{
              margin: "0 0 10px", padding: "10px 14px", borderRadius: 8,
              background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)",
              fontFamily: "ui-monospace,monospace", fontSize: 13, lineHeight: 1.6, color: "var(--text)",
              overflowX: "auto",
            }}>
              {ansCode}
            </pre>
          ))}
          {q.answerExplanation}
        </div>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function RFixPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webRRef  = useRef<any>(null);
  const [ready,      setReady]      = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [status,     setStatus]     = useState("Initialising R…");
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    // Register service worker for COOP/COEP headers (needed for SharedArrayBuffer on static hosts)
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/coi-serviceworker.js").then(reg => {
        if (!crossOriginIsolated && reg.active) {
          window.location.reload();
        }
      }).catch(() => {});
    }

    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod  = await import("@r-wasm/webr") as any;
        const WebR = mod.WebR ?? mod.default?.WebR ?? mod.default;
        const webR = new WebR({ baseUrl: "https://webr.r-wasm.org/v0.2.0/" });
        await webR.init();
        if (cancelled) return;
        webRRef.current = webR;
        setStatus("Installing packages…");
        await webR.installPackages(["dplyr", "binom", "car"], true);
        setStatus("Loading packages…");
        await webR.evalRVoid(`
          library(dplyr)
          library(binom)
          library(car)
        `);
        await webR.evalRVoid(`options(device = webr::canvas)`);
        await webR.flush();
        setLoading(false);
        setReady(true);
      } catch (err) {
        console.error("WebR init failed:", err);
        setStatus("Failed to load R. Please refresh the page.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const q = QUESTIONS[currentIdx];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Script src="/coi-serviceworker.js" strategy="beforeInteractive" />

      {/* Nav */}
      <header style={{ background: "var(--surface)", borderBottom: "1px solid rgba(var(--text-rgb),0.08)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 3, height: 20, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: GOLD, textDecoration: "none" }}>BIOL 300 Practice Hub</Link>
            <span style={{ color: "rgba(var(--text-rgb),0.2)", fontSize: 14 }}>/</span>
            <span style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.55)" }}>Fix the Code</span>
          </div>
          <Link href="/r-coding" style={{ fontSize: 12, fontWeight: 600, color: GOLD_LIGHT, textDecoration: "none", opacity: 0.7 }}>R Questions →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "36px 28px 80px" }}>

        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(var(--gold-rgb),0.55)", margin: "0 0 8px" }}>Practice</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.025em", margin: "0 0 10px" }}>Fix the Code</h1>
          <p style={{ fontSize: 14, color: "rgba(var(--text-rgb),0.45)", lineHeight: 1.65, margin: 0, maxWidth: 520 }}>
            Each question shows R code with a mistake in it. Edit any block directly to fix it,
            then click <strong style={{ color: "rgba(var(--text-rgb),0.6)" }}>Check Answer</strong> to run and see if you got it right.
          </p>
        </div>

        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: loading ? "#f59e0b" : "#22c55e", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.4)", fontWeight: 600 }}>
            {loading ? status : "R is ready"}
          </span>
        </div>

        {/* Navigator */}
        {QUESTIONS.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {QUESTIONS.map((_, i) => (
                <button key={i} onClick={() => setCurrentIdx(i)} style={{
                  width: 32, height: 32, borderRadius: "50%",
                  border: i === currentIdx ? `2px solid ${GOLD}` : "1px solid rgba(var(--text-rgb),0.15)",
                  background: i === currentIdx ? "rgba(var(--gold-rgb),0.12)" : "transparent",
                  color: i === currentIdx ? GOLD : "rgba(var(--text-rgb),0.35)",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                  {i + 1}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setCurrentIdx(i => i - 1)} disabled={currentIdx === 0}
                style={{ padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600, border: "1px solid rgba(var(--text-rgb),0.15)", background: "transparent", color: currentIdx === 0 ? "rgba(var(--text-rgb),0.2)" : "rgba(var(--text-rgb),0.6)", cursor: currentIdx === 0 ? "default" : "pointer" }}>
                ← Prev
              </button>
              <button onClick={() => setCurrentIdx(i => i + 1)} disabled={currentIdx === QUESTIONS.length - 1}
                style={{ padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600, border: "1px solid rgba(var(--text-rgb),0.15)", background: "transparent", color: currentIdx === QUESTIONS.length - 1 ? "rgba(var(--text-rgb),0.2)" : "rgba(var(--text-rgb),0.6)", cursor: currentIdx === QUESTIONS.length - 1 ? "default" : "pointer" }}>
                Next →
              </button>
            </div>
          </div>
        )}

        <QuestionCard key={q.id} q={q} index={currentIdx} webR={webRRef.current} ready={ready} />

        <footer style={{ marginTop: 48, textAlign: "center", fontSize: 11, color: "rgba(var(--text-rgb),0.2)", paddingBottom: 8 }}>
          BIOL 300 Practice Hub · University of British Columbia
        </footer>
      </main>
    </div>
  );
}
