import { createRepo } from "./localRepo.js";
import { normalizeBookingRequest, BOOKING_REQUEST_STATUSES, INVENTORY_SERVICES } from "../data/schema.js";
import { staysStore, getRoomById } from "../data/staysStore.js";
import { carUnitsRepo, carModelsRepo } from "../data/vehicles.js";
import { bikeUnitsRepo, bikeModelsRepo } from "../data/bikes.js";
import { api } from "./api.js";

// Frontend booking/request storage using localStorage with safe schema normalization
// and real-time synchronization with the Express/MongoDB backend.
//
// SEPARATION OF CONCERNS (Requirement 8):
// - Booking Request Status tracks customer enquiry progression:
//   New → Contacted → In Progress → Confirmed → Completed → Cancelled
// - Inventory Availability tracks real physical unit availability:
//   "available" vs "unavailable" (configured on the vehicle, bike, or stay record itself).
// - Neither status mutates or conflates the other.
//
// INVENTORY REFERENCES (Requirement 7):
// - Requests store only the `inventoryId` and `service` type, referencing
//   live inventory instead of cloning entire entity objects.

const STORAGE_KEY = "lamabhai_booking_requests";

export const BOOKING_STATUSES = BOOKING_REQUEST_STATUSES;
export const SERVICE_TYPES = INVENTORY_SERVICES;

export const CANCELLATION_REASONS = [
  "Change of travel dates or itinerary",
  "Personal or family emergency",
  "Inclement weather or mountain road conditions",
  "Found alternate transport or accommodation",
  "Health / medical reasons",
  "Other / personal decision",
];

export const bookingRepo = createRepo(STORAGE_KEY, [], {
  normalize: normalizeBookingRequest,
  idField: "id",
});

export function getAllBookingRequests() {
  return bookingRepo.getAll();
}

/**
 * Saves a new booking enquiry referencing an inventory ID.
 * Persists locally and synchronizes with Express/MongoDB backend asynchronously.
 */
export function saveBookingRequest(request) {
  const reqId = request.bookingRequestId || request.id || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const normalized = normalizeBookingRequest({
    ...request,
    id: reqId,
    bookingRequestId: reqId,
    status: request.status || "New",
    submittedAt: request.submittedAt || request.createdAt || now,
    createdAt: request.createdAt || request.submittedAt || now,
    updatedAt: now,
  });

  const saved = bookingRepo.add(normalized);

  // Asynchronously synchronize with live backend if in browser
  if (typeof window !== "undefined" && typeof fetch !== "undefined") {
    const payload = {
      service: request.service || "Stay",
      customerName: request.fullName || request.customerName || request.name || "Guest",
      customerEmail: request.email || request.customerEmail || "guest@lamabhaila.com",
      customerPhone: request.phone || request.customerPhone || "9876543210",
      guestCount: parseInt(request.guests || request.guestCount || 1, 10) || 1,
      dates: {
        checkIn: request.checkInDate || request.checkIn || new Date().toISOString(),
        checkOut: request.checkOutDate || request.checkOut || new Date(Date.now() + 86400000).toISOString(),
      },
      specialRequests: request.notes || request.specialRequests || "",
    };

    api.bookings
      .create(payload)
      .then((res) => {
        if (res && res.success && res.data) {
          bookingRepo.update("id", reqId, {
            backendId: res.data._id,
            bookingRequestId: res.data.bookingRequestId || reqId,
            trackingCode: res.data.bookingRequestId,
          });
        }
      })
      .catch((err) => {
        console.warn("[bookingStorage] Backend sync deferred (offline/fallback mode):", err.message);
      });
  }

  return saved;
}

/**
 * Updates enquiry status without altering inventory availability status.
 */
export function updateBookingRequestStatus(id, status, extraMeta = {}) {
  if (!BOOKING_STATUSES.includes(status)) return false;
  const updated = bookingRepo.update("id", id, {
    status,
    ...extraMeta,
    updatedAt: new Date().toISOString(),
  });
  return Boolean(updated);
}

/**
 * Verifies and looks up a booking request by ID, Phone, and Email.
 * Normalizes phone numbers (stripping non-digits) for reliable matching.
 */
