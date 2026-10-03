import { createRepo } from "../utils/localRepo.js";
import { stayLocations } from "./stays.js";
import { normalizeStay, normalizeRoom } from "./schema.js";

// Clean up any legacy dummy sample data from localStorage on load
if (typeof window !== "undefined" && window.localStorage) {
  try {
    const rawStays = localStorage.getItem("admin_stays");
    if (rawStays) {
      const parsedStays = JSON.parse(rawStays);
      if (Array.isArray(parsedStays)) {
        // Keep ONLY real admin-added stays (not sample data, and has a real non-empty name)
        const cleanedStays = parsedStays.filter(
          (s) =>
            s &&
            s.isSampleData !== true &&
            typeof s.name === "string" &&
            s.name.trim() !== ""
        );
        if (cleanedStays.length !== parsedStays.length) {
          localStorage.setItem("admin_stays", JSON.stringify(cleanedStays));
        }
      }
    }

    const rawRooms = localStorage.getItem("admin_rooms");
    if (rawRooms) {
      const parsedRooms = JSON.parse(rawRooms);
      if (Array.isArray(parsedRooms)) {
        const cleanedRooms = parsedRooms.filter(
          (r) =>
            r &&
            r.isSampleData !== true &&
            r.propertyId &&
            typeof r.name === "string" &&
            r.name.trim() !== ""
        );
        if (cleanedRooms.length !== parsedRooms.length) {
          localStorage.setItem("admin_rooms", JSON.stringify(cleanedRooms));
        }
      }
    }
  } catch (e) {
    console.warn("[staysStore] Error cleaning legacy sample data:", e);
  }
}

export const initialStays = [
  {
    id: "lachen-mountain-homestay",
    name: "Lachen Mountain Homestay",
    location: "Lachen",
    type: "Homestay",
    description: "Authentic Himalayan homestay hosted by a welcoming local Lachenpa family overlooking the snow peaks. Features warm timber rooms, home-cooked organic local meals, and peaceful mountain valley views.",
    availability: "available",
    status: "published",
    active: true,
    price: "₹2,400/night",
    amenities: [
      "Traditional wooden rooms",
      "Home-cooked local meals",
      "Room heater / Bukhari",
      "Hot water",
      "Mountain view",
      "Organic garden",
    ],
  },
];

export const initialRooms = [
  {
    id: "room_lachen_01",
    propertyId: "lachen-mountain-homestay",
    name: "Room 1 — Valley View Wooden Room",
    type: "Standard Room",
    description: "Cozy wood-paneled room with wide windows looking out across the Lachen valley.",
    price: "₹2,400/night",
    amenities: ["Room heater / Bukhari", "Attached Bathroom", "Hot water", "Mountain view"],
    availability: "available",
    capacity: 2,
    active: true,
    status: "published",
  },
  {
    id: "room_lachen_02",
    propertyId: "lachen-mountain-homestay",
    name: "Room 2 — Himalayan Family Suite",
    type: "Suite",
    description: "Spacious master suite featuring a private balcony with panoramic mountain views, twin beds, and sitting area.",
    price: "₹3,800/night",
    amenities: ["Room heater / Bukhari", "Attached Bathroom", "Private Balcony", "Mountain view", "Tea / Coffee Maker"],
    availability: "available",
    capacity: 4,
    active: true,
    status: "published",
  },
  {
    id: "room_lachen_03",
    propertyId: "lachen-mountain-homestay",
    name: "Room 3 — Deluxe Attic Loft",
    type: "Deluxe Room",
    description: "Charming timber attic room with heated blankets and peaceful valley ambiance.",
    price: "₹2,800/night",
    amenities: ["Heated blankets", "Attached Bathroom", "Hot water"],
    availability: "available",
    capacity: 2,
    active: true,
    status: "published",
  },
];

// ============================================================================
// LEVEL 1: PROPERTIES REPOSITORY
// ============================================================================
// Shared stays data store — single source of truth for both public Stays pages
// and Admin → Stays section. Backed by localStorage with safe normalization.
export const staysStore = createRepo("admin_stays", initialStays, {
  normalize: normalizeStay,
  mergeNewSeeds: true,
});

// ============================================================================
// LEVEL 2: ROOMS REPOSITORY
// ============================================================================
// Individual room units under properties. Each room belongs to exactly one
// property through `propertyId`. Backed by localStorage.
export const roomsStore = createRepo("admin_rooms", initialRooms, {
  normalize: normalizeRoom,
  mergeNewSeeds: true,
});

