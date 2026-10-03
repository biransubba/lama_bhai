import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPinLine, IdentificationCard, ArrowUpRight, ArrowRight } from "phosphor-react";
import { journeysRepo } from "../data/journeys.js";
import { getAllEntityPhotoSummaries } from "../utils/stayPhotoStorage.js";
import DestinationImage from "../components/DestinationImage.jsx";
import { getActiveOffersFor } from "../data/offersStore.js";
import OfferBadge from "../components/OfferBadge.jsx";
import "./Journeys.css";

export default function Journeys() {
  const [journeyList, setJourneyList] = useState(() =>
    journeysRepo.getAll().filter((j) => j.active !== false)
  );
  const [photoSummaries, setPhotoSummaries] = useState({});

  async function loadSummaries() {
    try {
      const summaries = await getAllEntityPhotoSummaries();
      setPhotoSummaries(summaries || {});
    } catch (err) {
      console.warn("Could not load journey photo summaries:", err);
    }
  }

  function refreshJourneys() {
    setJourneyList(journeysRepo.getAll().filter((j) => j.active !== false));
  }

  useEffect(() => {
    loadSummaries();

    function handleUpdate() {
      refreshJourneys();
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

  return (
    <main className="journeys-page">
      <section className="journeys-hero">
        <p className="journeys-hero__eyebrow">Sikkim, Eastern Himalayas</p>
        <h1 className="journeys-hero__heading">Sikkim Journeys</h1>
        <p className="journeys-hero__sub">
          Curated mountain routes, valley base points, and high-altitude circuits across Sikkim.
        </p>
      </section>

      <section className="journeys-content">
        <div className="journeys-content__grid">
          {journeyList.map((j) => {
            const cardImg = photoSummaries[j.slug]?.coverUrl || j.image;
            const destItems = Array.isArray(j.destinations)
              ? j.destinations
              : typeof j.destinations === "string"
              ? j.destinations.split(",").map((s) => s.trim()).filter(Boolean)
              : [];

            return (
              <Link to={`/journeys/${j.slug}`} className="journey-card" key={j.slug}>
                <DestinationImage src={cardImg} alt={j.name} />
                <h3 className="journey-card__name">{j.name}</h3>
                <p className="journey-card__desc">{j.shortDescription}</p>
                <OfferBadge offers={getActiveOffersFor("Journey", j.name)} />

                {destItems.length > 0 && (
                  <div className="journey-card__destinations">
                    {destItems.map((d) => (
                      <span key={d} className="journey-card__tag">
                        <MapPinLine size={13} /> {d}
                      </span>
                    ))}
                  </div>
                )}

                {j.permitNote && (
                  <div className="journey-card__permit">
                    <IdentificationCard size={15} /> {j.permitNote}
                  </div>
                )}

                <span className="journey-card__cta">
                  Explore journey <ArrowUpRight size={16} weight="bold" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="journeys-page-plan-cta">
        <div className="journeys-page-plan-cta__box">
          <h2>Need a customized Sikkim journey?</h2>
          <p>
            Tell us your travel dates, group size, and interests. We will tailor the optimal itinerary with transport,
            stays, and permit assistance.
          </p>
          <Link to="/plan-trip" className="btn-primary">
            PLAN MY TRIP <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      </section>
    </main>
  );
}
