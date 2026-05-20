"use client";
import { useState } from "react";

const ANSWERS = [
  "Yes, but not yet.",
  "Let it go.",
  "The door is already open.",
  "Not this one.",
  "Wait for the rain to stop.",
  "You already know.",
  "It will find you.",
  "Now.",
  "Trust the next step only.",
  "Less than you fear.",
  "Someone is thinking of you.",
  "It was never yours to keep.",
  "Turn back.",
  "The answer is in the asking.",
  "Give it one more night.",
  "Yes.",
  "Not yet.",
  "Forget it.",
  "Look closer.",
  "This too will pass like rain.",
];

export default function Mirror() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const openMirror = () => {
    setQ(ANSWERS[Math.floor(Math.random() * ANSWERS.length)]);
    setOpen(true);
    window.dispatchEvent(new CustomEvent("room1913:hush", { detail: { mul: 0.22, ms: 700 } }));
  };
  const closeMirror = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("room1913:hush", { detail: { mul: 1, ms: 1400 } }));
  };

  return (
    <>
      <button
        onClick={openMirror}
        aria-label="a mirror on the wall"
        className="mirror-frame"
      />
      <div
        className={`mirror-veil ${open ? "mirror-veil-open" : ""}`}
        onClick={closeMirror}
        aria-hidden={!open}
      >
        <p className="mirror-question font-serif italic">{q}</p>
      </div>
    </>
  );
}
