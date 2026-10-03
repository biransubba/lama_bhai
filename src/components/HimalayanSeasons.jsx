import React, { useState, useEffect, useRef } from "react";
import {
  Sparkle,
  ThermometerSimple,
  Mountains,
  FlowerLotus,
  Compass,
} from "phosphor-react";
import springImg from "url:../assets/images/seasons/spring-rhododendron.jpg";
import summerImg from "url:../assets/images/seasons/summer-waterfalls.jpg";
import autumnImg from "url:../assets/images/seasons/autumn-kanchenjunga.jpg";
import winterImg from "url:../assets/images/seasons/winter-snow.jpg";
import "./HimalayanSeasons.css";

const SEASONS_DATA = [
  {
    id: "spring",
    seasonName: "Spring Blossoms",
    months: "March – May",
    location: "Yumthang Valley & Lachen Sanctuary",
    altitude: "12,000 ft",
    image: springImg,
    alt: "Spring season in Yumthang Valley Sikkim with blooming rhododendrons, snow mountains and prayer flags",
    highlight: "Rhododendrons & Orchids in Full Bloom",
    description:
      "The entire valley transforms into a living tapestry of wild rhododendrons, blooming noble orchids, and melting glacial streams beneath towering Himalayan summits.",
    temp: "10°C to 18°C",
    scenery: "Valley of Flowers & Clear Morning Mountain Passes",
    stateFlora: "Noble Dendrobium Orchid (Sikkim State Flower)",
    accentColor: "#f472b6",
  },
  {
    id: "summer",
    seasonName: "Emerald Summer",
    months: "June – August",
    location: "Dzongu Protected Reserve & Teesta Valleys",
    altitude: "5,200 ft",
    image: summerImg,
    alt: "Summer season in Dzongu Sikkim with cascading alpine waterfalls and lush emerald pine forests",
    highlight: "Cascading Waterfalls & Misty Emerald Valleys",
    description:
      "Roaring mountain waterfalls tumble into turquoise rivers while soft clouds and mist carpet the terraced valleys, ancient pine canopies, and sacred Lepcha footbridges.",
    temp: "16°C to 23°C",
    scenery: "Gushing Waterfalls & Cloud-Kissed Monastery Valleys",
    stateFlora: "Wild Mountain Orchids & Lush Pine Canopies",
    accentColor: "#34d399",
  },
  {
    id: "autumn",
    seasonName: "Golden Autumn",
    months: "September – November",
    location: "Mt. Kanchenjunga Viewpoints & Zuluk",
    altitude: "8,586m / 9,400 ft",
    image: autumnImg,
    alt: "Golden Autumn sunrise over Mount Kanchenjunga snow peaks with prayer flags in Sikkim",
    highlight: "Peak Kanchenjunga Golden Sunrise",
    description:
      "The clearest skies of the year. Sunrise paints the five sacred summits of Mt. Kanchenjunga in dazzling molten gold as colorful prayer flags flutter against deep sapphire skies.",
    temp: "8°C to 16°C",
    scenery: "100% High-Peak Visibility & Crisp Alpine Horizons",
    stateFlora: "Alpine Asters & Sacred Highland Juniper",
    accentColor: "#fbbf24",
  },
  {
    id: "winter",
    seasonName: "Alpine Winter",
    months: "December – February",
    location: "Gurudongmar Lake & Zero Point Glacier",
    altitude: "17,800 ft",
    image: winterImg,
    alt: "Winter season at Gurudongmar Lake and Zero Point Sikkim with frozen lake and snow mountains",
    highlight: "Sub-Zero Frozen Lakes & Pure Snow Blankets",
    description:
      "A surreal high-altitude white desert. Gurudongmar Lake freezes into crystalline turquoise ice while Zero Point is blanketed in deep, untouched alpine snow.",
    temp: "-8°C to 5°C",
    scenery: "Glacial Ice Formations & High-Pass Snowfields",
    stateFlora: "Winter Daphne & High Altitude Conifers",
    accentColor: "#38bdf8",
  },
];

// Authentic 5-color Tibetan Lungta prayer flags
const PRAYER_FLAGS = [
  { color: "#2563eb", name: "Blue (Sky)", symbol: "☸" },
  { color: "#f8fafc", name: "White (Air)", symbol: "༄" },
  { color: "#dc2626", name: "Red (Fire)", symbol: "♨" },
  { color: "#16a34a", name: "Green (Water)", symbol: "☘" },
  { color: "#eab308", name: "Yellow (Earth)", symbol: "☀" },
  { color: "#2563eb", name: "Blue (Sky)", symbol: "☸" },
  { color: "#f8fafc", name: "White (Air)", symbol: "༄" },
  { color: "#dc2626", name: "Red (Fire)", symbol: "♨" },
  { color: "#16a34a", name: "Green (Water)", symbol: "☘" },
  { color: "#eab308", name: "Yellow (Earth)", symbol: "☀" },
  { color: "#2563eb", name: "Blue (Sky)", symbol: "☸" },
  { color: "#f8fafc", name: "White (Air)", symbol: "༄" },
  { color: "#dc2626", name: "Red (Fire)", symbol: "♨" },
  { color: "#16a34a", name: "Green (Water)", symbol: "☘" },
  { color: "#eab308", name: "Yellow (Earth)", symbol: "☀" },
];

