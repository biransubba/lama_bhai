import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  EnvelopeSimple,
  MapPin,
  Clock,
  Sparkle,
  ShieldCheck,
} from "phosphor-react";
import {
  getContactSettings,
  buildPhoneLink,
  buildWhatsAppLink,
  buildInstagramLink,
  buildFacebookLink,
} from "../data/contactSettings.js";
import {
  RealWhatsAppIcon,
  RealPhoneIcon,
  RealInstagramIcon,
  RealFacebookIcon,
} from "./SocialIcons.jsx";
import "./Footer.css";

const servicesLinks = [
  { label: "Cars & 4x4 Mountain SUVs", path: "/car-booking" },
  { label: "Curated Stays & Homestays", path: "/hotel-homestay" },
  { label: "Royal Enfield Adventure Bikes", path: "/rental-bike" },
  { label: "Protected Area Permits (PAP)", path: "/permit" },
  { label: "Bespoke Trip Planner", path: "/plan-trip" },
  { label: "Manage Booking (Track / Cancel)", path: "/manage-booking" },
];

const destinationLinks = [
  { label: "Lachen & Gurudongmar Lake", path: "/destinations/lachen" },
  { label: "Lachung & Yumthang Valley", path: "/destinations/lachung" },
  { label: "Zero Point (Yumesamdong)", path: "/destinations/zero-point" },
  { label: "Thangu & Chopta Valley", path: "/destinations/thangu" },
  { label: "Dzongu Protected Reserve", path: "/destinations/dzongu" },
  { label: "Green Lake Trek Expedition", path: "/destinations/green-lake-trek" },
  { label: "View All Destinations →", path: "/destinations" },
];

export default function Footer() {
  const [settings, setSettings] = useState(getContactSettings);

  useEffect(() => {
    function handleUpdate() {
      setSettings(getContactSettings());
    }
    window.addEventListener("admin-storage-changed", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("admin-storage-changed", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const phoneLink = buildPhoneLink(settings.phone);
  const whatsappLink = buildWhatsAppLink(
    settings.whatsapp,
    "Hello Lama Bhai! I would like to inquire about Sikkim travel arrangements."
  );
  const instagramLink = buildInstagramLink(settings.instagram);
  const facebookLink = buildFacebookLink(settings.facebook);

  // Dynamic copyright year configurable by Admin in Admin -> Settings
  const copyrightYear = settings.copyrightYear || new Date().getFullYear();

  return (
    <footer className="footer" aria-label="Lama Bhai Tourism Footer">
      <div className="footer__inner">
        {/* Column 1: Brand & Himalayan Operations */}
        <div className="footer__brand-col">
          <div className="footer__brand-header">
            {settings.logoCustom ? (
              <div className={`footer__brand-box footer__brand-box--${settings.logoShape || "natural"}`}>
                <img
                  src={settings.logoCustom}
                  alt="Lama Bhai Tourism"
                  className={`footer__brand-logo footer__brand-logo--${settings.logoShape || "natural"}`}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : null}
            <div className="footer__brand-header-text">
              <Link to="/" className="footer__brand-title">
                Lama Bhai Tourism
              </Link>
              <span className="footer__brand-tagline">
                <Sparkle size={11} weight="fill" /> Sikkim Himalayan Operations
              </span>
            </div>
          </div>

          <div className="footer__credentials">
            <div className="footer__cred-item">
              <MapPin size={15} weight="fill" className="footer__cred-icon" />
              <div className="footer__cred-content">
                <span className="footer__cred-label">Operating Base</span>
                <span className="footer__cred-val">{settings.operatingLocation || "Gangtok / Mangan, North Sikkim"}</span>
              </div>
            </div>

            <div className="footer__cred-item">
              <Clock size={15} weight="fill" className="footer__cred-icon" />
              <div className="footer__cred-content">
                <span className="footer__cred-label">Desk Hours</span>
                <span className="footer__cred-val">{settings.operatingHours || "7:00 AM – 9:00 PM IST (Daily)"}</span>
              </div>
            </div>

            <div className="footer__cred-item">
              <ShieldCheck size={15} weight="fill" className="footer__cred-icon" />
              <div className="footer__cred-content">
                <span className="footer__cred-label">Permit Facilitation</span>
                <span className="footer__cred-val">Sikkim Police &amp; Tourism Authorized</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Core Services */}
        <div className="footer__col">
          <h3 className="footer__col-heading">Services &amp; Bookings</h3>
          <nav className="footer__links">
            {servicesLinks.map((item) => (
              <Link key={item.path} to={item.path} className="footer__link">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Column 3: High Altitude Destinations */}
        <div className="footer__col">
          <h3 className="footer__col-heading">Sikkim Circuits</h3>
          <nav className="footer__links">
            {destinationLinks.map((item) => (
              <Link key={item.path} to={item.path} className="footer__link">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Column 4: Local Guest Desk */}
        <div className="footer__col footer__col--connect">
          <h3 className="footer__col-heading">Local Guest Desk</h3>
          <p className="footer__desk-desc">
            Direct assistance for bookings, permits, road conditions &amp; 24/7 mountain support.
          </p>

          <div className="footer__desk-actions">
            <a
              href={phoneLink}
              className="footer__desk-btn footer__desk-btn--phone"
              title="Call Local Desk"
              aria-label="Call Local Desk"
            >
              <RealPhoneIcon size={38} />
            </a>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="footer__desk-btn footer__desk-btn--wa"
              title="Instant WhatsApp Support"
              aria-label="Instant WhatsApp Support"
            >
              <RealWhatsAppIcon size={38} />
            </a>

            <a
              href={instagramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="footer__desk-btn footer__desk-btn--ig"
              title="Follow Lama Bhai on Instagram"
              aria-label="Follow on Instagram"
            >
              <RealInstagramIcon size={38} />
            </a>

            <a
              href={facebookLink}
              target="_blank"
              rel="noopener noreferrer"
              className="footer__desk-btn footer__desk-btn--fb"
              title="Visit Lama Bhai Facebook Page"
              aria-label="Follow on Facebook"
            >
              <RealFacebookIcon size={38} />
            </a>
          </div>

          {settings.contactEmail && (
            <a href={`mailto:${settings.contactEmail}`} className="footer__email-link">
              <EnvelopeSimple size={15} weight="bold" />
              <span>{settings.contactEmail}</span>
            </a>
          )}
        </div>
      </div>

      {/* Bottom Bar with Dynamic Copyright & Verification */}
      <div className="footer__bottom">
        <div className="footer__bottom-left">
          <span>© {copyrightYear} Lama Bhai Tourism &amp; Hospitality. All rights reserved.</span>
        </div>

        <div className="footer__bottom-center">
          <span className="footer__permit-note">
            Protected Area Permit (PAP) processing subject to Sikkim State Government &amp; Police checkpost regulations.
          </span>
        </div>

        <div className="footer__bottom-right">
          <span>Rooted in Sikkim • Eastern Himalayas</span>
        </div>
      </div>
    </footer>
  );
}