import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "phosphor-react";
import {
  bikeModelsRepo,
  bikeCategories,
  getAvailableBikeCount,
  getUnitsByBikeModel,
} from "../data/bikes.js";
import { getAllEntityPhotoSummaries } from "../utils/stayPhotoStorage.js";
import BikeImage from "../components/BikeImage.jsx";
import FilterBar from "../components/FilterBar.jsx";
import { getActiveOffersFor } from "../data/offersStore.js";
import OfferBadge from "../components/OfferBadge.jsx";
import "./RentalBike.css";

export default function RentalBike() {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [models, setModels] = useState(() =>
    bikeModelsRepo.getAll().filter((m) => m.active !== false)
  );
  const [photoSummaries, setPhotoSummaries] = useState({});

  async function loadSummaries() {
    try {
      const summaries = await getAllEntityPhotoSummaries();
      setPhotoSummaries(summaries || {});
    } catch (err) {
      console.warn("Could not load bike photo summaries:", err);
    }
  }

  function refreshModels() {
    setModels(bikeModelsRepo.getAll().filter((m) => m.active !== false));
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
    const count = getAvailableBikeCount(m.slug);
    return availabilityFilter === "available" ? count > 0 : count === 0;
  });

  const hasActiveFilters = categoryFilter !== "" || modelFilter !== "" || availabilityFilter !== "";

  return (
    <main className="bike-page">
      <section className="bike-hero">
        <p className="bike-hero__eyebrow">Sikkim, Eastern Himalayas</p>
        <h1 className="bike-hero__heading">Ride where the road gets wild.</h1>
        <p className="bike-hero__sub">
          Touring and adventure bikes built for Sikkim's high-altitude roads and winding mountain passes.
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
            Already booked a touring motorcycle with Lama Bhai? Check your request status or cancel anytime.
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

      <section className="bike-list">
        <h2 className="bike-list__heading">Bike models &amp; categories</h2>

        <FilterBar
          filters={[
            {
              label: "Category",
              value: categoryFilter,
              onChange: (val) => {
                setCategoryFilter(val);
                setModelFilter(""); // Reset model if category changes
              },
              options: bikeCategories,
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

        <div className="bike-grid">
          {filteredModels.length === 0 && (
            <EmptyState message="No bike models match your selected filters." />
          )}

          {filteredModels.map((m) => {
            const availableCount = getAvailableBikeCount(m.slug);
            const totalUnits = getUnitsByBikeModel(m.slug).length;
            const cardImg = photoSummaries[m.slug]?.coverUrl || m.image;

            return (
              <Link to={`/rental-bike/${m.slug}`} className="bike-card" key={m.slug}>
                <BikeImage src={cardImg} alt={m.name} />
                <span className="bike-card__category">{m.category}</span>
                <h3 className="bike-card__name">{m.name}</h3>
                <p className="bike-card__desc">{m.description}</p>
                <OfferBadge offers={getActiveOffersFor("Bike", m.name, m.category)} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                  <p
                    className={`bike-card__availability ${
                      availableCount > 0
                        ? "bike-card__availability--yes"
                        : "bike-card__availability--no"
                    }`}
                  >
                    {availableCount > 0 ? `${availableCount} available` : "Currently unavailable"}
                  </p>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {totalUnits} in fleet
                  </span>
                </div>
                <span className="bike-card__view-link">
                  View bikes <ArrowUpRight size={16} weight="bold" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bikes-plan-cta">
        <p>Planning a complete trip?</p>
        <Link to="/plan-trip" className="bikes-plan-cta__link">Plan My Trip</Link>
      </section>
    </main>
  );
}