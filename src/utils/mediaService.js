import {
  carModelsRepo,
  carUnitsRepo,
  bikeModelsRepo,
  bikeUnitsRepo,
  staysRepo,
  destinationsRepo,
  journeysRepo,
  offersRepo,
  mediaRepo,
} from "../admin/store/repos.js";

export { mediaRepo };


export const ENTITY_TYPES = {
  DESTINATION: "Destinations",
  JOURNEY: "Journeys",
  CAR_MODEL: "Cars",
  CAR_UNIT: "Individual Vehicles",
  BIKE_MODEL: "Bikes",
  BIKE_UNIT: "Individual Bikes",
  STAY: "Stays",
  OFFER: "Offers",
};

export const ENTITY_TYPE_LIST = Object.values(ENTITY_TYPES);

/**
import {
  validateImage,
  createResponsiveVariants,
  formatBytes,
} from "./imageProcessor.js";

export { formatBytes };

/**
 * Compresses an image File using the high-fidelity imageProcessor pipeline.
 * Keeps aspect ratio, validates dimensions, encodes to WebP/AVIF with JPEG fallback,
 * generates responsive variants, and reduces huge raw camera uploads safely.
 */
export async function compressImageFile(file, maxWidth = 1400, quality = 0.84) {
  if (!file) {
    throw new Error("Please select a valid image file.");
  }

  let targetMaxWidth = 1400;
  let targetQuality = 0.84;

  if (typeof maxWidth === "object" && maxWidth !== null) {
    targetMaxWidth = maxWidth.maxWidth || maxWidth.maxHeight || 1400;
    targetQuality = maxWidth.quality !== undefined ? maxWidth.quality : 0.84;
  } else {
    if (typeof maxWidth === "number") targetMaxWidth = maxWidth;
    if (typeof quality === "number") targetQuality = quality;
  }

  // 1. Validate file format and size
  const validation = await validateImage(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // 2. Generate multi-resolution responsive variants (AVIF + WebP + JPEG fallback)
  const variantsResult = await createResponsiveVariants(file, {
    fullWidth: targetMaxWidth,
    webpQuality: targetQuality,
    avifQuality: Math.max(0.75, targetQuality - 0.04),
    jpegQuality: Math.min(0.88, targetQuality + 0.02)
  });

  const fullVar = variantsResult.variants.full || variantsResult.variants.preview;
  const bestDataUrl = variantsResult.bestUrl || fullVar.bestUrl || fullVar.jpeg;
  const compressedBytes = fullVar.bytes.webp || fullVar.bytes.jpeg || Math.round((bestDataUrl.length * 3) / 4);

  return {
    dataUrl: bestDataUrl,
    avif: fullVar.avif,
    webp: fullVar.webp,
    jpeg: fullVar.jpeg,
    variants: variantsResult.variants,
    thumbnail: variantsResult.thumbnail,
    preview: variantsResult.preview,
    full: variantsResult.full,
    originalSize: formatBytes(file.size),
    originalSizeBytes: file.size,
    compressedSize: formatBytes(compressedBytes),
    compressedSizeBytes: compressedBytes,
    width: fullVar.width,
    height: fullVar.height,
    aspectRatio: variantsResult.aspectRatio,
    type: bestDataUrl.startsWith("data:image/avif") ? "image/avif" : "image/webp",
    toString: () => bestDataUrl,
    valueOf: () => bestDataUrl,
  };
}

/**
 * Cloud Storage Ready Abstraction:
 * In this frontend-only phase, this persists the optimized data URL or external URL.
 * To integrate with Google Cloud Storage / S3 / Cloudinary later, swap this single function
 * to upload the File to a backend endpoint and return the permanent CDN URL.
 */
export async function uploadMediaAsset({ file, url, name, entityType = null, entityId = null }) {
  let assetUrl = url || "";
  let size = "—";
  let type = "image/jpeg";
  let dimensions = null;

  if (file) {
    const compressed = await compressImageFile(file);
    assetUrl = compressed.dataUrl;
    size = compressed.compressedSize;
    type = compressed.type;
    dimensions = { width: compressed.width, height: compressed.height };
  } else if (url) {
    assetUrl = url.trim();
    size = "External URL";
    type = "url";
  }

  if (!assetUrl) {
    throw new Error("No image data or URL provided.");
  }

  const id = `med_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const assetName = name?.trim() || file?.name || (url ? url.split("/").pop()?.split("?")[0] : `Image-${id}`);

  let entityName = null;
  if (entityType && entityId) {
    const entity = findEntity(entityType, entityId);
    entityName = entity ? entity.name : entityId;
  }

  const newAsset = {
    id,
    name: assetName,
    url: assetUrl,
    size,
    type,
    dimensions,
    entityType: entityType || null,
    entityId: entityId || null,
    entityName,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    mediaRepo.add(newAsset);
  } catch (err) {
    if (err.name === "QuotaExceededError" || String(err).includes("quota")) {
      throw new Error(
        "Browser storage quota exceeded. Try using an external image URL, or delete unused media from the Media Library."
      );
    }
    throw err;
  }

  // If assigned to an entity, sync the entity record immediately
  if (entityType && entityId) {
    applyImageToEntityRecord(entityType, entityId, assetUrl);
  }

  return newAsset;
}

/**
 * Returns all media assets stored in the media repository.
 */
export function getAllMediaAssets() {
  return mediaRepo.getAll();
}

/**
 * Retrieves a media asset by ID.
 */
export function getMediaById(id) {
  return mediaRepo.getAll().find((m) => m.id === id);
}

/**
 * Updates a media record.
 */
export function updateMediaAsset(id, patch) {
  return mediaRepo.update("id", id, { ...patch, updatedAt: new Date().toISOString() });
}

/**
 * Toggles a media asset's active state.
 * If deactivated, the assigned entity's active image is cleared.
 * If reactivated, the assigned entity's image is restored.
 */
export function toggleMediaActive(id) {
  const asset = getMediaById(id);
  if (!asset) return null;

  const nextActive = !asset.active;
  const updated = mediaRepo.update("id", id, {
    active: nextActive,
    updatedAt: new Date().toISOString(),
  });

  if (asset.entityType && asset.entityId) {
    if (nextActive) {
      applyImageToEntityRecord(asset.entityType, asset.entityId, asset.url);
    } else {
      applyImageToEntityRecord(asset.entityType, asset.entityId, null);
    }
  }

  return updated;
}

/**
 * Assigns an existing or new media item to an entity.
 */
export function assignMediaToEntity(entityType, entityId, mediaIdOrUrl) {
  const entity = findEntity(entityType, entityId);
  if (!entity) {
    throw new Error(`Target entity (${entityType}: ${entityId}) not found.`);
  }

  let finalUrl = "";
  let mediaRecord = mediaRepo.getAll().find((m) => m.id === mediaIdOrUrl || m.url === mediaIdOrUrl);

  if (mediaRecord) {
    finalUrl = mediaRecord.url;
    // Unassign any previous entity from this media or update
    mediaRepo.update("id", mediaRecord.id, {
      entityType,
      entityId,
      entityName: entity.name,
      active: true,
      updatedAt: new Date().toISOString(),
    });
  } else if (typeof mediaIdOrUrl === "string" && mediaIdOrUrl.trim()) {
    finalUrl = mediaIdOrUrl.trim();
    // Create a new media asset for this URL
    mediaRecord = {
      id: `med_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: `${entity.name} Image`,
      url: finalUrl,
      size: "External URL",
      type: "url",
      entityType,
      entityId,
      entityName: entity.name,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mediaRepo.add(mediaRecord);
  }

  // Update entity record
  applyImageToEntityRecord(entityType, entityId, finalUrl);
  return mediaRecord;
}

