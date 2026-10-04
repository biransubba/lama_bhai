import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPinLine, ArrowRight, Camera, Bed } from "phosphor-react";
import { getActiveOffersFor } from "../data/offersStore.js";
import StayImage from "../components/StayImage.jsx";
import FilterBar from "../components/FilterBar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import OfferBadge from "../components/OfferBadge.jsx";
import { parseAndFormatPrice } from "../utils/priceFormatter.js";
import { api } from "../utils/api.js";
import "./HotelHomestay.css";

const STAY_TYPES = ["Homestay", "Hotel", "Guest House", "Resort"];

export default function HotelHomestay() {
  const [allStays, setAllStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [typeFilter, setTypeFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");

  const fetchApprovedStays = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.properties.getAll({ limit: 100 });
      if (res && res.success && Array.isArray(res.data)) {
        const mapped = res.data.map((p) => {
          const coverUrl =
            p.images?.cover ||
            (Array.isArray(p.images?.gallery) && (p.images.gallery[0]?.url || p.images.gallery[0])) ||
            "";
          const galleryUrls = Array.isArray(p.images?.gallery)
            ? p.images.gallery.map((g) => (typeof g === "string" ? g : g?.url)).filter(Boolean)
            : [];
          const distinctGallery = galleryUrls.filter((u) => u !== coverUrl);
          const photoCount = (coverUrl ? 1 : 0) + distinctGallery.length;
          const roomCount = Array.isArray(p.rooms) ? p.rooms.length : (p.roomCount || 0);

          let priceStr = "";
          if (p.pricing?.displayPrice) {
            priceStr = p.pricing.displayPrice;
          } else if (p.pricing?.basePrice) {
            priceStr = `₹${p.pricing.basePrice.toLocaleString("en-IN")}/night`;
          } else if (p.price) {
            priceStr = String(p.price);
          }

          const locationTown = p.location?.town || p.location?.district || "Sikkim";

          return {
            id: p._id,
            _id: p._id,
            slug: p.slug,
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
            photoCount,
            roomCount,
            amenities: p.amenities || [],
            availability: p.availability || "available",
            active: p.active !== false,
          };
        });
        setAllStays(mapped);
      } else {
        setAllStays([]);
      }
    } catch (err) {
      console.error("[HotelHomestay] Failed to fetch stays from backend:", err);
      setError("Unable to load stays right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovedStays();

    function onAdminChange() {
      fetchApprovedStays();
    }
    window.addEventListener("admin-storage-changed", onAdminChange);
    window.addEventListener("storage", onAdminChange);

    return () => {
      window.removeEventListener("admin-storage-changed", onAdminChange);
      window.removeEventListener("storage", onAdminChange);
    };
  }, [fetchApprovedStays]);

  // Dynamic location list derived strictly from backend approved properties
  const stayLocations = useMemo(() => {
    const locSet = new Set();
    allStays.forEach((s) => {
      if (s.location) locSet.add(s.location);
    });
    return Array.from(locSet).sort();
  }, [allStays]);

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
            {loading ? "Loading stays..." : `${sortedStays.length} ${sortedStays.length === 1 ? "property" : "properties"}`}
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

        {/* Stays Grid with Loading, Error, Empty, and Active States */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ fontSize: "1.05rem", color: "var(--color-navy)", fontWeight: 600 }}>
              Loading verified Sikkim stays...
            </p>
          </div>
        ) : error ? (
          <EmptyState
            message={error}
            actionLabel="Try Again"
            onAction={fetchApprovedStays}
          />
        ) : sortedStays.length === 0 ? (
          <EmptyState
            message={
              hasActiveFilters
                ? "No stays match your selected filters."
                : "No stays available at the moment."
            }
            actionLabel={hasActiveFilters ? "Reset filters" : undefined}
            onAction={
              hasActiveFilters
                ? () => {
                    setTypeFilter("");
                    setLocationFilter("");
                    setAvailabilityFilter("");
                  }
                : undefined
            }
          />
        ) : (
          <div className="homestay-grid">
            {sortedStays.map((stay) => {
              const stayType = stay.type || "Homestay";
              const displayName = stay.name
                ? stay.name.toLowerCase().includes(stayType.toLowerCase())
                  ? stay.name
                  : `${stay.name}, ${stayType}`
                : `${stayType} — ${stay.location}`;
              const coverSrc = stay.image;
              const photoCount = stay.photoCount;
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
                      <span
                        className={`homestay-card__type-tag ${
                          stay.type === "Homestay" ? "homestay-card__type-tag--homestay" : ""
                        }`}
                      >
                        {stay.type}
                      </span>
                      {photoCount > 0 && (
                        <span className="homestay-card__photos-pill">
                          <Camera size={13} weight="bold" /> {photoCount}{" "}
                          {photoCount === 1 ? "Photo" : "Photos"}
                        </span>
                      )}
                      {(stay.roomCount > 0 || (stay.rooms && stay.rooms.length > 0)) && (
                        <span className="homestay-card__rooms-pill">
                          <Bed size={13} weight="bold" />{" "}
                          {stay.roomCount || stay.rooms.length}{" "}
                          {(stay.roomCount || stay.rooms.length) === 1 ? "Room" : "Rooms"}
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
                          const label =
                            typeof amenity === "string" ? amenity : amenity?.name || "";
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
                        {stay.price &&
                          (() => {
                            const pInfo = parseAndFormatPrice(stay.price);
                            if (!pInfo) return null;
                            return (
                              <div className="homestay-card__price-box">
                                <span className="homestay-card__price-kicker">From</span>
                                <div className="homestay-card__price-line">
                                  <span className="homestay-card__price-currency">
                                    {pInfo.currency}
                                  </span>
                                  <span className="homestay-card__price-num">
                                    {pInfo.formatted}
                                  </span>
                                  <span className="homestay-card__price-period">
                                    {pInfo.unit}
                                  </span>
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