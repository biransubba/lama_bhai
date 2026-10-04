import React from "react";
import { NavLink, Outlet, Link, useNavigate, Navigate } from "react-router-dom";
import {
  SquaresFour,
  HouseLine,
  CalendarCheck,
  ImageSquare,
  ListChecks,
  UserCircle,
  ArrowSquareOut,
  MapPin,
  CheckCircle,
  SignOut,
  ShieldWarning,
  Tag,
} from "phosphor-react";
import { usePartnerAuth } from "../context/PartnerAuthContext.jsx";
import "../styles/partner.css";

export default function PartnerLayout() {
  const {
    user,
    loading,
    authenticated,
    currentPartner,
    isApproved,
    partnerStays,
    partnerOffers,
    partnerBookings,
    logoutPartner,
  } = usePartnerAuth();

  const navigate = useNavigate();

  // 1. Show elegant loading state while session verification (/api/auth/me) is in flight
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-cream)",
          fontFamily: "var(--font-sans)",
          color: "var(--color-navy)",
          gap: "14px",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            border: "3px solid var(--color-peach-light)",
            borderTopColor: "var(--color-peach-deep)",
            borderRadius: "50%",
            animation: "partner-spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes partner-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: "0.92rem", fontWeight: 600 }}>Verifying partner session...</span>
      </div>
    );
  }

  // 2. Protect route: If not authenticated, redirect to /partner/login (Requirement 6)
  if (!authenticated || !user || !currentPartner) {
    return <Navigate to="/partner/login" replace />;
  }

  // 3. Status restriction view for authenticated partners not yet Approved
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
              <strong style={{ color: "var(--color-navy)" }}>Email:</strong>{" "}
              {currentPartner.email}
            </div>
            <div style={{ marginBottom: "6px" }}>
              <strong style={{ color: "var(--color-navy)" }}>Homestay / Business:</strong>{" "}
              {currentPartner.agency || "N/A"}
            </div>
            <div style={{ marginBottom: "6px" }}>
              <strong style={{ color: "var(--color-navy)" }}>Base Location:</strong>{" "}
              {currentPartner.location}
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
              onClick={async () => {
                await logoutPartner();
                navigate("/partner/login");
              }}
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
              <SignOut size={16} /> Sign Out
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
            onClick={async () => {
              await logoutPartner();
              navigate("/partner/login");
            }}
            style={{ color: "#ef9a9a" }}
          >
            <SignOut size={15} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="partner-main">
        {/* Real Backend Session Status Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderLeft: "4px solid #16a34a",
            borderRadius: "var(--radius-sm)",
            padding: "8px 14px",
            marginBottom: "var(--space-md)",
            fontSize: "0.8rem",
            color: "#166534",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle size={16} weight="fill" color="#16a34a" style={{ flexShrink: 0 }} />
            <span>
              <strong>Authenticated Host Session:</strong> Active as <strong>{currentPartner.name}</strong> ({currentPartner.agency}). Scoped strictly to your host records.
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "#15803d", fontWeight: 600 }}>
            Session Active &bull; HTTP-Only Cookie Verified
          </span>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
