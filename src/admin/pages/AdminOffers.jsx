import React, { useState, useEffect, useMemo } from "react";
import {
  Tag,
  Plus,
  PencilSimple,
  Trash,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  HouseLine,
  Car,
  Bicycle,
  Compass,
  Sparkle,
  MagnifyingGlass,
  ArrowSquareOut,
  Info,
  SlidersHorizontal,
} from "phosphor-react";
import {
  getAllOffers,
  addOffer,
  updateOffer,
  deleteOffer,
  toggleOfferActive,
  getOfferStatus,
  getOffersSummary,
} from "../../data/offersStore.js";
import OfferModal from "../components/OfferModal.jsx";
import Dropdown from "../../components/Dropdown.jsx";

export default function AdminOffers() {
  const [offers, setOffers] = useState(getAllOffers());
  const [editingOffer, setEditingOffer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Filter toolbar state
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  function refresh() {
    setOffers(getAllOffers());
  }

  useEffect(() => {
    refresh();

    function onStorageChanged() {
      refresh();
    }
    window.addEventListener("storage", onStorageChanged);
    window.addEventListener("admin-storage-changed", onStorageChanged);
    return () => {
      window.removeEventListener("storage", onStorageChanged);
      window.removeEventListener("admin-storage-changed", onStorageChanged);
    };
  }, []);

  // Main admin only manages offers for Cars and Bikes (Homestays are managed by partners)
  const adminOffers = useMemo(() => {
    return offers.filter((o) => o.appliesToService === "Car" || o.appliesToService === "Bike");
  }, [offers]);

  // Summary Metrics strictly from stored Car and Bike records
  const summary = useMemo(() => {
    return adminOffers.reduce(
      (acc, o) => {
        acc.totalCount++;
        const st = getOfferStatus(o);
        if (st === "Active") acc.liveActiveCount++;
        else if (st === "Upcoming") acc.upcomingCount++;
        else if (st === "Expired") {
          acc.expiredCount++;
          acc.inactiveOrExpiredCount++;
        } else {
          acc.inactiveCount++;
          acc.inactiveOrExpiredCount++;
        }
        return acc;
      },
      {
        totalCount: 0,
        liveActiveCount: 0,
        upcomingCount: 0,
        expiredCount: 0,
        inactiveCount: 0,
        inactiveOrExpiredCount: 0,
      }
    );
  }, [adminOffers]);

  // Handlers
  function handleOpenCreate() {
    setEditingOffer(null);
    setShowModal(true);
  }

  function handleOpenEdit(offer) {
    setEditingOffer(offer);
    setShowModal(true);
  }

  function handleSaveOffer(payload) {
    if (editingOffer) {
      updateOffer(editingOffer.id, payload);
    } else {
      addOffer(payload);
    }
    refresh();
    setShowModal(false);
    setEditingOffer(null);
  }

  function handleToggleActive(offer) {
    toggleOfferActive(offer.id);
    refresh();
  }

  function handleDeleteOffer(offer) {
    if (!window.confirm(`Are you sure you want to delete the offer "${offer.title}"? This cannot be undone.`)) {
      return;
    }
    deleteOffer(offer.id);
    refresh();
  }

  function clearAllFilters() {
    setSearch("");
    setServiceFilter("");
    setScopeFilter("");
    setStatusFilter("");
  }

  // Filtered list
  const filteredOffers = useMemo(() => {
    return adminOffers.filter((o) => {
      if (serviceFilter && o.appliesToService !== serviceFilter) {
        return false;
      }

      if (scopeFilter) {
        const actualScope = o.scopeType || (o.appliesToCategory ? "category" : (o.appliesToTarget && o.appliesToTarget !== "All" ? "item" : "all"));
        if (actualScope !== scopeFilter) return false;
      }

      if (statusFilter) {
        const currentStatus = getOfferStatus(o);
        if (statusFilter === "Active" && currentStatus !== "Active") return false;
        if (statusFilter === "Upcoming" && currentStatus !== "Upcoming") return false;
        if (statusFilter === "Expired" && currentStatus !== "Expired") return false;
        if (statusFilter === "Inactive" && currentStatus !== "Inactive") return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const title = (o.title || "").toLowerCase();
        const badge = (o.badgeText || "").toLowerCase();
        const desc = (o.description || "").toLowerCase();
        const cat = (o.appliesToCategory || "").toLowerCase();
        const target = (o.appliesToTarget || "").toLowerCase();
        const items = Array.isArray(o.appliesToItems) ? o.appliesToItems.join(" ").toLowerCase() : "";

        if (
          !title.includes(q) &&
          !badge.includes(q) &&
          !desc.includes(q) &&
          !cat.includes(q) &&
          !target.includes(q) &&
          !items.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [offers, serviceFilter, scopeFilter, statusFilter, search]);

  const hasActiveFilters = Boolean(search || serviceFilter || scopeFilter || statusFilter);

  // Formatting helpers
  function renderServiceIcon(service) {
    switch (service) {
      case "Stay":
        return <HouseLine size={14} />;
      case "Car":
        return <Car size={14} />;
      case "Bike":
        return <Bicycle size={14} />;
      case "Journey":
        return <Compass size={14} />;
      default:
        return <Sparkle size={14} />;
    }
  }

  function renderStatusBadge(offer) {
    const status = getOfferStatus(offer);
    switch (status) {
      case "Active":
        return (
          <span className="admin-offer-status admin-offer-status--active">
            ● Live Active
          </span>
        );
      case "Upcoming":
        return (
          <span className="admin-offer-status admin-offer-status--upcoming">
            ◐ Scheduled
          </span>
        );
      case "Expired":
        return (
          <span className="admin-offer-status admin-offer-status--expired">
            ○ Expired
          </span>
        );
      case "Inactive":
      default:
        return (
          <span className="admin-offer-status admin-offer-status--inactive">
            ✕ Disabled
          </span>
        );
    }
  }

  function renderScopeSummary(offer) {
    const scope = offer.scopeType || (offer.appliesToCategory ? "category" : (offer.appliesToTarget && offer.appliesToTarget !== "All" ? "item" : "all"));

    if (scope === "all") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--color-navy)" }}>
            Entire Service
          </span>
          <span style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
            All {offer.appliesToService === "All" ? "inventory items" : `${offer.appliesToService} listings`}
          </span>
        </div>
      );
    }

    if (scope === "category") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--color-navy)" }}>
            Category: {offer.appliesToCategory}
          </span>
          <span style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
            All {offer.appliesToCategory} {offer.appliesToService}s
          </span>
        </div>
      );
    }

    // Specific Items
    const items = Array.isArray(offer.appliesToItems) && offer.appliesToItems.length > 0
      ? offer.appliesToItems
      : [offer.appliesToTarget].filter(Boolean);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxWidth: "220px" }}>
        <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--color-navy)" }}>
          {items.length === 1 ? items[0] : `${items.length} Selected Items`}
        </span>
        {items.length > 1 && (
          <span style={{ fontSize: "0.74rem", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={items.join(", ")}>
            {items.join(", ")}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="admin-offers-page">
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginBottom: "var(--space-md)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 className="admin-page-title" style={{ margin: 0 }}>Vehicle Offers &amp; Promotions (Cars &amp; Bikes)</h1>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "3px 8px",
                borderRadius: "999px",
                background: "var(--color-peach-light)",
                color: "var(--color-peach-deep)",
                border: "1px solid rgba(224, 122, 95, 0.3)",
              }}
            >
              Main Admin
            </span>
          </div>
          <p className="admin-page-note" style={{ margin: "4px 0 0" }}>
            Create and schedule promotional deals, seasonal rental packages, and discounts for mountain Cars and adventure Bikes. Note: Homestay and accommodation offers are managed directly by verified property partners in their host portal.
          </p>
        </div>

        <button
          type="button"
          className="admin-btn-primary"
          onClick={handleOpenCreate}
        >
          <Plus size={16} weight="bold" /> Create New Offer
        </button>
      </div>

      {/* Metrics Strip (Calculated strictly from stored records) */}
      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: "var(--space-md)" }}>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value">{summary.totalCount}</span>
          <span className="admin-stat-card__label">Total Created Offers</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "var(--color-forest)" }}>
            {summary.liveActiveCount}
          </span>
          <span className="admin-stat-card__label">Live on Website Today</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "#d97706" }}>
            {summary.upcomingCount}
          </span>
          <span className="admin-stat-card__label">Scheduled Upcoming</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "var(--color-text-muted)" }}>
            {summary.inactiveOrExpiredCount}
          </span>
          <span className="admin-stat-card__label">Inactive or Expired</span>
        </div>
      </div>

      {/* Info Notice Banner */}
      <div className="admin-comm-notice" style={{ marginBottom: "var(--space-md)" }}>
        <Info size={18} weight="bold" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div style={{ fontSize: "0.8rem", lineHeight: 1.45 }}>
          <strong>Vehicle Inventory Scope:</strong> Active offers automatically display as highlight badges on their
          targeted vehicle or bike cards across public rental pages. Homestay and stay offers are managed directly by verified property partners in their host portal.
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="admin-comm-toolbar" style={{ marginBottom: "var(--space-md)" }}>
        <div style={{ flex: "1 1 240px" }}>
          <label className="admin-inline-field" style={{ width: "100%" }}>
            <span>Search Offers</span>
            <div className="admin-search-box">
              <MagnifyingGlass size={16} />
              <input
                type="text"
                placeholder="Title, badge text, item name, category, terms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </label>
        </div>

        <div style={{ minWidth: 160 }}>
          <Dropdown
            label="Service"
            options={["All Vehicles", "Car", "Bike"]}
            value={serviceFilter || "All Vehicles"}
            onChange={(val) => setServiceFilter(val === "All Vehicles" ? "" : val)}
            placeholder="All Vehicles"
            light
          />
        </div>

        <div style={{ minWidth: 160 }}>
          <Dropdown
            label="Scope"
            options={["All Scopes", "Entire Service", "By Category", "Specific Items"]}
            value={
              scopeFilter === "all"
                ? "Entire Service"
                : scopeFilter === "category"
                ? "By Category"
                : scopeFilter === "item"
                ? "Specific Items"
                : "All Scopes"
            }
            onChange={(val) => {
              if (val === "Entire Service") setScopeFilter("all");
              else if (val === "By Category") setScopeFilter("category");
              else if (val === "Specific Items") setScopeFilter("item");
              else setScopeFilter("");
            }}
            placeholder="All Scopes"
            light
          />
        </div>

        <div style={{ minWidth: 160 }}>
          <Dropdown
            label="Validity Status"
            options={["All Statuses", "Live Active", "Scheduled", "Expired", "Disabled"]}
            value={
              statusFilter === "Active"
                ? "Live Active"
                : statusFilter === "Upcoming"
                ? "Scheduled"
                : statusFilter === "Expired"
                ? "Expired"
                : statusFilter === "Inactive"
                ? "Disabled"
                : "All Statuses"
            }
            onChange={(val) => {
              if (val === "Live Active") setStatusFilter("Active");
              else if (val === "Scheduled") setStatusFilter("Upcoming");
              else if (val === "Expired") setStatusFilter("Expired");
              else if (val === "Disabled") setStatusFilter("Inactive");
              else setStatusFilter("");
            }}
            placeholder="All Statuses"
            light
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={clearAllFilters}
            style={{ fontSize: "0.82rem", padding: "8px 14px", height: "38px" }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Offers Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Offer &amp; Badge</th>
              <th>Service</th>
              <th>Target Scope</th>
              <th>Promotion Details</th>
              <th>Validity Dates</th>
              <th>Live Status</th>
              <th>Active Toggle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOffers.length === 0 ? (
              <tr>
                <td colSpan={8} className="admin-table__empty">
                  <div style={{ padding: "32px 0", textAlign: "center" }}>
                    <Tag size={36} weight="light" style={{ opacity: 0.4, marginBottom: "8px" }} />
                    <p style={{ margin: "0 0 6px", fontWeight: 600 }}>No promotional offers match your filter criteria.</p>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      style={{ marginTop: "8px", fontSize: "0.82rem" }}
                      onClick={handleOpenCreate}
                    >
                      <Plus size={14} /> Create New Offer
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOffers.map((offer) => {
                const isActive = offer.active === true || offer.active === "true";

                return (
                  <tr key={offer.id}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              background: "var(--color-peach-light)",
                              color: "var(--color-peach-deep)",
                              padding: "2px 7px",
                              borderRadius: "999px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {offer.badgeText || "Special Offer"}
                          </span>
                          <strong style={{ fontSize: "0.92rem", color: "var(--color-navy)" }}>
                            {offer.title}
                          </strong>
                        </div>
                        {offer.description && (
                          <span
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--color-text-muted)",
                              maxWidth: "280px",
                              display: "inline-block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={offer.description}
                          >
                            {offer.description}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "var(--color-navy)",
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                          padding: "3px 8px",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        {renderServiceIcon(offer.appliesToService)} {offer.appliesToService}
                      </span>
                    </td>

                    <td>{renderScopeSummary(offer)}</td>

                    <td>
                      {offer.discountValue ? (
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "0.82rem",
                            color: "var(--color-forest)",
                            background: "rgba(46, 125, 50, 0.08)",
                            padding: "3px 8px",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          {offer.discountValue}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                          Promotional Package
                        </span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.78rem" }}>
                        <span>
                          <strong>From:</strong> {offer.startDate || "Anytime"}
                        </span>
                        <span>
                          <strong>To:</strong> {offer.endDate || "Ongoing"}
                        </span>
                      </div>
                    </td>

                    <td>{renderStatusBadge(offer)}</td>

                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(offer)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "4px 10px",
                          borderRadius: "999px",
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          border: `1px solid ${isActive ? "#c8e6c9" : "#cfd8dc"}`,
                          background: isActive ? "#e8f5e9" : "#eceff1",
                          color: isActive ? "#1b5e20" : "#546e7a",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        title={isActive ? "Click to deactivate" : "Click to activate"}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle size={13} weight="fill" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle size={13} weight="fill" /> Inactive
                          </>
                        )}
                      </button>
                    </td>

                    <td className="admin-table__actions">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(offer)}
                        title="Edit Offer"
                        className="admin-icon-btn"
                      >
                        <PencilSimple size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteOffer(offer)}
                        title="Delete Offer"
                        className="admin-icon-btn admin-icon-btn--danger"
                      >
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Offer Create / Edit Modal */}
      {showModal && (
        <OfferModal
          initialData={editingOffer}
          onSave={handleSaveOffer}
          onClose={() => {
            setShowModal(false);
            setEditingOffer(null);
          }}
        />
      )}
    </div>
  );
}