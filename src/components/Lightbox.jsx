import React, { useEffect } from "react";
import { X, ArrowLeft, ArrowRight } from "phosphor-react";
import "./Lightbox.css";

export default function Lightbox({ images, index, onClose, onPrev, onNext }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext]);

  if (index === null) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
      <button className="lightbox__close" onClick={onClose} aria-label="Close image viewer">
        <X size={26} weight="bold" />
      </button>

      {images.length > 1 && (
        <button className="lightbox__nav lightbox__nav--prev" onClick={onPrev} aria-label="Previous image">
          <ArrowLeft size={22} weight="bold" />
        </button>
      )}

      <img
        src={images[index].src}
        alt={images[index].alt}
        className="lightbox__image"
      />

      {images.length > 1 && (
        <button className="lightbox__nav lightbox__nav--next" onClick={onNext} aria-label="Next image">
          <ArrowRight size={22} weight="bold" />
        </button>
      )}

      <div className="lightbox__backdrop" onClick={onClose} />
    </div>
  );
}