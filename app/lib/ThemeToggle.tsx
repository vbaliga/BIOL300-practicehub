"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("theme") === "light") setDark(false);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 999,
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "1px solid rgba(var(--gold-rgb), 0.35)",
        background: "var(--surface)",
        color: "var(--gold)",
        fontSize: 16,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
        transition: "opacity 0.15s, transform 0.1s",
        lineHeight: 1,
      }}
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}
