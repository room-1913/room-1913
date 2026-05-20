"use client";
import { useEffect, useRef } from "react";

export default function Dust({ count = 60 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const motes = Array.from({ length: count }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.4 + Math.random() * 1.6,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -0.05 - Math.random() * 0.18,
      o: 0.05 + Math.random() * 0.35,
      tw: Math.random() * Math.PI * 2,
      ts: 0.004 + Math.random() * 0.012,
    }));

    let raf = 0;
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.tw += m.ts;
        const flicker = 0.55 + 0.45 * Math.sin(m.tw);
        const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 4);
        grad.addColorStop(0, `rgba(255,220,160,${m.o * flicker})`);
        grad.addColorStop(1, "rgba(255,220,160,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 4, 0, Math.PI * 2);
        ctx.fill();
        m.x += m.vx;
        m.y += m.vy;
        if (m.y < -10) { m.y = h + 10; m.x = Math.random() * w; }
        if (m.x < -10) m.x = w + 10;
        if (m.x > w + 10) m.x = -10;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [count]);

  return <canvas ref={ref} className="dust-canvas" aria-hidden />;
}
