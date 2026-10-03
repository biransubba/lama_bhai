import React, { useState, useEffect } from "react";
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
  CalendarCheck,
  Bed,
} from "phosphor-react";
import { usePartnerAuth } from "../context/PartnerAuthContext.jsx";
import { staysStore, getAllRoomsByPropertyId } from "../../data/staysStore.js";
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
  const { currentPartner, partnerStays, refreshAll } = usePartnerAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("");

  // Modals
  const [editingStay, setEditingStay] = useState(null);
  const [photoModalStay, setPhotoModalStay] = useState(null);
  const [roomModalStay, setRoomModalStay] = useState(null);

  // Sync with ?manageRooms=<stayId> query parameter
  useEffect(() => {
    const targetStayId = searchParams.get("manageRooms");
    if (targetStayId && partnerStays.length > 0) {
      const match = partnerStays.find((s) => s.id === targetStayId);
      if (match) {
        setRoomModalStay(match);
      }
    }
  }, [searchParams, partnerStays]);

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

    // Requirement 3: Update permitted details of assigned property
    // Partner cannot modify partnerId or delete the property from the platform (Requirement 7)
    staysStore.update("id", editingStay.id, {
      name: formData.name.trim(),
      type: formData.type,
      price: formData.price.trim() || null,
      contactDetails: formData.contactDetails.trim() || null,
      description: formData.description.trim(),
      amenities: formData.amenities,
      availability: formData.availability,
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
            My Properties ({partnerStays.length})
          </h1>
          <p className="admin-page-note" style={{ margin: "4px 0 0" }}>
            Homestays and lodges assigned to <strong>{currentPartner?.name}</strong> ({currentPartner?.agency}). Update room rates, host contacts, descriptions, and amenities.
          </p>
        </div>
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
            ? "No homestays or hotels assigned to your host account yet. Lama Bhai Main Admin controls property assignments."
            : "No properties match your search criteria."}
        </div>
      ) : (
        <div className="partner-property-grid">
          {filteredStays.map((stay) => {
            const isAvailable = stay.availability === "available";
            const rawCover = stay.image || (stay.gallery?.[0]?.src || stay.gallery?.[0]?.dataUrl) || null;
            const coverImg = typeof rawCover === "object" && rawCover !== null
              ? (rawCover.dataUrl || rawCover.src || "")
              : rawCover;

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
                  {/* Property Title & Availability Toggle */}
                  <div className="partner-property-header">
                    <div>
                      <h3 className="partner-property-title">
                        {stay.name}
                      </h3>
                      <span className="partner-property-location">
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

                  {/* Rate & Host Contact Bar */}
                  <div className="partner-property-meta-bar">
                    <div className="partner-property-rate">
                      <span className="partner-property-rate__label">Rate:</span>
                      <span className="partner-property-rate__val">
                        {stay.price ? (parseAndFormatPrice(stay.price)?.display || `₹${stay.price}`) : "On Request"}
                      </span>
                    </div>
                    {stay.contactDetails && (
                      <a
                        href={`tel:${stay.contactDetails}`}
                        className="partner-property-contact-chip"
                        title="Property contact number"
                      >
                        <Phone size={13} weight="bold" />
                        <span>{stay.contactDetails}</span>
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

                  {/* Room Inventory Preview */}
                  {(() => {
                    const stayRooms = getAllRoomsByPropertyId(stay.id);
                    const availRooms = stayRooms.filter((r) => r.availability === "available");
                    return (
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
                            {stayRooms.slice(0, 3).map((r, rIdx) => (
                              <div key={r.id} className="partner-property-room-item">
                                <div className="partner-property-room-item__info">
                                  <span className="partner-property-room-item__num">#{rIdx + 1}</span>
                                  <span className="partner-property-room-item__name">{r.name}</span>
                                  <span className="partner-property-room-item__type">· {r.type}</span>
                                </div>
                                <span
                                  className={`partner-property-room-item__badge ${
                                    r.availability === "available" ? "is-open" : "is-blocked"
                                  }`}
                                >
                                  {r.availability === "available" ? "Open" : "Blocked"}
                                </span>
                              </div>
                            ))}
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
                    );
                  })()}

                  {/* Structured 2x2 Action Buttons */}
                  <div className="partner-property-actions-grid">
                    {(() => {
                      const stayRooms = getAllRoomsByPropertyId(stay.id);
                      return (
                        <button
                          type="button"
                          className="partner-card-btn partner-card-btn--primary"
                          onClick={() => setRoomModalStay(stay)}
                          title="Manage multiple rooms, pricing, photos, and availability"
                        >
                          <Bed size={15} weight="bold" /> Manage Rooms ({stayRooms.length})
                        </button>
                      );
                    })()}

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
                      to={`/stays/${stay.id}`}
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

      {/* Property Rooms Manager Modal (Strictly Scoped to Partner's Assigned Properties) */}
      {roomModalStay && (
        <PropertyRoomsManagerModal
          property={roomModalStay}
          allProperties={partnerStays}
          onSelectProperty={(stay) => setRoomModalStay(stay)}
          onClose={() => {
            setRoomModalStay(null);
            if (searchParams.get("manageRooms")) {
              setSearchParams({});
            }
            refreshAll();
          }}
        />
      )}
    </div>
  );
}
