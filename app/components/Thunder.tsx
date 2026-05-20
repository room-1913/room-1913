"use client";
import { useEffect, useState } from "react";

export default function Thunder() {
  const [flash, setFlash] = useState(0);

  useEffect(() => {
    let timer: any;
    const schedule = () => {
      const delay = 14000 + Math.random() * 26000;
      timer = setTimeout(() => {
        const intensity = 0.35 + Math.random() * 0.5;
        setFlash(intensity);
        document.documentElement.style.setProperty("--thunder", String(intensity));
        setTimeout(() => {
          setFlash(intensity * 0.4);
          document.documentElement.style.setProperty("--thunder", String(intensity * 0.4));
        }, 90);
        setTimeout(() => {
          setFlash(0);
          document.documentElement.style.setProperty("--thunder", "0");
        }, 360);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="thunder-flash pointer-events-none fixed inset-0 z-30"
      style={{ opacity: flash }}
      aria-hidden
    />
  );
}
