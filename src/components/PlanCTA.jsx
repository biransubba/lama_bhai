import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkle,
  ArrowRight,
  WhatsappLogo,
  Car,
  HouseLine,
  Bicycle,
  IdentificationCard,
  ShieldCheck,
  CheckCircle,
  Clock,
  Compass,
} from "phosphor-react";
import { getContactSettings } from "../data/contactSettings.js";
import mountainHeroBg from "url:../assets/images/sikkim-mountains.jpg";
import "./PlanCTA.css";

const quickServices = [
  { label: "4x4 Mountain Cars", path: "/car-booking", icon: Car },
  { label: "Boutique Stays", path: "/hotel-homestay", icon: HouseLine },
  { label: "Adventure Bikes", path: "/rental-bike", icon: Bicycle },
  { label: "Border Permits", path: "/permit", icon: IdentificationCard },
];

export default function PlanCTA() {
  const [contact, setContact] = useState(getContactSettings);

  useEffect(() => {
    function handleUpdate() {
      setContact(getContactSettings());
    }
    window.addEventListener("admin-storage-changed", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("admin-storage-changed", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const whatsappNumber = contact.whatsapp ? contact.whatsapp.replace(/\D/g, "") : "919800012345";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Hello Lama Bhai! I would like to plan a Sikkim trip."
  )}`;

  return (
    <section className="plan-cta" id="plan-cta-section" aria-label="Plan your Sikkim trip">
      <div className="plan-cta__container">
        {/* Background Visual Texture with Visible Mountains & Scenery */}
        <div className="plan-cta__bg-wrap">
          <img
            src={mountainHeroBg}
            alt="Sikkim Eastern Himalayas"
            className="plan-cta__bg-img"
            loading="lazy"
          />
          <div className="plan-cta__overlay" />
        </div>

        {/* Content Area - Compact, Sleek & Dynamic */}
        <div className="plan-cta__content">
          <span className="plan-cta__eyebrow">
            <Sparkle size={13} weight="fill" /> Bespoke Himalayan Journeys
          </span>

          <h2 className="plan-cta__heading">
            Ready to plan your Sikkim journey?
          </h2>

          <p className="plan-cta__sub">
            Cars, traditional homestays, adventure bikes, or border permits — tailored around your pace by local people who know these mountains.
          </p>

          {/* Action Buttons */}
          <div className="plan-cta__actions">
            <Link to="/plan-trip" className="plan-cta__btn-primary">
              <Compass size={17} weight="bold" />
              <span>Plan My Custom Trip</span>
              <ArrowRight size={16} weight="bold" className="plan-cta__arrow" />
            </Link>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="plan-cta__btn-secondary"
            >
              <WhatsappLogo size={18} weight="fill" className="plan-cta__wa-icon" />
              <span>Quick WhatsApp</span>
            </a>
          </div>

          {/* Quick-Access Exploration Chips */}
          <div className="plan-cta__chips-row">
            {quickServices.map((s) => {
              const Icon = s.icon;
              return (
                <Link to={s.path} key={s.path} className="plan-cta__chip">
                  <Icon size={14} weight="duotone" />
                  <span>{s.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Bottom Trust & Reassurance Badges */}
          <div className="plan-cta__trust-strip">
            <span className="plan-cta__trust-item">
              <ShieldCheck size={14} weight="fill" className="plan-cta__trust-icon" />
              <span>Guaranteed PAP Permits</span>
            </span>
            <span className="plan-cta__trust-dot">•</span>
            <span className="plan-cta__trust-item">
              <CheckCircle size={14} weight="fill" className="plan-cta__trust-icon" />
              <span>100% Local Drivers</span>
            </span>
            <span className="plan-cta__trust-dot">•</span>
            <span className="plan-cta__trust-item">
              <Clock size={14} weight="fill" className="plan-cta__trust-icon" />
              <span>Direct 24/7 Support</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}