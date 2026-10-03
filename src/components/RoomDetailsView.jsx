import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bed,
  Users,
  CheckCircle,
  XCircle,
  MapPinLine,
  ShieldCheck,
  HouseLine,
  ImageSquare,
  CaretLeft,
  CaretRight,
  Door,
  Sparkle,
  Tag,
} from "phosphor-react";
import { parseAndFormatPrice } from "../utils/priceFormatter.js";
import "./RoomDetailsView.css";

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

function renderFormattedText(text) {
  if (!text) return null;
  const paragraphs = text.split(/\n+/).filter(Boolean);
  return paragraphs.map((para, pIdx) => {
    const parts = para.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={pIdx} className="room-detail__description-text">
        {parts.map((part, idx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={idx}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </p>
    );
  });
}

export default function RoomDetailsView({
  room,
  property,
  allRooms = [],
  onBackToRooms,
  onSelectRoom,
  onBookRoom,
  onOpenLightbox,
  primaryOffer = null,
}) {
  if (!room || !property) return null;

  // Build room-specific gallery strictly belonging to this individual room
  const roomPhotos = useMemo(() => {
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

  const propertyDisplayName = property.name || "Accommodation Property";
  const propertyType = property.type || "Homestay";

  // Filter other room options from the same property
  const otherRooms = useMemo(() => {
    return (allRooms || []).filter((r) => r.id !== room.id);
  }, [allRooms, room.id]);

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

  function handleMainPhotoClick() {
    if (onOpenLightbox && roomPhotos.length > 0) {
      onOpenLightbox(roomPhotos, activePhotoIdx);
    }
  }

  return (
    <article className="room-detail" aria-labelledby="room-detail-heading">
      {/* 1. TOP NAVIGATION & RETURN BUTTON */}
      <div className="room-detail__nav-bar">
        <button
          type="button"
          onClick={onBackToRooms}
          className="room-detail__back-btn"
          aria-label={`Return to complete room list of ${propertyDisplayName}`}
        >
          <span className="room-detail__back-arrow" aria-hidden="true">
            <ArrowLeft size={15} weight="bold" />
          </span>
          <span className="room-detail__back-text">
            Back to All Rooms in {propertyDisplayName}
          </span>
        </button>

        {/* Breadcrumb path */}
        <nav className="room-detail__breadcrumb" aria-label="Breadcrumb">
          <Link to="/hotel-homestay" className="room-detail__crumb-link">
            Stays
          </Link>
          <span className="room-detail__crumb-sep">/</span>
          {property.location && (
            <>
              <Link to={`/hotel-homestay/${encodeURIComponent(property.location)}`} className="room-detail__crumb-link">
                {property.location}
              </Link>
              <span className="room-detail__crumb-sep">/</span>
            </>
          )}
          <button
            type="button"
            onClick={onBackToRooms}
            className="room-detail__crumb-btn"
            title="View complete property"
          >
            {propertyDisplayName}
          </button>
          <span className="room-detail__crumb-sep">→</span>
          <span className="room-detail__crumb-current">{room.name}</span>
        </nav>
      </div>

      {/* 2. PARENT PROPERTY CONTEXT CARD */}
      <section className="room-detail__property-context" aria-label="Parent Property Context">
        <div className="room-detail__property-context-left">
          <div className="room-detail__property-badge-row">
            <span className="room-detail__property-badge">
              <HouseLine size={13} weight="bold" /> Parent Property
            </span>
            <span className="room-detail__property-type-pill">{propertyType}</span>
            {property.location && (
              <span className="room-detail__property-loc-pill">
                <MapPinLine size={13} weight="bold" /> {property.location}, Sikkim
              </span>
            )}
          </div>
          <h2 className="room-detail__property-name">
            {propertyDisplayName}
          </h2>
          <p className="room-detail__property-sub">
            You are viewing an individual room inside this property. All reservations are coordinated directly with the verified local host.
          </p>
        </div>

        <div className="room-detail__property-context-right">
          <button
            type="button"
            onClick={onBackToRooms}
            className="room-detail__view-property-btn"
          >
            View Property Overview &amp; All Rooms &rarr;
          </button>
        </div>
      </section>

      {/* 3. MAIN ROOM SHOWCASE: GALLERY & BOOKING HERO */}
      <div className="room-detail__hero-grid">
        {/* ROOM GALLERY SECTION (Strictly room-specific photos) */}
        <div className="room-detail__gallery-col">
          {currentPhoto ? (
            <div className="room-detail__photo-stage">
              <div
                className="room-detail__photo-frame"
                onClick={handleMainPhotoClick}
                title="Click to view full screen"
              >
                <img
                  src={currentPhoto.src}
                  alt={currentPhoto.alt || room.name}
                  className="room-detail__main-img"
                />

                {/* Photo counter */}
                {roomPhotos.length > 1 && (
                  <span className="room-detail__photo-counter">
                    <ImageSquare size={14} weight="bold" /> {activePhotoIdx + 1} of {roomPhotos.length} photos
                  </span>
                )}

                {/* Left/Right navigation controls for room gallery */}
                {roomPhotos.length > 1 && (
                  <div className="room-detail__gallery-nav">
                    <button
                      type="button"
                      className="room-detail__nav-arrow room-detail__nav-arrow--prev"
                      onClick={handlePrevPhoto}
                      aria-label="Previous room photo"
                    >
                      <CaretLeft size={20} weight="bold" />
                    </button>
                    <button
                      type="button"
                      className="room-detail__nav-arrow room-detail__nav-arrow--next"
                      onClick={handleNextPhoto}
                      aria-label="Next room photo"
                    >
                      <CaretRight size={20} weight="bold" />
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnails row */}
              {roomPhotos.length > 1 && (
                <div className="room-detail__thumb-strip" role="tablist" aria-label="Room photos">
                  {roomPhotos.map((photo, pIdx) => (
                    <button
                      key={photo.id || `thumb_${pIdx}`}
                      type="button"
                      className={`room-detail__thumb-btn ${pIdx === activePhotoIdx ? "room-detail__thumb-btn--active" : ""}`}
                      onClick={() => setActivePhotoIdx(pIdx)}
                      aria-label={`View photo ${pIdx + 1} of ${roomPhotos.length}`}
                    >
                      <img src={photo.src} alt="" className="room-detail__thumb-img" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="room-detail__no-photo-placeholder">
              <Bed size={48} weight="duotone" className="room-detail__placeholder-icon" />
              <h3 className="room-detail__placeholder-title">{room.name}</h3>
              <p className="room-detail__placeholder-desc">
                High-resolution room photography is being prepared by the host. Room amenities and tariffs below are active and verified.
              </p>
            </div>
          )}

          {/* 4. ROOM FEATURES & INCLUSIONS PLACED DIRECTLY BELOW PHOTO BOX */}
          {Array.isArray(room.amenities) && room.amenities.length > 0 && (
            <div className="room-detail__inclusions-wrap">
              <h2 className="room-detail__section-title">Room Features &amp; Inclusions</h2>
              <div className="room-detail__chips">
                {room.amenities.map((amenity, idx) => {
                  const label = typeof amenity === "string" ? amenity : (amenity?.name || "");
                  return (
                    <span key={`rm_amenity_${room.id}_${idx}`} className="room-detail__chip">
                      <span className="room-detail__chip-check" aria-hidden="true">✓</span>
                      <span>{label}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* ROOM-SPECIFIC DESCRIPTION */}
          {room.description && (
            <div className="room-detail__description-wrap">
              <h2 className="room-detail__section-title">About this Room</h2>
              <div className="room-detail__description-content">
                {renderFormattedText(room.description)}
              </div>
            </div>
          )}
        </div>

        {/* ROOM SUMMARY & BOOKING CARD */}
        <aside className="room-detail__booking-sidebar" aria-label="Room Booking Details">
          <div className="room-detail__booking-card">
            {/* Room type & status header */}
            <div className="room-detail__room-meta-row">
              <div className="room-detail__room-type-tag">
                <Door size={14} weight="bold" /> {room.type || "Standard Room"}
              </div>
              <span
                className={`room-detail__status-badge ${
                  isAvailable ? "room-detail__status-badge--available" : "room-detail__status-badge--unavailable"
                }`}
              >
                {isAvailable ? (
                  <>
                    <CheckCircle size={14} weight="fill" /> Available for Booking
                  </>
                ) : (
                  <>
                    <XCircle size={14} weight="fill" /> Currently Unavailable
                  </>
                )}
              </span>
            </div>

            <h1 id="room-detail-heading" className="room-detail__room-title">
              {room.name}
            </h1>

            {/* Capacity highlight */}
            {room.capacity != null && (
              <div className="room-detail__capacity-row">
                <Users size={16} weight="bold" color="var(--color-peach-deep)" />
                <span>
                  Guest Capacity: <strong>Up to {room.capacity} {room.capacity === 1 ? "Guest" : "Guests"}</strong>
                </span>
              </div>
            )}

            {/* Pricing Box */}
            <div className="room-detail__price-box">
              <span className="room-detail__price-kicker">Nightly Room Rate</span>
              {priceInfo ? (
                <div className="room-detail__price-rate">
                  <span className="room-detail__price-currency">{priceInfo.currency}</span>
                  <span className="room-detail__price-amount">{priceInfo.formatted}</span>
                  <span className="room-detail__price-unit">{priceInfo.unit}</span>
                </div>
              ) : (
                <div className="room-detail__price-unpriced">
                  Custom rate on inquiry
                </div>
              )}
              <span className="room-detail__price-note">
                {isAvailable
                  ? "Direct host tariff • No hidden convenience fees"
                  : "Unavailable for immediate reservation"}
              </span>
            </div>

            {/* Applicable Offer Callout */}
            {primaryOffer && (
              <div className="room-detail__offer-callout">
                <div className="room-detail__offer-top">
                  <Tag size={14} weight="fill" color="var(--color-peach-deep)" />
                  <strong>{primaryOffer.badgeText || primaryOffer.discountValue || "Special Promotion"}</strong>
                </div>
                <p className="room-detail__offer-desc">
                  {primaryOffer.title} {primaryOffer.description ? `— ${primaryOffer.description}` : ""}
                </p>
              </div>
            )}

            {/* Main Action Button */}
            <button
              type="button"
              className={`room-detail__book-cta ${!isAvailable ? "room-detail__book-cta--disabled" : ""}`}
              onClick={() => onBookRoom && onBookRoom(room)}
              disabled={!isAvailable}
              aria-label={isAvailable ? `Reserve ${room.name} at ${propertyDisplayName}` : "This room is currently unavailable"}
            >
              {isAvailable ? (
                <>
                  Reserve This Room <ArrowRight size={16} weight="bold" />
                </>
              ) : (
                "Currently Unavailable"
              )}
            </button>

            {/* Host direct guarantees */}
            <div className="room-detail__guarantees">
              <div className="room-detail__guarantee-item">
                <ShieldCheck size={16} weight="fill" color="#16a34a" />
                <span>Verified Lama Bhai Partner Accommodation</span>
              </div>
              <div className="room-detail__guarantee-item">
                <Sparkle size={16} weight="fill" color="var(--color-peach-deep)" />
                <span>Direct coordinate booking with local host family</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 5. OTHER ROOMS AT THIS PROPERTY (Quick-Switcher) */}
      {otherRooms.length > 0 && (
        <section className="room-detail__other-rooms-section">
          <div className="room-detail__other-rooms-header">
            <div>
              <span className="room-detail__other-rooms-kicker">Explore Options</span>
              <h2 className="room-detail__other-rooms-title">
                Other Rooms at {propertyDisplayName}
              </h2>
            </div>
            <button
              type="button"
              onClick={onBackToRooms}
              className="room-detail__other-rooms-back-link"
            >
              View All {allRooms.length} Rooms &rarr;
            </button>
          </div>

          <div className="room-detail__other-rooms-grid">
            {otherRooms.map((otherRoom) => {
              const otherPrice = otherRoom.price ? parseAndFormatPrice(otherRoom.price) : null;
              const otherCover = unwrapImage(otherRoom.image) || (Array.isArray(otherRoom.gallery) && otherRoom.gallery[0] ? unwrapImage(otherRoom.gallery[0]) : "");
              const otherIsAvailable = otherRoom.availability === "available";

              return (
                <div
                  key={otherRoom.id}
                  className={`room-detail__other-card ${!otherIsAvailable ? "room-detail__other-card--unavailable" : ""}`}
                >
                  <div className="room-detail__other-media">
                    {otherCover ? (
                      <img
                        src={otherCover}
                        alt={otherRoom.name}
                        className="room-detail__other-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="room-detail__other-img-placeholder">
                        <Bed size={24} weight="duotone" />
                      </div>
                    )}
                    <span className="room-detail__other-type-badge">
                      {otherRoom.type || "Room"}
                    </span>
                  </div>

                  <div className="room-detail__other-content">
                    <h3 className="room-detail__other-title">{otherRoom.name}</h3>
                    {otherRoom.capacity != null && (
                      <span className="room-detail__other-capacity">
                        <Users size={12} /> Up to {otherRoom.capacity} Guests
                      </span>
                    )}

                    <div className="room-detail__other-bottom">
                      <div className="room-detail__other-price">
                        {otherPrice ? (
                          <strong>{otherPrice.currency}{otherPrice.formatted} {otherPrice.unit}</strong>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>On inquiry</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectRoom && onSelectRoom(otherRoom)}
                        className="room-detail__other-switch-btn"
                        aria-label={`Switch to ${otherRoom.name}`}
                      >
                        View Room &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. BOTTOM RETURN BAR */}
      <div className="room-detail__bottom-bar">
        <button
          type="button"
          onClick={onBackToRooms}
          className="room-detail__bottom-back-btn"
        >
          <ArrowLeft size={16} weight="bold" />
          <span>Return to {propertyDisplayName} Complete Room List</span>
        </button>
      </div>
    </article>
  );
}