export default function HimalayanSeasons() {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef(null);

  // Fully automatic, continuous seasonal reel cycling every 5.5 seconds
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SEASONS_DATA.length);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSeasonClick = (idx) => {
    setActiveIndex(idx);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % SEASONS_DATA.length);
      }, 5500);
    }
  };

  const currentSeason = SEASONS_DATA[activeIndex];

  return (
    <section
      className="him-cinema"
      aria-label="Cinematic Seasons of Sikkim"
    >
      <div className="him-cinema__container">
        {/* Main Widescreen Cinematic Showcase */}
        <div className="him-cinema__screen">
          {/* Real Photographic Background Layers with Smooth Cross-Fade & Ken Burns motion */}
          {SEASONS_DATA.map((season, idx) => {
            const isCurrent = idx === activeIndex;
            return (
              <div
                key={season.id}
                className={`him-cinema__photo-layer ${
                  isCurrent ? "him-cinema__photo-layer--active" : ""
                }`}
                style={{
                  backgroundImage: `url("${season.image}")`,
                }}
                role="img"
                aria-label={season.alt}
              />
            );
          })}

          {/* Vignette & Cinematic Atmospheric Gradients */}
          <div className="him-cinema__vignette" />
          <div className="him-cinema__gradient-bottom" />
          <div className="him-cinema__gradient-top" />

          {/* Fluttering Himalayan Buddhist Lungta Flags across the mountain pass */}
          <div className="him-cinema__flags-row" aria-hidden="true">
            {PRAYER_FLAGS.map((flag, idx) => (
              <div
                key={idx}
                className="him-cinema__flag"
                style={{
                  backgroundColor: flag.color,
                  color: flag.color === "#f8fafc" ? "#1e293b" : "#ffffff",
                  animationDelay: `${(idx * 0.18).toFixed(2)}s`,
                }}
              >
                <span className="him-cinema__flag-symbol">{flag.symbol}</span>
              </div>
            ))}
          </div>

          {/* Top Bar: Live Reel Eyebrow + Automatic Season Indicators */}
          <div className="him-cinema__top-controls">
            <div className="him-cinema__eyebrow">
              <span className="him-cinema__live-dot" />
              <span className="him-cinema__eyebrow-text">
                AUTOMATIC SIKKIM 4-SEASON CINEMATIC REEL • 4K
              </span>
            </div>

            {/* Interactive Season Indicators (Auto-advancing) */}
            <div className="him-cinema__season-tabs">
              {SEASONS_DATA.map((season, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={season.id}
                    type="button"
                    className={`him-cinema__tab ${
                      isActive ? "him-cinema__tab--active" : ""
                    }`}
                    onClick={() => handleSeasonClick(idx)}
                    title={`View ${season.seasonName} in Sikkim`}
                  >
                    <span className="him-cinema__tab-title">{season.seasonName}</span>
                    <span className="him-cinema__tab-sub">{season.months}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Information Glass Overlay (Atmospheric & Descriptive, NO CTA links) */}
          <div className="him-cinema__bottom-overlay">
            <div className="him-cinema__scenic-meta">
              <div className="him-cinema__location-pill">
                <Compass size={14} weight="fill" color="var(--color-peach)" />
                <span className="him-cinema__loc-text">{currentSeason.location}</span>
                <span className="him-cinema__loc-divider">•</span>
                <span className="him-cinema__loc-alt">{currentSeason.altitude}</span>
              </div>

              <h3 className="him-cinema__headline">{currentSeason.highlight}</h3>
              <p className="him-cinema__desc">{currentSeason.description}</p>
            </div>

            {/* Scenic Profile Widget (No links or buttons) */}
            <div className="him-cinema__profile-box">
              <div className="him-cinema__profile-row">
                <div className="him-cinema__profile-item">
                  <div className="him-cinema__profile-icon-wrap">
                    <ThermometerSimple size={15} weight="bold" color="#38bdf8" />
                  </div>
                  <div className="him-cinema__profile-data">
                    <span className="him-cinema__profile-lbl">TEMPERATURE</span>
                    <span className="him-cinema__profile-val">{currentSeason.temp}</span>
                  </div>
                </div>

                <div className="him-cinema__profile-item">
                  <div className="him-cinema__profile-icon-wrap">
                    <FlowerLotus size={15} weight="duotone" color="#f472b6" />
                  </div>
                  <div className="him-cinema__profile-data">
                    <span className="him-cinema__profile-lbl">STATE BOTANICAL SYMBOL</span>
                    <span className="him-cinema__profile-val">{currentSeason.stateFlora}</span>
                  </div>
                </div>
              </div>

              <div className="him-cinema__profile-vista">
                <Mountains size={14} weight="duotone" color="var(--color-peach-light)" />
                <span>{currentSeason.scenery}</span>
              </div>
            </div>
          </div>

          {/* Automatic Timeline Progress Segments */}
          <div className="him-cinema__progress-bar">
            {SEASONS_DATA.map((_, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div key={idx} className="him-cinema__progress-track">
                  <div
                    key={`${idx}-${activeIndex}`}
                    className={`him-cinema__progress-fill ${
                      isActive ? "him-cinema__progress-fill--animate" : ""
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