// ============================================================================
// BACKWARD COMPATIBILITY & SYNTHESIS
// ============================================================================

/**
 * Synthesizes a default room representation for a property when no explicit rooms
 * are registered in admin_rooms. Ensures 100% backward compatibility with legacy
 * property-level rate, amenities, and availability.
 */
export function synthesizeDefaultRoom(property) {
  if (!property || !property.id) return null;
  return normalizeRoom(
    {
      id: `room_${property.id}_default`,
      propertyId: property.id,
      name: property.type === "Hotel" ? "Standard Room" : "Main Guest Room",
      type: "Standard Room",
      description: property.description || "Comfortable accommodation room.",
      image: property.image || null,
      gallery: Array.isArray(property.gallery) ? property.gallery : [],
      price: property.price || null,
      amenities: Array.isArray(property.amenities) ? property.amenities : [],
      availability: property.availability === "unavailable" ? "unavailable" : "available",
      status: property.status || "published",
      active: property.active !== false,
      capacity: null,
      isSampleData: Boolean(property.isSampleData),
    },
    property.id
  );
}

// ============================================================================
// ROOMS GETTERS & REPOSITORY HELPERS
// ============================================================================

/**
 * Returns all active/published rooms for a given property.
 * If no rooms are explicitly defined in admin_rooms, falls back to the synthesized default room.
 */
export function getRoomsByPropertyId(propertyId) {
  if (!propertyId) return [];
  const storedRooms = roomsStore
    .getAll()
    .filter((r) => r.propertyId === propertyId && r.active !== false && r.status !== "draft");

  if (storedRooms.length > 0) {
    return storedRooms;
  }

  // Backward-compatibility fallback: check if parent property exists
  const parentStay = staysStore.getAll().find((s) => s.id === propertyId);
  if (parentStay && parentStay.name) {
    if (Array.isArray(parentStay.rooms)) {
      if (parentStay.rooms.length > 0) {
        return parentStay.rooms.filter((r) => r.active !== false && r.status !== "draft");
      }
      return [];
    }
    const synthetic = synthesizeDefaultRoom(parentStay);
    return synthetic ? [synthetic] : [];
  }

  return [];
}

/**
 * Returns all rooms (including draft / inactive) for a property for administrative management.
 */
export function getAllRoomsByPropertyId(propertyId) {
  if (!propertyId) return [];
  const storedRooms = roomsStore
    .getAll()
    .filter((r) => r.propertyId === propertyId);

  if (storedRooms.length > 0) {
    return storedRooms;
  }

  const parentStay = staysStore.getAll().find((s) => s.id === propertyId);
  if (parentStay && parentStay.name) {
    if (Array.isArray(parentStay.rooms)) {
      return parentStay.rooms;
    }
    const synthetic = synthesizeDefaultRoom(parentStay);
    return synthetic ? [synthetic] : [];
  }

  return [];
}

/**
 * Finds a room by its unique room ID across all properties.
 * Also resolves synthetic default room IDs.
 */
export function getRoomById(roomId) {
  if (!roomId) return null;
  const direct = roomsStore.getAll().find((r) => r.id === roomId);
  if (direct) return direct;

  const allStays = staysStore.getAll();
  for (const stay of allStays) {
    if (Array.isArray(stay.rooms)) {
      const found = stay.rooms.find((r) => r.id === roomId);
      if (found) return found;
    }
  }

  if (roomId.startsWith("room_") && roomId.endsWith("_default")) {
    const propertyId = roomId.replace(/^room_/, "").replace(/_default$/, "");
    const propertyRooms = getRoomsByPropertyId(propertyId);
    if (propertyRooms.length > 0) {
      return propertyRooms[0];
    }
    const parentStay = allStays.find((s) => s.id === propertyId);
    if (parentStay) {
      return synthesizeDefaultRoom(parentStay);
    }
  }

  return null;
}

/**
 * Returns all active rooms across all properties.
 */
export function getAllRooms() {
  const explicitRooms = roomsStore.getAll().filter((r) => r.active !== false && r.status !== "draft");
  const explicitPropertyIds = new Set(explicitRooms.map((r) => r.propertyId));

  const activeStays = staysStore.getAll().filter(
    (p) =>
      p &&
      p.isSampleData !== true &&
      typeof p.name === "string" &&
      p.name.trim() !== "" &&
      p.active !== false &&
      p.status !== "draft"
  );

  const syntheticRooms = [];
  for (const stay of activeStays) {
    if (!explicitPropertyIds.has(stay.id)) {
      const synthetic = synthesizeDefaultRoom(stay);
      if (synthetic) syntheticRooms.push(synthetic);
    }
  }

  return [...explicitRooms, ...syntheticRooms];
}

