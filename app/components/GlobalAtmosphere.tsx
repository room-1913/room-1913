"use client";
import { useEffect, useRef } from "react";
import WindowScene from "./WindowScene";

interface Drop {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  drift: number;
  driftPhase: number;
  layer: 0 | 1 | 2;
  len: number;
  alpha: number;
}

export default function GlobalAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const driftRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current!;
    const drift = driftRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dctx = drift.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let W = 0, H = 0;
    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      for (const c of [canvas, drift]) {
        c.width = W * dpr;
        c.height = H * dpr;
        c.style.width = W + "px";
        c.style.height = H + "px";
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const TARGET = reduce ? 50 : 90;
    const TILT = reduce ? 0 : 0.105;
    const drops: Drop[] = [];

    const seedDrop = (fromTop = false): Drop => {
      const layer = (Math.random() < 0.45 ? 0 : Math.random() < 0.75 ? 1 : 2) as 0 | 1 | 2;
      const speedBand =
        layer === 0 ? [0.20, 0.40] :
        layer === 1 ? [0.50, 0.85] :
                      [1.00, 1.60];
      const radiusBand =
        layer === 0 ? [0.45, 0.85] :
        layer === 1 ? [0.7, 1.15] :
                      [0.95, 1.45];
      const alphaBand =
        layer === 0 ? [0.18, 0.28] :
        layer === 1 ? [0.28, 0.40] :
                      [0.36, 0.52];
      const lenBand =
        layer === 0 ? [4, 8] :
        layer === 1 ? [8, 14] :
                      [14, 22];
      const rand = (b: number[]) => b[0] + Math.random() * (b[1] - b[0]);
      return {
        x: Math.random() * W,
        y: fromTop ? -Math.random() * 80 : Math.random() * H,
        r: rand(radiusBand),
        vy: rand(speedBand),
        vx: (Math.random() - 0.5) * 0.04,
        drift: 0.15 + Math.random() * 0.35,
        driftPhase: Math.random() * Math.PI * 2,
        layer,
        len: rand(lenBand),
        alpha: rand(alphaBand),
      };
    };

    for (let i = 0; i < TARGET; i++) drops.push(seedDrop(false));

    let raf = 0;
    let lastDrift = 0;
    let t = 0;

    const drawDrop = (d: Drop) => {
      const tipX = d.x;
      const tipY = d.y;
      const tailX = d.x - d.len * TILT;
      const tailY = d.y - d.len;
      const grad = ctx.createLinearGradient(tailX, tailY, tipX, tipY);
      grad.addColorStop(0, "rgba(120,140,168,0)");
      grad.addColorStop(1, `rgba(150,170,196,${d.alpha.toFixed(3)})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = d.r;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
    };

    const tick = (now: number) => {
      ctx.clearRect(0, 0, W, H);
      t = now / 1000;

      if (now - lastDrift > 90) {
        dctx.fillStyle = "rgba(0,0,0,0.05)";
        dctx.fillRect(0, 0, W, H);
        if (!reduce) {
          const wisps = 3;
          dctx.strokeStyle = "rgba(140,160,184,0.06)";
          dctx.lineWidth = 0.5;
          for (let i = 0; i < wisps; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H;
            const len = 18 + Math.random() * 30;
            dctx.beginPath();
            dctx.moveTo(x, y);
            dctx.lineTo(x - 0.6, y + len);
            dctx.stroke();
          }
        }
        lastDrift = now;
      }

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        const sway = Math.sin(t * d.drift + d.driftPhase) * 0.18;
        d.x += d.vx + sway * 0.3 - d.vy * TILT * (reduce ? 0 : 1);
        d.y += d.vy * (reduce ? 0.45 : 1);

        if (d.y - d.len > H + 4 || d.x < -8 || d.x > W + 8) {
          drops[i] = seedDrop(true);
          continue;
        }
        drawDrop(d);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="atmos" aria-hidden>
      <div className="atmos-scene"><WindowScene /></div>
      <canvas ref={driftRef} className="atmos-drift" />
      <canvas ref={canvasRef} className="atmos-rain" />
      <div className="atmos-veil" />
    </div>
  );
}
