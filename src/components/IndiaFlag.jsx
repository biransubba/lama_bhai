import React from "react";

/**
 * Crisp vector SVG Indian Flag icon.
 * Ensures pixel-perfect, unblurred rendering across all platforms (Windows, macOS, iOS, Android)
 * without depending on OS-level emoji fonts that render as 'IN'.
 */
export default function IndiaFlag({
  width = 22,
  height = 15,
  className = "",
  style = {},
  title = "India",
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 30 20"
      width={width}
      height={height}
      className={`india-flag-svg ${className}`}
      style={{
        borderRadius: "2.5px",
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.16)",
        border: "0.5px solid rgba(0, 0, 0, 0.18)",
        verticalAlign: "middle",
        flexShrink: 0,
        display: "inline-block",
        ...style,
      }}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {/* Top Saffron Stripe */}
      <rect width="30" height="6.67" fill="#FF9933" />
      {/* Middle White Stripe */}
      <rect y="6.67" width="30" height="6.67" fill="#FFFFFF" />
      {/* Bottom India Green Stripe */}
      <rect y="13.33" width="30" height="6.67" fill="#138808" />

      {/* Ashoka Chakra */}
      <circle cx="15" cy="10" r="2.5" fill="none" stroke="#000080" strokeWidth="0.45" />
      <circle cx="15" cy="10" r="0.55" fill="#000080" />
      {/* 24 Radial Spokes */}
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={i}
          x1="15"
          y1="10"
          x2="15"
          y2="7.5"
          stroke="#000080"
          strokeWidth="0.22"
          transform={`rotate(${i * 15} 15 10)`}
        />
      ))}
    </svg>
  );
}
