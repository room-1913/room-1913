"use client";
import { useState } from "react";

interface Props {
  id: string;
  initial: string;
  src?: string;
}

export default function Portrait({ id, initial, src }: Props) {
  const [failed, setFailed] = useState(false);
  const showImg = !!src && !failed;
  return (
    <div className="portrait" data-id={id}>
      {showImg ? (
        <img
          src={src}
          alt=""
          className="portrait-img"
          onError={() => setFailed(true)}
          loading="lazy"
        />
      ) : (
        <span className="portrait-monogram font-serif italic">{initial}</span>
      )}
      <span className="portrait-vignette" aria-hidden />
    </div>
  );
}
