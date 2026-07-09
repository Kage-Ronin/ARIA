"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(username, password);
      router.replace(data.role === "admin" ? "/admin" : "/agent");
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--surface)" }}>
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(0,212,255,0.04) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="glass rounded-2xl p-10 w-full max-w-sm flex flex-col gap-6"
      >
        {/* Wordmark */}
        <div className="text-center">
          <h1 className="text-2xl font-sans font-light tracking-wide text-rim">Aria</h1>
          <p className="font-mono text-xs text-rim/30 mt-1 tracking-widest uppercase">
            Voice Document Assistant
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] uppercase tracking-widest text-rim/40">
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-surface-1/60 border border-white/8 rounded-lg px-4 py-3 text-sm font-mono text-rim outline-none focus:border-cyan-dim/60 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] uppercase tracking-widest text-rim/40">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-surface-1/60 border border-white/8 rounded-lg px-4 py-3 text-sm font-mono text-rim outline-none focus:border-cyan-dim/60 transition-colors"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-mono text-red-400/80 text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg py-3 text-sm font-mono tracking-widest uppercase transition-all
              bg-cyan-dim/20 border border-cyan-dim/30 text-cyan
              hover:bg-cyan-dim/35 hover:border-cyan/50
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating…" : "Enter"}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
