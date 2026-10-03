import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowDown,
  Car,
  Bed,
  Bicycle,
  IdentificationCard,
  MapPin,
  Mountains,
  Broadcast,
  ShieldCheck,
} from "phosphor-react";
import {
  ModernPhoneIcon,
  ModernWhatsAppIcon,
  ModernInstagramIcon,
  ModernFacebookIcon,
} from "./SocialIcons.jsx";
import { heroImage, heroImageAlt } from "../data/heroImage.js";
import {
  getContactSettings,
  buildPhoneLink,
  buildWhatsAppLink,
  buildInstagramLink,
  buildFacebookLink,
} from "../data/contactSettings.js";
import {
  getLiveRoutes,
  ROUTE_STATUS_CONFIG,
} from "../data/liveRoutesStore.js";
import OptimizedImage from "./OptimizedImage.jsx";
import "./Hero.css";

export default function Hero() {
  const [contactSettings, setContactSettings] = useState(getContactSettings());
  const [liveRoutes, setLiveRoutes] = useState(getLiveRoutes());
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    function refreshData() {
      setContactSettings(getContactSettings());
      setLiveRoutes(getLiveRoutes());
    }
    window.addEventListener("storage", refreshData);
    window.addEventListener("admin-storage-changed", refreshData);
    return () => {
      window.removeEventListener("storage", refreshData);
      window.removeEventListener("admin-storage-changed", refreshData);
    };
  }, []);

  const phoneLink = buildPhoneLink(contactSettings.phone);
  const whatsappLink = buildWhatsAppLink(contactSettings.whatsapp);
  const instagramLink = buildInstagramLink(contactSettings.instagram);
  const facebookLink = buildFacebookLink(contactSettings.facebook);
  const locationBadge = contactSettings.locationBadge || "Sikkim • Eastern Himalayas";
  const currentHeroPhoto = contactSettings.heroImageCustom || heroImage;

  return (
    <section className="hero">
      <div className="hero__content">
        {/* Live Mountain Dispatch Eyebrow */}
        <div className="hero__live-radar-badge" role="status" aria-live="polite">
          <span className="hero__live-radar-pulse" aria-hidden="true">
            <span className="hero__live-radar-core" />
          </span>
          <span className="hero__live-radar-title">LIVE HIMALAYAN PASS CLEARANCE</span>
          <span className="hero__live-radar-divider" aria-hidden="true">•</span>
          <span className="hero__live-radar-update">MANGAN BASE DESK</span>
        </div>

        <h1 className="hero__heading">
          Every Mountain Pass. Every Border Route.
          <br />
          Monitored Live from Mangan Base.
        </h1>

        <p className="hero__sub">
          Real-time road access, high-altitude advisories, and defense checkpost permits across Sikkim.
        </p>

        {/* Structured Live Route Clearance Board with Individual Place Statuses */}
        <div className="hero__dispatch-board" role="region" aria-label="Sikkim Mountain Route Live Dispatch">
          {/* Header */}
          <div className="hero__dispatch-header">
            <div className="hero__dispatch-title-wrap">
              <Broadcast size={16} weight="duotone" className="hero__dispatch-icon" />
              <span className="hero__dispatch-title">Sikkim Mountain Route Clearance Status</span>
            </div>
            <span className="hero__dispatch-live-tag">
              <span className="hero__dispatch-live-dot" />
              <span>Live Ground Status</span>
            </span>
          </div>

          {/* Individual Place Status Cards Grid (Spacious 2-column layout filling available space) */}
          <div className="hero__routes-grid">
            {liveRoutes.map((route) => {
              const cfg = ROUTE_STATUS_CONFIG[route.status] || ROUTE_STATUS_CONFIG.open;
              const statusTextColor =
                cfg.color === "#22c55e"
                  ? "#15803d"
                  : cfg.color === "#f59e0b"
                  ? "#92400e"
                  : cfg.color === "#38bdf8"
                  ? "#0369a1"
                  : "#991b1b";

              return (
                <div key={route.id} className="hero__route-card">
                  <div className="hero__route-card-top">
                    <div className="hero__route-card-heading">
                      <span className="hero__route-name">{route.name}</span>
                      <span className="hero__route-alt">{route.altitude}</span>
                    </div>
                    <div
                      className="hero__route-status-pill"
                      style={{
                        background: cfg.bg,
                        color: statusTextColor,
                        borderColor: cfg.border,
                      }}
                    >
                      <span
                        className="hero__route-status-dot"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span>{cfg.shortLabel}</span>
                    </div>
                  </div>

                  <p className="hero__route-desc">{route.note}</p>

                  <div className="hero__route-card-bottom">
                    <span className="hero__route-region">{route.region}</span>
                    {route.recommendedVehicle && (
                      <span className="hero__route-vehicle">🚗 {route.recommendedVehicle}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Board Footer / Ground Guarantee */}
          <div className="hero__dispatch-footer">
            <div className="hero__dispatch-guarantee">
              <ShieldCheck size={16} weight="fill" className="hero__guarantee-icon" />
              <span>Official Checkpost Clearance Guarantee • Direct Local Pilot Network</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hero__right-col">

      {/* Interactive Hero Card */}
      <div className="hero-card" role="region" aria-label="Sikkim Mountain Travel Hub">
        {/* Top Scenic Window */}
        <div
          className="hero-card__media"
          style={contactSettings.heroImageCustom ? { backgroundImage: `url("${contactSettings.heroImageCustom}")` } : undefined}
        >
          {currentHeroPhoto && (
            <OptimizedImage
              src={currentHeroPhoto}
              alt={heroImageAlt}
              priority={true}
              sizes="(max-width: 640px) 100vw, 430px"
              className="hero-card__image-wrap"
              imgClassName="hero-card__image"
            />
          )}
          <div className="hero-card__media-overlay" />
          <div className="hero-card__badge">
            <MapPin size={13} weight="fill" color="var(--color-peach)" />
            <span>{locationBadge}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="hero-card__body">
          {/* Services Available Badges (Non-clickable showcase) */}
          <div className="hero-card__services-box">
            <div className="hero-card__services-grid">
              <div className="hero-card__svc-badge" title="Homestays & Boutique Stays">
                <Bed size={15} weight="duotone" />
                <span>Stays</span>
              </div>
              <div className="hero-card__svc-badge" title="Mountain SUVs & Cabs">
                <Car size={15} weight="duotone" />
                <span>Cars</span>
              </div>
              <div className="hero-card__svc-badge" title="Adventure Touring Bikes">
                <Bicycle size={15} weight="duotone" />
                <span>Bikes</span>
              </div>
              <div className="hero-card__svc-badge" title="North Sikkim & Border Permits">
                <IdentificationCard size={15} weight="duotone" />
                <span>Permits</span>
              </div>
            </div>
          </div>

          {/* Direct Connect Section */}
          <div className="hero-card__connect-box">
            <div className="hero-card__connect-header">
              <span className="hero-card__connect-title">Direct Connect</span>
              <span className="hero-card__connect-sub">Local Support Desk</span>
            </div>

            <div className="hero-card__channels-grid">
              {/* Phone Channel */}
              <a
                href={phoneLink}
                className="hero-card__channel hero-card__channel--phone"
                title={`Direct Call: ${contactSettings.phone || "+91 98000 12345"}`}
              >
                <div className="hero-card__channel-icon-wrap hero-card__channel-icon-wrap--phone">
                  <ModernPhoneIcon size={18} />
                </div>
                <div className="hero-card__channel-meta">
                  <span className="hero-card__channel-name">Phone</span>
                  <span className="hero-card__channel-val">Call Now</span>
                </div>
              </a>

              {/* WhatsApp Channel */}
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-card__channel hero-card__channel--whatsapp"
                title={`Chat directly on WhatsApp: ${contactSettings.whatsapp || "+91 98000 12345"}`}
              >
                <div className="hero-card__channel-icon-wrap hero-card__channel-icon-wrap--whatsapp">
                  <ModernWhatsAppIcon size={19} />
                </div>
                <div className="hero-card__channel-meta">
                  <span className="hero-card__channel-name">WhatsApp</span>
                  <span className="hero-card__channel-val">Chat Now</span>
                </div>
              </a>

              {/* Instagram Channel */}
              <a
                href={instagramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-card__channel hero-card__channel--instagram"
                title="Follow Lama Bhai on Instagram"
              >
                <div className="hero-card__channel-icon-wrap hero-card__channel-icon-wrap--instagram">
                  <ModernInstagramIcon size={18} />
                </div>
                <div className="hero-card__channel-meta">
                  <span className="hero-card__channel-name">Instagram</span>
                  <span className="hero-card__channel-val">Follow Us</span>
                </div>
              </a>

              {/* Facebook Channel */}
              <a
                href={facebookLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-card__channel hero-card__channel--facebook"
                title="Visit Lama Bhai Facebook Page"
              >
                <div className="hero-card__channel-icon-wrap hero-card__channel-icon-wrap--facebook">
                  <ModernFacebookIcon size={18} />
                </div>
                <div className="hero-card__channel-meta">
                  <span className="hero-card__channel-name">Facebook</span>
                  <span className="hero-card__channel-val">Visit Page</span>
                </div>
              </a>
            </div>
          </div>

          {/* Action CTA Button */}
          <Link to="/plan-trip" className="hero-card__plan-btn" title="Plan your entire Sikkim trip with Lama Bhai">
            <span>Plan Entire Trip</span>
            <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      </div>

      {/* Mangan Base Ground Intelligence Unit (Fills right column space harmoniously) */}
      <div className="hero-ops-unit">
          <div className="hero-ops-unit__header">
            <span className="hero-ops-unit__pulse-wrap">
              <span className="hero-ops-unit__pulse-dot" />
            </span>
            <span className="hero-ops-unit__title">MANGAN BASE OPERATIONS DESK</span>
          </div>
          <div className="hero-ops-unit__grid">
            <div className="hero-ops-unit__item">
              <span className="hero-ops-unit__val">Mangan, North Sikkim</span>
              <span className="hero-ops-unit__lbl">Operating HQ</span>
            </div>
            <div className="hero-ops-unit__item">
              <span className="hero-ops-unit__val">7 AM – 9 PM Daily</span>
              <span className="hero-ops-unit__lbl">Checkpost Hours</span>
            </div>
            <div className="hero-ops-unit__item">
              <span className="hero-ops-unit__val">Mountain 4x4 Fleet</span>
              <span className="hero-ops-unit__lbl">Alpine Clearance Ready</span>
            </div>
            <div className="hero-ops-unit__item">
              <span className="hero-ops-unit__val">Same-Day Clearance</span>
              <span className="hero-ops-unit__lbl">Army & Police Permits</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}