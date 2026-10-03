import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { List, X, Ticket } from "phosphor-react";
import {
  getSiteLogoDetails,
} from "../data/contactSettings.js";
import "./Navbar.css";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Cars", path: "/car-booking" },
  { label: "Bikes", path: "/rental-bike" },
  { label: "Stays", path: "/hotel-homestay" },
  { label: "Permits", path: "/permit" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [logoDetails, setLogoDetails] = useState(getSiteLogoDetails());
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleStorage() {
      setLogoDetails(getSiteLogoDetails());
    }
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }

    document.addEventListener("keydown", handleEscape);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("admin-storage-changed", handleStorage);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("admin-storage-changed", handleStorage);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const logoH = logoDetails.height || 74;

  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div
        className="navbar__inner"
        style={{
          minHeight: `${Math.max(84, logoH + 14)}px`,
        }}
      >
        {/* Brand Area: Clean master brand anchored from the left end */}
        <Link
          to="/"
          className="navbar__brand"
          onClick={() => setOpen(false)}
        >
          {logoDetails.src ? (
            <div
              className={`navbar__brand-plaque navbar__brand-plaque--${logoDetails.plaqueStyle || "transparent"} navbar__brand-plaque--${logoDetails.shape || "natural"}`}
            >
              <img
                src={logoDetails.src}
                alt="Lama Bhai Tourism & Hospitality, Sikkim"
                className={`navbar__logo navbar__logo--${logoDetails.shape || "natural"}`}
                style={{
                  height: `${logoH}px`,
                  maxHeight: `${logoH}px`,
                  width: "auto",
                  maxWidth: "360px",
                  objectFit: "contain",
                  objectPosition: "left center",
                  display: "block",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          ) : null}

          {(logoDetails.showBrandText || !logoDetails.src) && (
            <div className="navbar__brand-text">
              <span className="navbar__brand-title">Lama Bhai</span>
              <span className="navbar__brand-sub">Tours &amp; Travels &bull; Sikkim</span>
            </div>
          )}
        </Link>

        {/* Right side container grouping clean navigation links and action buttons */}
        <div className="navbar__right">
          <nav className={`navbar__links ${open ? "navbar__links--open" : ""}`} aria-label="Main navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === "/"}
                className={({ isActive }) =>
                  `navbar__link ${isActive ? "navbar__link--active" : ""}`
                }
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}

            <Link
              to="/plan-trip"
              className="navbar__cta navbar__cta--drawer"
              onClick={() => setOpen(false)}
            >
              Plan My Trip
            </Link>
          </nav>

          {/* Action Group: Manage Booking + Plan My Trip CTA */}
          <div className="navbar__actions">
            <NavLink
              to="/manage-booking"
              className={({ isActive }) =>
                `navbar__manage-btn ${isActive ? "navbar__manage-btn--active" : ""}`
              }
              title="Track or cancel your booking"
              onClick={() => setOpen(false)}
            >
              <Ticket size={16} weight="bold" />
              <span className="navbar__manage-text">Manage Booking</span>
            </NavLink>

            <Link
              to="/plan-trip"
              className="navbar__cta navbar__cta--desktop"
              onClick={() => setOpen(false)}
            >
              Plan My Trip
            </Link>

            <button
              type="button"
              className="navbar__toggle"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={24} /> : <List size={24} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}