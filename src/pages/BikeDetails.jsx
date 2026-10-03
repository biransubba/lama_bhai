import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShieldCheck, Users, Info } from "phosphor-react";
import { getBikeUnitById, getBikeModelBySlug } from "../data/bikes.js";
import { useEntityPhotos } from "../hooks/useStayPhotos.js";
import BikeImage from "../components/BikeImage.jsx";
import BookingForm from "../components/BookingForm.jsx";
import Lightbox from "../components/Lightbox.jsx";
import "./BikeDetails.css";

export default function BikeDetails() {
  const { id } = useParams();
  const [unit, setUnit] = useState(() => getBikeUnitById(id));
  const [model, setModel] = useState(() => (unit ? getBikeModelBySlug(unit.modelSlug) : null));
  const [showForm, setShowForm] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    function refresh() {
      const u = getBikeUnitById(id);
      setUnit(u);
      setModel(u ? getBikeModelBySlug(u.modelSlug) : null);
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
  }, [id]);

  const { photos: unitPhotos, coverImage: unitCover } = useEntityPhotos(id, unit, "Bike");
  const { photos: modelPhotos, coverImage: modelCover } = useEntityPhotos(model?.slug, model, "Bike");

  const photos = unitPhotos.length > 0 ? unitPhotos : modelPhotos;
  const activeCover = unitCover || unit?.image || modelCover || model?.image;

  if (!unit || !model) {
    return (
      <main className="bike-detail bike-detail--notfound">
        <h1>Bike not found</h1>
        <p style={{ margin: "var(--space-md) 0", color: "var(--color-text-muted)" }}>
          The requested bike unit ({id}) is not listed in our fleet.
        </p>
        <Link to="/rental-bike" className="bike-detail__back">
          <ArrowLeft size={16} weight="bold" /> Back to Bikes
        </Link>
      </main>
    );
  }

  const bookingContext = {
    service: "Bike",
    inventoryId: unit.id,
    modelSlug: model.slug,
    title: `${model.name}${unit.identifier ? ` (${unit.identifier})` : ""}`,
    details: [
      { label: "Bike", value: model.name },
      { label: "Model", value: model.name },
      { label: "Category", value: model.category },
      ...(unit.identifier ? [{ label: "Identifier", value: unit.identifier }] : []),
      ...(unit.engineCC ? [{ label: "Engine", value: `${unit.engineCC}cc` }] : []),
      ...(unit.transmission ? [{ label: "Transmission", value: unit.transmission }] : []),
      { label: "Seating", value: `${unit.seating || 2} riders` },
    ],
  };

  const isAvailable = unit.availability === "available";

  return (
    <main className="bike-detail">
      <Link to={`/rental-bike/${model.slug}`} className="bike-detail__back">
        <ArrowLeft size={16} weight="bold" /> Back to {model.name} fleet
      </Link>

      <BikeImage src={activeCover} alt={model.name} height={320} />

      <div className="bike-detail__header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
          <span className="bike-detail__category">{model.category}</span>
          {unit.isSampleData && (
            <span className="bike-detail__sample-note" style={{ margin: 0 }}>
              (Verified Fleet Specimen)
            </span>
          )}
        </div>

        <h1>{model.name}</h1>
        <p className="bike-detail__desc">
          {unit.description || `Touring and adventure bike suited to Sikkim's high-altitude roads and winding passes.`}
        </p>
      </div>

      {/* Specifications Grid */}
      <div className="bike-detail__specs">
        <div className="spec-block">
          <span className="spec-block__label">Model:</span>
          <strong>{model.name}</strong>
        </div>
        <div className="spec-block">
          <span className="spec-block__label">Category:</span>
          <span>{model.category}</span>
        </div>
        <div className="spec-block">
          <span className="spec-block__label">Identifier:</span>
          <span>{unit.identifier || "Not yet added"}</span>
        </div>
        {unit.engineCC && (
          <div className="spec-block">
            <span className="spec-block__label">Engine:</span>
            <span>{unit.engineCC}cc</span>
          </div>
        )}
        {unit.transmission && (
          <div className="spec-block">
            <span className="spec-block__label">Transmission:</span>
            <span>{unit.transmission}</span>
          </div>
        )}
        <div className="spec-block">
          <Users size={16} />
          <span>{unit.seating || 2} riders</span>
        </div>
        <div className="spec-block">
          <span className="spec-block__label">Availability:</span>
          <span className={isAvailable ? "bike-detail__status--available" : "bike-detail__status--unavailable"}>
            {isAvailable ? "● Available for booking" : "○ Currently unavailable"}
          </span>
        </div>
      </div>

      {/* Route & Terrain Suitability */}
      <div className="bike-detail__rental-info" style={{ margin: "var(--space-lg) 0" }}>
        <h2>Terrain &amp; Route Capability</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: 1.5, marginTop: "6px" }}>
          {model.description}
        </p>
      </div>

      {/* Legal & Permit Notice */}
      <div className="bike-detail__notice">
        <Info size={20} />
        <div>
          <strong>Permit &amp; Protected Area Guidelines:</strong>
          <p style={{ margin: "4px 0 0" }}>
            High-altitude routes like Gurudongmar, Yumthang Valley, and Nathula require Inner Line Permits (ILP) and local authority clearances. Check the{" "}
            <Link to="/permit" style={{ color: "var(--color-peach-deep)", textDecoration: "underline" }}>
              Sikkim Permit Guide
            </Link>{" "}
            for full document checklists.
          </p>
        </div>
      </div>

      {/* Booking CTA */}
      {isAvailable ? (
        <div className="bike-detail__action-bar">
          <button
            type="button"
            className="bike-detail__cta"
            onClick={() => setShowForm(true)}
          >
            Book Now <ArrowRight size={16} weight="bold" />
          </button>
          <span className="bike-detail__cta-note">
            <ShieldCheck size={16} style={{ verticalAlign: "middle", marginRight: "4px" }} />
            Direct inquiry with Lama Bhai verified mountain bike fleet
          </span>
        </div>
      ) : (
        <div className="bike-detail__unavailable-card">
          <p>
            <strong>This individual bike is currently unavailable.</strong>
          </p>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
            Other bikes in the {model.name} fleet may be available.
          </p>
          <Link to={`/rental-bike/${model.slug}`} className="bike-detail__alt-btn">
            Browse other {model.name} bikes &rarr;
          </Link>
        </div>
      )}

      {/* Thumbnail Gallery & Lightbox */}
      {photos.length > 1 && (
        <section className="bike-detail__gallery-section">
          <h2>Bike Gallery ({photos.length} photos)</h2>
          <div className="bike-detail__gallery-grid">
            {photos.map((photo, i) => (
              <button
                key={photo.id || i}
                type="button"
                className="bike-detail__gallery-thumb"
                onClick={() => setLightboxIndex(i)}
                aria-label={`View photo ${i + 1} of ${model.name}`}
              >
                <img src={photo.src} alt={photo.alt || model.name} loading="lazy" />
              </button>
            ))}
          </div>
        </section>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}
          onNext={() => setLightboxIndex((i) => (i === photos.length - 1 ? 0 : i + 1))}
        />
      )}

      {showForm && <BookingForm context={bookingContext} onClose={() => setShowForm(false)} />}
    </main>
  );
}