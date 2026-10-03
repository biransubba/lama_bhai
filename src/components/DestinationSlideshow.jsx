import React, { useState, useEffect, useRef, useCallback } from "react";
import { CaretLeft, CaretRight, Mountains, Camera, ArrowsOut, X } from "phosphor-react";
import { unwrapImageUrl, getDefaultDestinationPhotos } from "../data/destinationImages.js";
import "./DestinationSlideshow.css";

export default function DestinationSlideshow({
  photos = [],
  coverImage = null,
  destinationName = "Sikkim Destination",
  tag = "Himalayan Region",
  destinationSlug = "",
}) {
  // Normalize photos into structured objects: { id, src, alt, category }
  const normalizedPhotos = React.useMemo(() => {
    let list = [];

    const cleanCover = unwrapImageUrl(coverImage);
    if (cleanCover) {
      list.push({
        id: "cover_img",
        src: cleanCover,
        alt: `${destinationName} cover photo`,
        category: "Cover Photo",
      });
    }

    if (Array.isArray(photos)) {
      photos.forEach((p, idx) => {
        if (!p) return;
        let src = "";
        let alt = `${destinationName} photo ${idx + 1}`;
        let category = "Scenic View";
        let photoId = `photo_${idx}`;

        if (typeof p === "string") {
          src = unwrapImageUrl(p);
          category = idx === 0 && !cleanCover ? "Cover Photo" : `Gallery #${idx + 1}`;
        } else if (typeof p === "object") {
          src = unwrapImageUrl(p.src || p.dataUrl || p.url || p);
          alt = p.alt || p.name || alt;
          category = p.category || (idx === 0 && !cleanCover ? "Cover Photo" : `Scenic View`);
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

    // Direct fallback to default bundled photos if list is empty
    if (list.length === 0 && destinationSlug) {
      const fallbackDefaults = getDefaultDestinationPhotos(destinationSlug);
      if (fallbackDefaults.cover) {
        list.push({
          id: `${destinationSlug}_cover`,
          src: fallbackDefaults.cover,
          alt: `${destinationName} cover photo`,
          category: "Cover Photo",
        });
      }
      (fallbackDefaults.gallery || []).forEach((g, idx) => {
        if (g.src && !list.some((item) => item.src === g.src)) {
          list.push({
            id: g.id || `fallback_${idx}`,
            src: g.src,
            alt: g.alt || `${destinationName} view`,
            category: g.category || "Scenic View",
          });
        }
      });
    }

    return list;
  }, [photos, coverImage, destinationName, destinationSlug]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
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

  // Automatic slideshow (3.2 seconds cycle)
  useEffect(() => {
    if (total <= 1 || isPaused || lightboxOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      goToNext();
    }, 3200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused, lightboxOpen, goToNext]);

  // Touch swipe support
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) goToNext();
    if (diff < -50) goToPrev();
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Case 1: Empty photos
  if (total === 0) {
    return (
      <div className="dest-slideshow dest-slideshow--empty">
        <div className="dest-slideshow__empty-card">
          <Mountains size={48} weight="duotone" className="dest-slideshow__empty-icon" />
          <h3 className="dest-slideshow__empty-title">{destinationName} Gallery</h3>
          <p className="dest-slideshow__empty-sub">
            Photos of {destinationName} will be curated soon by the team.
          </p>
        </div>
      </div>
    );
  }

  // Case 2: Only 1 photo
  if (total === 1) {
    const singlePhoto = normalizedPhotos[0];
    return (
      <div className="dest-slideshow dest-slideshow--single">
        <div className="dest-slideshow__stage" onClick={() => setLightboxOpen(true)}>
          <img
            src={singlePhoto.src}
            alt={singlePhoto.alt}
            className="dest-slideshow__img"
          />
          <div className="dest-slideshow__meta">
            <span className="dest-slideshow__category">{singlePhoto.category}</span>
          </div>
          <button
            type="button"
            className="dest-slideshow__zoom-btn"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            aria-label="View full size photo"
          >
            <ArrowsOut size={16} weight="bold" />
          </button>
        </div>

        {lightboxOpen && (
          <div className="dest-lightbox" onClick={() => setLightboxOpen(false)}>
            <button className="dest-lightbox__close" onClick={() => setLightboxOpen(false)}>
              <X size={24} weight="bold" />
            </button>
            <img src={singlePhoto.src} alt={singlePhoto.alt} className="dest-lightbox__img" />
          </div>
        )}
      </div>
    );
  }

  // Case 3: Multiple photos (interactive slideshow)
  const currentPhoto = normalizedPhotos[currentIndex] || normalizedPhotos[0];

  return (
    <div
      className="dest-slideshow"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label={`${destinationName} Photo Slideshow`}
    >
      {/* Main Slideshow Stage */}
      <div className="dest-slideshow__stage" onClick={() => setLightboxOpen(true)}>
        <img
          key={currentPhoto.id || currentIndex}
          src={currentPhoto.src}
          alt={currentPhoto.alt}
          className="dest-slideshow__img dest-slideshow__img--fade"
        />

        {/* Overlay Counter & Category */}
        <div className="dest-slideshow__meta">
          <span className="dest-slideshow__counter">
            <Camera size={13} weight="bold" style={{ marginRight: "4px" }} />
            {currentIndex + 1} / {total}
          </span>
          <span className="dest-slideshow__category">{currentPhoto.category}</span>
        </div>

        {/* Zoom Lightbox Trigger */}
        <button
          type="button"
          className="dest-slideshow__zoom-btn"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxOpen(true);
          }}
          title="Click to view full screen"
          aria-label="View full size photo"
        >
          <ArrowsOut size={16} weight="bold" />
        </button>

        {/* Prev / Next Navigation Arrows */}
        <button
          type="button"
          className="dest-slideshow__arrow dest-slideshow__arrow--prev"
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }}
          aria-label="Previous photo"
        >
          <CaretLeft size={22} weight="bold" />
        </button>

        <button
          type="button"
          className="dest-slideshow__arrow dest-slideshow__arrow--next"
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          aria-label="Next photo"
        >
          <CaretRight size={22} weight="bold" />
        </button>

        {/* Pagination Dots */}
        <div className="dest-slideshow__dots">
          {normalizedPhotos.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`dest-slideshow__dot ${idx === currentIndex ? "dest-slideshow__dot--active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="dest-slideshow__thumbs">
        {normalizedPhotos.map((photo, idx) => (
          <button
            key={photo.id || idx}
            type="button"
            className={`dest-slideshow__thumb ${idx === currentIndex ? "dest-slideshow__thumb--active" : ""}`}
            onClick={() => goToSlide(idx)}
            aria-label={`View photo ${idx + 1}: ${photo.alt}`}
          >
            <img src={photo.src} alt={photo.alt} className="dest-slideshow__thumb-img" />
            <span className="dest-slideshow__thumb-tag">{photo.category}</span>
          </button>
        ))}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div className="dest-lightbox" onClick={() => setLightboxOpen(false)}>
          <button
            className="dest-lightbox__close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close full size view"
          >
            <X size={26} weight="bold" />
          </button>
          <div className="dest-lightbox__content" onClick={(e) => e.stopPropagation()}>
            <img src={currentPhoto.src} alt={currentPhoto.alt} className="dest-lightbox__img" />
            <div className="dest-lightbox__caption">
              <strong>{destinationName}</strong> · {currentPhoto.category} ({currentIndex + 1} of {total})
            </div>
            <button
              type="button"
              className="dest-lightbox__arrow dest-lightbox__arrow--prev"
              onClick={goToPrev}
            >
              <CaretLeft size={28} weight="bold" />
            </button>
            <button
              type="button"
              className="dest-lightbox__arrow dest-lightbox__arrow--next"
              onClick={goToNext}
            >
              <CaretRight size={28} weight="bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
