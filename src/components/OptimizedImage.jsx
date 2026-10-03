import React, { useState, useEffect } from "react";
import { Image as ImageIcon } from "phosphor-react";
import { getOptimizedImage } from "../utils/imageProcessor.js";
import "./OptimizedImage.css";

/**
 * OptimizedImage
 * 
 * Production-ready responsive image component with:
 * - HTML <picture> container prioritizing AVIF and WebP with fallback
 * - Responsive sizes & srcsets
 * - Native lazy loading (default) or eager loading + fetchpriority="high" for hero
 * - Zero layout shift via CSS aspect-ratio / width / height
 * - Editorial shimmer skeleton loading state
 * - Graceful fallback on error
 */
export default function OptimizedImage({
  src,
  alt = "",
  sizes,
  priority = false,
  loading,
  aspectRatio,
  width,
  height,
  className = "",
  imgClassName = "",
  style = {},
  objectFit = "cover",
  fallbackIcon: FallbackIcon = ImageIcon,
  fallbackText = "Image unavailable",
  onLoad,
  onError,
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Parse asset into responsive picture sources
  const opt = getOptimizedImage(src, { sizes, width, height });

  // Reset loading/error state if source changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [opt.src]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    setIsLoaded(true);
    if (onError) onError(e);
  };

  const wrapStyle = {
    ...(aspectRatio ? { aspectRatio: String(aspectRatio) } : {}),
    ...(width ? { width: typeof width === "number" ? `${width}px` : width } : {}),
    ...(height ? { height: typeof height === "number" ? `${height}px` : height } : {}),
    ...style,
  };

  const imgStyle = {
    objectFit,
  };

  // If no source provided at all
  if (!opt.src || hasError) {
    return (
      <div className={`optimized-image-wrap ${className}`} style={wrapStyle} role="img" aria-label={alt || fallbackText}>
        <div className="optimized-image__fallback">
          <FallbackIcon size={32} weight="duotone" />
          {fallbackText && <span>{fallbackText}</span>}
        </div>
      </div>
    );
  }

  const effectiveLoading = priority ? "eager" : (loading || "lazy");

  return (
    <div className={`optimized-image-wrap ${className}`} style={wrapStyle}>
      {!isLoaded && <div className="optimized-image__skeleton" aria-hidden="true" />}
      <picture>
        {opt.avifSrc && (
          <source
            type="image/avif"
            srcSet={opt.avifSrcSet || opt.avifSrc}
            sizes={opt.sizes}
          />
        )}
        {opt.webpSrc && (
          <source
            type="image/webp"
            srcSet={opt.webpSrcSet || opt.webpSrc}
            sizes={opt.sizes}
          />
        )}
        <img
          src={opt.fallbackSrc || opt.src}
          srcSet={opt.fallbackSrcSet}
          sizes={opt.sizes}
          alt={alt}
          loading={effectiveLoading}
          {...(priority ? { fetchPriority: "high" } : {})}
          decoding={priority ? "sync" : "async"}
          width={width || opt.width}
          height={height || opt.height}
          onLoad={handleLoad}
          onError={handleError}
          className={`optimized-image__img ${isLoaded ? "is-loaded" : "is-loading"} ${imgClassName}`}
          style={imgStyle}
        />
      </picture>
    </div>
  );
}
