import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  HouseLine,
  CheckCircle,
  XCircle,
  PencilSimple,
  Camera,
  Eye,
  MapPin,
  MagnifyingGlass,
  Check,
  Plus,
  Phone,
  Bed,
  WarningCircle,
  UploadSimple,
  X,
  Trash,
  ArrowsClockwise,
} from "phosphor-react";
import { usePartnerAuth } from "../context/PartnerAuthContext.jsx";
import { api } from "../../utils/api.js";
import PhotoManagerModal from "../../admin/components/PhotoManagerModal.jsx";
import PropertyRoomsManagerModal from "../../admin/components/PropertyRoomsManagerModal.jsx";
import { parseAndFormatPrice } from "../../utils/priceFormatter.js";

const PROPERTY_TYPES = [
  "Homestay",
  "Hotel",
  "Lodge",
  "Guest House",
  "Resort",
];

const SIKKIM_DISTRICTS = [
  "East Sikkim",
  "West Sikkim",
  "North Sikkim",
  "South Sikkim",
  "Pakyong",
  "Soreng",
  "Other",
];

const ADD_PROPERTY_AMENITIES = [
  "Wi-Fi",
  "Parking",
  "Hot Water",
  "Restaurant",
  "Room Service",
  "TV",
  "Heater",
  "Balcony",
  "Mountain View",
  "Breakfast",
];

const COMMON_AMENITIES = [
  "Hot Water",
  "Room Heater",
  "Organic Sikkimese Meals",
  "Mountain View",
  "Wi-Fi",
  "Campfire Area",
  "Balcony",
  "Parking",
  "Attached Bathroom",
  "Tea / Coffee Maker",
];

