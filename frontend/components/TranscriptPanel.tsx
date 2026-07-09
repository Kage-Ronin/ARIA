"use client";

import { useEffect, useRef } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  ts: number;
}

interface TranscriptPanelProps {
  messages: Message[];
  accentColor?: string;
}

export default function TranscriptPanel({ messages, accentColor = "#ff8c00" }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) return null;

  const last5 = messages.slice(-5);

  return (
    <div style={{
      width: "100%", maxWidth: 680, margin: "0 auto",
      maxHeight: 200, overflowY: "auto",
      background: "#07070a",
      border: `1px solid ${accentColor}18`,
      borderRadius: 3,
      padding: "10px 0",
      fontFamily: "'Courier New', monospace",
    }}>
      <div style={{
        fontSize: 8, color: `${accentColor}44`, letterSpacing: "0.2em",
        padding: "0 16px 8px",
        borderBottom: `1px solid ${accentColor}10`,
        marginBottom: 2,
      }}>
        RECENT EXCHANGE
      </div>
      {last5.map((msg) => (
        <div key={msg.id} style={{
          padding: "7px 16px",
          display: "flex", gap: 12, alignItems: "flex-start",
          borderBottom: `1px solid ${accentColor}08`,
        }}>
          <span style={{
            fontSize: 9, letterSpacing: "0.08em", flexShrink: 0,
            paddingTop: 3, width: 32, textAlign: "right",
            color: msg.role === "user" ? "#00c8f0" : accentColor,
            fontWeight: 600,
          }}>
            {msg.role === "user" ? "YOU" : "ARIA"}
          </span>
          <div style={{
            width: 1, alignSelf: "stretch",
            background: msg.role === "user" ? "#00c8f015" : `${accentColor}15`,
            flexShrink: 0, marginTop: 2,
          }} />
          <span style={{
            fontSize: 13, color: "#c8c8c8", lineHeight: 1.6,
            wordBreak: "break-word", flex: 1,
          }}>
            {msg.text}
          </span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
