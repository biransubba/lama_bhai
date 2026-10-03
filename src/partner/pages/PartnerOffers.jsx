import React, { useState } from "react";
import {
  Tag,
  Plus,
  PencilSimple,
  Trash,
  CheckCircle,
  XCircle,
  Calendar,
  HouseLine,
  Percent,
  Sparkle,
  X,
  Check,
  Info,
} from "phosphor-react";
import { usePartnerAuth } from "../context/PartnerAuthContext.jsx";
import {
  addOffer,
  updateOffer,
  deleteOffer,
  toggleOfferActive,
  getOfferStatus,
} from "../../data/offersStore.js";

export default function PartnerOffers() {
  const { currentPartner, partnerStays, partnerOffers, refreshAll } = usePartnerAuth();

  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    targetStayId: partnerStays[0]?.id || "all",
    badgeText: "10% Off",
    discountType: "percentage",
    discountValue: "10%",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    description: "",
    active: true,
  });

  // Calculate live statistics
  const summary = partnerOffers.reduce(
    (acc, o) => {
      acc.total++;
      const st = getOfferStatus(o);
      if (st === "Active") acc.active++;
      else if (st === "Upcoming") acc.upcoming++;
      else acc.inactiveOrExpired++;
      return acc;
    },
    { total: 0, active: 0, upcoming: 0, inactiveOrExpired: 0 }
  );

  function handleOpenAdd() {
    setEditingOffer(null);
    setError("");
    setFormData({
      title: "",
      targetStayId: partnerStays.length === 1 ? partnerStays[0].id : "all",
      badgeText: "Special Offer",
      discountType: "percentage",
      discountValue: "10%",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      description: "",
      active: true,
    });
    setShowModal(true);
  }

  function handleOpenEdit(offer) {
    setEditingOffer(offer);
    setError("");

    // Detect target stay
    let initialTarget = "all";
    if (offer.appliesToTarget && offer.appliesToTarget !== "All My Stays" && offer.appliesToTarget !== "All") {
      const match = partnerStays.find(
        (s) => s.id === offer.appliesToTarget || s.name === offer.appliesToTarget
      );
      if (match) initialTarget = match.id;
    } else if (Array.isArray(offer.appliesToItems) && offer.appliesToItems.length === 1) {
      const match = partnerStays.find(
        (s) => s.id === offer.appliesToItems[0] || s.name === offer.appliesToItems[0]
      );
      if (match) initialTarget = match.id;
    }

    setFormData({
      title: offer.title || "",
      targetStayId: initialTarget,
      badgeText: offer.badgeText || "Special Offer",
      discountType: offer.discountType || "percentage",
      discountValue: offer.discountValue || "",
      startDate: offer.startDate || "",
      endDate: offer.endDate || "",
      description: offer.description || "",
      active: offer.active === true || offer.active === "true",
    });
    setShowModal(true);
  }

  function handleSaveOffer(e) {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Please provide a title for the offer.");
      return;
    }

    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      setError("Valid Until date cannot be earlier than Valid From date.");
      return;
    }

    const selectedStay = partnerStays.find((s) => s.id === formData.targetStayId);
    const appliesToItems =
      formData.targetStayId === "all"
        ? partnerStays.flatMap((s) => [s.name, s.id])
        : selectedStay
        ? [selectedStay.name, selectedStay.id]
        : [formData.targetStayId];

    const appliesToTarget =
      formData.targetStayId === "all"
        ? "All My Stays"
        : selectedStay
        ? selectedStay.name
        : formData.targetStayId;

    const payload = {
      title: formData.title.trim(),
      badgeText: formData.badgeText.trim() || "Special Offer",
      appliesToService: "Stay",
      scopeType: "item",
      appliesToCategory: "",
      appliesToItems,
      appliesToTarget,
      partnerId: currentPartner.id,
      discountType: formData.discountType,
      discountValue: formData.discountValue ? formData.discountValue.trim() : null,
      startDate: formData.startDate || "",
      endDate: formData.endDate || "",
      description: formData.description.trim(),
      active: Boolean(formData.active),
    };

    if (editingOffer) {
      updateOffer(editingOffer.id, payload);
    } else {
      addOffer(payload);
    }

    setShowModal(false);
    setEditingOffer(null);
    refreshAll();
  }

  function handleToggle(offer) {
    toggleOfferActive(offer.id);
    refreshAll();
  }

  function handleDelete(id) {
    if (window.confirm("Are you sure you want to remove this promotional offer?")) {
      deleteOffer(id);
      refreshAll();
    }
  }

  // Map stay ID to name
  const stayMap = {};
  partnerStays.forEach((s) => {
    stayMap[s.id] = s.name;
  });

  if (partnerStays.length === 0) {
    return (
      <div>
        <div style={{ marginBottom: "var(--space-md)" }}>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            Homestay Special Offers
          </h1>
          <p className="admin-page-note" style={{ margin: "4px 0 0" }}>
            Promotional offers are available exclusively to partners with registered homestays or stays.
          </p>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "48px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
            maxWidth: "600px",
            margin: "40px auto",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(224, 122, 95, 0.12)",
              color: "var(--color-peach-deep)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HouseLine size={30} weight="duotone" />
          </div>
          <h2 style={{ margin: 0, color: "var(--color-navy)", fontSize: "1.25rem" }}>
            No Properties Linked to Account
          </h2>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
            Promotional offers can only be created and managed by partners whose homestays, hotels, or stays are active and linked to their profile.
          </p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-navy)", fontWeight: 600 }}>
            Please coordinate with the Lama Bhai Main Admin to link your homestay property.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Top Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "var(--space-md)",
        }}
      >
        <div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            Homestay Special Offers ({partnerOffers.length})
          </h1>
          <p className="admin-page-note" style={{ margin: "4px 0 0" }}>
            Create and maintain promotional perks, seasonal rates, or meal inclusions for your homestays.
          </p>
        </div>

        <button
          type="button"
          className="admin-btn-primary"
          onClick={handleOpenAdd}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={16} weight="bold" /> Create New Offer
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          marginBottom: "var(--space-lg)",
        }}
      >
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "var(--color-navy)" }}>
            {summary.total}
          </span>
          <span className="admin-stat-card__label">Total Created Offers</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "#16a34a" }}>
            {summary.active}
          </span>
          <span className="admin-stat-card__label">Live on Website Today</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "#2563eb" }}>
            {summary.upcoming}
          </span>
          <span className="admin-stat-card__label">Scheduled Upcoming</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "var(--color-text-muted)" }}>
            {summary.inactiveOrExpired}
          </span>
          <span className="admin-stat-card__label">Inactive or Expired</span>
        </div>
      </div>

      {/* Notice info banner */}
      <div
        style={{
          background: "#fffbeb",
          border: "1px solid #fef3c7",
          borderLeft: "4px solid #f59e0b",
          borderRadius: "var(--radius-sm)",
          padding: "12px 16px",
          marginBottom: "var(--space-lg)",
          fontSize: "0.84rem",
          color: "#92400e",
          lineHeight: 1.5,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Sparkle size={20} color="#d97706" weight="fill" style={{ flexShrink: 0 }} />
        <div>
          <strong>Host Promotional Control:</strong> Offers created here appear directly as highlight badges on your homestay cards and detail pages during their valid dates. Base room tariffs remain unchanged.
        </div>
      </div>

      {/* Offers List */}
      {partnerOffers.length === 0 ? (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "48px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(224, 122, 95, 0.12)",
              color: "var(--color-peach-deep)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Tag size={28} weight="fill" />
          </div>
          <h3 style={{ margin: 0, color: "var(--color-navy)", fontSize: "1.15rem" }}>
            No Promotional Offers Active Yet
          </h3>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--color-text-muted)", maxWidth: "460px" }}>
            Launch seasonal perks (e.g. <em>Free Sikkimese Organic Breakfast</em> or <em>15% Early Bird Discount</em>) to attract more guests to your homestays.
          </p>
          <button
            type="button"
            className="admin-btn-primary"
            onClick={handleOpenAdd}
            style={{ marginTop: "8px" }}
          >
            <Plus size={16} weight="bold" /> Create Your First Offer
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" }}>
          {partnerOffers.map((offer) => {
            const status = getOfferStatus(offer);
            const isActive = status === "Active";
            const targetStayName =
              offer.appliesToTarget && offer.appliesToTarget !== "All My Stays" && offer.appliesToTarget !== "All"
                ? stayMap[offer.appliesToTarget] || offer.appliesToTarget
                : "All My Homestays";

            return (
              <div
                key={offer.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 2px 8px rgba(15, 24, 38, 0.04)",
                  transition: "box-shadow 0.2s ease",
                }}
              >
                {/* Header row: Badge + Status + Title */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          padding: "3px 9px",
                          borderRadius: "999px",
                          background: "var(--color-peach-light)",
                          color: "var(--color-peach-deep)",
                          border: "1px solid rgba(224, 122, 95, 0.3)",
                        }}
                      >
                        {offer.badgeText || "Special Deal"}
                      </span>

                      {/* Status indicator */}
                      <span className={`admin-offer-status admin-offer-status--${status.toLowerCase()}`}>
                        {status === "Active" && "● Live Active"}
                        {status === "Upcoming" && "◐ Scheduled"}
                        {status === "Expired" && "○ Expired"}
                        {status === "Inactive" && "✕ Disabled"}
                      </span>
                    </div>

                    <h3 style={{ margin: "4px 0 0", fontSize: "1.1rem", color: "var(--color-navy)" }}>
                      {offer.title}
                    </h3>
                  </div>

                  {/* One-click active toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggle(offer)}
                    className={`partner-toggle-btn ${
                      offer.active ? "partner-toggle-btn--available" : "partner-toggle-btn--unavailable"
                    }`}
                    title="Click to toggle offer on/off"
                    style={{ flexShrink: 0 }}
                  >
                    {offer.active ? (
                      <>
                        <CheckCircle size={13} weight="fill" /> Active
                      </>
                    ) : (
                      <>
                        <XCircle size={13} weight="fill" /> Off
                      </>
                    )}
                  </button>
                </div>

                {/* Target Homestay */}
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--color-forest, #2e7d32)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    margin: "6px 0",
                  }}
                >
                  <HouseLine size={15} weight="bold" /> Applies to: {targetStayName}
                </div>

                {/* Value Add / Perk Detail */}
                {offer.discountValue && (
                  <div style={{ fontSize: "0.84rem", color: "var(--color-navy)", fontWeight: 700, margin: "2px 0 6px" }}>
                    Inclusion: <span style={{ color: "var(--color-peach-deep)" }}>{offer.discountValue}</span>
                  </div>
                )}

                {/* Description */}
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--color-text-muted)",
                    margin: "4px 0 12px",
                    lineHeight: 1.45,
                    flexGrow: 1,
                  }}
                >
                  {offer.description || "Valid during configured date range on direct guest bookings."}
                </p>

                {/* Dates */}
                {(offer.startDate || offer.endDate) && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      marginBottom: "14px",
                      background: "#FAF7F2",
                      padding: "6px 10px",
                      borderRadius: "6px",
                    }}
                  >
                    <Calendar size={14} color="var(--color-navy)" />
                    <span>
                      Schedule: <strong>{offer.startDate || "Immediate"}</strong> &rarr;{" "}
                      <strong>{offer.endDate || "Ongoing"}</strong>
                    </span>
                  </div>
                )}

                {/* Card Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--color-border)",
                  }}
                >
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => handleOpenEdit(offer)}
                    style={{ fontSize: "0.8rem", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                  >
                    <PencilSimple size={14} /> Edit Offer
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(offer.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#b91c1c",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 10px",
                    }}
                    title="Remove offer permanently"
                  >
                    <Trash size={14} /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Structured, Centered Partner Offer Modal */}
      {showModal && (
        <div className="offer-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="offer-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="offer-modal-header">
              <div className="offer-modal-header-left">
                <div className="offer-modal-icon-badge">
                  <Tag size={22} weight="fill" />
                </div>
                <div>
                  <h2 className="offer-modal-title">
                    {editingOffer ? "Edit Homestay Offer" : "Create New Homestay Offer"}
                  </h2>
                  <span className="offer-modal-subtitle">
                    Offer custom perks, seasonal packages, or meal inclusions for your guests
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="offer-modal-close-btn"
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveOffer} className="offer-modal-body">
              {error && (
                <div
                  style={{
                    background: "#ffebee",
                    color: "#c62828",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    border: "1px solid #ffcdd2",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Info size={16} weight="bold" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1: Offer Details & Badge */}
              <div className="offer-modal-section">
                <h3 className="offer-modal-section-title">
                  <Sparkle size={16} color="var(--color-peach-deep)" weight="fill" />
                  Offer Details &amp; Display Badge
                </h3>
                <div className="offer-form-grid-2">
                  <div className="offer-form-field">
                    <label className="offer-form-label">
                      Offer Title <span className="offer-form-label-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="offer-form-input"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Monsoon Apple Orchard Special, Trekker Welcome"
                      required
                    />
                  </div>

                  <div className="offer-form-field">
                    <label className="offer-form-label">
                      Pill Badge Text <span className="offer-form-label-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="offer-form-input"
                      value={formData.badgeText}
                      onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                      placeholder="e.g. 15% Off, Free Breakfast, Season Deal"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Target Homestay Scope with Peach Dropdown */}
              <div className="offer-modal-section">
                <h3 className="offer-modal-section-title">
                  <HouseLine size={16} color="var(--color-peach-deep)" weight="fill" />
                  Target Homestay Scope
                </h3>
                <div className="offer-form-field">
                  <label className="offer-form-label">
                    Applicable Property <span className="offer-form-label-req">*</span>
                  </label>
                  <select
                    className="offer-form-select"
                    value={formData.targetStayId}
                    onChange={(e) => setFormData({ ...formData, targetStayId: e.target.value })}
                    required
                  >
                    {partnerStays.length > 1 && (
                      <option value="all">★ All My Homestays ({partnerStays.length} properties)</option>
                    )}
                    {partnerStays.map((stay) => (
                      <option key={stay.id} value={stay.id}>
                        {stay.name} ({stay.location}) — {stay.type || "Homestay"}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
                    {formData.targetStayId === "all"
                      ? "This offer will display across all homestays assigned to your host account."
                      : "This offer applies exclusively to the selected homestay."}
                  </span>
                </div>
              </div>

              {/* Section 3: Promotional Benefit / Value-Add Specification */}
              <div className="offer-modal-section">
                <h3 className="offer-modal-section-title">
                  <Percent size={16} color="var(--color-peach-deep)" weight="fill" />
                  Promotion or Value-Add Specification
                </h3>
                <div className="offer-form-grid-2">
                  <div className="offer-form-field">
                    <label className="offer-form-label">Promotion Type</label>
                    <select
                      className="offer-form-select"
                      value={formData.discountType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setFormData({
                          ...formData,
                          discountType: newType,
                          discountValue: newType === "none" ? "" : formData.discountValue,
                        });
                      }}
                    >
                      <option value="percentage">Percentage Discount (%)</option>
                      <option value="fixed">Fixed INR Discount (₹)</option>
                      <option value="perk">Complimentary Perk / Value-Add</option>
                      <option value="none">Informational / Seasonal Package</option>
                    </select>
                  </div>

                  <div className="offer-form-field">
                    <label className="offer-form-label">
                      Specification or Perk Detail <span className="offer-form-label-opt">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      className="offer-form-input"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      placeholder={
                        formData.discountType === "percentage"
                          ? "e.g. 15% Off"
                          : formData.discountType === "fixed"
                          ? "e.g. ₹500 Off"
                          : formData.discountType === "perk"
                          ? "e.g. Free Traditional Breakfast"
                          : "e.g. 3D/2N Complete Package"
                      }
                      disabled={formData.discountType === "none"}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Validity Dates */}
              <div className="offer-modal-section">
                <h3 className="offer-modal-section-title">
                  <Calendar size={16} color="var(--color-peach-deep)" weight="fill" />
                  Validity Schedule
                </h3>
                <div className="offer-form-grid-2">
                  <div className="offer-form-field">
                    <label className="offer-form-label">
                      Valid From Date <span className="offer-form-label-opt">(Optional)</span>
                    </label>
                    <input
                      type="date"
                      className="offer-form-input"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div className="offer-form-field">
                    <label className="offer-form-label">
                      Valid Until Date <span className="offer-form-label-opt">(Optional)</span>
                    </label>
                    <input
                      type="date"
                      className="offer-form-input"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Terms & Inclusions */}
              <div className="offer-modal-section">
                <h3 className="offer-modal-section-title">
                  <Info size={16} color="var(--color-peach-deep)" weight="fill" />
                  Offer Terms &amp; Inclusions
                </h3>
                <div className="offer-form-field">
                  <textarea
                    rows={3}
                    className="offer-form-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what is included, minimum stay requirements (e.g. min 2 nights), or meal specifics..."
                  />
                </div>
              </div>

              {/* Section 6: Activation Card */}
              <label className={`offer-toggle-card ${formData.active ? "offer-toggle-card--active" : ""}`}>
                <input
                  type="checkbox"
                  id="partner-offer-active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--color-peach-deep)" }}
                />
                <div>
                  <strong style={{ fontSize: "0.88rem", color: "var(--color-navy)", display: "block" }}>
                    Publish &amp; Activate immediately on website
                  </strong>
                  <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
                    When checked and within valid dates, highlight badges are visible to travelers on public stay listings.
                  </span>
                </div>
              </label>

              {/* Modal Footer */}
              <div className="offer-modal-footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  <Check size={16} weight="bold" /> {editingOffer ? "Save Changes" : "Publish Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