export default function PartnerProperties() {
  const { currentPartner } = usePartnerAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Backend properties state (source of truth from MongoDB)
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [search, setSearch] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("");

  // Modals state
  const [editingStay, setEditingStay] = useState(null);
  const [photoModalStay, setPhotoModalStay] = useState(null);
  const [roomModalStay, setRoomModalStay] = useState(null);

  // Edit form state
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Add Property Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [addPropError, setAddPropError] = useState("");
  const [successBanner, setSuccessBanner] = useState("");

  // Upload states
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState("");
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryUploadError, setGalleryUploadError] = useState("");
  const [coverUrlInput, setCoverUrlInput] = useState("");
  const [galleryUrlInput, setGalleryUrlInput] = useState("");

  const initialNewProperty = {
    name: "",
    type: "Homestay",
    description: "",
    district: "East Sikkim",
    town: "",
    address: "",
    pincode: "",
    price: "",
    phone: currentPartner?.phone || "",
    email: currentPartner?.email || "",
    amenities: [],
    image: "",
    gallery: [],
    latitude: "",
    longitude: "",
  };

  const [newPropData, setNewPropData] = useState(initialNewProperty);

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCover(true);
      setCoverUploadError("");
      const res = await api.upload.image(file, "lama-bhaila/properties");
      if (res && res.success && res.data?.url) {
        setNewPropData((prev) => ({ ...prev, image: res.data.url }));
      } else {
        setCoverUploadError(res?.error || "Failed to upload cover image.");
      }
    } catch (err) {
      setCoverUploadError(err.message || "Error uploading cover image.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleGalleryUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploadingGallery(true);
      setGalleryUploadError("");
      const res = await api.upload.gallery(files, "Gallery");
      if (res && res.success) {
        const list = Array.isArray(res.data) ? res.data : (res.data?.images || []);
        if (list.length > 0) {
          const urls = list.map((img) => (typeof img === "string" ? img : img.src));
          setNewPropData((prev) => ({
            ...prev,
            gallery: [...prev.gallery, ...urls],
          }));
        }
      } else {
        setGalleryUploadError(res?.error || "Failed to upload gallery images.");
      }
    } catch (err) {
      setGalleryUploadError(err.message || "Error uploading gallery photos.");
    } finally {
      setUploadingGallery(false);
    }
  }

  async function handleCreateProperty(e) {
    e.preventDefault();
    setAddPropError("");

    // Required fields: name, type, description, district, town, address, price, phone, cover image
    if (!newPropData.name.trim()) {
      setAddPropError("Property Name is required.");
      return;
    }
    if (!newPropData.type.trim()) {
      setAddPropError("Property Type is required.");
      return;
    }
    if (!newPropData.description.trim()) {
      setAddPropError("Property Description is required.");
      return;
    }
    if (!newPropData.district.trim()) {
      setAddPropError("District is required.");
      return;
    }
    if (!newPropData.town.trim()) {
      setAddPropError("Town / City is required.");
      return;
    }
    if (!newPropData.address.trim()) {
      setAddPropError("Address is required.");
      return;
    }
    const cleanPrice = String(newPropData.price || "").trim();
    if (!cleanPrice || isNaN(Number(cleanPrice)) || Number(cleanPrice) <= 0) {
      setAddPropError("Please provide a valid Price per Night (greater than 0).");
      return;
    }
    if (!newPropData.phone.trim()) {
      setAddPropError("Contact Phone Number is required.");
      return;
    }
    if (!newPropData.image.trim()) {
      setAddPropError("Cover Image is required. Please upload a cover photo or enter an image URL.");
      return;
    }

    try {
      setIsCreating(true);

      const payload = {
        name: newPropData.name.trim(),
        type: newPropData.type,
        description: newPropData.description.trim(),
        location: {
          district: newPropData.district,
          town: newPropData.town.trim(),
          address: newPropData.address.trim(),
          pincode: newPropData.pincode.trim(),
          coordinates: {
            latitude: newPropData.latitude ? Number(newPropData.latitude) : null,
            longitude: newPropData.longitude ? Number(newPropData.longitude) : null,
          },
        },
        price: Number(cleanPrice),
        image: newPropData.image.trim(),
        gallery: newPropData.gallery.map((g) => (typeof g === "string" ? g.trim() : g.src || g)),
        amenities: newPropData.amenities,
        contactDetails: {
          phone: newPropData.phone.trim(),
          email: newPropData.email.trim(),
        },
      };

      const res = await api.owner.createProperty(payload);

      if (res && res.success) {
        setShowAddModal(false);
        setNewPropData({
          ...initialNewProperty,
          phone: currentPartner?.phone || "",
          email: currentPartner?.email || "",
        });
        setSuccessBanner("Property created successfully and submitted for Admin approval.");
        setTimeout(() => setSuccessBanner(""), 7000);
        await loadProperties();
      } else {
        setAddPropError(res?.error || "Failed to create property.");
      }
    } catch (err) {
      setAddPropError(err.message || "An error occurred while creating the property.");
    } finally {
      setIsCreating(false);
    }
  }

  // Load properties scoped strictly to authenticated owner from backend
  const loadProperties = useCallback(async () => {
    try {
      setPageError("");
      const res = await api.owner.getProperties();
      if (res && res.success) {
        setProperties(res.data || []);
      } else {
        setProperties([]);
      }
    } catch (err) {
      if (err.status === 401) {
        setPageError("Authentication required. Please log in to view your properties.");
      } else if (err.status === 403) {
        setPageError("Access denied: Partner/Owner account required to manage properties.");
      } else if (err.status >= 500) {
        setPageError("A server error occurred while retrieving properties. Please try again later.");
      } else {
        setPageError(err.message || "Failed to load properties from backend.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Sync with ?add=true query parameter (e.g. from Sidebar or Dashboard CTA)
  useEffect(() => {
    if (searchParams.get("add") === "true" || searchParams.get("new") === "true") {
      setNewPropData({
        ...initialNewProperty,
        phone: currentPartner?.phone || "",
        email: currentPartner?.email || "",
      });
      setAddPropError("");
      setShowAddModal(true);
    }
  }, [searchParams, currentPartner]);

  // Sync with ?manageRooms=<stayId> query parameter
  useEffect(() => {
    const targetStayId = searchParams.get("manageRooms");
    if (targetStayId && properties.length > 0) {
      const match = properties.find((s) => (s._id || s.id) === targetStayId);
      if (match) {
        setRoomModalStay(match);
      }
    }
  }, [searchParams, properties]);

  function handleCloseAddModal() {
    if (isCreating) return;
    setShowAddModal(false);
    if (searchParams.get("add") || searchParams.get("new")) {
      setSearchParams({});
    }
  }

  function handleEditClick(stay) {
    setEditingStay(stay);
    const locationStr =
      typeof stay.location === "object" && stay.location !== null
        ? (stay.location.town
            ? `${stay.location.town}, ${stay.location.district}`
            : stay.location.district || "")
        : (stay.location || "");

    const contactStr =
      typeof stay.contactDetails === "object" && stay.contactDetails !== null
        ? stay.contactDetails.phone || ""
        : (stay.contactDetails || currentPartner?.phone || "");

    setFormData({
      name: stay.name || "",
      location: locationStr,
      type: stay.type || "Homestay",
      price: stay.price !== undefined && stay.price !== null ? String(stay.price) : "",
      contactDetails: contactStr,
      description: stay.description || "",
      amenities: Array.isArray(stay.amenities) ? [...stay.amenities] : [],
      availability:
        stay.availability ||
        (stay.active !== false ? "available" : "unavailable"),
    });
    setFormError("");
  }

  async function handleSaveStay(e) {
    e.preventDefault();
    if (!editingStay) return;
    setSaving(true);
    setFormError("");

    try {
      const stayId = editingStay._id || editingStay.id;
      const cleanPrice = String(formData.price || "").replace(/[^0-9.]/g, "");
      const numericPrice = cleanPrice ? Number(cleanPrice) : (editingStay.price || 0);

      // Preserve or update location structure
      let locationObj = editingStay.location;
      if (typeof formData.location === "string" && formData.location.trim()) {
        const parts = formData.location.split(",").map((s) => s.trim());
        locationObj = {
          district: editingStay.location?.district || "East Sikkim",
          town: parts[0] || editingStay.location?.town || "Gangtok",
          address: editingStay.location?.address || "",
          coordinates: editingStay.location?.coordinates || { latitude: null, longitude: null },
        };
        if (parts.length > 1 && parts[1]) {
          locationObj.district = parts[1];
        }
      }

      const updatePayload = {
        name: formData.name.trim(),
        type: formData.type,
        price: numericPrice,
        description: formData.description.trim(),
        amenities: formData.amenities || [],
        availability: formData.availability,
        location: locationObj,
        contactDetails: {
          phone: formData.contactDetails.trim(),
          email: editingStay.contactDetails?.email || currentPartner?.email || "",
        },
      };

      await api.owner.updateProperty(stayId, updatePayload);
      setEditingStay(null);
      await loadProperties();
    } catch (err) {
      if (err.status === 403) {
        setFormError("Access denied: You do not have permission to modify this property.");
      } else if (err.status === 404) {
        setFormError("Property not found. It may have been removed.");
      } else if (err.status === 400) {
        setFormError(err.message || "Invalid property details provided. Please review inputs.");
      } else {
        setFormError(err.message || "Failed to save property changes. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleAmenity(amenity) {
    const list = formData.amenities || [];
    if (list.includes(amenity)) {
      setFormData({ ...formData, amenities: list.filter((a) => a !== amenity) });
    } else {
      setFormData({ ...formData, amenities: [...list, amenity] });
    }
  }

  async function toggleStayAvailability(stay) {
    const isCurrentAvail =
      stay.availability === "available" ||
      (stay.availability !== "unavailable" && stay.active !== false);
    const nextStatus = isCurrentAvail ? "unavailable" : "available";

    try {
      const stayId = stay._id || stay.id;
      await api.owner.updateProperty(stayId, { availability: nextStatus });
      await loadProperties();
    } catch (err) {
      if (err.status === 403) {
        setPageError("Access denied: You do not have permission to update this property.");
      } else {
        setPageError(err.message || "Failed to update property availability.");
      }
    }
  }

  // Filter scoped stays in memory
  const filteredStays = properties.filter((stay) => {
    const locationStr =
      typeof stay.location === "object" && stay.location !== null
        ? `${stay.location.town || ""} ${stay.location.district || ""}`
        : (stay.location || "");

    const matchSearch =
      !search ||
      stay.name.toLowerCase().includes(search.toLowerCase()) ||
      locationStr.toLowerCase().includes(search.toLowerCase());

    const isAvail =
      stay.availability === "available" ||
      (stay.availability !== "unavailable" && stay.active !== false);

    const matchAvail =
      !filterAvailability ||
      (filterAvailability === "available" && isAvail) ||
      (filterAvailability === "unavailable" && !isAvail);

    return matchSearch && matchAvail;
  });

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "var(--space-md)" }}>
        <div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            My Properties ({properties.length})
          </h1>
          <p className="admin-page-note" style={{ margin: "4px 0 0" }}>
            Manage your properties for <strong>{currentPartner?.name}</strong> ({currentPartner?.agency}). Create listings, update room rates, host contacts, descriptions, and amenities.
          </p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => {
            setNewPropData({
              ...initialNewProperty,
              phone: currentPartner?.phone || "",
              email: currentPartner?.email || "",
            });
            setAddPropError("");
            setShowAddModal(true);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.92rem",
            padding: "10px 18px",
            fontWeight: 700,
            background: "var(--color-peach-deep)",
            color: "#ffffff",
            borderRadius: "var(--radius-sm)",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
          }}
          id="partner-add-property-btn"
          title="Create a new property listing"
        >
          <Plus size={16} weight="bold" /> + Add Property / Listing
        </button>
      </div>

      {successBanner && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#dcfce7",
            border: "1px solid #bbf7d0",
            color: "#15803d",
            padding: "12px 16px",
            borderRadius: "var(--radius-sm)",
            marginBottom: "var(--space-md)",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          <CheckCircle size={20} weight="fill" style={{ flexShrink: 0 }} />
          <span>{successBanner}</span>
        </div>
      )}

      {pageError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderLeft: "4px solid #ef4444",
            color: "#991b1b",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            marginBottom: "var(--space-md)",
            fontSize: "0.85rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <WarningCircle size={18} style={{ flexShrink: 0 }} />
            <span>{pageError}</span>
          </div>
          <Link
            to="/partner/login"
            className="admin-btn admin-btn--primary"
            style={{
              padding: "6px 14px",
              fontSize: "0.8rem",
              textDecoration: "none",
              background: "#991b1b",
              color: "#ffffff",
            }}
          >
            Log In as Partner &rarr;
          </Link>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="admin-filter-bar" style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "var(--space-md)" }}>
        <div style={{ position: "relative", flexGrow: 1, maxWidth: "360px" }}>
          <MagnifyingGlass
            size={16}
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search my homestays..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ paddingLeft: "32px", width: "100%" }}
          />
        </div>

        <select
          value={filterAvailability}
          onChange={(e) => setFilterAvailability(e.target.value)}
          className="admin-input"
          style={{ width: "auto" }}
        >
          <option value="">All Availability</option>
          <option value="available">Available Only</option>
          <option value="unavailable">Unavailable Only</option>
        </select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid var(--color-peach-light)",
              borderTopColor: "var(--color-peach-deep)",
              borderRadius: "50%",
              animation: "partner-spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <style>{`@keyframes partner-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <span style={{ color: "var(--color-navy)", fontSize: "0.95rem", fontWeight: 600 }}>
            Loading your properties...
          </span>
        </div>
      ) : filteredStays.length === 0 ? (
        /* Empty State */
        <div className="admin-card" style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-muted)" }}>
          {properties.length === 0 ? (
            <div style={{ maxWidth: "440px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "rgba(224, 122, 95, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-peach-deep)" }}>
                <HouseLine size={28} weight="duotone" />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--color-navy)", fontWeight: 700 }}>
                No properties yet.
              </h3>
              <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.5, color: "#64748b" }}>
                Create your first property listing and submit it for Admin approval.
              </p>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => {
                  setNewPropData({
                    ...initialNewProperty,
                    phone: currentPartner?.phone || "",
                    email: currentPartner?.email || "",
                  });
                  setAddPropError("");
                  setShowAddModal(true);
                }}
                style={{
                  marginTop: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--color-peach-deep)",
                  color: "#ffffff",
                  padding: "10px 18px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                }}
                id="partner-empty-add-property-btn"
                title="Create a new property listing"
              >
                <Plus size={16} weight="bold" /> + Add Property / Listing
              </button>
            </div>
          ) : (
            "No properties match your search criteria."
          )}
        </div>
      ) : (
        /* Property Cards Grid */
        <div className="partner-property-grid">
          {filteredStays.map((stay) => {
            const stayId = stay._id || stay.id;
            const isAvailable =
              stay.availability === "available" ||
              (stay.availability !== "unavailable" && stay.active !== false);

            const rawCover = stay.image || (stay.gallery?.[0]?.src || stay.gallery?.[0]?.dataUrl) || null;
            const coverImg = typeof rawCover === "object" && rawCover !== null
              ? (rawCover.dataUrl || rawCover.src || "")
              : rawCover;

            const locationDisplay =
              typeof stay.location === "object" && stay.location !== null
                ? (stay.location.town ? `${stay.location.town}, ${stay.location.district}` : stay.location.district || "Sikkim")
                : (stay.location || "Sikkim");

            const contactPhone =
              typeof stay.contactDetails === "object" && stay.contactDetails !== null
                ? stay.contactDetails.phone || ""
                : (stay.contactDetails || "");

            // Rooms populated directly by backend from MongoDB
            const stayRooms = Array.isArray(stay.rooms) ? stay.rooms.filter((r) => r.active !== false) : [];
            const availRooms = stayRooms.filter((r) => r.availability === "available" || (r.active !== false && !r.availability));

            return (
              <div key={stayId} className="partner-property-card">
                {/* Photo / Cover */}
                <div className="partner-property-cover">
                  {coverImg ? (
                    <img src={coverImg} alt={stay.name} />
                  ) : (
                    <div
                      style={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-text-muted)",
                        background: "#f1f5f9",
                        fontSize: "0.85rem",
                      }}
                    >
                      <HouseLine size={36} color="#94a3b8" />
                      <span style={{ marginTop: "4px" }}>No photo uploaded</span>
                    </div>
                  )}

                  <div className="partner-property-badge-wrap">
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "999px",
                        background: "rgba(23, 36, 58, 0.85)",
                        color: "#fff",
                      }}
                    >
                      {stay.type}
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "999px",
                        background: isAvailable ? "#1b5e20" : "#b71c1c",
                        color: "#fff",
                      }}
                    >
                      {isAvailable ? "Available" : "Unavailable / Booked"}
                    </span>
                    {/* Approval Status Badge */}
                    {stay.status === "approved" ? (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "999px",
                          background: "#15803d",
                          color: "#fff",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                        title="Approved by Admin — Live on Lama Bhai platform"
                      >
                        <Check size={11} weight="bold" /> Approved
                      </span>
                    ) : stay.status === "rejected" ? (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "999px",
                          background: "#b91c1c",
                          color: "#fff",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                        title={stay.reviewerNotes ? `Rejected: ${stay.reviewerNotes}` : "Rejected by Admin"}
                      >
                        <X size={11} weight="bold" /> Rejected
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "999px",
                          background: "#d97706",
                          color: "#fff",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                        title="Pending Admin verification and approval"
                      >
                        ⏳ Pending Approval
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="partner-property-body">
                  {/* Property Title & Availability Toggle */}
                  <div className="partner-property-header">
                    <div>
                      <h3 className="partner-property-title">
                        {stay.name}
                      </h3>
                      <span className="partner-property-location">
                        <MapPin size={13} /> {locationDisplay}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleStayAvailability(stay)}
                      className={`partner-toggle-btn ${
                        isAvailable ? "partner-toggle-btn--available" : "partner-toggle-btn--unavailable"
                      }`}
                      title="Quick toggle live availability"
                    >
                      {isAvailable ? (
                        <>
                          <CheckCircle size={14} weight="fill" /> Available
                        </>
                      ) : (
                        <>
                          <XCircle size={14} weight="fill" /> Booked
                        </>
                      )}
                    </button>
                  </div>

                  {/* Rate & Host Contact Bar */}
                  <div className="partner-property-meta-bar">
                    <div className="partner-property-rate">
                      <span className="partner-property-rate__label">Rate:</span>
                      <span className="partner-property-rate__val">
                        {stay.price ? (parseAndFormatPrice(stay.price)?.display || `₹${stay.price}`) : "On Request"}
                      </span>
                    </div>
                    {contactPhone && (
                      <a
                        href={`tel:${contactPhone}`}
                        className="partner-property-contact-chip"
                        title="Property contact number"
                      >
                        <Phone size={13} weight="bold" />
                        <span>{contactPhone}</span>
                      </a>
                    )}
                  </div>

                  {/* Description preview */}
                  <p className="partner-property-desc">
                    {stay.description
                      ? stay.description.length > 120
                        ? `${stay.description.slice(0, 120)}...`
                        : stay.description
                      : <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No property description added yet.</span>}
                  </p>

                  {/* Amenities */}
                  {stay.amenities?.length > 0 && (
                    <div className="partner-property-amenities-wrap">
                      {stay.amenities.slice(0, 4).map((a) => (
                        <span key={a} className="partner-property-amenity-pill">
                          {a}
                        </span>
                      ))}
                      {stay.amenities.length > 4 && (
                        <span className="partner-property-amenity-more">
                          +{stay.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Room Inventory Preview (Backend populated from MongoDB) */}
                  <div className="partner-property-rooms-preview">
                    <div className="partner-property-rooms-preview__header">
                      <span className="partner-property-rooms-preview__title">
                        <Bed size={15} weight="duotone" color="var(--color-peach-deep)" />
                        Rooms ({stayRooms.length})
                      </span>
                      <span
                        className={`partner-property-rooms-preview__status ${
                          availRooms.length > 0 ? "is-available" : "is-blocked"
                        }`}
                      >
                        {availRooms.length} of {stayRooms.length} Available
                      </span>
                    </div>

                    {stayRooms.length > 0 ? (
                      <div className="partner-property-rooms-preview__list">
                        {stayRooms.slice(0, 3).map((r, rIdx) => {
                          const rId = r._id || r.id;
                          const rAvail = r.availability === "available" || (r.active !== false && !r.availability);
                          return (
                            <div key={rId} className="partner-property-room-item">
                              <div className="partner-property-room-item__info">
                                <span className="partner-property-room-item__num">#{rIdx + 1}</span>
                                <span className="partner-property-room-item__name">{r.name}</span>
                                <span className="partner-property-room-item__type">· {r.type}</span>
                              </div>
                              <span
                                className={`partner-property-room-item__badge ${
                                  rAvail ? "is-open" : "is-blocked"
                                }`}
                              >
                                {rAvail ? "Open" : "Blocked"}
                              </span>
                            </div>
                          );
                        })}
                        {stayRooms.length > 3 && (
                          <div className="partner-property-rooms-preview__more">
                            +{stayRooms.length - 3} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="partner-property-rooms-preview__empty">
                        No individual rooms added yet.
                      </div>
                    )}
                  </div>

                  {/* Structured 2x2 Action Buttons */}
                  <div className="partner-property-actions-grid">
                    <button
                      type="button"
                      className="partner-card-btn partner-card-btn--primary"
                      onClick={() => setRoomModalStay(stay)}
                      title="Manage multiple rooms, pricing, photos, and availability"
                    >
                      <Bed size={15} weight="bold" /> Manage Rooms ({stayRooms.length})
                    </button>

                    <button
                      type="button"
                      className="partner-card-btn partner-card-btn--secondary"
                      onClick={() => handleEditClick(stay)}
                      title="Edit stay details and amenities"
                    >
                      <PencilSimple size={14} /> Edit Details
                    </button>

                    <button
                      type="button"
                      className="partner-card-btn partner-card-btn--secondary"
                      onClick={() => setPhotoModalStay(stay)}
                      title="Manage property photos and gallery"
                    >
                      <Camera size={14} /> Photos
                    </button>

                    <Link
                      to={`/stays/${stay.slug || stayId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="partner-card-btn partner-card-btn--secondary"
                      title="Preview public stay page in new tab"
                    >
                      <Eye size={14} /> View on Site
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Property Details Modal */}
      {editingStay && (
        <div className="admin-modal-backdrop" onClick={() => setEditingStay(null)}>
          <div
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "620px" }}
          >
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontSize: "1.15rem", color: "var(--color-navy)" }}>
                Edit Details: {editingStay.name}
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setEditingStay(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveStay}>
              <div className="admin-modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                {formError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "#fee2e2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      marginBottom: "12px",
                      fontSize: "0.84rem",
                    }}
                  >
                    <WarningCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label className="admin-label">Property Name *</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="admin-label">Property Type</label>
                    <select
                      className="admin-input"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="Homestay">Homestay</option>
                      <option value="Hotel">Hotel</option>
                      <option value="Guest House">Guest House</option>
                      <option value="Resort">Resort</option>
                      <option value="Lodge">Lodge</option>
                      <option value="Cottage">Cottage</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label className="admin-label">Nightly Rate / Price (₹)</label>
                    <div style={{ position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontWeight: 700,
                          color: "var(--color-navy)",
                        }}
                      >
                        ₹
                      </span>
                      <input
                        type="text"
                        className="admin-input"
                        style={{ paddingLeft: "26px" }}
                        value={formData.price || ""}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="e.g. 2000 or 2,500"
                      />
                    </div>
                    {formData.price && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-forest)",
                          fontWeight: 600,
                          marginTop: "3px",
                          display: "inline-block",
                        }}
                      >
                        ✓ Website display:{" "}
                        <strong>{parseAndFormatPrice(formData.price)?.display || `₹${formData.price} / night`}</strong>
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="admin-label">Host Contact Phone</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={formData.contactDetails || ""}
                      onChange={(e) => setFormData({ ...formData, contactDetails: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label className="admin-label">Availability Status</label>
                  <select
                    className="admin-input"
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  >
                    <option value="available">✓ Available for Bookings</option>
                    <option value="unavailable">✕ Unavailable / Booked Out / Closed</option>
                  </select>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label className="admin-label">Property Description &amp; Host Story</label>
                  <textarea
                    rows={4}
                    className="admin-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell guests about your homestay, the mountain scenery, meals served, and local hospitality..."
                  />
                </div>

                <div>
                  <label className="admin-label">Amenities &amp; Facilities</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                    {COMMON_AMENITIES.map((item) => {
                      const selected = (formData.amenities || []).includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleAmenity(item)}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "999px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            border: selected ? "1px solid var(--color-peach-deep)" : "1px solid var(--color-border)",
                            background: selected ? "var(--color-peach-light)" : "var(--color-surface)",
                            color: selected ? "var(--color-navy)" : "var(--color-text-muted)",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {selected ? <Check size={12} weight="bold" /> : <Plus size={12} />}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={() => setEditingStay(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Manager Modal */}
      {photoModalStay && (
        <PhotoManagerModal
          entity={photoModalStay}
          entityType="Stay"
          idKey="_id"
          backendMode={true}
          onClose={() => setPhotoModalStay(null)}
          onSaveSuccess={() => {
            setPhotoModalStay(null);
            loadProperties();
          }}
        />
      )}

      {/* Property Rooms Manager Modal */}
      {roomModalStay && (
        <PropertyRoomsManagerModal
          property={roomModalStay}
          backendMode
          allProperties={properties}
          onSelectProperty={(stay) => setRoomModalStay(stay)}
          onClose={() => {
            setRoomModalStay(null);
            if (searchParams.get("manageRooms")) {
              setSearchParams({});
            }
            loadProperties();
          }}
        />
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="admin-modal-backdrop" onClick={handleCloseAddModal}>
          <div
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "680px", width: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          >
            <div className="admin-modal-header" style={{ flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--color-navy)", fontWeight: 700 }}>
                  Add New Property
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                  Submit your property listing for Admin review and approval.
                </p>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={handleCloseAddModal}
                disabled={isCreating}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateProperty} style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1, margin: 0 }}>
              <div className="admin-modal-body" style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                {addPropError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "#fee2e2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-sm)",
                      marginBottom: "16px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    <WarningCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{addPropError}</span>
                  </div>
                )}

                {/* 1. BASIC INFORMATION */}
                <h4
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--color-navy)",
                    margin: "0 0 10px",
                    fontWeight: 700,
                    paddingBottom: "4px",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  Basic Information
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label className="admin-label">Property Name *</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="e.g., Kanchenjunga View Homestay"
                      value={newPropData.name}
                      onChange={(e) => {
                        setNewPropData({ ...newPropData, name: e.target.value });
                        setAddPropError("");
                      }}
                      disabled={isCreating}
                      required
                    />
                  </div>

                  <div>
                    <label className="admin-label">Property Type *</label>
                    <select
                      className="admin-input"
                      value={newPropData.type}
                      onChange={(e) => setNewPropData({ ...newPropData, type: e.target.value })}
                      disabled={isCreating}
                      required
                    >
                      {PROPERTY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label className="admin-label">Description *</label>
                  <textarea
                    rows="3"
                    className="admin-input"
                    placeholder="Describe your property, mountain views, peaceful environment, and the warm hospitality guests will enjoy..."
                    value={newPropData.description}
                    onChange={(e) => {
                      setNewPropData({ ...newPropData, description: e.target.value });
                      setAddPropError("");
                    }}
                    disabled={isCreating}
                    required
                  />
                </div>

                {/* 2. LOCATION */}
                <h4
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--color-navy)",
                    margin: "18px 0 10px",
                    fontWeight: 700,
                    paddingBottom: "4px",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  Location
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label className="admin-label">District *</label>
                    <select
                      className="admin-input"
                      value={newPropData.district}
                      onChange={(e) => setNewPropData({ ...newPropData, district: e.target.value })}
                      disabled={isCreating}
                      required
                    >
                      {SIKKIM_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="admin-label">Town / City *</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="e.g., Gangtok, Pelling, Lachen, Ravangla"
                      value={newPropData.town}
                      onChange={(e) => {
                        setNewPropData({ ...newPropData, town: e.target.value });
                        setAddPropError("");
                      }}
                      disabled={isCreating}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <label className="admin-label">Address *</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="e.g., Near Lower Helipad, Ridge Park Road"
                      value={newPropData.address}
                      onChange={(e) => {
                        setNewPropData({ ...newPropData, address: e.target.value });
                        setAddPropError("");
                      }}
                      disabled={isCreating}
                      required
                    />
                  </div>

                  <div>
                    <label className="admin-label">Pincode (optional)</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="e.g., 737101"
                      value={newPropData.pincode}
                      onChange={(e) => setNewPropData({ ...newPropData, pincode: e.target.value })}
                      disabled={isCreating}
                    />
                  </div>
                </div>

                {/* 3. PRICING */}
                <h4
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--color-navy)",
                    margin: "18px 0 10px",
                    fontWeight: 700,
                    paddingBottom: "4px",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  Pricing
                </h4>

                <div style={{ marginBottom: "16px", maxWidth: "280px" }}>
                  <label className="admin-label">Price per Night (₹) *</label>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontWeight: 700,
                        color: "var(--color-navy)",
                      }}
                    >
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      className="admin-input"
                      style={{ paddingLeft: "26px" }}
                      placeholder="2500"
                      value={newPropData.price}
                      onChange={(e) => {
                        setNewPropData({ ...newPropData, price: e.target.value });
                        setAddPropError("");
                      }}
                      disabled={isCreating}
                      required
                    />
                  </div>
                </div>

                {/* 4. CONTACT */}
                <h4
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--color-navy)",
                    margin: "18px 0 10px",
                    fontWeight: 700,
                    paddingBottom: "4px",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  Contact Details
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <label className="admin-label">Phone *</label>
                    <input
                      type="tel"
                      className="admin-input"
                      placeholder="e.g., 9876543210"
                      value={newPropData.phone}
                      onChange={(e) => {
                        setNewPropData({ ...newPropData, phone: e.target.value });
                        setAddPropError("");
                      }}
                      disabled={isCreating}
                      required
                    />
                  </div>

                  <div>
                    <label className="admin-label">Email (optional)</label>
                    <input
                      type="email"
                      className="admin-input"
                      placeholder="e.g., host@homestay.com"
                      value={newPropData.email}
                      onChange={(e) => setNewPropData({ ...newPropData, email: e.target.value })}
                      disabled={isCreating}
                    />
                  </div>
                </div>

                {/* 5. AMENITIES */}
                <h4
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--color-navy)",
                    margin: "18px 0 10px",
                    fontWeight: 700,
                    paddingBottom: "4px",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  Amenities
                </h4>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                    gap: "8px",
                    marginBottom: "16px",
                  }}
                >
                  {ADD_PROPERTY_AMENITIES.map((amenity) => {
                    const isChecked = newPropData.amenities.includes(amenity);
                    return (
                      <label
                        key={amenity}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "7px 10px",
                          background: isChecked ? "rgba(224, 122, 95, 0.12)" : "#f8fafc",
                          border: isChecked ? "1px solid var(--color-peach-deep)" : "1px solid var(--color-border)",
                          borderRadius: "var(--radius-sm)",
                          cursor: isCreating ? "default" : "pointer",
                          fontSize: "0.82rem",
                          fontWeight: isChecked ? 600 : 400,
                          color: "var(--color-navy)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isCreating}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewPropData((prev) => ({
                                ...prev,
                                amenities: [...prev.amenities, amenity],
                              }));
                            } else {
                              setNewPropData((prev) => ({
                                ...prev,
                                amenities: prev.amenities.filter((a) => a !== amenity),
                              }));
                            }
                          }}
                          style={{ accentColor: "var(--color-peach-deep)", cursor: "pointer" }}
                        />
                        <span>{amenity}</span>
                      </label>
                    );
                  })}
                </div>

                {/* 6. PHOTOS */}
                <h4
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--color-navy)",
                    margin: "18px 0 10px",
                    fontWeight: 700,
                    paddingBottom: "4px",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  Photos
                </h4>

                {/* Cover Image */}
                <div style={{ marginBottom: "14px" }}>
                  <label className="admin-label">Cover Image *</label>
                  <p style={{ margin: "0 0 8px", fontSize: "0.75rem", color: "#64748b" }}>
                    Primary photo displayed on property listings and search results.
                  </p>

                  {newPropData.image ? (
                    <div
                      style={{
                        position: "relative",
                        display: "inline-block",
                        borderRadius: "var(--radius-sm)",
                        overflow: "hidden",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <img
                        src={newPropData.image}
                        alt="Cover preview"
                        style={{ width: "200px", height: "130px", objectFit: "cover", display: "block" }}
                      />
                      <button
                        type="button"
                        onClick={() => setNewPropData({ ...newPropData, image: "" })}
                        disabled={isCreating}
                        style={{
                          position: "absolute",
                          top: "6px",
                          right: "6px",
                          background: "rgba(0, 0, 0, 0.7)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: "24px",
                          height: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                        title="Remove cover photo"
                      >
                        <X size={14} weight="bold" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <label
                          htmlFor="new-prop-cover-file"
                          className="admin-btn admin-btn--secondary"
                          style={{
                            cursor: uploadingCover || isCreating ? "default" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "0.82rem",
                            padding: "8px 14px",
                          }}
                        >
                          {uploadingCover ? (
                            <>
                              <ArrowsClockwise size={14} className="spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <UploadSimple size={15} weight="bold" />
                              Upload Cover Photo
                            </>
                          )}
                        </label>
                        <input
                          type="file"
                          id="new-prop-cover-file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          onChange={handleCoverUpload}
                          disabled={uploadingCover || isCreating}
                          style={{ display: "none" }}
                        />

                        <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>or paste URL:</span>
                        <input
                          type="url"
                          className="admin-input"
                          placeholder="https://example.com/cover.jpg"
                          value={coverUrlInput}
                          onChange={(e) => setCoverUrlInput(e.target.value)}
                          onBlur={() => {
                            if (coverUrlInput.trim()) {
                              setNewPropData({ ...newPropData, image: coverUrlInput.trim() });
                              setCoverUrlInput("");
                              setAddPropError("");
                            }
                          }}
                          style={{ flex: 1, minWidth: "180px", padding: "6px 10px", fontSize: "0.82rem" }}
                          disabled={isCreating}
                        />
                      </div>

                      {coverUploadError && (
                        <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#dc2626" }}>
                          {coverUploadError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Gallery Images */}
                <div style={{ marginBottom: "16px" }}>
                  <label className="admin-label">Gallery Images (optional)</label>
                  <p style={{ margin: "0 0 8px", fontSize: "0.75rem", color: "#64748b" }}>
                    Additional photos of guest rooms, dining area, balcony, and scenic surrounding views.
                  </p>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "10px" }}>
                    <label
                      htmlFor="new-prop-gallery-files"
                      className="admin-btn admin-btn--secondary"
                      style={{
                        cursor: uploadingGallery || isCreating ? "default" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.82rem",
                        padding: "8px 14px",
                      }}
                    >
                      {uploadingGallery ? (
                        <>
                          <ArrowsClockwise size={14} className="spin" />
                          Uploading Gallery...
                        </>
                      ) : (
                        <>
                          <UploadSimple size={15} weight="bold" />
                          Upload Gallery Photos
                        </>
                      )}
                    </label>
                    <input
                      type="file"
                      id="new-prop-gallery-files"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleGalleryUpload}
                      disabled={uploadingGallery || isCreating}
                      style={{ display: "none" }}
                    />

                    <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>or paste URL:</span>
                    <input
                      type="url"
                      className="admin-input"
                      placeholder="https://example.com/photo.jpg"
                      value={galleryUrlInput}
                      onChange={(e) => setGalleryUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (galleryUrlInput.trim()) {
                            setNewPropData({
                              ...newPropData,
                              gallery: [...newPropData.gallery, galleryUrlInput.trim()],
                            });
                            setGalleryUrlInput("");
                          }
                        }
                      }}
                      style={{ flex: 1, minWidth: "160px", padding: "6px 10px", fontSize: "0.82rem" }}
                      disabled={isCreating}
                    />
                    {galleryUrlInput.trim() && (
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary"
                        onClick={() => {
                          setNewPropData({
                            ...newPropData,
                            gallery: [...newPropData.gallery, galleryUrlInput.trim()],
                          });
                          setGalleryUrlInput("");
                        }}
                        style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                      >
                        Add URL
                      </button>
                    )}
                  </div>

                  {galleryUploadError && (
                    <p style={{ margin: "0 0 8px", fontSize: "0.78rem", color: "#dc2626" }}>
                      {galleryUploadError}
                    </p>
                  )}

                  {newPropData.gallery.length > 0 && (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {newPropData.gallery.map((gUrl, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: "relative",
                            width: "80px",
                            height: "60px",
                            borderRadius: "var(--radius-sm)",
                            overflow: "hidden",
                            border: "1px solid var(--color-border)",
                          }}
                        >
                          <img
                            src={typeof gUrl === "string" ? gUrl : gUrl.src}
                            alt={`Gallery ${idx + 1}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setNewPropData({
                                ...newPropData,
                                gallery: newPropData.gallery.filter((_, i) => i !== idx),
                              })
                            }
                            disabled={isCreating}
                            style={{
                              position: "absolute",
                              top: "2px",
                              right: "2px",
                              background: "rgba(0, 0, 0, 0.7)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "50%",
                              width: "18px",
                              height: "18px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                            title="Remove photo"
                          >
                            <X size={10} weight="bold" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 7. COORDINATES */}
                <h4
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--color-navy)",
                    margin: "18px 0 10px",
                    fontWeight: 700,
                    paddingBottom: "4px",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  GPS Coordinates (Optional)
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "8px" }}>
                  <div>
                    <label className="admin-label">Latitude</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="e.g., 27.3389"
                      value={newPropData.latitude}
                      onChange={(e) => setNewPropData({ ...newPropData, latitude: e.target.value })}
                      disabled={isCreating}
                    />
                  </div>

                  <div>
                    <label className="admin-label">Longitude</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="e.g., 88.6065"
                      value={newPropData.longitude}
                      onChange={(e) => setNewPropData({ ...newPropData, longitude: e.target.value })}
                      disabled={isCreating}
                    />
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div
                className="admin-modal-footer"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  padding: "12px 20px",
                  borderTop: "1px solid var(--color-border)",
                  background: "#f8fafc",
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={handleCloseAddModal}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={isCreating || uploadingCover || uploadingGallery}
                  id="partner-submit-property-btn"
                  style={{ minWidth: "150px" }}
                >
                  {isCreating ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <ArrowsClockwise size={16} className="spin" />
                      Creating property...
                    </span>
                  ) : (
                    "Create Property"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
