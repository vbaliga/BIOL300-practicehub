"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import "@xyflow/react/dist/style.css";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  type NodeTypes,
  MarkerType,
} from "@xyflow/react";
import dagre from "dagre";
import {
  ONE_VAR_NODES, ONE_VAR_START,
  TWO_VAR_NODES, TWO_VAR_START,
  THREE_VAR_NODES, THREE_VAR_START,
  type FlowNode, type FlowOption,
} from "../lib/flowchartData";

const GOLD        = "var(--gold)";
const GOLD_LIGHT  = "var(--gold-light)";
const BLUE        = "var(--surface)";
const BLUE_DARK   = "var(--bg)";
const BLUE_MID    = "var(--surface-mid)";

const CHAPTER_OPTIONS = [
  { value: 18, label: "All chapters (1–18)" },
  { value: 7,  label: "Up to Ch. 7 — Proportions" },
  { value: 8,  label: "Up to Ch. 8 — Fitting models" },
  { value: 9,  label: "Up to Ch. 9 — Contingency tables" },
  { value: 11, label: "Up to Ch. 11 — One-sample t" },
  { value: 12, label: "Up to Ch. 12 — Two-sample tests" },
  { value: 13, label: "Up to Ch. 13 — Non-parametric" },
  { value: 15, label: "Up to Ch. 15 — ANOVA" },
  { value: 16, label: "Up to Ch. 16 — Correlation" },
  { value: 17, label: "Up to Ch. 17 — Regression" },
];

type Tab  = "one" | "two" | "three";
type Mode = "wizard" | "visual";

// ─── DAGRE LAYOUT ─────────────────────────────────────────────────────────────

const NODE_W = 240;

function nodeH(text: string): number {
  if (text.length < 60)  return 72;
  if (text.length < 110) return 92;
  if (text.length < 160) return 112;
  return 130;
}

function simplifyLabel(label: string): string {
  const l = label.toLowerCase();
  if (l.startsWith("yes")) return "Yes";
  if (l.startsWith("no ") || l === "no") return "No";
  if (l.includes("exactly 2 cat")) return "Exactly 2";
  if (l.includes("2 or more")) return "2+";
  if (l.includes("categorical")) return "Categorical";
  if (l.includes("numerical")) return "Numerical";
  if (l.includes("means"))  return "Means";
  if (l.includes("variances")) return "Variances";
  if (l.includes("discrete")) return "Discrete";
  if (l.includes("continuous")) return "Continuous";
  if (l.includes("paired")) return "Paired";
  if (l.includes("association")) return "Association";
  if (l.includes("predict")) return "Predict";
  if (l.includes("binary")) return "Binary";
  return label.length > 20 ? label.slice(0, 19) + "…" : label;
}

function buildGraph(flowNodes: Record<string, FlowNode>, maxChapter: number) {
  const rfNodes: Node[] = [];
  const rfEdges: Edge[] = [];

  Object.values(flowNodes).forEach(n => {
    const locked =
      n.type === "outcome" &&
      ((n.chapter !== undefined && n.chapter > maxChapter) || n.isAdvanced === true);
    rfNodes.push({
      id: n.id,
      type: n.type,
      position: { x: 0, y: 0 },
      data: { label: n.text, chapter: n.chapter, isAdvanced: n.isAdvanced, note: n.note, locked },
    });
    (n.options ?? []).forEach(opt => {
      rfEdges.push({
        id: `e-${n.id}-${opt.nextId}`,
        source: n.id,
        target: opt.nextId,
        label: simplifyLabel(opt.label),
        type: "smoothstep",
        style: { stroke: "rgba(var(--gold-rgb),0.3)", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(var(--gold-rgb),0.45)", width: 13, height: 13 },
        labelStyle: { fill: "rgba(var(--text-rgb),0.5)", fontSize: 10 },
        labelBgStyle: { fill: "#001830", fillOpacity: 0.9 },
        labelBgPadding: [4, 3] as [number, number],
        labelBgBorderRadius: 4,
      });
    });
  });

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", ranksep: 85, nodesep: 28, marginx: 40, marginy: 40 });
  rfNodes.forEach(n => g.setNode(n.id, { width: NODE_W, height: nodeH((n.data as { label: string }).label) }));
  rfEdges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);

  return {
    nodes: rfNodes.map(n => {
      const pos = g.node(n.id);
      const h   = nodeH((n.data as { label: string }).label);
      return { ...n, position: { x: pos.x - NODE_W / 2, y: pos.y - h / 2 } };
    }),
    edges: rfEdges,
  };
}

