import React from "react";
import { Mountains, Camera } from "phosphor-react";
import { unwrapImageUrl } from "../data/destinationImages.js";
import OptimizedImage from "./OptimizedImage.jsx";
import "./DestinationImage.css";

export default function DestinationImage({
  src,
  alt = "North Sikkim destination",
  dark = false,
  photoCount = 0,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
}) {
  const cleanSrc = unwrapImageUrl(src);

  return (
    <div className={`dest-image ${!cleanSrc ? (dark ? "dest-image--placeholder dest-image--dark" : "dest-image--placeholder") : ""}`}>
      <OptimizedImage
        src={cleanSrc}
        alt={alt}
        sizes={sizes}
        priority={priority}
        fallbackIcon={Mountains}
        fallbackText="Scenic Destination"
        style={{ height: "100%", width: "100%" }}
      />
      {photoCount > 0 && (
        <span className="dest-image__count-badge">
          <Camera size={12} weight="bold" />
          <span>{photoCount} {photoCount === 1 ? "Photo" : "Photos"}</span>
        </span>
      )}
    </div>
  );
}