/**
 * Replaces the current image of an entity with a new media item or URL.
 */
export function replaceEntityMedia(entityType, entityId, newMediaIdOrUrl) {
  // First clear old assignments on media items pointing to this entity
  const existingMedia = mediaRepo.getAll().filter(
    (m) => m.entityType === entityType && m.entityId === entityId
  );
  existingMedia.forEach((m) => {
    mediaRepo.update("id", m.id, {
      entityType: null,
      entityId: null,
      entityName: null,
      updatedAt: new Date().toISOString(),
    });
  });

  return assignMediaToEntity(entityType, entityId, newMediaIdOrUrl);
}

/**
 * Removes or deactivates the image from an entity, reverting it to placeholder.
 */
export function removeMediaFromEntity(entityType, entityId) {
  const existingMedia = mediaRepo.getAll().filter(
    (m) => m.entityType === entityType && m.entityId === entityId
  );
  existingMedia.forEach((m) => {
    mediaRepo.update("id", m.id, {
      entityType: null,
      entityId: null,
      entityName: null,
      updatedAt: new Date().toISOString(),
    });
  });

  applyImageToEntityRecord(entityType, entityId, null);
  return true;
}

/**
 * Deletes a media asset entirely from the library.
 */
export function deleteMediaAsset(id) {
  const asset = getMediaById(id);
  if (!asset) return false;

  if (asset.entityType && asset.entityId) {
    applyImageToEntityRecord(asset.entityType, asset.entityId, null);
  }

  mediaRepo.remove("id", id);
  return true;
}

