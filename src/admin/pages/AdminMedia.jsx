import React, { useState, useEffect, useRef } from "react";
import {
  UploadSimple,
  Image as ImageIcon,
  Trash,
  Eye,
  LinkSimple,
  ArrowsClockwise,
  CheckCircle,
  X,
  XCircle,
  Plus,
  MagnifyingGlass,
  Car,
  Bicycle,
  Bed,
  Tag,
  Compass,
  MapPinLine,
  WarningCircle,
  FolderOpen,
} from "phosphor-react";
import {
  getAllAssignableEntities,
  getAllMediaAssets,
  uploadMediaAsset,
  assignMediaToEntity,
  replaceEntityMedia,
  removeMediaFromEntity,
  toggleMediaActive,
  deleteMediaAsset,
  compressImageFile,
  ENTITY_TYPES,
  ENTITY_TYPE_LIST,
} from "../../utils/mediaService.js";
import Dropdown from "../../components/Dropdown.jsx";

export default function AdminMedia() {
  const [activeTab, setActiveTab] = useState("entities"); // "entities" | "library"
  const [entities, setEntities] = useState([]);
  const [mediaList, setMediaList] = useState([]);

  // Filters
  const [selectedType, setSelectedType] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "has_image" | "missing_image"
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [modalMode, setModalMode] = useState(null); // null | "upload" | "assign" | "preview"
  const [targetEntity, setTargetEntity] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);

  // Notifications
  const [feedback, setFeedback] = useState(null);

  function refreshData() {
    setEntities(getAllAssignableEntities());
    setMediaList(getAllMediaAssets());
  }

  useEffect(() => {
    refreshData();
  }, []);

  function showMessage(type, text) {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  }

  // Quick stats
  const totalEntities = entities.length;
  const withImageCount = entities.filter((e) => e.hasImage).length;
  const missingImageCount = totalEntities - withImageCount;
  const totalMediaAssets = mediaList.length;

  // Filtered entities
  const filteredEntities = entities.filter((e) => {
    if (selectedType && e.entityType !== selectedType) return false;
    if (statusFilter === "has_image" && !e.hasImage) return false;
    if (statusFilter === "missing_image" && e.hasImage) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = e.name.toLowerCase().includes(q);
      const matchSub = (e.subtitle || "").toLowerCase().includes(q);
      const matchType = e.entityType.toLowerCase().includes(q);
      if (!matchName && !matchSub && !matchType) return false;
    }
    return true;
  });

  // Action handlers
  function handleOpenAssign(entity) {
    setTargetEntity(entity);
    setModalMode("assign");
  }

  function handleOpenUpload() {
    setTargetEntity(null);
    setModalMode("upload");
  }

  function handleRemoveEntityImage(entity) {
    if (!window.confirm(`Remove image from "${entity.name}"? It will revert to the standard placeholder.`)) {
      return;
    }
    removeMediaFromEntity(entity.entityType, entity.id);
    refreshData();
    showMessage("success", `Image removed from ${entity.name}.`);
  }

  function handleToggleActive(mediaId) {
    const updated = toggleMediaActive(mediaId);
    refreshData();
    if (updated) {
      showMessage("info", `Image ${updated.active ? "activated" : "deactivated"}.`);
    }
  }

  function handleDeleteMedia(mediaId) {
    const item = mediaList.find((m) => m.id === mediaId);
    const confirmMsg = item?.entityName
      ? `Delete "${item.name}"? It is currently assigned to ${item.entityName} and will be unassigned.`
      : `Delete "${item?.name || "this media item"}" from the library?`;

    if (!window.confirm(confirmMsg)) return;

    deleteMediaAsset(mediaId);
    refreshData();
    showMessage("success", "Media asset deleted.");
  }

  function getEntityIcon(type) {
    switch (type) {
      case ENTITY_TYPES.DESTINATION:
        return <MapPinLine size={16} />;
      case ENTITY_TYPES.JOURNEY:
        return <Compass size={16} />;
      case ENTITY_TYPES.CAR_MODEL:
      case ENTITY_TYPES.CAR_UNIT:
        return <Car size={16} />;
      case ENTITY_TYPES.BIKE_MODEL:
      case ENTITY_TYPES.BIKE_UNIT:
        return <Bicycle size={16} />;
      case ENTITY_TYPES.STAY:
        return <Bed size={16} />;
      case ENTITY_TYPES.OFFER:
        return <Tag size={16} />;
      default:
        return <ImageIcon size={16} />;
    }
  }

  return (
    <div className="admin-media-page">
      <div className="admin-media-header">
        <div>
          <h1 className="admin-page-title">Media Management</h1>
          <p className="admin-page-note">
            Manage, upload, preview, and assign photos across all 8 Sikkim travel offerings: Destinations, Journeys,
            Cars, Individual Vehicles, Bikes, Individual Bikes, Stays, and Offers.
          </p>
        </div>
        <div className="admin-media-header-actions">
          <button type="button" className="admin-btn-primary" onClick={handleOpenUpload}>
            <UploadSimple size={18} weight="bold" /> Upload / Add Media
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`admin-media-alert admin-media-alert--${feedback.type}`}>
          {feedback.type === "success" ? <CheckCircle size={18} weight="fill" /> : <WarningCircle size={18} weight="fill" />}
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="admin-stat-grid admin-media-stats">
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total Offerings</span>
          <span className="admin-stat-value">{totalEntities}</span>
          <span className="admin-stat-desc">Across all 8 entity categories</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">With Images</span>
          <span className="admin-stat-value" style={{ color: "var(--color-forest)" }}>{withImageCount}</span>
          <span className="admin-stat-desc">{Math.round((withImageCount / (totalEntities || 1)) * 100)}% coverage</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Missing Images</span>
          <span className="admin-stat-value" style={{ color: missingImageCount > 0 ? "var(--color-peach-deep)" : "inherit" }}>
            {missingImageCount}
          </span>
          <span className="admin-stat-desc">Using elegant fallback placeholders</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Media Library</span>
          <span className="admin-stat-value">{totalMediaAssets}</span>
          <span className="admin-stat-desc">Compressed &amp; storage-optimized</span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="admin-media-tabs">
        <button
          type="button"
          className={`admin-media-tab ${activeTab === "entities" ? "admin-media-tab--active" : ""}`}
          onClick={() => setActiveTab("entities")}
        >
          <FolderOpen size={18} />
          <span>Entity Media ({totalEntities})</span>
        </button>
        <button
          type="button"
          className={`admin-media-tab ${activeTab === "library" ? "admin-media-tab--active" : ""}`}
          onClick={() => setActiveTab("library")}
        >
          <ImageIcon size={18} />
          <span>Media Library ({totalMediaAssets})</span>
        </button>
      </div>

      {/* VIEW 1: ENTITIES VIEW */}
      {activeTab === "entities" && (
        <div className="admin-media-view">
          {/* Filter & Search Toolbar */}
          <div className="admin-toolbar admin-media-toolbar">
            <div className="admin-search-box admin-media-search">
              <MagnifyingGlass size={16} />
              <input
                type="text"
                placeholder="Search entities by name, model, tag, or location…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="admin-clear-search" onClick={() => setSearchQuery("")}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ minWidth: 200 }}>
              <Dropdown
                label="Entity Type"
                options={ENTITY_TYPE_LIST}
                value={selectedType}
                onChange={setSelectedType}
                placeholder="All Categories (8)"
                light
              />
            </div>

            <div style={{ minWidth: 170 }}>
              <Dropdown
                label="Photo Status"
                options={["has_image", "missing_image"]}
                optionLabels={{ has_image: "Has Image", missing_image: "Missing Image" }}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Statuses"
                light
              />
            </div>

            {(selectedType || statusFilter || searchQuery) && (
              <button
                type="button"
                className="admin-link-btn"
                onClick={() => {
                  setSelectedType("");
                  setStatusFilter("");
                  setSearchQuery("");
                }}
              >
                Reset filters
              </button>
            )}
          </div>

          {filteredEntities.length === 0 ? (
            <div className="admin-empty-state">
              <p className="admin-page-note">No items match your selected filters.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table admin-media-table">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Photo</th>
                    <th>Entity</th>
                    <th>Category</th>
                    <th>Details</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntities.map((entity) => (
                    <tr key={`${entity.entityType}-${entity.id}`}>
                      <td>
                        <div
                          className="admin-media-thumb-cell"
                          onClick={() => {
                            if (entity.currentImage) {
                              setPreviewMedia({
                                url: entity.currentImage,
                                name: entity.name,
                                entityName: entity.name,
                                entityType: entity.entityType,
                              });
                              setModalMode("preview");
                            }
                          }}
                          style={{ cursor: entity.currentImage ? "pointer" : "default" }}
                          title={entity.currentImage ? "Click to preview full image" : "No photo assigned"}
                        >
                          {entity.currentImage ? (
                            <img src={entity.currentImage} alt={entity.name} className="admin-media-thumb-img" />
                          ) : (
                            <div className="admin-media-thumb-placeholder">
                              {getEntityIcon(entity.entityType)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="admin-media-entity-name">{entity.name}</span>
                      </td>
                      <td>
                        <span className="admin-media-type-badge">
                          {getEntityIcon(entity.entityType)} {entity.entityType}
                        </span>
                      </td>
                      <td>
                        <span className="admin-media-entity-sub">{entity.subtitle || "—"}</span>
                      </td>
                      <td>
                        {entity.hasImage ? (
                          <span className="admin-status-pill admin-status-pill--active">
                            <CheckCircle size={13} weight="fill" /> Assigned
                          </span>
                        ) : (
                          <span className="admin-status-pill admin-status-pill--missing">
                            No Image
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="admin-media-row-actions">
                          {entity.currentImage && (
                            <button
                              type="button"
                              className="admin-media-action-btn"
                              title="Preview full image"
                              onClick={() => {
                                setPreviewMedia({
                                  url: entity.currentImage,
                                  name: entity.name,
                                  entityName: entity.name,
                                  entityType: entity.entityType,
                                });
                                setModalMode("preview");
                              }}
                            >
                              <Eye size={15} /> Preview
                            </button>
                          )}
                          <button
                            type="button"
                            className="admin-media-action-btn admin-media-action-btn--primary"
                            onClick={() => handleOpenAssign(entity)}
                          >
                            <ArrowsClockwise size={15} />
                            {entity.hasImage ? "Replace" : "Assign"}
                          </button>
                          {entity.hasImage && (
                            <button
                              type="button"
                              className="admin-media-action-btn admin-media-action-btn--danger"
                              title="Remove image from entity"
                              onClick={() => handleRemoveEntityImage(entity)}
                            >
                              <Trash size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MEDIA LIBRARY VIEW */}
      {activeTab === "library" && (
        <div className="admin-media-view">
          <div className="admin-media-library-intro">
            <p className="admin-page-note">
              Every uploaded image is optimized on the fly via canvas compression to prevent browser storage overload.
              Images stored here can be reused or assigned to any Sikkim travel offering.
            </p>
          </div>

          {mediaList.length === 0 ? (
            <div className="admin-empty-state admin-media-empty">
              <ImageIcon size={48} weight="duotone" className="admin-media-empty-icon" />
              <h3>Your Media Library is empty</h3>
              <p>Upload compressed photos or connect image URLs to assign to vehicles, stays, destinations, and more.</p>
              <button type="button" className="admin-btn-primary" onClick={handleOpenUpload}>
                <UploadSimple size={16} weight="bold" /> Upload First Photo
              </button>
            </div>
          ) : (
            <div className="admin-media-grid">
              {mediaList.map((asset) => (
                <div key={asset.id} className={`admin-media-card ${!asset.active ? "admin-media-card--inactive" : ""}`}>
                  <div
                    className="admin-media-card__preview"
                    onClick={() => {
                      setPreviewMedia(asset);
                      setModalMode("preview");
                    }}
                  >
                    <img src={asset.url} alt={asset.name} loading="lazy" />
                    <span className="admin-media-card__size">{asset.size}</span>
                  </div>

                  <div className="admin-media-card__body">
                    <h4 className="admin-media-card__name" title={asset.name}>{asset.name}</h4>
                    {asset.dimensions && (
                      <span className="admin-media-card__dim">
                        {asset.dimensions.width} × {asset.dimensions.height}px
                      </span>
                    )}

                    <div className="admin-media-card__assigned">
                      {asset.entityName ? (
                        <span className="admin-media-card__assigned-pill" title={`Assigned to ${asset.entityName}`}>
                          {getEntityIcon(asset.entityType)} {asset.entityName}
                        </span>
                      ) : (
                        <span className="admin-media-card__unassigned-pill">Unassigned</span>
                      )}
                    </div>

                    <div className="admin-media-card__actions">
                      <button
                        type="button"
                        className={`admin-media-card__btn-toggle ${asset.active ? "admin-media-card__btn-toggle--active" : ""}`}
                        onClick={() => handleToggleActive(asset.id)}
                        title={asset.active ? "Deactivate this photo" : "Activate this photo"}
                      >
                        {asset.active ? "Active" : "Inactive"}
                      </button>

                      <div className="admin-media-card__action-group">
                        <button
                          type="button"
                          className="admin-media-icon-btn"
                          title="Preview full image"
                          onClick={() => {
                            setPreviewMedia(asset);
                            setModalMode("preview");
                          }}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="admin-media-icon-btn admin-media-icon-btn--danger"
                          title="Delete from library"
                          onClick={() => handleDeleteMedia(asset.id)}
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Upload / Assign Image */}
      {(modalMode === "upload" || modalMode === "assign") && (
        <MediaUploadAssignModal
          initialEntity={targetEntity}
          allEntities={entities}
          existingMediaList={mediaList}
          onClose={() => {
            setModalMode(null);
            setTargetEntity(null);
          }}
          onSuccess={(savedAsset) => {
            refreshData();
            setModalMode(null);
            setTargetEntity(null);
            showMessage("success", `Media successfully ${targetEntity ? "assigned" : "uploaded"}.`);
          }}
        />
      )}

      {/* MODAL: Image Preview Lightbox */}
      {modalMode === "preview" && previewMedia && (
        <MediaPreviewModal
          media={previewMedia}
          onClose={() => {
            setModalMode(null);
            setPreviewMedia(null);
          }}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MODAL: Upload & Assign
// -------------------------------------------------------------
function MediaUploadAssignModal({ initialEntity, allEntities, existingMediaList, onClose, onSuccess }) {
  const [sourceMode, setSourceMode] = useState("file"); // "file" | "url" | "library"
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [assetName, setAssetName] = useState("");
  const [selectedLibraryId, setSelectedLibraryId] = useState("");

  // Compression metrics live state
  const [compressedResult, setCompressedResult] = useState(null);
  const [compressing, setCompressing] = useState(false);

  // Entity selection
  const [entityCategory, setEntityCategory] = useState(initialEntity?.entityType || "");
  const [entityId, setEntityId] = useState(initialEntity?.id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // Filter available entities by chosen category
  const availableEntitiesForCategory = allEntities.filter(
    (e) => !entityCategory || e.entityType === entityCategory
  );

  useEffect(() => {
    if (initialEntity) {
      setEntityCategory(initialEntity.entityType);
      setEntityId(initialEntity.id);
      setAssetName(`${initialEntity.name} Photo`);
    }
  }, [initialEntity]);

  // Handle file selection and immediate client-side canvas compression
  async function handleFileChange(selectedFile) {
    if (!selectedFile) return;
    setError(null);
    setCompressing(true);
    setFile(selectedFile);
    if (!assetName) {
      setAssetName(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }

    try {
      const result = await compressImageFile(selectedFile);
      setCompressedResult(result);
    } catch (err) {
      setError(err.message || "Failed to process image.");
      setCompressedResult(null);
    } finally {
      setCompressing(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (sourceMode === "file") {
        if (!file && !compressedResult) {
          throw new Error("Please choose an image file to upload.");
        }
        await uploadMediaAsset({
          file,
          name: assetName,
          entityType: entityCategory || null,
          entityId: entityId || null,
        });
      } else if (sourceMode === "url") {
        if (!url.trim()) {
          throw new Error("Please enter a valid image URL.");
        }
        await uploadMediaAsset({
          url: url.trim(),
          name: assetName,
          entityType: entityCategory || null,
          entityId: entityId || null,
        });
      } else if (sourceMode === "library") {
        if (!selectedLibraryId) {
          throw new Error("Please select an image from the library.");
        }
        if (!entityCategory || !entityId) {
          throw new Error("Please select an entity to assign this image to.");
        }
        assignMediaToEntity(entityCategory, entityId, selectedLibraryId);
      }

      onSuccess();
    } catch (err) {
      setError(err.message || "An error occurred while saving the media.");
      setLoading(false);
    }
  }

  const previewSrc =
    sourceMode === "file"
      ? compressedResult?.dataUrl
      : sourceMode === "url"
      ? url.trim()
      : existingMediaList.find((m) => m.id === selectedLibraryId)?.url;

  return (
    <div className="admin-modal" role="dialog" aria-modal="true" aria-label="Upload or Assign Media">
      <div className="admin-modal__backdrop" onClick={onClose} />
      <div className="admin-modal__panel admin-media-modal-panel">
        <button className="admin-modal__close" onClick={onClose} aria-label="Close">
          <X size={20} weight="bold" />
        </button>

        <h2 className="admin-modal__title">
          {initialEntity ? `Assign Photo to ${initialEntity.name}` : "Upload / Add Media"}
        </h2>
        <p className="admin-page-note">
          {initialEntity
            ? `Choose or upload an optimized image for ${initialEntity.name} (${initialEntity.entityType}).`
            : "Upload an image to your library or assign it directly to a Sikkim travel offering."}
        </p>

        {/* Source Mode Switcher */}
        <div className="admin-media-source-nav">
          <button
            type="button"
            className={`admin-media-source-btn ${sourceMode === "file" ? "admin-media-source-btn--active" : ""}`}
            onClick={() => setSourceMode("file")}
          >
            <UploadSimple size={16} /> Upload Image (Auto-compressed)
          </button>
          <button
            type="button"
            className={`admin-media-source-btn ${sourceMode === "url" ? "admin-media-source-btn--active" : ""}`}
            onClick={() => setSourceMode("url")}
          >
            <LinkSimple size={16} /> Direct Image URL
          </button>
          {existingMediaList.length > 0 && (
            <button
              type="button"
              className={`admin-media-source-btn ${sourceMode === "library" ? "admin-media-source-btn--active" : ""}`}
              onClick={() => setSourceMode("library")}
            >
              <FolderOpen size={16} /> Pick from Library
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          {/* TAB 1: File Upload */}
          {sourceMode === "file" && (
            <div className="admin-field">
              <label>
                <span>Select image file</span>
                <div
                  className="admin-media-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handleFileChange(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                  />
                  <UploadSimple size={32} className="admin-media-dropzone-icon" />
                  <p className="admin-media-dropzone-text">
                    <strong>Click to browse</strong> or drag and drop an image here
                  </p>
                  <span className="admin-media-dropzone-sub">
                    PNG, JPG, WebP. Automatically resized and compressed to protect storage.
                  </span>
                </div>
              </label>

              {compressing && <p className="admin-page-note">Compressing and preparing image…</p>}

              {compressedResult && (
                <div className="admin-media-compression-banner">
                  <CheckCircle size={18} weight="fill" />
                  <div>
                    <strong>Optimized successfully:</strong> Original: {compressedResult.originalSize} →{" "}
                    <strong>Compressed: {compressedResult.compressedSize}</strong> ({compressedResult.width} × {compressedResult.height}px)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Direct URL */}
          {sourceMode === "url" && (
            <div className="admin-field">
              <label>
                <span>Image URL *</span>
                <input
                  type="url"
                  placeholder="https://example.com/photos/sikkim-lake.jpg or /assets/images/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </label>
              <span className="admin-page-note">
                Direct URLs use zero localStorage quota and are loaded directly from the web or local asset path.
              </span>
            </div>
          )}

          {/* TAB 3: Select From Library */}
          {sourceMode === "library" && (
            <div className="admin-field">
              <label>
                <span>Choose from Library *</span>
                <div className="admin-media-library-picker">
                  {existingMediaList.map((m) => (
                    <div
                      key={m.id}
                      className={`admin-media-picker-item ${selectedLibraryId === m.id ? "admin-media-picker-item--selected" : ""}`}
                      onClick={() => {
                        setSelectedLibraryId(m.id);
                        if (!assetName) setAssetName(m.name);
                      }}
                    >
                      <img src={m.url} alt={m.name} />
                      <span className="admin-media-picker-title">{m.name}</span>
                    </div>
                  ))}
                </div>
              </label>
            </div>
          )}

          {/* Title / Name */}
          <div className="admin-field">
            <label>
              <span>Image Title / Label (optional)</span>
              <input
                type="text"
                placeholder="e.g. Tata Sumo Mountain Road"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
              />
            </label>
          </div>

          {/* Target Entity Assignment */}
          <div className="admin-media-assignment-box">
            <h4 className="admin-media-box-title">Assign to Offering (Optional)</h4>
            <div className="admin-media-assignment-fields">
              <div style={{ flex: 1 }}>
                <Dropdown
                  label="Category"
                  options={ENTITY_TYPE_LIST}
                  value={entityCategory}
                  onChange={(val) => {
                    setEntityCategory(val);
                    setEntityId("");
                  }}
                  placeholder="Select Category"
                  light
                />
              </div>

              <div style={{ flex: 1 }}>
                <Dropdown
                  label="Specific Offering"
                  options={availableEntitiesForCategory.map((e) => e.id)}
                  optionLabels={availableEntitiesForCategory.reduce((acc, e) => {
                    acc[e.id] = e.hasImage ? `${e.name} (Has Image)` : e.name;
                    return acc;
                  }, {})}
                  value={entityId}
                  onChange={setEntityId}
                  placeholder="Select Item"
                  light
                />
              </div>
            </div>
          </div>

          {/* Live Preview Block */}
          {previewSrc && (
            <div className="admin-media-modal-preview">
              <span className="admin-preview__label">Preview</span>
              <img src={previewSrc} alt="Preview" className="admin-media-modal-preview-img" />
            </div>
          )}

          {error && <div className="admin-field__error">{error}</div>}

          <div className="admin-media-modal-footer">
            <button type="button" className="admin-btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="admin-form__submit" disabled={loading || compressing}>
              {loading ? "Saving…" : initialEntity ? "Save & Assign Image" : "Save Image"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MODAL: Image Preview Lightbox
// -------------------------------------------------------------
function MediaPreviewModal({ media, onClose }) {
  return (
    <div className="admin-modal" role="dialog" aria-modal="true" aria-label="Media Preview">
      <div className="admin-modal__backdrop" onClick={onClose} />
      <div className="admin-modal__panel admin-media-preview-panel">
        <button className="admin-modal__close" onClick={onClose} aria-label="Close">
          <X size={20} weight="bold" />
        </button>

        <div className="admin-media-preview-img-wrap">
          <img src={media.url} alt={media.name || "Preview"} className="admin-media-preview-full" />
        </div>

        <div className="admin-media-preview-meta">
          <h3 className="admin-media-preview-title">{media.name}</h3>
          <div className="admin-media-preview-tags">
            {media.entityName && (
              <span className="admin-media-tag">
                Assigned to: <strong>{media.entityName}</strong> ({media.entityType})
              </span>
            )}
            {media.size && <span className="admin-media-tag">Size: {media.size}</span>}
            {media.dimensions && (
              <span className="admin-media-tag">
                Resolution: {media.dimensions.width} × {media.dimensions.height}px
              </span>
            )}
            {media.createdAt && (
              <span className="admin-media-tag">Uploaded: {new Date(media.createdAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}