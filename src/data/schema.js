/**
 * Central Data Model & Schema Definitions for Lama Bhai Tourism
 *
 * This module defines the canonical shapes, fields, and safe normalizers
 * for all frontend inventory, partner relationships, and operations:
 * - Cars (Models and Individual Vehicle Units)
 * - Bikes (Models and Individual Bike Units)
 * - Stays (Properties, Stays, and Homestays)
 * - Partners (Approved local operators and property lists)
 * - Booking Requests (Customer enquiries referencing inventory IDs)
 * - Offers (Promotions and seasonal discounts)
 *
 * Principles:
 * 1. Stable Unique IDs across all entities.
 * 2. Two-level inventory for vehicles and bikes (Model -> Individual Units).
 * 3. Booking requests reference inventory IDs without duplicating entire records.
 * 4. Booking status is strictly separated from inventory availability.
 * 5. Safe normalization prevents data loss when schemas evolve or older data is loaded.
 * 6. No fake business data, prices, or registration numbers are invented.
 */

export const INVENTORY_SERVICES = ["Car", "Bike", "Stay", "Permit", "Plan My Trip"];

export const AVAILABILITY_STATUSES = ["available", "unavailable"];

export const BOOKING_REQUEST_STATUSES = [
  "New",
  "Contacted",
  "In Progress",
  "Confirmed",
  "Completed",
  "Cancelled",
];

export const PARTNER_STATUSES = [
  "Pending",
  "Approved",
  "Rejected",
  "Suspended",
  "Inactive",
];

export const STAY_TYPES = ["Homestay", "Hotel", "Guest House", "Resort", "Lodge"];

export const ROOM_TYPES = [
  "Standard Room",
  "Deluxe Room",
  "Super Deluxe Room",
  "Family Room",
  "Suite",
  "Traditional Wooden Room",
  "Cottage / Cabin",
  "Dormitory",
];

export const VEHICLE_CATEGORIES = ["SUV", "MUV", "Traveller"];

export const BIKE_CATEGORIES = [
  "Mountain touring",
  "Long-distance",
  "City / short-distance",
];

