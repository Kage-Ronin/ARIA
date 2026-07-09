"use client";

import { useEffect, useRef, useState } from "react";
import type { Message } from "./TranscriptPanel";

interface SavedSession {
  id: string;
  dbId?: number;
  messages: Message[];
}

interface TranscriptModalProps {
  messages: Message[];
  savedSessions: SavedSession[];
  accentColor: string;
  onClose: () => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
}

export default function TranscriptModal({
  messages,
  savedSessions,
  accentColor,
  onClose,
  onDeleteSession,
  onClearAll,
}: TranscriptModalProps) {
  const allSessions: SavedSession[] = [
    ...savedSessions,
    ...(messages.length > 0 ? [{ id: "current", messages }] : []),
  ];

  const [selectedId, setSelectedId] = useState<string>(
    allSessions.length > 0 ? allSessions[allSessions.length - 1].id : ""
  );
  const [confirmClear, setConfirmClear] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // auto-scroll when selected session messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, messages]);

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // keep selected session in sync — if it gets deleted, fallback to last
  useEffect(() => {
    const ids = allSessions.map(s => s.id);
    if (!ids.includes(selectedId) && ids.length > 0) {
      setSelectedId(ids[ids.length - 1]);
    }
  }, [allSessions, selectedId]);

  const selectedSession = allSessions.find(s => s.id === selectedId);
  const totalMessages = allSessions.reduce((n, s) => n + s.messages.length, 0);

  const fmt = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}:${d.getSeconds().toString().padStart(2,"0")}`;
  };

  const sessionLabel = (s: SavedSession, idx: number) => {
    if (s.id === "current") return "Active session";
    if (s.messages.length > 0) {
      const d = new Date(s.messages[0].ts);
      return `${d.getMonth() + 1}/${d.getDate()} · ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    }
    return `Session ${idx + 1}`;
  };

  const firstTs = (s: SavedSession) =>
    s.messages.length > 0 ? fmt(s.messages[0].ts) : "";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.88)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(860px, 95vw)", height: "min(640px, 88vh)",
          background: "#0d0d0f",
          border: `1px solid ${accentColor}30`,
          display: "flex", flexDirection: "column",
          fontFamily: "'Courier New', monospace",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        {/* ── Top bar ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: `1px solid ${accentColor}20`,
          background: "#08080a",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div>
              <div style={{ color: accentColor, fontSize: 13, letterSpacing: "0.22em", fontWeight: 600 }}>
                TRANSCRIPT
              </div>
              <div style={{ color: "#555", fontSize: 10, letterSpacing: "0.12em", marginTop: 2 }}>
                {allSessions.length} session{allSessions.length !== 1 ? "s" : ""} &nbsp;·&nbsp; {totalMessages} messages
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Clear all */}
            {allSessions.length > 0 && (
              confirmClear ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ color: "#ff4444", fontSize: 10, letterSpacing: "0.1em" }}>Confirm?</span>
                  <button
                    onClick={() => { onClearAll(); setConfirmClear(false); setSelectedId(""); }}
                    style={dangerBtn}
                  >YES, DELETE ALL</button>
                  <button onClick={() => setConfirmClear(false)} style={ghostBtn(accentColor)}>CANCEL</button>
                </div>
              ) : (
                <button onClick={() => setConfirmClear(true)} style={ghostBtn("#ff4444")}>
                  CLEAR ALL
                </button>
              )
            )}
            <button onClick={onClose} style={ghostBtn(accentColor)}>CLOSE  ×</button>
          </div>
        </div>

        {/* ── Body: sidebar + messages ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Sidebar */}
          <div style={{
            width: 200, flexShrink: 0,
            borderRight: `1px solid ${accentColor}18`,
            overflowY: "auto",
            background: "#09090b",
          }}>
            {allSessions.length === 0 ? (
              <div style={{ padding: "24px 16px", color: "#444", fontSize: 11, letterSpacing: "0.1em" }}>
                No sessions yet
              </div>
            ) : (
              allSessions.map((s, i) => {
                const active = s.id === selectedId;
                const isCurrent = s.id === "current";
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    style={{
                      padding: "10px 14px",
                      borderBottom: `1px solid ${accentColor}10`,
                      cursor: "pointer",
                      background: active ? `${accentColor}12` : "transparent",
                      borderLeft: active ? `2px solid ${accentColor}` : "2px solid transparent",
                      position: "relative",
                      transition: "background 0.15s",
                    }}
                  >
                    {/* Session label */}
                    <div style={{
                      fontSize: 11, letterSpacing: "0.08em",
                      color: active ? accentColor : "#888",
                      marginBottom: 3,
                      paddingRight: 20,
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
                      {isCurrent && (
                        <span style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: "#22dd88", flexShrink: 0,
                          boxShadow: "0 0 5px #22dd88",
                          display: "inline-block",
                        }} />
                      )}
                      {sessionLabel(s, i)}
                    </div>

                    {/* Metadata */}
                    <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.08em" }}>
                      {s.messages.length} msg{s.messages.length !== 1 ? "s" : ""}
                      {firstTs(s) && <span>&nbsp;· {firstTs(s)}</span>}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteSession(s.id);
                      }}
                      title="Delete session"
                      style={{
                        position: "absolute", top: 8, right: 8,
                        background: "transparent", border: "none",
                        color: "#444", cursor: "pointer",
                        fontSize: 13, lineHeight: 1, padding: "2px 4px",
                        borderRadius: 2,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#ff4444")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#444")}
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Messages pane */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {!selectedSession || selectedSession.messages.length === 0 ? (
              <div style={{
                height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                color: "#333", fontSize: 12, letterSpacing: "0.15em",
              }}>
                NO MESSAGES IN THIS SESSION
              </div>
            ) : (
              selectedSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    marginBottom: 20,
                    display: "flex", gap: 14, alignItems: "flex-start",
                  }}
                >
                  {/* Role column */}
                  <div style={{ flexShrink: 0, width: 48, paddingTop: 1 }}>
                    <div style={{
                      fontSize: 10, letterSpacing: "0.12em", fontWeight: 600,
                      color: msg.role === "user" ? "#00c8f0" : accentColor,
                      marginBottom: 3,
                    }}>
                      {msg.role === "user" ? "YOU" : "ARIA"}
                    </div>
                    <div style={{ fontSize: 9, color: "#3a3a3a", letterSpacing: "0.06em" }}>
                      {fmt(msg.ts)}
                    </div>
                  </div>

                  {/* Vertical rule */}
                  <div style={{
                    flexShrink: 0, width: 1, alignSelf: "stretch",
                    background: msg.role === "user" ? "#00c8f022" : `${accentColor}22`,
                    marginTop: 3,
                  }} />

                  {/* Text */}
                  <div style={{
                    flex: 1,
                    fontSize: 14, lineHeight: 1.7,
                    color: "#d8d8d8",
                    wordBreak: "break-word",
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "8px 20px",
          borderTop: `1px solid ${accentColor}12`,
          display: "flex", justifyContent: "space-between",
          fontSize: 9, color: "#2a2a2a", letterSpacing: "0.1em",
          flexShrink: 0,
        }}>
          <span>ARIA VOICE RAG · TRANSCRIPTS SAVED TO DATABASE</span>
          <span>ESC TO CLOSE</span>
        </div>
      </div>
    </div>
  );
}

// ── Shared button styles ──────────────────────────────────────────────────────

const dangerBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #ff444488",
  color: "#ff4444",
  fontSize: 9, letterSpacing: "0.12em",
  padding: "4px 10px", cursor: "pointer", borderRadius: 2,
};

const ghostBtn = (color: string): React.CSSProperties => ({
  background: "transparent",
  border: `1px solid ${color}33`,
  color: `${color}99`,
  fontSize: 9, letterSpacing: "0.12em",
  padding: "4px 12px", cursor: "pointer", borderRadius: 2,
});
