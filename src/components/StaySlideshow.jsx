import React, { useState, useEffect, useRef, useCallback } from "react";
import { CaretLeft, CaretRight, Bed, ImageSquare } from "phosphor-react";
import "./StaySlideshow.css";

function unwrapSrc(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    if (typeof val.dataUrl === "string") return val.dataUrl;
    if (typeof val.dataUrl === "object" && val.dataUrl) return unwrapSrc(val.dataUrl);
    if (typeof val.src === "string") return val.src;
    if (typeof val.src === "object" && val.src) return unwrapSrc(val.src);
    if (typeof val.url === "string") return val.url;
  }
  return String(val || "");
}

export default function StaySlideshow({ photos = [], coverImage = null, stayName = "Homestay", location = "" }) {
  // Normalize photo list into structured objects: { id, src, alt, category }
  const normalizedPhotos = React.useMemo(() => {
    let list = [];

    // Add cover image if provided separately
    const cleanCover = unwrapSrc(coverImage);
    if (cleanCover) {
      list.push({
        id: "cover_img",
        src: cleanCover,
        alt: `${stayName} cover photo`,
        category: "Cover",
      });
    }

    if (Array.isArray(photos)) {
      photos.forEach((p, idx) => {
        if (!p) return;
        let src = "";
        let alt = `${stayName} photo ${idx + 1}`;
        let category = "Gallery";
        let photoId = `photo_${idx}`;

        if (typeof p === "string") {
          src = unwrapSrc(p);
          category = idx === 0 && !cleanCover ? "Cover" : "Gallery";
        } else if (typeof p === "object") {
          src = unwrapSrc(p.src || p.dataUrl || p.url || p);
          alt = p.alt || p.name || alt;
          category = p.category || (idx === 0 && !cleanCover ? "Cover" : "Gallery");
          photoId = p.id || `photo_${idx}`;
        }

        if (src && !list.some((item) => item.src === src)) {
          list.push({
            id: photoId,
            src,
            alt,
            category,
          });
        }
      });
    }

    return list;
  }, [photos, coverImage, stayName]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState(new Set());
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const timerRef = useRef(null);

  const total = normalizedPhotos.length;

  const goToNext = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goToPrev = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goToSlide = (idx) => {
    if (idx >= 0 && idx < total) {
      setCurrentIndex(idx);
    }
  };

  // Auto-sliding interval (2.8s - snappier automatic transition)
  useEffect(() => {
    if (total <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      goToNext();
    }, 2800);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused, goToNext, currentIndex]);

  // Handle touch swipe for mobile
  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    setIsPaused(false);
  };

  const handleImageError = (src) => {
    setFailedImages((prev) => new Set([...prev, src]));
  };

  // Case 1: No photos available at all -> clean fallback placeholder
  if (total === 0) {
    return (
      <div className="stay-slideshow stay-slideshow--empty" aria-label="Homestay photos placeholder">
        <div className="stay-slideshow__empty-card">
          <Bed size={48} weight="duotone" className="stay-slideshow__empty-icon" />
          <h3 className="stay-slideshow__empty-title">Homestay Photo Gallery</h3>
          <p className="stay-slideshow__empty-sub">
            Photos for this {location ? `${location} ` : ""}homestay will be uploaded soon.
          </p>
          <span className="stay-slideshow__empty-badge">
            <ImageSquare size={16} /> Awaiting Host Photography
          </span>
        </div>
      </div>
    );
  }

  const currentPhoto = normalizedPhotos[currentIndex];
  const isCurrentFailed = failedImages.has(currentPhoto.src);

  // Case 2: Only 1 photo available -> display as large static hero without slideshow controls
  if (total === 1) {
    return (
      <div className="stay-slideshow stay-slideshow--single" aria-label={`Photo of ${stayName}`}>
        <div className="stay-slideshow__stage">
          {isCurrentFailed ? (
            <div className="stay-slideshow__img-fallback">
              <Bed size={40} weight="duotone" />
              <span>{stayName}</span>
            </div>
          ) : (
            <img
              src={currentPhoto.src}
              alt={currentPhoto.alt}
              className="stay-slideshow__img"
              onError={() => handleImageError(currentPhoto.src)}
            />
          )}
          {currentPhoto.category && (
            <span className="stay-slideshow__tag">{currentPhoto.category}</span>
          )}
        </div>
      </div>
    );
  }

  // Case 3: Multiple photos available -> full automatic slideshow with controls
  return (
    <div
      className="stay-slideshow"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label={`${stayName} Photo Slideshow`}
    >
      {/* Main Slideshow Stage */}
      <div className="stay-slideshow__stage">
        {isCurrentFailed ? (
          <div className="stay-slideshow__img-fallback">
            <Bed size={42} weight="duotone" />
            <span>{currentPhoto.alt}</span>
          </div>
        ) : (
          <img
            key={`stage_${currentPhoto.id || currentIndex}`}
            src={currentPhoto.src}
            alt={currentPhoto.alt}
            className="stay-slideshow__img stay-slideshow__img--fade"
            onError={() => handleImageError(currentPhoto.src)}
          />
        )}

        {/* Counter and Category Tag */}
        <div className="stay-slideshow__meta">
          <span className="stay-slideshow__counter">
            {currentIndex + 1} / {total}
          </span>
          {currentPhoto.category && (
            <span className="stay-slideshow__category">{currentPhoto.category}</span>
          )}
        </div>

        {/* Left / Prev Arrow */}
        <button
          type="button"
          className="stay-slideshow__arrow stay-slideshow__arrow--prev"
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }}
          aria-label="Previous photo"
        >
          <CaretLeft size={22} weight="bold" />
        </button>

        {/* Right / Next Arrow */}
        <button
          type="button"
          className="stay-slideshow__arrow stay-slideshow__arrow--next"
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          aria-label="Next photo"
        >
          <CaretRight size={22} weight="bold" />
        </button>


        {/* Pagination Dots - Centered directly at bottom of main gallery photo */}
        <div className="stay-slideshow__dots" role="tablist" aria-label="Slideshow pagination">
          {normalizedPhotos.map((photo, idx) => (
            <button
              key={`dot_${photo.id || idx}`}
              type="button"
              role="tab"
              aria-selected={idx === currentIndex}
              aria-label={`Jump to photo ${idx + 1}: ${photo.category || "View"}`}
              className={`stay-slideshow__dot ${idx === currentIndex ? "stay-slideshow__dot--active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(idx);
              }}
            />
          ))}
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="stay-slideshow__thumbs" aria-label="Photo thumbnails">
        {normalizedPhotos.map((photo, idx) => {
          const isThumbFailed = failedImages.has(photo.src);
          return (
            <button
              key={`thumb_${photo.id || idx}`}
              type="button"
              className={`stay-slideshow__thumb ${idx === currentIndex ? "stay-slideshow__thumb--active" : ""}`}
              onClick={() => goToSlide(idx)}
              aria-label={`Select photo ${idx + 1}`}
            >
              {isThumbFailed ? (
                <div className="stay-slideshow__thumb-fallback">
                  <Bed size={16} />
                </div>
              ) : (
                <img
                  src={photo.src}
                  alt={photo.alt}
                  onError={() => handleImageError(photo.src)}
                />
              )}
              {photo.category && (
                <span className="stay-slideshow__thumb-tag">{photo.category}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