/**
 * Applies the image URL directly to the underlying entity repo so both
 * Admin views and Public page components show the latest image seamlessly.
 */
function applyImageToEntityRecord(entityType, entityId, imageUrl) {
  switch (entityType) {
    case ENTITY_TYPES.DESTINATION: {
      const current = destinationsRepo.getAll().find((d) => d.slug === entityId);
      const existingImages = current?.images || { hero: null, card: null, thumbnail: null, gallery: [] };
      destinationsRepo.update("slug", entityId, {
        image: imageUrl,
        images: {
          ...existingImages,
          card: imageUrl,
          hero: imageUrl || existingImages.hero,
        },
      });
      break;
    }
    case ENTITY_TYPES.JOURNEY: {
      journeysRepo.update("slug", entityId, { image: imageUrl });
      break;
    }
    case ENTITY_TYPES.CAR_MODEL: {
      carModelsRepo.update("slug", entityId, { image: imageUrl });
      break;
    }
    case ENTITY_TYPES.CAR_UNIT: {
      carUnitsRepo.update("id", entityId, { image: imageUrl });
      break;
    }
    case ENTITY_TYPES.BIKE_MODEL: {
      bikeModelsRepo.update("slug", entityId, { image: imageUrl });
      break;
    }
    case ENTITY_TYPES.BIKE_UNIT: {
      bikeUnitsRepo.update("id", entityId, { image: imageUrl });
      break;
    }
    case ENTITY_TYPES.STAY: {
      staysRepo.update("id", entityId, { image: imageUrl });
      break;
    }
    case ENTITY_TYPES.OFFER: {
      offersRepo.update("id", entityId, { image: imageUrl });
      break;
    }
    default:
      break;
  }
}

/**
 * Helper to find an entity record across all repositories.
 */
export function findEntity(entityType, entityId) {
  const all = getAllAssignableEntities();
  return all.find((e) => e.entityType === entityType && e.id === entityId) || null;
}

/**
 * Gathers all entities across the 8 entity types in a normalized structure:
 * {
 *   entityType: string,
 *   id: string,
 *   name: string,
 *   subtitle: string,
 *   currentImage: string | null,
 *   hasImage: boolean,
 *   active: boolean,
 * }
 */
