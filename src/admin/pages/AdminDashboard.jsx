import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  Bicycle,
  HouseLine,
  UsersThree,
  MapPin,
  Compass,
  Tag,
  ImageSquare,
  CalendarCheck,
  Gear,
  ArrowRight,
  ShieldWarning,
  ShieldCheck,
  CheckCircle,
  Clock,
  WarningCircle,
} from "phosphor-react";
import {
  carModelsRepo,
  carUnitsRepo,
  bikeModelsRepo,
  bikeUnitsRepo,
  staysRepo,
  destinationsRepo,
  journeysRepo,
  offersRepo,
  partnersRepo,
  mediaRepo,
} from "../store/repos.js";
import { getAllBookingRequests, updateBookingRequestStatus, BOOKING_STATUSES } from "../../utils/bookingStorage.js";

export default function AdminDashboard() {
  const [requests, setRequests] = useState(getAllBookingRequests());
  const [cars, setCars] = useState({
    models: carModelsRepo.getAll(),
    units: carUnitsRepo.getAll(),
  });
  const [bikes, setBikes] = useState({
    models: bikeModelsRepo.getAll(),
    units: bikeUnitsRepo.getAll(),
  });
  const [stays, setStays] = useState(staysRepo.getAll());
  const [partners, setPartners] = useState(partnersRepo.getAll());
  const [destinations, setDestinations] = useState(destinationsRepo.getAll());
  const [journeys, setJourneys] = useState(journeysRepo.getAll());
  const [offers, setOffers] = useState(offersRepo.getAll());
  const [media, setMedia] = useState(mediaRepo.getAll());

  function refreshAll() {
    setRequests(getAllBookingRequests());
    setCars({
      models: carModelsRepo.getAll(),
      units: carUnitsRepo.getAll(),
    });
    setBikes({
      models: bikeModelsRepo.getAll(),
      units: bikeUnitsRepo.getAll(),
    });
    setStays(staysRepo.getAll());
    setPartners(partnersRepo.getAll());
    setDestinations(destinationsRepo.getAll());
    setJourneys(journeysRepo.getAll());
    setOffers(offersRepo.getAll());
    setMedia(mediaRepo.getAll());
  }

  useEffect(() => {
    refreshAll();

    function onUpdate() {
      refreshAll();
    }
    window.addEventListener("storage", onUpdate);
    window.addEventListener("admin-storage-changed", onUpdate);
    window.addEventListener("booking-cancelled", onUpdate);
    window.addEventListener("photos-changed", onUpdate);
    return () => {
      window.removeEventListener("storage", onUpdate);
      window.removeEventListener("admin-storage-changed", onUpdate);
      window.removeEventListener("booking-cancelled", onUpdate);
      window.removeEventListener("photos-changed", onUpdate);
    };
  }, []);

  function handleStatusChange(requestId, newStatus) {
    updateBookingRequestStatus(requestId, newStatus);
    refreshAll();
  }

  // Calculated Metrics
  const carAvailableUnits = (cars?.units || []).filter((u) => u.availability === "available").length;
  const bikeAvailableUnits = (bikes?.units || []).filter((u) => u.availability === "available").length;
  const staysPublished = (stays || []).filter((s) => s.status === "published" || s.active !== false).length;
  const staysAvailable = (stays || []).filter((s) => s.availability === "available").length;
  const partnersApproved = (partners || []).filter(
    (p) => (p.status || "").toLowerCase() === "approved"
  ).length;
  const partnersPending = (partners || []).filter(
    (p) => (p.status || "").toLowerCase() === "pending"
  ).length;
  const staysWithPartner = (stays || []).filter((s) => s.partnerId).length;

  const newRequestsCount = (requests || []).filter((r) => r.status === "New").length;
  const inProgressRequestsCount = (requests || []).filter((r) => r.status === "In Progress" || r.status === "Contacted").length;
  const confirmedRequestsCount = (requests || []).filter((r) => r.status === "Confirmed").length;
  const cancelledRequestsCount = (requests || []).filter((r) => r.status === "Cancelled").length;

  const permitRequestsCount = (requests || []).filter((r) => r.service === "Permit").length;
  const newPermitRequestsCount = (requests || []).filter((r) => r.service === "Permit" && r.status === "New").length;

  const activeDestinations = (destinations || []).filter((d) => d.active !== false).length;
  const activeJourneys = (journeys || []).filter((j) => j.active !== false).length;
  const activeOffers = (offers || []).filter((o) => o.active === true || o.active === "true").length;

  const recentRequests = [...(requests || [])]
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 6);

  const adminSections = [
    {
      title: "Mountain Cars",
      desc: `${cars?.models?.length || 0} models · ${cars?.units?.length || 0} vehicles (${carAvailableUnits} available)`,
      path: "/admin/cars",
      icon: <Car size={24} weight="duotone" color="var(--color-peach-deep)" />,
      badge: `${carAvailableUnits} Ready`,
    },
    {
      title: "Adventure Bikes",
      desc: `${bikes?.models?.length || 0} models · ${bikes?.units?.length || 0} bikes (${bikeAvailableUnits} available)`,
      path: "/admin/bikes",
      icon: <Bicycle size={24} weight="duotone" color="var(--color-peach-deep)" />,
      badge: `${bikeAvailableUnits} Ready`,
    },
    {
      title: "Stays & Homestays",
      desc: `${stays?.length || 0} properties (${staysPublished} published, ${staysAvailable} available)`,
      path: "/admin/stays",
      icon: <HouseLine size={24} weight="duotone" color="var(--color-peach-deep)" />,
      badge: `${staysPublished} Live`,
    },
    {
      title: "Partner Network",
      desc: `${partners?.length || 0} hosts & agencies (${partnersApproved} approved, ${partnersPending} pending, ${staysWithPartner} stays assigned)`,
      path: "/admin/partners",
      icon: <UsersThree size={24} weight="duotone" color="var(--color-forest)" />,
      badge: partnersPending > 0 ? `${partnersPending} Pending Review` : `${partnersApproved} Approved`,
    },
    {
      title: "Destinations",
      desc: `${destinations?.length || 0} destinations across Sikkim circuits (${activeDestinations} published)`,
      path: "/admin/destinations",
      icon: <MapPin size={24} weight="duotone" color="var(--color-peach-deep)" />,
      badge: `${activeDestinations} Live`,
    },
    {
      title: "Curated Journeys",
      desc: `${journeys?.length || 0} travel circuits & road trip itineraries (${activeJourneys} published)`,
      path: "/admin/journeys",
      icon: <Compass size={24} weight="duotone" color="var(--color-peach-deep)" />,
      badge: `${activeJourneys} Live`,
    },
    {
      title: "Government Permits",
      desc: `${permitRequestsCount} permit dossiers · Configure document requirements, photo rules & police verification`,
      path: "/admin/permits",
      icon: <ShieldCheck size={24} weight="duotone" color="var(--color-peach-deep)" />,
      badge: newPermitRequestsCount > 0 ? `${newPermitRequestsCount} Pending Review` : `Rules & Dossiers`,
    },
    {
      title: "Special Offers",
      desc: `${offers?.length || 0} seasonal promotions & discount packages (${activeOffers} currently active)`,
      path: "/admin/offers",
      icon: <Tag size={24} weight="duotone" color="var(--color-peach-deep)" />,
      badge: `${activeOffers} Active`,
    },
    {
      title: "Media Library",
      desc: `${media?.length || 0} uploaded entity images and indexed photo gallery records`,
      path: "/admin/media",
      icon: <ImageSquare size={24} weight="duotone" color="var(--color-peach-deep)" />,
      badge: `${media?.length || 0} Assets`,
    },
    {
      title: "Booking Requests",
      desc: `${requests.length} customer inquiries (${newRequestsCount} new, ${confirmedRequestsCount} confirmed${cancelledRequestsCount > 0 ? `, ${cancelledRequestsCount} cancelled` : ""})`,
      path: "/admin/bookings",
      icon: <CalendarCheck size={24} weight="duotone" color="var(--color-forest)" />,
      badge: cancelledRequestsCount > 0 ? `${cancelledRequestsCount} Cancelled` : `${newRequestsCount} New`,
    },
    {
      title: "Platform Settings",
      desc: "Business phone, agency email, and operational preferences",
      path: "/admin/settings",
      icon: <Gear size={24} weight="duotone" color="var(--color-navy)" />,
      badge: "Configured",
    },
  ];

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "var(--space-md)" }}>
        <div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>Main Admin Console</h1>
          <p className="admin-page-note" style={{ margin: "4px 0 0" }}>
            Operational control center for Lama Bhai Tourism. Manage Sikkim fleet, village homestays, partner assignments, and customer inquiries.
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
              fontSize: "0.78rem",
              fontWeight: 700,
            }}
          >
            <CheckCircle size={14} weight="fill" /> Local Repositories Connected
          </span>
        </div>
      </div>

      {/* Security Disclaimer Banner (Requirement 8) */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderLeft: "4px solid var(--color-peach-deep)",
          borderRadius: "var(--radius-sm)",
          padding: "12px 16px",
          marginBottom: "var(--space-lg)",
          fontSize: "0.82rem",
          color: "var(--color-text-muted)",
          lineHeight: 1.5,
        }}
      >
        <ShieldWarning size={20} color="var(--color-peach-deep)" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <strong style={{ color: "var(--color-navy)", display: "block", marginBottom: "2px" }}>
            Frontend Operations Console Notice:
          </strong>
          This administration dashboard operates via client-side storage repositories (LocalStorage &amp; IndexedDB). It is designed for prototype and local operational management. It does <em>not</em> provide server-enforced authentication, RBAC authorization, or live payment gateway integration.
        </div>
      </div>

      {/* Pending Partner Onboarding Requests Banner */}
      {partnersPending > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "var(--radius-sm)",
            padding: "12px 16px",
            marginBottom: "var(--space-md)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Clock size={20} weight="fill" color="#d97706" />
            <div>
              <strong style={{ color: "#92400e", fontSize: "0.9rem" }}>
                {partnersPending} Pending Homestay Partner Application{partnersPending > 1 ? "s" : ""}
              </strong>
              <div style={{ color: "#b45309", fontSize: "0.82rem" }}>
                New partner onboarding requests are awaiting approval and property assignment.
              </div>
            </div>
          </div>
          <Link
            to="/admin/partners"
            style={{
              background: "#d97706",
              color: "#ffffff",
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.82rem",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Review Applications &rarr;
          </Link>
        </div>
      )}

      {/* Vital Metric Cards */}
      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "var(--color-navy)" }}>{cars?.units?.length || 0}</span>
          <span className="admin-stat-card__label">Mountain Cars ({carAvailableUnits} Avail)</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "var(--color-navy)" }}>{bikes?.units?.length || 0}</span>
          <span className="admin-stat-card__label">Adventure Bikes ({bikeAvailableUnits} Avail)</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "var(--color-peach-deep)" }}>{stays?.length || 0}</span>
          <span className="admin-stat-card__label">Stays ({staysPublished} Live)</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "var(--color-forest)" }}>{partnersApproved}</span>
          <span className="admin-stat-card__label">Active Partners ({partners?.length || 0} Total)</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: newPermitRequestsCount > 0 ? "#b45309" : "var(--color-forest)" }}>
            {permitRequestsCount}
          </span>
          <span className="admin-stat-card__label">Permits ({newPermitRequestsCount} Pending)</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: newRequestsCount > 0 ? "#b71c1c" : "var(--color-navy)" }}>
            {requests?.length || 0}
          </span>
          <span className="admin-stat-card__label">All Inquiries ({newRequestsCount} New)</span>
        </div>
      </div>

      {/* Quick Navigation Sections Grid */}
      <div style={{ marginTop: "var(--space-lg)", marginBottom: "var(--space-xl)" }}>
        <h2 className="admin-section-heading" style={{ marginTop: 0, marginBottom: "var(--space-md)" }}>
          Platform Management Sections
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "14px",
          }}
        >
          {adminSections.map((sec) => (
            <Link
              key={sec.path}
              to={sec.path}
              style={{
                display: "flex",
                flexDirection: "column",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                textDecoration: "none",
                transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 12px 24px -10px rgba(23, 36, 58, 0.15)";
                e.currentTarget.style.borderColor = "var(--color-peach)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {sec.icon}
                  <h3 style={{ fontSize: "1.05rem", margin: 0, color: "var(--color-navy)" }}>{sec.title}</h3>
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    background: "var(--color-peach-light)",
                    color: "var(--color-navy)",
                    padding: "3px 8px",
                    borderRadius: "999px",
                  }}
                >
                  {sec.badge}
                </span>
              </div>

              <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: "0 0 14px", lineHeight: 1.4, flexGrow: 1 }}>
                {sec.desc}
              </p>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--color-peach-deep)",
                }}
              >
                Manage section <ArrowRight size={14} weight="bold" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Booking Requests */}
      <div style={{ marginTop: "var(--space-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" }}>
          <h2 className="admin-section-heading" style={{ margin: 0 }}>
            Recent Customer Booking Requests ({requests.length} Total)
          </h2>
          <Link to="/admin/bookings" className="admin-link-btn">
            View all requests &rarr;
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <p className="admin-page-note">No booking requests received yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Travel Date</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background:
                            r.service === "Car"
                              ? "#e0f2fe"
                              : r.service === "Bike"
                              ? "#fef3c7"
                              : r.service === "Permit"
                              ? "#f3e8ff"
                              : "#e8f5e9",
                          color:
                            r.service === "Car"
                              ? "#0369a1"
                              : r.service === "Bike"
                              ? "#92400e"
                              : r.service === "Permit"
                              ? "#6b21a8"
                              : "#1b5e20",
                        }}
                      >
                        {r.service}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <strong style={{ color: "var(--color-navy)" }}>{r.name || "Guest"}</strong>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                          <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>ID: {r.id}</span>
                          {r.service === "Permit" && (
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: r.nationality === "Foreign Tourist" ? "#b45309" : "#0369a1" }}>
                              {r.nationality === "Foreign Tourist" ? "🌍 Foreign" : "🇮🇳 Indian"}
                            </span>
                          )}
                          {r.permitData?.documentCount > 0 && (
                            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-forest)", background: "#e8f5ed", padding: "1px 4px", borderRadius: "3px" }}>
                              ✓ Docs
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: "0.85rem" }}>{r.phone || r.email || "—"}</span>
                    </td>

                    <td>
                      <span style={{ fontSize: "0.85rem" }}>{r.date || "Scheduled"}</span>
                    </td>

                    <td>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        {new Date(r.submittedAt).toLocaleDateString()} {new Date(r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td>
                      <select
                        value={r.status}
                        onChange={(e) => handleStatusChange(r.id, e.target.value)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          border: "1px solid var(--color-border)",
                          background:
                            r.status === "Confirmed"
                              ? "#e8f5e9"
                              : r.status === "New"
                              ? "#fff8e1"
                              : "#f1f5f9",
                          color:
                            r.status === "Confirmed"
                              ? "#1b5e20"
                              : r.status === "New"
                              ? "#b78103"
                              : "#334155",
                        }}
                      >
                        {BOOKING_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <Link to="/admin/bookings" className="admin-link-btn" style={{ fontSize: "0.8rem" }}>
                        Open in Bookings &rarr;
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