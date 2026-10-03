import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Car, Bed, Bicycle, IdentificationCard, ArrowUpRight, Sparkle } from "phosphor-react";
import { getExploreWays } from "../data/exploreWaysData.js";
import "./ExploreWays.css";

const ICON_MAP = {
  cars: Car,
  stays: Bed,
  bikes: Bicycle,
  permits: IdentificationCard,
};

export default function ExploreWays() {
  const [items, setItems] = useState(getExploreWays);

  useEffect(() => {
    function refresh() {
      setItems(getExploreWays());
    }

    window.addEventListener("explore-ways-changed", refresh);
    window.addEventListener("admin-storage-changed", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("explore-ways-changed", refresh);
      window.removeEventListener("admin-storage-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <section className="explore" aria-label="Explore Sikkim Services">
      <div className="explore__inner">
        <div className="explore__header">
          <span className="explore__eyebrow">
            <Sparkle size={14} weight="fill" /> Authentic Mountain Travel
          </span>
          <h2 className="explore__heading">Choose your way to explore Sikkim</h2>
          <p className="explore__subtitle">
            From rugged 4x4 mountain drives and serene homestays to high-pass motorcycle tours and seamless border permits.
          </p>
        </div>

        <div className="explore__grid">
          {items.map((item) => {
            const IconComponent = ICON_MAP[item.id] || Car;

            return (
              <Link to={item.path} key={item.id} className="explore-card">
                {/* Real Photographic Background */}
                <div className="explore-card__bg-wrap">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="explore-card__bg-img"
                    loading="lazy"
                  />
                  <div className="explore-card__overlay" />
                </div>

                {/* Top Badge & Floating Icon */}
                <div className="explore-card__top">
                  <div className="explore-card__icon-badge">
                    <IconComponent size={22} weight="duotone" />
                  </div>
                  {item.tag && (
                    <span className="explore-card__tag-pill">{item.tag}</span>
                  )}
                </div>

                {/* Bottom Content Area */}
                <div className="explore-card__body">
                  <h3 className="explore-card__title">{item.title}</h3>
                  <p className="explore-card__desc">{item.desc}</p>

                  <div className="explore-card__footer">
                    <span className="explore-card__cta-btn">
                      <span>{item.cta}</span>
                      <ArrowUpRight size={15} weight="bold" className="explore-card__cta-arrow" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}