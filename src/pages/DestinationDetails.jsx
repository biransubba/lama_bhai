import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPinLine,
  ArrowRight,
  CheckCircle,
  Compass,
  Mountains,
  Car,
  Clock,
  CloudSun,
  Thermometer,
  ShieldCheck,
  ShieldWarning,
  Sparkle,
  Info,
  WhatsappLogo,
  GlobeHemisphereWest,
} from "phosphor-react";
import IndiaFlag from "../components/IndiaFlag.jsx";
import { getDestinationBySlug, getRelatedDestinations } from "../data/destinations.js";
import { getDefaultDestinationPhotos } from "../data/destinationImages.js";
import { getDefaultDestinationDetails } from "../data/destinationDetailsData.js";
import { useEntityPhotos } from "../hooks/useStayPhotos.js";
import { getContactSettings, buildWhatsAppLink } from "../data/contactSettings.js";
import DestinationImage from "../components/DestinationImage.jsx";
import DestinationSlideshow from "../components/DestinationSlideshow.jsx";
import "./DestinationDetails.css";

export default function DestinationDetails() {
  const { slug } = useParams();
  const [destination, setDestination] = useState(() => getDestinationBySlug(slug));
  const [contactSettings, setContactSettings] = useState(getContactSettings());

  useEffect(() => {
    function refresh() {
      const dest = getDestinationBySlug(slug);
      setDestination(dest);
      setContactSettings(getContactSettings());
    }
    refresh();

    window.addEventListener("admin-storage-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("admin-storage-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [slug]);

  const { photos, coverImage } = useEntityPhotos(destination?.slug, destination, "Destination");

  if (!destination) {
    return (
      <main className="dest-detail dest-detail--notfound">
        <h1>Destination not found</h1>
        <p>We couldn't find that Sikkim destination.</p>
        <Link to="/destinations" className="dest-detail__back">
          <ArrowLeft size={16} weight="bold" /> Back to all destinations
        </Link>
      </main>
    );
  }

  const defaultDetails = getDefaultDestinationDetails(destination.slug || slug);
  const defaults = getDefaultDestinationPhotos(slug || destination.slug);

  const effectiveCover =
    coverImage ||
    destination.image ||
    destination.images?.card ||
    destination.images?.hero ||
    defaults.cover;

  const effectivePhotos =
    photos && photos.length > 0
      ? photos
      : (defaults.gallery || []);

  const related = getRelatedDestinations(destination.relatedSlugs || []);
  const whyVisitList =
    Array.isArray(destination.whyVisit) &&
    destination.whyVisit.length > 0 &&
    typeof destination.whyVisit[0] === "object"
      ? destination.whyVisit
      : (defaultDetails.whyVisit || []);

  const highlightsList =
    Array.isArray(destination.highlights) && destination.highlights.length > 0
      ? destination.highlights
      : (defaultDetails.highlights || []);

  const topExperiences =
    Array.isArray(destination.topExperiences) &&
    destination.topExperiences.length > 0 &&
    typeof destination.topExperiences[0] === "object"
      ? destination.topExperiences
      : (defaultDetails.topExperiences || []);

  const insiderTips =
    Array.isArray(destination.insiderTips) && destination.insiderTips.length > 0
      ? destination.insiderTips
      : (defaultDetails.insiderTips || []);

  const isRestrictedForForeigners =
    destination.foreignerAccess === "restricted" ||
    defaultDetails.foreignerAccess === "restricted";

  const isConditionalForForeigners =
    destination.foreignerAccess === "conditional" ||
    defaultDetails.foreignerAccess === "conditional";

  const whatsappInquiryUrl = buildWhatsAppLink(
    contactSettings.whatsapp,
    `Hi Lama Bhai Tourism, I would like more details and help planning a trip to ${destination.name}!`
  );

  return (
    <main className="dest-detail">
      {/* Top Back Navigation */}
      <Link to="/destinations" className="dest-detail__back">
        <ArrowLeft size={16} weight="bold" /> Back to all destinations
      </Link>

      {/* Dynamic Slideshow */}
      <DestinationSlideshow
        photos={effectivePhotos}
        coverImage={effectiveCover}
        destinationName={destination.name}
        tag={destination.tag}
        destinationSlug={slug || destination.slug}
      />

      {/* Beautified Hero Header */}
      <div className="dest-detail__header-banner">
        <div className="dest-detail__header-meta">
          <span className="dest-detail__tag">
            <MapPinLine size={14} weight="bold" /> {destination.tag}
          </span>
          {destination.altitude && (
            <span className="dest-detail__alt-badge">
              <Mountains size={14} weight="bold" /> {destination.altitude}
            </span>
          )}
        </div>

        <h1 className="dest-detail__heading">{destination.name}</h1>
        {destination.shortDescription && (
          <p className="dest-detail__short">{destination.shortDescription}</p>
        )}

        {/* Integrated About Narrative & Culture */}
        <div className="dest-detail__about-block">
          <p className="dest-lead-text">{destination.description}</p>

          {(destination.localCulture || defaultDetails.localCulture) && (
            <div className="dest-culture-box">
              <div className="dest-culture-box__header">
                <Info size={18} weight="bold" />
                <strong>Mountain Heritage &amp; Local Culture</strong>
              </div>
              <p>{destination.localCulture || defaultDetails.localCulture}</p>
            </div>
          )}
        </div>

        {/* Action Button Row */}
        <div className="dest-detail__action-row">
          <Link
            to={`/plan-trip?destination=${encodeURIComponent(destination.name)}`}
            className="dest-detail__btn dest-detail__btn--primary"
          >
            Plan this destination <ArrowRight size={16} weight="bold" />
          </Link>
          <Link
            to="/cars"
            className="dest-detail__btn dest-detail__btn--secondary"
          >
            <Car size={16} weight="bold" /> Book Mountain Vehicle
          </Link>
          <a
            href={whatsappInquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dest-detail__btn dest-detail__btn--whatsapp"
          >
            <WhatsappLogo size={16} weight="bold" /> Ask Lama Bhai
          </a>
        </div>
      </div>

      {/* Quick Facts Bento Grid */}
      <section className="dest-facts-grid" aria-label="Key Destination Facts">
        <div className="dest-fact-card">
          <div className="dest-fact-card__icon dest-fact-card__icon--alt">
            <Mountains size={22} weight="duotone" />
          </div>
          <div className="dest-fact-card__body">
            <span className="dest-fact-card__label">Altitude &amp; Elevation</span>
            <strong className="dest-fact-card__value">
              {destination.altitude || defaultDetails.altitude || "High Altitude"}
            </strong>
            <span className="dest-fact-card__sub">North Sikkim Himalayan Range</span>
          </div>
        </div>

        <div className="dest-fact-card">
          <div className="dest-fact-card__icon dest-fact-card__icon--dist">
            <Car size={22} weight="duotone" />
          </div>
          <div className="dest-fact-card__body">
            <span className="dest-fact-card__label">From Gangtok</span>
            <strong className="dest-fact-card__value">
              {destination.distanceFromGangtok || defaultDetails.distanceFromGangtok || "Scenic Mountain Highway"}
            </strong>
            <span className="dest-fact-card__sub">Via Mangan / Chungthang</span>
          </div>
        </div>

        <div className="dest-fact-card">
          <div className="dest-fact-card__icon dest-fact-card__icon--season">
            <CloudSun size={22} weight="duotone" />
          </div>
          <div className="dest-fact-card__body">
            <span className="dest-fact-card__label">Best Time to Visit</span>
            <strong className="dest-fact-card__value">
              {destination.bestTime || defaultDetails.bestTime || "March – June & Oct – Dec"}
            </strong>
            <span className="dest-fact-card__sub">Clear Skies &amp; Mountain Vistas</span>
          </div>
        </div>

        <div className="dest-fact-card">
          <div className="dest-fact-card__icon dest-fact-card__icon--temp">
            <Thermometer size={22} weight="duotone" />
          </div>
          <div className="dest-fact-card__body">
            <span className="dest-fact-card__label">Climate &amp; Temperature</span>
            <strong className="dest-fact-card__value">
              {destination.temperature || defaultDetails.temperature || "Cool Alpine Climate"}
            </strong>
            <span className="dest-fact-card__sub">Cold nights; multi-layers advised</span>
          </div>
        </div>

        <div className="dest-fact-card">
          <div className="dest-fact-card__icon dest-fact-card__icon--duration">
            <Clock size={22} weight="duotone" />
          </div>
          <div className="dest-fact-card__body">
            <span className="dest-fact-card__label">Ideal Stay Duration</span>
            <strong className="dest-fact-card__value">
              {destination.idealDuration || defaultDetails.idealDuration || "1 - 2 Days"}
            </strong>
            <span className="dest-fact-card__sub">Recommended Circuit Stop</span>
          </div>
        </div>

        <div className={`dest-fact-card ${isRestrictedForForeigners ? "dest-fact-card--restricted" : "dest-fact-card--permitted"}`}>
          <div className="dest-fact-card__icon">
            {isRestrictedForForeigners ? (
              <ShieldWarning size={22} weight="duotone" />
            ) : (
              <ShieldCheck size={22} weight="duotone" />
            )}
          </div>
          <div className="dest-fact-card__body">
            <span className="dest-fact-card__label">Permit &amp; Nationality Access</span>
            <div className="dest-nat-grid">
              <div className="dest-nat-row dest-nat-row--ok">
                <div className="dest-nat-row__left">
                  <IndiaFlag width={18} height={12} />
                  <span className="dest-nat-row__label">Indian Citizens</span>
                </div>
                <span className="dest-nat-badge dest-nat-badge--ok">Permitted (PAP)</span>
              </div>

              <div className={`dest-nat-row ${isRestrictedForForeigners ? "dest-nat-row--restricted" : isConditionalForForeigners ? "dest-nat-row--warn" : "dest-nat-row--ok"}`}>
                <div className="dest-nat-row__left">
                  <GlobeHemisphereWest size={15} weight="bold" />
                  <span className="dest-nat-row__label">Foreign Tourists</span>
                </div>
                <span className={`dest-nat-badge ${isRestrictedForForeigners ? "dest-nat-badge--restricted" : isConditionalForForeigners ? "dest-nat-badge--warn" : "dest-nat-badge--ok"}`}>
                  {isRestrictedForForeigners ? "Not Permitted" : isConditionalForForeigners ? "Special Permit" : "Permitted (PAP)"}
                </span>
              </div>
            </div>
            <span className="dest-fact-card__sub">
              {isRestrictedForForeigners
                ? "Defense border zone (MHA restricted for foreign passports)"
                : (destination.foreignAccessNote || "Protected Area Permit (PAP) required")}
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Layout with Content and Right Sidebar */}
      <div className="dest-detail__content-layout">
        <div className="dest-detail__main-col">
          {/* Why Visit Section - Engaging Customer-Centric Storytelling */}
          {whyVisitList.length > 0 && (
            <section className="dest-card-section dest-why-section">
              <div className="dest-section-header">
                <span className="dest-section-eyebrow">The Himalayan Appeal</span>
                <h2 className="dest-section-title">
                  <Sparkle size={20} weight="fill" className="dest-title-icon" /> Why Visit {destination.name}
                </h2>
                <p className="dest-section-intro">
                  What makes {destination.name} an unforgettable journey for travelers seeking serenity, culture, and high mountain beauty.
                </p>
              </div>

              <div className="dest-why-cards-grid">
                {whyVisitList.map((item, idx) => {
                  const title = typeof item === "object" ? item.title : item;
                  const desc = typeof item === "object" ? item.desc : null;
                  const tag = typeof item === "object" ? item.tag : "Essential Reason";
                  return (
                    <div key={idx} className="dest-why-card">
                      <div className="dest-why-card__top">
                        <span className="dest-why-card__tag">{tag}</span>
                        <div className="dest-why-card__check" aria-hidden="true">
                          <CheckCircle size={18} weight="fill" />
                        </div>
                      </div>
                      <h3 className="dest-why-card__title">{title}</h3>
                      {desc && <p className="dest-why-card__desc">{desc}</p>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Highlights Sights */}
          {highlightsList.length > 0 && (
            <section className="dest-card-section">
              <h2 className="dest-section-title">Key Highlights</h2>
              <div className="dest-detail__chips">
                {highlightsList.map((h) => (
                  <span key={h} className="dest-detail__chip">
                    <Compass size={16} weight="bold" /> {h}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Top Experiences & Things to Do - Clearly Labelled & Engaging */}
          {topExperiences.length > 0 && (
            <section className="dest-card-section dest-experiences-section">
              <div className="dest-section-header">
                <span className="dest-section-eyebrow">Curated Itinerary Highlights</span>
                <h2 className="dest-section-title">
                  <Compass size={20} weight="bold" className="dest-title-icon" /> Top Experiences &amp; Things to Do in {destination.name}
                </h2>
                <p className="dest-section-intro">
                  Handpicked mountain adventures and cultural moments to make your Sikkim trip truly extraordinary.
                </p>
              </div>

              <div className="dest-experiences-grid">
                {topExperiences.map((exp, i) => {
                  const title = typeof exp === "object" ? exp.title : exp;
                  const desc = typeof exp === "object" ? exp.desc : "";
                  const tag = typeof exp === "object" ? exp.tag : "Local Highlight";
                  const badge = typeof exp === "object" ? exp.badge : null;

                  return (
                    <article key={i} className="dest-exp-card">
                      <div className="dest-exp-card__header-bar">
                        <div className="dest-exp-card__num-pill">
                          <span className="dest-exp-card__num-prefix">EXPERIENCE</span>
                          <span className="dest-exp-card__num-val">#{i + 1}</span>
                        </div>
                        {badge && (
                          <span className="dest-exp-card__badge-pill">
                            <Sparkle size={12} weight="fill" /> {badge}
                          </span>
                        )}
                      </div>

                      <div className="dest-exp-card__body">
                        {tag && <span className="dest-exp-card__tag-pill">{tag}</span>}
                        <h3 className="dest-exp-card__title">{title}</h3>
                        <p className="dest-exp-card__desc">{desc}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Road & Travel Route Guide */}
          <section className="dest-card-section">
            <h2 className="dest-section-title">
              <Car size={20} weight="bold" className="dest-title-icon" /> How to Reach &amp; Route Guide
            </h2>
            <p className="dest-route-text">
              {destination.routeGuide || defaultDetails.routeGuide || destination.travelInfo}
            </p>

            <div className="dest-vehicle-recom">
              <Car size={20} weight="duotone" className="dest-vehicle-recom__icon" />
              <div>
                <strong>Recommended Vehicle</strong>
                <p>
                  {destination.recommendedVehicle || defaultDetails.recommendedVehicle || "High-clearance 4x4 Mountain SUV (Scorpio / Bolero / Innova)"}
                </p>
              </div>
              <Link to="/cars" className="dest-vehicle-recom__link">
                View Fleet <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          </section>

          {/* Lama Bhai's Mountain Advisory & Local Tips */}
          {insiderTips.length > 0 && (
            <section className="dest-advisory-card">
              <div className="dest-advisory-card__header">
                <Sparkle size={20} weight="fill" />
                <h2>Lama Bhai's Mountain Advisory &amp; Local Tips</h2>
              </div>
              <p className="dest-advisory-card__sub">
                Handy advice based on years of driving, arranging stays, and guiding travelers through North Sikkim.
              </p>
              <ul className="dest-advisory-list">
                {insiderTips.map((tip, idx) => (
                  <li key={idx}>
                    <span className="dest-advisory-bullet">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Nearby Sikkim Destinations */}
          {related.length > 0 && (
            <section className="dest-card-section">
              <h2 className="dest-section-title">Nearby Sikkim Destinations</h2>
              <div className="dest-detail__related">
                {related.map((r) => (
                  <Link to={`/destinations/${r.slug}`} key={r.slug} className="related-card">
                    <DestinationImage
                      src={r.images?.card || r.image}
                      alt={r.name}
                      photoCount={r.gallery?.length || 3}
                    />
                    <div className="related-card__content">
                      <span className="related-card__tag">{r.tag}</span>
                      <strong className="related-card__name">{r.name}</strong>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}