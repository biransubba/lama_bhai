import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPinLine, ArrowRight, Camera, Bed } from "phosphor-react";
import { getAllActiveStays, getActiveLocations } from "../data/staysStore.js";
import { getActiveOffersFor } from "../data/offersStore.js";
import { getAllPropertyPhotoSummaries } from "../utils/stayPhotoStorage.js";
import StayImage from "../components/StayImage.jsx";
import FilterBar from "../components/FilterBar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import OfferBadge from "../components/OfferBadge.jsx";
import { parseAndFormatPrice } from "../utils/priceFormatter.js";
import { api } from "../utils/api.js";
import "./HotelHomestay.css";

const STAY_TYPES = ["Homestay", "Hotel", "Guest House", "Resort"];

export default function HotelHomestay() {
  const [allStays, setAllStays] = useState(() => getAllActiveStays());
  const [stayLocations, setStayLocations] = useState(() => getActiveLocations());

  const [typeFilter, setTypeFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [photoSummaries, setPhotoSummaries] = useState({});

  useEffect(() => {
    function refreshStays() {
      setAllStays(getAllActiveStays());
      setStayLocations(getActiveLocations());
    }

    window.addEventListener("admin-storage-changed", refreshStays);
    window.addEventListener("storage", refreshStays);

    async function loadSummaries() {
      try {
        const map = await getAllPropertyPhotoSummaries();
        setPhotoSummaries(map || {});
      } catch (err) {
        console.warn("Could not load local photo summaries:", err);
      }
    }
    loadSummaries();

    function onPhotoUpdate() {
      loadSummaries();
      refreshStays();
    }
    window.addEventListener("homestay-photos-changed", onPhotoUpdate);
    window.addEventListener("photos-changed", onPhotoUpdate);

    // Live backend synchronization for approved properties
    let isMounted = true;
    api.properties
      .getAll({ status: "approved" })
      .then((res) => {
        if (isMounted && res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const backendStays = res.data.map((p) => ({
            id: p.slug || p._id,
            _id: p._id,
            name: p.title || p.name,
            location: p.location?.town || p.location?.district || "Sikkim",
            district: p.location?.district,
            type: p.type || "Homestay",
            description: p.description,
            price: p.pricing?.displayPrice || (p.pricing?.basePrice ? `₹${p.pricing.basePrice}/night` : "₹2,000/night"),
            rating: p.rating || 0,
            numReviews: p.numReviews || 0,
            image: p.images?.cover || (p.images?.gallery && p.images.gallery[0]) || "",
            amenities: p.amenities || [],
            active: p.active !== false,
            availability: "available",
          }));

          setAllStays((prev) => {
            const existingIds = new Set(backendStays.map((s) => s.id));
            const retainedLocals = prev.filter((s) => !existingIds.has(s.id));
            return [...backendStays, ...retainedLocals];
          });
        }
      })
      .catch((err) => {
        console.warn("[HotelHomestay] Backend stays fetch deferred (offline/local mode):", err.message);
      });

    return () => {
      isMounted = false;
      window.removeEventListener("admin-storage-changed", refreshStays);
      window.removeEventListener("storage", refreshStays);
      window.removeEventListener("homestay-photos-changed", onPhotoUpdate);
      window.removeEventListener("photos-changed", onPhotoUpdate);
    };
  }, []);

  // Filter stays based on selections
  const filteredStays = allStays.filter((stay) => {
    const matchesType = typeFilter === "" || stay.type === typeFilter;
    const matchesLoc = locationFilter === "" || stay.location === locationFilter;
    const matchesAvail = availabilityFilter === "" || stay.availability === availabilityFilter;
    return matchesType && matchesLoc && matchesAvail;
  });

  // Prioritize homestays at the top of the listing
  const sortedStays = [...filteredStays].sort((a, b) => {
    if (a.type === "Homestay" && b.type !== "Homestay") return -1;
    if (a.type !== "Homestay" && b.type === "Homestay") return 1;
    return 0;
  });

  const hasActiveFilters = typeFilter !== "" || locationFilter !== "" || availabilityFilter !== "";

  return (
    <main className="stay-page">
      {/* Hero Banner */}
      <section className="stay-hero">
        <p className="stay-hero__eyebrow">Sikkim, Eastern Himalayas</p>
        <h1 className="stay-hero__heading">Stay closer to the mountains.</h1>
        <p className="stay-hero__sub">
          Authentic village homestays, mountain lodges, and guest houses across Sikkim.
        </p>
      </section>

      {/* Existing Booking Quick Link Banner */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto var(--space-md)",
          padding: "0 var(--space-md)",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--color-border)",
            borderLeft: "4px solid var(--color-peach-deep)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            fontSize: "0.85rem",
          }}
        >
          <span style={{ color: "var(--color-navy)" }}>
            Already booked a stay, cab, or bike with Lama Bhai? Check your request status or cancel anytime.
          </span>
          <Link
            to="/manage-booking"
            style={{
              fontWeight: 700,
              color: "var(--color-peach-deep)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Manage Booking &rarr;
          </Link>
        </div>
      </div>

      {/* Homestay & Stay Directory Section */}
      <section className="stay-directory" aria-labelledby="stay-directory-heading">
        <div className="stay-directory__header">
          <div>
            <h2 id="stay-directory-heading" className="stay-directory__title">
              Featured Homestays &amp; Stays
            </h2>
            <p className="stay-directory__subtitle">
              Browse actual host homestays and mountain properties with dedicated photo galleries organized by location.
            </p>
          </div>
          <span className="stay-directory__count">
            {sortedStays.length} {sortedStays.length === 1 ? "property" : "properties"}
          </span>
        </div>

        {/* Filters */}
        <FilterBar
          filters={[
            {
              label: "Stay Type",
              value: typeFilter,
              onChange: setTypeFilter,
              options: STAY_TYPES,
            },
            {
              label: "Location",
              value: locationFilter,
              onChange: setLocationFilter,
              options: stayLocations,
            },
            {
              label: "Availability",
              value: availabilityFilter,
              onChange: setAvailabilityFilter,
              options: ["available", "unavailable"],
            },
          ]}
          hasActiveFilters={hasActiveFilters}
          onClear={() => {
            setTypeFilter("");
            setLocationFilter("");
            setAvailabilityFilter("");
          }}
        />

        {/* Stays Grid */}
        {sortedStays.length === 0 ? (
          <EmptyState
            message="No stays match your selected filters."
            actionLabel="Reset filters"
            onAction={() => {
              setTypeFilter("");
              setLocationFilter("");
              setAvailabilityFilter("");
            }}
          />
        ) : (
          <div className="homestay-grid">
            {sortedStays.map((stay) => {
              const stayType = stay.type || "Homestay";
              const displayName = stay.name
                ? (stay.name.toLowerCase().includes(stayType.toLowerCase())
                    ? stay.name
                    : `${stay.name}, ${stayType}`)
                : `${stayType} — ${stay.location}`;
              const localSummary = photoSummaries[stay.id];
              const galleryItems = Array.isArray(stay.gallery) ? stay.gallery : [];
              const rawCover =
                localSummary?.coverUrl ||
                stay.image ||
                (galleryItems.length > 0
                  ? (typeof galleryItems[0] === "string"
                      ? galleryItems[0]
                      : galleryItems[0]?.src || galleryItems[0]?.dataUrl)
                  : null);
              const coverSrc = typeof rawCover === "object" && rawCover !== null
                ? (rawCover.dataUrl || rawCover.src || "")
                : rawCover;
              const hasDistinctCover = stay.image && !galleryItems.some((g) => (typeof g === "string" ? g : (g?.src || g?.dataUrl)) === stay.image);
              const photoCount =
                localSummary?.count ??
                (galleryItems.length + (hasDistinctCover ? 1 : (stay.image && galleryItems.length === 0 ? 1 : 0)));
              const stayOffers = getActiveOffersFor("Stay", stay.name || stay.id, stay.type);

              return (
                <article className="homestay-card" key={stay.id}>
                  {/* Clickable Image Container */}
                  <Link
                    to={`/stays/${stay.id}`}
                    className="homestay-card__media-link"
                    aria-label={`View details and photos for ${displayName}`}
                  >
                    <div className="homestay-card__media">
                      <StayImage
                        src={coverSrc}
                        alt={`${displayName} cover photo`}
                        className="homestay-card__image"
                      />
                      <span className={`homestay-card__type-tag ${stay.type === "Homestay" ? "homestay-card__type-tag--homestay" : ""}`}>
                        {stay.type}
                      </span>
                      {photoCount > 0 && (
                        <span className="homestay-card__photos-pill">
                          <Camera size={13} weight="bold" /> {photoCount} {photoCount === 1 ? "Photo" : "Photos"}
                        </span>
                      )}
                      {(stay.roomCount > 0 || (stay.rooms && stay.rooms.length > 0)) && (
                        <span className="homestay-card__rooms-pill">
                          <Bed size={13} weight="bold" /> {stay.roomCount || stay.rooms.length} {((stay.roomCount || stay.rooms.length) === 1) ? "Room" : "Rooms"}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Card Content */}
                  <div className="homestay-card__body">
                    <div className="homestay-card__location-row">
                      <span className="homestay-card__location">
                        <MapPinLine size={15} weight="duotone" /> {stay.location}, Sikkim
                      </span>
                      <span
                        className={`homestay-card__status-pill ${
                          stay.availability === "available"
                            ? "homestay-card__status-pill--available"
                            : "homestay-card__status-pill--unavailable"
                        }`}
                      >
                        {stay.availability === "available" ? "Available" : "Unavailable"}
                      </span>
                    </div>

                    <h3 className="homestay-card__name">
                      <Link to={`/stays/${stay.id}`}>{displayName}</Link>
                    </h3>

                    {stay.description && (
                      <p className="homestay-card__desc">{stay.description}</p>
                    )}

                    {stay.amenities && stay.amenities.length > 0 && (
                      <div className="homestay-card__amenities">
                        {stay.amenities.slice(0, 3).map((amenity, aIdx) => {
                          const label = typeof amenity === "string" ? amenity : (amenity?.name || "");
                          return (
                            <span key={`am_${stay.id}_${aIdx}`} className="homestay-card__amenity-tag">
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <OfferBadge offers={stayOffers} />

                    {/* Card Footer with Price and View Details CTA */}
                    <div className="homestay-card__footer">
                      <div className="homestay-card__pricing">
                        {stay.price && (() => {
                          const pInfo = parseAndFormatPrice(stay.price);
                          if (!pInfo) return null;
                          return (
                            <div className="homestay-card__price-box">
                              <span className="homestay-card__price-kicker">From</span>
                              <div className="homestay-card__price-line">
                                <span className="homestay-card__price-currency">{pInfo.currency}</span>
                                <span className="homestay-card__price-num">{pInfo.formatted}</span>
                                <span className="homestay-card__price-period">{pInfo.unit}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      <Link to={`/stays/${stay.id}`} className="homestay-card__cta-btn">
                        View Details <ArrowRight size={14} weight="bold" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Plan My Trip Cross-Promotion */}
      <section className="stays-plan-cta">
        <p>Planning a complete trip including transport, permits, and village stays across Sikkim?</p>
        <Link to="/plan-trip" className="stays-plan-cta__link">
          Plan My Trip
        </Link>
      </section>
    </main>
  );
}