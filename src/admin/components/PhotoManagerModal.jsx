import React, { useState, useEffect, useRef } from "react";
import {
  X,
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
  ImageSquare,
} from "phosphor-react";
import {
  getPhotosForProperty,
  savePhotosForProperty,
} from "../../utils/stayPhotoStorage.js";
import { compressImageFile } from "../../utils/mediaService.js";
import { getDefaultDestinationPhotos } from "../../data/destinationImages.js";
import { api } from "../../utils/api.js";
import "./StayPhotoManager.css";

export default function PhotoManagerModal({
  entity,
  entityType = "Stay",
  idKey = "id",
  repo = null,
  backendMode = false,
  onSave = null,
  onClose,
  onSaveSuccess,
}) {
  if (!entity) return null;

  const entityId = entity[idKey] || entity.id || entity.slug;
  const displayName = entity.name || entity.title || `${entity.type || entityType} — ${entity.location || entity.slug || "Item"}`;

  // Two distinct photo collections: 1 Cover Photo + Multiple Gallery Photos
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [galleryPhotos, setGalleryPhotos] = useState([]);

  // Backup for discard
  const [initialCover, setInitialCover] = useState(null);
  const [initialGallery, setInitialGallery] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // UI status
  const [loading, setLoading] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Load photos from MongoDB / Cloudinary in backendMode or fallback to IndexedDB
  useEffect(() => {
    let isMounted = true;

    async function fetchPhotos() {
      setLoading(true);
      try {
        if (backendMode) {
          // Direct from MongoDB entity (Property or Room)
          const rawCover = entity.image || null;
          const coverUrl =
            typeof rawCover === "object" && rawCover !== null
              ? (rawCover.dataUrl || rawCover.src || rawCover.url || "")
              : rawCover;

          let seedCover = null;
          if (coverUrl) {
            seedCover = {
              id: `cover_${entityId}`,
              propertyId: entityId,
              dataUrl: coverUrl,
              name: `${displayName} Cover Photo`,
              isCover: true,
              order: 0,
              category: "Cover",
            };
          }

          const gallerySource = Array.isArray(entity.gallery) ? entity.gallery : [];
          const seedGallery = [];
          gallerySource.forEach((g, idx) => {
            const rawSrc = typeof g === "string" ? g : (g?.src || g?.dataUrl || g?.url);
            if (!rawSrc) return;
            seedGallery.push({
              id: (typeof g === "object" && (g._id || g.id)) || `gal_${entityId}_${idx}`,
              propertyId: entityId,
              dataUrl: rawSrc,
              publicId: typeof g === "object" ? g.publicId : undefined,
              name: (typeof g === "object" && g.alt) || `${displayName} Photo ${idx + 1}`,
              isCover: false,
              order: seedGallery.length,
              category: (typeof g === "object" && g.category) || (entityType === "Room" ? "Room" : "Gallery"),
            });
          });

          if (!isMounted) return;
          setCoverPhoto(seedCover);
          setGalleryPhotos(seedGallery);
          setInitialCover(seedCover);
          setInitialGallery(seedGallery);
          return;
        }

        const localList = await getPhotosForProperty(entityId);

        if (!isMounted) return;

        if (localList && localList.length > 0) {
          const cover = localList.find((p) => p.isCover) || localList[0];
          const gallery = localList.filter((p) => p.id !== cover?.id);

          const formattedCover = cover ? { ...cover, isCover: true, category: "Cover" } : null;
          const formattedGallery = gallery.map((p, idx) => ({ ...p, isCover: false, order: idx }));

          setCoverPhoto(formattedCover);
          setGalleryPhotos(formattedGallery);
          setInitialCover(formattedCover);
          setInitialGallery(formattedGallery);
        } else {
          // Fall back to seed entity photos or bundled destination defaults
          const destDefaults = entityType === "Destination" ? getDefaultDestinationPhotos(entity.slug || entityId) : null;
          const seedCoverUrl =
            entity.image ||
            entity.images?.card ||
            entity.images?.hero ||
            destDefaults?.cover ||
            null;
          let seedCover = null;
          if (seedCoverUrl) {
            seedCover = {
              id: `seed_cover_${entityId}`,
              propertyId: entityId,
              dataUrl: seedCoverUrl,
              name: `${displayName} Cover Photo`,
              isCover: true,
              order: 0,
              category: "Cover",
            };
          }

          const gallerySource = (Array.isArray(entity.gallery) && entity.gallery.length > 0)
            ? entity.gallery
            : (Array.isArray(entity.images?.gallery) && entity.images.gallery.length > 0)
            ? entity.images.gallery
            : (destDefaults?.gallery || []);

          const seedGallery = [];
          gallerySource.forEach((g, idx) => {
            const src = typeof g === "string" ? g : g?.src;
            if (!src || src === seedCoverUrl) return;
            seedGallery.push({
              id: `seed_gal_${entityId}_${idx}`,
              propertyId: entityId,
              dataUrl: src,
              name: (typeof g === "object" && g.alt) || `${displayName} Photo ${idx + 1}`,
              isCover: false,
              order: seedGallery.length,
              category: (typeof g === "object" && g.category) || "Gallery",
            });
          });

          setCoverPhoto(seedCover);
          setGalleryPhotos(seedGallery);
          setInitialCover(seedCover);
          setInitialGallery(seedGallery);
        }
      } catch (err) {
        console.error("Error loading photos:", err);
        setErrorMessage("Could not load stored photos.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPhotos();

    return () => {
      isMounted = false;
    };
  }, [entityId, displayName, entity.image, entity.gallery, entity.images, backendMode]);

  function markChanged() {
    setHasChanges(true);
    setSaveSuccess(false);
  }

  // -------------------------------------------------------------
  // OPTION 1: COVER PHOTO HANDLERS
  // -------------------------------------------------------------
  async function handleCoverFileSelected(event) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    setUploadingCover(true);
    setErrorMessage(null);

    try {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

      if (backendMode) {
        const uploadRes = await api.upload.image(
          file,
          entityType === "Room" ? "lama-bhaila/rooms" : "lama-bhaila/properties",
          {
            propertyId: entityType === "Stay" ? entityId : undefined,
            roomId: entityType === "Room" ? entityId : undefined,
          }
        );

        if (!uploadRes || !uploadRes.data?.url) {
          throw new Error(uploadRes?.error || "Failed to upload image to backend CDN.");
        }

        const newCover = {
          id: uploadRes.data.publicId || `photo_cover_${entityId}_${Date.now()}`,
          propertyId: entityId,
          dataUrl: uploadRes.data.url,
          publicId: uploadRes.data.publicId,
          name: cleanName,
          isCover: true,
          order: 0,
          category: "Cover",
          createdAt: new Date().toISOString(),
        };

        setCoverPhoto(newCover);
        markChanged();
        return;
      }

      const compressed = await compressImageFile(file, {
        maxWidth: 1600,
        maxHeight: 1200,
        quality: 0.85,
      });
      const dataUrl = typeof compressed === "object" && compressed?.dataUrl ? compressed.dataUrl : String(compressed || "");

      const newCover = {
        id: `photo_cover_${entityId}_${Date.now()}`,
        propertyId: entityId,
        dataUrl,
        name: cleanName,
        isCover: true,
        order: 0,
        category: "Cover",
        createdAt: new Date().toISOString(),
      };

      setCoverPhoto(newCover);
      markChanged();
    } catch (err) {
      console.error("Error compressing cover photo:", err);
      if (err.status === 413) {
        setErrorMessage("File too large. Maximum file size allowed is 5MB.");
      } else if (err.status === 403) {
        setErrorMessage("Access denied: You do not have permission to upload photos for this listing.");
      } else if (err.status === 400) {
        setErrorMessage(err.message || "Invalid image format. Supported formats: JPG, PNG, WEBP, AVIF.");
      } else {
        setErrorMessage(err.message || "Failed to process cover photo. Please try another image.");
      }
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  function handleDeleteCover() {
    setCoverPhoto(null);
    markChanged();
  }

  // -------------------------------------------------------------
  // OPTION 2: GALLERY PHOTOS HANDLERS (MULTIPLE)
  // -------------------------------------------------------------
  async function handleGalleryFilesSelected(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploadingGallery(true);
    setErrorMessage(null);

    try {
      if (backendMode) {
        const uploadRes = await api.upload.gallery(
          files,
          entityType === "Room" ? "Room" : "Gallery",
          {
            propertyId: entityType === "Stay" ? entityId : undefined,
            roomId: entityType === "Room" ? entityId : undefined,
          }
        );

        if (!uploadRes || !Array.isArray(uploadRes.data)) {
          throw new Error(uploadRes?.error || "Failed to upload gallery photos to backend CDN.");
        }

        const processedList = uploadRes.data.map((item, idx) => ({
          id: item.publicId || item.id || `photo_gal_${entityId}_${Date.now()}_${idx}`,
          propertyId: entityId,
          dataUrl: item.src,
          publicId: item.publicId,
          name: item.alt || `Photo ${galleryPhotos.length + idx + 1}`,
          isCover: false,
          order: galleryPhotos.length + idx,
          category: item.category || (entityType === "Room" ? "Room" : "Gallery"),
          createdAt: new Date().toISOString(),
        }));

        let remainingGallery = [...processedList];
        if (!coverPhoto && remainingGallery.length > 0) {
          const autoCover = {
            ...remainingGallery[0],
            isCover: true,
            category: "Cover",
          };
          setCoverPhoto(autoCover);
          remainingGallery = remainingGallery.slice(1);
        }

        setGalleryPhotos((prev) => {
          const combined = [...prev, ...remainingGallery];
          return combined.map((p, idx) => ({ ...p, order: idx }));
        });

        markChanged();
        return;
      }

      const processedList = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        const compressed = await compressImageFile(file, {
          maxWidth: 1600,
          maxHeight: 1200,
          quality: 0.82,
        });
        const dataUrl = typeof compressed === "object" && compressed?.dataUrl ? compressed.dataUrl : String(compressed || "");

        const newId = `photo_gal_${entityId}_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

        processedList.push({
          id: newId,
          propertyId: entityId,
          dataUrl,
          name: cleanName,
          isCover: false,
          order: galleryPhotos.length + processedList.length,
          category: "Gallery",
          createdAt: new Date().toISOString(),
        });
      }

      if (processedList.length === 0) {
        setErrorMessage("No valid image files selected.");
        return;
      }

      // If user has NO cover photo yet, make the very first uploaded file the cover photo!
      let remainingGallery = [...processedList];
      if (!coverPhoto && remainingGallery.length > 0) {
        const autoCover = {
          ...remainingGallery[0],
          isCover: true,
          category: "Cover",
        };
        setCoverPhoto(autoCover);
        remainingGallery = remainingGallery.slice(1);
      }

      setGalleryPhotos((prev) => {
        const combined = [...prev, ...remainingGallery];
        return combined.map((p, idx) => ({ ...p, order: idx }));
      });

      markChanged();
    } catch (err) {
      console.error("Error processing gallery photos:", err);
      if (err.status === 413) {
        setErrorMessage("One or more files exceed the 5MB size limit.");
      } else if (err.status === 403) {
        setErrorMessage("Access denied: You do not have permission to upload photos for this listing.");
      } else if (err.status === 400) {
        setErrorMessage(err.message || "Invalid image format. Supported formats: JPG, PNG, WEBP, AVIF.");
      } else {
        setErrorMessage(err.message || "Failed to process one or more images.");
      }
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  // Promote a gallery photo to be the designated Cover Photo
  function handlePromoteToCover(photoId) {
    const selected = galleryPhotos.find((p) => p.id === photoId);
    if (!selected) return;

    // Swap: previous cover moves into gallery, selected becomes cover
    const newCover = { ...selected, isCover: true, category: "Cover", order: 0 };
    const updatedGallery = galleryPhotos.filter((p) => p.id !== photoId);

    if (coverPhoto) {
      updatedGallery.unshift({
        ...coverPhoto,
        isCover: false,
        category: "Gallery",
      });
    }

    setCoverPhoto(newCover);
    setGalleryPhotos(updatedGallery.map((p, idx) => ({ ...p, order: idx })));
    markChanged();
  }

  // Move gallery photo left/earlier in slideshow
  function handleMoveGalleryLeft(index) {
    if (index <= 0) return;
    setGalleryPhotos((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next.map((p, idx) => ({ ...p, order: idx }));
    });
    markChanged();
  }

  // Move gallery photo right/later in slideshow
  function handleMoveGalleryRight(index) {
    if (index >= galleryPhotos.length - 1) return;
    setGalleryPhotos((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next.map((p, idx) => ({ ...p, order: idx }));
    });
    markChanged();
  }

  // Replace a gallery photo in-place
  async function handleReplaceGalleryPhoto(index, file) {
    if (!file || !file.type.startsWith("image/")) return;

    try {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

      if (backendMode) {
        const uploadRes = await api.upload.image(
          file,
          entityType === "Room" ? "lama-bhaila/rooms" : "lama-bhaila/properties",
          {
            propertyId: entityType === "Stay" ? entityId : undefined,
            roomId: entityType === "Room" ? entityId : undefined,
          }
        );
        if (!uploadRes || !uploadRes.data?.url) {
          throw new Error(uploadRes?.error || "Failed to upload replacement photo.");
        }

        setGalleryPhotos((prev) => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            dataUrl: uploadRes.data.url,
            publicId: uploadRes.data.publicId,
            name: cleanName,
          };
          return next;
        });
        markChanged();
        return;
      }

      const compressed = await compressImageFile(file, {
        maxWidth: 1600,
        maxHeight: 1200,
        quality: 0.82,
      });
      const dataUrl = typeof compressed === "object" && compressed?.dataUrl ? compressed.dataUrl : String(compressed || "");

      setGalleryPhotos((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          dataUrl,
          name: cleanName,
        };
        return next;
      });
      markChanged();
    } catch (err) {
      console.error("Failed to replace photo:", err);
      if (err.status === 413) {
        setErrorMessage("File exceeds 5MB size limit.");
      } else {
        setErrorMessage(err.message || "Failed to replace photo.");
      }
    }
  }

  // Delete a gallery photo
  function handleDeleteGalleryPhoto(index) {
    setGalleryPhotos((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((p, idx) => ({ ...p, order: idx }));
    });
    markChanged();
  }

  // Update caption/title
  function handleUpdateGalleryCaption(index, name) {
    setGalleryPhotos((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name };
      return next;
    });
    markChanged();
  }

  function handleUpdateCoverCaption(name) {
    setCoverPhoto((prev) => (prev ? { ...prev, name } : null));
    markChanged();
  }

  // -------------------------------------------------------------
  // SAVE / PERSIST ALL CHANGES
  // -------------------------------------------------------------
  async function handleSave() {
    setSaving(true);
    setErrorMessage(null);

    function unwrapUrl(val) {
      if (!val) return "";
      if (typeof val === "string") return val;
      if (typeof val === "object") {
        if (typeof val.dataUrl === "string") return val.dataUrl;
        if (typeof val.dataUrl === "object" && val.dataUrl) return unwrapUrl(val.dataUrl);
        if (typeof val.src === "string") return val.src;
        if (typeof val.src === "object" && val.src) return unwrapUrl(val.src);
        if (typeof val.url === "string") return val.url;
      }
      return String(val || "");
    }

    try {
      if (backendMode) {
        const coverUrl = coverPhoto
          ? unwrapUrl(coverPhoto.dataUrl)
          : (galleryPhotos[0] ? unwrapUrl(galleryPhotos[0].dataUrl) : "");

        const galleryItems = galleryPhotos.map((p, idx) => ({
          src: unwrapUrl(p.dataUrl || p.src),
          alt: p.name || `${displayName} Photo ${idx + 1}`,
          category: p.category || (entityType === "Room" ? "Room" : "Property"),
        }));

        if (onSave) {
          await onSave({ image: coverUrl, gallery: galleryItems });
        } else if (entityType === "Stay") {
          await api.owner.updateProperty(entityId, {
            image: coverUrl,
            gallery: galleryItems,
          });
        } else if (entityType === "Room") {
          await api.owner.updateRoom(entityId, {
            image: coverUrl,
            gallery: galleryItems,
          });
        }

        setInitialCover(coverPhoto ? { ...coverPhoto } : null);
        setInitialGallery([...galleryPhotos]);
        setHasChanges(false);
        setSaveSuccess(true);

        if (onSaveSuccess) onSaveSuccess();
        return;
      }

      const allToSave = [];
      if (coverPhoto) {
        allToSave.push({
          ...coverPhoto,
          dataUrl: unwrapUrl(coverPhoto.dataUrl),
          isCover: true,
          category: "Cover",
          order: 0,
        });
      }

      galleryPhotos.forEach((p) => {
        allToSave.push({
          ...p,
          dataUrl: unwrapUrl(p.dataUrl || p.src),
          isCover: false,
          category: "Gallery",
          order: allToSave.length,
        });
      });

      await savePhotosForProperty(entityId, allToSave);

      // Sync to local repository if provided
      if (repo && entity) {
        const actualIdKey = idKey || (entity.slug ? "slug" : "id");
        const coverUrl = coverPhoto ? unwrapUrl(coverPhoto.dataUrl) || null : null;
        const galleryItems = galleryPhotos.map((p, idx) => ({
          id: p.id || `gal_${idx}`,
          src: unwrapUrl(p.dataUrl || p.src),
          alt: p.name || displayName,
          category: "Gallery",
        }));

        if (entityType === "Destination") {
          repo.update(actualIdKey, entityId, {
            image: coverUrl,
            gallery: galleryItems,
            images: {
              ...(entity.images || {}),
              card: coverUrl,
              hero: coverUrl,
              thumbnail: coverUrl,
              gallery: galleryItems,
            },
          });
        } else {
          repo.update(actualIdKey, entityId, {
            image: coverUrl,
            gallery: galleryItems,
          });
        }
      }

      setInitialCover(coverPhoto ? { ...coverPhoto } : null);
      setInitialGallery([...galleryPhotos]);
      setHasChanges(false);
      setSaveSuccess(true);

      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error("Save photos error:", err);
      if (err.status === 403) {
        setErrorMessage("Access denied: You do not have permission to modify photos for this listing.");
      } else if (err.status === 404) {
        setErrorMessage("Listing not found on server.");
      } else if (err.status === 400) {
        setErrorMessage(err.message || "Invalid photo data. Please review your photos.");
      } else {
        setErrorMessage(err.message || "Failed to save photos to server.");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setCoverPhoto(initialCover ? { ...initialCover } : null);
    setGalleryPhotos([...initialGallery]);
    setHasChanges(false);
    setErrorMessage(null);
  }

  const totalPhotosCount = (coverPhoto ? 1 : 0) + galleryPhotos.length;

  return (
    <div
      className="photo-manager-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-manager-title"
    >
      <div className="photo-manager" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Bar */}
        <div className="photo-manager__header">
          <div className="photo-manager__header-info">
            <span className="photo-manager__badge">
              <Camera size={14} weight="bold" /> {entityType} Photo Manager
            </span>
            <h2 id="photo-manager-title" className="photo-manager__title">
              {displayName}
            </h2>
            <p className="photo-manager__sub">
              Manage your cover photo and gallery slideshow. Changes immediately reflect on cards and details pages.
            </p>
          </div>
          <button
            type="button"
            className="photo-manager__close-btn"
            onClick={onClose}
            aria-label="Close photo manager"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Local Storage Disclaimer Banner */}
        <div className="photo-manager__notice">
          <Info size={16} weight="bold" />
          <p>
            {backendMode ? (
              <>
                <strong>Cloud Storage &amp; Database Connected:</strong> Photos are uploaded to Cloudinary CDN and synchronized with your MongoDB listing.
              </>
            ) : (
              <>
                <strong>Local Browser Storage:</strong> Photos are saved in your browser's IndexedDB. When backend cloud storage is connected, these will sync across devices.
              </>
            )}
          </p>
        </div>

        {/* Unsaved changes banner */}
        {hasChanges && (
          <div className="photo-manager__changes-banner">
            <span>You have unsaved photo changes.</span>
            <div className="photo-manager__changes-actions">
              <button
                type="button"
                className="photo-manager__btn-discard"
                onClick={handleDiscard}
                disabled={saving}
              >
                Discard
              </button>
              <button
                type="button"
                className="photo-manager__btn-save-sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Now"}
              </button>
            </div>
          </div>
        )}

        {/* Success toast */}
        {saveSuccess && (
          <div className="photo-manager__success-banner">
            <CheckCircle size={18} weight="fill" />
            <span>Photos saved successfully! Live on website cards, hero banners, and gallery slideshows.</span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="photo-manager__error-banner">
            <WarningCircle size={18} weight="fill" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Status bar */}
        <div className="photo-manager__status-bar">
          <div className="photo-manager__counts">
            <span className="status-badge status-badge--total">
              <strong>{totalPhotosCount}</strong> {totalPhotosCount === 1 ? "photo" : "photos"} total
            </span>
            <span className={`status-badge ${coverPhoto ? "status-badge--success" : "status-badge--warning"}`}>
              <Star size={13} weight="fill" /> {coverPhoto ? "Cover Photo Set" : "No Cover Photo"}
            </span>
            <span className="status-badge status-badge--info">
              <ImageSquare size={13} weight="bold" /> {galleryPhotos.length} {galleryPhotos.length === 1 ? "gallery photo" : "gallery photos"}
            </span>
          </div>

          <button
            type="button"
            className="photo-manager__btn-primary-action"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            <CheckCircle size={16} weight="bold" />
            {saving ? "Saving Changes..." : hasChanges ? "Save All Photos" : "All Photos Saved"}
          </button>
        </div>

        {/* Main Body with TWO CLEAR OPTIONS */}
        <div className="photo-manager__body">
          {loading ? (
            <div className="photo-manager__loading">
              <div className="photo-manager__spinner" />
              <p>Loading photos...</p>
            </div>
          ) : (
            <div className="photo-sections-container">
              {/* ============================================================== */}
              {/* OPTION 1: COVER PHOTO SECTION */}
              {/* ============================================================== */}
              <section className="photo-option-section photo-option-section--cover">
                <div className="photo-option-section__header">
                  <div className="photo-option-section__title-wrap">
                    <span className="photo-option-badge photo-option-badge--cover">Option 1</span>
                    <h3 className="photo-option-title">
                      <Star size={18} weight="fill" className="icon-star-gold" />
                      Main Cover Photo
                    </h3>
                  </div>
                  <p className="photo-option-desc">
                    The single primary image displayed on website cards, listings, and the detail page hero banner.
                  </p>
                </div>

                {coverPhoto ? (
                  <div className="cover-card">
                    <div className="cover-card__preview">
                      <img src={coverPhoto.dataUrl} alt={coverPhoto.name || "Cover"} />
                      <span className="cover-card__pill">
                        <Star size={12} weight="fill" /> Active Cover Photo
                      </span>
                    </div>

                    <div className="cover-card__details">
                      <label className="cover-card__caption-label">Cover Caption / Alt Text</label>
                      <input
                        type="text"
                        className="photo-card__name-input"
                        value={coverPhoto.name || ""}
                        placeholder="Cover caption..."
                        onChange={(e) => handleUpdateCoverCaption(e.target.value)}
                      />

                      <div className="cover-card__actions">
                        <label className={`option-btn option-btn--replace ${uploadingCover ? "option-btn--disabled" : ""}`}>
                          <input
                            type="file"
                            ref={coverInputRef}
                            accept="image/*"
                            onChange={handleCoverFileSelected}
                            disabled={uploadingCover || saving}
                            style={{ display: "none" }}
                          />
                          <ArrowClockwise size={15} weight="bold" />
                          <span>{uploadingCover ? "Uploading..." : "Change / Replace Cover"}</span>
                        </label>

                        <button
                          type="button"
                          className="option-btn option-btn--delete"
                          onClick={handleDeleteCover}
                          disabled={saving}
                        >
                          <Trash size={15} weight="bold" />
                          <span>Remove Cover</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="cover-dropzone-empty">
                    <div className="cover-dropzone-empty__icon">
                      <Star size={36} weight="duotone" />
                    </div>
                    <h4>No Cover Photo Set Yet</h4>
                    <p>Upload a cover photo for <strong>{displayName}</strong> to display on website cards and headers.</p>
                    <label className={`option-btn option-btn--primary ${uploadingCover ? "option-btn--disabled" : ""}`}>
                      <input
                        type="file"
                        ref={coverInputRef}
                        accept="image/*"
                        onChange={handleCoverFileSelected}
                        disabled={uploadingCover || saving}
                        style={{ display: "none" }}
                      />
                      <UploadSimple size={16} weight="bold" />
                      <span>{uploadingCover ? "Compressing & Setting..." : "Upload Cover Photo"}</span>
                    </label>
                  </div>
                )}
              </section>

              {/* ============================================================== */}
              {/* OPTION 2: GALLERY PHOTOS SECTION (MULTIPLE) */}
              {/* ============================================================== */}
              <section className="photo-option-section photo-option-section--gallery">
                <div className="photo-option-section__header photo-option-section__header--split">
                  <div>
                    <div className="photo-option-section__title-wrap">
                      <span className="photo-option-badge photo-option-badge--gallery">Option 2</span>
                      <h3 className="photo-option-title">
                        <ImageSquare size={18} weight="bold" />
                        Gallery Photos (Can be more than 1)
                      </h3>
                    </div>
                    <p className="photo-option-desc">
                      Upload multiple photos for the dynamic automatic slideshow and full photo gallery when visitors click on this item.
                    </p>
                  </div>

                  <label className={`option-btn option-btn--accent ${uploadingGallery ? "option-btn--disabled" : ""}`}>
                    <input
                      type="file"
                      ref={galleryInputRef}
                      multiple
                      accept="image/*"
                      onChange={handleGalleryFilesSelected}
                      disabled={uploadingGallery || saving}
                      style={{ display: "none" }}
                    />
                    <UploadSimple size={16} weight="bold" />
                    <span>{uploadingGallery ? "Processing Photos..." : "+ Add Gallery Photos (Multiple)"}</span>
                  </label>
                </div>

                {galleryPhotos.length > 0 ? (
                  <div className="gallery-grid">
                    {galleryPhotos.map((photo, idx) => (
                      <div className="gallery-card" key={photo.id || idx}>
                        <div className="gallery-card__media">
                          <img src={photo.dataUrl} alt={photo.name || `Gallery photo ${idx + 1}`} />
                          <span className="gallery-card__order">#{idx + 1}</span>

                          <button
                            type="button"
                            className="gallery-card__make-cover-btn"
                            onClick={() => handlePromoteToCover(photo.id)}
                            title="Set this photo as the main Cover Photo in Option 1"
                          >
                            <Star size={13} weight="fill" /> Set as Cover
                          </button>
                        </div>

                        <div className="gallery-card__body">
                          <input
                            type="text"
                            className="photo-card__name-input"
                            value={photo.name || ""}
                            placeholder="Photo caption..."
                            onChange={(e) => handleUpdateGalleryCaption(idx, e.target.value)}
                          />

                          <div className="gallery-card__controls">
                            <button
                              type="button"
                              className="gallery-card__ctrl-btn"
                              disabled={idx === 0}
                              onClick={() => handleMoveGalleryLeft(idx)}
                              title="Move earlier in slideshow"
                              aria-label="Move left"
                            >
                              <ArrowLeft size={13} weight="bold" />
                            </button>

                            <button
                              type="button"
                              className="gallery-card__ctrl-btn"
                              disabled={idx === galleryPhotos.length - 1}
                              onClick={() => handleMoveGalleryRight(idx)}
                              title="Move later in slideshow"
                              aria-label="Move right"
                            >
                              <ArrowRight size={13} weight="bold" />
                            </button>

                            <label className="gallery-card__ctrl-btn gallery-card__ctrl-btn--replace" title="Replace this photo">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleReplaceGalleryPhoto(idx, e.target.files?.[0])}
                                style={{ display: "none" }}
                              />
                              <ArrowClockwise size={13} weight="bold" />
                            </label>

                            <button
                              type="button"
                              className="gallery-card__ctrl-btn gallery-card__ctrl-btn--delete"
                              onClick={() => handleDeleteGalleryPhoto(idx)}
                              title="Delete photo"
                              aria-label="Delete photo"
                            >
                              <Trash size={13} weight="bold" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="gallery-dropzone-empty">
                    <div className="gallery-dropzone-empty__icon">
                      <ImageSquare size={36} weight="duotone" />
                    </div>
                    <h4>No Gallery Photos Added Yet</h4>
                    <p>
                      Add multiple photos for <strong>{displayName}</strong>. Visitors can view these in the automatic sliding gallery!
                    </p>
                    <label className={`option-btn option-btn--accent ${uploadingGallery ? "option-btn--disabled" : ""}`}>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleGalleryFilesSelected}
                        disabled={uploadingGallery || saving}
                        style={{ display: "none" }}
                      />
                      <UploadSimple size={16} weight="bold" />
                      <span>+ Select Multiple Photos from Device</span>
                    </label>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="photo-manager__footer">
          <p className="photo-manager__footer-tip">
            Tip: <strong>Option 1</strong> sets the card cover photo. <strong>Option 2</strong> supplies the automatic slideshow gallery.
          </p>
          <div className="photo-manager__footer-actions">
            <button type="button" className="photo-manager__btn-secondary" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="photo-manager__btn-save"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
