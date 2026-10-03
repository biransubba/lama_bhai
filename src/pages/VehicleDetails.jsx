import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users, ArrowRight, ShieldCheck } from "phosphor-react";
import { getUnitById, getModelBySlug } from "../data/vehicles.js";
import { useEntityPhotos } from "../hooks/useStayPhotos.js";
import VehicleImage from "../components/VehicleImage.jsx";
import BookingForm from "../components/BookingForm.jsx";
import Lightbox from "../components/Lightbox.jsx";
import "./VehicleDetails.css";

export default function VehicleDetails() {
  const { id } = useParams();
  const [unit, setUnit] = useState(() => getUnitById(id));
  const [model, setModel] = useState(() => (unit ? getModelBySlug(unit.modelSlug) : null));
  const [showForm, setShowForm] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    function refresh() {
      const u = getUnitById(id);
      setUnit(u);
      setModel(u ? getModelBySlug(u.modelSlug) : null);
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

  const { photos: unitPhotos, coverImage: unitCover } = useEntityPhotos(id, unit, "Car");
  const { photos: modelPhotos, coverImage: modelCover } = useEntityPhotos(model?.slug, model, "Car");

  const photos = unitPhotos.length > 0 ? unitPhotos : modelPhotos;
  const activeCover = unitCover || unit?.image || modelCover || model?.image;

  if (!unit || !model) {
    return (
      <main className="vehicle-detail vehicle-detail--notfound">
        <h1>Vehicle not found</h1>
        <p style={{ margin: "var(--space-md) 0", color: "var(--color-text-muted)" }}>
          The requested vehicle unit ({id}) is not listed in our fleet.
        </p>
        <Link to="/car-booking" className="vehicle-detail__back">
          <ArrowLeft size={16} weight="bold" /> Back to Cars
        </Link>
      </main>
    );
  }

  const bookingContext = {
    service: "Car",
    inventoryId: unit.id,
    modelSlug: model.slug,
    title: `${model.name} (${unit.seatingCapacity} seats)`,
    details: [
      { label: "Vehicle", value: `${model.name} (${unit.seatingCapacity} seats)` },
      { label: "Model", value: model.name },
      { label: "Category", value: model.category },
      { label: "Capacity", value: `${unit.seatingCapacity} seats` },
      ...(unit.vehicleNumber ? [{ label: "Vehicle No", value: unit.vehicleNumber }] : []),
    ],
  };

  const isAvailable = unit.availability === "available";

  return (
    <main className="vehicle-detail">
      <Link to={`/car-booking/${model.slug}`} className="vehicle-detail__back">
        <ArrowLeft size={16} weight="bold" /> Back to {model.name} fleet
      </Link>

      <VehicleImage src={activeCover} alt={model.name} height={320} />

      <div className="vehicle-detail__header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
          <span className="vehicle-detail__type">{model.category}</span>
          {unit.isSampleData && (
            <span className="vehicle-detail__sample-note" style={{ margin: 0 }}>
              (Verified Fleet Specimen)
            </span>
          )}
        </div>

        <h1>{model.name}</h1>
        <p className="vehicle-detail__desc">
          {unit.description || `Mountain-ready ${model.name} configured for high-altitude Sikkim roads.`}
        </p>
      </div>

      {/* Specifications Grid */}
      <div className="vehicle-detail__specs">
        <div className="spec-block">
          <span className="spec-block__label">Model:</span>
          <strong>{model.name}</strong>
        </div>
        <div className="spec-block">
          <span className="spec-block__label">Category:</span>
          <span>{model.category}</span>
        </div>
        <div className="spec-block">
          <Users size={16} />
          <span>{unit.seatingCapacity} seats</span>
        </div>
        <div className="spec-block">
          <span className="spec-block__label">Vehicle number:</span>
          <span>{unit.vehicleNumber || "Not yet added"}</span>
        </div>
        <div className="spec-block">
          <span className="spec-block__label">Availability:</span>
          <span className={isAvailable ? "vehicle-detail__status--available" : "vehicle-detail__status--unavailable"}>
            {isAvailable ? "● Available for booking" : "○ Currently unavailable"}
          </span>
        </div>
      </div>

      {/* Route & Terrain Suitability */}
      <div className="vehicle-detail__routes" style={{ margin: "var(--space-lg) 0" }}>
        <h2>Terrain &amp; Route Capability</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: 1.5, marginTop: "6px" }}>
          {model.description}
        </p>
      </div>

      {/* Booking CTA */}
      {isAvailable ? (
        <div className="vehicle-detail__action-bar">
          <button
            type="button"
            className="vehicle-detail__cta"
            onClick={() => setShowForm(true)}
          >
            Book Now <ArrowRight size={16} weight="bold" />
          </button>
          <span className="vehicle-detail__cta-note">
            <ShieldCheck size={16} style={{ verticalAlign: "middle", marginRight: "4px" }} />
            Direct inquiry with verified local Sikkim drivers
          </span>
        </div>
      ) : (
        <div className="vehicle-detail__unavailable-card">
          <p>
            <strong>This individual vehicle is currently unavailable.</strong>
          </p>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
            Other vehicles in the {model.name} model group may be available.
          </p>
          <Link to={`/car-booking/${model.slug}`} className="vehicle-detail__alt-btn">
            Browse other {model.name} vehicles &rarr;
          </Link>
        </div>
      )}

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <section className="vehicle-detail__gallery-section">
          <h2 style={{ fontSize: "1.2rem", marginBottom: "var(--space-xs)" }}>Vehicle Photos</h2>
          <div className="vehicle-detail__gallery-grid">
            {photos.map((img, i) => (
              <button
                key={img.id || i}
                type="button"
                className="vehicle-detail__gallery-thumb"
                onClick={() => setLightboxIndex(i)}
                aria-label={`View larger image ${i + 1}`}
              >
                <img src={img.src} alt={img.alt || model.name} loading="lazy" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {photos.length > 0 && (
        <Lightbox
          images={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}
          onNext={() => setLightboxIndex((i) => (i === photos.length - 1 ? 0 : i + 1))}
        />
      )}

      {/* Booking Form Modal */}
      {showForm && (
        <BookingForm context={bookingContext} onClose={() => setShowForm(false)} />
      )}
    </main>
  );
}