/**
 * Finds the parent property for a given room ID.
 */
export function getPropertyByRoomId(roomId) {
  if (!roomId) return null;
  const room = getRoomById(roomId);
  if (!room || !room.propertyId) return null;
  return getStayById(room.propertyId);
}

/**
 * Returns the count of available rooms for a given property.
 */
export function getAvailableRoomCount(propertyId) {
  if (!propertyId) return 0;
  return getRoomsByPropertyId(propertyId).filter((r) => r.availability === "available").length;
}

/**
 * Adds an individual room unit to a property.
 * Synchronizes both roomsStore (admin_rooms) and parent property (admin_stays).
 */
export function addRoom(roomPayload) {
  if (!roomPayload || !roomPayload.propertyId) return null;
  const normalized = normalizeRoom(roomPayload, roomPayload.propertyId);
  if (!normalized) return null;

  const added = roomsStore.add(normalized);

  // Synchronize parent stay in admin_stays
  const parentStay = staysStore.getById(roomPayload.propertyId);
  if (parentStay) {
    const existingStayRooms = Array.isArray(parentStay.rooms) ? parentStay.rooms : [];
    const updatedStayRooms = [...existingStayRooms.filter((r) => r.id !== normalized.id), normalized];
    staysStore.update("id", parentStay.id, {
      rooms: updatedStayRooms,
      roomCount: updatedStayRooms.length,
    });
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("admin-storage-changed", { detail: { repo: "admin_rooms" } })
    );
    window.dispatchEvent(
      new CustomEvent("admin-storage-changed", { detail: { repo: "admin_stays" } })
    );
    window.dispatchEvent(new CustomEvent("storage"));
  }

  return added;
}

/**
 * Updates an individual room unit.
 * Reliably handles explicitly stored rooms as well as materializing synthetic/default rooms.
 * Synchronizes BOTH roomsStore (admin_rooms) and parent property in staysStore (admin_stays).
 */
export function updateRoom(roomId, patch) {
  if (!roomId) return null;

  const allStored = roomsStore.getAll();
  const existing = allStored.find((r) => r.id === roomId);

  const propertyId =
    patch.propertyId ||
    existing?.propertyId ||
    (roomId.startsWith("room_") && roomId.endsWith("_default")
      ? roomId.replace(/^room_/, "").replace(/_default$/, "")
      : null);

  const parentStay = propertyId ? staysStore.getById(propertyId) : null;
  const baseSynthetic = parentStay ? synthesizeDefaultRoom(parentStay) : {};

  let updatedRecord = null;

  if (!existing) {
    // Room is not in roomsStore yet (e.g. editing a synthetic default room or legacy stay-embedded room)
    const materialized = normalizeRoom(
      {
        ...baseSynthetic,
        ...patch,
        id: roomId,
        propertyId: propertyId || baseSynthetic?.propertyId || patch.propertyId,
      },
      propertyId || baseSynthetic?.propertyId
    );

    if (materialized) {
      roomsStore.add(materialized);
      updatedRecord = materialized;
    }
  } else {
    // Room exists in roomsStore
    updatedRecord = roomsStore.update("id", roomId, patch);
  }

  // ALWAYS synchronize parent stay in admin_stays so both stores remain 100% in sync
  if (updatedRecord && propertyId) {
    const targetStay = parentStay || staysStore.getById(propertyId);
    if (targetStay) {
      const existingStayRooms = Array.isArray(targetStay.rooms) ? targetStay.rooms : [];
      const hasRoom = existingStayRooms.some((r) => r.id === roomId);
      const updatedStayRooms = hasRoom
        ? existingStayRooms.map((r) => (r.id === roomId ? updatedRecord : r))
        : [...existingStayRooms.filter((r) => r.id !== roomId), updatedRecord];

      staysStore.update("id", targetStay.id, {
        rooms: updatedStayRooms,
        roomCount: updatedStayRooms.length,
      });
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("admin-storage-changed", { detail: { repo: "admin_rooms" } })
    );
    window.dispatchEvent(
      new CustomEvent("admin-storage-changed", { detail: { repo: "admin_stays" } })
    );
    window.dispatchEvent(new CustomEvent("storage"));
  }

  return updatedRecord;
}

/**
 * Deletes an individual room unit.
 * Synchronizes BOTH roomsStore (admin_rooms) and staysStore (admin_stays).
 */
