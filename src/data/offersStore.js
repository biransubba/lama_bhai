import { createRepo } from "../utils/localRepo.js";
import { normalizeOffer } from "./schema.js";

/**
 * Shared Offers Store — Single source of truth for Main Admin Offers,
 * Host Partner Offers, and public listing / detail pages.
 *
 * Backed by localStorage with safe schema normalization.
 * No dummy offers are seeded; offers only exist when created by the Main Admin or Hosts.
 */

export const offersStore = createRepo("admin_offers", [], {
  normalize: normalizeOffer,
  idField: "id",
});

/**
 * Checks whether an offer is active and currently within its configured date range.
 */
export function isCurrentlyActive(offer) {
  if (!offer || (offer.active !== true && offer.active !== "true")) return false;

  const today = new Date().toISOString().slice(0, 10);
  if (offer.startDate && today < offer.startDate) return false;
  if (offer.endDate && today > offer.endDate) return false;

  return true;
}

/**
 * Returns human-readable validity status: "Active" | "Upcoming" | "Expired" | "Inactive"
 */
export function getOfferStatus(offer) {
  if (!offer || (offer.active !== true && offer.active !== "true")) {
    return "Inactive";
  }

  const today = new Date().toISOString().slice(0, 10);
  if (offer.startDate && today < offer.startDate) {
    return "Upcoming";
  }
  if (offer.endDate && today > offer.endDate) {
    return "Expired";
  }
  return "Active";
}

/**
 * Returns all currently active offers within date range.
 */
export function getActiveOffers() {
  return offersStore.getAll().filter(isCurrentlyActive);
}

/**
 * Returns active offers that apply to a specific service, item target, and optional category.
 *
 * Scope Hierarchy:
 * 1. Entire Service (scopeType === "all"): applies to all items in that service.
 * 2. Category (scopeType === "category"): applies if item's category matches.
 * 3. Specific Item(s) (scopeType === "item"): applies if target matches item name/ID.
 */
export function getActiveOffersFor(service, target, category = null) {
  const targetStr = typeof target === "object" && target !== null
    ? (target.name || target.id || target.slug || "")
    : String(target || "");

  const categoryStr = typeof category === "string" ? category.toLowerCase().trim() : "";

  return getActiveOffers().filter((o) => {
    // 1. Service check:
    if (o.appliesToService !== "All" && o.appliesToService !== service) {
      return false;
    }

    // 2. Inventory Scope check:
    const scope = o.scopeType || (o.appliesToCategory ? "category" : (o.appliesToTarget && o.appliesToTarget !== "All" ? "item" : "all"));

    if (scope === "all") {
      return true;
    }

    if (scope === "category") {
      if (!categoryStr || !o.appliesToCategory) return false;
      return o.appliesToCategory.toLowerCase().trim() === categoryStr;
    }

    if (scope === "item") {
      if (!targetStr) return false;
      const itemsList = Array.isArray(o.appliesToItems) && o.appliesToItems.length > 0
        ? o.appliesToItems
        : [o.appliesToTarget].filter(Boolean);

      if (itemsList.length === 0) return true; // Blanket if no items listed

      const targetLower = targetStr.toLowerCase().trim();
      return itemsList.some((item) => {
        const itemLower = String(item).toLowerCase().trim();
        return (
          itemLower === targetLower ||
          targetLower.includes(itemLower) ||
          itemLower.includes(targetLower)
        );
      });
    }

    return true;
  });
}

/**
 * Repository API CRUD Helpers
 */
export function getAllOffers() {
  return offersStore.getAll();
}

export function getOfferById(id) {
  if (!id) return null;
  return offersStore.getAll().find((o) => o.id === id) || null;
}

export function addOffer(offerData) {
  return offersStore.add(offerData);
}

export function updateOffer(id, updates) {
  return offersStore.update("id", id, updates);
}

export function deleteOffer(id) {
  return offersStore.remove("id", id);
}

export function toggleOfferActive(id) {
  const current = getOfferById(id);
  if (!current) return false;
  const nextActive = !(current.active === true || current.active === "true");
  return offersStore.update("id", id, { active: nextActive, updatedAt: new Date().toISOString() });
}

/**
 * Summary metrics strictly from stored records.
 */
export function getOffersSummary() {
  const all = offersStore.getAll();
  const liveActiveCount = all.filter((o) => getOfferStatus(o) === "Active").length;
  const upcomingCount = all.filter((o) => getOfferStatus(o) === "Upcoming").length;
  const expiredCount = all.filter((o) => getOfferStatus(o) === "Expired").length;
  const inactiveCount = all.filter((o) => getOfferStatus(o) === "Inactive").length;

  return {
    totalCount: all.length,
    liveActiveCount,
    upcomingCount,
    expiredCount,
    inactiveCount,
    inactiveOrExpiredCount: expiredCount + inactiveCount,
  };
}