export function getAllAssignableEntities() {
  const list = [];

  // 1. Destinations
  try {
    destinationsRepo.getAll().forEach((d) => {
      const img = d.images?.card || d.images?.hero || d.image || null;
      list.push({
        entityType: ENTITY_TYPES.DESTINATION,
        id: d.slug,
        name: d.name,
        subtitle: d.tag || "Sikkim",
        currentImage: img,
        hasImage: Boolean(img),
        active: d.active !== false,
      });
    });
  } catch {}

  // 2. Journeys
  try {
    journeysRepo.getAll().forEach((j) => {
      const img = j.image || null;
      list.push({
        entityType: ENTITY_TYPES.JOURNEY,
        id: j.slug,
        name: j.name,
        subtitle: j.permitNote || "Popular Journey",
        currentImage: img,
        hasImage: Boolean(img),
        active: j.active !== false,
      });
    });
  } catch {}

  // 3. Cars (Models)
  try {
    carModelsRepo.getAll().forEach((m) => {
      const img = m.image || null;
      list.push({
        entityType: ENTITY_TYPES.CAR_MODEL,
        id: m.slug,
        name: m.name,
        subtitle: m.category || "Vehicle Model",
        currentImage: img,
        hasImage: Boolean(img),
        active: m.active !== false,
      });
    });
  } catch {}

  // 4. Individual Vehicles (Units)
  try {
    const models = carModelsRepo.getAll();
    carUnitsRepo.getAll().forEach((u) => {
      const parentModel = models.find((m) => m.slug === u.modelSlug);
      const modelName = parentModel ? parentModel.name : u.modelSlug;
      const title = `${modelName} — ${u.vehicleNumber || u.id}`;
      const img = u.image || null;
      list.push({
        entityType: ENTITY_TYPES.CAR_UNIT,
        id: u.id,
        name: title,
        subtitle: `${u.seatingCapacity ? `${u.seatingCapacity} Seats` : "Vehicle"} · ${u.availability}`,
        currentImage: img,
        hasImage: Boolean(img),
        active: u.active !== false,
      });
    });
  } catch {}

  // 5. Bikes (Models)
  try {
    bikeModelsRepo.getAll().forEach((m) => {
      const img = m.image || null;
      list.push({
        entityType: ENTITY_TYPES.BIKE_MODEL,
        id: m.slug,
        name: m.name,
        subtitle: m.category || "Bike Model",
        currentImage: img,
        hasImage: Boolean(img),
        active: m.active !== false,
      });
    });
  } catch {}

  // 6. Individual Bikes (Units)
  try {
    const models = bikeModelsRepo.getAll();
    bikeUnitsRepo.getAll().forEach((u) => {
      const parentModel = models.find((m) => m.slug === u.modelSlug);
      const modelName = parentModel ? parentModel.name : u.modelSlug;
      const title = `${modelName} — ${u.identifier || u.id}`;
      const img = u.image || null;
      list.push({
        entityType: ENTITY_TYPES.BIKE_UNIT,
        id: u.id,
        name: title,
        subtitle: `${u.transmission || "Manual"} · ${u.availability}`,
        currentImage: img,
        hasImage: Boolean(img),
        active: u.active !== false,
      });
    });
  } catch {}

  // 7. Stays
  try {
    staysRepo.getAll().forEach((s) => {
      const img = s.image || null;
      list.push({
        entityType: ENTITY_TYPES.STAY,
        id: s.id,
        name: s.name || `Stay (${s.location})`,
        subtitle: `${s.type || "Stay"} in ${s.location} · ${s.availability}`,
        currentImage: img,
        hasImage: Boolean(img),
        active: s.active !== false,
      });
    });
  } catch {}

  // 8. Offers
  try {
    offersRepo.getAll().forEach((o) => {
      const img = o.image || null;
      list.push({
        entityType: ENTITY_TYPES.OFFER,
        id: o.id,
        name: o.title,
        subtitle: `${o.appliesToService} ${o.appliesToTarget ? `(${o.appliesToTarget})` : "(All)"}`,
        currentImage: img,
        hasImage: Boolean(img),
        active: o.active !== false,
      });
    });
  } catch {}

  return list;
}
