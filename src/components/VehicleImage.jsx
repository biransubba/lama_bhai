import React from "react";
import { Car } from "phosphor-react";
import OptimizedImage from "./OptimizedImage.jsx";
import "./VehicleImage.css";

export default function VehicleImage({
  src,
  alt = "Vehicle photo",
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
    <div className="vehicle-image" style={containerStyle}>
      <OptimizedImage
        src={src}
        alt={alt}
        sizes={sizes}
        priority={priority}
        aspectRatio={aspectRatio}
        fallbackIcon={Car}
        fallbackText="Vehicle Photo"
        className="vehicle-image__inner"
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}