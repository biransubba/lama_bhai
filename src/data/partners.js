import { createRepo } from "../utils/localRepo.js";
import { normalizePartner } from "./schema.js";
import { staysStore } from "./staysStore.js";

// Clean up any legacy dummy sample partner data from localStorage on load
if (typeof window !== "undefined" && window.localStorage) {
  try {
    const raw = localStorage.getItem("admin_partners");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Keep ONLY real admin-added partners (not dummy partner_00X seed IDs)
        const cleaned = parsed.filter(
          (p) =>
            p &&
            p.isSampleData !== true &&
            !(typeof p.id === "string" && /^partner_00[1-9]$/.test(p.id)) &&
            typeof p.name === "string" &&
            p.name.trim() !== ""
        );
        if (cleaned.length !== parsed.length) {
          localStorage.setItem("admin_partners", JSON.stringify(cleaned));
        }
      }
    }
  } catch (e) {
    console.warn("[partners] Error cleaning legacy sample partners:", e);
  }
}

/**
 * Partners Data Repository
 *
 * No dummy partners are seeded. Partners only exist when added by the admin.
 */

export const initialPartners = [];

export const partnersRepo = createRepo("admin_partners", [], {
  normalize: normalizePartner,
});

/**
 * Returns all partners with dynamically reconciled assignedPropertyIds.
 */
export function getAllPartners() {
  const partners = partnersRepo.getAll();
  const allStays = staysStore.getAll();

  return partners.map((partner) => {
    // Collect all property IDs in staysStore that have this partnerId
    const stayIdsFromStore = allStays
      .filter((s) => s.partnerId === partner.id)
      .map((s) => s.id);

    const mergedPropertyIds = Array.from(
      new Set([...(partner.assignedPropertyIds || []), ...stayIdsFromStore])
    );

    return {
      ...partner,
      assignedPropertyIds: mergedPropertyIds,
    };
  });
}

/**
 * Returns all approved partners strictly.
 * Requirement 5: Prevent unapproved, pending, rejected, or suspended partners
 * from being treated as active partners in the frontend simulation (/partner).
 */
export function getApprovedPartners() {
  return getAllPartners().filter(
    (p) => p.status === "Approved" || p.status === "approved"
  );
}

/**
 * Returns a single partner by ID with assigned properties resolved.
 */
export function getPartnerById(id) {
  if (!id) return null;
  return getAllPartners().find((p) => p.id === id) || null;
}

/**
 * Returns the actual stay objects assigned to a given partner ID.
 */
export function getAssignedProperties(partnerId) {
  if (!partnerId) return [];
  const allStays = staysStore.getAll();
  return allStays.filter((s) => s.partnerId === partnerId);
}

/**
 * Updates a partner's status with review metadata.
 */
export function updatePartnerStatus(partnerId, newStatus, reviewerNotes = "") {
  if (!partnerId) return false;
  const updates = {
    status: newStatus,
    reviewedAt: new Date().toISOString(),
  };
  if (reviewerNotes) {
    updates.reviewerNotes = reviewerNotes;
  }
  partnersRepo.update("id", partnerId, updates);
  return true;
}

/**
 * Assigns a stay property to a partner, updating both the stay record and the partner record.
 * Automatically cleans up assignment from previous partner if already assigned.
 */
export function assignPropertyToPartner(partnerId, propertyId) {
  if (!partnerId || !propertyId) return false;

  // 1. If property was previously assigned to another partner, remove it from that partner
  const currentStay = staysStore.getById(propertyId);
  if (currentStay?.partnerId && currentStay.partnerId !== partnerId) {
    const prevPartner = partnersRepo.getById(currentStay.partnerId);
    if (prevPartner) {
      const filtered = (prevPartner.assignedPropertyIds || []).filter((id) => id !== propertyId);
      partnersRepo.update("id", prevPartner.id, { assignedPropertyIds: filtered });
    }
  }

  // 2. Update stay record
  staysStore.update("id", propertyId, { partnerId });

  // 3. Update partner record
  const partner = partnersRepo.getById(partnerId);
  if (partner) {
    const existing = new Set(partner.assignedPropertyIds || []);
    existing.add(propertyId);
    partnersRepo.update("id", partnerId, { assignedPropertyIds: Array.from(existing) });
  }

  return true;
}

/**
 * Sets the exact list of properties assigned to a partner.
 * Handles both new assignments and unassignments in a single batch.
 */
export function setPartnerAssignedProperties(partnerId, newPropertyIds = []) {
  if (!partnerId) return false;
  const targetIds = new Set(newPropertyIds);
  const allStays = staysStore.getAll();

  // 1. Unassign any stays currently linked to this partner that are NOT in targetIds
  allStays
    .filter((s) => s.partnerId === partnerId && !targetIds.has(s.id))
    .forEach((s) => {
      staysStore.update("id", s.id, { partnerId: null });
    });

  // 2. Assign target stays to this partner
  targetIds.forEach((propId) => {
    assignPropertyToPartner(partnerId, propId);
  });

  // 3. Update partner record directly
  partnersRepo.update("id", partnerId, { assignedPropertyIds: Array.from(targetIds) });
  return true;
}

/**
 * Reassigns a property to a different partner (or unassigns if newPartnerId is falsy).
 */
export function reassignProperty(propertyId, newPartnerId) {
  if (!propertyId) return false;
  if (!newPartnerId) {
    return unassignProperty(propertyId);
  }
  return assignPropertyToPartner(newPartnerId, propertyId);
}

/**
 * Unassigns a property from any partner.
 */
export function unassignProperty(propertyId) {
  if (!propertyId) return false;

  const stay = staysStore.getById(propertyId);
  if (stay?.partnerId) {
    const partnerId = stay.partnerId;
    const partner = partnersRepo.getById(partnerId);
    if (partner) {
      const filtered = (partner.assignedPropertyIds || []).filter((id) => id !== propertyId);
      partnersRepo.update("id", partnerId, { assignedPropertyIds: filtered });
    }
  }

  staysStore.update("id", propertyId, { partnerId: null });
  return true;
}
