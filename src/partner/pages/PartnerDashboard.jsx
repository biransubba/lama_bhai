import React from "react";
import { Link } from "react-router-dom";
import {
  HouseLine,
  CheckCircle,
  XCircle,
  Tag,
  CalendarCheck,
  CurrencyInr,
  Plus,
  ArrowRight,
  ShieldCheck,
  Eye,
  Camera,
  WarningCircle,
  Bed,
} from "phosphor-react";
import { usePartnerAuth } from "../context/PartnerAuthContext.jsx";
import { staysStore, getAllRoomsByPropertyId } from "../../data/staysStore.js";

export default function PartnerDashboard() {
  const {
    currentPartner,
    partnerStays,
    partnerRooms = [],
    partnerOffers,
    partnerBookings,
    refreshAll,
  } = usePartnerAuth();

  const availableStays = partnerStays.filter((s) => s.availability === "available");
  const availableRooms = partnerRooms.filter((r) => r.availability === "available");
  const newBookings = partnerBookings.filter((b) => b.status === "New");
  const cancelledBookings = partnerBookings.filter((b) => b.status === "Cancelled");
  const activeOffers = partnerOffers.filter((o) => o.active === true || o.active === "true");

  // Quick toggle availability directly from dashboard
  function toggleStayAvailability(stay) {
    const nextStatus = stay.availability === "available" ? "unavailable" : "available";
    staysStore.update("id", stay.id, { availability: nextStatus });
    refreshAll();
  }

  return (
    <div>
      {/* Top Welcome Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "var(--space-md)" }}>
        <div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            Welcome, {currentPartner?.name}
          </h1>
          <p className="admin-page-note" style={{ margin: "4px 0 0" }}>
            Host Management Console for <strong>{currentPartner?.agency || "Your Homestay Network"}</strong> in {currentPartner?.location}, Sikkim.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#e8f5e9",
              color: "#1b5e20",
              padding: "6px 12px",
              borderRadius: "999px",
              fontSize: "0.8rem",
              fontWeight: 700,
            }}
          >
            <CheckCircle size={15} weight="fill" /> Verified Host Access
          </span>
        </div>
      </div>

      {/* Scoping notice */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderLeft: "4px solid var(--color-peach-deep)",
          borderRadius: "var(--radius-sm)",
          padding: "10px 14px",
          marginBottom: "var(--space-lg)",
          fontSize: "0.82rem",
          color: "var(--color-text-muted)",
        }}
      >
        <ShieldCheck size={18} color="var(--color-peach-deep)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Your Dedicated View:</strong> You have direct control over your <strong>{partnerStays.length} assigned properties</strong>, your custom guest promotional offers, and inquiries.
        </span>
      </div>

      {/* Cancellation Notice for Partner */}
      {cancelledBookings.length > 0 && (
        <div
          style={{
            background: "#fff5f5",
            border: "1px solid #fed7d7",
            borderLeft: "4px solid #e53e3e",
            borderRadius: "var(--radius-sm)",
            padding: "12px 16px",
            marginBottom: "var(--space-lg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <WarningCircle size={22} color="#e53e3e" weight="fill" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: "#9b2c2c", fontSize: "0.88rem" }}>
                Traveler Cancellation Alert: {cancelledBookings.length} {cancelledBookings.length === 1 ? "booking has" : "bookings have"} been cancelled
              </strong>
              <div style={{ fontSize: "0.78rem", color: "#742a2a", marginTop: "2px" }}>
                Check inquiries to verify if any reserved dates can be re-opened for new guests.
              </div>
            </div>
          </div>
          <Link
            to="/partner/bookings"
            className="admin-btn admin-btn--secondary"
            style={{
              fontSize: "0.78rem",
              padding: "5px 12px",
              background: "#fff",
              color: "#9b2c2c",
              border: "1px solid #feb2b2",
              textDecoration: "none",
            }}
          >
            Review Inquiries &rarr;
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "var(--space-xl)" }}>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "var(--color-navy)" }}>
            {partnerStays.length}
          </span>
          <span className="admin-stat-card__label">My Properties</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "var(--color-peach-deep)" }}>
            {partnerRooms.length}
          </span>
          <span className="admin-stat-card__label">
            Room Units ({availableRooms.length} Open)
          </span>
        </div>

        <div className="admin-stat-card">
          <span
            className="admin-stat-card__value"
            style={{ color: newBookings.length > 0 ? "#b71c1c" : "var(--color-navy)" }}
          >
            {partnerBookings.length}
          </span>
          <span className="admin-stat-card__label">
            Booking Inquiries ({newBookings.length} New{cancelledBookings.length > 0 ? `, ${cancelledBookings.length} Cancelled` : ""})
          </span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "#16a34a" }}>
            {activeOffers.length}
          </span>
          <span className="admin-stat-card__label">Active Offers &amp; Deals</span>
        </div>
      </div>

      {/* Quick Launch Cards for Partner Sections */}
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <h2 className="admin-section-heading" style={{ marginTop: 0, marginBottom: "12px" }}>
          Partner Management Sections
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
          <Link
            to="/partner/properties"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "16px",
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <HouseLine size={24} color="var(--color-peach-deep)" />
            <strong style={{ color: "var(--color-navy)", fontSize: "0.95rem", marginTop: "4px" }}>My Properties</strong>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              {partnerStays.length} assigned homestays &amp; lodges
            </span>
          </Link>

          <Link
            to="/partner/availability"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "16px",
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <CalendarCheck size={24} color="#16a34a" />
            <strong style={{ color: "var(--color-navy)", fontSize: "0.95rem", marginTop: "4px" }}>Availability</strong>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              {availableStays.length} open for bookings, {partnerStays.length - availableStays.length} blocked
            </span>
          </Link>

          <Link
            to="/partner/photos"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "16px",
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <Camera size={24} color="var(--color-peach-deep)" />
            <strong style={{ color: "var(--color-navy)", fontSize: "0.95rem", marginTop: "4px" }}>Photos</strong>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              Upload pictures, set covers &amp; gallery order
            </span>
          </Link>

          <Link
            to="/partner/offers"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "16px",
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <Tag size={24} color="var(--color-peach-deep)" weight="duotone" />
            <strong style={{ color: "var(--color-navy)", fontSize: "0.95rem", marginTop: "4px" }}>Special Offers</strong>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              {activeOffers.length} live offers on website for your homestays
            </span>
          </Link>

          <Link
            to="/partner/bookings"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "16px",
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <CalendarCheck size={24} color="var(--color-forest)" />
            <strong style={{ color: "var(--color-navy)", fontSize: "0.95rem", marginTop: "4px" }}>Booking Requests</strong>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              {newBookings.length} new guest inquiries awaiting response
            </span>
          </Link>

          <Link
            to="/partner/profile"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "16px",
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <CheckCircle size={24} color="var(--color-navy)" />
            <strong style={{ color: "var(--color-navy)", fontSize: "0.95rem", marginTop: "4px" }}>Host Profile</strong>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              Update agency contact phone &amp; coordinator notes
            </span>
          </Link>
        </div>
      </div>

      {/* Section 1: Quick Property Availability Control */}
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h2 className="admin-section-heading" style={{ margin: 0 }}>
              Property Availability
            </h2>
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: "3px 0 0" }}>
              Manually set availability (Available or Unavailable) for your assigned properties.
            </p>
          </div>
          <Link to="/partner/availability" className="admin-link-btn">
            Open full availability manager &rarr;
          </Link>
        </div>

        {partnerStays.length === 0 ? (
          <div className="admin-card" style={{ padding: "30px", textAlign: "center", color: "var(--color-text-muted)" }}>
            No homestays or hotels assigned yet. Lama Bhai administrator will link your properties here.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
            {partnerStays.map((stay) => {
              const isAvailable = stay.availability === "available";
              const stayRooms = getAllRoomsByPropertyId(stay.id);
              const stayAvailRooms = stayRooms.filter((r) => r.availability === "available");

              return (
                <div
                  key={stay.id}
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", color: "var(--color-navy)" }}>
                        {stay.name}
                      </h3>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        {stay.location} · {stay.type}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleStayAvailability(stay)}
                      className={`partner-toggle-btn ${
                        isAvailable ? "partner-toggle-btn--available" : "partner-toggle-btn--unavailable"
                      }`}
                      title="Click to toggle availability"
                    >
                      {isAvailable ? (
                        <>
                          <CheckCircle size={14} weight="fill" /> Available
                        </>
                      ) : (
                        <>
                          <XCircle size={14} weight="fill" /> Unavailable
                        </>
                      )}
                    </button>
                  </div>

                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    <strong style={{ color: "var(--color-navy)" }}>{stay.price || "Rate on inquiry"}</strong>
                    {stay.amenities?.length > 0 && ` · ${stay.amenities.slice(0, 3).join(", ")}`}
                  </div>

                  {/* Room Inventory Pill */}
                  <div style={{ fontSize: "0.78rem", color: "var(--color-navy)", display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", padding: "6px 10px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                    <Bed size={14} weight="duotone" color="var(--color-peach-deep)" />
                    <span><strong>{stayRooms.length}</strong> {stayRooms.length === 1 ? "Room Unit" : "Room Units"} ({stayAvailRooms.length} Available)</span>
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "10px", borderTop: "1px solid var(--color-border)", alignItems: "center" }}>
                    <Link
                      to={`/partner/properties?manageRooms=${stay.id}`}
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--color-peach-deep)",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Manage rooms and availability for this homestay"
                    >
                      <Bed size={13} weight="bold" /> Manage Rooms &rarr;
                    </Link>
                    <span style={{ color: "var(--color-border)" }}>|</span>
                    <Link
                      to="/partner/properties"
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "var(--color-text-muted)",
                        textDecoration: "none",
                      }}
                    >
                      Edit Details
                    </Link>
                    <span style={{ color: "var(--color-border)" }}>|</span>
                    <Link
                      to={`/stays/${stay.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "var(--color-text-muted)",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        marginLeft: "auto",
                      }}
                    >
                      <Eye size={13} /> View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Special Offers (The requested feature) */}
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h2 className="admin-section-heading" style={{ margin: 0 }}>
              My Promotional Offers &amp; Deals
            </h2>
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: "3px 0 0" }}>
              Offers created by you for your homestays to attract seasonal travelers.
            </p>
          </div>
          <Link
            to="/partner/offers"
            className="admin-btn admin-btn--primary"
            style={{ fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={14} weight="bold" /> Create Offer
          </Link>
        </div>

        {partnerOffers.length === 0 ? (
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px dashed var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <Tag size={28} color="var(--color-peach-deep)" style={{ marginBottom: "8px" }} />
            <h4 style={{ margin: "0 0 6px", color: "var(--color-navy)" }}>No Active Offers Yet</h4>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0 0 14px" }}>
              Add a discount or seasonal perk (like "15% Monsoon Special" or "Free Home-cooked Dinner") to boost bookings.
            </p>
            <Link to="/partner/offers" className="admin-btn admin-btn--secondary" style={{ fontSize: "0.82rem" }}>
              Add Your First Offer
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {partnerOffers.slice(0, 3).map((offer) => (
              <div
                key={offer.id}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <strong style={{ color: "var(--color-navy)", fontSize: "0.95rem" }}>{offer.title}</strong>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      background: offer.active ? "#e8f5e9" : "#f1f5f9",
                      color: offer.active ? "#1b5e20" : "#64748b",
                      padding: "2px 6px",
                      borderRadius: "999px",
                    }}
                  >
                    {offer.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--color-peach-deep)", fontWeight: 700, marginBottom: "4px" }}>
                  {offer.badgeText || "Special Deal"}
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0 0 8px", lineHeight: 1.4 }}>
                  {offer.description || "Seasonal package perk"}
                </p>
                <Link to="/partner/offers" style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-navy)" }}>
                  Manage offer &rarr;
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Recent Inquiries */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h2 className="admin-section-heading" style={{ margin: 0 }}>
              Recent Guest Inquiries ({partnerBookings.length})
            </h2>
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: "3px 0 0" }}>
              Guests who have requested a stay at your properties.
            </p>
          </div>
          <Link to="/partner/bookings" className="admin-link-btn">
            View all inquiries &rarr;
          </Link>
        </div>

        {partnerBookings.length === 0 ? (
          <div className="admin-card" style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)" }}>
            No customer inquiries received yet for your assigned stays.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Guest Name</th>
                  <th>Contact</th>
                  <th>Travel Date</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {partnerBookings.slice(0, 5).map((req) => (
                  <tr key={req.id}>
                    <td>
                      <strong style={{ color: "var(--color-navy)" }}>{req.name || "Guest"}</strong>
                    </td>
                    <td>{req.phone || req.email || "—"}</td>
                    <td>{req.date || "Scheduled"}</td>
                    <td>{req.travellers ? `${req.travellers} People` : "—"}</td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background:
                            req.status === "Confirmed"
                              ? "#e8f5e9"
                              : req.status === "New"
                              ? "#fff8e1"
                              : req.status === "Cancelled"
                              ? "#ffebee"
                              : "#f1f5f9",
                          color:
                            req.status === "Confirmed"
                              ? "#1b5e20"
                              : req.status === "New"
                              ? "#b78103"
                              : req.status === "Cancelled"
                              ? "#b71c1c"
                              : "#334155",
                        }}
                      >
                        {req.status === "Cancelled" ? "Cancelled by Guest" : req.status}
                      </span>
                    </td>
                    <td>
                      <Link to="/partner/bookings" className="admin-link-btn" style={{ fontSize: "0.8rem" }}>
                        View details &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
