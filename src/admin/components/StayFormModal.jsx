import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  UploadSimple,
  Star,
  ArrowLeft,
  ArrowRight,
  Trash,
  ArrowClockwise,
  CheckCircle,
  WarningCircle,
  Camera,
  Info,
  Buildings,
  MapPinLine,
  User,
  Phone,
  ImageSquare,
  CurrencyInr,
  Bed,
  Copy,
} from "phosphor-react";
import { getApprovedPartners } from "../../data/partners.js";
import { getPhotosForProperty, savePhotosForProperty } from "../../utils/stayPhotoStorage.js";
import { compressImageFile } from "../../utils/mediaService.js";
import { parseAndFormatPrice } from "../../utils/priceFormatter.js";
import { getAllRoomsByPropertyId, saveRoomsForProperty } from "../../data/staysStore.js";
import { ROOM_TYPES } from "../../data/schema.js";
import "./StayFormModal.css";

const STANDARD_AMENITIES = [
  "Traditional wooden rooms",
  "Mountain view",
  "Home-cooked local meals",
  "Hot water",
  "Room heater / Bukhari",
  "Wi-Fi",
  "Organic garden",
  "Bonfire on request",
];

const DEFAULT_LOCATIONS = ["Lachen", "Lachung", "Dzongu", "Mangan", "Thangu"];
const PROPERTY_TYPES = ["Homestay", "Hotel", "Guest House", "Resort"];

