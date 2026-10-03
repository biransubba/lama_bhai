import React from "react";
import { Bicycle } from "phosphor-react";
import OptimizedImage from "./OptimizedImage.jsx";
import "./BikeImage.css";

export default function BikeImage({
  src,
  alt = "Touring bike photo",
  height = 100,
  aspectRatio,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
}) {
  const containerStyle = {
    height: typeof height === "number" ? `${height}px` : height,
    width: "100%",
  };

  return (
    <div className="bike-image" style={containerStyle}>
      <OptimizedImage
        src={src}
        alt={alt}
        sizes={sizes}
        priority={priority}
        aspectRatio={aspectRatio}
        fallbackIcon={Bicycle}
        fallbackText="Bike Photo"
        className="bike-image__inner"
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}