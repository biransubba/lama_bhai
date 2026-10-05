import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  HouseLine,
  Bed,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  PencilSimple,
  Trash,
  Eye,
  Camera,
  MapPin,
  MagnifyingGlass,
  ArrowSquareOut,
  UploadSimple,
  X,
  WarningCircle,
  Check,
  ArrowsClockwise,
  Clock,
} from "phosphor-react";
import { usePartnerAuth } from "../context/PartnerAuthContext.jsx";
import { api } from "../../utils/api.js";
import { parseAndFormatPrice } from "../../utils/priceFormatter.js";
import "../styles/partner.css";

const PREDEFINED_ROOM_AMENITIES = [
  "Wi-Fi",
  "TV",
  "AC",
  "Heater",
  "Hot Water",
  "Attached Bathroom",
  "Balcony",
  "Mountain View",
  "Room Service",
  "Wardrobe",
  "Desk",
  "Breakfast",
];

const PREDEFINED_PROPERTY_AMENITIES = [
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

const ROOM_TYPES = [
  "Standard",
  "Deluxe",
  "Super Deluxe",
  "Family",
  "Suite",
  "Premium",
  "Dormitory",
  "Other",
];

const BED_TYPES = [
  "Single Bed",
  "Double Bed",
  "Queen Bed",
  "King Bed",
  "Twin Beds",
  "Bunk Bed",
  "Other",
];

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

export default function PartnerProperties() {
  const { currentPartner } = usePartnerAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Data states
  const [properties, setProperties] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  // Search & Filter states
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  // Modals state
  const [showListingModal, setShowListingModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [deletingListing, setDeletingListing] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Listing Form State
  const initialListingForm = {
    propertyId: "",
    name: "",
    type: "Standard",
    customType: "",
    capacity: 2,
    bedType: "Double Bed",
    customBedType: "",
    numberOfBeds: 1,
    price: "",
    description: "",
    amenities: [],
    customAmenityInput: "",
    image: "",
    gallery: [],
    availability: "available",
  };
  const [listingForm, setListingForm] = useState(initialListingForm);
  const [listingFormError, setListingFormError] = useState("");
  const [savingListing, setSavingListing] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Property Form State (Strictly property-level only, no room fields)
  const initialPropertyForm = {
    name: "",
    type: "Homestay",
    description: "",
    district: "East Sikkim",
    town: "",
    address: "",
    pincode: "",
    amenities: [],
    customAmenityInput: "",
    image: "",
    gallery: [],
  };
  const [propertyForm, setPropertyForm] = useState(initialPropertyForm);
  const [propertyFormError, setPropertyFormError] = useState("");
  const [savingProperty, setSavingProperty] = useState(false);
  const [uploadingPropCover, setUploadingPropCover] = useState(false);
  const [uploadingPropGallery, setUploadingPropGallery] = useState(false);

  // Fetch all properties & listings
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Fetch properties
      const propsRes = await api.owner.getProperties();
      const propsData = Array.isArray(propsRes?.data) ? propsRes.data : [];
      setProperties(propsData);

      // 2. Extract listings or fetch via getRooms
      let allRooms = [];
      try {
        const roomsRes = await api.owner.getRooms();
        if (roomsRes && roomsRes.success && Array.isArray(roomsRes.data)) {
          allRooms = roomsRes.data;
        }
      } catch (_) {
        // Fallback to rooms populated in properties
        propsData.forEach((p) => {
          if (Array.isArray(p.rooms)) {
            p.rooms.forEach((r) => {
              if (r) {
                allRooms.push({
                  ...r,
                  property: {
                    _id: p._id,
                    name: p.name,
                    slug: p.slug,
                    location: p.location,
                    status: p.status,
                    active: p.active,
                  },
                });
              }
            });
          }
        });
      }

      setListings(allRooms);
    } catch (err) {
      console.error("[PartnerListings] Load error:", err);
      setError(err.message || "Failed to load listings. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check URL params for quick actions (e.g. from sidebar CTA)
  useEffect(() => {
    const action = searchParams.get("action");
    const add = searchParams.get("add");
    if (action === "add-listing" || add === "true") {
      if (properties.length === 0 && !loading) {
        setShowPropertyModal(true);
      } else if (properties.length > 0) {
        openAddListingModal();
      }
      // Remove query param to prevent re-opening on manual refresh
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, properties.length, loading, setSearchParams]);

  // Open Add Listing Modal
  const openAddListingModal = () => {
    setEditingListing(null);
    setListingForm({
      ...initialListingForm,
      propertyId: properties[0]?._id || "",
    });
    setListingFormError("");
    setShowListingModal(true);
  };

  // Open Edit Listing Modal
  const openEditListingModal = (room) => {
    setEditingListing(room);

    const isPredefinedType = ROOM_TYPES.includes(room.type) && room.type !== "Other";
    const isPredefinedBed = BED_TYPES.includes(room.bedType || room.bedConfiguration) && room.bedType !== "Other";

    setListingForm({
      propertyId: room.property?._id || room.property || properties[0]?._id || "",
      name: room.name || "",
      type: isPredefinedType ? room.type : "Other",
      customType: !isPredefinedType ? room.customType || room.type : "",
      capacity: room.capacity || 2,
      bedType: isPredefinedBed ? room.bedType || "Double Bed" : "Other",
      customBedType: !isPredefinedBed ? room.customBedType || room.bedType || "" : "",
      numberOfBeds: room.numberOfBeds || 1,
      price: room.price || "",
      description: room.description || "",
      amenities: Array.isArray(room.amenities) ? [...room.amenities] : [],
      customAmenityInput: "",
      image: room.image || "",
      gallery: Array.isArray(room.gallery)
        ? room.gallery.map((g) => (typeof g === "string" ? g : g?.src || g?.url || ""))
        : [],
      availability: room.availability || "available",
    });
    setListingFormError("");
    setShowListingModal(true);
  };

  // Upload Cover Image for Room Listing
  const handleRoomCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCover(true);
      setListingFormError("");
      const res = await api.upload.image(file, "lama-bhaila/rooms");
      if (res && res.success && res.data?.url) {
        setListingForm((prev) => ({ ...prev, image: res.data.url }));
      } else {
        setListingFormError(res?.error || "Failed to upload cover image.");
      }
    } catch (err) {
      setListingFormError(err.message || "Error uploading cover photo.");
    } finally {
      setUploadingCover(false);
    }
  };

  // Upload Gallery Images for Room Listing
  const handleRoomGalleryUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploadingGallery(true);
      setListingFormError("");
      const res = await api.upload.gallery(files, "Room");
      if (res && res.success && Array.isArray(res.data)) {
        const newUrls = res.data.map((item) => (typeof item === "string" ? item : item.url || item.src)).filter(Boolean);
        setListingForm((prev) => ({
          ...prev,
          gallery: [...prev.gallery, ...newUrls],
        }));
      } else {
        setListingFormError(res?.error || "Failed to upload gallery photos.");
      }
    } catch (err) {
      setListingFormError(err.message || "Error uploading gallery photos.");
    } finally {
      setUploadingGallery(false);
    }
  };

  // Delete a Gallery Image from Room Listing
  const removeRoomGalleryPhoto = (indexToRemove) => {
    setListingForm((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Add Custom Amenity to Room Listing
  const handleAddCustomRoomAmenity = () => {
    const val = listingForm.customAmenityInput.trim();
    if (!val) return;
    if (listingForm.amenities.includes(val)) {
      setListingFormError(`"${val}" is already added.`);
      return;
    }
    setListingForm((prev) => ({
      ...prev,
      amenities: [...prev.amenities, val],
      customAmenityInput: "",
    }));
    setListingFormError("");
  };

  // Toggle Predefined Amenity for Room Listing
  const handleToggleRoomAmenity = (amenity) => {
    setListingForm((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  // Remove Any Amenity from Room Listing
  const handleRemoveRoomAmenity = (amenityToRemove) => {
    setListingForm((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((a) => a !== amenityToRemove),
    }));
  };

  // Submit Add / Edit Room Listing
  const handleSaveListing = async (e) => {
    e.preventDefault();
    setListingFormError("");

    if (!listingForm.propertyId) {
      setListingFormError("Please select a parent Property for this listing.");
      return;
    }
    if (!listingForm.name.trim()) {
      setListingFormError("Room Name is required (e.g. Deluxe Mountain View Room).");
      return;
    }
    if (!listingForm.price || Number(listingForm.price) <= 0) {
      setListingFormError("Price Per Night must be a valid positive amount.");
      return;
    }
    if (!listingForm.image || !listingForm.image.trim()) {
      setListingFormError("A Cover/Banner image is compulsory. Please upload a cover image.");
      return;
    }

    try {
      setSavingListing(true);

      const finalType =
        listingForm.type === "Other" && listingForm.customType.trim()
          ? listingForm.customType.trim()
          : listingForm.type;

      const finalBedType =
        listingForm.bedType === "Other" && listingForm.customBedType.trim()
          ? listingForm.customBedType.trim()
          : listingForm.bedType;

      const payload = {
        name: listingForm.name.trim(),
        type: finalType,
        customType: listingForm.type === "Other" ? listingForm.customType.trim() : "",
        capacity: Number(listingForm.capacity) || 2,
        bedType: finalBedType,
        customBedType: listingForm.bedType === "Other" ? listingForm.customBedType.trim() : "",
        numberOfBeds: Number(listingForm.numberOfBeds) || 1,
        bedConfiguration: `${listingForm.numberOfBeds || 1} ${finalBedType}`,
        price: Number(listingForm.price),
        description: listingForm.description.trim(),
        amenities: listingForm.amenities,
        image: listingForm.image.trim(),
        gallery: listingForm.gallery,
        availability: listingForm.availability,
      };

      if (editingListing) {
        // Edit ONLY this room
        await api.owner.updateRoom(editingListing._id || editingListing.id, payload);
        setNotification(`Listing "${payload.name}" updated successfully.`);
      } else {
        // Create new room under selected property
        await api.owner.addRoom(listingForm.propertyId, payload);
        setNotification(`Room listing "${payload.name}" created successfully.`);
      }

      setShowListingModal(false);
      await loadData();
    } catch (err) {
      console.error("[PartnerListings] Save room error:", err);
      setListingFormError(err.message || "Failed to save room listing.");
    } finally {
      setSavingListing(false);
    }
  };

  // Delete Listing Confirmation
  const handleDeleteListing = async () => {
    if (!deletingListing) return;
    try {
      setIsDeleting(true);
      const roomId = deletingListing._id || deletingListing.id;
      await api.owner.deleteRoom(roomId);
      setNotification(`Listing "${deletingListing.name}" was deleted. Parent property remains intact.`);
      setDeletingListing(null);
      await loadData();
    } catch (err) {
      console.error("[PartnerListings] Delete error:", err);
      setError(err.message || "Failed to delete room listing.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Room Availability directly from card
  const handleToggleAvailability = async (room) => {
    try {
      const nextAvail = room.availability === "available" ? "unavailable" : "available";
      const roomId = room._id || room.id;
      await api.owner.updateRoom(roomId, { availability: nextAvail });
      setNotification(`Updated "${room.name}" availability to ${nextAvail}.`);
      await loadData();
    } catch (err) {
      console.error("[PartnerListings] Toggle availability error:", err);
      setError(err.message || "Failed to update availability.");
    }
  };

  // Property Cover Upload
  const handlePropCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingPropCover(true);
      setPropertyFormError("");
      const res = await api.upload.image(file, "lama-bhaila/properties");
      if (res && res.success && res.data?.url) {
        setPropertyForm((prev) => ({ ...prev, image: res.data.url }));
      } else {
        setPropertyFormError(res?.error || "Failed to upload cover image.");
      }
    } catch (err) {
      setPropertyFormError(err.message || "Error uploading property cover.");
    } finally {
      setUploadingPropCover(false);
    }
  };

  // Property Gallery Upload
  const handlePropGalleryUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploadingPropGallery(true);
      setPropertyFormError("");
      const res = await api.upload.gallery(files, "Property");
      if (res && res.success && Array.isArray(res.data)) {
        const newUrls = res.data.map((item) => (typeof item === "string" ? item : item.url || item.src)).filter(Boolean);
        setPropertyForm((prev) => ({
          ...prev,
          gallery: [...prev.gallery, ...newUrls],
        }));
      } else {
        setPropertyFormError(res?.error || "Failed to upload gallery photos.");
      }
    } catch (err) {
      setPropertyFormError(err.message || "Error uploading gallery photos.");
    } finally {
      setUploadingPropGallery(false);
    }
  };

  // Add Custom Amenity to Property
  const handleAddCustomPropAmenity = () => {
    const val = propertyForm.customAmenityInput.trim();
    if (!val) return;
    if (propertyForm.amenities.includes(val)) {
      setPropertyFormError(`"${val}" is already added.`);
      return;
    }
    setPropertyForm((prev) => ({
      ...prev,
      amenities: [...prev.amenities, val],
      customAmenityInput: "",
    }));
    setPropertyFormError("");
  };

  // Toggle Property Predefined Amenity
  const handleTogglePropAmenity = (amenity) => {
    setPropertyForm((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  // Submit Add Property Form
  const handleSaveProperty = async (e) => {
    e.preventDefault();
    setPropertyFormError("");

    if (!propertyForm.name.trim()) {
      setPropertyFormError("Property Name is required (e.g. Biran Homestay).");
      return;
    }
    if (!propertyForm.town.trim()) {
      setPropertyFormError("Town / City is required (e.g. Namchi).");
      return;
    }
    if (!propertyForm.address.trim()) {
      setPropertyFormError("Address is required.");
      return;
    }
    if (!propertyForm.image.trim()) {
      setPropertyFormError("A Property Cover Photo is required.");
      return;
    }

    try {
      setSavingProperty(true);
      const payload = {
        name: propertyForm.name.trim(),
        type: propertyForm.type,
        description: propertyForm.description.trim() || `Welcome to ${propertyForm.name.trim()}`,
        location: {
          district: propertyForm.district,
          town: propertyForm.town.trim(),
          address: propertyForm.address.trim(),
          pincode: propertyForm.pincode.trim(),
        },
        amenities: propertyForm.amenities,
        image: propertyForm.image.trim(),
        gallery: propertyForm.gallery,
        // No room information is passed here — Property represents the business/accommodation only
      };

      const res = await api.owner.createProperty(payload);
      setNotification(`Property "${propertyForm.name}" created and submitted for Admin review (Pending).`);
      setShowPropertyModal(false);
      setPropertyForm(initialPropertyForm);
      await loadData();

      // Open Add Listing modal for the newly created property
      if (res?.data?._id) {
        setListingForm({
          ...initialListingForm,
          propertyId: res.data._id,
        });
        setShowListingModal(true);
      }
    } catch (err) {
      console.error("[PartnerProperties] Create property error:", err);
      setPropertyFormError(err.message || "Failed to create property.");
    } finally {
      setSavingProperty(false);
    }
  };

  // Filter listings
  const filteredListings = listings.filter((room) => {
    // Property filter
    const propId = room.property?._id || room.property;
    if (propertyFilter !== "all" && propId !== propertyFilter) {
      return false;
    }

    // Availability filter
    if (availabilityFilter !== "all" && room.availability !== availabilityFilter) {
      return false;
    }

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      const nameMatch = (room.name || "").toLowerCase().includes(q);
      const propMatch = (room.property?.name || "").toLowerCase().includes(q);
      const locMatch = (room.property?.location?.town || "").toLowerCase().includes(q);
      const typeMatch = (room.type || "").toLowerCase().includes(q);
      return nameMatch || propMatch || locMatch || typeMatch;
    }

    return true;
  });

  return (
    <div className="partner-page" style={{ padding: "28px 32px" }}>
      {/* Toast Notification Banner */}
      {notification && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 18px",
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "8px",
            color: "#065f46",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle size={18} weight="fill" color="#10b981" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#065f46" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 18px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            color: "#991b1b",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <WarningCircle size={18} weight="fill" color="#ef4444" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div
        className="partner-page-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "1.85rem",
              fontFamily: "var(--font-display, inherit)",
              fontWeight: 800,
              color: "var(--color-navy, #152238)",
            }}
          >
            My Listings
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.92rem" }}>
            Manage your individual bookable room listings.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Primary Button: + Add Listing (TASK 12: ONLY Add Listing, NO Add Property) */}
          <button
            type="button"
            onClick={openAddListingModal}
            id="partner-btn-add-listing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 20px",
              background: "var(--color-peach-deep, #c2613d)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(194, 97, 61, 0.35)",
              transition: "all 0.15s ease",
            }}
          >
            <Plus size={18} weight="bold" /> + Add Listing
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          background: "#ffffff",
          padding: "14px 18px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <MagnifyingGlass
            size={16}
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
          />
          <input
            type="text"
            placeholder="Search room name, property, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Filter by Property */}
        {properties.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Property:</span>
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                background: "#ffffff",
                color: "#1e293b",
                fontWeight: 500,
              }}
            >
              <option value="all">All Properties ({properties.length})</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filter by Availability */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Status:</span>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
              background: "#ffffff",
              color: "#1e293b",
              fontWeight: 500,
            }}
          >
            <option value="all">All Availability</option>
            <option value="available">🟢 Available Only</option>
            <option value="unavailable">🔴 Unavailable Only</option>
          </select>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={loadData}
          title="Refresh listings from database"
          style={{
            marginLeft: "auto",
            background: "#f1f5f9",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            padding: "8px 12px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "0.8rem",
            color: "#475569",
            fontWeight: 600,
          }}
        >
          <ArrowsClockwise size={14} /> Refresh
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
          <ArrowsClockwise size={32} style={{ animation: "partner-spin 0.8s linear infinite" }} />
          <p style={{ marginTop: "12px", fontWeight: 600 }}>Loading listings...</p>
        </div>
      ) : listings.length === 0 ? (
        /* Empty State: Clean marketplace view for individual room listings */
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "60px 24px",
            textAlign: "center",
            maxWidth: "540px",
            margin: "40px auto",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: "rgba(194, 97, 61, 0.12)",
              color: "var(--color-peach-deep, #c2613d)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <Bed size={36} weight="duotone" />
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--color-navy, #152238)", margin: "0 0 8px" }}>
            No room listings yet.
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "0 0 24px", lineHeight: 1.5 }}>
            Manage your individual bookable room listings. Click &quot;+ Add Listing&quot; to create your first room.
          </p>
          <button
            type="button"
            onClick={openAddListingModal}
            id="partner-empty-add-listing-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              background: "var(--color-peach-deep, #c2613d)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              boxShadow: "0 3px 10px rgba(194, 97, 61, 0.3)",
            }}
          >
            <Plus size={18} weight="bold" /> + Add Listing
          </button>
        </div>
      ) : filteredListings.length === 0 ? (
        /* No Search Matches */
        <div style={{ textAlign: "center", padding: "50px 20px", color: "#64748b" }}>
          <p style={{ fontSize: "1rem", fontWeight: 600 }}>No room listings match your search filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setPropertyFilter("all");
              setAvailabilityFilter("all");
            }}
            style={{
              marginTop: "8px",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* PART 2: Individual Room Listing Cards Grid */
        <div className="partner-listings-grid">
          {filteredListings.map((room) => {
            const parentProp =
              room.property && typeof room.property === "object"
                ? room.property
                : properties.find((p) => p._id === room.property) || {};

            const locationStr = [
              parentProp.location?.town,
              parentProp.location?.district,
              "Sikkim",
            ]
              .filter(Boolean)
              .join(", ");

            const isAvailable = room.availability === "available";

            const coverUrl =
              room.image ||
              (Array.isArray(room.gallery) && (room.gallery[0]?.src || room.gallery[0])) ||
              parentProp.image ||
              "https://images.unsplash.com/photo-1590490360182-c33d57733427";

            const publicUrl = `/stays/${parentProp.slug || parentProp._id}/rooms/${room._id || room.id}`;

            return (
              <div key={room._id || room.id} className="listing-card" id={`listing-card-${room._id || room.id}`}>
                {/* Card Cover Image & Badges */}
                <div className="listing-card__image-container">
                  <img
                    src={coverUrl}
                    alt={room.name}
                    className="listing-card__image"
                    loading="lazy"
                  />

                  {/* Availability Badge */}
                  <span
                    className={`listing-card__status-badge ${
                      isAvailable
                        ? "listing-card__status-badge--available"
                        : "listing-card__status-badge--unavailable"
                    }`}
                    onClick={() => handleToggleAvailability(room)}
                    style={{ cursor: "pointer" }}
                    title="Click to toggle availability"
                  >
                    {isAvailable ? "🟢 Available" : "🔴 Unavailable"}
                  </span>

                  {/* Parent Property Tag */}
                  <span className="listing-card__property-tag">
                    {parentProp.name || "Homestay"}
                  </span>
                </div>

                {/* Card Body */}
                <div className="listing-card__content">
                  <div className="listing-card__header">
                    <h3 className="listing-card__title">{room.name}</h3>
                    <div className="listing-card__property-name">{parentProp.name}</div>
                    <div className="listing-card__location">
                      <MapPin size={13} />
                      <span>{locationStr || "Sikkim"}</span>
                    </div>
                  </div>

                  {/* Price Row */}
                  <div className="listing-card__price-row">
                    <span className="listing-card__price-amount">
                      ₹{Number(room.price || 0).toLocaleString("en-IN")}
                    </span>
                    <span className="listing-card__price-period">/ night</span>
                  </div>

                  {/* Specs: Capacity & Bed Type */}
                  <div className="listing-card__specs">
                    <div className="listing-card__spec-item">
                      <Users size={15} color="#64748b" />
                      <span>{room.capacity || 2} guests</span>
                    </div>
                    <div className="listing-card__spec-item">
                      <Bed size={15} color="#64748b" />
                      <span>
                        {room.bedConfiguration ||
                          `${room.numberOfBeds || 1} ${room.bedType || "Double Bed"}`}
                      </span>
                    </div>
                  </div>

                  {/* Amenities Preview */}
                  {Array.isArray(room.amenities) && room.amenities.length > 0 && (
                    <div className="listing-card__amenities-preview">
                      {room.amenities.slice(0, 3).map((am, idx) => (
                        <span key={idx} className="listing-card__amenity-chip">
                          {am}
                        </span>
                      ))}
                      {room.amenities.length > 3 && (
                        <span className="listing-card__amenity-chip">
                          +{room.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Moderation Approval Status Badge (Section 6 & 11) */}
                  <div style={{ margin: "10px 0 8px" }}>
                    {room.status === "approved" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          background: "#ecfdf5",
                          color: "#065f46",
                          border: "1px solid #a7f3d0",
                          borderRadius: "6px",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                        }}
                      >
                        <CheckCircle size={14} weight="fill" color="#10b981" /> 🟢 Approved
                      </span>
                    ) : room.status === "rejected" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          background: "#fef2f2",
                          color: "#991b1b",
                          border: "1px solid #fecaca",
                          borderRadius: "6px",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                        }}
                        title={room.rejectionReason || room.reviewerNotes || "Listing rejected by administrator"}
                      >
                        <XCircle size={14} weight="fill" color="#ef4444" /> 🔴 Rejected
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          background: "#fffbeb",
                          color: "#92400e",
                          border: "1px solid #fde68a",
                          borderRadius: "6px",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                        }}
                      >
                        <Clock size={14} weight="bold" color="#d97706" /> 🟡 Pending Approval
                      </span>
                    )}
                  </div>

                  {/* Actions Toolbar: [ Edit ] [ View ] [ Delete ] */}
                  <div className="listing-card__actions">
                    <button
                      type="button"
                      onClick={() => openEditListingModal(room)}
                      className="listing-btn listing-btn--edit"
                      title="Edit this individual listing"
                    >
                      <PencilSimple size={14} /> Edit
                    </button>

                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="listing-btn listing-btn--view"
                      title="View public stay detail page"
                    >
                      <Eye size={14} /> View
                    </a>

                    <button
                      type="button"
                      onClick={() => setDeletingListing(room)}
                      className="listing-btn listing-btn--delete"
                      title="Delete this listing"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ====================================================================
          MODAL 1: ADD / EDIT ROOM LISTING (PART 5 - 13)
          ==================================================================== */}
      {showListingModal && (
        <div className="listing-modal-backdrop" onClick={() => !savingListing && setShowListingModal(false)}>
          <div
            className="listing-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "700px" }}
          >
            {/* Modal Header */}
            <div className="listing-modal-header">
              <h2 className="listing-modal-title">
                {editingListing ? `Edit Listing: ${editingListing.name}` : "Add Room Listing"}
              </h2>
              <button
                type="button"
                onClick={() => setShowListingModal(false)}
                disabled={savingListing}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveListing} style={{ display: "contents" }}>
              <div className="listing-modal-body">
                {/* Form Error Alert */}
                {listingFormError && (
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      color: "#991b1b",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <WarningCircle size={16} weight="fill" />
                    <span>{listingFormError}</span>
                  </div>
                )}

                {/* Business / Property Container & Inherited Location (Section 8) */}
                {properties.length > 1 ? (
                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      Homestay / Business *
                    </label>
                    <select
                      value={listingForm.propertyId}
                      onChange={(e) => setListingForm({ ...listingForm, propertyId: e.target.value })}
                      required
                      disabled={editingListing !== null}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                        background: editingListing ? "#f8fafc" : "#ffffff",
                      }}
                    >
                      {properties.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.location?.town || "Sikkim"})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {/* Inherited Location from Partner Profile (Section 8) */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: "#e0f2fe",
                      color: "#0284c7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MapPin size={20} weight="bold" />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Location
                    </div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>
                      {[
                        (properties.find((p) => p._id === listingForm.propertyId) || properties[0])?.location?.town ||
                          currentPartner?.partnerProfile?.town ||
                          "Namchi",
                        (properties.find((p) => p._id === listingForm.propertyId) || properties[0])?.location?.district ||
                          currentPartner?.partnerProfile?.district ||
                          "South Sikkim",
                        "Sikkim",
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "2px" }}>
                      From your Partner profile (automatically attached to this room listing)
                    </div>
                  </div>
                </div>

                {/* Room Information: Name & Type (PART 5) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      Room Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Deluxe Mountain View Room"
                      value={listingForm.name}
                      onChange={(e) => setListingForm({ ...listingForm, name: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      Room Type *
                    </label>
                    <select
                      value={listingForm.type}
                      onChange={(e) => setListingForm({ ...listingForm, type: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                      }}
                    >
                      {ROOM_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Custom Room Type if Other */}
                {listingForm.type === "Other" && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      Custom Room Type *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Attic Studio Suite"
                      value={listingForm.customType}
                      onChange={(e) => setListingForm({ ...listingForm, customType: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                )}

                {/* Capacity & Beds (PART 6 & 7) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      Max Guests *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={listingForm.capacity}
                      onChange={(e) => setListingForm({ ...listingForm, capacity: Number(e.target.value) })}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      Bed Type *
                    </label>
                    <select
                      value={listingForm.bedType}
                      onChange={(e) => setListingForm({ ...listingForm, bedType: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                      }}
                    >
                      {BED_TYPES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      Number of Beds *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={listingForm.numberOfBeds}
                      onChange={(e) => setListingForm({ ...listingForm, numberOfBeds: Number(e.target.value) })}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {/* Custom Bed Type if Other */}
                {listingForm.bedType === "Other" && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      Custom Bed Type *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Traditional Sikkimese Floor Mattress"
                      value={listingForm.customBedType}
                      onChange={(e) => setListingForm({ ...listingForm, customBedType: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                )}

                {/* Price Per Night & Availability (PART 8 & 19) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      Price Per Night (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      placeholder="2500"
                      value={listingForm.price}
                      onChange={(e) => setListingForm({ ...listingForm, price: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      Availability Status *
                    </label>
                    <select
                      value={listingForm.availability}
                      onChange={(e) => setListingForm({ ...listingForm, availability: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                      }}
                    >
                      <option value="available">🟢 Available for booking</option>
                      <option value="unavailable">🔴 Unavailable (Blocked)</option>
                    </select>
                  </div>
                </div>

                {/* Room Description (PART 9) */}
                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                    Room Description (Optional)
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Spacious room with a private balcony overlooking the mountains."
                    value={listingForm.description}
                    onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* Room Amenities & Custom Amenities (PART 10) */}
                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
                    Room Amenities
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px", marginBottom: "12px" }}>
                    {PREDEFINED_ROOM_AMENITIES.map((am) => (
                      <label
                        key={am}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.82rem",
                          color: "#334155",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={listingForm.amenities.includes(am)}
                          onChange={() => handleToggleRoomAmenity(am)}
                        />
                        <span>{am}</span>
                      </label>
                    ))}
                  </div>

                  {/* Add Custom Amenity */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="e.g. Electric Kettle"
                      value={listingForm.customAmenityInput}
                      onChange={(e) => setListingForm({ ...listingForm, customAmenityInput: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomRoomAmenity();
                        }
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.84rem",
                        flex: "1 1 200px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomRoomAmenity}
                      style={{
                        padding: "8px 14px",
                        background: "#f1f5f9",
                        color: "var(--color-navy, #152238)",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                      }}
                    >
                      + Add Custom Amenity
                    </button>
                  </div>

                  {/* Selected / Custom Amenities Pills */}
                  {listingForm.amenities.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                      {listingForm.amenities.map((am) => (
                        <span key={am} className="custom-amenity-pill">
                          <span>{am}</span>
                          <button
                            type="button"
                            className="custom-amenity-pill__remove"
                            onClick={() => handleRemoveRoomAmenity(am)}
                            title={`Remove ${am}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Room Images: Cover (COMPULSORY) & Gallery (PART 11 & 12) */}
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                    Cover Image ⭐ <span style={{ color: "#dc2626" }}>(Compulsory)</span>
                  </label>
                  <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "#64748b" }}>
                    This primary image will be displayed on cards, search results, and public room listings.
                  </p>

                  {listingForm.image ? (
                    <div style={{ position: "relative", width: "100%", height: "200px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
                      <img src={listingForm.image} alt="Cover preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div
                        style={{
                          position: "absolute",
                          bottom: "10px",
                          right: "10px",
                          display: "flex",
                          gap: "8px",
                        }}
                      >
                        <label
                          style={{
                            background: "rgba(21, 34, 56, 0.9)",
                            color: "#ffffff",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Camera size={14} /> Replace Cover
                          <input type="file" accept="image/*" onChange={handleRoomCoverUpload} style={{ display: "none" }} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "24px",
                        border: "2px dashed #cbd5e1",
                        borderRadius: "8px",
                        textAlign: "center",
                        background: "#f8fafc",
                      }}
                    >
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "10px 18px",
                          background: "var(--color-navy, #152238)",
                          color: "#ffffff",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <UploadSimple size={16} /> Upload Cover Photo
                        <input type="file" accept="image/*" onChange={handleRoomCoverUpload} style={{ display: "none" }} />
                      </label>
                      {uploadingCover && <span style={{ display: "block", marginTop: "8px", fontSize: "0.8rem", color: "#64748b" }}>Uploading...</span>}
                    </div>
                  )}

                  {/* Gallery Photos */}
                  <div style={{ marginTop: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <label style={{ fontSize: "0.84rem", fontWeight: 700, color: "#1e293b" }}>
                        Gallery Photos (Optional)
                      </label>
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color: "var(--color-peach-deep, #c2613d)",
                          cursor: "pointer",
                        }}
                      >
                        <Plus size={14} /> Add Gallery Photos
                        <input type="file" accept="image/*" multiple onChange={handleRoomGalleryUpload} style={{ display: "none" }} />
                      </label>
                    </div>

                    {uploadingGallery && (
                      <span style={{ display: "block", marginBottom: "8px", fontSize: "0.8rem", color: "#64748b" }}>
                        Uploading gallery photos...
                      </span>
                    )}

                    {listingForm.gallery.length > 0 ? (
                      <div className="gallery-grid">
                        {listingForm.gallery.map((photoUrl, idx) => (
                          <div key={idx} className="gallery-thumb-item">
                            <img src={photoUrl} alt={`Gallery ${idx + 1}`} className="gallery-thumb-img" />
                            <button
                              type="button"
                              className="gallery-thumb-delete"
                              onClick={() => removeRoomGalleryPhoto(idx)}
                              title="Delete this photo"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#94a3b8", fontStyle: "italic" }}>
                        No gallery photos added yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="listing-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowListingModal(false)}
                  disabled={savingListing}
                  style={{
                    padding: "10px 18px",
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingListing || uploadingCover || uploadingGallery}
                  id="partner-submit-listing-btn"
                  style={{
                    padding: "10px 22px",
                    background: "var(--color-peach-deep, #c2613d)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    cursor: savingListing ? "wait" : "pointer",
                    boxShadow: "0 2px 6px rgba(194, 97, 61, 0.3)",
                  }}
                >
                  {savingListing ? "Saving..." : editingListing ? "Save Changes" : "Create Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: ADD PROPERTY (PART 3 & 4)
          Strictly Property-level information only. NO Room fields!
          ==================================================================== */}
      {showPropertyModal && (
        <div className="listing-modal-backdrop" onClick={() => !savingProperty && setShowPropertyModal(false)}>
          <div
            className="listing-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "680px" }}
          >
            {/* Modal Header */}
            <div className="listing-modal-header">
              <h2 className="listing-modal-title">Add Property</h2>
              <button
                type="button"
                onClick={() => setShowPropertyModal(false)}
                disabled={savingProperty}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProperty} style={{ display: "contents" }}>
              <div className="listing-modal-body">
                {propertyFormError && (
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      color: "#991b1b",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <WarningCircle size={16} weight="fill" />
                    <span>{propertyFormError}</span>
                  </div>
                )}

                <div
                  style={{
                    padding: "10px 14px",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    color: "#1e40af",
                  }}
                >
                  <strong>Note:</strong> When created, your property will be submitted in <strong>Pending</strong> status
                  for Lama Bhai Admin moderation. You can create individual room listings immediately.
                </div>

                {/* BASIC INFORMATION (PART 3) */}
                <h4 style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "var(--color-navy, #152238)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Basic Information
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      Property Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Biran Homestay"
                      value={propertyForm.name}
                      onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      Property Type *
                    </label>
                    <select
                      value={propertyForm.type}
                      onChange={(e) => setPropertyForm({ ...propertyForm, type: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                      }}
                    >
                      {PROPERTY_TYPES.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                    Description
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Describe your property, surroundings, and host hospitality..."
                    value={propertyForm.description}
                    onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* LOCATION (PART 3) */}
                <h4 style={{ margin: "8px 0 0", fontSize: "0.9rem", color: "var(--color-navy, #152238)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Location
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      District *
                    </label>
                    <select
                      value={propertyForm.district}
                      onChange={(e) => setPropertyForm({ ...propertyForm, district: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                      }}
                    >
                      {SIKKIM_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      Town / City *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Namchi"
                      value={propertyForm.town}
                      onChange={(e) => setPropertyForm({ ...propertyForm, town: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      Address *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lower Ghurpisey Road"
                      value={propertyForm.address}
                      onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      Pincode (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 737126"
                      value={propertyForm.pincode}
                      onChange={(e) => setPropertyForm({ ...propertyForm, pincode: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {/* PROPERTY AMENITIES (PART 3) */}
                <h4 style={{ margin: "8px 0 0", fontSize: "0.9rem", color: "var(--color-navy, #152238)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Property Amenities
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px" }}>
                  {PREDEFINED_PROPERTY_AMENITIES.map((am) => (
                    <label
                      key={am}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.82rem",
                        color: "#334155",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={propertyForm.amenities.includes(am)}
                        onChange={() => handleTogglePropAmenity(am)}
                      />
                      <span>{am}</span>
                    </label>
                  ))}
                </div>

                {/* Add Custom Amenity */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="e.g. Campfire Area"
                    value={propertyForm.customAmenityInput}
                    onChange={(e) => setPropertyForm({ ...propertyForm, customAmenityInput: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomPropAmenity();
                      }
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.84rem",
                      flex: "1 1 200px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomPropAmenity}
                    style={{
                      padding: "8px 14px",
                      background: "#f1f5f9",
                      color: "var(--color-navy, #152238)",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                    }}
                  >
                    + Add Custom Amenity
                  </button>
                </div>

                {propertyForm.amenities.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {propertyForm.amenities.map((am) => (
                      <span key={am} className="custom-amenity-pill">
                        <span>{am}</span>
                        <button
                          type="button"
                          className="custom-amenity-pill__remove"
                          onClick={() =>
                            setPropertyForm((p) => ({
                              ...p,
                              amenities: p.amenities.filter((x) => x !== am),
                            }))
                          }
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* PROPERTY PHOTOS (PART 3) */}
                <h4 style={{ margin: "8px 0 0", fontSize: "0.9rem", color: "var(--color-navy, #152238)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Property Photos
                </h4>

                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                    Cover Photo *
                  </label>
                  {propertyForm.image ? (
                    <div style={{ position: "relative", width: "100%", height: "160px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
                      <img src={propertyForm.image} alt="Property cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <label
                        style={{
                          position: "absolute",
                          bottom: "8px",
                          right: "8px",
                          background: "rgba(21, 34, 56, 0.9)",
                          color: "#ffffff",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Replace
                        <input type="file" accept="image/*" onChange={handlePropCoverUpload} style={{ display: "none" }} />
                      </label>
                    </div>
                  ) : (
                    <div style={{ padding: "20px", border: "2px dashed #cbd5e1", borderRadius: "8px", textAlign: "center", background: "#f8fafc" }}>
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 16px",
                          background: "var(--color-navy, #152238)",
                          color: "#ffffff",
                          borderRadius: "6px",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <UploadSimple size={15} /> Upload Property Cover
                        <input type="file" accept="image/*" onChange={handlePropCoverUpload} style={{ display: "none" }} />
                      </label>
                      {uploadingPropCover && <span style={{ display: "block", marginTop: "6px", fontSize: "0.78rem" }}>Uploading...</span>}
                    </div>
                  )}
                </div>

                {/* Property Gallery Photos */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label style={{ fontSize: "0.84rem", fontWeight: 700, color: "#1e293b" }}>
                      Gallery Photos (Optional)
                    </label>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "var(--color-peach-deep, #c2613d)",
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={14} /> Add Photos
                      <input type="file" accept="image/*" multiple onChange={handlePropGalleryUpload} style={{ display: "none" }} />
                    </label>
                  </div>
                  {uploadingPropGallery && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Uploading gallery...</span>}
                  {propertyForm.gallery.length > 0 && (
                    <div className="gallery-grid">
                      {propertyForm.gallery.map((src, idx) => (
                        <div key={idx} className="gallery-thumb-item">
                          <img src={src} alt="Gallery" className="gallery-thumb-img" />
                          <button
                            type="button"
                            className="gallery-thumb-delete"
                            onClick={() =>
                              setPropertyForm((p) => ({
                                ...p,
                                gallery: p.gallery.filter((_, i) => i !== idx),
                              }))
                            }
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="listing-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowPropertyModal(false)}
                  disabled={savingProperty}
                  style={{
                    padding: "10px 18px",
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProperty || uploadingPropCover || uploadingPropGallery}
                  id="partner-submit-property-btn"
                  style={{
                    padding: "10px 22px",
                    background: "var(--color-peach-deep, #c2613d)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    cursor: savingProperty ? "wait" : "pointer",
                    boxShadow: "0 2px 6px rgba(194, 97, 61, 0.3)",
                  }}
                >
                  {savingProperty ? "Submitting..." : "Submit Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: DELETE CONFIRMATION (PART 15)
          "You are about to permanently delete: [Room Name]"
          Delete ONLY the individual Room Listing. DO NOT delete parent Property.
          ==================================================================== */}
      {deletingListing && (
        <div className="listing-modal-backdrop" onClick={() => !isDeleting && setDeletingListing(null)}>
          <div
            className="listing-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px" }}
          >
            <div className="listing-modal-header" style={{ background: "#fef2f2" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#991b1b" }}>
                <WarningCircle size={22} weight="fill" />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Delete this listing?</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingListing(null)}
                disabled={isDeleting}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="listing-modal-body" style={{ padding: "20px 24px" }}>
              <p style={{ margin: "0 0 10px", fontSize: "0.95rem", color: "#1e293b", lineHeight: 1.5 }}>
                You are about to permanently delete:
                <br />
                <strong style={{ fontSize: "1.05rem", color: "var(--color-navy, #152238)" }}>
                  {deletingListing.name}
                </strong>
              </p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 }}>
                This will only remove this room listing. Your parent property{" "}
                <strong>
                  {deletingListing.property?.name ||
                    properties.find((p) => p._id === deletingListing.property)?.name ||
                    "Homestay"}
                </strong>{" "}
                will remain completely safe and intact.
              </p>
            </div>

            <div className="listing-modal-footer">
              <button
                type="button"
                onClick={() => setDeletingListing(null)}
                disabled={isDeleting}
                style={{
                  padding: "9px 16px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "0.84rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteListing}
                disabled={isDeleting}
                id="partner-confirm-delete-btn"
                style={{
                  padding: "9px 18px",
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "0.84rem",
                  cursor: isDeleting ? "wait" : "pointer",
                }}
              >
                {isDeleting ? "Deleting..." : "Delete Listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