// Helper to generate stable unique IDs
export function generateUniqueId(prefix = "entity", hint = "") {
  const cleanHint = hint ? `${hint.toLowerCase().replace(/[^a-z0-9]+/g, "")}_` : "";
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${cleanHint}${timestamp}_${randomSuffix}`;
}

// ============================================================================
// 1. CARS DATA MODEL
// ============================================================================

/**
 * Normalizes a Car Model record (Level 1 inventory)
 */
export function normalizeCarModel(raw) {
  if (!raw || typeof raw !== "object") return null;
  const slug = raw.slug || (raw.name ? raw.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") : generateUniqueId("model", "car"));
  return {
    id: raw.id || slug,
    slug,
    name: typeof raw.name === "string" ? raw.name.trim() : "Unnamed Model",
    category: VEHICLE_CATEGORIES.includes(raw.category) ? raw.category : "SUV",
    description: typeof raw.description === "string" ? raw.description.trim() : "",
    image: raw.image || null,
    gallery: Array.isArray(raw.gallery) ? raw.gallery : [],
    active: raw.active !== false,
  };
}

/**
 * Normalizes an Individual Car Unit record (Level 2 inventory)
 */
export function normalizeCarUnit(raw, defaultModelSlug = "") {
  if (!raw || typeof raw !== "object") return null;
  const modelSlug = raw.modelSlug || defaultModelSlug;
  const id = raw.id || generateUniqueId("car", modelSlug);
  return {
    id,
    modelSlug,
    // Registration / vehicle number is left as null until real data is provided
    vehicleNumber: raw.vehicleNumber && typeof raw.vehicleNumber === "string" && raw.vehicleNumber.trim() ? raw.vehicleNumber.trim() : null,
    availability: raw.availability === "unavailable" ? "unavailable" : "available",
    active: raw.active !== false,
    seatingCapacity: typeof raw.seatingCapacity === "number" ? raw.seatingCapacity : (Number(raw.seatingCapacity) || 7),
    description: typeof raw.description === "string" ? raw.description.trim() : "",
    image: raw.image || null,
    isSampleData: Boolean(raw.isSampleData),
  };
}

// ============================================================================
// 2. BIKES DATA MODEL
// ============================================================================

/**
 * Normalizes a Bike Model record (Level 1 inventory)
 */
export function normalizeBikeModel(raw) {
  if (!raw || typeof raw !== "object") return null;
  const slug = raw.slug || (raw.name ? raw.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") : generateUniqueId("model", "bike"));
  return {
    id: raw.id || slug,
    slug,
    name: typeof raw.name === "string" ? raw.name.trim() : "Unnamed Bike Model",
    category: BIKE_CATEGORIES.includes(raw.category) ? raw.category : "Mountain touring",
    description: typeof raw.description === "string" ? raw.description.trim() : "",
    image: raw.image || null,
    gallery: Array.isArray(raw.gallery) ? raw.gallery : [],
    active: raw.active !== false,
  };
}

/**
 * Normalizes an Individual Bike Unit record (Level 2 inventory)
 */
export function normalizeBikeUnit(raw, defaultModelSlug = "") {
  if (!raw || typeof raw !== "object") return null;
  const modelSlug = raw.modelSlug || defaultModelSlug;
  const id = raw.id || generateUniqueId("bike", modelSlug);
  return {
    id,
    modelSlug,
    // Registration / identifying number is left as null until real data is provided
    identifier: raw.identifier && typeof raw.identifier === "string" && raw.identifier.trim() ? raw.identifier.trim() : null,
    availability: raw.availability === "unavailable" ? "unavailable" : "available",
    active: raw.active !== false,
    engineCC: raw.engineCC ? Number(raw.engineCC) || null : null,
    transmission: raw.transmission || null,
    seating: typeof raw.seating === "number" ? raw.seating : 2,
    description: typeof raw.description === "string" ? raw.description.trim() : "",
    image: raw.image || null,
    isSampleData: Boolean(raw.isSampleData),
  };
}

// ============================================================================
// 3. STAYS DATA MODEL
// ============================================================================

function unwrapImageString(val) {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    if (typeof val.dataUrl === "string") return val.dataUrl;
    if (typeof val.dataUrl === "object" && val.dataUrl) return unwrapImageString(val.dataUrl);
    if (typeof val.src === "string") return val.src;
    if (typeof val.src === "object" && val.src) return unwrapImageString(val.src);
    if (typeof val.url === "string") return val.url;
  }
  return String(val || "") || null;
}

/**
 * Normalizes an Individual Room record (Level 2 inventory)
 *
 * BELONGS TO: Exactly one property via `propertyId`.
 * DOES NOT duplicate full property metadata.
 */
export function normalizeRoom(raw, defaultPropertyId = "") {
  if (!raw || typeof raw !== "object") return null;

  const propertyId =
    raw.propertyId && typeof raw.propertyId === "string" && raw.propertyId.trim()
      ? raw.propertyId.trim()
      : (typeof defaultPropertyId === "string" && defaultPropertyId.trim() ? defaultPropertyId.trim() : null);

  // Room must belong to a property
  if (!propertyId) {
    return null;
  }

  const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "Standard Room";
  const id = raw.id || generateUniqueId("room", propertyId);

  // Normalize room-specific amenities
  let amenities = [];
  if (Array.isArray(raw.amenities)) {
    amenities = raw.amenities.filter((a) => typeof a === "string" && a.trim());
  } else if (typeof raw.amenities === "string") {
    amenities = raw.amenities.split(",").map((s) => s.trim()).filter(Boolean);
  }

  // Normalize room-specific gallery
  let gallery = [];
  if (Array.isArray(raw.gallery)) {
    gallery = raw.gallery.map((item, idx) => {
      if (typeof item === "string") {
        return { id: `room_gal_${idx}`, src: item, alt: `${name} photo ${idx + 1}`, category: "Room" };
      }
      if (item && typeof item === "object") {
        const unwrapped = unwrapImageString(item.src || item.dataUrl || item);
        return {
          id: item.id || `room_gal_${idx}`,
          src: unwrapped || "",
          alt: item.alt || item.name || `${name} photo ${idx + 1}`,
          category: item.category || "Room",
        };
      }
      return null;
    }).filter(Boolean);
  }

  const isDraft = raw.status === "draft" || raw.published === false || raw.active === false;

  const roomType =
    typeof raw.type === "string" && raw.type.trim()
      ? raw.type.trim()
      : (ROOM_TYPES.includes(name) ? name : "Standard Room");

  const capacity =
    raw.capacity !== null && raw.capacity !== undefined && !isNaN(Number(raw.capacity))
      ? Number(raw.capacity)
      : (raw.maxGuests !== null && raw.maxGuests !== undefined && !isNaN(Number(raw.maxGuests))
          ? Number(raw.maxGuests)
          : null);

  return {
    id,
    propertyId,
    name,
    type: roomType,
    description: typeof raw.description === "string" ? raw.description.trim() : "",
    image: unwrapImageString(raw.image),
    gallery,
    price: raw.price != null && String(raw.price).trim() ? String(raw.price).trim() : null,
    amenities,
    availability: raw.availability === "unavailable" ? "unavailable" : "available",
    status: isDraft ? "draft" : "published",
    active: !isDraft,
    capacity,
    isSampleData: Boolean(raw.isSampleData),
  };
}

/**
 * Normalizes a Stay property record (Level 1 inventory)
 */
export function normalizeStay(raw) {
  if (!raw || typeof raw !== "object") return null;
  // Strictly disallow dummy / sample stays
  if (raw.isSampleData === true) {
    return null;
  }
  if (!raw.name || typeof raw.name !== "string" || !raw.name.trim()) {
    return null;
  }
  const location = typeof raw.location === "string" && raw.location.trim() ? raw.location.trim() : "Sikkim";
  const id = raw.id || generateUniqueId("stay", location);

  // Normalize property-level amenities
  let amenities = [];
  if (Array.isArray(raw.amenities)) {
    amenities = raw.amenities.filter((a) => typeof a === "string" && a.trim());
  } else if (typeof raw.amenities === "string") {
    amenities = raw.amenities.split(",").map((s) => s.trim()).filter(Boolean);
  }

  // Normalize property-level gallery
  let gallery = [];
  if (Array.isArray(raw.gallery)) {
    gallery = raw.gallery.map((item, idx) => {
      if (typeof item === "string") {
        return { id: `gal_${idx}`, src: item, alt: `${raw.name || "Stay"} photo ${idx + 1}`, category: "Gallery" };
      }
      if (item && typeof item === "object") {
        const unwrapped = unwrapImageString(item.src || item.dataUrl || item);
        return {
          id: item.id || `gal_${idx}`,
          src: unwrapped || "",
          alt: item.alt || item.name || `${raw.name || "Stay"} photo ${idx + 1}`,
          category: item.category || "Gallery",
        };
      }
      return null;
    }).filter(Boolean);
  }

  const isDraft = raw.status === "draft" || raw.published === false || raw.active === false;

  // Normalize any inline rooms if attached to property object
  let rooms = undefined;
  if (Array.isArray(raw.rooms)) {
    rooms = raw.rooms
      .map((r) => normalizeRoom(r, id))
      .filter(Boolean);
  }

  return {
    id,
    name: typeof raw.name === "string" ? raw.name.trim() : "",
    location,
    type: STAY_TYPES.includes(raw.type) ? raw.type : "Homestay",
    description: typeof raw.description === "string" ? raw.description.trim() : "",
    amenities,
    offers: Array.isArray(raw.offers) ? raw.offers : [],
    availability: raw.availability === "unavailable" ? "unavailable" : "available",
    status: isDraft ? "draft" : "published",
    active: !isDraft,
    image: unwrapImageString(raw.image),
    gallery,
    rooms,
    partnerId: raw.partnerId && typeof raw.partnerId === "string" && raw.partnerId.trim() ? raw.partnerId.trim() : null,
    contactDetails: raw.contactDetails && typeof raw.contactDetails === "string" ? raw.contactDetails.trim() : null,
    price: raw.price || null,
    isSampleData: Boolean(raw.isSampleData),
  };
}

// ============================================================================
// 4. PARTNERS DATA MODEL
// ============================================================================

function resolvePartnerStatus(val) {
  if (!val || typeof val !== "string") return "Pending";
  const lower = val.trim().toLowerCase();
  if (lower === "approved") return "Approved";
  if (lower === "rejected") return "Rejected";
  if (lower === "suspended") return "Suspended";
  if (lower === "inactive") return "Inactive";
  if (lower === "pending") return "Pending";
  return "Pending";
}

/**
 * Normalizes a Partner record
 */
export function normalizePartner(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id || generateUniqueId("partner", raw.location || "host");
  const status = resolvePartnerStatus(raw.status);

  return {
    id,
    name: typeof raw.name === "string" ? raw.name.trim() : "Unnamed Partner",
    agency: typeof raw.agency === "string" ? raw.agency.trim() : "",
    location: typeof raw.location === "string" && raw.location.trim() ? raw.location.trim() : "Sikkim",
    status,
    phone: typeof raw.phone === "string" ? raw.phone.trim() : "",
    email: typeof raw.email === "string" ? raw.email.trim() : "",
    assignedPropertyIds: Array.isArray(raw.assignedPropertyIds)
      ? Array.from(new Set(raw.assignedPropertyIds.filter(Boolean)))
      : [],
    propertyDetails: typeof raw.propertyDetails === "string" ? raw.propertyDetails.trim() : "",
    notes: typeof raw.notes === "string" ? raw.notes.trim() : "",
    submittedAt: raw.submittedAt || raw.requestedAt || new Date().toISOString(),
    reviewedAt: raw.reviewedAt || null,
    reviewerNotes: typeof raw.reviewerNotes === "string" ? raw.reviewerNotes.trim() : "",
  };
}

// ============================================================================
// 5. BOOKING REQUESTS DATA MODEL
// ============================================================================

/**
 * Normalizes a Customer Booking Request record
 */
export function normalizeBookingRequest(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id || raw.bookingRequestId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const submittedAt = raw.submittedAt || raw.createdAt || new Date().toISOString();
  const notesText = typeof raw.notes === "string" ? raw.notes.trim() : (typeof raw.message === "string" ? raw.message.trim() : "");

  return {
    id,
    bookingRequestId: id,
    service: INVENTORY_SERVICES.includes(raw.service) ? raw.service : "Stay",
    // References inventory ID (unit ID, property ID, model slug) rather than full record
    inventoryId: raw.inventoryId || raw.roomId || raw.propertyId || raw.unitId || null,
    propertyId: raw.propertyId || (raw.service === "Stay" && raw.inventoryId && !raw.inventoryId.startsWith("room_") ? raw.inventoryId : null),
    roomId: raw.roomId || (raw.service === "Stay" && raw.inventoryId?.startsWith("room_") ? raw.inventoryId : null),
    propertyName: typeof raw.propertyName === "string" ? raw.propertyName.trim() : null,
    roomName: typeof raw.roomName === "string" ? raw.roomName.trim() : null,
    partnerId: raw.partnerId || null,
    status: BOOKING_REQUEST_STATUSES.includes(raw.status) ? raw.status : "New",
    details: Array.isArray(raw.details) ? raw.details : [],
    name: typeof raw.name === "string" ? raw.name.trim() : "",
    phone: typeof raw.phone === "string" ? raw.phone.trim() : "",
    email: typeof raw.email === "string" ? raw.email.trim() : "",
    date: raw.date || "",
    travellers: raw.travellers !== null && raw.travellers !== undefined ? Number(raw.travellers) : null,
    nights: raw.nights !== null && raw.nights !== undefined ? Number(raw.nights) : null,
    notes: notesText,
    message: notesText,
    submittedAt,
    createdAt: submittedAt,
    updatedAt: raw.updatedAt || new Date().toISOString(),
    cancelledAt: raw.cancelledAt || null,
    cancelledBy: raw.cancelledBy || null,
    cancellationReason: typeof raw.cancellationReason === "string" ? raw.cancellationReason.trim() : null,
    cancellationNotes: typeof raw.cancellationNotes === "string" ? raw.cancellationNotes.trim() : null,
    nationality: raw.nationality || null,
    permitData: raw.permitData || null,
  };
}

// ============================================================================
// 6. OFFERS DATA MODEL
// ============================================================================

export const OFFER_SERVICES = ["All", "Stay", "Car", "Bike", "Journey"];
export const OFFER_SCOPE_TYPES = ["all", "category", "item"];

/**
 * Normalizes an Offer record
 */
export function normalizeOffer(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id || `offer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const appliesToService = OFFER_SERVICES.includes(raw.appliesToService)
    ? raw.appliesToService
    : "All";

  // Scope level: "all" (entire service) | "category" | "item" (specific items)
  let scopeType = raw.scopeType || "item";
  if (!OFFER_SCOPE_TYPES.includes(scopeType)) {
    if (raw.appliesToCategory) {
      scopeType = "category";
    } else if (!raw.appliesToTarget || raw.appliesToTarget === "All" || raw.appliesToTarget === "") {
      scopeType = "all";
    } else {
      scopeType = "item";
    }
  }

  // Multi-item target list (backwards-compatible with appliesToTarget string)
  let appliesToItems = [];
  if (Array.isArray(raw.appliesToItems)) {
    appliesToItems = raw.appliesToItems.map((s) => String(s).trim()).filter(Boolean);
  } else if (raw.appliesToTarget && raw.appliesToTarget !== "All") {
    appliesToItems = [String(raw.appliesToTarget).trim()];
  }

  const appliesToCategory = typeof raw.appliesToCategory === "string" ? raw.appliesToCategory.trim() : "";
  const appliesToTarget = raw.appliesToTarget || (appliesToItems.length > 0 ? appliesToItems[0] : "");

  return {
    id,
    title: typeof raw.title === "string" ? raw.title.trim() : "Special Offer",
    description: typeof raw.description === "string" ? raw.description.trim() : "",
    appliesToService,
    scopeType,
    appliesToCategory,
    appliesToTarget,
    appliesToItems,
    partnerId: raw.partnerId || null,
    badgeText: typeof raw.badgeText === "string" && raw.badgeText.trim() ? raw.badgeText.trim() : "Special Offer",
    active: raw.active === true || raw.active === "true",
    startDate: typeof raw.startDate === "string" ? raw.startDate.trim() : "",
    endDate: typeof raw.endDate === "string" ? raw.endDate.trim() : "",
    discountType: raw.discountType || "none",
    discountValue: raw.discountValue != null ? String(raw.discountValue).trim() : null,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}
