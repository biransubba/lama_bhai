import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Camera,
  Bed,
  Check,
  X,
  Clock,
  MagnifyingGlass,
  WarningCircle,
  CheckCircle,
  ArrowsClockwise,
  Star,
  Trash,
  PencilSimple,
  ShieldWarning,
  HouseLine,
} from "phosphor-react";
import { api } from "../../utils/api.js";
import PropertyRoomsManagerModal from "../components/PropertyRoomsManagerModal.jsx";
import PhotoManagerModal from "../components/PhotoManagerModal.jsx";
import StayFormModal from "../components/StayFormModal.jsx";

const DISTRICT_OPTIONS = [
  "All Districts",
  "North Sikkim",
  "East Sikkim",
  "West Sikkim",
  "South Sikkim",
  "Pakyong",
  "Soreng",
];

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Pending Review", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Draft", value: "draft" },
];

export default function AdminStays() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Data states
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [bannerNotice, setBannerNotice] = useState("");

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, currentPage: 1 });

  // Rejection note modal
  const [rejectingProperty, setRejectingProperty] = useState(null);
  const [rejectNotes, setRejectNotes] = useState("");

  // Sub-modals for Photos, Rooms, Edit
  const [managingPhotosStay, setManagingPhotosStay] = useState(null);
  const [managingRoomsStay, setManagingRoomsStay] = useState(null);
  const [editingStay, setEditingStay] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load properties from GET /api/admin/properties
  const loadProperties = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");
      const params = {
        page,
        limit: 20,
      };
      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (districtFilter && districtFilter !== "all") {
        params.district = districtFilter;
      }
      if (search && search.trim()) {
        params.search = search.trim();
      }

      const res = await api.admin.getProperties(params);
      if (res && res.success) {
        setProperties(res.data || []);
        setPagination({
          total: res.total !== undefined ? res.total : (res.data ? res.data.length : 0),
          totalPages: res.totalPages || 1,
          currentPage: res.currentPage || page,
        });
      } else {
        setProperties([]);
      }
    } catch (err) {
      console.error("Failed to load admin properties:", err);
      if (err.status === 401) {
        setPageError("Your session has expired. Please log in as an administrator.");
      } else if (err.status === 403) {
        setPageError("Access denied: Administrator privileges required to manage properties.");
      } else if (err.status === 404) {
        setPageError("Properties endpoint not found.");
      } else if (err.status >= 500) {
        setPageError("A server error occurred while retrieving properties. Please try again later.");
      } else {
        setPageError(err.message || "Failed to load properties from backend.");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, districtFilter, search, page]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Sync query params if property param was passed
  useEffect(() => {
    const propParam = searchParams.get("property") || searchParams.get("manageRooms");
    if (propParam && properties.length > 0) {
      const found = properties.find(
        (s) =>
          (s._id && s._id.toString() === propParam) ||
          (s.slug && s.slug.toLowerCase() === propParam.toLowerCase()) ||
          (s.id && s.id.toString() === propParam)
      );
      if (found) {
        setManagingRoomsStay(found);
      }
    }
  }, [searchParams, properties]);

  // Moderation: Approve property
  async function handleApprove(propertyId) {
    try {
      setActionLoadingId(propertyId);
      const res = await api.admin.updatePropertyStatus(propertyId, { status: "approved" });
      if (res && res.success) {
        setBannerNotice(`Property "${res.data?.name || "Stay"}" has been approved.`);
        setTimeout(() => setBannerNotice(""), 5000);
        await loadProperties();
      }
    } catch (err) {
      console.error("Failed to approve property:", err);
      alert(err.message || "Unable to approve property.");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Moderation: Reject property with optional reviewer notes
  async function handleReject(propertyId, notes = "") {
    try {
      setActionLoadingId(propertyId);
      const payload = { status: "rejected" };
      if (notes && notes.trim()) {
        payload.reviewerNotes = notes.trim();
      }
      const res = await api.admin.updatePropertyStatus(propertyId, payload);
      if (res && res.success) {
        setBannerNotice(`Property "${res.data?.name || "Stay"}" has been rejected.`);
        setTimeout(() => setBannerNotice(""), 5000);
        setRejectingProperty(null);
        setRejectNotes("");
        await loadProperties();
      }
    } catch (err) {
      console.error("Failed to reject property:", err);
      alert(err.message || "Unable to reject property.");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Moderation: Reset property status to Pending review
  async function handleResetPending(propertyId) {
    try {
      setActionLoadingId(propertyId);
      const res = await api.admin.updatePropertyStatus(propertyId, { status: "pending" });
      if (res && res.success) {
        setBannerNotice(`Property "${res.data?.name || "Stay"}" status reset to Pending review.`);
        setTimeout(() => setBannerNotice(""), 5000);
        await loadProperties();
      }
    } catch (err) {
      console.error("Failed to reset status:", err);
      alert(err.message || "Unable to reset property status.");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Toggle Featured status
  async function handleToggleFeatured(property) {
    const nextFeatured = !property.featured;
    const propertyId = property._id || property.id;
    try {
      setActionLoadingId(propertyId);
      const res = await api.admin.updatePropertyStatus(propertyId, {
        status: property.status || "approved",
        featured: nextFeatured,
      });
      if (res && res.success) {
        setBannerNotice(`Property "${property.name}" featured status updated.`);
        setTimeout(() => setBannerNotice(""), 4000);
        await loadProperties();
      }
    } catch (err) {
      console.error("Failed to update featured flag:", err);
      alert(err.message || "Unable to update featured status.");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Delete property
  async function handleDelete(property) {
    const propertyName = property.name || "this property";
    if (
      !window.confirm(
        `Are you sure you want to deactivate / delete "${propertyName}"?`
      )
    ) {
      return;
    }
    const propertyId = property._id || property.id;
    try {
      setActionLoadingId(propertyId);
      await api.owner.deleteProperty(propertyId);
      setBannerNotice(`Property "${propertyName}" has been deactivated.`);
      setTimeout(() => setBannerNotice(""), 5000);
      await loadProperties();
    } catch (err) {
      console.error("Failed to delete property:", err);
      alert(err.message || "Unable to delete property.");
    } finally {
      setActionLoadingId(null);
    }
  }

  const pendingCount = properties.filter((p) => p.status === "pending").length;
  const approvedCount = properties.filter((p) => p.status === "approved").length;
  const rejectedCount = properties.filter((p) => p.status === "rejected").length;
  const draftCount = properties.filter((p) => p.status === "draft").length;

  return (
    <div>
      {/* Page Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "var(--space-md)" }}>
        <div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            Property Moderation &amp; Stays ({pagination.total})
          </h1>
          <p className="admin-page-note" style={{ margin: "4px 0 0" }}>
            Review, verify, and approve partner homestays and hotels before they go live on the platform.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={loadProperties}
            title="Refresh from MongoDB"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowsClockwise size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {bannerNotice && (
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderLeft: "4px solid #10b981",
            borderRadius: "var(--radius-sm)",
            padding: "10px 14px",
            marginBottom: "var(--space-md)",
            fontSize: "0.85rem",
            color: "#065f46",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle size={18} weight="fill" color="#10b981" />
            <span>{bannerNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerNotice("")}
            style={{ background: "none", border: "none", color: "#065f46", cursor: "pointer", fontWeight: 700 }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Error Alert */}
      {pageError && (
        <div
          style={{
            background: "#fff5f5",
            border: "1px solid #fed7d7",
            borderLeft: "4px solid #e53e3e",
            borderRadius: "var(--radius-sm)",
            padding: "12px 16px",
            marginBottom: "var(--space-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <WarningCircle size={22} color="#e53e3e" weight="fill" />
            <span style={{ color: "#9b2c2c", fontSize: "0.88rem" }}>{pageError}</span>
          </div>
          <button
            type="button"
            onClick={loadProperties}
            className="admin-btn admin-btn--secondary"
            style={{ fontSize: "0.78rem", padding: "4px 10px" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Pending Moderation Callout Banner */}
      {pendingCount > 0 && statusFilter !== "pending" && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderLeft: "4px solid #f59e0b",
            borderRadius: "var(--radius-sm)",
            padding: "12px 16px",
            marginBottom: "var(--space-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Clock size={22} color="#d97706" weight="fill" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: "#92400e", fontSize: "0.88rem" }}>
                {pendingCount} Property Submission{pendingCount > 1 ? "s" : ""} Pending Review
              </strong>
              <div style={{ fontSize: "0.78rem", color: "#b45309", marginTop: "2px" }}>
                Verify property content, pricing, and images before publishing to travelers.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("pending");
              setPage(1);
            }}
            className="admin-btn"
            style={{
              fontSize: "0.78rem",
              padding: "5px 12px",
              background: "#d97706",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Filter Pending ({pendingCount})
          </button>
        </div>
      )}

      {/* Quick Summary Cards */}
      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", marginBottom: "var(--space-md)", gap: "10px" }}>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value">{pagination.total}</span>
          <span className="admin-stat-card__label">Total Properties</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "#d97706" }}>
            {pendingCount}
          </span>
          <span className="admin-stat-card__label">Pending Review</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "#16a34a" }}>
            {approvedCount}
          </span>
          <span className="admin-stat-card__label">Approved / Live</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "#dc2626" }}>
            {rejectedCount}
          </span>
          <span className="admin-stat-card__label">Rejected</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "#64748b" }}>
            {draftCount}
          </span>
          <span className="admin-stat-card__label">Drafts</span>
        </div>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="admin-filter-bar" style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "var(--space-md)", alignItems: "center" }}>
        <div style={{ position: "relative", flexGrow: 1, minWidth: "240px", maxWidth: "360px" }}>
          <MagnifyingGlass
            size={16}
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search property name, town, district..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="admin-input"
            style={{ paddingLeft: "32px", width: "100%" }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="admin-input"
          style={{ width: "auto" }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* District Filter */}
        <select
          value={districtFilter}
          onChange={(e) => {
            setDistrictFilter(e.target.value);
            setPage(1);
          }}
          className="admin-input"
          style={{ width: "auto" }}
        >
          {DISTRICT_OPTIONS.map((d) => (
            <option key={d} value={d === "All Districts" ? "all" : d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="admin-card" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
          <Clock size={36} color="var(--color-peach-deep)" style={{ marginBottom: "8px" }} />
          <h3 style={{ margin: "0 0 6px", color: "var(--color-navy)" }}>Loading Properties...</h3>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            Retrieving property moderation records from MongoDB server.
          </p>
        </div>
      ) : properties.length === 0 ? (
        <div className="admin-card" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
          <HouseLine size={36} color="var(--color-peach-deep)" style={{ marginBottom: "8px" }} />
          <h3 style={{ margin: "0 0 6px", color: "var(--color-navy)" }}>No properties found</h3>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            No properties match your current search and filter settings.
          </p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Owner / Partner</th>
                <th>Type &amp; Location</th>
                <th>Price / Night</th>
                <th>Rooms</th>
                <th>Photos</th>
                <th>Status &amp; Moderation</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => {
                const propertyId = p._id || p.id;
                const town = p.location?.town || "";
                const district = p.location?.district || "";
                const locationLabel = town && district ? `${town}, ${district}` : town || district || (typeof p.location === "string" ? p.location : "Sikkim");
                const ownerName = p.owner?.name || p.owner?.partnerProfile?.agencyName || "Direct / Admin";
                const ownerEmail = p.owner?.email || "";
                const ownerPhone = p.owner?.phone || "";
                const roomCount = Array.isArray(p.rooms) ? p.rooms.length : 0;
                const openRoomCount = Array.isArray(p.rooms) ? p.rooms.filter((rm) => rm.availability === "available").length : 0;
                const galleryCount = Array.isArray(p.gallery) ? p.gallery.length : 0;
                const hasCover = Boolean(p.image);
                const isApproved = p.status === "approved";
                const isPending = p.status === "pending";
                const isRejected = p.status === "rejected";
                const isDraft = p.status === "draft";
                const isActionBusy = actionLoadingId === propertyId;

                return (
                  <tr key={propertyId}>
                    {/* Property Details */}
                    <td>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            style={{
                              width: "48px",
                              height: "48px",
                              objectFit: "cover",
                              borderRadius: "6px",
                              border: "1px solid var(--color-border)",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              background: "rgba(232, 165, 140, 0.15)",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <HouseLine size={20} color="var(--color-peach-deep)" />
                          </div>
                        )}
                        <div>
                          <strong style={{ color: "var(--color-navy)", fontSize: "0.9rem", display: "block" }}>
                            {p.name || "Untitled Property"}
                          </strong>
                          <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", display: "block" }}>
                            ID: <code>{propertyId}</code>
                          </span>
                          {p.createdAt && (
                            <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                              Added: {new Date(p.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Owner / Host */}
                    <td>
                      <strong style={{ color: "var(--color-navy)", fontSize: "0.85rem", display: "block" }}>
                        {ownerName}
                      </strong>
                      {ownerEmail && (
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          {ownerEmail}
                        </div>
                      )}
                      {ownerPhone && (
                        <div style={{ fontSize: "0.73rem", color: "var(--color-text-muted)" }}>
                          {ownerPhone}
                        </div>
                      )}
                    </td>

                    {/* Type & Location */}
                    <td>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "rgba(232, 165, 140, 0.15)",
                          color: "var(--color-navy)",
                          display: "inline-block",
                          marginBottom: "3px",
                        }}
                      >
                        {p.type || "Homestay"}
                      </span>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-navy)", fontWeight: 500 }}>
                        {locationLabel}
                      </div>
                    </td>

                    {/* Price */}
                    <td>
                      <strong style={{ color: "var(--color-navy)", fontSize: "0.88rem" }}>
                        ₹{Number(p.price || 0).toLocaleString("en-IN")}
                      </strong>
                      <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", display: "block" }}>
                        base / night
                      </span>
                    </td>

                    {/* Rooms */}
                    <td>
                      <button
                        type="button"
                        className="admin-rooms-count-btn"
                        onClick={() => setManagingRoomsStay(p)}
                        title={`Manage rooms for ${p.name}`}
                        style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                      >
                        <Bed size={13} weight="bold" />
                        <span>
                          {roomCount > 0 ? `${roomCount} rooms (${openRoomCount} open)` : "0 rooms"}
                        </span>
                      </button>
                    </td>

                    {/* Photos */}
                    <td>
                      <button
                        type="button"
                        className="admin-photo-count-btn"
                        onClick={() => setManagingPhotosStay(p)}
                        title="Manage cover photo and gallery"
                        style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                      >
                        <Camera size={13} weight="bold" />
                        <span>
                          {(hasCover ? 1 : 0) + galleryCount > 0
                            ? `${hasCover ? "Cover" : ""}${hasCover && galleryCount > 0 ? " + " : ""}${galleryCount > 0 ? `${galleryCount} gallery` : ""}`
                            : "Add Photos"}
                        </span>
                      </button>
                    </td>

                    {/* Status & Quick Moderation Actions */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "4px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: isApproved
                              ? "#e8f5e9"
                              : isPending
                              ? "#fff8e1"
                              : isRejected
                              ? "#ffebee"
                              : "#f1f5f9",
                            color: isApproved
                              ? "#1b5e20"
                              : isPending
                              ? "#b78103"
                              : isRejected
                              ? "#b71c1c"
                              : "#334155",
                          }}
                        >
                          {isPending && <Clock size={12} weight="bold" />}
                          {isApproved && <Check size={12} weight="bold" />}
                          {isRejected && <X size={12} weight="bold" />}
                          {isApproved
                            ? "Approved"
                            : isPending
                            ? "Pending Review"
                            : isRejected
                            ? "Rejected"
                            : "Draft"}
                        </span>

                        {p.reviewerNotes && (
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color: "#c53030",
                              background: "#fff5f5",
                              border: "1px solid #fed7d7",
                              borderRadius: "3px",
                              padding: "2px 6px",
                              maxWidth: "180px",
                              lineHeight: 1.2,
                            }}
                            title={`Reviewer note: ${p.reviewerNotes}`}
                          >
                            <strong>Notes:</strong> {p.reviewerNotes}
                          </div>
                        )}

                        {/* Moderation Actions Buttons */}
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "2px" }}>
                          {/* If pending or rejected or draft: allow Approve */}
                          {!isApproved && (
                            <button
                              type="button"
                              disabled={isActionBusy}
                              onClick={() => handleApprove(propertyId)}
                              title="Approve this property"
                              style={{
                                background: "#15803d",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "4px",
                                padding: "2px 8px",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                cursor: isActionBusy ? "wait" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <Check size={11} weight="bold" /> Approve
                            </button>
                          )}

                          {/* If pending or approved: allow Reject */}
                          {!isRejected && (
                            <button
                              type="button"
                              disabled={isActionBusy}
                              onClick={() => {
                                setRejectingProperty(p);
                                setRejectNotes(p.reviewerNotes || "");
                              }}
                              title="Reject this property application"
                              style={{
                                background: "#fee2e2",
                                color: "#991b1b",
                                border: "1px solid #fecaca",
                                borderRadius: "4px",
                                padding: "2px 8px",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                cursor: isActionBusy ? "wait" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <X size={11} weight="bold" /> Reject
                            </button>
                          )}

                          {/* Reset to Pending review */}
                          {(isApproved || isRejected) && (
                            <button
                              type="button"
                              disabled={isActionBusy}
                              onClick={() => handleResetPending(propertyId)}
                              title="Reset status to Pending Review"
                              style={{
                                background: "#f8fafc",
                                color: "#475569",
                                border: "1px solid #cbd5e1",
                                borderRadius: "4px",
                                padding: "2px 6px",
                                fontSize: "0.72rem",
                                fontWeight: 500,
                                cursor: isActionBusy ? "wait" : "pointer",
                              }}
                            >
                              Set Pending
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Featured Status Toggle */}
                    <td>
                      <button
                        type="button"
                        disabled={isActionBusy}
                        onClick={() => handleToggleFeatured(p)}
                        title={p.featured ? "Featured property (Click to remove)" : "Not featured (Click to feature)"}
                        style={{
                          background: p.featured ? "#fef3c7" : "transparent",
                          color: p.featured ? "#b45309" : "var(--color-text-muted)",
                          border: `1px solid ${p.featured ? "#fcd34d" : "var(--color-border)"}`,
                          borderRadius: "4px",
                          padding: "3px 7px",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          cursor: isActionBusy ? "wait" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Star size={13} weight={p.featured ? "fill" : "regular"} color={p.featured ? "#f59e0b" : "inherit"} />
                        <span>{p.featured ? "Featured" : "Regular"}</span>
                      </button>
                    </td>

                    {/* General Actions */}
                    <td>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="admin-icon-btn admin-icon-btn--danger"
                          title="Deactivate property"
                          aria-label="Deactivate property"
                        >
                          <Trash size={15} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-md)", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
            Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} total properties)
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="admin-btn admin-btn--secondary"
              style={{ fontSize: "0.78rem", padding: "4px 10px" }}
            >
              &larr; Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              className="admin-btn admin-btn--secondary"
              style={{ fontSize: "0.78rem", padding: "4px 10px" }}
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal with Reviewer Notes */}
      {rejectingProperty && (
        <div className="admin-modal-backdrop" onClick={() => setRejectingProperty(null)}>
          <div
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px" }}
          >
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--color-navy)" }}>
                Reject Property Application
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setRejectingProperty(null)}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "var(--color-navy)" }}>
                You are rejecting <strong>{rejectingProperty.name}</strong>. Provide a reason or notes for the partner host:
              </p>
              <textarea
                rows={3}
                className="admin-input"
                style={{ width: "100%", resize: "vertical", boxSizing: "border-box" }}
                placeholder="E.g., Incomplete description, unclear room rate, or invalid photo quality..."
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
              />
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => setRejectingProperty(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn"
                style={{ background: "#dc2626", color: "#fff", border: "none" }}
                onClick={() => handleReject(rejectingProperty._id || rejectingProperty.id, rejectNotes)}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Manager Modal */}
      {managingPhotosStay && (
        <PhotoManagerModal
          entity={managingPhotosStay}
          entityType="Stay"
          idKey="_id"
          onClose={() => setManagingPhotosStay(null)}
          onSaveSuccess={() => {
            loadProperties();
          }}
        />
      )}

      {/* Rooms Manager Modal */}
      {managingRoomsStay && (
        <PropertyRoomsManagerModal
          property={managingRoomsStay}
          allProperties={properties}
          onSelectProperty={(nextStay) => setManagingRoomsStay(nextStay)}
          onClose={() => {
            setManagingRoomsStay(null);
            if (searchParams.get("property") || searchParams.get("manageRooms")) {
              setSearchParams({});
            }
            loadProperties();
          }}
        />
      )}
    </div>
  );
}