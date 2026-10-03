/**
 * IndexedDB storage utility for homestay photos.
 * Replaces localStorage for high-capacity, browser-local photo storage
 * without hitting the ~5MB domain quota.
 *
 * NOTE: Photos stored in IndexedDB are local to this browser instance.
 * Cross-device visibility requires shared cloud storage (e.g. GCS / S3)
 * which will be connected in the production backend phase.
 */

const DB_NAME = "LamaBhaiTourism_DB";
const DB_VERSION = 1;
const STORE_NAME = "homestay_photos";

let dbPromise = null;

export function openPhotoDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this browser environment."));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("by_propertyId", "propertyId", { unique: false });
        store.createIndex("by_order", "order", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Retrieves all photos belonging to a specific homestay / property ID,
 * sorted by their display order.
 * @param {string} propertyId
 * @returns {Promise<Array<{ id: string, propertyId: string, dataUrl: string, name: string, isCover: boolean, order: number, category: string, createdAt: string }>>}
 */
export async function getPhotosForProperty(propertyId) {
  if (!propertyId) return [];

  try {
    const db = await openPhotoDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("by_propertyId");
      const request = index.getAll(IDBKeyRange.only(propertyId));

      request.onsuccess = () => {
        const list = request.result || [];
        // Sort by order ascending
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        // Guarantee dataUrl is always a clean string even if an object was previously persisted
        const sanitized = list.map((p) => {
          const rawUrl = p.dataUrl || p.src;
          const cleanUrl =
            typeof rawUrl === "object" && rawUrl !== null
              ? (rawUrl.dataUrl || rawUrl.src || "")
              : String(rawUrl || "");
          return {
            ...p,
            dataUrl: cleanUrl,
          };
        });
        resolve(sanitized);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Failed to load photos for property ${propertyId}:`, err);
    return [];
  }
}

/**
 * Saves a list of photos for a specific property, replacing any existing
 * photos for that property. Ensures order and cover photo flag are strictly maintained.
 * @param {string} propertyId
 * @param {Array<{ id?: string, dataUrl: string, name?: string, isCover?: boolean, category?: string }>} photos
 * @param {string|null} coverPhotoId - Optional ID of the photo to designate as cover
 */
export async function savePhotosForProperty(propertyId, photos, coverPhotoId = null) {
  if (!propertyId) throw new Error("Property ID is required to save photos.");

  const db = await openPhotoDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("by_propertyId");

    // 1. Delete all existing records for this property
    const getExisting = index.getAll(IDBKeyRange.only(propertyId));

    getExisting.onsuccess = () => {
      const existing = getExisting.result || [];
      existing.forEach((rec) => {
        store.delete(rec.id);
      });

      // 2. Prepare normalized records
      // Determine which photo is cover:
      // If coverPhotoId is provided, find it; otherwise find item with isCover === true; fallback to first item
      let activeCoverId = coverPhotoId;
      if (!activeCoverId) {
        const explicitCover = photos.find((p) => p.isCover);
        activeCoverId = explicitCover?.id || photos[0]?.id;
      }

      const recordsToInsert = photos.map((p, idx) => {
        const id = p.id || `photo_${propertyId}_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
        const isCover = p.id ? p.id === activeCoverId : (idx === 0 && !activeCoverId) || p.id === activeCoverId;
        const rawUrl = p.dataUrl || p.src;
        const cleanUrl =
          typeof rawUrl === "object" && rawUrl !== null
            ? (rawUrl.dataUrl || rawUrl.src || "")
            : String(rawUrl || "");

        return {
          id,
          propertyId,
          dataUrl: cleanUrl,
          name: p.name || `Photo ${idx + 1}`,
          isCover: Boolean(isCover),
          order: idx,
          category: p.category || (isCover ? "Cover" : "Gallery"),
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      // If no photo was marked as cover and list is not empty, ensure index 0 is cover
      if (recordsToInsert.length > 0 && !recordsToInsert.some((r) => r.isCover)) {
        recordsToInsert[0].isCover = true;
        recordsToInsert[0].category = "Cover";
      }

      // 3. Put all records
      recordsToInsert.forEach((rec) => {
        store.put(rec);
      });
    };

    transaction.oncomplete = () => {
      // Notify components across the application in real-time
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("homestay-photos-changed", { detail: { propertyId } }));
        window.dispatchEvent(new CustomEvent("photos-changed", { detail: { entityId: propertyId } }));
      }
      resolve(true);
    };

    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Returns a summary map of all properties with their local photo count
 * and cover image dataUrl:
 * { [propertyId]: { count: number, coverUrl: string | null } }
 */
export async function getAllPropertyPhotoSummaries() {
  try {
    const db = await openPhotoDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const allPhotos = request.result || [];
        const summaries = {};

        allPhotos.forEach((photo) => {
          if (!photo.propertyId) return;
          if (!summaries[photo.propertyId]) {
            summaries[photo.propertyId] = {
              count: 0,
              coverUrl: null,
            };
          }
          summaries[photo.propertyId].count += 1;
          const rawUrl = photo.dataUrl;
          const cleanUrl =
            typeof rawUrl === "object" && rawUrl !== null
              ? (rawUrl.dataUrl || rawUrl.src || "")
              : String(rawUrl || "");
          if ((photo.isCover || !summaries[photo.propertyId].coverUrl) && cleanUrl) {
            summaries[photo.propertyId].coverUrl = cleanUrl;
          }
        });

        resolve(summaries);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("[IndexedDB] Failed to get photo summaries:", err);
    return {};
  }
}

/**
 * Deletes all photos associated with a property (e.g. when homestay is deleted).
 * @param {string} propertyId
 */
export async function deletePhotosForProperty(propertyId) {
  if (!propertyId) return;
  try {
    const db = await openPhotoDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("by_propertyId");
      const request = index.getAll(IDBKeyRange.only(propertyId));

      request.onsuccess = () => {
        const list = request.result || [];
        list.forEach((rec) => store.delete(rec.id));
      };

      transaction.oncomplete = () => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("homestay-photos-changed", { detail: { propertyId } }));
          window.dispatchEvent(new CustomEvent("photos-changed", { detail: { entityId: propertyId } }));
        }
        resolve(true);
      };

      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Failed to delete photos for property ${propertyId}:`, err);
  }
}

// Generic entity aliases for destinations, journeys, bikes, and cars
export const getPhotosForEntity = getPhotosForProperty;
export const savePhotosForEntity = savePhotosForProperty;
export const getAllEntityPhotoSummaries = getAllPropertyPhotoSummaries;
export const deletePhotosForEntity = deletePhotosForProperty;

