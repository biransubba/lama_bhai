import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkle,
  ArrowUpRight,
  Camera,
  HouseLine,
  Mountains,
  FlowerLotus,
  Drop,
  Compass,
  Tree,
  Backpack,
} from "phosphor-react";
import { destinationsRepo, greenLakeTrek as initialTrek } from "../data/destinations.js";
import { getDefaultDestinationPhotos, unwrapImageUrl } from "../data/destinationImages.js";
import { getAllEntityPhotoSummaries } from "../utils/stayPhotoStorage.js";
import "./Destinations.css";

function getDestinationIcon(slug, tag = "") {
  const t = (tag || "").toLowerCase();
  const s = (slug || "").toLowerCase();
  if (s === "green-lake-trek" || t.includes("trek")) return Backpack;
  if (s === "gurudongmar-lake" || t.includes("lake")) return Drop;
  if (s.includes("valley") || t.includes("valley")) return FlowerLotus;
  if (t.includes("reserve") || s === "dzongu") return Tree;
  if (s === "zero-point" || t.includes("point") || t.includes("pass")) return Compass;
  if (t.includes("village") || s === "lachen" || s === "lachung" || s === "thangu") return HouseLine;
  return Mountains;
}

export default function Destinations() {
  const [destList, setDestList] = useState(() =>
    destinationsRepo.getAll().filter((d) => d.slug !== "green-lake-trek" && d.active !== false)
  );
  const [trek, setTrek] = useState(() => {
    const found = destinationsRepo.getAll().find((d) => d.slug === "green-lake-trek");
    return found || initialTrek;
  });
  const [photoSummaries, setPhotoSummaries] = useState({});

  async function loadSummaries() {
    try {
      const summaries = await getAllEntityPhotoSummaries();
      setPhotoSummaries(summaries || {});
    } catch (err) {
      console.warn("Could not load destination photo summaries:", err);
    }
  }

  function refreshDestinations() {
    const all = destinationsRepo.getAll();
    setDestList(all.filter((d) => d.slug !== "green-lake-trek" && d.active !== false));
    const foundTrek = all.find((d) => d.slug === "green-lake-trek");
    setTrek(foundTrek || initialTrek);
  }

  useEffect(() => {
    loadSummaries();

    function handleUpdate() {
      refreshDestinations();
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
    <section className="destinations" id="destinations" aria-label="Sikkim Destinations">
      <div className="destinations__inner">
        {/* Section Header consistent with ExploreWays */}
        <div className="destinations__header">
          <span className="destinations__eyebrow">
            <Sparkle size={14} weight="fill" /> Authentic Sikkim Circuits
          </span>
          <h2 className="destinations__heading">Explore Destinations Across Sikkim</h2>
          <p className="destinations__subtitle">
            High-altitude mountain villages, sacred glacial lakes, rhododendron valleys, and protected Himalayan reserves.
          </p>
        </div>

        {/* Photographic Visual Cards Grid (3 Columns) */}
        <div className="destinations__grid">
          {destList.map((d) => {
            const localSummary = photoSummaries[d.slug];
            const defaults = getDefaultDestinationPhotos(d.slug);
            const cardImg = unwrapImageUrl(
              localSummary?.coverUrl ||
              d.images?.card ||
              d.image ||
              d.images?.hero ||
              defaults.cover
            );
            const galleryItems =
              Array.isArray(d.gallery) && d.gallery.length > 0
                ? d.gallery
                : Array.isArray(d.images?.gallery) && d.images.gallery.length > 0
                ? d.images.gallery
                : defaults.gallery;
            const photoCount =
              localSummary?.count ??
              (galleryItems.length > 0 ? galleryItems.length : cardImg ? 1 : 0);
            const IconComponent = getDestinationIcon(d.slug, d.tag);

            return (
              <Link to={`/destinations/${d.slug}`} className="dest-card" key={d.slug}>
                {/* Real Photographic Background */}
                <div className="dest-card__bg-wrap">
                  {cardImg ? (
                    <img
                      src={cardImg}
                      alt={d.name}
                      className="dest-card__bg-img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="dest-card__bg-placeholder">
                      <Mountains size={48} weight="duotone" />
                    </div>
                  )}
                  <div className="dest-card__overlay" />
                </div>

                {/* Top Floating Badges */}
                <div className="dest-card__top">
                  <div className="dest-card__icon-badge">
                    <IconComponent size={22} weight="duotone" />
                  </div>
                  <div className="dest-card__top-pills">
                    {photoCount > 0 && (
                      <span className="dest-card__photos-pill">
                        <Camera size={12} weight="bold" />
                        <span>{photoCount} {photoCount === 1 ? "Photo" : "Photos"}</span>
                      </span>
                    )}
                    {d.tag && <span className="dest-card__tag-pill">{d.tag}</span>}
                  </div>
                </div>

                {/* Bottom Body Content */}
                <div className="dest-card__body">
                  <h3 className="dest-card__title">{d.name}</h3>
                  <p className="dest-card__desc">{d.shortDescription || d.description}</p>

                  <div className="dest-card__footer">
                    <span className="dest-card__cta-btn">
                      <span>Explore {d.name}</span>
                      <ArrowUpRight size={15} weight="bold" className="dest-card__cta-arrow" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Green Lake Trek Expedition Card */}
          {trek && trek.active !== false && (() => {
            const trekDefaults = getDefaultDestinationPhotos("green-lake-trek");
            const trekSummary = photoSummaries["green-lake-trek"];
            const trekImg = unwrapImageUrl(
              trekSummary?.coverUrl ||
              trek.images?.card ||
              trek.image ||
              trek.images?.hero ||
              trekDefaults.cover
            );
            const trekGallery =
              Array.isArray(trek.gallery) && trek.gallery.length > 0
                ? trek.gallery
                : Array.isArray(trek.images?.gallery) && trek.images.gallery.length > 0
                ? trek.images.gallery
                : trekDefaults.gallery;
            const trekCount =
              trekSummary?.count ??
              (trekGallery.length > 0 ? trekGallery.length : trekImg ? 1 : 0);

            return (
              <Link to={`/destinations/${trek.slug}`} className="dest-card dest-card--expedition" key={trek.slug}>
                <div className="dest-card__bg-wrap">
                  {trekImg ? (
                    <img
                      src={trekImg}
                      alt={trek.name}
                      className="dest-card__bg-img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="dest-card__bg-placeholder">
                      <Backpack size={48} weight="duotone" />
                    </div>
                  )}
                  <div className="dest-card__overlay" />
                </div>

                <div className="dest-card__top">
                  <div className="dest-card__icon-badge dest-card__icon-badge--expedition">
                    <Backpack size={22} weight="duotone" />
                  </div>
                  <div className="dest-card__top-pills">
                    {trekCount > 0 && (
                      <span className="dest-card__photos-pill">
                        <Camera size={12} weight="bold" />
                        <span>{trekCount} Photos</span>
                      </span>
                    )}
                    <span className="dest-card__tag-pill dest-card__tag-pill--expedition">
                      {trek.badge || "Wilderness Expedition"}
                    </span>
                  </div>
                </div>

                <div className="dest-card__body">
                  <h3 className="dest-card__title">{trek.name}</h3>
                  <p className="dest-card__desc">
                    {trek.shortDescription || trek.description}
                  </p>

                  <div className="dest-card__footer">
                    <span className="dest-card__cta-btn dest-card__cta-btn--expedition">
                      <span>Explore Expedition</span>
                      <ArrowUpRight size={15} weight="bold" className="dest-card__cta-arrow" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })()}
        </div>
      </div>
    </section>
  );
}