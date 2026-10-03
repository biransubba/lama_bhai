import React, { useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import {
  SquaresFour,
  HouseLine,
  CalendarCheck,
  ImageSquare,
  ListChecks,
  UserCircle,
  UserSwitch,
  ArrowSquareOut,
  MapPin,
  CheckCircle,
  SignOut,
  ShieldWarning,
  Tag,
} from "phosphor-react";
import { usePartnerAuth } from "../context/PartnerAuthContext.jsx";
import PartnerLogin from "../pages/PartnerLogin.jsx";
import "../styles/partner.css";

export default function PartnerLayout() {
  const {
    currentPartner,
    isApproved,
    approvedPartners,
    partnerStays,
    partnerOffers,
    partnerBookings,
    loginAsPartner,
    logoutPartner,
  } = usePartnerAuth();

  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const navigate = useNavigate();

  // If no partner is logged in, show the login / selector view directly
  if (!currentPartner) {
    return <PartnerLogin />;
  }

  // Requirement 5: Prevent unapproved, pending, rejected, or suspended partners
  // from being treated as active partners in the frontend simulation (/partner).
  if (!isApproved) {
    const status = currentPartner.status || "Pending";
    const statusConfigs = {
      Pending: {
        title: "Partnership Application Under Review",
        color: "#b45309",
        bg: "#fef3c7",
        border: "#fde68a",
        badgeBg: "#fffbeb",
        message:
          "Your partnership request has been recorded and is currently PENDING review by Lama Bhai Tourism Main Admin. Once approved, the admin will link your properties and grant access to this host portal.",
      },
      Suspended: {
        title: "Partner Account Suspended",
        color: "#b91c1c",
        bg: "#fee2e2",
        border: "#fecaca",
        badgeBg: "#fef2f2",
        message:
          "This partner account is temporarily suspended by Lama Bhai Tourism Main Admin. Access to host property controls, availability toggles, and guest booking requests is currently disabled.",
      },
      Rejected: {
        title: "Partnership Application Rejected",
        color: "#991b1b",
        bg: "#fee2e2",
        border: "#fecaca",
        badgeBg: "#fef2f2",
        message:
          "This partnership application was reviewed and not approved by Lama Bhai Tourism administration.",
      },
      Inactive: {
        title: "Partner Account Inactive",
        color: "#475569",
        bg: "#f1f5f9",
        border: "#e2e8f0",
        badgeBg: "#f8fafc",
        message:
          "This partner account has been deactivated by administration.",
      },
    };

    const cfg = statusConfigs[status] || statusConfigs.Pending;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "var(--color-cream)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            width: "100%",
            background: "#ffffff",
            borderRadius: "var(--radius-md)",
            border: `1px solid ${cfg.border}`,
            padding: "32px 28px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: cfg.bg,
              color: cfg.color,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <ShieldWarning size={36} weight="duotone" />
          </div>

          <span
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "0.8rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              background: cfg.bg,
              color: cfg.color,
              marginBottom: "12px",
            }}
          >
            Status: {status}
          </span>

          <h1
            style={{
              fontSize: "1.5rem",
              color: "var(--color-navy)",
              margin: "0 0 10px",
              fontFamily: "var(--font-display)",
            }}
          >
            {cfg.title}
          </h1>

          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "0.92rem",
              lineHeight: 1.55,
              margin: "0 0 24px",
            }}
          >
            {cfg.message}
          </p>

          <div
            style={{
              background: "var(--color-cream)",
              borderRadius: "var(--radius-sm)",
              padding: "16px",
              textAlign: "left",
              fontSize: "0.85rem",
              marginBottom: "24px",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ marginBottom: "6px" }}>
              <strong style={{ color: "var(--color-navy)" }}>Host / Applicant:</strong>{" "}
              {currentPartner.name}
            </div>
            <div style={{ marginBottom: "6px" }}>
              <strong style={{ color: "var(--color-navy)" }}>Homestay / Business:</strong>{" "}
              {currentPartner.agency || "N/A"}
            </div>
            <div style={{ marginBottom: "6px" }}>
              <strong style={{ color: "var(--color-navy)" }}>Base Location:</strong>{" "}
              {currentPartner.location}
            </div>
            <div style={{ marginBottom: "6px" }}>
              <strong style={{ color: "var(--color-navy)" }}>Partner ID:</strong>{" "}
              <code>{currentPartner.id}</code>
            </div>
            {currentPartner.reviewerNotes && (
              <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed var(--color-border)" }}>
                <strong style={{ color: "var(--color-navy)" }}>Admin Notes:</strong>{" "}
                <span style={{ color: cfg.color, fontWeight: 600 }}>{currentPartner.reviewerNotes}</span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => logoutPartner()}
              style={{
                background: "var(--color-navy)",
                color: "#ffffff",
                border: "none",
                padding: "10px 18px",
                borderRadius: "var(--radius-sm)",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <SignOut size={16} /> Switch Host Profile
            </button>
            <Link
              to="/"
              style={{
                background: "var(--color-surface)",
                color: "var(--color-navy)",
                border: "1px solid var(--color-border)",
                padding: "10px 18px",
                borderRadius: "var(--radius-sm)",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              Return to Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const newBookingsCount = partnerBookings.filter((b) => b.status === "New").length;
  const availableStaysCount = partnerStays.filter((s) => s.availability === "available").length;
  const activeOffersCount = partnerOffers.filter((o) => o.active === true || o.active === "true").length;

  const navItems = [
    {
      label: "Dashboard",
      path: "/partner",
      end: true,
      icon: <SquaresFour size={18} weight="duotone" />,
    },
    {
      label: "My Properties",
      path: "/partner/properties",
      end: false,
      icon: <HouseLine size={18} weight="duotone" />,
      badge: partnerStays.length,
    },
    {
      label: "Availability",
      path: "/partner/availability",
      end: false,
      icon: <CalendarCheck size={18} weight="duotone" />,
      badge: `${availableStaysCount}/${partnerStays.length} Avail`,
      badgeColor: availableStaysCount === 0 && partnerStays.length > 0 ? "#b71c1c" : null,
    },
    ...(partnerStays.length > 0
      ? [
          {
            label: "Special Offers",
            path: "/partner/offers",
            end: false,
            icon: <Tag size={18} weight="duotone" />,
            badge: activeOffersCount > 0 ? `${activeOffersCount} Active` : (partnerOffers.length > 0 ? partnerOffers.length : null),
            badgeColor: activeOffersCount > 0 ? "var(--color-peach-deep)" : null,
          },
        ]
      : []),
    {
      label: "Photos",
      path: "/partner/photos",
      end: false,
      icon: <ImageSquare size={18} weight="duotone" />,
    },
    {
      label: "Booking Requests",
      path: "/partner/bookings",
      end: false,
      icon: <ListChecks size={18} weight="duotone" />,
      badge: newBookingsCount > 0 ? `${newBookingsCount} New` : partnerBookings.length,
      badgeColor: newBookingsCount > 0 ? "#b71c1c" : null,
    },
    {
      label: "Profile",
      path: "/partner/profile",
      end: false,
      icon: <UserCircle size={18} weight="duotone" />,
    },
  ];

  return (
    <div className="partner-layout">
      {/* Sidebar */}
      <aside className="partner-sidebar">
        <div className="partner-sidebar__brand">
          <h2 className="partner-sidebar__brand-title">Lama Bhai</h2>
          <span className="partner-sidebar__brand-sub">Host Partner Portal</span>
        </div>

        {/* Current Host Profile Card */}
        <div className="partner-profile-card">
          <div className="partner-profile-name">{currentPartner.name}</div>
          <div className="partner-profile-agency">{currentPartner.agency || "Local Host Coordinator"}</div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", marginTop: "4px" }}>
            <span className="partner-profile-badge">
              <CheckCircle size={12} weight="fill" /> Approved Host
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                fontSize: "0.7rem",
                color: "var(--color-peach-light)",
                fontWeight: 600,
              }}
            >
              <MapPin size={12} /> {currentPartner.location}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="partner-sidebar__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `partner-sidebar__link ${isActive ? "partner-sidebar__link--active" : ""}`
              }
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== null && item.badge !== undefined && (
                <span
                  className="partner-sidebar__badge"
                  style={item.badgeColor ? { background: item.badgeColor } : {}}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="partner-sidebar__footer">
          <button
            type="button"
            className="partner-sidebar__btn partner-sidebar__btn--switch"
            onClick={() => setShowSwitchModal(true)}
            title="Switch to another partner for testing"
          >
            <UserSwitch size={15} /> Switch Host Profile
          </button>

          <Link
            to="/"
            className="partner-sidebar__btn partner-sidebar__btn--exit"
            title="Return to public travel site"
          >
            <ArrowSquareOut size={15} /> Public Website
          </Link>

          <button
            type="button"
            className="partner-sidebar__btn partner-sidebar__btn--exit"
            onClick={() => {
              logoutPartner();
              navigate("/partner");
            }}
            style={{ color: "#ef9a9a" }}
          >
            <SignOut size={15} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="partner-main">
        {/* Frontend Role Simulation Disclaimer (Requirements 6, 7, 9) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            background: "#fffbeb",
            border: "1px solid #fef3c7",
            borderLeft: "4px solid #f59e0b",
            borderRadius: "var(--radius-sm)",
            padding: "8px 14px",
            marginBottom: "var(--space-md)",
            fontSize: "0.8rem",
            color: "#92400e",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldWarning size={16} color="#d97706" style={{ flexShrink: 0 }} />
            <span>
              <strong>Frontend Role Simulation:</strong> Active as <strong>{currentPartner.name}</strong> ({currentPartner.agency}). Scoped strictly to your {partnerStays.length} assigned property records.
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "#b45309", fontStyle: "italic" }}>
            Prototype simulation — server-side authorization will be implemented in backend.
          </span>
        </div>

        <Outlet />
      </main>

      {/* Switch Host Modal */}
      {showSwitchModal && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setShowSwitchModal(false)}
        >
          <div
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px" }}
          >
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontSize: "1.15rem", color: "var(--color-navy)" }}>
                Switch Host Profile
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setShowSwitchModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: 0 }}>
                Select a different approved partner to simulate their individual scoped view:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {approvedPartners.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      loginAsPartner(p.id);
                      setShowSwitchModal(false);
                    }}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      borderRadius: "var(--radius-sm)",
                      border: p.id === currentPartner.id ? "2px solid var(--color-peach-deep)" : "1px solid var(--color-border)",
                      background: p.id === currentPartner.id ? "var(--color-peach-light)" : "var(--color-surface)",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <strong style={{ display: "block", color: "var(--color-navy)", fontSize: "0.92rem" }}>
                        {p.name} {p.id === currentPartner.id && "(Active)"}
                      </strong>
                      <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                        {p.agency} · {p.location}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "3px 8px",
                        borderRadius: "999px",
                        background: "#e8f5e9",
                        color: "#1b5e20",
                        fontWeight: 700,
                      }}
                    >
                      {(p.assignedPropertyIds || []).length} Stays
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => setShowSwitchModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