// ─── CUSTOM NODE COMPONENTS ───────────────────────────────────────────────────

interface FlowNodeData extends Record<string, unknown> {
  label: string;
  chapter?: number;
  isAdvanced?: boolean;
  note?: string;
  locked: boolean;
}

const HS: React.CSSProperties = { opacity: 0, width: 1, height: 1, minWidth: 0, minHeight: 0 };

function DecisionNode({ data }: NodeProps) {
  const d = data as FlowNodeData;
  return (
    <div style={{ width: NODE_W, padding: "10px 14px", borderRadius: 9, border: "1.5px solid rgba(99,164,255,0.42)", background: "rgba(50,110,210,0.12)" }}>
      <Handle type="target" position={Position.Top}    style={HS} />
      <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(109,163,255,0.65)", marginBottom: 5 }}>Decision</div>
      <div style={{ fontSize: 11, color: "#8ec2ff", lineHeight: 1.45 }}>{d.label}</div>
      <Handle type="source" position={Position.Bottom} style={HS} />
    </div>
  );
}

function CheckNode({ data }: NodeProps) {
  const d = data as FlowNodeData;
  return (
    <div style={{ width: NODE_W, padding: "10px 14px", borderRadius: 9, border: "1.5px solid rgba(180,110,220,0.42)", background: "rgba(130,75,195,0.1)" }}>
      <Handle type="target" position={Position.Top}    style={HS} />
      <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(192,126,240,0.65)", marginBottom: 5 }}>Check</div>
      <div style={{ fontSize: 11, color: "#c07ef0", lineHeight: 1.45 }}>{d.label}</div>
      <Handle type="source" position={Position.Bottom} style={HS} />
    </div>
  );
}

function TransformNode({ data }: NodeProps) {
  const d = data as FlowNodeData;
  return (
    <div style={{ width: NODE_W, padding: "10px 14px", borderRadius: 9, border: "1.5px solid rgba(255,185,60,0.42)", background: "rgba(215,140,25,0.09)" }}>
      <Handle type="target" position={Position.Top}    style={HS} />
      <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,184,85,0.65)", marginBottom: 5 }}>Transformation</div>
      <div style={{ fontSize: 11, color: "#f0b855", lineHeight: 1.45 }}>{d.label}</div>
      <Handle type="source" position={Position.Bottom} style={HS} />
    </div>
  );
}

function OutcomeNode({ data }: NodeProps) {
  const d = data as FlowNodeData;
  if (d.locked) {
    return (
      <div style={{ width: NODE_W, padding: "10px 14px", borderRadius: 9, border: "1px solid rgba(var(--text-rgb),0.1)", background: "rgba(var(--text-rgb),0.02)", opacity: 0.38 }}>
        <Handle type="target" position={Position.Top}    style={HS} />
        <div style={{ fontSize: 8, color: "rgba(var(--text-rgb),0.3)", marginBottom: 4 }}>
          {d.isAdvanced ? "Not in BIOL 300" : d.chapter ? `Ch.${d.chapter} — Not yet covered` : ""}
        </div>
        <div style={{ fontSize: 11, color: "rgba(var(--text-rgb),0.3)", lineHeight: 1.4 }}>{d.label}</div>
        <Handle type="source" position={Position.Bottom} style={HS} />
      </div>
    );
  }
  return (
    <div style={{ width: NODE_W, padding: "10px 14px", borderRadius: 9, border: "2px solid rgba(var(--gold-rgb),0.58)", background: "rgba(var(--gold-rgb),0.12)" }}>
      <Handle type="target" position={Position.Top}    style={HS} />
      {(d.chapter || d.note) && (
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.07em", color: "rgba(var(--gold-rgb),0.65)", marginBottom: 5 }}>
          {d.chapter ? `Ch.${d.chapter}` : ""}
          {d.chapter && d.note ? " · " : ""}
          {d.note ?? ""}
        </div>
      )}
      <div style={{ fontSize: 12, fontWeight: 700, color: GOLD_LIGHT, lineHeight: 1.4 }}>{d.label}</div>
      <Handle type="source" position={Position.Bottom} style={HS} />
    </div>
  );
}

