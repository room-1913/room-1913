"use client";
import { useEffect, useState } from "react";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function formatToday(d: Date) {
  return `${MONTHS[d.getMonth()]}. ${d.getDate()}, 1913 ☁`;
}

function msUntilNextMidnight() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
  return next.getTime() - now.getTime();
}

export default function WindowDateChip() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(formatToday(new Date()));
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        setLabel(formatToday(new Date()));
        schedule();
      }, msUntilNextMidnight());
    };
    schedule();
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="window-chip font-type">
      <p className="window-chip-line">{label ?? " "}</p>
      <p className="window-chip-line ink-fade">Vienna · 雨 ☂</p>
    </div>
  );
}