export function deleteRoom(roomId) {
  if (!roomId) return;
  const room = getRoomById(roomId);
  const propertyId = room?.propertyId || (roomId.startsWith("room_") && roomId.endsWith("_default")
    ? roomId.replace(/^room_/, "").replace(/_default$/, "")
    : null);

  roomsStore.remove("id", roomId);

  if (propertyId) {
    const parentStay = staysStore.getById(propertyId);
    if (parentStay) {
      const existingStayRooms = Array.isArray(parentStay.rooms) ? parentStay.rooms : [];
      const updatedStayRooms = existingStayRooms.filter((r) => r.id !== roomId);
      staysStore.update("id", parentStay.id, {
        rooms: updatedStayRooms,
        roomCount: updatedStayRooms.length,
      });
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("admin-storage-changed", { detail: { repo: "admin_rooms" } })
    );
    window.dispatchEvent(
      new CustomEvent("admin-storage-changed", { detail: { repo: "admin_stays" } })
    );
    window.dispatchEvent(new CustomEvent("storage"));
  }
}


/**
 * Deletes all rooms belonging to a property (called on property deletion).
 */
export function deleteRoomsForProperty(propertyId) {
  if (!propertyId) return;
  const all = roomsStore.getAll();
  const remaining = all.filter((r) => r.propertyId !== propertyId);
  roomsStore.set(remaining);
}

/**
 * Saves or replaces the complete list of rooms for a property.
 */
export function saveRoomsForProperty(propertyId, roomsList) {
  if (!propertyId || !Array.isArray(roomsList)) return [];
  const normalizedRooms = roomsList
    .map((r) => normalizeRoom({ ...r, propertyId }, propertyId))
    .filter(Boolean);
  const remaining = roomsStore.getAll().filter((r) => r.propertyId !== propertyId);
  roomsStore.set([...remaining, ...normalizedRooms]);
  return normalizedRooms;
}

// ============================================================================
// PROPERTY GETTERS & PUBLIC API
// ============================================================================

export function getAllActiveStays() {
  const rawList = staysStore.getAll();
  return rawList
    .filter(
      (p) =>
        p &&
        p.isSampleData !== true &&
        typeof p.name === "string" &&
        p.name.trim() !== "" &&
        p.active !== false &&
        p.status !== "draft" &&
        p.published !== false
    )
    .map((raw) => {
      const normalized = normalizeStay(raw);
      if (!normalized) return null;
      const rooms = getRoomsByPropertyId(normalized.id);
      return {
        ...normalized,
        rooms,
        roomCount: rooms.length,
        availableRoomCount: rooms.filter((r) => r.availability === "available").length,
      };
    })
    .filter(Boolean);
}

export function getActiveHomestays() {
  return getAllActiveStays().filter((p) => p.type === "Homestay");
}

export function getActiveLocations() {
  const active = getAllActiveStays();
  const fromStays = active.map((p) => p.location).filter(Boolean);
  return Array.from(new Set([...fromStays, ...stayLocations]));
}

export function getPropertiesByLocation(location) {
  if (!location) return getAllActiveStays();
  const locLower = location.toLowerCase();
  return getAllActiveStays().filter((p) => p.location && p.location.toLowerCase() === locLower);
}

export function getHomestaysByLocation(location) {
  return getPropertiesByLocation(location).filter((p) => p.type === "Homestay");
}

export function getAvailableCount(location) {
  if (!location) {
    return getAllActiveStays().filter((p) => p.availability === "available").length;
  }
  const locLower = location.toLowerCase();
  return getAllActiveStays().filter(
    (p) => p.location && p.location.toLowerCase() === locLower && p.availability === "available"
  ).length;
}

export function getStayById(id) {
  if (!id) return null;
  const stored = staysStore.getAll().find((p) => p.id === id);
  if (
    !stored ||
    stored.isSampleData === true ||
    !stored.name ||
    stored.name.trim() === ""
  ) {
    return null;
  }
  const normalized = normalizeStay(stored);
  if (!normalized) return null;
  const rooms = getRoomsByPropertyId(normalized.id);
  return {
    ...normalized,
    rooms,
    roomCount: rooms.length,
    availableRoomCount: rooms.filter((r) => r.availability === "available").length,
  };
}

export function locationEverExisted(location) {
  if (!location) return false;
  const locLower = location.toLowerCase();
  return (
    stayLocations.some((l) => l.toLowerCase() === locLower) ||
    getAllActiveStays().some((p) => p.location && p.location.toLowerCase() === locLower)
  );
}