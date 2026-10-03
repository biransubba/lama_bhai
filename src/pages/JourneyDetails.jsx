import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, MapPinLine, IdentificationCard, ArrowRight,
  CheckCircle, Warning, ListNumbers, ImageSquare
} from "phosphor-react";
import { getJourneyBySlug } from "../data/journeys.js";
import { getActiveOffersFor } from "../data/offersStore.js";
import { useEntityPhotos } from "../hooks/useStayPhotos.js";
import DestinationImage from "../components/DestinationImage.jsx";
import OfferBadge from "../components/OfferBadge.jsx";
import Lightbox from "../components/Lightbox.jsx";
import "./JourneyDetails.css";

export default function JourneyDetails() {
  const { slug } = useParams();
  const [journey, setJourney] = useState(() => getJourneyBySlug(slug));
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    function refresh() {
      setJourney(getJourneyBySlug(slug));
    }
    refresh();

    window.addEventListener("admin-storage-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("admin-storage-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [slug]);

  const { photos, coverImage } = useEntityPhotos(journey?.slug, journey, "Journey");

  if (!journey) {
    return (
      <main className="journey-detail journey-detail--notfound">
        <h1>Journey not found</h1>
        <Link to="/" className="journey-detail__back">
          <ArrowLeft size={16} weight="bold" /> Back to homepage
        </Link>
      </main>
    );
  }

  const journeyOffers = getActiveOffersFor("Journey", journey.name);
  const destinationsList = Array.isArray(journey.destinations)
    ? journey.destinations
    : typeof journey.destinations === "string"
    ? journey.destinations.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const sequenceList = Array.isArray(journey.suggestedSequence)
    ? journey.suggestedSequence
    : typeof journey.suggestedSequence === "string"
    ? journey.suggestedSequence.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const highlightsList = Array.isArray(journey.highlights)
    ? journey.highlights
    : typeof journey.highlights === "string"
    ? journey.highlights.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  function openLightbox(i) {
    setLightboxIndex(i);
  }
  function closeLightbox() {
    setLightboxIndex(null);
  }
  function prevImage() {
    setLightboxIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  }
  function nextImage() {
    setLightboxIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
  }

  return (
    <main className="journey-detail">
      <Link to="/journeys" className="journey-detail__back">
        <ArrowLeft size={16} weight="bold" /> Back to all journeys
      </Link>

      <div className="journey-detail__hero">
        <DestinationImage src={coverImage || journey.image} alt={journey.name} />
      </div>

      <div className="journey-detail__header">
        <h1>{journey.name}</h1>
        <p className="journey-detail__short">{journey.shortDescription}</p>
        <OfferBadge offers={journeyOffers} />
      </div>

      {journey.description && (
        <section className="journey-detail__section">
          <h2>About this journey</h2>
          <p>{journey.description}</p>
        </section>
      )}

      {destinationsList.length > 0 && (
        <section className="journey-detail__section">
          <h2>Destinations included</h2>
          <div className="journey-detail__chips">
            {destinationsList.map((d) => (
              <span key={d} className="journey-detail__chip"><MapPinLine size={13} /> {d}</span>
            ))}
          </div>
        </section>
      )}

      {sequenceList.length > 0 && (
        <section className="journey-detail__section">
          <h2>Suggested sequence</h2>
          <ol className="journey-detail__sequence">
            {sequenceList.map((step) => (
              <li key={step}><ListNumbers size={16} /> {step}</li>
            ))}
          </ol>
        </section>
      )}

      {highlightsList.length > 0 && (
        <section className="journey-detail__section">
          <h2>Highlights</h2>
          <ul className="journey-detail__list">
            {highlightsList.map((h) => (
              <li key={h}><CheckCircle size={16} weight="fill" /> {h}</li>
            ))}
          </ul>
        </section>
      )}

      {journey.travelInfo && (
        <section className="journey-detail__section">
          <h2>Travel information</h2>
          <p>{journey.travelInfo}</p>
        </section>
      )}

      {journey.permitNote && (
        <section className="journey-detail__permit">
          <IdentificationCard size={22} weight="duotone" />
          <div>
            <h2>Permit &amp; access information</h2>
            <p>{journey.permitNote}</p>
            <Link to="/permit" className="journey-detail__permit-link">
              Open the Permit Guide <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </section>
      )}

      {/* Photo Gallery Section */}
      <section className="journey-detail__section">
        <h2>Photo gallery</h2>
        {photos.length > 0 ? (
          <div className={`dest-detail__gallery dest-detail__gallery--count-${Math.min(photos.length, 6)}`}>
            {photos.map((img, i) => (
              <button
                key={img.id || i}
                className={`gallery-tile gallery-tile--${i % 3}`}
                onClick={() => openLightbox(i)}
                aria-label={`View larger image: ${img.alt || journey.name}`}
              >
                <img src={img.src} alt={img.alt || journey.name} loading="lazy" />
              </button>
            ))}
          </div>
        ) : (
          <div className="dest-detail__gallery-empty">
            <ImageSquare size={28} weight="duotone" />
            <p>Photos for this journey will be added soon.</p>
          </div>
        )}
      </section>

      <section className="permit-notice">
        <Warning size={22} weight="fill" />
        <p>
          Permit requirements and access conditions may change. Please verify current
          requirements before travel.
        </p>
      </section>

      <section className="journey-detail__final-cta">
        <Link to="/plan-trip" className="journey-detail__primary-cta">
          Plan this journey <ArrowRight size={16} weight="bold" />
        </Link>
      </section>

      {photos.length > 0 && (
        <Lightbox
          images={photos}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </main>
  );
}