export default function StayFormModal({
  initialValues = null,
  locations = DEFAULT_LOCATIONS,
  onSave,
  onClose,
}) {
  const isEditing = Boolean(initialValues && initialValues.id);
  const partners = getApprovedPartners();

  // Basic Details
  const [name, setName] = useState(initialValues?.name || "");
  const [type, setType] = useState(initialValues?.type || "Homestay");
  const [location, setLocation] = useState(initialValues?.location || locations[0] || "Lachen");
  const [customLocation, setCustomLocation] = useState("");
  const [isCustomLocation, setIsCustomLocation] = useState(false);

  // Status & Partner
  const [status, setStatus] = useState(initialValues?.status || (initialValues?.active === false ? "draft" : "published"));
  const [availability, setAvailability] = useState(initialValues?.availability || "available");
  const [partnerId, setPartnerId] = useState(initialValues?.partnerId || "");
  const [contactDetails, setContactDetails] = useState(initialValues?.contactDetails || "");
  const [price, setPrice] = useState(initialValues?.price || "");

  // Description & Amenities
  const [description, setDescription] = useState(initialValues?.description || "");
  const [amenitiesList, setAmenitiesList] = useState(() => {
    if (Array.isArray(initialValues?.amenities)) return [...initialValues.amenities];
    if (typeof initialValues?.amenities === "string") {
      return initialValues.amenities.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return ["Traditional wooden rooms", "Home-cooked local meals", "Mountain view", "Hot water"];
  });
  const [customAmenity, setCustomAmenity] = useState("");

  // Rooms State (Supports unlimited dynamic rooms under one property)
  const [rooms, setRooms] = useState(() => {
    if (initialValues?.id) {
      const existing = getAllRoomsByPropertyId(initialValues.id);
      if (existing && existing.length > 0) {
        return existing.map((r, i) => ({
          id: r.id || `room_${initialValues.id}_${i + 1}`,
          name: r.name || `Room ${i + 1}`,
          type: r.type || "Standard Room",
          price: r.price || "",
          capacity: r.capacity != null ? r.capacity : 2,
          availability: r.availability || "available",
          amenities: Array.isArray(r.amenities) ? r.amenities.join(", ") : (r.amenities || ""),
          description: r.description || "",
          image: r.image || "",
        }));
      }
    }
    return [
      {
        id: `room_${Date.now()}_1`,
        name: "Standard Room",
        type: "Standard Room",
        price: initialValues?.price || "",
        capacity: 2,
        availability: "available",
        amenities: "Attached Bathroom, Hot water",
        description: "",
        image: "",
      },
    ];
  });

  // Photos State
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Validation & Processing
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Initialize photos & rooms for editing or fallback
  useEffect(() => {
    let isMounted = true;
    async function loadExistingPhotos() {
      if (initialValues?.id) {
        try {
          const localList = await getPhotosForProperty(initialValues.id);
          if (!isMounted) return;

          if (localList && localList.length > 0) {
            const cover = localList.find((p) => p.isCover) || localList[0];
            const gallery = localList.filter((p) => p.id !== cover?.id);

            setCoverPhoto(cover ? { ...cover, isCover: true, category: "Cover" } : null);
            setGalleryPhotos(gallery.map((p, idx) => ({ ...p, isCover: false, order: idx })));
            return;
          }
        } catch (err) {
          console.warn("Could not load stay photos from IndexedDB:", err);
        }
      }

      // Fallback to seed values
      if (initialValues?.image) {
        setCoverPhoto({
          id: `seed_cover_${initialValues.id || Date.now()}`,
          dataUrl: initialValues.image,
          name: `${initialValues.name || "Stay"} Cover Photo`,
          isCover: true,
          order: 0,
          category: "Cover",
        });
      }

      if (Array.isArray(initialValues?.gallery) && initialValues.gallery.length > 0) {
        const seedGal = initialValues.gallery
          .map((g, idx) => {
            const src = typeof g === "string" ? g : g?.src;
            if (!src || src === initialValues.image) return null;
            return {
              id: `seed_gal_${initialValues.id || Date.now()}_${idx}`,
              dataUrl: src,
              name: (typeof g === "object" && g.alt) || `Gallery photo ${idx + 1}`,
              isCover: false,
              order: idx,
              category: "Gallery",
            };
          })
          .filter(Boolean);
        setGalleryPhotos(seedGal);
      }
    }

    loadExistingPhotos();

    // Load rooms for property
    if (initialValues?.id) {
      const existing = getAllRoomsByPropertyId(initialValues.id);
      if (existing && existing.length > 0) {
        setRooms(existing.map((r, i) => ({
          id: r.id || `room_${initialValues.id}_${i + 1}`,
          name: r.name || `Room ${i + 1}`,
          type: r.type || "Standard Room",
          price: r.price || "",
          capacity: r.capacity != null ? r.capacity : 2,
          availability: r.availability || "available",
          amenities: Array.isArray(r.amenities) ? r.amenities.join(", ") : (r.amenities || ""),
          description: r.description || "",
          image: r.image || "",
        })));
      } else {
        setRooms([]);
      }
    } else {
      setRooms([
        {
          id: `room_${Date.now()}_1`,
          name: "Standard Room",
          type: "Standard Room",
          price: "",
          capacity: 2,
          availability: "available",
          amenities: "Attached Bathroom, Hot water",
          description: "",
          image: "",
        },
      ]);
    }

    return () => {
      isMounted = false;
    };
  }, [initialValues]);

  // Room Management Handlers
  function handleAddRoom() {
    setRooms((prev) => [
      ...prev,
      {
        id: `room_${Date.now()}_${prev.length + 1}`,
        name: `Room ${prev.length + 1}`,
        type: "Standard Room",
        price: price || "",
        capacity: 2,
        availability: "available",
        amenities: "Attached Bathroom, Hot water",
        description: "",
        image: "",
      },
    ]);
  }

  function handleRoomChange(index, field, value) {
    setRooms((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function handleRemoveRoom(index) {
    setRooms((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDuplicateRoom(index) {
    setRooms((prev) => {
      const target = prev[index];
      const clone = {
        ...target,
        id: `room_${Date.now()}_${prev.length + 1}`,
        name: `${target.name || "Room"} (Copy)`,
      };
      const next = [...prev];
      next.splice(index + 1, 0, clone);
      return next;
    });
  }

  async function handleRoomPhotoUpload(index, e) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 1200,
        maxHeight: 900,
        quality: 0.82,
      });
      const dataUrl = typeof compressed === "object" && compressed?.dataUrl ? compressed.dataUrl : String(compressed || "");
      handleRoomChange(index, "image", dataUrl);
    } catch (err) {
      console.error("Room image upload error:", err);
      alert("Failed to process room photo.");
    }
  }

  // Handle location options
  const allLocationOptions = Array.from(
    new Set([...locations, ...DEFAULT_LOCATIONS, ...(initialValues?.location ? [initialValues.location] : [])])
  );

  // Toggle quick amenity
  function toggleAmenity(amenity) {
    if (amenitiesList.includes(amenity)) {
      setAmenitiesList(amenitiesList.filter((a) => a !== amenity));
    } else {
      setAmenitiesList([...amenitiesList, amenity]);
    }
  }

  function handleAddCustomAmenity(e) {
    e.preventDefault();
    if (!customAmenity.trim()) return;
    if (!amenitiesList.includes(customAmenity.trim())) {
      setAmenitiesList([...amenitiesList, customAmenity.trim()]);
    }
    setCustomAmenity("");
  }

  // Cover photo upload
  async function handleCoverFile(e) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    setUploadingCover(true);
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 1600,
        maxHeight: 1200,
        quality: 0.85,
      });
      const dataUrl = typeof compressed === "object" && compressed?.dataUrl ? compressed.dataUrl : String(compressed || "");

      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setCoverPhoto({
        id: `photo_cover_${Date.now()}`,
        dataUrl,
        name: cleanName,
        isCover: true,
        order: 0,
        category: "Cover",
      });
    } catch (err) {
      console.error("Cover image upload error:", err);
      alert("Failed to process cover image.");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  // Gallery photos upload (multi-file)
  async function handleGalleryFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingGallery(true);
    try {
      const newItems = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        const compressed = await compressImageFile(file, {
          maxWidth: 1600,
          maxHeight: 1200,
          quality: 0.82,
        });
        const dataUrl = typeof compressed === "object" && compressed?.dataUrl ? compressed.dataUrl : String(compressed || "");

        newItems.push({
          id: `photo_gal_${Date.now()}_${i}`,
          dataUrl,
          name: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          isCover: false,
          order: galleryPhotos.length + newItems.length,
          category: "Gallery",
        });
      }

      // If no cover photo is set yet, make the first one cover!
      let remaining = [...newItems];
      if (!coverPhoto && remaining.length > 0) {
        setCoverPhoto({
          ...remaining[0],
          isCover: true,
          category: "Cover",
        });
        remaining = remaining.slice(1);
      }

      setGalleryPhotos((prev) => [...prev, ...remaining].map((p, idx) => ({ ...p, order: idx })));
    } catch (err) {
      console.error("Gallery files upload error:", err);
      alert("Failed to process some gallery photos.");
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  // Promote gallery item to cover
  function handleSetAsCover(photoId) {
    const selected = galleryPhotos.find((p) => p.id === photoId);
    if (!selected) return;

    const newCover = { ...selected, isCover: true, category: "Cover", order: 0 };
    const remainingGallery = galleryPhotos.filter((p) => p.id !== photoId);

    if (coverPhoto) {
      remainingGallery.unshift({
        ...coverPhoto,
        isCover: false,
        category: "Gallery",
      });
    }

    setCoverPhoto(newCover);
    setGalleryPhotos(remainingGallery.map((p, idx) => ({ ...p, order: idx })));
  }

  function handleMoveGalleryLeft(idx) {
    if (idx <= 0) return;
    setGalleryPhotos((prev) => {
      const next = [...prev];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      return next.map((p, i) => ({ ...p, order: i }));
    });
  }

  function handleMoveGalleryRight(idx) {
    if (idx >= galleryPhotos.length - 1) return;
    setGalleryPhotos((prev) => {
      const next = [...prev];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      return next.map((p, i) => ({ ...p, order: i }));
    });
  }

  function handleDeleteGallery(idx) {
    setGalleryPhotos((prev) => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, order: i })));
  }

  // Validation
  function validate() {
    const nextErrors = {};
    if (!name.trim()) {
      nextErrors.name = "Property name is required.";
    }
    const finalLocation = isCustomLocation ? customLocation.trim() : location;
    if (!finalLocation) {
      nextErrors.location = "Location is required.";
    }
    if (!type) {
      nextErrors.type = "Property type is required.";
    }
    if (!availability) {
      nextErrors.availability = "Availability status is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  // Submit Handler
  async function handleSubmit(targetStatus = status) {
    if (!validate()) return;

    setSubmitting(true);
    const finalLocation = isCustomLocation ? customLocation.trim() : location;

    // Stable Unique Property ID (Requirement 5)
    const propertyId = isEditing
      ? initialValues.id
      : `stay_${finalLocation.toLowerCase().replace(/[^a-z0-9]+/g, "")}_${Date.now().toString(36)}`;

    function unwrapDataUrl(val) {
      if (!val) return "";
      if (typeof val === "string") return val;
      if (typeof val === "object") {
        if (typeof val.dataUrl === "string") return val.dataUrl;
        if (typeof val.dataUrl === "object" && val.dataUrl) return unwrapDataUrl(val.dataUrl);
        if (typeof val.src === "string") return val.src;
        if (typeof val.src === "object" && val.src) return unwrapDataUrl(val.src);
        if (typeof val.url === "string") return val.url;
      }
      return String(val || "");
    }

    // Prepare photos list to save in IndexedDB
    const allPhotosToSave = [];
    if (coverPhoto) {
      allPhotosToSave.push({
        ...coverPhoto,
        propertyId,
        dataUrl: unwrapDataUrl(coverPhoto.dataUrl),
        isCover: true,
        category: "Cover",
        order: 0,
      });
    }
    galleryPhotos.forEach((p) => {
      allPhotosToSave.push({
        ...p,
        propertyId,
        dataUrl: unwrapDataUrl(p.dataUrl || p.src),
        isCover: false,
        category: "Gallery",
        order: allPhotosToSave.length,
      });
    });

    // Save photos to IndexedDB
    try {
      if (allPhotosToSave.length > 0) {
        await savePhotosForProperty(propertyId, allPhotosToSave);
      }
    } catch (photoErr) {
      console.warn("Could not save photos to IndexedDB:", photoErr);
    }

    // Prepare and normalize rooms list
    const normalizedRoomsList = rooms
      .filter((r) => r && r.name && r.name.trim())
      .map((r, idx) => ({
        id: r.id || `room_${propertyId}_${idx + 1}`,
        propertyId,
        name: r.name.trim(),
        type: r.type || "Standard Room",
        price: r.price ? String(r.price).trim() : null,
        capacity: r.capacity !== "" && !isNaN(Number(r.capacity)) ? Number(r.capacity) : 2,
        availability: r.availability === "unavailable" ? "unavailable" : "available",
        amenities: typeof r.amenities === "string"
          ? r.amenities.split(",").map((s) => s.trim()).filter(Boolean)
          : (Array.isArray(r.amenities) ? r.amenities : []),
        description: r.description ? r.description.trim() : "",
        image: r.image ? unwrapDataUrl(r.image) : null,
        gallery: r.image
          ? [{ id: `r_gal_${idx}`, src: unwrapDataUrl(r.image), alt: r.name.trim(), category: "Room" }]
          : [],
        status: targetStatus,
        active: targetStatus !== "draft",
        isSampleData: false,
      }));

    // Save rooms directly to repository
    saveRoomsForProperty(propertyId, normalizedRoomsList);

    const payload = {
      id: propertyId,
      name: name.trim(),
      type,
      location: finalLocation,
      description: description.trim(),
      amenities: amenitiesList,
      contactDetails: contactDetails.trim() || null,
      partnerId: partnerId ? partnerId.trim() : null,
      price: price ? String(price).trim() : null,
      availability,
      status: targetStatus,
      active: targetStatus !== "draft",
      image: coverPhoto ? unwrapDataUrl(coverPhoto.dataUrl) || null : null,
      gallery: galleryPhotos.map((p, idx) => ({
        id: p.id || `gal_${idx}`,
        src: unwrapDataUrl(p.dataUrl || p.src),
        alt: p.name || name.trim(),
        category: "Gallery",
      })),
      rooms: normalizedRoomsList,
      roomCount: normalizedRoomsList.length,
      isSampleData: false,
    };

    onSave(payload, allPhotosToSave, normalizedRoomsList);
    setSubmitting(false);
  }

  return (
    <div
      className="stay-form-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stay-form-title"
      onClick={onClose}
    >
      <div className="stay-form-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="stay-form__header">
          <div className="stay-form__header-info">
            <span className="stay-form__badge">
              <Buildings size={14} weight="bold" /> Main Admin • Stays Management
            </span>
            <h2 id="stay-form-title" className="stay-form__title">
              {isEditing ? `Edit ${initialValues?.name || "Stay"}` : "Add New Stay"}
            </h2>
            <p className="stay-form__sub">
              Manage property information, partner assignment, and photo slideshow.
            </p>
          </div>
          <button
            type="button"
            className="stay-form__close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Local Persistence Notice (Requirement 11) */}
        <div className="stay-form__notice">
          <Info size={16} weight="bold" />
          <span>
            <strong>Local Browser Storage:</strong> Stays are stored locally in your browser's persistent storage. Once published, this property will automatically appear across public Stays listings and its location page.
          </span>
        </div>

        {/* Form Body */}
        <div className="stay-form__body">
          {/* SECTION 1: BASIC PROPERTY DETAILS */}
          <div className="stay-form-section">
            <h3 className="stay-form-section__title">
              <Buildings size={18} weight="bold" /> 1. Property Details
            </h3>

            <div className="stay-form-grid">
              {/* Property Name */}
              <div className="stay-form-field stay-form-grid--full">
                <label className="stay-form-field__label">
                  Property Name <span className="stay-form-field__required">*</span>
                </label>
                <input
                  type="text"
                  className={`stay-form-field__input ${errors.name ? "stay-form-field__input--error" : ""}`}
                  placeholder="e.g., Lachen Alpine Homestay, Lachung Valley Resort..."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                />
                {errors.name && (
                  <span className="stay-form-field__error-msg">
                    <WarningCircle size={14} weight="fill" /> {errors.name}
                  </span>
                )}
              </div>

              {/* Property Type */}
              <div className="stay-form-field">
                <label className="stay-form-field__label">
                  Property Type <span className="stay-form-field__required">*</span>
                </label>
                <select
                  className={`stay-form-field__select ${errors.type ? "stay-form-field__select--error" : ""}`}
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    if (errors.type) setErrors({ ...errors, type: undefined });
                  }}
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <span className="stay-form-field__error-msg">
                    <WarningCircle size={14} weight="fill" /> {errors.type}
                  </span>
                )}
              </div>

              {/* Location */}
              <div className="stay-form-field">
                <label className="stay-form-field__label">
                  Sikkim Location <span className="stay-form-field__required">*</span>
                </label>
                {!isCustomLocation ? (
                  <select
                    className={`stay-form-field__select ${errors.location ? "stay-form-field__select--error" : ""}`}
                    value={location}
                    onChange={(e) => {
                      if (e.target.value === "__CUSTOM__") {
                        setIsCustomLocation(true);
                      } else {
                        setLocation(e.target.value);
                        if (errors.location) setErrors({ ...errors, location: undefined });
                      }
                    }}
                  >
                    {allLocationOptions.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Add Custom Location...</option>
                  </select>
                ) : (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      className="stay-form-field__input"
                      placeholder="Type Sikkim village / town..."
                      value={customLocation}
                      autoFocus
                      onChange={(e) => {
                        setCustomLocation(e.target.value);
                        if (errors.location) setErrors({ ...errors, location: undefined });
                      }}
                    />
                    <button
                      type="button"
                      className="stay-form__btn-cancel"
                      style={{ padding: "6px 12px" }}
                      onClick={() => setIsCustomLocation(false)}
                      title="Choose from list"
                    >
                      Choose List
                    </button>
                  </div>
                )}
                {errors.location && (
                  <span className="stay-form-field__error-msg">
                    <WarningCircle size={14} weight="fill" /> {errors.location}
                  </span>
                )}
              </div>

              {/* Availability */}
              <div className="stay-form-field">
                <label className="stay-form-field__label">
                  Availability Status <span className="stay-form-field__required">*</span>
                </label>
                <select
                  className="stay-form-field__select"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                >
                  <option value="available">🟢 Available for Booking</option>
                  <option value="unavailable">🔴 Currently Unavailable</option>
                </select>
              </div>

              {/* Contact Details */}
              <div className="stay-form-field">
                <label className="stay-form-field__label">
                  <Phone size={14} /> Contact Details (Optional)
                </label>
                <input
                  type="text"
                  className="stay-form-field__input"
                  placeholder="e.g. Phone, WhatsApp, or Manager name"
                  value={contactDetails}
                  onChange={(e) => setContactDetails(e.target.value)}
                />
              </div>

              {/* Nightly Rate / Price */}
              <div className="stay-form-field">
                <label className="stay-form-field__label">
                  <CurrencyInr size={14} /> Nightly Rate / Price (₹)
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontWeight: 700,
                      color: "var(--color-navy)",
                      fontSize: "0.95rem",
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="text"
                    className="stay-form-field__input"
                    style={{ paddingLeft: "28px" }}
                    placeholder="e.g. 2000 or 2,500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                {price && (
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--color-forest)",
                      fontWeight: 600,
                      marginTop: "4px",
                      display: "inline-block",
                    }}
                  >
                    ✓ Live website display:{" "}
                    <strong>{parseAndFormatPrice(price)?.display || `₹${price} / night`}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: PARTNER ASSIGNMENT & PUBLICATION STATUS */}
          <div className="stay-form-section">
            <h3 className="stay-form-section__title">
              <User size={18} weight="bold" /> 2. Partner Assignment &amp; Visibility
            </h3>

            <div className="stay-form-grid">
              {/* Partner Assignment */}
              <div className="stay-form-field">
                <label className="stay-form-field__label">
                  Assigned Partner (Requirement 4 &amp; 5)
                </label>
                <select
                  className="stay-form-field__select"
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                >
                  <option value="">— Unassigned (Pending Partner Approval) —</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.agency || p.location}) • {p.id}
                    </option>
                  ))}
                  {partnerId && !partners.some((p) => p.id === partnerId) && (
                    <option value={partnerId}>Custom Partner ({partnerId})</option>
                  )}
                </select>
                <p className="stay-form-field__help">
                  {partnerId
                    ? `Property will be linked to partner ID: ${partnerId}`
                    : "Unassigned stays remain managed directly by Main Admin until assigned."}
                </p>
              </div>

              {/* Publication Status (Draft vs Published) */}
              <div className="stay-form-field">
                <label className="stay-form-field__label">
                  Publication Status (Requirement 6 &amp; 7)
                </label>
                <div className="status-pill-group">
                  <button
                    type="button"
                    className={`status-pill-btn status-pill-btn--published ${status === "published" ? "status-pill-btn--active" : ""}`}
                    onClick={() => setStatus("published")}
                  >
                    <CheckCircle size={15} weight="fill" />
                    Published (Public)
                  </button>
                  <button
                    type="button"
                    className={`status-pill-btn status-pill-btn--draft ${status === "draft" ? "status-pill-btn--active" : ""}`}
                    onClick={() => setStatus("draft")}
                  >
                    <Star size={15} weight="bold" />
                    Draft (Admin Only)
                  </button>
                </div>
                <p className="stay-form-field__help">
                  {status === "published"
                    ? "Visible on public Stays listing and the location page."
                    : "Hidden from public website visitors until published."}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: DESCRIPTION & AMENITIES */}
          <div className="stay-form-section">
            <h3 className="stay-form-section__title">
              <MapPinLine size={18} weight="bold" /> 3. Description &amp; Amenities
            </h3>

            {/* Description */}
            <div className="stay-form-field">
              <label className="stay-form-field__label">About this Property</label>
              <textarea
                rows="3"
                className="stay-form-field__textarea"
                placeholder="Describe the homestay experience, valley views, rooms, meals, and host family..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Amenities */}
            <div className="stay-form-field">
              <label className="stay-form-field__label">Amenities &amp; Features</label>
              <div className="amenity-chip-tags">
                {STANDARD_AMENITIES.map((am) => {
                  const active = amenitiesList.includes(am);
                  return (
                    <button
                      key={am}
                      type="button"
                      className={`amenity-chip-btn ${active ? "amenity-chip-btn--active" : ""}`}
                      onClick={() => toggleAmenity(am)}
                    >
                      {active ? "✓ " : "+ "}
                      {am}
                    </button>
                  );
                })}
              </div>

              {/* Add custom amenity */}
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <input
                  type="text"
                  className="stay-form-field__input"
                  style={{ maxWidth: "340px", padding: "6px 10px", fontSize: "0.8rem" }}
                  placeholder="Add custom amenity (e.g. Geyser, Balcony)..."
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
                  className="stay-form__btn-cancel"
                  style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                  onClick={handleAddCustomAmenity}
                >
                  <Plus size={14} weight="bold" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 4: ROOMS & ACCOMMODATION UNITS (Multi-Room Support) */}
          <div className="stay-form-section">
            <div className="stay-form-section__header-row">
              <div>
                <h3 className="stay-form-section__title" style={{ borderBottom: "none", paddingBottom: 0 }}>
                  <Bed size={18} weight="bold" /> 4. Rooms &amp; Accommodation Units ({rooms.length})
                </h3>
                <p className="stay-form-field__help" style={{ margin: "4px 0 0" }}>
                  Add as many rooms or suites as this property offers. Each room has its own name, type, tariff, capacity, amenities, and availability status.
                </p>
              </div>
              <button
                type="button"
                className="stay-form-room-add-btn"
                onClick={handleAddRoom}
              >
                <Plus size={15} weight="bold" /> Add Another Room
              </button>
            </div>

            {rooms.length === 0 ? (
              <div className="stay-form-rooms-empty">
                <Bed size={32} weight="duotone" style={{ color: "var(--color-navy)", opacity: 0.4 }} />
                <p>No rooms added yet for this property.</p>
                <button
                  type="button"
                  className="stay-form-room-add-btn"
                  onClick={handleAddRoom}
                >
                  <Plus size={15} weight="bold" /> Add First Room
                </button>
              </div>
            ) : (
              <div className="stay-form-rooms-container">
                {rooms.map((room, idx) => (
                  <div className="stay-form-room-card" key={room.id || idx}>
                    <div className="stay-form-room-card__header">
                      <div className="stay-form-room-card__title-wrap">
                        <span className="stay-form-room-card__index">#{idx + 1}</span>
                        <strong className="stay-form-room-card__name">
                          {room.name || `Room ${idx + 1}`}
                        </strong>
                        <span className="stay-form-room-card__type-tag">
                          {room.type || "Standard Room"}
                        </span>
                        <span className={`stay-form-room-card__status-tag stay-form-room-card__status-tag--${room.availability}`}>
                          {room.availability === "available" ? "Available" : "Unavailable"}
                        </span>
                      </div>
                      <div className="stay-form-room-card__actions">
                        <button
                          type="button"
                          className="room-mini-btn"
                          onClick={() => handleDuplicateRoom(idx)}
                          title="Duplicate this room"
                        >
                          <Copy size={13} weight="bold" /> Duplicate
                        </button>
                        <button
                          type="button"
                          className="room-mini-btn room-mini-btn--danger"
                          onClick={() => handleRemoveRoom(idx)}
                          title="Delete this room"
                        >
                          <Trash size={13} weight="bold" /> Remove
                        </button>
                      </div>
                    </div>

                    <div className="stay-form-grid" style={{ marginTop: "12px" }}>
                      {/* Room Name */}
                      <div className="stay-form-field">
                        <label className="stay-form-field__label">Room Name / Label *</label>
                        <input
                          type="text"
                          className="stay-form-field__input"
                          placeholder="e.g. Valley View Wooden Room, Attic Suite"
                          value={room.name}
                          onChange={(e) => handleRoomChange(idx, "name", e.target.value)}
                        />
                      </div>

                      {/* Room Type */}
                      <div className="stay-form-field">
                        <label className="stay-form-field__label">Room Type *</label>
                        <select
                          className="stay-form-field__select"
                          value={room.type}
                          onChange={(e) => handleRoomChange(idx, "type", e.target.value)}
                        >
                          {ROOM_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      {/* Room Tariff */}
                      <div className="stay-form-field">
                        <label className="stay-form-field__label">Nightly Tariff (₹)</label>
                        <input
                          type="text"
                          className="stay-form-field__input"
                          placeholder="e.g. ₹2,400/night or 2400"
                          value={room.price}
                          onChange={(e) => handleRoomChange(idx, "price", e.target.value)}
                        />
                      </div>

                      {/* Capacity & Availability */}
                      <div className="stay-form-field">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          <div>
                            <label className="stay-form-field__label">Max Guests</label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              className="stay-form-field__input"
                              placeholder="e.g. 2"
                              value={room.capacity}
                              onChange={(e) => handleRoomChange(idx, "capacity", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="stay-form-field__label">Availability</label>
                            <select
                              className="stay-form-field__select"
                              value={room.availability}
                              onChange={(e) => handleRoomChange(idx, "availability", e.target.value)}
                            >
                              <option value="available">Available</option>
                              <option value="unavailable">Unavailable</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Room Amenities */}
                      <div className="stay-form-field stay-form-grid--full">
                        <label className="stay-form-field__label">Room Amenities (comma separated)</label>
                        <input
                          type="text"
                          className="stay-form-field__input"
                          placeholder="e.g. Room heater / Bukhari, Attached Bathroom, Mountain view, Hot water"
                          value={room.amenities}
                          onChange={(e) => handleRoomChange(idx, "amenities", e.target.value)}
                        />
                      </div>

                      {/* Room Description */}
                      <div className="stay-form-field stay-form-grid--full">
                        <label className="stay-form-field__label">Room Description (optional)</label>
                        <textarea
                          className="stay-form-field__textarea"
                          rows={2}
                          placeholder="Describe room bedding, views, balcony, or interior timber details..."
                          value={room.description}
                          onChange={(e) => handleRoomChange(idx, "description", e.target.value)}
                        />
                      </div>

                      {/* Room Photo */}
                      <div className="stay-form-field stay-form-grid--full">
                        <label className="stay-form-field__label">Room Photo (optional)</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                          {room.image ? (
                            <div className="room-photo-preview-wrap">
                              <img src={room.image} alt={room.name} className="room-photo-preview" />
                              <button
                                type="button"
                                className="room-photo-remove-btn"
                                onClick={() => handleRoomChange(idx, "image", "")}
                                title="Remove room photo"
                              >
                                <Trash size={12} weight="bold" />
                              </button>
                            </div>
                          ) : null}
                          <label className="room-photo-upload-btn">
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(e) => handleRoomPhotoUpload(idx, e)}
                            />
                            <UploadSimple size={14} weight="bold" />
                            <span>{room.image ? "Change Photo" : "Upload Room Photo"}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="stay-form-room-add-btn stay-form-room-add-btn--bottom"
                  onClick={handleAddRoom}
                >
                  <Plus size={15} weight="bold" /> + Add Another Room Unit
                </button>
              </div>
            )}
          </div>

          {/* SECTION 5: PHOTOS (Cover Photo & Gallery Photos) */}
          <div className="stay-form-section">
            <h3 className="stay-form-section__title">
              <Camera size={18} weight="bold" /> 5. Property Photos &amp; Slideshow Gallery
            </h3>

            <div className="stay-form-photo-container">
              {/* Option 1: Cover Photo */}
              <div className="stay-form-field">
                <label className="stay-form-field__label">
                  <Star size={14} weight="fill" style={{ color: "#F59E0B" }} /> Option 1: Main Cover Photo
                </label>
                <p className="stay-form-field__help">
                  The primary photo displayed on website homestay cards and starts the detail page slideshow.
                </p>

                {coverPhoto ? (
                  <div className="form-cover-row">
                    <div className="form-cover-preview">
                      <img src={coverPhoto.dataUrl} alt="Cover Preview" />
                      <span className="form-cover-badge">
                        <Star size={11} weight="fill" /> Cover Photo
                      </span>
                    </div>
                    <div className="form-cover-actions">
                      <label className={`option-btn option-btn--replace ${uploadingCover ? "option-btn--disabled" : ""}`}>
                        <input
                          type="file"
                          ref={coverInputRef}
                          accept="image/*"
                          onChange={handleCoverFile}
                          disabled={uploadingCover}
                          style={{ display: "none" }}
                        />
                        <ArrowClockwise size={14} weight="bold" />
                        <span>{uploadingCover ? "Processing..." : "Change Cover Photo"}</span>
                      </label>
                      <button
                        type="button"
                        className="option-btn option-btn--delete"
                        onClick={() => setCoverPhoto(null)}
                      >
                        <Trash size={14} weight="bold" /> Remove Cover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="form-cover-empty">
                    <Star size={28} weight="duotone" style={{ color: "#F59E0B" }} />
                    <p>No cover photo selected yet.</p>
                    <label className={`option-btn option-btn--primary ${uploadingCover ? "option-btn--disabled" : ""}`}>
                      <input
                        type="file"
                        ref={coverInputRef}
                        accept="image/*"
                        onChange={handleCoverFile}
                        disabled={uploadingCover}
                        style={{ display: "none" }}
                      />
                      <UploadSimple size={15} weight="bold" />
                      <span>{uploadingCover ? "Compressing..." : "Upload Cover Photo"}</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Option 2: Gallery Photos */}
              <div className="stay-form-field" style={{ marginTop: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <label className="stay-form-field__label">
                      <ImageSquare size={14} weight="bold" /> Option 2: Gallery Photos ({galleryPhotos.length} added)
                    </label>
                    <p className="stay-form-field__help">
                      Upload multiple photos for the dynamic automatic slideshow and full lightbox gallery.
                    </p>
                  </div>

                  <label className={`option-btn option-btn--accent ${uploadingGallery ? "option-btn--disabled" : ""}`}>
                    <input
                      type="file"
                      ref={galleryInputRef}
                      multiple
                      accept="image/*"
                      onChange={handleGalleryFiles}
                      disabled={uploadingGallery}
                      style={{ display: "none" }}
                    />
                    <UploadSimple size={15} weight="bold" />
                    <span>{uploadingGallery ? "Processing..." : "+ Add Gallery Photos (Multiple)"}</span>
                  </label>
                </div>

                {galleryPhotos.length > 0 && (
                  <div className="form-gallery-grid">
                    {galleryPhotos.map((photo, idx) => (
                      <div className="form-gallery-item" key={photo.id || idx}>
                        <div className="form-gallery-media">
                          <img src={photo.dataUrl} alt={photo.name || `Photo ${idx + 1}`} />
                          <span className="form-gallery-order">#{idx + 1}</span>
                          <button
                            type="button"
                            className="form-gallery-set-cover-btn"
                            onClick={() => handleSetAsCover(photo.id)}
                            title="Set as main Cover Photo"
                          >
                            <Star size={11} weight="fill" /> Cover
                          </button>
                        </div>
                        <div className="form-gallery-ctrls">
                          <button
                            type="button"
                            className="form-gallery-ctrl-btn"
                            disabled={idx === 0}
                            onClick={() => handleMoveGalleryLeft(idx)}
                            title="Move left"
                          >
                            <ArrowLeft size={11} weight="bold" />
                          </button>
                          <button
                            type="button"
                            className="form-gallery-ctrl-btn"
                            disabled={idx === galleryPhotos.length - 1}
                            onClick={() => handleMoveGalleryRight(idx)}
                            title="Move right"
                          >
                            <ArrowRight size={11} weight="bold" />
                          </button>
                          <button
                            type="button"
                            className="form-gallery-ctrl-btn form-gallery-ctrl-btn--del"
                            onClick={() => handleDeleteGallery(idx)}
                            title="Remove photo"
                          >
                            <Trash size={11} weight="bold" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions (Requirement 6) */}
        <div className="stay-form__footer">
          <div className="stay-form__footer-info">
            {isEditing ? `Editing stay ID: ${initialValues?.id}` : "Ready to add new Sikkim property"}
          </div>

          <div className="stay-form__footer-actions">
            <button type="button" className="stay-form__btn-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="button"
              className="stay-form__btn-draft"
              onClick={() => handleSubmit("draft")}
              disabled={submitting}
              title="Save as draft without publishing to website"
            >
              Save as Draft
            </button>
            <button
              type="button"
              className="stay-form__btn-publish"
              onClick={() => handleSubmit("published")}
              disabled={submitting}
              title="Publish immediately to public Stays page and location directory"
            >
              <CheckCircle size={16} weight="bold" />
              {submitting ? "Saving..." : isEditing ? "Save & Publish Changes" : "Publish Stay Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