// Defined outside component to stay stable between renders
const nodeTypes: NodeTypes = {
  decision:  DecisionNode,
  check:     CheckNode,
  transform: TransformNode,
  outcome:   OutcomeNode,
};

// ─── VISUAL COMPONENT ─────────────────────────────────────────────────────────

function FlowchartVisual({ flowNodes, maxChapter }: { flowNodes: Record<string, FlowNode>; maxChapter: number }) {
  const { nodes, edges } = useMemo(
    () => buildGraph(flowNodes, maxChapter),
    [flowNodes, maxChapter],
  );

  return (
    <div style={{ height: 640, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(var(--gold-rgb),0.2)" }}>
      <style>{`
        .react-flow__controls { gap: 2px; }
        .react-flow__controls-button {
          background: #002145 !important;
          border: 1px solid rgba(var(--gold-rgb),0.22) !important;
          fill: rgba(var(--gold-rgb),0.7) !important;
          box-shadow: none !important;
          border-radius: 7px !important;
        }
        .react-flow__controls-button:hover {
          background: rgba(var(--gold-rgb),0.1) !important;
        }
        .react-flow__attribution { display: none; }
        .react-flow__edge-label { font-size: 10px; }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        style={{ background: BLUE_DARK }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="rgba(var(--gold-rgb),0.1)" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  );
}

// ─── STEP-BY-STEP COMPONENTS ──────────────────────────────────────────────────

function nodeAccent(type: FlowNode["type"]) {
  switch (type) {
    case "decision":  return { border: "rgba(99,164,255,0.45)",   bg: "rgba(60,120,220,0.08)",  label: "Decision",       labelColor: "#6da3ff" };
    case "check":     return { border: "rgba(180,110,220,0.45)",  bg: "rgba(140,80,200,0.08)",  label: "Check",          labelColor: "#c07ef0" };
    case "transform": return { border: "rgba(255,180,60,0.4)",    bg: "rgba(220,140,30,0.07)",  label: "Transformation", labelColor: "#f0b855" };
    case "outcome":   return { border: "rgba(var(--gold-rgb),0.55)",   bg: "rgba(var(--gold-rgb),0.1)",   label: "Test",           labelColor: GOLD_LIGHT };
  }
}

function ChapterSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const selected = CHAPTER_OPTIONS.find(o => o.value === value);
  return (
    <div style={{ position: "relative", display: "inline-block", minWidth: 260 }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 9, border: `1px solid ${open ? "rgba(var(--gold-rgb),0.5)" : "rgba(var(--gold-rgb),0.22)"}`, background: BLUE_MID, color: "var(--text)", fontSize: 12, cursor: "pointer", width: "100%" }}>
        <span style={{ color: "rgba(var(--text-rgb),0.8)", flex: 1, textAlign: "left" }}>{selected?.label}</span>
        <span style={{ color: GOLD, fontSize: 9, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#00274d", border: "1px solid rgba(var(--gold-rgb),0.25)", borderRadius: 9, overflow: "hidden", zIndex: 100, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
          {CHAPTER_OPTIONS.map(o => (
            <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
              style={{ width: "100%", textAlign: "left", padding: "8px 14px", fontSize: 12, background: o.value === value ? "rgba(var(--gold-rgb),0.12)" : "transparent", color: o.value === value ? GOLD_LIGHT : "rgba(var(--text-rgb),0.65)", border: "none", cursor: "pointer", borderBottom: "1px solid rgba(var(--text-rgb),0.04)" }}
              onMouseOver={e => { if (o.value !== value) (e.currentTarget as HTMLButtonElement).style.background = "rgba(var(--text-rgb),0.05)"; }}
              onMouseOut={e => { if (o.value !== value) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Step { nodeId: string; choiceLabel: string; }

function Breadcrumb({ steps, onJump }: { steps: Step[]; onJump: (i: number) => void }) {
  if (steps.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", marginBottom: 20 }}>
      {steps.map((s, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button type="button" onClick={() => onJump(i)}
            style={{ background: "rgba(var(--text-rgb),0.05)", border: "1px solid rgba(var(--text-rgb),0.1)", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "rgba(var(--text-rgb),0.45)", cursor: "pointer" }}>
            {s.choiceLabel}
          </button>
          <span style={{ color: "rgba(var(--text-rgb),0.18)", fontSize: 10 }}>›</span>
        </span>
      ))}
    </div>
  );
}

function FlowNavigator({ nodes, startId, maxChapter }: { nodes: Record<string, FlowNode>; startId: string; maxChapter: number }) {
  const [history, setHistory] = useState<Step[]>([]);
  const [currentId, setCurrentId] = useState(startId);

  const node   = nodes[currentId];
  if (!node) return null;

  const accent    = nodeAccent(node.type);
  const isOutcome = node.type === "outcome";
  const isLocked  = isOutcome && ((node.chapter !== undefined && node.chapter > maxChapter) || node.isAdvanced === true);

  function choose(opt: FlowOption) {
    setHistory(h => [...h, { nodeId: currentId, choiceLabel: opt.label }]);
    setCurrentId(opt.nextId);
  }

  function reset() { setHistory([]); setCurrentId(startId); }

  function jumpTo(stepIndex: number) {
    const targetId = history[stepIndex].nodeId;
    setHistory(history.slice(0, stepIndex));
    setCurrentId(targetId);
  }

  return (
    <div>
      <Breadcrumb steps={history} onJump={jumpTo} />

      <div style={{ borderRadius: 14, border: `1.5px solid ${isLocked ? "rgba(var(--text-rgb),0.1)" : accent.border}`, background: isLocked ? "rgba(var(--text-rgb),0.02)" : accent.bg, padding: "22px 24px", marginBottom: 16, transition: "border-color 0.2s, background 0.2s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: isLocked ? "rgba(var(--text-rgb),0.2)" : accent.labelColor, background: isLocked ? "rgba(var(--text-rgb),0.04)" : `${accent.labelColor}18`, border: `1px solid ${isLocked ? "rgba(var(--text-rgb),0.08)" : `${accent.labelColor}40`}`, borderRadius: 100, padding: "2px 8px" }}>
            {isOutcome ? (isLocked ? "Not yet covered" : node.isAdvanced ? "Beyond BIOL 300" : "Test") : accent.label}
          </span>
          {isOutcome && node.chapter && (
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", color: isLocked ? "rgba(var(--text-rgb),0.2)" : "rgba(var(--gold-rgb),0.6)", background: "rgba(var(--gold-rgb),0.08)", border: "1px solid rgba(var(--gold-rgb),0.15)", borderRadius: 100, padding: "2px 8px" }}>
              Ch.{node.chapter}
            </span>
          )}
          {isOutcome && node.note && <span style={{ fontSize: 9, color: "rgba(var(--text-rgb),0.25)", fontStyle: "italic" }}>{node.note}</span>}
        </div>
        <p style={{ fontSize: isOutcome ? 20 : 16, fontWeight: isOutcome ? 700 : 500, color: isLocked ? "rgba(var(--text-rgb),0.25)" : "var(--text)", lineHeight: 1.5, margin: 0 }}>
          {node.text}
        </p>
      </div>

      {!isOutcome && node.options && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {node.options.map(opt => {
            const nextNode    = nodes[opt.nextId];
            const nextOutcome = nextNode?.type === "outcome";
            const nextLocked  = nextOutcome && ((nextNode?.chapter !== undefined && nextNode.chapter > maxChapter) || nextNode?.isAdvanced === true);
            return (
              <button key={opt.nextId} type="button" onClick={() => choose(opt)}
                style={{ textAlign: "left", padding: "12px 18px", borderRadius: 10, border: `1px solid ${nextLocked ? "rgba(var(--text-rgb),0.08)" : "rgba(var(--gold-rgb),0.22)"}`, background: nextLocked ? "rgba(var(--text-rgb),0.02)" : "rgba(var(--text-rgb),0.03)", color: nextLocked ? "rgba(var(--text-rgb),0.25)" : "rgba(var(--text-rgb),0.8)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, transition: "border-color 0.15s, background 0.15s" }}
                onMouseOver={e => { if (!nextLocked) { const el = e.currentTarget; el.style.borderColor = "rgba(var(--gold-rgb),0.5)"; el.style.background = "rgba(var(--gold-rgb),0.06)"; } }}
                onMouseOut={e => { const el = e.currentTarget; el.style.borderColor = nextLocked ? "rgba(var(--text-rgb),0.08)" : "rgba(var(--gold-rgb),0.22)"; el.style.background = nextLocked ? "rgba(var(--text-rgb),0.02)" : "rgba(var(--text-rgb),0.03)"; }}>
                <span>{opt.label}</span>
                <span style={{ color: nextLocked ? "rgba(var(--text-rgb),0.15)" : GOLD, fontSize: 13, flexShrink: 0 }}>→</span>
              </button>
            );
          })}
        </div>
      )}

      {(isOutcome || !node.options?.length) && (
        <div style={{ marginTop: 20 }}>
          <button type="button" onClick={reset}
            style={{ padding: "9px 22px", borderRadius: 9, border: "1px solid rgba(var(--gold-rgb),0.3)", background: "transparent", color: GOLD_LIGHT, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(var(--gold-rgb),0.08)"; }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
            ↺ Start over
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: "one",   label: "1 Variable",   sub: "One-sample tests" },
  { id: "two",   label: "2 Variables",  sub: "Comparing groups, regression" },
  { id: "three", label: "3+ Variables", sub: "Multifactor designs" },
];

const TAB_DATA: Record<Tab, { nodes: Record<string, FlowNode>; startId: string }> = {
  one:   { nodes: ONE_VAR_NODES,   startId: ONE_VAR_START },
  two:   { nodes: TWO_VAR_NODES,   startId: TWO_VAR_START },
  three: { nodes: THREE_VAR_NODES, startId: THREE_VAR_START },
};

export default function FlowchartPage() {
  const [tab,  setTab]  = useState<Tab>("one");
  const [maxCh, setMaxCh] = useState(18);
  const [mode, setMode] = useState<Mode>("visual");

  const current = TAB_DATA[tab];

  return (
    <>
      <style>{`
        .fchip { transition: background 0.15s, border-color 0.15s, color 0.15s; }
        .fchip:hover { border-color: rgba(var(--gold-rgb),0.5) !important; color: rgba(var(--text-rgb),0.9) !important; }
      `}</style>

      <div style={{ minHeight: "100vh", background: BLUE_DARK }}>

        {/* Nav */}
        <header style={{ background: BLUE, borderBottom: "1px solid rgba(var(--gold-rgb),0.18)", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
              <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: GOLD, textDecoration: "none" }}>BIOL 300 Practice Hub</Link>
              <span style={{ color: "rgba(var(--text-rgb),0.2)", fontSize: 14 }}>/</span>
              <span style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.55)" }}>What Test?</span>
            </div>
            <Link href="/practice" style={{ fontSize: 12, fontWeight: 600, color: GOLD_LIGHT, textDecoration: "none", opacity: 0.7 }}>Practice →</Link>
          </div>
        </header>

        <main style={{ maxWidth: 960, margin: "0 auto", padding: "36px 24px 72px" }}>

          {/* Heading + controls row */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(var(--gold-rgb),0.55)", margin: "0 0 8px" }}>Decision Flowchart</p>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.025em", margin: "0 0 8px" }}>What Statistical Test?</h1>
            <p style={{ fontSize: 14, color: "rgba(var(--text-rgb),0.38)", margin: 0 }}>
              Use the visual diagram to see the full decision tree, or switch to step-by-step to navigate it interactively.
            </p>
          </div>

          {/* Controls bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 26, flexWrap: "wrap" }}>
            {/* Mode toggle */}
            <div style={{ display: "flex", gap: 3, background: "rgba(var(--text-rgb),0.05)", borderRadius: 9, padding: 3 }}>
              {(["visual", "wizard"] as Mode[]).map(m => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  style={{ padding: "5px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: mode === m ? GOLD : "transparent", color: mode === m ? "#002145" : "rgba(var(--text-rgb),0.4)", transition: "background 0.15s, color 0.15s" }}>
                  {m === "wizard" ? "Step-by-step" : "Visual"}
                </button>
              ))}
            </div>

            {/* Chapter filter */}
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(var(--gold-rgb),0.55)", flexShrink: 0 }}>Chapter filter</span>
            <ChapterSelect value={maxCh} onChange={setMaxCh} />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20, borderBottom: "1px solid rgba(var(--text-rgb),0.07)", paddingBottom: 0 }}>
            {TABS.map(t => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} className="fchip"
                style={{ padding: "8px 18px 10px", borderRadius: "8px 8px 0 0", fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${tab === t.id ? "rgba(var(--gold-rgb),0.35)" : "transparent"}`, borderBottom: tab === t.id ? `1px solid ${BLUE_DARK}` : "1px solid transparent", marginBottom: -1, background: tab === t.id ? BLUE_DARK : "transparent", color: tab === t.id ? "var(--text)" : "rgba(var(--text-rgb),0.38)", transition: "color 0.15s, border-color 0.15s" }}>
                {t.label}
                <span style={{ display: "block", fontSize: 9, fontWeight: 400, color: tab === t.id ? "rgba(var(--text-rgb),0.35)" : "rgba(var(--text-rgb),0.2)", letterSpacing: "0.02em", marginTop: 1 }}>{t.sub}</span>
              </button>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
            {[
              { color: "#6da3ff",  label: "Decision" },
              { color: "#c07ef0",  label: "Check / assumption" },
              { color: "#f0b855",  label: "Transformation" },
              { color: GOLD_LIGHT, label: "Outcome (test)" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: "rgba(var(--text-rgb),0.35)" }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* Main content — key forces remount on tab change */}
          {mode === "visual" ? (
            <FlowchartVisual key={tab} flowNodes={current.nodes} maxChapter={maxCh} />
          ) : (
            <FlowNavigator key={tab} nodes={current.nodes} startId={current.startId} maxChapter={maxCh} />
          )}

          {mode === "visual" && (
            <p style={{ marginTop: 10, fontSize: 11, color: "rgba(var(--text-rgb),0.2)", textAlign: "center" }}>
              Scroll to zoom · Click and drag to pan · Dimmed nodes are not yet covered by your chapter filter
            </p>
          )}

        </main>

        <footer style={{ borderTop: "1px solid rgba(var(--gold-rgb),0.1)", padding: "22px 28px", textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "rgba(var(--text-rgb),0.2)", margin: 0 }}>
            BIOL 300 · UBC
            &nbsp;·&nbsp;
            <Link href="/" style={{ color: GOLD, textDecoration: "none", opacity: 0.7 }}>Home</Link>
          </p>
        </footer>
      </div>
    </>
  );
}
