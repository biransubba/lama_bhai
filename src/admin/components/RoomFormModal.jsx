import React, { useState, useRef } from "react";
import {
  X,
  Bed,
  HouseLine,
  CheckCircle,
  CurrencyInr,
  Users,
  ImageSquare,
  UploadSimple,
  Trash,
  Tag,
  ShieldCheck,
  WarningCircle,
} from "phosphor-react";
import { addRoom, updateRoom } from "../../data/staysStore.js";
import { compressImageFile } from "../../utils/mediaService.js";
import { ROOM_TYPES } from "../../data/schema.js";
import "./RoomFormModal.css";

const STANDARD_ROOM_AMENITIES = [
  "Attached Bathroom",
  "Hot Water",
  "Mountain View",
  "Room Heater / Bukhari",
  "Wi-Fi",
  "Balcony / Terrace",
  "Electric Kettle",
  "Heated Blankets",
  "TV",
  "Wardrobe",
  "Tea / Coffee Maker",
  "Extra Bedding on Request",
];

export default function RoomFormModal({
  property,
  room = null,
  onSave,
  onClose,
}) {
  if (!property || !property.id) {
    return (
      <div className="room-modal-overlay">
        <div className="room-modal">
          <div className="room-modal__error-box">
            <WarningCircle size={28} color="#dc2626" />
            <h3>Invalid Property Context</h3>
            <p>A room cannot exist without a valid parent property.</p>
            <button type="button" className="admin-btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isEditing = Boolean(room && room.id);

  // Form states
  const [name, setName] = useState(room?.name || "");
  const [type, setType] = useState(room?.type || "Standard Room");
  const [price, setPrice] = useState(room?.price || "");
  const [capacity, setCapacity] = useState(room?.capacity != null ? room.capacity : 2);
  const [availability, setAvailability] = useState(room?.availability || "available");
  const [status, setStatus] = useState(
    room?.status || (room?.active === false ? "draft" : "published")
  );
  const [description, setDescription] = useState(room?.description || "");

  // Amenities
  const [amenitiesList, setAmenitiesList] = useState(() => {
    if (Array.isArray(room?.amenities)) return [...room.amenities];
    if (typeof room?.amenities === "string") {
      return room.amenities.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return ["Attached Bathroom", "Hot Water", "Mountain View"];
  });
  const [customAmenity, setCustomAmenity] = useState("");

  // Room Cover Image
  const [coverImage, setCoverImage] = useState(room?.image || "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);

  // Error validation
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function toggleAmenity(item) {
    if (amenitiesList.includes(item)) {
      setAmenitiesList(amenitiesList.filter((a) => a !== item));
    } else {
      setAmenitiesList([...amenitiesList, item]);
    }
  }

  function handleAddCustomAmenity(e) {
    e.preventDefault();
    const clean = customAmenity.trim();
    if (clean && !amenitiesList.includes(clean)) {
      setAmenitiesList([...amenitiesList, clean]);
    }
    setCustomAmenity("");
  }

  function handleRemoveAmenity(item) {
    setAmenitiesList(amenitiesList.filter((a) => a !== item));
  }

  async function handleImageFile(e) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    setUploadingImage(true);
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 1600,
        maxHeight: 1200,
        quality: 0.85,
      });
      const dataUrl =
        typeof compressed === "object" && compressed?.dataUrl
          ? compressed.dataUrl
          : String(compressed || "");
      setCoverImage(dataUrl);
    } catch (err) {
      console.error("Room cover upload failed:", err);
      alert("Failed to process image. Please try a different photo.");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  function validate() {
    const errs = {};
    if (!name.trim()) {
      errs.name = "Room name is required (e.g. Deluxe Room, Room 1).";
    }
    if (!type.trim()) {
      errs.type = "Room category/type is required.";
    }
    if (!property.id) {
      errs.property = "Parent property association is missing.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const isDraft = status === "draft";
    const payload = {
      propertyId: property.id, // Strictly locked to parent property ID
      name: name.trim(),
      type: type.trim(),
      price: price ? String(price).trim() : null,
      capacity: capacity ? Number(capacity) : null,
      availability,
      status: isDraft ? "draft" : "published",
      active: !isDraft,
      description: description.trim(),
      amenities: amenitiesList,
      image: coverImage || null,
      gallery: Array.isArray(room?.gallery) ? room.gallery : [],
    };

    let result = null;
    if (isEditing) {
      result = updateRoom(room.id, payload);
    } else {
      result = addRoom(payload);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin-storage-changed", { detail: { repo: "admin_rooms" } }));
      window.dispatchEvent(new CustomEvent("storage"));
    }

    setSubmitting(false);
    if (onSave) onSave(result);
  }

  return (
    <div className="room-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="room-form-title">
      <div className="room-modal">
        {/* Header */}
        <div className="room-modal__header">
          <div>
            <span className="room-modal__kicker">
              <Bed size={14} weight="bold" /> Room Unit Management
            </span>
            <h2 id="room-form-title" className="room-modal__title">
              {isEditing ? `Edit Room: ${room.name}` : `Add New Room to ${property.name}`}
            </h2>
          </div>
          <button
            type="button"
            className="room-modal__close-btn"
            onClick={onClose}
            aria-label="Close room editor"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* LOCKED PARENT PROPERTY NOTICE */}
        <div className="room-modal__parent-banner">
          <div className="room-modal__parent-icon">
            <HouseLine size={20} weight="duotone" />
          </div>
          <div className="room-modal__parent-info">
            <div className="room-modal__parent-meta">
              <span className="room-modal__parent-badge">Locked Parent Property</span>
              <span className="room-modal__parent-type">{property.type || "Accommodation"}</span>
              <span className="room-modal__parent-loc">{property.location}, Sikkim</span>
            </div>
            <strong className="room-modal__parent-name">{property.name}</strong>
            <span className="room-modal__parent-id">
              Property ID: <code>{property.id}</code> (Automatically bound — no manual entry required)
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="room-modal__body">
          {errors.property && (
            <div className="room-modal__alert room-modal__alert--error">
              <WarningCircle size={16} /> {errors.property}
            </div>
          )}

          {/* Room Name & Category */}
          <div className="room-modal__row room-modal__row--2">
            <div className="room-modal__field">
              <label htmlFor="room-name">
                Room Name / Identifier <span className="room-modal__req">*</span>
              </label>
              <input
                id="room-name"
                type="text"
                placeholder="e.g. Deluxe Room, Valley View Suite, Room 1"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                }}
                className={errors.name ? "room-modal__input--error" : ""}
                required
              />
              {errors.name && <span className="room-modal__field-err">{errors.name}</span>}
            </div>

            <div className="room-modal__field">
              <label htmlFor="room-type">
                Room Category / Type <span className="room-modal__req">*</span>
              </label>
              <select
                id="room-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                {!ROOM_TYPES.includes(type) && <option value={type}>{type}</option>}
              </select>
            </div>
          </div>

          {/* Pricing & Capacity */}
          <div className="room-modal__row room-modal__row--3">
            <div className="room-modal__field">
              <label htmlFor="room-price">Nightly Rate / Tariff</label>
              <div className="room-modal__input-with-icon">
                <CurrencyInr size={16} />
                <input
                  id="room-price"
                  type="text"
                  placeholder="e.g. ₹2,400/night or 2400"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <span className="room-modal__field-hint">Leave blank for custom rate on inquiry</span>
            </div>

            <div className="room-modal__field">
              <label htmlFor="room-capacity">Guest Capacity</label>
              <div className="room-modal__input-with-icon">
                <Users size={16} />
                <input
                  id="room-capacity"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="e.g. 2"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>
              <span className="room-modal__field-hint">Max adults/guests comfortably hosted</span>
            </div>

            <div className="room-modal__field">
              <label htmlFor="room-availability">Booking Availability</label>
              <select
                id="room-availability"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              >
                <option value="available">Available (Open for booking)</option>
                <option value="unavailable">Unavailable (Blocked / Booked)</option>
              </select>
              <span className="room-modal__field-hint">Immediate real-time reservation toggle</span>
            </div>
          </div>

          {/* Publication Status */}
          <div className="room-modal__row">
            <div className="room-modal__field">
              <label htmlFor="room-status">Publication Status</label>
              <select
                id="room-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="published">Published (Visible on public property page)</option>
                <option value="draft">Draft (Hidden from public site)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="room-modal__field">
            <label htmlFor="room-description">Room Description</label>
            <textarea
              id="room-description"
              rows="3"
              placeholder="Highlight room-specific features, view directions (valley, snow peaks), bed configuration, wood timber details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Room-Specific Amenities */}
          <div className="room-modal__field">
            <label>Room Amenities &amp; Inclusions</label>
            <div className="room-modal__amenities-picker">
              {STANDARD_ROOM_AMENITIES.map((am) => {
                const isSelected = amenitiesList.includes(am);
                return (
                  <button
                    key={am}
                    type="button"
                    onClick={() => toggleAmenity(am)}
                    className={`room-modal__amenity-pill ${
                      isSelected ? "room-modal__amenity-pill--active" : ""
                    }`}
                  >
                    <span>{isSelected ? "✓" : "+"}</span>
                    <span>{am}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Amenities Pill Strip */}
            {amenitiesList.filter((a) => !STANDARD_ROOM_AMENITIES.includes(a)).length > 0 && (
              <div className="room-modal__custom-amenities-strip">
                <span className="room-modal__custom-label">Custom amenities:</span>
                {amenitiesList
                  .filter((a) => !STANDARD_ROOM_AMENITIES.includes(a))
                  .map((custom) => (
                    <span key={custom} className="room-modal__custom-pill">
                      <span>{custom}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenity(custom)}
                        title={`Remove ${custom}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            )}

            {/* Custom Amenity Adder */}
            <div className="room-modal__custom-amenity-row">
              <input
                type="text"
                placeholder="Add custom amenity (e.g. Wooden fireplace, Bathtub)..."
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomAmenity(e);
                  }
                }}
              />
              <button
                type="button"
                className="room-modal__add-amenity-btn"
                onClick={handleAddCustomAmenity}
              >
                + Add Amenity
              </button>
            </div>
          </div>

          {/* Room Cover Photo */}
          <div className="room-modal__field">
            <label>Room Cover Photo (Strictly Room Media)</label>
            <div className="room-modal__photo-row">
              {coverImage ? (
                <div className="room-modal__photo-preview">
                  <img src={coverImage} alt="Room cover" />
                  <button
                    type="button"
                    className="room-modal__photo-remove"
                    onClick={() => setCoverImage("")}
                    title="Remove room photo"
                  >
                    <Trash size={14} /> Remove
                  </button>
                </div>
              ) : (
                <div
                  className="room-modal__photo-placeholder"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImageSquare size={32} weight="duotone" />
                  <span>Click to upload room cover photo</span>
                </div>
              )}

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageFile}
              />

              <div className="room-modal__photo-actions">
                <button
                  type="button"
                  className="room-modal__upload-btn"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  <UploadSimple size={16} />
                  <span>{uploadingImage ? "Processing..." : coverImage ? "Replace Photo" : "Upload Room Photo"}</span>
                </button>
                <span className="room-modal__photo-note">
                  Room photos are stored separately from property gallery. You can also manage full multi-photo room galleries using the <strong>Room Photos</strong> button in the room list.
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="room-modal__footer">
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving Room..." : isEditing ? "Save Room Changes" : `Add Room to ${property.name}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
