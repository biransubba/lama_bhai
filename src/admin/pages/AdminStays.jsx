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
  Eye,
  MapPin,
  Users,
  XCircle,
  ArrowSquareOut,
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

const LISTING_STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Pending Review", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export default function AdminStays() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "listings");

  // Listings Moderation State (TASK 12)
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingStatusFilter, setListingStatusFilter] = useState("all");
  const [listingSearchInput, setListingSearchInput] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [listingPage, setListingPage] = useState(1);
  const [listingPagination, setListingPagination] = useState({ total: 0, totalPages: 1, currentPage: 1 });
  const [rejectingListing, setRejectingListing] = useState(null);
  const [listingRejectReason, setListingRejectReason] = useState("");
  const [viewingListing, setViewingListing] = useState(null);

  // Property containers state
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [bannerNotice, setBannerNotice] = useState("");

  // Filters & Search for Properties
  const [statusFilter, setStatusFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, currentPage: 1 });

  // Rejection note modal for properties
  const [rejectingProperty, setRejectingProperty] = useState(null);
  const [rejectNotes, setRejectNotes] = useState("");

  // Sub-modals for Photos, Rooms, Edit
  const [managingPhotosStay, setManagingPhotosStay] = useState(null);
  const [managingRoomsStay, setManagingRoomsStay] = useState(null);
  const [editingStay, setEditingStay] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Debounce listing search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setListingSearch(listingSearchInput);
      setListingPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [listingSearchInput]);

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

  // Load listings from GET /api/admin/rooms (TASK 12)
  const loadListings = useCallback(async () => {
    try {
      setListingsLoading(true);
      const params = {
        page: listingPage,
        limit: 30,
      };
      if (listingStatusFilter && listingStatusFilter !== "all") {
        params.status = listingStatusFilter;
      }
      if (listingSearch && listingSearch.trim()) {
        params.search = listingSearch.trim();
      }

      const res = await api.admin.getListings(params);
      if (res && res.success) {
        setListings(res.data || []);
        setListingPagination({
          total: res.total !== undefined ? res.total : (res.data ? res.data.length : 0),
          totalPages: res.totalPages || 1,
          currentPage: res.currentPage || listingPage,
        });
      } else {
        setListings([]);
      }
    } catch (err) {
      console.error("Failed to load admin listings:", err);
    } finally {
      setListingsLoading(false);
    }
  }, [listingStatusFilter, listingSearch, listingPage]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // Moderation: Approve listing
  async function handleApproveListing(listingId) {
    try {
      setActionLoadingId(listingId);
      const res = await api.admin.updateListingStatus(listingId, { status: "approved" });
      if (res && res.success) {
        setBannerNotice(`Listing "${res.data?.name || "Room"}" approved. It is now live on the public website.`);
        setTimeout(() => setBannerNotice(""), 5000);
        await loadListings();
        if (viewingListing && (viewingListing._id === listingId || viewingListing.id === listingId)) {
          setViewingListing(null);
        }
      }
    } catch (err) {
      console.error("Failed to approve listing:", err);
      alert(err.message || "Unable to approve listing.");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Moderation: Reject listing with reason
  async function handleConfirmRejectListing(listingId, reason = "") {
    try {
      setActionLoadingId(listingId);
      const payload = { status: "rejected" };
      if (reason && reason.trim()) {
        payload.rejectionReason = reason.trim();
        payload.reviewerNotes = reason.trim();
      }
      const res = await api.admin.updateListingStatus(listingId, payload);
      if (res && res.success) {
        setBannerNotice(`Listing "${res.data?.name || "Room"}" has been rejected.`);
        setTimeout(() => setBannerNotice(""), 5000);
        setRejectingListing(null);
        setListingRejectReason("");
        await loadListings();
        if (viewingListing && (viewingListing._id === listingId || viewingListing.id === listingId)) {
          setViewingListing(null);
        }
      }
    } catch (err) {
      console.error("Failed to reject listing:", err);
      alert(err.message || "Unable to reject listing.");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Moderation: Reset listing status to Pending review
  async function handleResetListingPending(listingId) {
    try {
      setActionLoadingId(listingId);
      const res = await api.admin.updateListingStatus(listingId, { status: "pending" });
      if (res && res.success) {
        setBannerNotice(`Listing "${res.data?.name || "Room"}" status reset to Pending review.`);
        setTimeout(() => setBannerNotice(""), 5000);
        await loadListings();
        if (viewingListing && (viewingListing._id === listingId || viewingListing.id === listingId)) {
          setViewingListing(null);
        }
      }
    } catch (err) {
      console.error("Failed to reset listing status:", err);
      alert(err.message || "Unable to reset listing status.");
    } finally {
      setActionLoadingId(null);
    }
  }

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

  const pendingListingsCount = listings.filter((r) => r.status === "pending").length;
  const approvedListingsCount = listings.filter((r) => r.status === "approved").length;
  const rejectedListingsCount = listings.filter((r) => r.status === "rejected").length;

  return (
    <div>
      {/* Page Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "var(--space-md)" }}>
        <div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            {activeTab === "listings" ? "Room Listings Moderation" : "Homestay Containers"}
          </h1>
          <p className="admin-page-note" style={{ margin: "4px 0 0" }}>
            {activeTab === "listings"
              ? "Review, approve, and verify individual room listings submitted by host partners before they go live."
              : "View and manage registered homestay containers and property records."}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={activeTab === "listings" ? loadListings : loadProperties}
            title="Refresh from MongoDB"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowsClockwise size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Room Listings Moderation (Primary) vs Homestay Containers */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid var(--color-border)", marginBottom: "var(--space-md)" }}>
        <button
          type="button"
          onClick={() => {
            setActiveTab("listings");
            setSearchParams({ tab: "listings" });
          }}
          style={{
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: "0.92rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "listings" ? "3px solid var(--color-navy)" : "3px solid transparent",
            color: activeTab === "listings" ? "var(--color-navy)" : "var(--color-text-muted)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "-2px",
          }}
        >
          <Bed size={18} weight={activeTab === "listings" ? "bold" : "regular"} />
          <span>Room Listings Moderation</span>
          {pendingListingsCount > 0 && (
            <span
              style={{
                background: "#d97706",
                color: "#fff",
                fontSize: "0.72rem",
                padding: "2px 7px",
                borderRadius: "10px",
                fontWeight: 700,
              }}
            >
              {pendingListingsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("properties");
            setSearchParams({ tab: "properties" });
          }}
          style={{
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: "0.92rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "properties" ? "3px solid var(--color-navy)" : "3px solid transparent",
            color: activeTab === "properties" ? "var(--color-navy)" : "var(--color-text-muted)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "-2px",
          }}
        >
          <HouseLine size={18} weight={activeTab === "properties" ? "bold" : "regular"} />
          <span>Homestay Containers ({pagination.total})</span>
        </button>
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
            onClick={activeTab === "listings" ? loadListings : loadProperties}
            className="admin-btn admin-btn--secondary"
            style={{ fontSize: "0.78rem", padding: "4px 10px" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: ROOM LISTINGS MODERATION (TASK 12 WORKFLOW)       */}
      {/* ======================================================== */}
      {activeTab === "listings" && (
        <div>
          {/* Pending Moderation Callout Banner */}
          {pendingListingsCount > 0 && listingStatusFilter !== "pending" && (
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
                    {pendingListingsCount} Room Listing{pendingListingsCount > 1 ? "s" : ""} Pending Review
                  </strong>
                  <div style={{ fontSize: "0.78rem", color: "#b45309", marginTop: "2px" }}>
                    Verify room pricing, description, photos, and specs before approving to go live on the public site.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setListingStatusFilter("pending");
                  setListingPage(1);
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
                Filter Pending ({pendingListingsCount})
              </button>
            </div>
          )}

          {/* Stat Cards for Listings */}
          <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", marginBottom: "var(--space-md)", gap: "10px" }}>
            <div className="admin-stat-card">
              <span className="admin-stat-card__value">{listingPagination.total || listings.length}</span>
              <span className="admin-stat-card__label">Total Listings</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-card__value" style={{ color: "#d97706" }}>
                {pendingListingsCount}
              </span>
              <span className="admin-stat-card__label">Pending Review</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-card__value" style={{ color: "#16a34a" }}>
                {approvedListingsCount}
              </span>
              <span className="admin-stat-card__label">Approved / Live</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-card__value" style={{ color: "#dc2626" }}>
                {rejectedListingsCount}
              </span>
              <span className="admin-stat-card__label">Rejected</span>
            </div>
          </div>

          {/* Listings Toolbar: Search & Status Filter */}
          <div className="admin-filter-bar" style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "var(--space-md)", alignItems: "center" }}>
            <div style={{ position: "relative", flexGrow: 1, minWidth: "240px", maxWidth: "360px" }}>
              <MagnifyingGlass
                size={16}
                style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }}
              />
              <input
                type="text"
                placeholder="Search listing, homestay, partner, town..."
                value={listingSearchInput}
                onChange={(e) => setListingSearchInput(e.target.value)}
                className="admin-input"
                style={{ paddingLeft: "32px", width: "100%" }}
              />
            </div>

            <select
              value={listingStatusFilter}
              onChange={(e) => {
                setListingStatusFilter(e.target.value);
                setListingPage(1);
              }}
              className="admin-input"
              style={{ width: "auto" }}
            >
              {LISTING_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Listings Content */}
          {listingsLoading ? (
            <div className="admin-card" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
              <Clock size={36} color="var(--color-peach-deep)" style={{ marginBottom: "8px" }} />
              <h3 style={{ margin: "0 0 6px", color: "var(--color-navy)" }}>Loading Room Listings...</h3>
              <p style={{ margin: 0, fontSize: "0.85rem" }}>
                Retrieving room listings moderation queue from MongoDB server.
              </p>
            </div>
          ) : listings.length === 0 ? (
            <div className="admin-card" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
              <Bed size={36} color="var(--color-peach-deep)" style={{ marginBottom: "8px" }} />
              <h3 style={{ margin: "0 0 6px", color: "var(--color-navy)" }}>No room listings found</h3>
              <p style={{ margin: 0, fontSize: "0.85rem" }}>
                No room listings match your current search and filter settings.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
              {listings.map((r) => {
                const listingId = r._id || r.id;
                const isApproved = r.status === "approved";
                const isPending = r.status === "pending";
                const isRejected = r.status === "rejected";
                const isActionBusy = actionLoadingId === listingId;

                const propertyName = r.property?.name || "Homestay Container";
                const partnerName = r.property?.owner?.name || "Host Partner";
                const town = r.location?.town || r.property?.location?.town || "Namchi";
                const district = r.location?.district || r.property?.location?.district || "South Sikkim";
                const locationLabel = `${town}, ${district}`;

                const coverPhoto = r.image || (Array.isArray(r.images) && r.images[0]) || r.property?.image;

                return (
                  <div
                    key={listingId}
                    className="admin-card"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      padding: 0,
                      overflow: "hidden",
                      border: isPending ? "2px solid #fde68a" : "1px solid var(--color-border)",
                      boxShadow: isPending ? "0 4px 12px rgba(245, 158, 11, 0.12)" : "var(--shadow-sm)",
                    }}
                  >
                    {/* Image Header with Status Pill */}
                    <div style={{ position: "relative", height: "160px", background: "#f1f5f9" }}>
                      {coverPhoto ? (
                        <img
                          src={coverPhoto}
                          alt={r.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
                          <Bed size={40} color="var(--color-peach-deep)" />
                        </div>
                      )}

                      {/* Status Badge Overlaid */}
                      <div style={{ position: "absolute", top: "10px", right: "10px" }}>
                        <span
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            padding: "4px 9px",
                            borderRadius: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            background: isApproved
                              ? "#ecfdf5"
                              : isPending
                              ? "#fffbeb"
                              : "#fef2f2",
                            color: isApproved
                              ? "#065f46"
                              : isPending
                              ? "#92400e"
                              : "#991b1b",
                            border: `1px solid ${
                              isApproved ? "#a7f3d0" : isPending ? "#fde68a" : "#fecaca"
                            }`,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                          }}
                        >
                          {isPending && <Clock size={13} weight="fill" color="#d97706" />}
                          {isApproved && <CheckCircle size={13} weight="fill" color="#10b981" />}
                          {isRejected && <XCircle size={13} weight="fill" color="#ef4444" />}
                          {isApproved ? "Approved / Live" : isPending ? "Pending Review" : "Rejected"}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: "14px", flexGrow: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div>
                        <strong style={{ fontSize: "1rem", color: "var(--color-navy)", display: "block" }}>
                          {r.name || "Untitled Room Listing"}
                        </strong>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                          <strong>{propertyName}</strong> • Host: {partnerName}
                        </div>
                      </div>

                      {/* Location */}
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                        <MapPin size={13} color="var(--color-peach-deep)" />
                        <span>{locationLabel}</span>
                      </div>

                      {/* Specs Row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(232, 165, 140, 0.08)", padding: "8px 10px", borderRadius: "6px", marginTop: "4px" }}>
                        <div>
                          <strong style={{ fontSize: "1.05rem", color: "var(--color-navy)" }}>
                            ₹{Number(r.price || 0).toLocaleString("en-IN")}
                          </strong>
                          <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginLeft: "4px" }}>
                            / night
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "0.74rem", background: "rgba(232, 165, 140, 0.2)", padding: "2px 6px", borderRadius: "4px", color: "var(--color-navy)", fontWeight: 600 }}>
                            {r.type || "Room"}
                          </span>
                          <span style={{ fontSize: "0.74rem", color: "var(--color-navy)", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <Users size={13} /> {r.maxGuests || r.capacity || 2}
                          </span>
                        </div>
                      </div>

                      {/* Amenities Preview */}
                      {Array.isArray(r.amenities) && r.amenities.length > 0 && (
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "2px" }}>
                          {r.amenities.slice(0, 3).map((amenity, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: "0.7rem",
                                background: "#f1f5f9",
                                color: "#475569",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              {amenity}
                            </span>
                          ))}
                          {r.amenities.length > 3 && (
                            <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                              +{r.amenities.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Rejection Alert Box */}
                      {isRejected && (r.rejectionReason || r.reviewerNotes) && (
                        <div
                          style={{
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: "4px",
                            padding: "6px 8px",
                            fontSize: "0.75rem",
                            color: "#991b1b",
                            marginTop: "4px",
                          }}
                        >
                          <strong>Rejection Reason:</strong> {r.rejectionReason || r.reviewerNotes}
                        </div>
                      )}

                      {/* Action Buttons Row */}
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "auto", paddingTop: "10px", borderTop: "1px solid var(--color-border)" }}>
                        <button
                          type="button"
                          onClick={() => setViewingListing(r)}
                          className="admin-btn admin-btn--secondary"
                          style={{ fontSize: "0.74rem", padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <Eye size={13} /> View
                        </button>

                        {!isApproved && (
                          <button
                            type="button"
                            disabled={isActionBusy}
                            onClick={() => handleApproveListing(listingId)}
                            style={{
                              background: "#16a34a",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              padding: "4px 10px",
                              fontSize: "0.74rem",
                              fontWeight: 600,
                              cursor: isActionBusy ? "wait" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Check size={13} weight="bold" /> Approve
                          </button>
                        )}

                        {!isRejected && (
                          <button
                            type="button"
                            disabled={isActionBusy}
                            onClick={() => {
                              setRejectingListing(r);
                              setListingRejectReason(r.rejectionReason || r.reviewerNotes || "");
                            }}
                            style={{
                              background: "#fee2e2",
                              color: "#991b1b",
                              border: "1px solid #fecaca",
                              borderRadius: "4px",
                              padding: "4px 8px",
                              fontSize: "0.74rem",
                              fontWeight: 600,
                              cursor: isActionBusy ? "wait" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <X size={13} weight="bold" /> Reject
                          </button>
                        )}

                        {(isApproved || isRejected) && (
                          <button
                            type="button"
                            disabled={isActionBusy}
                            onClick={() => handleResetListingPending(listingId)}
                            style={{
                              background: "#f8fafc",
                              color: "#475569",
                              border: "1px solid #cbd5e1",
                              borderRadius: "4px",
                              padding: "4px 8px",
                              fontSize: "0.74rem",
                              fontWeight: 500,
                              cursor: isActionBusy ? "wait" : "pointer",
                            }}
                          >
                            Set Pending
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Listings Pagination Bar */}
          {listingPagination.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-md)", flexWrap: "wrap", gap: "10px" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                Showing page {listingPagination.currentPage} of {listingPagination.totalPages} ({listingPagination.total} total listings)
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  disabled={listingPage <= 1}
                  onClick={() => setListingPage((prev) => Math.max(1, prev - 1))}
                  className="admin-btn admin-btn--secondary"
                  style={{ fontSize: "0.78rem", padding: "4px 10px" }}
                >
                  &larr; Previous
                </button>
                <button
                  type="button"
                  disabled={listingPage >= listingPagination.totalPages}
                  onClick={() => setListingPage((prev) => Math.min(listingPagination.totalPages, prev + 1))}
                  className="admin-btn admin-btn--secondary"
                  style={{ fontSize: "0.78rem", padding: "4px 10px" }}
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: HOMESTAY CONTAINERS (PROPERTIES)                  */}
      {/* ======================================================== */}
      {activeTab === "properties" && (
        <div>
          {/* Pending Moderation Callout Banner for Properties */}
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

          {/* Pagination Bar for Properties */}
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
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALS: LISTINGS & PROPERTY MODERATION                   */}
      {/* ======================================================== */}

      {/* Listing Rejection Modal (TASK 12) */}
      {rejectingListing && (
        <div className="admin-modal-backdrop" onClick={() => setRejectingListing(null)}>
          <div
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px" }}
          >
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--color-navy)" }}>
                Reject Room Listing
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setRejectingListing(null)}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "var(--color-navy)" }}>
                You are rejecting listing: <strong>{rejectingListing.name}</strong> from{" "}
                <strong>{rejectingListing.property?.name || "Homestay"}</strong>. Please state the reason for the partner:
              </p>
              <textarea
                rows={3}
                className="admin-input"
                style={{ width: "100%", resize: "vertical", boxSizing: "border-box" }}
                placeholder="E.g., Incomplete description, room rate exceeds guidelines, photo resolution too low..."
                value={listingRejectReason}
                onChange={(e) => setListingRejectReason(e.target.value)}
              />
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => setRejectingListing(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn"
                style={{ background: "#dc2626", color: "#fff", border: "none" }}
                onClick={() => handleConfirmRejectListing(rejectingListing._id || rejectingListing.id, listingRejectReason)}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listing Details Full Modal (TASK 12) */}
      {viewingListing && (
        <div className="admin-modal-backdrop" onClick={() => setViewingListing(null)}>
          <div
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="admin-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", color: "var(--color-navy)" }}>
                  {viewingListing.name || "Room Listing Details"}
                </h3>
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                  Listing ID: <code>{viewingListing._id || viewingListing.id}</code>
                </span>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setViewingListing(null)}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Cover & Gallery Strip */}
              {(viewingListing.image || (Array.isArray(viewingListing.images) && viewingListing.images.length > 0)) && (
                <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                  <img
                    src={viewingListing.image || viewingListing.images[0]}
                    alt={viewingListing.name}
                    style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }}
                  />
                  {Array.isArray(viewingListing.images) && viewingListing.images.length > 1 && (
                    <div style={{ display: "flex", gap: "6px", padding: "8px", background: "#f8fafc", overflowX: "auto" }}>
                      {viewingListing.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Gallery ${idx + 1}`}
                          style={{ width: "60px", height: "45px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Status Banner inside Modal */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  background: viewingListing.status === "approved"
                    ? "#ecfdf5"
                    : viewingListing.status === "rejected"
                    ? "#fef2f2"
                    : "#fffbeb",
                  border: `1px solid ${
                    viewingListing.status === "approved"
                      ? "#a7f3d0"
                      : viewingListing.status === "rejected"
                      ? "#fecaca"
                      : "#fde68a"
                  }`,
                }}
              >
                <div>
                  <strong style={{ fontSize: "0.85rem", color: "var(--color-navy)" }}>
                    Moderation Status:{" "}
                    <span style={{ textTransform: "capitalize" }}>{viewingListing.status}</span>
                  </strong>
                  {viewingListing.reviewedAt && (
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                      Reviewed on: {new Date(viewingListing.reviewedAt).toLocaleString()}
                    </div>
                  )}
                </div>
                {viewingListing.status === "approved" && (
                  <span style={{ fontSize: "0.78rem", color: "#065f46", fontWeight: 700 }}>🟢 Live on Public Website</span>
                )}
                {viewingListing.status === "pending" && (
                  <span style={{ fontSize: "0.78rem", color: "#92400e", fontWeight: 700 }}>🟡 Pending Admin Review</span>
                )}
                {viewingListing.status === "rejected" && (
                  <span style={{ fontSize: "0.78rem", color: "#991b1b", fontWeight: 700 }}>🔴 Rejected (Not Public)</span>
                )}
              </div>

              {/* Rejection Note */}
              {(viewingListing.rejectionReason || viewingListing.reviewerNotes) && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "10px", fontSize: "0.82rem", color: "#991b1b" }}>
                  <strong>Rejection Reason / Notes:</strong> {viewingListing.rejectionReason || viewingListing.reviewerNotes}
                </div>
              )}

              {/* Host Partner & Homestay Info */}
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                <strong style={{ fontSize: "0.88rem", color: "var(--color-navy)", display: "block", marginBottom: "6px" }}>
                  Host Partner &amp; Business Information
                </strong>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.82rem" }}>
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>Business / Homestay:</span>
                    <strong style={{ display: "block", color: "var(--color-navy)" }}>
                      {viewingListing.property?.name || "Homestay"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>Host Partner:</span>
                    <strong style={{ display: "block", color: "var(--color-navy)" }}>
                      {viewingListing.property?.owner?.name || "Direct / Admin"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>Partner Email:</span>
                    <div style={{ color: "var(--color-navy)" }}>
                      {viewingListing.property?.owner?.email || "N/A"}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>Partner Phone:</span>
                    <div style={{ color: "var(--color-navy)" }}>
                      {viewingListing.property?.owner?.phone || "N/A"}
                    </div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Listing Location:</span>
                    <div style={{ color: "var(--color-navy)", fontWeight: 500 }}>
                      {viewingListing.location?.address || viewingListing.property?.location?.address || ""}{" "}
                      {viewingListing.location?.town || viewingListing.property?.location?.town || "Namchi"},{" "}
                      {viewingListing.location?.district || viewingListing.property?.location?.district || "South Sikkim"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Room Specifications */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Price / Night</span>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-navy)" }}>
                    ₹{Number(viewingListing.price || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Room Type</span>
                  <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--color-navy)" }}>
                    {viewingListing.type || "Room"}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Max Guests</span>
                  <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--color-navy)" }}>
                    {viewingListing.maxGuests || viewingListing.capacity || 2} Guests
                  </div>
                </div>
              </div>

              {/* Description */}
              {viewingListing.description && (
                <div>
                  <strong style={{ fontSize: "0.85rem", color: "var(--color-navy)", display: "block", marginBottom: "4px" }}>
                    Room Description
                  </strong>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#475569", lineHeight: 1.4 }}>
                    {viewingListing.description}
                  </p>
                </div>
              )}

              {/* Amenities */}
              {Array.isArray(viewingListing.amenities) && viewingListing.amenities.length > 0 && (
                <div>
                  <strong style={{ fontSize: "0.85rem", color: "var(--color-navy)", display: "block", marginBottom: "6px" }}>
                    Included Amenities
                  </strong>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {viewingListing.amenities.map((item, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "0.75rem",
                          background: "rgba(232, 165, 140, 0.15)",
                          color: "var(--color-navy)",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontWeight: 500,
                        }}
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="admin-modal-footer" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {viewingListing.status !== "approved" && (
                  <button
                    type="button"
                    className="admin-btn"
                    style={{ background: "#16a34a", color: "#fff", border: "none" }}
                    onClick={() => handleApproveListing(viewingListing._id || viewingListing.id)}
                  >
                    <Check size={14} weight="bold" /> Approve Listing
                  </button>
                )}
                {viewingListing.status !== "rejected" && (
                  <button
                    type="button"
                    className="admin-btn"
                    style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" }}
                    onClick={() => {
                      setRejectingListing(viewingListing);
                      setListingRejectReason(viewingListing.rejectionReason || viewingListing.reviewerNotes || "");
                      setViewingListing(null);
                    }}
                  >
                    <X size={14} weight="bold" /> Reject Listing
                  </button>
                )}
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => setViewingListing(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Rejection Modal */}
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