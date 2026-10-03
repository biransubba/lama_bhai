import React, { useState } from "react";
import { Bed } from "phosphor-react";
import OptimizedImage from "./OptimizedImage.jsx";
import "./StayImage.css";

function unwrapSrc(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    if (val.variants) return val; // preserve full variant descriptor
    if (typeof val.dataUrl === "string") return val.dataUrl;
    if (typeof val.dataUrl === "object" && val.dataUrl) return unwrapSrc(val.dataUrl);
    if (typeof val.src === "string") return val.src;
    if (typeof val.src === "object" && val.src) return unwrapSrc(val.src);
    if (typeof val.url === "string") return val.url;
  }
  return String(val || "");
}

export default function StayImage({
  src,
  alt = "Homestay photo",
  height = "100%",
  aspectRatio,
  className = "",
  style = {},
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
}) {
  const cleanSrc = unwrapSrc(src);
  const containerStyle = {
    height: typeof height === "number" ? `${height}px` : height,
    width: "100%",
    ...style,
  };

  return (
    <div className={`stay-image ${className}`} style={containerStyle}>
      <OptimizedImage
        src={cleanSrc}
        alt={alt}
        sizes={sizes}
        priority={priority}
        aspectRatio={aspectRatio}
        fallbackIcon={Bed}
        fallbackText="Homestay Photo"
        className="stay-image__inner"
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}