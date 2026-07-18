import { SVGProps } from "react";

export function VaxtaGoLogo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="VaxtaGo"
    >
      <defs>
        <linearGradient id="vg-grad" x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="0.5" stopColor="#06B6D4" />
          <stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      {/* Outer rounded shield-like frame with soft corners */}
      <path
        d="M24 3.5 L41 11.5 V27 C41 36 33.5 42.5 24 45 C14.5 42.5 7 36 7 27 V11.5 Z"
        stroke="url(#vg-grad)"
        strokeWidth="2.5"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Inner V formed by upward arrow + route lines */}
      <path
        d="M15 33 L24 14 L33 33"
        stroke="url(#vg-grad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Upward arrow head at top of V */}
      <path
        d="M19.5 20.5 L24 13 L28.5 20.5"
        stroke="url(#vg-grad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Route dot at center */}
      <circle cx="24" cy="27" r="2.2" fill="url(#vg-grad)" />
    </svg>
  );
}

export function VaxtaGoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="VaxtaGo"
    >
      <defs>
        <linearGradient id="vg-mark-grad" x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="0.5" stopColor="#06B6D4" />
          <stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#vg-mark-grad)" />
      <path d="M15 32 L24 14 L33 32" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M19.5 20 L24 12.5 L28.5 20" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="24" cy="26.5" r="2" fill="white" />
    </svg>
  );
}