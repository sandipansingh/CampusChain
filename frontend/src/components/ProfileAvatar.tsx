"use client";

import React from "react";

interface ProfileAvatarProps {
  address: string | null;
  size?: number;
}

export default function ProfileAvatar({ address, size = 40 }: ProfileAvatarProps) {
  if (!address) {
    return (
      <div
        className="rounded-full bg-slate-200 border border-slate-300 shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  // Deterministic hash based on wallet address
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    "#e14e27", // orange/accent
    "#3b82f6", // blue
    "#10b981", // emerald
    "#8b5cf6", // purple
    "#f59e0b", // amber
    "#06b6d4", // cyan
    "#ec4899", // pink
    "#e11d48", // rose
    "#6366f1", // indigo
    "#14b8a6", // teal
  ];

  const bgColor = colors[Math.abs(hash) % colors.length];
  
  // Generate 3 abstract overlapping circles
  const shapes = [];
  const numShapes = 3;
  for (let i = 0; i < numShapes; i++) {
    const shapeColor = colors[Math.abs(hash + i * 17) % colors.length];
    const r = 25 + (Math.abs(hash - i * 11) % 25); // radius 25-50
    const cx = 20 + (Math.abs(hash + i * 23) % 60); // center X 20-80
    const cy = 20 + (Math.abs(hash - i * 31) % 60); // center Y 20-80
    shapes.push(
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={r}
        fill={shapeColor}
        opacity="0.8"
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="rounded-full overflow-hidden shrink-0 border border-slate-200 bg-white"
    >
      <rect width="100" height="100" fill={bgColor} />
      {shapes}
    </svg>
  );
}
