import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight, Users } from "phosphor-react";
import {
  carModelsRepo,
  carUnitsRepo,
  getAvailableUnitCount,
  getUnitsByModel,
  vehicleCategories,
} from "../data/vehicles.js";
import { getAllEntityPhotoSummaries } from "../utils/stayPhotoStorage.js";
import VehicleImage from "../components/VehicleImage.jsx";
import FilterBar from "../components/FilterBar.jsx";
import { getActiveOffersFor } from "../data/offersStore.js";
import OfferBadge from "../components/OfferBadge.jsx";
import "./CarBooking.css";

export default function CarBooking() {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [models, setModels] = useState(() =>
    carModelsRepo.getAll().filter((m) => m.active !== false)
  );
  const [photoSummaries, setPhotoSummaries] = useState({});

  async function loadSummaries() {
    try {
      const summaries = await getAllEntityPhotoSummaries();
      setPhotoSummaries(summaries || {});
    } catch (err) {
      console.warn("Could not load car photo summaries:", err);
    }
  }

  function refreshModels() {
    setModels(carModelsRepo.getAll().filter((m) => m.active !== false));
  }

  useEffect(() => {
    loadSummaries();

    function handleUpdate() {
      refreshModels();
      loadSummaries();
    }

    window.addEventListener("photos-changed", handleUpdate);
    window.addEventListener("homestay-photos-changed", handleUpdate);
    window.addEventListener("admin-storage-changed", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("photos-changed", handleUpdate);
      window.removeEventListener("homestay-photos-changed", handleUpdate);
      window.removeEventListener("admin-storage-changed", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Filter model choices based on category selection
  const availableModelOptions = models
    .filter((m) => categoryFilter === "" || m.category === categoryFilter)
    .map((m) => m.name);

  // Filtered models
  const filteredModels = models.filter((m) => {
    const categoryMatch = categoryFilter === "" || m.category === categoryFilter;
    const modelMatch = modelFilter === "" || m.name === modelFilter;
    if (!categoryMatch || !modelMatch) return false;

    if (availabilityFilter === "") return true;
    const count = getAvailableUnitCount(m.slug);
    return availabilityFilter === "available" ? count > 0 : count === 0;
  });

  const selectedModelObject = modelFilter ? models.find((m) => m.name === modelFilter) : null;
  const hasActiveFilters = categoryFilter !== "" || modelFilter !== "" || availabilityFilter !== "";

  return (
    <main className="car-page">
      <section className="car-hero">
        <p className="car-hero__eyebrow">Sikkim, Eastern Himalayas</p>
        <h1 className="car-hero__heading">Explore Sikkim comfortably</h1>
        <p className="car-hero__sub">
          Choose a mountain-ready vehicle for your Sikkim journey and travel with verified local drivers.
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
            Already booked a mountain vehicle with Lama Bhai? Check your request status or cancel anytime.
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

      <section className="vehicle-list">
        <h2 className="vehicle-list__heading">Vehicle models &amp; categories</h2>

        <FilterBar
          filters={[
            {
              label: "Category",
              value: categoryFilter,
              onChange: (val) => {
                setCategoryFilter(val);
                setModelFilter(""); // Reset model if category changes
              },
              options: vehicleCategories,
            },
            {
              label: "Model",
              value: modelFilter,
              onChange: setModelFilter,
              options: availableModelOptions,
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
            setCategoryFilter("");
            setModelFilter("");
            setAvailabilityFilter("");
          }}
        />

        <div className="vehicle-grid">
          {filteredModels.length === 0 && (
            <EmptyState message="No vehicle models match your selected filters." />
          )}

          {filteredModels.map((m) => {
            const availableCount = getAvailableUnitCount(m.slug);
            const totalUnits = getUnitsByModel(m.slug).length;
            const cardImg = photoSummaries[m.slug]?.coverUrl || m.image;

            return (
              <Link to={`/car-booking/${m.slug}`} className="vehicle-card" key={m.slug}>
                <VehicleImage src={cardImg} alt={m.name} />
                <span className="vehicle-card__type">{m.category}</span>
                <h3 className="vehicle-card__name">{m.name}</h3>
                <p className="vehicle-card__route">{m.description}</p>
                <OfferBadge offers={getActiveOffersFor("Car", m.name, m.category)} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                  <p
                    className={`vehicle-card__availability ${
                      availableCount > 0
                        ? "vehicle-card__availability--yes"
                        : "vehicle-card__availability--no"
                    }`}
                  >
                    {availableCount > 0 ? `${availableCount} available` : "Currently unavailable"}
                  </p>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {totalUnits} in fleet
                  </span>
                </div>
                <span className="vehicle-card__view-link">
                  View vehicles <ArrowUpRight size={16} weight="bold" />
                </span>
              </Link>
            );
          })}
        </div>

        {/* When a specific model is filtered, directly show its individual vehicles */}
        {selectedModelObject && (
          <div
            className="selected-model-units-section"
            style={{
              marginTop: "var(--space-2xl)",
              padding: "var(--space-lg)",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-md)",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--color-peach-deep)",
                    fontWeight: 700,
                  }}
                >
                  {selectedModelObject.category}
                </span>
                <h3 style={{ fontSize: "1.3rem", margin: "4px 0" }}>
                  Individual Vehicles under {selectedModelObject.name}
                </h3>
              </div>
              <Link
                to={`/car-booking/${selectedModelObject.slug}`}
                style={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "var(--color-navy)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Open dedicated {selectedModelObject.name} fleet page <ArrowRight size={14} weight="bold" />
              </Link>
            </div>

            <div className="unit-grid">
              {getUnitsByModel(selectedModelObject.slug)
                .filter((u) => availabilityFilter === "" || u.availability === availabilityFilter)
                .map((u) => {
                  const unitCover =
                    photoSummaries[u.id]?.coverUrl ||
                    u.image ||
                    photoSummaries[selectedModelObject.slug]?.coverUrl ||
                    selectedModelObject.image;
                  const isAvail = u.availability === "available";

                  return (
                    <div
                      className="unit-card"
                      key={u.id}
                      style={{ background: "var(--color-cream)", border: "1px solid var(--color-border)" }}
                    >
                      <VehicleImage
                        src={unitCover}
                        alt={selectedModelObject.name}
                        height={160}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "6px",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--color-text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {selectedModelObject.category}
                        </span>
                        <span
                          className={`unit-card__badge ${
                            isAvail ? "unit-card__badge--available" : "unit-card__badge--unavailable"
                          }`}
                        >
                          {isAvail ? "Available" : "Unavailable"}
                        </span>
                      </div>
                      <h4 style={{ fontSize: "1rem", margin: "4px 0" }}>{selectedModelObject.name}</h4>
                      <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: 0 }}>
                        Vehicle number: {u.vehicleNumber || "Not yet added"}
                      </p>
                      <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "2px 0 6px" }}>
                        <Users size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />
                        {u.seatingCapacity} seats
                      </p>
                      <Link to={`/vehicles/${u.id}`} className="unit-card__link">
                        View details &amp; Book &rarr;
                      </Link>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </section>

      <section className="cars-plan-cta">
        <p>Planning a complete trip?</p>
        <Link to="/plan-trip" className="cars-plan-cta__link">
          Plan My Trip
        </Link>
      </section>
    </main>
  );
}