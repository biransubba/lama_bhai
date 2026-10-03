import React, { useState } from "react";
import {
  Bed,
  Users,
  CheckCircle,
  XCircle,
  ArrowRight,
  ImageSquare,
  CaretLeft,
  CaretRight,
  Sparkle,
} from "phosphor-react";
import { parseAndFormatPrice } from "../utils/priceFormatter.js";
import "./RoomCard.css";

function unwrapImage(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    if (typeof val.dataUrl === "string") return val.dataUrl;
    if (typeof val.src === "string") return val.src;
    if (typeof val.url === "string") return val.url;
  }
  return String(val || "");
}

function renderFormattedInlineText(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function RoomCard({
  room,
  property,
  onViewRoom,
  onSelectRoom,
  onOpenLightbox = null,
}) {
  if (!room) return null;

  // Build separate list of photos belonging exclusively to this room
  const roomPhotos = React.useMemo(() => {
    const list = [];
    const coverUrl = unwrapImage(room.image);
    if (coverUrl) {
      list.push({
        id: `room_${room.id}_cover`,
        src: coverUrl,
        alt: `${room.name} cover photo`,
      });
    }

    if (Array.isArray(room.gallery)) {
      room.gallery.forEach((g, idx) => {
        const src = unwrapImage(typeof g === "string" ? g : g?.src || g?.dataUrl);
        if (src && !list.some((item) => item.src === src)) {
          list.push({
            id: g?.id || `room_${room.id}_gal_${idx}`,
            src,
            alt: g?.alt || `${room.name} photo ${idx + 1}`,
          });
        }
      });
    }

    return list;
  }, [room]);

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const isAvailable = room.availability === "available";
  const priceInfo = room.price ? parseAndFormatPrice(room.price) : null;
  const currentPhoto = roomPhotos[activePhotoIdx] || null;

  function handlePrevPhoto(e) {
    e.stopPropagation();
    if (roomPhotos.length <= 1) return;
    setActivePhotoIdx((prev) => (prev - 1 + roomPhotos.length) % roomPhotos.length);
  }

  function handleNextPhoto(e) {
    e.stopPropagation();
    if (roomPhotos.length <= 1) return;
    setActivePhotoIdx((prev) => (prev + 1) % roomPhotos.length);
  }

  function handleImageClick() {
    if (onViewRoom) {
      onViewRoom(room);
    } else if (onOpenLightbox && roomPhotos.length > 0) {
      onOpenLightbox(roomPhotos, activePhotoIdx);
    }
  }

  return (
    <article className={`room-card ${!isAvailable ? "room-card--unavailable" : ""}`} id={`room-${room.id}`}>
      {/* ROOM GALLERY / PHOTO SECTION (Separate from Property Gallery) */}
      <div className="room-card__media">
        {currentPhoto ? (
          <div className="room-card__image-wrap" onClick={handleImageClick} title={onViewRoom ? `Click to view ${room.name} details` : "Click to view photo"}>
            <img
              src={currentPhoto.src}
              alt={currentPhoto.alt || room.name}
              className="room-card__img"
              loading="lazy"
            />

            {/* Photo count badge */}
            {roomPhotos.length > 1 && (
              <span className="room-card__photo-count" title="Click to view room gallery">
                <ImageSquare size={13} weight="bold" /> {activePhotoIdx + 1}/{roomPhotos.length}
              </span>
            )}

            {/* Navigation arrows for multi-photo rooms */}
            {roomPhotos.length > 1 && (
              <div className="room-card__media-nav">
                <button
                  type="button"
                  className="room-card__nav-btn room-card__nav-btn--prev"
                  onClick={handlePrevPhoto}
                  aria-label="Previous room photo"
                >
                  <CaretLeft size={16} weight="bold" />
                </button>
                <button
                  type="button"
                  className="room-card__nav-btn room-card__nav-btn--next"
                  onClick={handleNextPhoto}
                  aria-label="Next room photo"
                >
                  <CaretRight size={16} weight="bold" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            className="room-card__image-placeholder"
            onClick={onViewRoom ? () => onViewRoom(room) : undefined}
            style={onViewRoom ? { cursor: "pointer" } : {}}
          >
            <Bed size={36} weight="duotone" className="room-card__placeholder-icon" />
            <span className="room-card__placeholder-title">{room.name}</span>
            <span className="room-card__placeholder-sub">Photo coming soon</span>
          </div>
        )}

        {/* Thumbnail strip if room has multiple photos */}
        {roomPhotos.length > 1 && (
          <div className="room-card__thumbs" role="tablist" aria-label="Room photos">
            {roomPhotos.map((photo, pIdx) => (
              <button
                key={photo.id || `thumb_${pIdx}`}
                type="button"
                className={`room-card__thumb-btn ${pIdx === activePhotoIdx ? "room-card__thumb-btn--active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIdx(pIdx);
                }}
                aria-label={`Show photo ${pIdx + 1} of ${roomPhotos.length}`}
              >
                <img src={photo.src} alt="" className="room-card__thumb-img" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ROOM DETAILS SECTION */}
      <div className="room-card__content">
        <div className="room-card__header-row">
          <div className="room-card__title-group">
            <div className="room-card__badge-row">
              {room.type && (
                <span className="room-card__type-badge">
                  {room.type}
                </span>
              )}
              <span className={`room-card__status-badge ${isAvailable ? "room-card__status-badge--available" : "room-card__status-badge--unavailable"}`}>
                {isAvailable ? (
                  <>
                    <CheckCircle size={13} weight="fill" /> Available
                  </>
                ) : (
                  <>
                    <XCircle size={13} weight="fill" /> Unavailable
                  </>
                )}
              </span>
            </div>

            <h3 className="room-card__title">
              {onViewRoom ? (
                <button
                  type="button"
                  className="room-card__title-btn"
                  onClick={() => onViewRoom(room)}
                  title={`View full details for ${room.name}`}
                >
                  {room.name}
                </button>
              ) : (
                room.name
              )}
            </h3>
          </div>

          {/* Capacity badge */}
          {room.capacity != null && (
            <div className="room-card__capacity-tag">
              <Users size={14} weight="bold" />
              <span>Up to {room.capacity} {room.capacity === 1 ? "Guest" : "Guests"}</span>
            </div>
          )}
        </div>

        {/* Room Description */}
        {room.description && (
          <p className="room-card__description">{renderFormattedInlineText(room.description)}</p>
        )}

        {/* Room-Specific Amenities */}
        {Array.isArray(room.amenities) && room.amenities.length > 0 && (
          <div className="room-card__amenities-box">
            <span className="room-card__amenities-label">Room Features &amp; Inclusions:</span>
            <div className="room-card__amenities-chips">
              {room.amenities.map((amenity, aIdx) => (
                <span key={`room_amenity_${room.id}_${aIdx}`} className="room-card__amenity-chip">
                  ✓ {typeof amenity === "string" ? amenity : (amenity?.name || "")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ROOM TARIFF & ACTION SECTION */}
      <div className="room-card__pricing-action">
        <div className="room-card__tariff-box">
          <span className="room-card__tariff-kicker">Room Tariff</span>
          {priceInfo ? (
            <div className="room-card__tariff-rate">
              <span className="room-card__currency">{priceInfo.currency}</span>
              <span className="room-card__amount">{priceInfo.formatted}</span>
              <span className="room-card__unit">{priceInfo.unit}</span>
            </div>
          ) : (
            <div className="room-card__tariff-unpriced">
              Custom rate on inquiry
            </div>
          )}
          <span className="room-card__tariff-caption">
            {isAvailable ? "Direct host rate • No surge pricing" : "Currently blocked for selected dates"}
          </span>
        </div>

        <div className="room-card__actions">
          {onViewRoom && (
            <button
              type="button"
              className="room-card__cta-secondary"
              onClick={() => onViewRoom(room)}
              aria-label={`View full room details for ${room.name}`}
            >
              View Room &rarr;
            </button>
          )}

          <button
            type="button"
            className={`room-card__cta ${!isAvailable ? "room-card__cta--disabled" : ""}`}
            onClick={() => onSelectRoom && onSelectRoom(room)}
            disabled={!isAvailable}
            aria-label={isAvailable ? `Reserve ${room.name}` : `${room.name} is currently unavailable`}
          >
            {isAvailable ? (
              <>
                Reserve <ArrowRight size={14} weight="bold" />
              </>
            ) : (
              "Unavailable"
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