export function lookupBookingRequest({ id, phone, email }) {
  if (!id || !phone || !email) {
    return { success: false, error: "Please enter your Booking Reference ID, Phone Number, and Email Address." };
  }

  const cleanId = id.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhoneDigits = phone.replace(/\D/g, "");

  const all = bookingRepo.getAll();
  const found = all.find((r) => {
    if (!r || !r.id) return false;
    const matchId = r.id.toLowerCase() === cleanId;
    if (!matchId) return false;

    const rEmail = (r.email || "").trim().toLowerCase();
    const rPhoneDigits = (r.phone || "").replace(/\D/g, "");

    const matchPhone =
      cleanPhoneDigits.length >= 10 && rPhoneDigits.length >= 10
        ? cleanPhoneDigits.slice(-10) === rPhoneDigits.slice(-10)
        : cleanPhoneDigits === rPhoneDigits;

    const matchEmail = rEmail === cleanEmail;

    return matchPhone && matchEmail;
  });

  if (!found) {
    // Check if ID alone exists to give targeted assistance
    const idOnly = all.find((r) => r.id.toLowerCase() === cleanId);
    if (!idOnly) {
      return {
        success: false,
        error: `No reservation found with Reference ID "${id}". Please double-check your ID.`,
      };
    }
    return {
      success: false,
      error: "We found this Reference ID, but the phone number or email address did not match the details provided during booking. Please verify your contact info.",
    };
  }

  return { success: true, booking: found };
}

/**
 * Instantly cancels a booking request, recording cancellation metadata.
 */
export function cancelBookingRequest(id, { reason = "Customer request", notes = "", cancelledBy = "customer" } = {}) {
  const all = bookingRepo.getAll();
  const target = all.find((r) => r.id === id);
  if (!target) return null;

  const patch = {
    status: "Cancelled",
    cancelledAt: new Date().toISOString(),
    cancelledBy,
    cancellationReason: reason,
    cancellationNotes: notes,
    updatedAt: new Date().toISOString(),
  };

  const updated = bookingRepo.update("id", id, patch);
  if (updated) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("booking-cancelled", { detail: { bookingId: id, service: target.service, inventoryId: target.inventoryId } })
      );

      // Asynchronously sync cancellation with backend API
      if (typeof fetch !== "undefined") {
        api.bookings
          .cancel(target.bookingRequestId || target.backendId || id, reason)
          .catch((err) => {
            console.warn("[bookingStorage] Backend cancel sync deferred:", err.message);
          });
      }
    }
  }

  return updated;
}

/**
 * Resolves the live inventory record referenced by a booking request.
 * Does not duplicate data.
 */
export function getInventoryForBooking(request) {
  if (!request) return null;

  switch (request.service) {
    case "Stay": {
      const allStays = staysStore.getAll();
      const targetRoomId = request.roomId || (request.inventoryId?.startsWith("room_") ? request.inventoryId : null);
      const targetPropertyId = request.propertyId || request.inventoryId;

      if (targetRoomId) {
        const room = getRoomById(targetRoomId);
        if (room) {
          const parentProperty = allStays.find((s) => s.id === (request.propertyId || room.propertyId));
          return {
            ...room,
            roomId: room.id,
            roomName: room.name,
            property: parentProperty || null,
            propertyId: parentProperty?.id || room.propertyId,
            propertyName: parentProperty?.name || "Stay",
            location: parentProperty?.location || "Sikkim",
            name: parentProperty ? `${parentProperty.name} — ${room.name}` : room.name,
          };
        }
      }

      const directStay = allStays.find((s) => s.id === targetPropertyId);
      if (directStay) return directStay;

      // Fallback check if inventoryId was a room
      if (request.inventoryId) {
        const room = getRoomById(request.inventoryId);
        if (room) {
          const parentProperty = allStays.find((s) => s.id === room.propertyId);
          return {
            ...room,
            roomId: room.id,
            roomName: room.name,
            property: parentProperty || null,
            propertyId: parentProperty?.id || room.propertyId,
            propertyName: parentProperty?.name || "Stay",
            location: parentProperty?.location || "Sikkim",
            name: parentProperty ? `${parentProperty.name} — ${room.name}` : room.name,
          };
        }
      }
      return null;
    }

    case "Car":
      return (
        carUnitsRepo.getAll().find((u) => u.id === request.inventoryId) ||
        carModelsRepo.getAll().find((m) => m.slug === request.inventoryId) ||
        null
      );

    case "Bike":
      return (
        bikeUnitsRepo.getAll().find((b) => b.id === request.inventoryId) ||
        bikeModelsRepo.getAll().find((m) => m.slug === request.inventoryId) ||
        null
      );

    default:
      return null;
  }
}

/**
 * Pulls a detail out of the request's `details` array by label.
 */
export function getDetailValue(request, label) {
  const found = request?.details?.find((d) => d.label === label);
  return found ? found.value : "—";
}