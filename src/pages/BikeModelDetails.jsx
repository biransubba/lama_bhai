import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Mountains, ShieldCheck, CheckCircle, Bicycle } from "phosphor-react";
import { getBikeModelBySlug, getUnitsByBikeModel, getAvailableBikeCount } from "../data/bikes.js";
import { getActiveOffersFor } from "../data/offersStore.js";
import { useEntityPhotos } from "../hooks/useStayPhotos.js";
import { getAllEntityPhotoSummaries } from "../utils/stayPhotoStorage.js";
import BikeImage from "../components/BikeImage.jsx";
import EmptyState from "../components/EmptyState.jsx";
import FilterBar from "../components/FilterBar.jsx";
import OfferBadge from "../components/OfferBadge.jsx";
import Lightbox from "../components/Lightbox.jsx";
import "./BikeModelDetails.css";

export default function BikeModelDetails() {
  const { modelSlug } = useParams();
  const [model, setModel] = useState(() => getBikeModelBySlug(modelSlug));
  const [allUnits, setAllUnits] = useState(() => (model ? getUnitsByBikeModel(modelSlug) : []));
  const [availability, setAvailability] = useState("");
  const [photoSummaries, setPhotoSummaries] = useState({});
  const [lightboxIndex, setLightboxIndex] = useState(null);

  async function loadSummaries() {
    try {
      const summaries = await getAllEntityPhotoSummaries();
      setPhotoSummaries(summaries || {});
    } catch (err) {
      console.warn("Could not load bike photo summaries:", err);
    }
  }

  useEffect(() => {
    loadSummaries();

    function refresh() {
      const m = getBikeModelBySlug(modelSlug);
      setModel(m);
      setAllUnits(m ? getUnitsByBikeModel(modelSlug) : []);
      loadSummaries();
    }
    refresh();

    window.addEventListener("admin-storage-changed", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("photos-changed", refresh);
    return () => {
      window.removeEventListener("admin-storage-changed", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("photos-changed", refresh);
    };
  }, [modelSlug]);

  const { photos, coverImage } = useEntityPhotos(model?.slug, model, "Bike");

  if (!model) {
    return (
      <main className="model-detail model-detail--notfound">
        <h1>Bike model not found</h1>
        <Link to="/rental-bike" className="model-detail__back">
          <ArrowLeft size={16} weight="bold" /> Back to Bikes
        </Link>
      </main>
    );
  }

  const modelOffers = getActiveOffersFor("Bike", model.name, model.category);
  const units = allUnits.filter((u) => availability === "" || u.availability === availability);
  const hasActiveFilters = availability !== "";
  const availableCount = getAvailableBikeCount(model.slug);

  return (
    <main className="model-detail">
      <Link to="/rental-bike" className="model-detail__back">
        <ArrowLeft size={16} weight="bold" /> Back to Bikes
      </Link>

      {/* Showcase Model Hero Card */}
      <div className="model-hero-card">
        <div className="model-hero-card__info">
          <span className="model-detail__category">{model.category}</span>
          <h1>{model.name}</h1>
          <p className="model-detail__desc">{model.description}</p>

          <div className="model-feature-chips">
            <span className="model-feature-chip">
              <Mountains size={14} weight="bold" /> High-Altitude Ready
            </span>
            <span className="model-feature-chip">
              <ShieldCheck size={14} weight="bold" /> Verified Local Fleet
            </span>
            <span className="model-feature-chip">
              <CheckCircle size={14} weight="bold" /> Serviced &amp; Inspected
            </span>
          </div>

          <OfferBadge offers={modelOffers} />
        </div>

        <div className="model-hero-card__visual">
          {coverImage || model.image ? (
            <img src={coverImage || model.image} alt={model.name} loading="lazy" />
          ) : (
            <div className="model-hero-card__placeholder">
              <Bicycle size={44} weight="duotone" className="model-hero-card__placeholder-icon" />
              <span className="model-hero-card__placeholder-brand">Lama Bhai Mountain Fleet</span>
              <span className="model-hero-card__placeholder-tag">High-Altitude Tuned · Sikkim</span>
            </div>
          )}
        </div>
      </div>

      {/* Professional Fleet Selection Section */}
      <div className="fleet-selection-header">
        <div>
          <span className="fleet-selection-eyebrow">FLEET SELECTION</span>
          <h2 className="fleet-selection-title">Choose Your {model.name}</h2>
          <p className="fleet-selection-subtitle">
            Select an individual bike below to inspect vehicle details, equipment, and reserve directly.
          </p>
        </div>

        <div className="fleet-status-pill">
          <span className={`status-dot ${availableCount > 0 ? "status-dot--green" : "status-dot--gray"}`} />
          {availableCount > 0 ? `${availableCount} Available to Book` : "Currently Unavailable"}
        </div>
      </div>

      <FilterBar
        filters={[
          {
            label: "Availability",
            value: availability,
            onChange: setAvailability,
            options: ["available", "unavailable"],
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onClear={() => setAvailability("")}
      />

      <div className="unit-grid">
        {units.length === 0 && <EmptyState message="No bikes match your filters." />}
        {units.map((u) => {
          const unitCover = photoSummaries[u.id]?.coverUrl || u.image || coverImage || model.image;
          const isAvail = u.availability === "available";

          return (
            <div className="unit-card" key={u.id}>
              <BikeImage src={unitCover} alt={model.name} height={180} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {model.category}
                </span>
                <span
                  className={`unit-card__badge ${
                    isAvail ? "unit-card__badge--available" : "unit-card__badge--unavailable"
                  }`}
                >
                  {isAvail ? "Available" : "Unavailable"}
                </span>
              </div>

              <h3 className="unit-card__name">{model.name}</h3>

              <p className="unit-card__number">
                Identifier: {u.identifier || "Not yet added"}
              </p>

              {(u.engineCC || u.transmission || u.seating) && (
                <p className="unit-card__specs">
                  {u.engineCC ? `${u.engineCC}cc` : ""}
                  {u.engineCC && u.transmission ? " · " : ""}
                  {u.transmission || ""}
                  {(u.engineCC || u.transmission) && u.seating ? " · " : ""}
                  {u.seating ? `${u.seating} riders` : ""}
                </p>
              )}

              {u.description && (
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: "4px 0" }}>
                  {u.description}
                </p>
              )}

              <Link to={`/bikes/${u.id}`} className="unit-card__link">
                View details &amp; Book &rarr;
              </Link>
            </div>
          );
        })}
      </div>

      {photos.length > 0 && (
        <section
          className="model-gallery-section"
          style={{
            marginTop: "var(--space-xl)",
            paddingTop: "var(--space-lg)",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", marginBottom: "var(--space-sm)" }}>Model Gallery</h2>
          <div className={`dest-detail__gallery dest-detail__gallery--count-${Math.min(photos.length, 6)}`}>
            {photos.map((img, i) => (
              <button
                key={img.id || i}
                className={`gallery-tile gallery-tile--${i % 3}`}
                onClick={() => setLightboxIndex(i)}
                aria-label={`View larger image: ${img.alt || model.name}`}
              >
                <img src={img.src} alt={img.alt || model.name} loading="lazy" />
              </button>
            ))}
          </div>
        </section>
      )}

      {photos.length > 0 && (
        <Lightbox
          images={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}
          onNext={() => setLightboxIndex((i) => (i === photos.length - 1 ? 0 : i + 1))}
        />
      )}
    </main>
  );
}