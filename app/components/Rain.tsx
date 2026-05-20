"use client";
import { useEffect, useRef } from "react";

export default function Rain({ density = 180 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const drops = Array.from({ length: density }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      l: 10 + Math.random() * 16,
      s: 6 + Math.random() * 6,
      o: 0.15 + Math.random() * 0.35
    }));

    let raf = 0;
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(210,200,180,0.35)";
      ctx.lineWidth = 1;
      for (const d of drops) {
        ctx.globalAlpha = d.o;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2, d.y + d.l);
        ctx.stroke();
        d.y += d.s;
        d.x -= 0.6;
        if (d.y > h) { d.y = -20; d.x = Math.random() * w; }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [density]);

  return <canvas ref={ref} className="rain-canvas" aria-hidden />;
}
