"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DoorCover() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(t);
  }, []);

  function handleEnter() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => router.push("/home"), 900);
  }

  return (
    <div className={`cover-stage${mounted ? " cover-stage-in" : ""}${leaving ? " cover-stage-out" : ""}`}>
      {/* extra dark veil over the global background */}
      <div className="cover-veil" />

      <div className="cover-body">
        {/* eyebrow */}
        <p className="cover-eyebrow font-type">VIENNA · 1913</p>

        {/* main title */}
        <h1 className="cover-title font-serif">
          <span className="cover-title-room">ROOM</span>
          <span className="cover-title-num">1913</span>
        </h1>

        {/* tagline */}
        <p className="cover-tagline font-serif">
          深夜的书房，跨越时间的对话
        </p>

        {/* divider */}
        <div className="cover-rule" />

        {/* CTA */}
        <button className="cover-enter font-type" onClick={handleEnter}>
          <span className="cover-enter-text">ENTER</span>
          <span className="cover-enter-arrow">›</span>
        </button>

        {/* footnote */}
        <p className="cover-footnote font-serif">
          Jung · Freud · Adler · Lacan
        </p>
      </div>

      {/* bottom fade */}
      <div className="cover-bottom-fade" />
    </div>
  );
}
