import React, { useState } from "react";
import { Link } from "react-router-dom";
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
  X,
  Phone,
  CurrencyInr,
  Plus,
} from "phosphor-react";
import { usePartnerAuth } from "../context/PartnerAuthContext.jsx";
import { staysStore } from "../../data/staysStore.js";
import PhotoManagerModal from "../../admin/components/PhotoManagerModal.jsx";
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

export default function PartnerStays() {
  const { currentPartner, partnerStays, refreshAll } = usePartnerAuth();

  const [search, setSearch] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("");

  // Modals
  const [editingStay, setEditingStay] = useState(null);
  const [photoModalStay, setPhotoModalStay] = useState(null);

  // Form state
  const [formData, setFormData] = useState({});

  function handleEditClick(stay) {
    setEditingStay(stay);
    setFormData({
      name: stay.name || "",
      location: stay.location || "",
      type: stay.type || "Homestay",
      price: stay.price || "",
      contactDetails: stay.contactDetails || currentPartner?.phone || "",
      description: stay.description || "",
      amenities: Array.isArray(stay.amenities) ? stay.amenities : [],
      availability: stay.availability || "available",
      status: stay.status || (stay.active !== false ? "published" : "draft"),
    });
  }

  function handleSaveStay(e) {
    e.preventDefault();
    if (!editingStay) return;

    staysStore.update("id", editingStay.id, {
      name: formData.name.trim(),
      type: formData.type,
      price: formData.price.trim() || null,
      contactDetails: formData.contactDetails.trim() || null,
      description: formData.description.trim(),
      amenities: formData.amenities,
      availability: formData.availability,
      status: formData.status,
      active: formData.status === "published",
    });

    setEditingStay(null);
    refreshAll();
  }

  function toggleAmenity(amenity) {
    const list = formData.amenities || [];
    if (list.includes(amenity)) {
      setFormData({ ...formData, amenities: list.filter((a) => a !== amenity) });
    } else {
      setFormData({ ...formData, amenities: [...list, amenity] });
    }
  }

  function toggleStayAvailability(stay) {
    const nextStatus = stay.availability === "available" ? "unavailable" : "available";
    staysStore.update("id", stay.id, { availability: nextStatus });
    refreshAll();
  }

  // Filter scoped stays
  const filteredStays = partnerStays.filter((stay) => {
    const matchSearch =
      !search ||
      stay.name.toLowerCase().includes(search.toLowerCase()) ||
      stay.location.toLowerCase().includes(search.toLowerCase());
    const matchAvail =
      !filterAvailability || stay.availability === filterAvailability;
    return matchSearch && matchAvail;
  });

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "var(--space-md)" }}>
        <div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            My Stays &amp; Rooms ({partnerStays.length})
          </h1>
          <p className="admin-page-note" style={{ margin: "4px 0 0" }}>
            Properties assigned to <strong>{currentPartner?.name}</strong> ({currentPartner?.agency}). Update room availability, pricing, photos, and amenities.
          </p>
        </div>
        <Link
          to="/partner/properties?add=true"
          className="admin-btn admin-btn--primary"
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
            textDecoration: "none",
          }}
          title="Create a new property listing"
        >
          <Plus size={16} weight="bold" /> + Add Property / Listing
        </Link>
      </div>

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

      {/* Property Cards Grid */}
      {filteredStays.length === 0 ? (
        <div className="admin-card" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
          {partnerStays.length === 0
            ? "No homestays or hotels assigned to your host account yet."
            : "No properties match your search criteria."}
        </div>
      ) : (
        <div className="partner-property-grid">
          {filteredStays.map((stay) => {
            const isAvailable = stay.availability === "available";
            const coverImg = stay.image || (stay.gallery?.[0]?.src) || null;

            return (
              <div key={stay.id} className="partner-property-card">
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 2px", fontSize: "1.1rem", color: "var(--color-navy)" }}>
                        {stay.name}
                      </h3>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={13} /> {stay.location}
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

                  {/* Price & Contact */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0", fontSize: "0.85rem" }}>
                    <div style={{ color: "var(--color-navy)", fontWeight: 700 }}>
                      {stay.price ? (
                        <span>Rate: <strong>{parseAndFormatPrice(stay.price)?.display || `₹${stay.price}`}</strong></span>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>No price set</span>
                      )}
                    </div>
                    {stay.contactDetails && (
                      <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                        <Phone size={12} /> {stay.contactDetails}
                      </span>
                    )}
                  </div>

                  {/* Description preview */}
                  <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: "0 0 10px", lineHeight: 1.4, flexGrow: 1 }}>
                    {stay.description
                      ? stay.description.length > 120
                        ? `${stay.description.slice(0, 120)}...`
                        : stay.description
                      : "No property description added yet."}
                  </p>

                  {/* Amenities */}
                  {stay.amenities?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "12px" }}>
                      {stay.amenities.slice(0, 4).map((a) => (
                        <span
                          key={a}
                          style={{
                            fontSize: "0.72rem",
                            background: "var(--color-peach-light)",
                            color: "var(--color-navy)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {a}
                        </span>
                      ))}
                      {stay.amenities.length > 4 && (
                        <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                          +{stay.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="partner-property-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary"
                      onClick={() => handleEditClick(stay)}
                      style={{ fontSize: "0.8rem", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      <PencilSimple size={14} /> Edit Details
                    </button>

                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary"
                      onClick={() => setPhotoModalStay(stay)}
                      style={{ fontSize: "0.8rem", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      <Camera size={14} /> Photos
                    </button>

                    <Link
                      to={`/stays/${stay.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn admin-btn--secondary"
                      style={{ fontSize: "0.8rem", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "5px", marginLeft: "auto" }}
                    >
                      <Eye size={14} /> View
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
                Edit {editingStay.name}
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label className="admin-label">Property Name</label>
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label className="admin-label">Live Availability</label>
                    <select
                      className="admin-input"
                      value={formData.availability}
                      onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    >
                      <option value="available">✓ Available for Bookings</option>
                      <option value="unavailable">✕ Booked Out / Unavailable</option>
                    </select>
                  </div>

                  <div>
                    <label className="admin-label">Public Listing Status</label>
                    <select
                      className="admin-input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="published">Live on Website (Published)</option>
                      <option value="draft">Hidden from Website (Draft / Seasonal Break)</option>
                    </select>
                  </div>
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
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary">
                  Save Changes
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
          idKey="id"
          repo={staysStore}
          onClose={() => setPhotoModalStay(null)}
          onSaveSuccess={() => {
            setPhotoModalStay(null);
            refreshAll();
          }}
        />
      )}
    </div>
  );
}
