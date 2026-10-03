import { useState, useEffect, useCallback } from "react";
import { getPhotosForProperty } from "../utils/stayPhotoStorage.js";
import { unwrapImageUrl, getDefaultDestinationPhotos } from "../data/destinationImages.js";

/**
 * Universal React hook to fetch and synchronize photos from IndexedDB
 * for Stays, Destinations, Journeys, Bikes, and Cars with transparent fallback.
 *
 * @param {string} entityId - ID or slug of the entity
 * @param {object} [fallbackEntity] - Entity record containing seed image and gallery
 * @param {string} [entityType="Item"] - Name of entity type for alt text
 * @returns {{
 *   photos: Array,
 *   coverImage: string | null,
 *   photoCount: number,
 *   hasLocalPhotos: boolean,
 *   loading: boolean,
 *   reload: () => Promise<void>
 * }}
 */
export function useEntityPhotos(entityId, fallbackEntity = null, entityType = "Item") {
  const [photos, setPhotos] = useState([]);
  const [coverImage, setCoverImage] = useState(null);
  const [hasLocalPhotos, setHasLocalPhotos] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPhotos = useCallback(async () => {
    if (!entityId) {
      setPhotos([]);
      setCoverImage(null);
      setLoading(false);
      return;
    }

    try {
      const localPhotos = await getPhotosForProperty(entityId);

      if (localPhotos && localPhotos.length > 0) {
        // We have local photos from IndexedDB!
        setHasLocalPhotos(true);
        const cover = localPhotos.find((p) => p.isCover) || localPhotos[0];
        const rawCover = cover?.dataUrl;
        const cleanCover =
          typeof rawCover === "object" && rawCover !== null
            ? (rawCover.dataUrl || rawCover.src || "")
            : String(rawCover || "");
        setCoverImage(cleanCover || null);

        // Normalize photos for slideshow/gallery
        const normalized = localPhotos.map((p, idx) => {
          const rawSrc = p.dataUrl || p.src;
          const cleanSrc =
            typeof rawSrc === "object" && rawSrc !== null
              ? (rawSrc.dataUrl || rawSrc.src || "")
              : String(rawSrc || "");
          return {
            id: p.id || `photo_${entityId}_${idx}`,
            src: cleanSrc,
            alt: p.name || `${fallbackEntity?.name || entityType} photo ${idx + 1}`,
            category: p.isCover ? "Cover" : (p.category || "Gallery"),
            isCover: Boolean(p.isCover),
            order: p.order ?? idx,
          };
        });

        setPhotos(normalized);
      } else {
        // Fall back to seed entity data or default destination photos
        setHasLocalPhotos(false);
        const destinationDefaults = (entityType === "Destination" || !fallbackEntity?.type)
          ? getDefaultDestinationPhotos(entityId || fallbackEntity?.slug)
          : { cover: "", gallery: [] };

        const seedCoverRaw =
          fallbackEntity?.image ||
          fallbackEntity?.images?.card ||
          fallbackEntity?.images?.hero ||
          destinationDefaults.cover ||
          null;
        const seedCover = unwrapImageUrl(seedCoverRaw);
        setCoverImage(seedCover || null);

        let seedGallery = (Array.isArray(fallbackEntity?.gallery) && fallbackEntity.gallery.length > 0)
          ? fallbackEntity.gallery
          : (Array.isArray(fallbackEntity?.images?.gallery) && fallbackEntity.images.gallery.length > 0)
          ? fallbackEntity.images.gallery
          : (destinationDefaults.gallery || []);

        const normalized = seedGallery
          .map((p, idx) => {
            if (typeof p === "string") {
              const cleanSrc = unwrapImageUrl(p);
              return cleanSrc ? {
                id: `seed_${idx}`,
                src: cleanSrc,
                alt: `${fallbackEntity?.name || entityType} photo ${idx + 1}`,
                category: idx === 0 && !seedCover ? "Cover" : "Gallery",
                isCover: idx === 0 && !seedCover,
                order: idx,
              } : null;
            }
            const cleanSrc = unwrapImageUrl(p?.src || p?.dataUrl || p?.url);
            return cleanSrc ? {
              id: p?.id || `seed_${idx}`,
              src: cleanSrc,
              alt: p?.alt || p?.name || `${fallbackEntity?.name || entityType} photo ${idx + 1}`,
              category: p?.category || (idx === 0 && !seedCover ? "Cover" : "Gallery"),
              isCover: p?.category === "Cover" || (idx === 0 && !seedCover),
              order: idx,
            } : null;
          })
          .filter(Boolean);

        if (normalized.length === 0 && seedCover) {
          normalized.push({
            id: `seed_cover`,
            src: seedCover,
            alt: `${fallbackEntity?.name || entityType} Cover`,
            category: "Cover",
            isCover: true,
            order: 0,
          });
        }

        setPhotos(normalized);
      }
    } catch (err) {
      console.warn(`Failed to load ${entityType} photos:`, err);
    } finally {
      setLoading(false);
    }
  }, [entityId, fallbackEntity, entityType]);

  useEffect(() => {
    loadPhotos();

    function handleUpdate(e) {
      const changedId = e.detail?.entityId || e.detail?.propertyId;
      if (!changedId || changedId === entityId) {
        loadPhotos();
      }
    }

    window.addEventListener("homestay-photos-changed", handleUpdate);
    window.addEventListener("photos-changed", handleUpdate);
    return () => {
      window.removeEventListener("homestay-photos-changed", handleUpdate);
      window.removeEventListener("photos-changed", handleUpdate);
    };
  }, [entityId, loadPhotos]);

  // Calculate unique photo count
  const allSrcs = [
    ...(coverImage ? [coverImage] : []),
    ...photos.map((p) => p.src).filter(Boolean),
  ];
  const photoCount = new Set(allSrcs).size;

  return {
    photos,
    coverImage,
    photoCount,
    hasLocalPhotos,
    loading,
    reload: loadPhotos,
  };
}

// Backward compatible alias
export const useStayPhotos = (propertyId, fallbackStay) =>
  useEntityPhotos(propertyId, fallbackStay, "Homestay");
