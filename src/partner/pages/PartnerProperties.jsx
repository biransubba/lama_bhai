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
} from "phosphor-react";
import { usePartnerAuth } from "../context/PartnerAuthContext.jsx";
import { api } from "../../utils/api.js";
import PhotoManagerModal from "../../admin/components/PhotoManagerModal.jsx";
import PropertyRoomsManagerModal from "../../admin/components/PropertyRoomsManagerModal.jsx";
import { parseAndFormatPrice } from "../../utils/priceFormatter.js";

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "var(--space-md)" }}>
        <div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            My Properties ({properties.length})
          </h1>
          <p className="admin-page-note" style={{ margin: "4px 0 0" }}>
            Homestays and lodges assigned to <strong>{currentPartner?.name}</strong> ({currentPartner?.agency}). Update room rates, host contacts, descriptions, and amenities.
          </p>
        </div>
      </div>

      {pageError && (
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
            marginBottom: "var(--space-md)",
            fontSize: "0.85rem",
          }}
        >
          <WarningCircle size={18} style={{ flexShrink: 0 }} />
          <span>{pageError}</span>
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
            Loading your assigned properties...
          </span>
        </div>
      ) : filteredStays.length === 0 ? (
        /* Empty State */
        <div className="admin-card" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
          {properties.length === 0
            ? "No homestays or hotels assigned to your host account yet. Lama Bhai Main Admin controls property assignments."
            : "No properties match your search criteria."}
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
    </div>
  );
}
