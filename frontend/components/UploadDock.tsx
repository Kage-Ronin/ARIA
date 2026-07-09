"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadFile } from "@/lib/api";

interface FileProgress {
  name: string;
  pct: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

interface UploadDockProps {
  onUploaded?: () => void;
}

export default function UploadDock({ onUploaded }: UploadDockProps) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<FileProgress[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const arr = Array.from(fileList);
      const initial: FileProgress[] = arr.map((f) => ({
        name: f.name,
        pct: 0,
        status: "uploading",
      }));
      setFiles((prev) => [...prev, ...initial]);

      for (const file of arr) {
        try {
          await uploadFile(file, (pct) => {
            setFiles((prev) =>
              prev.map((p) => (p.name === file.name ? { ...p, pct } : p))
            );
          });
          setFiles((prev) =>
            prev.map((p) =>
              p.name === file.name ? { ...p, pct: 100, status: "done" } : p
            )
          );
        } catch (err) {
          setFiles((prev) =>
            prev.map((p) =>
              p.name === file.name
                ? { ...p, status: "error", error: String(err) }
                : p
            )
          );
        }
      }
      onUploaded?.();
    },
    [onUploaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4">
      {/* Drop zone */}
      <motion.div
        animate={{ borderColor: dragging ? "rgba(0,212,255,0.7)" : "rgba(255,255,255,0.12)" }}
        transition={{ duration: 0.15 }}
        className="relative rounded-xl border-2 border-dashed p-10 text-center cursor-pointer select-none"
        style={{ background: dragging ? "rgba(0,212,255,0.04)" : "transparent" }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
        <p className="text-rim/40 font-mono text-sm">
          {dragging ? "Drop to ingest" : "Drop files here or click to browse"}
        </p>
        <p className="text-rim/20 font-mono text-xs mt-1">
          PDF · DOCX · PPTX · XLSX · CSV · HTML · images · audio
        </p>
      </motion.div>

      {/* Per-file progress */}
      <AnimatePresence initial={false}>
        {files.map((f) => (
          <motion.div
            key={f.name}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="rounded-lg bg-surface-2/60 border border-white/6 px-4 py-3 overflow-hidden"
            style={{ backdropFilter: "blur(8px)" }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono text-rim/70 truncate max-w-[70%]" title={f.name}>
                {f.name}
              </span>
              <span
                className={`text-[10px] font-mono uppercase tracking-widest ${
                  f.status === "done"
                    ? "text-cyan"
                    : f.status === "error"
                    ? "text-red-400"
                    : "text-rim/30"
                }`}
              >
                {f.status === "uploading"
                  ? `${Math.round(f.pct)}%`
                  : f.status === "done"
                  ? "ready"
                  : "error"}
              </span>
            </div>
            {f.status !== "error" && (
              <div className="h-0.5 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-cyan"
                  animate={{ width: `${f.pct}%` }}
                  transition={{ ease: "linear", duration: 0.2 }}
                />
              </div>
            )}
            {f.status === "error" && (
              <p className="text-[11px] font-mono text-red-400/70 mt-1">{f.error}</p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
