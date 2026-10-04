import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPinLine,
  ArrowRight,
  Sparkle,
  Tag,
  Gift,
  CheckCircle,
  Clock,
  ShieldCheck,
  Bed,
  Users,
} from "phosphor-react";
import StaySlideshow from "../components/StaySlideshow.jsx";
import RoomCard from "../components/RoomCard.jsx";
import RoomDetailsView from "../components/RoomDetailsView.jsx";
import BookingForm from "../components/BookingForm.jsx";
import Lightbox from "../components/Lightbox.jsx";
import { parseAndFormatPrice } from "../utils/priceFormatter.js";
import { getActiveOffersFor } from "../data/offersStore.js";
import OfferBadge from "../components/OfferBadge.jsx";
import { api } from "../utils/api.js";
import "./StayDetails.css";

export default function StayDetails() {
  const { id, roomId: routeRoomId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [stay, setStay] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [roomNotFound, setRoomNotFound] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomLightbox, setRoomLightbox] = useState(null);

  const fetchPropertyData = useCallback(async () => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setNotFound(false);
      setRoomNotFound(false);

      const res = await api.properties.getBySlug(id);
      if (!res || !res.success || !res.data) {
        setNotFound(true);
        setStay(null);
        setRooms([]);
        return;
      }

      const p = res.data;

      // Ensure property is approved and active for public viewing
      if (p.status !== "approved" || p.active === false) {
        setNotFound(true);
        setStay(null);
        setRooms([]);
        return;
      }

      const coverUrl =
        p.images?.cover ||
        (Array.isArray(p.images?.gallery) && (p.images.gallery[0]?.url || p.images.gallery[0])) ||
        "";
      const galleryUrls = Array.isArray(p.images?.gallery)
        ? p.images.gallery.map((g) => (typeof g === "string" ? g : g?.url)).filter(Boolean)
        : [];
      const locationTown = p.location?.town || p.location?.district || "Sikkim";

      let priceStr = "";
      if (p.pricing?.displayPrice) {
        priceStr = p.pricing.displayPrice;
      } else if (p.pricing?.basePrice) {
        priceStr = `₹${p.pricing.basePrice.toLocaleString("en-IN")}/night`;
      } else if (p.price) {
        priceStr = String(p.price);
      }

      const normalizedProperty = {
        id: p._id,
        _id: p._id,
        slug: p.slug,
        partnerId: p.owner?._id || p.owner,
        name: p.name || p.title,
        type: p.type || "Homestay",
        location: locationTown,
        district: p.location?.district || "",
        description: p.description || "",
        price: priceStr,
        rating: p.rating || 0,
        numReviews: p.numReviews || 0,
        image: coverUrl,
        gallery: galleryUrls,
        amenities: p.amenities || [],
        availability: p.availability || "available",
        active: p.active !== false,
        offers: p.offers || [],
      };

      // Extract populated active rooms
      let parsedRooms = [];
      const rawRooms = Array.isArray(p.rooms) ? p.rooms : [];
      if (rawRooms.length > 0) {
        parsedRooms = rawRooms
          .filter((r) => r && r.active !== false)
          .map((r) => {
            let rPriceStr = "";
            if (typeof r.price === "number") {
              rPriceStr = `₹${r.price.toLocaleString("en-IN")}/night`;
            } else if (r.price) {
              rPriceStr = String(r.price);
            }
            const rCover =
              r.image ||
              (Array.isArray(r.gallery) && (r.gallery[0]?.url || r.gallery[0])) ||
              "";
            const rGallery = Array.isArray(r.gallery)
              ? r.gallery.map((g) => (typeof g === "string" ? g : g?.url || g?.src || g)).filter(Boolean)
              : [];

            return {
              id: r._id,
              _id: r._id,
              propertyId: p._id,
              name: r.name,
              type: r.type || "Standard Room",
              description: r.description || "",
              capacity: r.capacity || 2,
              bedConfiguration: r.bedConfiguration || "",
              price: rPriceStr,
              amenities: r.amenities || [],
              image: rCover,
              gallery: rGallery,
              availability: r.availability === "maintenance" ? "unavailable" : (r.availability || "available"),
              active: r.active !== false,
            };
          });
      } else {
        // Fallback: fetch room inventory endpoint if rooms array was unpopulated
        try {
          const roomsRes = await api.properties.getRooms(p._id);
          if (roomsRes && roomsRes.success && Array.isArray(roomsRes.data)) {
            parsedRooms = roomsRes.data
              .filter((r) => r && r.active !== false)
              .map((r) => {
                let rPriceStr = "";
                if (typeof r.price === "number") {
                  rPriceStr = `₹${r.price.toLocaleString("en-IN")}/night`;
                } else if (r.price) {
                  rPriceStr = String(r.price);
                }
                const rCover =
                  r.image ||
                  (Array.isArray(r.gallery) && (r.gallery[0]?.url || r.gallery[0])) ||
                  "";
                const rGallery = Array.isArray(r.gallery)
                  ? r.gallery.map((g) => (typeof g === "string" ? g : g?.url || g?.src || g)).filter(Boolean)
                  : [];

                return {
                  id: r._id,
                  _id: r._id,
                  propertyId: p._id,
                  name: r.name,
                  type: r.type || "Standard Room",
                  description: r.description || "",
                  capacity: r.capacity || 2,
                  bedConfiguration: r.bedConfiguration || "",
                  price: rPriceStr,
                  amenities: r.amenities || [],
                  image: rCover,
                  gallery: rGallery,
                  availability: r.availability === "maintenance" ? "unavailable" : (r.availability || "available"),
                  active: r.active !== false,
                };
              });
          }
        } catch (fetchRoomsErr) {
          console.warn("[StayDetails] Could not fetch property rooms:", fetchRoomsErr);
        }
      }

      setStay(normalizedProperty);
      setRooms(parsedRooms);

      // Validate routeRoomId ownership if path /stays/:id/rooms/:roomId is accessed
      if (routeRoomId) {
        const found = parsedRooms.find((r) => r.id === routeRoomId || r._id === routeRoomId);
        if (!found) {
          setRoomNotFound(true);
        }
      }
    } catch (err) {
      console.error("[StayDetails] Error fetching property details:", err);
      setNotFound(true);
      setStay(null);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [id, routeRoomId]);

  useEffect(() => {
    fetchPropertyData();

    function onAdminChange() {
      fetchPropertyData();
    }
    window.addEventListener("admin-storage-changed", onAdminChange);
    window.addEventListener("storage", onAdminChange);

    return () => {
      window.removeEventListener("admin-storage-changed", onAdminChange);
      window.removeEventListener("storage", onAdminChange);
    };
  }, [fetchPropertyData]);

  // Active room determination from URL path (:roomId) or query param (?room=...)
  const queryRoomId = searchParams.get("room");
  const targetRoomId = routeRoomId || queryRoomId || null;
  const activeRoom = targetRoomId
    ? rooms.find((r) => r.id === targetRoomId || r._id === targetRoomId) || null
    : null;

  if (loading) {
    return (
      <main className="stay-detail" style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "1.1rem", color: "var(--color-navy)", fontWeight: 600 }}>Loading stay details...</p>
      </main>
    );
  }

  if (notFound || !stay) {
    return (
      <main className="stay-detail stay-detail--notfound">
        <h1>Stay not found</h1>
        <p>We couldn't find that Sikkim stay or homestay.</p>
        <Link to="/hotel-homestay" className="stay-detail__back" aria-label="Back to Homestays and Stays">
          <span className="stay-detail__back-arrow" aria-hidden="true">
            <ArrowLeft size={14} weight="bold" />
          </span>
          <span className="stay-detail__back-text">Back to Homestays &amp; Stays</span>
        </Link>
      </main>
    );
  }

  if (roomNotFound) {
    return (
      <main className="stay-detail stay-detail--notfound">
        <h1>Room not found</h1>
        <p>This room does not exist or does not belong to this property.</p>
        <Link to={`/stays/${stay.id}`} className="stay-detail__back" aria-label="Back to Property Details">
          <span className="stay-detail__back-arrow" aria-hidden="true">
            <ArrowLeft size={14} weight="bold" />
          </span>
          <span className="stay-detail__back-text">Back to {stay.name}</span>
        </Link>
      </main>
    );
  }

  const stayType = stay.type || "Homestay";
  const displayName = stay.name
    ? (stay.name.toLowerCase().includes(stayType.toLowerCase())
        ? stay.name
        : `${stay.name}, ${stayType}`)
    : `${stayType} — ${stay.location}`;

  const stayOffers = stay ? getActiveOffersFor("Stay", stay.name || stay.id, stay.type) : [];
  const primaryOffer = stayOffers[0] || null;

  // Calculate room availability metrics
  const availableRoomCount = rooms.filter((r) => r.availability === "available").length;
  const isOverallAvailable = stay.availability === "available" && (rooms.length === 0 || availableRoomCount > 0);

  // Determine hero pricing based on available room tariffs or property base rate
  const roomRates = rooms
    .map((r) => (r.price ? parseAndFormatPrice(r.price) : null))
    .filter(Boolean);

  const lowestRate = roomRates.length > 0
    ? roomRates.reduce((min, cur) => (cur.numeric < min.numeric ? cur : min), roomRates[0])
    : (stay.price ? parseAndFormatPrice(stay.price) : null);

  // Booking Context: adapts whether a specific room is selected, room view is active, or general property booking is chosen
  const roomToBook = selectedRoom || activeRoom;
  const activeTariff = roomToBook?.price || stay.price;
  const formattedTariff = activeTariff ? parseAndFormatPrice(activeTariff) : null;

  const bookingContext = {
    service: "Stay",
    inventoryId: roomToBook?.id || stay.id,
    propertyId: stay.id,
    roomId: roomToBook?.id || null,
    partnerId: stay.partnerId || null,
    propertyName: displayName,
    roomName: roomToBook?.name || null,
    availableRooms: rooms,
    title: roomToBook ? `${displayName} — ${roomToBook.name}` : displayName,
    appliedOffer: primaryOffer,
    details: [
      { label: "Property", value: displayName },
      { label: "Room", value: roomToBook ? `${roomToBook.name} (${roomToBook.type || 'Standard Room'})` : "Entire Property / General Stay" },
      ...(roomToBook
        ? [
            { label: "Selected Room", value: `${roomToBook.name} (${roomToBook.type || 'Standard Room'})` },
          ]
        : []),
      { label: "Location", value: `${stay.location}, Sikkim` },
      { label: "Property Type", value: stay.type },
      ...(formattedTariff
        ? [{ label: "Nightly Tariff", value: `${formattedTariff.currency}${formattedTariff.formatted} ${formattedTariff.unit}` }]
        : (activeTariff ? [{ label: "Nightly Tariff", value: String(activeTariff) }] : [])),
      ...(roomToBook?.capacity
        ? [{ label: "Room Capacity", value: `Up to ${roomToBook.capacity} guests` }]
        : []),
      ...(primaryOffer ? [{ label: "Claimed Deal", value: `${primaryOffer.title} (${primaryOffer.badgeText || primaryOffer.discountValue || ''})` }] : []),
    ],
  };

  function handleViewRoom(room) {
    if (routeRoomId) {
      navigate(`/stays/${id}/rooms/${room.id}`);
    } else {
      setSearchParams({ room: room.id });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBackToRooms() {
    if (routeRoomId) {
      navigate(`/stays/${id}`);
    } else {
      setSearchParams({});
    }
    setTimeout(() => {
      const roomsEl = document.getElementById("rooms");
      if (roomsEl) {
        roomsEl.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
  }

  function handleSelectRoom(room) {
    setSelectedRoom(room);
    setShowForm(true);
  }

  function handleBookProperty() {
    setSelectedRoom(null);
    setShowForm(true);
  }

  function handleHeroAction() {
    if (rooms.length > 0) {
      const roomsSection = document.getElementById("rooms");
      if (roomsSection) {
        roomsSection.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    handleBookProperty();
  }

  function handleOpenRoomLightbox(photosList, startIndex = 0) {
    setRoomLightbox({
      photos: photosList,
      index: startIndex,
    });
  }

  return (
    <main className="stay-detail">
      {activeRoom ? (
        <RoomDetailsView
          room={activeRoom}
          property={stay}
          allRooms={rooms}
          onBackToRooms={handleBackToRooms}
          onSelectRoom={handleViewRoom}
          onBookRoom={handleSelectRoom}
          onOpenLightbox={handleOpenRoomLightbox}
          primaryOffer={primaryOffer}
        />
      ) : (
        <>
          <Link to="/hotel-homestay" className="stay-detail__back" aria-label="Back to all Homestays and Stays">
            <span className="stay-detail__back-arrow" aria-hidden="true">
              <ArrowLeft size={14} weight="bold" />
            </span>
            <span className="stay-detail__back-text">Back to all Homestays &amp; Stays</span>
          </Link>

          {/* 1. PROPERTY COVER IMAGE & SLIDESHOW GALLERY */}
          <StaySlideshow
            photos={stay.gallery}
            coverImage={stay.image}
            stayName={displayName}
            location={stay.location}
          />

          {/* 2. PROPERTY INFORMATION HEADER */}
          <div className="stay-detail__header">
            <div className="stay-detail__type-row" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span className="stay-detail__type">{stay.type}</span>
              <OfferBadge offers={stayOffers} />
            </div>
            <h1>{displayName}</h1>
            <div className="stay-detail__meta-row">
              <p className="stay-detail__location">
                <MapPinLine size={16} /> {stay.location}, Sikkim
              </p>
              <span className={isOverallAvailable ? "stay-detail__status--available" : "stay-detail__status--unavailable"}>
                {isOverallAvailable
                  ? (rooms.length > 0
                      ? `Available for booking • ${availableRoomCount} of ${rooms.length} room options open`
                      : "Available for booking")
                  : "Currently unavailable"}
              </span>
            </div>

            {/* Unified Booking Hero Card in prime header zone */}
            <div className="stay-detail__booking-hero">
              <div className="stay-detail__booking-hero-pricing">
                {lowestRate ? (
                  <>
                    <div className="stay-detail__booking-hero-header">
                      <span className="stay-detail__booking-hero-kicker">
                        {rooms.length > 1 ? "Starting Rate" : "Nightly Tariff"}
                      </span>
                      <span className="stay-detail__booking-hero-badge">Verified Local Rate</span>
                    </div>
                    <div className="stay-detail__booking-hero-rate">
                      <span className="stay-detail__booking-hero-currency">{lowestRate.currency}</span>
                      <span className="stay-detail__booking-hero-num">{lowestRate.formatted}</span>
                      <span className="stay-detail__booking-hero-unit">{lowestRate.unit}</span>
                    </div>
                    <p className="stay-detail__booking-hero-caption">
                      {rooms.length > 1
                        ? `Direct host pricing across ${rooms.length} room options • No surge pricing`
                        : "Direct host pricing • Transparent rates with no surge pricing"}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="stay-detail__booking-hero-header">
                      <span className="stay-detail__booking-hero-kicker">Reservation Inquiry</span>
                      <span className="stay-detail__booking-hero-badge">Host Direct</span>
                    </div>
                    <div className="stay-detail__booking-hero-rate">
                      <span className="stay-detail__booking-hero-unpriced">Custom rates on inquiry</span>
                    </div>
                    <p className="stay-detail__booking-hero-caption">
                      Submit inquiry to coordinate room options and dates with host
                    </p>
                  </>
                )}

                {/* High-Impact Hero Offer Callout */}
                {primaryOffer && (
                  <div className="stay-detail__hero-offer-banner">
                    <div className="stay-detail__hero-offer-top">
                      <span className="stay-detail__hero-offer-pill">
                        <Tag size={12} weight="fill" /> {primaryOffer.badgeText || primaryOffer.discountValue || "Special Offer"}
                      </span>
                      <strong className="stay-detail__hero-offer-name">{primaryOffer.title}</strong>
                    </div>
                    {primaryOffer.description && (
                      <div className="stay-detail__hero-offer-condition">
                        ✓ {primaryOffer.description}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="stay-detail__booking-hero-action">
                <button
                  className="stay-detail__cta"
                  onClick={handleHeroAction}
                  disabled={!isOverallAvailable}
                >
                  {isOverallAvailable ? (
                    rooms.length > 1 ? (
                      <>View Rooms &amp; Book <ArrowRight size={16} weight="bold" /></>
                    ) : (
                      <>Book Now <ArrowRight size={16} weight="bold" /></>
                    )
                  ) : (
                    "Currently unavailable"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 3. PROPERTY DESCRIPTION */}
          {stay.description && (
            <section className="stay-detail__section">
              <h2>About this {stay.type.toLowerCase()}</h2>
              <p>{stay.description}</p>
            </section>
          )}

          {/* 4. PROPERTY-LEVEL AMENITIES & FEATURES */}
          {stay.amenities && stay.amenities.length > 0 && (
            <section className="stay-detail__section">
              <h2>Property Amenities &amp; Features</h2>
              <div className="stay-detail__chips">
                {stay.amenities.map((a, idx) => {
                  const label = typeof a === "string" ? a : (a?.name || "");
                  return (
                    <span key={`amenity_${stay.id}_${idx}`} className="stay-detail__chip">
                      {label}
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          {/* 5. AVAILABLE ROOMS / ROOM OPTIONS SECTION */}
          <section className="stay-detail__section stay-detail__rooms-section" id="rooms">
            <div className="stay-rooms__header">
              <div className="stay-rooms__header-text">
                <span className="stay-rooms__kicker">Accommodation Options</span>
                <h2 className="stay-rooms__title">Available Rooms &amp; Suites</h2>
                <p className="stay-rooms__subtitle">
                  Browse room options for <strong>{displayName}</strong>. Each room can be individually inspected with verified host rates and private gallery.
                </p>
              </div>

              <div className="stay-rooms__stats">
                <span className="stay-rooms__stat-badge">
                  <Bed size={15} weight="bold" />
                  {rooms.length} {rooms.length === 1 ? "Room Option" : "Room Options"}
                </span>
                {availableRoomCount > 0 ? (
                  <span className="stay-rooms__stat-badge stay-rooms__stat-badge--available">
                    <CheckCircle size={15} weight="fill" />
                    {availableRoomCount} Available
                  </span>
                ) : (
                  <span className="stay-rooms__stat-badge stay-rooms__stat-badge--unavailable">
                    Fully Booked
                  </span>
                )}
              </div>
            </div>

            {/* Dynamic Rooms List or Graceful Empty State */}
            {rooms.length === 0 ? (
              <div className="stay-rooms__empty">
                <div className="stay-rooms__empty-icon-wrap">
                  <Bed size={32} weight="duotone" />
                </div>
                <h3 className="stay-rooms__empty-title">No rooms currently listed</h3>
                <p className="stay-rooms__empty-text">
                  The host is updating room listings for this property. You can still submit a general reservation inquiry to coordinate room availability and booking dates.
                </p>
                <button
                  type="button"
                  className="stay-rooms__empty-cta"
                  onClick={handleBookProperty}
                >
                  Inquire About Property &rarr;
                </button>
              </div>
            ) : (
              <div className="stay-rooms__list">
                {rooms.map((room, idx) => (
                  <RoomCard
                    key={room.id || `room_${stay.id}_${idx}`}
                    room={room}
                    property={stay}
                    onViewRoom={handleViewRoom}
                    onSelectRoom={handleSelectRoom}
                    onOpenLightbox={handleOpenRoomLightbox}
                  />
                ))}
              </div>
            )}
          </section>

          {/* 6. OFFERS & SPECIAL PACKAGES */}
          {((stay.offers && stay.offers.length > 0) || stayOffers.length > 0) && (
            <section className="stay-detail__section stay-detail__offers-section">
              <div className="stay-detail__section-header">
                <h2>Offers &amp; Special Packages</h2>
                <span className="stay-detail__section-tag">Direct Host Savings</span>
              </div>

              {stayOffers.length > 0 ? (
                <div className="stay-offers-showcase">
                  {stayOffers.map((o) => (
                    <div className="stay-offer-card" key={o.id}>
                      <div className="stay-offer-card__header">
                        <div className="stay-offer-card__badge-row">
                          <span className="stay-offer-card__badge">
                            <Tag size={15} weight="fill" /> {o.badgeText || o.discountValue || "Exclusive Deal"}
                          </span>
                          <span className="stay-offer-card__guarantee">
                            <ShieldCheck size={14} weight="fill" /> Host Verified Benefit
                          </span>
                        </div>
                        <h3 className="stay-offer-card__title">{o.title}</h3>
                      </div>

                      <div className="stay-offer-card__body">
                        {o.discountValue && (
                          <div className="stay-offer-card__highlight-box">
                            <Gift size={20} weight="fill" color="var(--color-peach-deep)" />
                            <div>
                              <span className="stay-offer-card__highlight-sub">Included Promotion</span>
                              <strong className="stay-offer-card__highlight-main">{o.discountValue}</strong>
                            </div>
                          </div>
                        )}

                        {o.description && (
                          <div className="stay-offer-card__terms-box">
                            <div className="stay-offer-card__terms-header">
                              <CheckCircle size={17} weight="fill" color="#16a34a" />
                              <strong>Condition to Avail:</strong>
                            </div>
                            <p className="stay-offer-card__terms-text">{o.description}</p>
                          </div>
                        )}

                        {(o.startDate || o.endDate) && (
                          <div className="stay-offer-card__validity">
                            <Clock size={15} weight="bold" />
                            <span>
                              Valid from <strong>{o.startDate || "Immediate"}</strong> through <strong>{o.endDate || "Ongoing"}</strong>
                            </span>
                          </div>
                        )}

                        <div className="stay-offer-card__reassurance">
                          <Sparkle size={15} weight="fill" color="var(--color-peach-deep)" style={{ flexShrink: 0, marginTop: 1 }} />
                          <span>No promo code required. Automatically applied to your booking above.</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="stay-detail__chips">
                  {(stay.offers || []).map((o, idx) => {
                    const label = typeof o === "string" ? o : (o?.title || o?.name || "");
                    return (
                      <span key={`offer_${stay.id}_${idx}`} className="stay-detail__chip stay-detail__chip--offer">
                        🏷️ {label}
                      </span>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* 7. MANAGE BOOKING / CANCELLATION LINK */}
          <div className="stay-detail__bottom-actions">
            <div className="stay-detail__manage-link-wrap">
              <Link
                to="/manage-booking"
                className="stay-detail__manage-link"
              >
                Already booked this stay? <strong>Manage / Cancel Booking &rarr;</strong>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* 8. BOOKING FORM MODAL */}
      {showForm && (
        <BookingForm
          context={bookingContext}
          onClose={() => {
            setShowForm(false);
            setSelectedRoom(null);
          }}
        />
      )}

      {/* 9. ROOM PHOTO LIGHTBOX (Strictly for Room Gallery) */}
      {roomLightbox && (
        <Lightbox
          images={roomLightbox.photos}
          index={roomLightbox.index}
          onClose={() => setRoomLightbox(null)}
          onPrev={() =>
            setRoomLightbox((prev) => ({
              ...prev,
              index: (prev.index - 1 + prev.photos.length) % prev.photos.length,
            }))
          }
          onNext={() =>
            setRoomLightbox((prev) => ({
              ...prev,
              index: (prev.index + 1) % prev.photos.length,
            }))
          }
        />
      )}
    </main>
  );
}