import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  Bed,
  Bicycle,
  IdentificationCard,
  UploadSimple,
  FloppyDisk,
  ArrowsClockwise,
  ArrowSquareOut,
  CheckCircle,
  Sparkle,
  ArrowUpRight,
  Info,
  Camera,
} from "phosphor-react";
import {
  getExploreWays,
  saveExploreWays,
  resetExploreWays,
  DEFAULT_EXPLORE_WAYS,
} from "../../data/exploreWaysData.js";
import { compressImageFile } from "../../utils/mediaService.js";
import "./AdminExploreWays.css";

const ICON_MAP = {
  cars: Car,
  stays: Bed,
  bikes: Bicycle,
  permits: IdentificationCard,
};

export default function AdminExploreWays() {
  const [items, setItems] = useState(getExploreWays);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadingId, setUploadingId] = useState(null);
  const [selectedId, setSelectedId] = useState("cars");

  const fileInputRefs = useRef({});

  useEffect(() => {
    function refresh() {
      setItems(getExploreWays());
    }
    window.addEventListener("explore-ways-changed", refresh);
    return () => window.removeEventListener("explore-ways-changed", refresh);
  }, []);

  function handleFieldChange(id, field, value) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    setSaveSuccess(false);
    setErrorMessage("");
  }

  async function handleFileUpload(id, e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, JPG, or WebP).");
      return;
    }

    try {
      setUploadingId(id);
      setErrorMessage("");
      // Compress to optimal web dimensions & lightweight quality
      const compressedDataUrl = await compressImageFile(file, {
        maxWidth: 1200,
        quality: 0.85,
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, image: compressedDataUrl, isCustomPhoto: true } : item
        )
      );

      // Auto-save changes
      const updated = items.map((item) =>
        item.id === id ? { ...item, image: compressedDataUrl, isCustomPhoto: true } : item
      );
      saveExploreWays(updated);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to compress and upload photo: " + (err.message || "Unknown error"));
    } finally {
      setUploadingId(null);
      if (fileInputRefs.current[id]) {
        fileInputRefs.current[id].value = "";
      }
    }
  }

  function handleResetPhoto(id) {
    const def = DEFAULT_EXPLORE_WAYS.find((d) => d.id === id);
    if (!def) return;

    const updated = items.map((item) =>
      item.id === id ? { ...item, image: def.image, isCustomPhoto: false } : item
    );
    setItems(updated);
    saveExploreWays(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  function handleSaveAll() {
    try {
      const ok = saveExploreWays(items);
      if (ok) {
        setSaveSuccess(true);
        setErrorMessage("");
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        setErrorMessage("Failed to save changes. Please check browser storage permissions.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("An unexpected error occurred while saving.");
    }
  }

  function handleResetAll() {
    if (
      window.confirm(
        "Are you sure you want to reset all 4 Explore Cards (photos, descriptions, and tags) back to factory defaults?"
      )
    ) {
      const def = resetExploreWays();
      setItems(def);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  }

  const activeItem = items.find((i) => i.id === selectedId) || items[0];
  const ActiveIcon = ICON_MAP[activeItem.id] || Car;

  return (
    <div className="admin-explore-page">
      {/* Page Header */}
      <div className="admin-toolbar">
        <div>
          <h1 className="admin-page-title">Homepage Explore Cards</h1>
          <p className="admin-page-note">
            Manage the 4 core photographic adventure cards (Cars, Stays, Bikes, Permits) shown on the public homepage.
            Upload your own real photos anytime or modify subtitles, tags, and buttons.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="admin-link-btn"
            onClick={handleResetAll}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <ArrowsClockwise size={15} />
            <span>Reset Defaults</span>
          </button>

          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "none",
            }}
          >
            <span>View on Public Site</span>
            <ArrowSquareOut size={15} />
          </Link>

          <button
            type="button"
            className="admin-btn-primary"
            onClick={handleSaveAll}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <FloppyDisk size={16} weight="bold" />
            <span>Save All Cards</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="admin-settings-success-banner" role="status">
          <CheckCircle size={20} weight="fill" />
          <span>Explore Cards updated successfully! Changes reflect immediately on the homepage.</span>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#991B1B",
            padding: "12px 18px",
            borderRadius: "6px",
            fontWeight: 600,
            marginBottom: "16px",
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Top 4 Service Selector Strip */}
      <div className="admin-explore-tabs">
        {items.map((item) => {
          const Icon = ICON_MAP[item.id] || Car;
          const isSelected = item.id === selectedId;
          const isCustom = item.image !== DEFAULT_EXPLORE_WAYS.find((d) => d.id === item.id)?.image;

          return (
            <button
              key={item.id}
              type="button"
              className={`admin-explore-tab ${isSelected ? "admin-explore-tab--active" : ""}`}
              onClick={() => setSelectedId(item.id)}
            >
              <div className="admin-explore-tab__icon">
                <Icon size={20} weight={isSelected ? "fill" : "duotone"} />
              </div>
              <div className="admin-explore-tab__info">
                <span className="admin-explore-tab__title">{item.title}</span>
                <span className="admin-explore-tab__status">
                  {isCustom ? "Custom Photo" : "Default Photo"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2-Column Workspace: Left Editor + Right Live Card Preview */}
      <div className="admin-explore-workspace">
        {/* Left Column: Photo & Details Editor */}
        <div className="admin-explore-editor">
          {/* Card Photo Section */}
          <div className="admin-explore-card-box">
            <div className="admin-explore-box-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Camera size={20} weight="bold" color="var(--color-peach-deep)" />
                <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                  Photo for {activeItem.title}
                </h2>
              </div>
              {activeItem.image !== DEFAULT_EXPLORE_WAYS.find((d) => d.id === activeItem.id)?.image ? (
                <span className="admin-explore-photo-badge admin-explore-photo-badge--custom">
                  Custom Uploaded Photo
                </span>
              ) : (
                <span className="admin-explore-photo-badge admin-explore-photo-badge--default">
                  Default High-Res Photo
                </span>
              )}
            </div>

            {/* Photo Thumbnail + Upload Buttons */}
            <div className="admin-explore-photo-manager">
              <div className="admin-explore-thumb-frame">
                <img
                  src={activeItem.image}
                  alt={activeItem.title}
                  className="admin-explore-thumb-img"
                />
              </div>

              <div className="admin-explore-photo-actions">
                <p className="admin-explore-photo-tip">
                  Upload your own high-resolution Sikkim photo (PNG or JPG). Photos are automatically compressed for fast loading.
                </p>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
                  <input
                    ref={(el) => (fileInputRefs.current[activeItem.id] = el)}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleFileUpload(activeItem.id, e)}
                  />

                  <button
                    type="button"
                    className="admin-btn-primary"
                    disabled={uploadingId === activeItem.id}
                    onClick={() => fileInputRefs.current[activeItem.id]?.click()}
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                  >
                    <UploadSimple size={16} weight="bold" />
                    <span>
                      {uploadingId === activeItem.id
                        ? "Compressing & Uploading..."
                        : "Upload New Photo (.png / .jpg)"}
                    </span>
                  </button>

                  {activeItem.image !== DEFAULT_EXPLORE_WAYS.find((d) => d.id === activeItem.id)?.image && (
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => handleResetPhoto(activeItem.id)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <ArrowsClockwise size={15} />
                      <span>Revert to Default Photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card Content & Text Details */}
          <div className="admin-explore-card-box">
            <div className="admin-explore-box-header">
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                Card Content &amp; Call to Action
              </h2>
            </div>

            <div className="admin-explore-fields-grid">
              <div className="admin-field-group">
                <label className="admin-label">Card Heading</label>
                <input
                  type="text"
                  className="admin-input"
                  value={activeItem.title}
                  onChange={(e) => handleFieldChange(activeItem.id, "title", e.target.value)}
                  placeholder="e.g. Cars & 4x4 Mountain SUVs"
                />
              </div>

              <div className="admin-field-group">
                <label className="admin-label">Category / Tag Pill</label>
                <input
                  type="text"
                  className="admin-input"
                  value={activeItem.tag}
                  onChange={(e) => handleFieldChange(activeItem.id, "tag", e.target.value)}
                  placeholder="e.g. 4x4 Fleet & Boleros"
                />
              </div>

              <div className="admin-field-group" style={{ gridColumn: "1 / -1" }}>
                <label className="admin-label">Description / Subtitle</label>
                <textarea
                  className="admin-input"
                  rows={3}
                  value={activeItem.desc}
                  onChange={(e) => handleFieldChange(activeItem.id, "desc", e.target.value)}
                  placeholder="Describe this travel experience..."
                />
              </div>

              <div className="admin-field-group">
                <label className="admin-label">Button CTA Text</label>
                <input
                  type="text"
                  className="admin-input"
                  value={activeItem.cta}
                  onChange={(e) => handleFieldChange(activeItem.id, "cta", e.target.value)}
                  placeholder="e.g. Explore cars"
                />
              </div>

              <div className="admin-field-group">
                <label className="admin-label">Destination Route Link</label>
                <input
                  type="text"
                  className="admin-input"
                  value={activeItem.path}
                  disabled
                  style={{ background: "#f3f4f6", cursor: "not-allowed" }}
                />
              </div>
            </div>

            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="admin-btn-primary"
                onClick={handleSaveAll}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <FloppyDisk size={16} weight="bold" />
                <span>Save All Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Card Preview Exactly Like Homepage */}
        <div className="admin-explore-preview">
          <div className="admin-explore-preview-header">
            <Sparkle size={18} weight="fill" color="var(--color-peach-deep)" />
            <h3>Live Public Homepage Preview</h3>
          </div>

          <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "14px" }}>
            This is how <strong>{activeItem.title}</strong> looks to travelers visiting the website right now:
          </p>

          {/* Render Actual Visual Card Component Structure */}
          <div className="admin-explore-card-preview-container">
            <div className="explore-card" style={{ width: "100%", maxWidth: "340px", margin: "0 auto" }}>
              <div className="explore-card__bg-wrap">
                <img
                  src={activeItem.image}
                  alt={activeItem.title}
                  className="explore-card__bg-img"
                />
                <div className="explore-card__overlay" />
              </div>

              <div className="explore-card__top">
                <div className="explore-card__icon-badge">
                  <ActiveIcon size={22} weight="duotone" />
                </div>
                {activeItem.tag && (
                  <span className="explore-card__tag-pill">{activeItem.tag}</span>
                )}
              </div>

              <div className="explore-card__body">
                <h3 className="explore-card__title">{activeItem.title}</h3>
                <p className="explore-card__desc">{activeItem.desc}</p>
                <div className="explore-card__footer">
                  <span className="explore-card__cta-btn">
                    <span>{activeItem.cta}</span>
                    <ArrowUpRight size={15} weight="bold" className="explore-card__cta-arrow" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "16px", padding: "12px", background: "#fbf9f6", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            <Info size={16} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }} />
            <span>
              All 4 cards (Cars, Stays, Bikes, Permits) update in real-time. Click any tab above to customize another card.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
