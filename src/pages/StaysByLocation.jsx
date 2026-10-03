import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPinLine, Camera, ArrowRight, Bed } from "phosphor-react";
import { getPropertiesByLocation, locationEverExisted, getActiveLocations } from "../data/staysStore.js";
import { getActiveOffersFor } from "../data/offersStore.js";
import { getAllPropertyPhotoSummaries } from "../utils/stayPhotoStorage.js";
import StayImage from "../components/StayImage.jsx";
import EmptyState from "../components/EmptyState.jsx";
import FilterBar from "../components/FilterBar.jsx";
import OfferBadge from "../components/OfferBadge.jsx";
import { parseAndFormatPrice } from "../utils/priceFormatter.js";
import "./StaysByLocation.css";

const STAY_TYPES = ["Homestay", "Hotel", "Guest House", "Resort"];

export default function StaysByLocation() {
  const { location } = useParams();
  const decodedLocation = decodeURIComponent(location);
  const [isValidLocation, setIsValidLocation] = useState(() => locationEverExisted(decodedLocation));
  const [allProperties, setAllProperties] = useState(() =>
    locationEverExisted(decodedLocation) ? getPropertiesByLocation(decodedLocation) : []
  );
  const [allLocations, setAllLocations] = useState(() => getActiveLocations());

  const [typeFilter, setTypeFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [photoSummaries, setPhotoSummaries] = useState({});

  useEffect(() => {
    function refreshProperties() {
      const valid = locationEverExisted(decodedLocation);
      setIsValidLocation(valid);
      setAllProperties(valid ? getPropertiesByLocation(decodedLocation) : []);
      setAllLocations(getActiveLocations());
    }

    refreshProperties();
    window.addEventListener("admin-storage-changed", refreshProperties);
    window.addEventListener("storage", refreshProperties);

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
      refreshProperties();
    }
    window.addEventListener("homestay-photos-changed", onPhotoUpdate);
    window.addEventListener("photos-changed", onPhotoUpdate);

    return () => {
      window.removeEventListener("admin-storage-changed", refreshProperties);
      window.removeEventListener("storage", refreshProperties);
      window.removeEventListener("homestay-photos-changed", onPhotoUpdate);
      window.removeEventListener("photos-changed", onPhotoUpdate);
    };
  }, [decodedLocation]);

  if (!isValidLocation) {
    return (
      <main className="location-detail location-detail--notfound">
        <h1>Location not found</h1>
        <p>We couldn't find stays for "{decodedLocation}".</p>
        <Link to="/hotel-homestay" className="location-detail__back" aria-label="Back to Homestays and Stays">
          <span className="location-detail__back-arrow" aria-hidden="true">
            <ArrowLeft size={14} weight="bold" />
          </span>
          <span className="location-detail__back-text">Back to Homestays &amp; Stays</span>
        </Link>
      </main>
    );
  }

  const properties = allProperties.filter((p) => {
    const typeMatch = typeFilter === "" || p.type === typeFilter;
    const availMatch = availabilityFilter === "" || p.availability === availabilityFilter;
    return typeMatch && availMatch;
  });

  // Prioritize homestays at the top of the location listing
  const sortedProperties = [...properties].sort((a, b) => {
    if (a.type === "Homestay" && b.type !== "Homestay") return -1;
    if (a.type !== "Homestay" && b.type === "Homestay") return 1;
    return 0;
  });

  const hasActiveFilters = typeFilter !== "" || availabilityFilter !== "";
  const otherLocations = allLocations.filter(
    (l) => l.toLowerCase() !== decodedLocation.toLowerCase()
  );

  return (
    <main className="location-detail">
      <Link to="/hotel-homestay" className="location-detail__back" aria-label="Back to all Homestays and Stays">
        <span className="location-detail__back-arrow" aria-hidden="true">
          <ArrowLeft size={14} weight="bold" />
        </span>
        <span className="location-detail__back-text">Back to all Homestays &amp; Stays</span>
      </Link>

      <div className="location-detail__header">
        <div className="location-detail__header-title">
          <MapPinLine size={28} weight="duotone" />
          <h1>Homestays in {decodedLocation}</h1>
        </div>
        <p className="location-detail__header-sub">
          Explore village homestays, traditional lodges, and mountain accommodations in {decodedLocation}, Sikkim.
        </p>
      </div>

      {/* Quick Location Switcher */}
      {otherLocations.length > 0 && (
        <div className="location-detail__switcher">
          <span className="location-detail__switcher-label">Other Sikkim locations:</span>
          <div className="location-detail__switcher-pills">
            {otherLocations.map((loc) => (
              <Link
                key={loc}
                to={`/hotel-homestay/${encodeURIComponent(loc)}`}
                className="location-detail__switcher-pill"
              >
                <MapPinLine size={12} weight="duotone" /> {loc}
              </Link>
            ))}
          </div>
        </div>
      )}

      <FilterBar
        filters={[
          {
            label: "Stay Type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: STAY_TYPES,
          },
          {
            label: "Availability",
            value: availabilityFilter,
            onChange: setAvailabilityFilter,
            options: ["available", "unavailable"],
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onClear={() => { setTypeFilter(""); setAvailabilityFilter(""); }}
      />

      <div className="property-grid">
        {sortedProperties.length === 0 && (
          <EmptyState
            message={`No properties in ${decodedLocation} match your filters.`}
            actionLabel="Reset filters"
            onAction={() => { setTypeFilter(""); setAvailabilityFilter(""); }}
          />
        )}
        {sortedProperties.map((p) => {
          const propertyOffers = getActiveOffersFor("Stay", p.name || p.id, p.type);
          const pType = p.type || "Homestay";
          const displayName = p.name
            ? (p.name.toLowerCase().includes(pType.toLowerCase())
                ? p.name
                : `${p.name}, ${pType}`)
            : `${pType} — ${p.location}`;
          const localSummary = photoSummaries[p.id];
          const galleryItems = Array.isArray(p.gallery) ? p.gallery : [];
          const rawCover =
            localSummary?.coverUrl ||
            p.image ||
            (galleryItems.length > 0
              ? (typeof galleryItems[0] === "string"
                  ? galleryItems[0]
                  : galleryItems[0]?.src || galleryItems[0]?.dataUrl)
              : null);
          const coverSrc = typeof rawCover === "object" && rawCover !== null
            ? (rawCover.dataUrl || rawCover.src || "")
            : rawCover;
          const hasDistinctCover = p.image && !galleryItems.some((g) => (typeof g === "string" ? g : (g?.src || g?.dataUrl)) === p.image);
          const photoCount =
            localSummary?.count ??
            (galleryItems.length + (hasDistinctCover ? 1 : (p.image && galleryItems.length === 0 ? 1 : 0)));

          return (
            <article className="property-card" key={p.id}>
              <Link to={`/stays/${p.id}`} className="property-card__img-link" aria-label={`View ${displayName}`}>
                <div className="property-card__media">
                  <StayImage src={coverSrc} alt={displayName} />
                  {photoCount > 0 && (
                    <span className="property-card__photo-count">
                      <Camera size={12} weight="bold" /> {photoCount} {photoCount === 1 ? "photo" : "photos"}
                    </span>
                  )}
                  {(p.roomCount > 0 || (p.rooms && p.rooms.length > 0)) && (
                    <span className="property-card__rooms-count">
                      <Bed size={12} weight="bold" /> {p.roomCount || p.rooms.length} {((p.roomCount || p.rooms.length) === 1) ? "room" : "rooms"}
                    </span>
                  )}
                  <span className={`property-card__type-tag ${p.type === "Homestay" ? "property-card__type-tag--homestay" : ""}`}>
                    {p.type}
                  </span>
                </div>
              </Link>

              <div className="property-card__body">
                <div className="property-card__top-row">
                  <span className={`property-card__badge ${p.availability === "available" ? "property-card__badge--available" : "property-card__badge--unavailable"}`}>
                    {p.availability === "available" ? "Available" : "Unavailable"}
                  </span>
                </div>

                <h3 className="property-card__name">
                  <Link to={`/stays/${p.id}`}>{displayName}</Link>
                </h3>

                {p.description && (
                  <p className="property-card__desc">{p.description}</p>
                )}

                {p.amenities && p.amenities.length > 0 && (
                  <div className="property-card__amenities">
                    {p.amenities.slice(0, 3).map((amenity, aIdx) => {
                      const label = typeof amenity === "string" ? amenity : (amenity?.name || "");
                      return (
                        <span key={`am_${p.id}_${aIdx}`} className="property-card__amenity-tag">
                          {label}
                        </span>
                      );
                    })}
                  </div>
                )}

                <OfferBadge offers={propertyOffers} />

                <div className="property-card__footer">
                  <div className="property-card__pricing">
                    {p.price && (() => {
                      const pInfo = parseAndFormatPrice(p.price);
                      if (!pInfo) return null;
                      return (
                        <div className="property-card__price-box">
                          <span className="property-card__price-kicker">From</span>
                          <div className="property-card__price-line">
                            <span className="property-card__price-currency">{pInfo.currency}</span>
                            <span className="property-card__price-num">{pInfo.formatted}</span>
                            <span className="property-card__price-period">{pInfo.unit}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <Link to={`/stays/${p.id}`} className="property-card__cta-btn">
                    View Details <ArrowRight size={14} weight="bold" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}