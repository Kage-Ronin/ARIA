"use client";

import { useRef, useEffect } from "react";

interface WaveformProps {
  analyser: AnalyserNode | null;
  color?: string;
  barCount?: number;
  height?: number;
  className?: string;
}

export default function Waveform({
  analyser,
  color = "#00d4ff",
  barCount = 48,
  height = 56,
  className,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const buf = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const { width, height: h } = canvas;
      ctx.clearRect(0, 0, width, h);

      if (!analyser || !buf) {
        // Flat idle line
        ctx.fillStyle = color + "33";
        const bw = (width / barCount) * 0.5;
        for (let i = 0; i < barCount; i++) {
          const x = (i / barCount) * width + bw * 0.5;
          ctx.fillRect(x, h / 2 - 1, bw, 2);
        }
        return;
      }

      analyser.getByteFrequencyData(buf);
      const step = Math.floor(buf.length / barCount);
      const bw   = Math.max(1, (width / barCount) - 2);

      for (let i = 0; i < barCount; i++) {
        const val     = buf[i * step] / 255;
        const barH    = Math.max(2, val * h * 0.92);
        const x       = (i / barCount) * width;
        const opacity = 0.35 + val * 0.65;
        ctx.fillStyle = color + Math.round(opacity * 255).toString(16).padStart(2, "0");
        ctx.fillRect(x, (h - barH) / 2, bw, barH);
      }
    };

    draw();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, color, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={height}
      className={className}
      style={{ width: "100%", height }}
    />
  );
}
