import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  PhoneCall,
  WhatsappLogo,
  InstagramLogo,
  FacebookLogo,
  EnvelopeSimple,
  MapPin,
  CheckCircle,
  ArrowSquareOut,
  ArrowsClockwise,
  FloppyDisk,
  Bed,
  Car,
  Bicycle,
  IdentificationCard,
  ArrowRight,
  Info,
  ImageSquare,
  UploadSimple,
  Trash,
  Sparkle,
  Clock,
  Compass,
  Buildings,
  ShareNetwork,
  Circle,
  Square,
  SlidersHorizontal,
} from "phosphor-react";
import {
  getContactSettings,
  saveContactSettings,
  DEFAULT_CONTACT_SETTINGS,
  getSiteLogo,
  compressLogoFile,
  optimizeLogoDataUrl,
  buildPhoneLink,
  buildWhatsAppLink,
  buildInstagramLink,
  buildFacebookLink,
} from "../../data/contactSettings.js";
import { heroImage, heroImageAlt } from "../../data/heroImage.js";
import { compressImageFile } from "../../utils/mediaService.js";
import {
  ModernPhoneIcon,
  ModernWhatsAppIcon,
  ModernInstagramIcon,
  ModernFacebookIcon,
} from "../../components/SocialIcons.jsx";

// Curated high-resolution Sikkim scenic landscape presets
const SIKKIM_PRESETS = [
  {
    id: "default-kanchenjunga",
    name: "Kanchenjunga Sunrise",
    sub: "Prayer flags & morning peak (Default)",
    badge: "Sikkim • Eastern Himalayas",
    url: heroImage,
  },
  {
    id: "gurudongmar-lake",
    name: "Gurudongmar Lake",
    sub: "Sacred high-altitude waters (17,800 ft)",
    badge: "North Sikkim • 17,800 ft",
    url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "yumthang-valley",
    name: "Yumthang Valley",
    sub: "Alpine flower sanctuary & snow ridges",
    badge: "Yumthang • 11,800 ft",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "lachen-mist",
    name: "Lachen Alpine Ridges",
    sub: "Misty pine conifers & mountain mist",
    badge: "Lachen Valley • Sikkim",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function AdminSettings() {
  const [formData, setFormData] = useState(getContactSettings());
  const [activeTab, setActiveTab] = useState("hero"); // "hero" | "channels" | "social" | "agency"
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoSaveSuccess, setLogoSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fileInputRef = useRef(null);
  const logoFileInputRef = useRef(null);

  useEffect(() => {
    setFormData(getContactSettings());
  }, []);

  function handleChange(field, value) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaveSuccess(false);
    setLogoSaveSuccess(false);
    setErrorMessage("");
  }

  // Handle local logo image file upload & client-side compression / format preserving
  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, SVG, JPG, or WebP).");
      return;
    }

    try {
      setUploadingLogo(true);
      setErrorMessage("");
      // Compress logo while keeping transparency and crisp dimensions (<40KB)
      const logoDataUrl = await compressLogoFile(file, 360);
      const updated = {
        ...formData,
        logoCustom: logoDataUrl,
      };
      setFormData(updated);
      const ok = saveContactSettings(updated);
      if (ok) {
        setLogoSaveSuccess(true);
        setSaveSuccess(true);
        setTimeout(() => {
          setLogoSaveSuccess(false);
          setSaveSuccess(false);
        }, 3500);
      } else {
        setErrorMessage("Failed to auto-save logo to browser storage.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to process and upload logo: " + (err.message || "Unknown error"));
    } finally {
      setUploadingLogo(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = "";
    }
  }

  // Explicit Save Brand Logo button handler
  async function handleSaveLogo(e) {
    if (e && e.preventDefault) e.preventDefault();
    try {
      setUploadingLogo(true);
      setErrorMessage("");
      let logoToSave = formData.logoCustom;
      if (logoToSave && typeof logoToSave === "string" && logoToSave.startsWith("data:image/")) {
        logoToSave = await optimizeLogoDataUrl(logoToSave, 360);
      }
      const updated = {
        ...formData,
        logoCustom: logoToSave,
      };
      setFormData(updated);
      const ok = saveContactSettings(updated);
      if (ok) {
        setLogoSaveSuccess(true);
        setSaveSuccess(true);
        setTimeout(() => {
          setLogoSaveSuccess(false);
          setSaveSuccess(false);
        }, 4000);
      } else {
        setErrorMessage("Failed to save brand logo. Browser storage quota may be full.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to save brand logo: " + (err.message || "Unknown error"));
    } finally {
      setUploadingLogo(false);
    }
  }

  // Reset logo back to original default Lama Bhai logo
  function handleResetLogo() {
    const updated = {
      ...formData,
      logoCustom: null,
    };
    setFormData(updated);
    saveContactSettings(updated);
    setLogoSaveSuccess(true);
    setTimeout(() => setLogoSaveSuccess(false), 3000);
  }

  // Instant update for logo shape
  function handleLogoShapeChange(shape) {
    handleChange("logoShape", shape);
    saveContactSettings({ ...formData, logoShape: shape });
  }

  // Instant update for logo height
  function handleLogoHeightChange(height) {
    handleChange("logoHeight", height);
    saveContactSettings({ ...formData, logoHeight: height });
  }

  // Instant update for logo plaque style
  function handleLogoPlaqueChange(style) {
    handleChange("logoPlaqueStyle", style);
    saveContactSettings({ ...formData, logoPlaqueStyle: style });
  }

  // Instant update for showing brand text beside logo
  function handleShowBrandTextToggle() {
    const currentVal = formData.showBrandText !== undefined ? formData.showBrandText : true;
    const nextVal = !currentVal;
    handleChange("showBrandText", nextVal);
    saveContactSettings({ ...formData, showBrandText: nextVal });
  }

  // Handle local image file upload & client-side compression
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPG, PNG, or WebP).");
      return;
    }

    try {
      setUploading(true);
      setErrorMessage("");
      // Compress to optimal web dimensions & lightweight quality
      const compressedDataUrl = await compressImageFile(file, { maxWidth: 1200, quality: 0.82 });
      handleChange("heroImageCustom", compressedDataUrl);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to compress and upload photo: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Reset photo back to original default Himalayan morning landscape
  function handleResetPhoto() {
    handleChange("heroImageCustom", null);
  }

  // Select a curated Sikkim scenery preset
  function handleSelectPreset(preset) {
    if (preset.id === "default-kanchenjunga") {
      handleChange("heroImageCustom", null);
    } else {
      handleChange("heroImageCustom", preset.url);
    }
    if (preset.badge && !formData.locationBadge) {
      handleChange("locationBadge", preset.badge);
    }
  }

  async function handleSave(e) {
    if (e && e.preventDefault) e.preventDefault();
    try {
      let logoToSave = formData.logoCustom;
      if (logoToSave && typeof logoToSave === "string" && logoToSave.startsWith("data:image/")) {
        logoToSave = await optimizeLogoDataUrl(logoToSave, 360);
      }
      const updated = {
        ...formData,
        logoCustom: logoToSave,
      };
      setFormData(updated);
      const ok = saveContactSettings(updated);
      if (ok) {
        setSaveSuccess(true);
        setLogoSaveSuccess(true);
        setErrorMessage("");
        setTimeout(() => {
          setSaveSuccess(false);
          setLogoSaveSuccess(false);
        }, 3500);
      } else {
        setErrorMessage("Failed to save settings. Please check browser storage permissions.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("An unexpected error occurred while saving: " + (err.message || ""));
    }
  }

  function handleResetDefaults() {
    if (window.confirm("Are you sure you want to reset all contact settings, photos, and operational links to default?")) {
      setFormData({ ...DEFAULT_CONTACT_SETTINGS });
      saveContactSettings(DEFAULT_CONTACT_SETTINGS);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  }

  // Live computed test links
  const phoneLink = buildPhoneLink(formData.phone);
  const whatsappLink = buildWhatsAppLink(formData.whatsapp);
  const instagramLink = buildInstagramLink(formData.instagram);
  const facebookLink = buildFacebookLink(formData.facebook);
  const locationBadge = formData.locationBadge || "Sikkim • Eastern Himalayas";
  const activeHeroPhoto = formData.heroImageCustom || heroImage;
  const activeLogo = formData.logoCustom || null;
  const isCustomLogo = Boolean(formData.logoCustom);
  const activeLogoHeight = formData.logoHeight ? Number(formData.logoHeight) : 78;
  const activeLogoShape = formData.logoShape || "natural";
  const activeLogoPlaque = formData.logoPlaqueStyle && formData.logoPlaqueStyle !== "landscape-fade" ? formData.logoPlaqueStyle : "transparent";
  const showBrandText = formData.showBrandText !== undefined ? formData.showBrandText : true;
  const activeLogoOverhang = false;

  return (
    <div className="admin-settings-page">
      {/* Page Header Toolbar */}
      <div className="admin-toolbar">
        <div>
          <h1 className="admin-page-title">Settings &amp; Homepage Controls</h1>
          <p className="admin-page-note">
            Manage website brand logo, contact hotline, social links, operational preferences, and the public homepage hero photo.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="admin-link-btn"
            onClick={handleResetDefaults}
            style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowsClockwise size={15} />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            className="admin-btn-primary"
            onClick={handleSave}
            style={{ padding: "10px 18px", fontSize: "0.88rem" }}
          >
            <FloppyDisk size={17} weight="bold" />
            <span>Save All Settings</span>
          </button>
        </div>
      </div>

      {/* Success / Error Banners */}
      {saveSuccess && (
        <div className="admin-settings-success-banner" role="status">
          <CheckCircle size={20} weight="fill" />
          <span>Settings saved successfully! Website logo, homepage hero card, and channels have been synchronized.</span>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#991B1B",
            padding: "12px 18px",
            borderRadius: "4px",
            fontWeight: 600,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Status Summary Cards (5-column Grid) */}
      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 0 }}>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Brand Logo</span>
          <span className="admin-stat-card__value" style={{ fontSize: "1.15rem", fontWeight: 700, color: isCustomLogo ? "var(--color-peach-deep)" : "inherit" }}>
            {isCustomLogo ? "Custom Active" : "No Logo"}
          </span>
          <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
            {isCustomLogo ? "Uploaded custom mark" : "No logo uploaded"}
          </span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Direct Phone</span>
          <span className="admin-stat-card__value" style={{ fontSize: "1.15rem", fontWeight: 700 }}>
            {formData.phone ? "Connected" : "Not Set"}
          </span>
          <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
            {formData.phone || "No phone configured"}
          </span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">WhatsApp Hotline</span>
          <span className="admin-stat-card__value" style={{ fontSize: "1.15rem", fontWeight: 700 }}>
            {formData.whatsapp ? "Active" : "Not Set"}
          </span>
          <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
            {formData.whatsapp || "No number configured"}
          </span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Social Channels</span>
          <span className="admin-stat-card__value" style={{ fontSize: "1.15rem", fontWeight: 700 }}>
            {(formData.instagram ? 1 : 0) + (formData.facebook ? 1 : 0)} / 2 Linked
          </span>
          <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
            Instagram &amp; Facebook
          </span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Hero Photograph</span>
          <span className="admin-stat-card__value" style={{ fontSize: "1.15rem", fontWeight: 700 }}>
            {formData.heroImageCustom ? "Custom Photo" : "Default Scenic"}
          </span>
          <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
            {locationBadge}
          </span>
        </div>
      </div>

      {/* Structured Category Tabs Navigation */}
      <div className="admin-settings-tabs">
        <button
          type="button"
          className={`admin-settings-tab ${activeTab === "hero" ? "admin-settings-tab--active" : ""}`}
          onClick={() => setActiveTab("hero")}
        >
          <ImageSquare size={18} weight={activeTab === "hero" ? "fill" : "duotone"} />
          <span>Brand Logo &amp; Hero Photo</span>
        </button>

        <Link
          to="/admin/explore"
          className="admin-settings-tab"
          style={{ textDecoration: "none" }}
        >
          <Sparkle size={18} weight="duotone" />
          <span>Explore Cards Manager</span>
        </Link>

        <button
          type="button"
          className={`admin-settings-tab ${activeTab === "channels" ? "admin-settings-tab--active" : ""}`}
          onClick={() => setActiveTab("channels")}
        >
          <PhoneCall size={18} weight={activeTab === "channels" ? "fill" : "duotone"} />
          <span>Direct Contact Desk</span>
        </button>

        <button
          type="button"
          className={`admin-settings-tab ${activeTab === "social" ? "admin-settings-tab--active" : ""}`}
          onClick={() => setActiveTab("social")}
        >
          <ShareNetwork size={18} weight={activeTab === "social" ? "fill" : "duotone"} />
          <span>Social Media Links</span>
        </button>

        <button
          type="button"
          className={`admin-settings-tab ${activeTab === "agency" ? "admin-settings-tab--active" : ""}`}
          onClick={() => setActiveTab("agency")}
        >
          <Buildings size={18} weight={activeTab === "agency" ? "fill" : "duotone"} />
          <span>Agency &amp; Operations</span>
        </button>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="admin-settings-container">
        {/* Left Column: Active Tab Content */}
        <div className="admin-settings-panel">
          {/* TAB 1: HERO PHOTO & BRANDING */}
          {activeTab === "hero" && (
            <>
              {/* Card 1: Website Brand Logo */}
              <div className="admin-settings-card" style={{ marginBottom: "24px" }}>
                <div className="admin-settings-card__header">
                  <div className="admin-settings-card__header-left">
                    <Sparkle size={22} weight="duotone" color="var(--color-peach-deep)" />
                    <div>
                      <h2 className="admin-settings-card__title">Website Brand Logo (Navbar &amp; Footer)</h2>
                      <p className="admin-settings-card__subtitle">
                        Upload or replace the brand logo displayed at the top left of the navigation bar and in the footer.
                      </p>
                    </div>
                  </div>
                  {isCustomLogo && (
                    <button
                      type="button"
                      className="admin-link-btn"
                      onClick={handleResetLogo}
                      style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", color: "#DC2626" }}
                    >
                      <Trash size={15} />
                      <span>Remove Custom Logo</span>
                    </button>
                  )}
                </div>

                {/* Current Active Logo Banner */}
                <div className="admin-settings-logo-banner">
                  <div className="admin-settings-logo-preview-wrap">
                    <div
                      className={`admin-settings-logo-thumb-backdrop admin-settings-logo-thumb-backdrop--${activeLogoShape}`}
                      style={{
                        minHeight: `${Math.min(activeLogoHeight + 10, 96)}px`,
                        height: "auto",
                        minWidth: activeLogoShape === "circle" ? `${Math.min(activeLogoHeight + 10, 96)}px` : "110px",
                        maxWidth: "240px",
                        padding: activeLogoPlaque === "transparent" ? "4px 8px" : "8px 14px",
                        background: activeLogoPlaque === "transparent" ? "transparent" : activeLogoPlaque === "glass" ? "rgba(255,255,255,0.7)" : "#ffffff",
                        boxShadow: activeLogoPlaque === "card" ? "0 4px 16px rgba(15,24,38,0.08)" : "none",
                        border: activeLogoPlaque === "card" ? "1px solid #E8E0D5" : activeLogoPlaque === "glass" ? "1px solid rgba(255,255,255,0.9)" : "none",
                        borderRadius: activeLogoShape === "circle" ? "50%" : activeLogoShape === "rounded" ? "14px" : "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {activeLogo ? (
                        <img
                          src={activeLogo}
                          alt="Active Website Logo"
                          className={`admin-settings-logo-thumb admin-settings-logo-thumb--${activeLogoShape}`}
                          style={{
                            height: `${Math.min(activeLogoHeight, 88)}px`,
                            maxHeight: "88px",
                            width: "auto",
                            maxWidth: "210px",
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        <div style={{ padding: "8px 12px", textAlign: "center", color: "#94A3B8", fontSize: "0.82rem", fontWeight: 500 }}>
                          No Logo Uploaded
                        </div>
                      )}
                    </div>
                    <span className={`admin-settings-logo-badge ${isCustomLogo ? "admin-settings-logo-badge--custom" : "admin-settings-logo-badge--default"}`}>
                      {isCustomLogo ? "Custom Active" : "No Logo"}
                    </span>
                  </div>

                  <div className="admin-settings-logo-info">
                    <div className="admin-settings-logo-title">
                      {isCustomLogo ? "Custom Uploaded Brand Logo" : "No Brand Logo Uploaded"}
                    </div>
                    <p className="admin-settings-logo-sub">
                      {isCustomLogo
                        ? "This custom brand logo is currently live across the top navigation bar and footer."
                        : "No default logo is configured. Upload your brand logo below to display it across the website header and footer."}
                    </p>
                    <div className="admin-settings-logo-meta">
                      Current: <strong>{activeLogoShape.toUpperCase()}</strong> shape • <strong>{activeLogoPlaque.toUpperCase()}</strong> presentation • <strong>{activeLogoHeight}px</strong> height. Supports <strong>All Shapes &amp; Sizes</strong>.
                    </div>
                  </div>
                </div>

                {/* Brand Name Typography Toggle */}
                <div className="admin-settings-field-row" style={{ marginTop: "16px", marginBottom: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <label className="admin-field__title" style={{ margin: 0 }}>
                        Brand Name Typography Beside Logo
                      </label>
                      <p className="admin-field__help" style={{ margin: 0, marginTop: "2px" }}>
                        Display bold, crisp luxury web typography (<strong>"LAMA BHAI • Tours &amp; Travels Sikkim"</strong>) beside the logo on the navbar. Recommended for emblems and circular logos.
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`admin-toggle-switch ${showBrandText ? "admin-toggle-switch--active" : ""}`}
                      onClick={handleShowBrandTextToggle}
                      style={{
                        width: "48px",
                        height: "26px",
                        borderRadius: "999px",
                        background: showBrandText ? "var(--color-peach-deep)" : "#D1D5DB",
                        position: "relative",
                        border: "none",
                        cursor: "pointer",
                        transition: "background 0.2s ease",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          background: "#ffffff",
                          position: "absolute",
                          top: "3px",
                          left: showBrandText ? "25px" : "3px",
                          transition: "left 0.2s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* Plaque & Frame Presentation Style */}
                <div className="admin-settings-field-row" style={{ marginTop: "14px", marginBottom: "18px" }}>
                  <label className="admin-field__title">
                    Brand Logo Plaque Style (Header Display)
                  </label>
                  <p className="admin-field__help" style={{ marginBottom: "10px" }}>
                    Select how your logo is mounted in the navigation bar. <strong>"Clean Seamless"</strong> lets your brand mark float naturally on the header with no outer box or borders.
                  </p>

                  <div className="admin-logo-shape-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                    <button
                      type="button"
                      className={`admin-logo-shape-card ${activeLogoPlaque === "transparent" ? "admin-logo-shape-card--active" : ""}`}
                      onClick={() => handleLogoPlaqueChange("transparent")}
                    >
                      <div className="admin-logo-shape-card__preview" style={{ background: "#FAF7F2" }}>
                        {activeLogo ? (
                          <img
                            src={activeLogo}
                            alt="Transparent preview"
                            style={{ height: "34px", width: "auto", maxWidth: "80px", objectFit: "contain" }}
                          />
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Seamless</span>
                        )}
                      </div>
                      <div className="admin-logo-shape-card__meta">
                        <span className="admin-logo-shape-card__title">Clean Seamless (Recommended)</span>
                        <span className="admin-logo-shape-card__desc">
                          No outer box or borders. The brand mark floats naturally on the header. Modern, minimal, and large.
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`admin-logo-shape-card ${activeLogoPlaque === "card" ? "admin-logo-shape-card--active" : ""}`}
                      onClick={() => handleLogoPlaqueChange("card")}
                    >
                      <div className="admin-logo-shape-card__preview" style={{ background: "#F5F2EB" }}>
                        <div style={{ background: "#ffffff", padding: "4px 8px", borderRadius: "6px", boxShadow: "0 2px 8px rgba(15,24,38,0.08)", border: "1px solid #E8E0D5" }}>
                          {activeLogo ? (
                            <img
                              src={activeLogo}
                              alt="Card preview"
                              style={{ height: "30px", width: "auto", maxWidth: "70px", objectFit: "contain" }}
                            />
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Card</span>
                          )}
                        </div>
                      </div>
                      <div className="admin-logo-shape-card__meta">
                        <span className="admin-logo-shape-card__title">Contained White Card</span>
                        <span className="admin-logo-shape-card__desc">
                          Crisp white card backing with soft border and subtle shadow. Strictly contained inside navbar.
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`admin-logo-shape-card ${activeLogoPlaque === "glass" ? "admin-logo-shape-card--active" : ""}`}
                      onClick={() => handleLogoPlaqueChange("glass")}
                    >
                      <div className="admin-logo-shape-card__preview" style={{ background: "linear-gradient(135deg, #FAF7F2, #EFECE6)" }}>
                        <div style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(6px)", padding: "4px 8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 2px 6px rgba(15,24,38,0.06)" }}>
                          {activeLogo ? (
                            <img
                              src={activeLogo}
                              alt="Glass preview"
                              style={{ height: "30px", width: "auto", maxWidth: "70px", objectFit: "contain" }}
                            />
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Glass</span>
                          )}
                        </div>
                      </div>
                      <div className="admin-logo-shape-card__meta">
                        <span className="admin-logo-shape-card__title">Frosted Glass Plaque</span>
                        <span className="admin-logo-shape-card__desc">
                          Translucent frosted glass with subtle blurred backing. Strictly contained inside navbar.
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Logo Frame & Shape Selector */}
                <div className="admin-settings-field-row" style={{ marginTop: "14px", marginBottom: "18px" }}>
                  <label className="admin-field__title">
                    Logo Frame Shape Style (Navbar &amp; Footer)
                  </label>
                  <p className="admin-field__help" style={{ marginBottom: "10px" }}>
                    Select how your logo is displayed. <strong>"Natural / Any Shape"</strong> preserves rectangular and wide logos in their original aspect ratio without circular distortion or cropping.
                  </p>

                  <div className="admin-logo-shape-grid">
                    <button
                      type="button"
                      className={`admin-logo-shape-card ${activeLogoShape === "natural" ? "admin-logo-shape-card--active" : ""}`}
                      onClick={() => handleLogoShapeChange("natural")}
                    >
                      <div className="admin-logo-shape-card__preview admin-logo-shape-card__preview--natural">
                        {activeLogo ? (
                          <img
                            src={activeLogo}
                            alt="Natural preview"
                            style={{ height: "36px", width: "auto", maxWidth: "90px", objectFit: "contain" }}
                          />
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Natural</span>
                        )}
                      </div>
                      <div className="admin-logo-shape-card__meta">
                        <span className="admin-logo-shape-card__title">Natural / Any Shape (Default)</span>
                        <span className="admin-logo-shape-card__desc">
                          Recommended for rectangular, wide horizontal banners, ovals, and SVGs. Zero cropping.
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`admin-logo-shape-card ${activeLogoShape === "rounded" ? "admin-logo-shape-card--active" : ""}`}
                      onClick={() => handleLogoShapeChange("rounded")}
                    >
                      <div className="admin-logo-shape-card__preview admin-logo-shape-card__preview--rounded">
                        {activeLogo ? (
                          <img
                            src={activeLogo}
                            alt="Rounded preview"
                            style={{ height: "36px", width: "auto", maxWidth: "90px", objectFit: "contain" }}
                          />
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Rounded</span>
                        )}
                      </div>
                      <div className="admin-logo-shape-card__meta">
                        <span className="admin-logo-shape-card__title">Soft Rounded Badge</span>
                        <span className="admin-logo-shape-card__desc">
                          Smooth rounded card (10px radius) with crisp backing.
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`admin-logo-shape-card ${activeLogoShape === "circle" ? "admin-logo-shape-card--active" : ""}`}
                      onClick={() => handleLogoShapeChange("circle")}
                    >
                      <div className="admin-logo-shape-card__preview admin-logo-shape-card__preview--circle">
                        {activeLogo ? (
                          <img
                            src={activeLogo}
                            alt="Circular preview"
                            style={{ height: "36px", width: "36px", objectFit: "contain", borderRadius: "50%" }}
                          />
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Circle</span>
                        )}
                      </div>
                      <div className="admin-logo-shape-card__meta">
                        <span className="admin-logo-shape-card__title">Circular Emblem</span>
                        <span className="admin-logo-shape-card__desc">
                          Classic round medallion. Best for circular stamps and square emblems.
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Logo Height Scale & Sizing Presets */}
                <div className="admin-settings-field-row" style={{ marginTop: "14px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label className="admin-field__title" style={{ margin: 0 }}>
                      Navbar Logo Height ({activeLogoHeight}px)
                    </label>
                    <span style={{ fontSize: "0.80rem", fontWeight: 700, color: "var(--color-peach-deep)" }}>
                      {activeLogoHeight >= 82 ? "Large Executive" : activeLogoHeight >= 72 ? "Prominent Brand (Recommended)" : activeLogoHeight >= 62 ? "Standard Balanced" : "Compact & Sleek"}
                    </span>
                  </div>
                  <p className="admin-field__help" style={{ marginBottom: "10px" }}>
                    Control the logo's rendered height in the sticky navigation bar. Smart Auto-Trim automatically removes blank outer borders from uploaded logos, ensuring your brand crest and text are visibly bigger, bolder, and crystal clear on all screens while staying strictly contained inside the navbar.
                  </p>

                  <div className="admin-logo-size-presets">
                    {[
                      { h: 54, label: "Compact", note: "54px" },
                      { h: 64, label: "Standard", note: "64px" },
                      { h: 74, label: "Prominent Brand", note: "74px" },
                      { h: 84, label: "Large Executive", note: "84px" },
                    ].map((preset) => (
                      <button
                        key={preset.h}
                        type="button"
                        className={`admin-logo-size-pill ${activeLogoHeight === preset.h ? "admin-logo-size-pill--active" : ""}`}
                        onClick={() => handleLogoHeightChange(preset.h)}
                      >
                        <span className="admin-logo-size-pill__label">{preset.label}</span>
                        <span className="admin-logo-size-pill__px">{preset.note}</span>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "12px", background: "#FAF7F2", padding: "10px 14px", borderRadius: "8px", border: "1px solid #E8E0D5" }}>
                    <SlidersHorizontal size={18} weight="duotone" color="var(--color-navy)" />
                    <input
                      type="range"
                      min="48"
                      max="88"
                      step="2"
                      value={activeLogoHeight}
                      onChange={(e) => handleLogoHeightChange(Number(e.target.value))}
                      style={{ flex: 1, accentColor: "var(--color-peach-deep)", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "0.86rem", fontWeight: 800, minWidth: "48px", textAlign: "right", color: "var(--color-navy)" }}>
                      {activeLogoHeight} px
                    </span>
                  </div>
                </div>

                <div className="admin-settings-field-group">
                  {/* Upload Section */}
                  <div className="admin-settings-field-row">
                    <label className="admin-field__title">Upload New Logo File</label>
                    <label className="admin-settings-upload-dropzone">
                      <UploadSimple size={26} weight="duotone" color="var(--color-peach-deep)" />
                      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--color-navy)" }}>
                        {uploadingLogo ? "Processing & uploading brand logo..." : "Click to select a logo from your device"}
                      </span>
                      <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
                        PNG with transparency, SVG vector, WebP, or JPG — Any shape: Rectangular, Horizontal, Oval, Circle
                      </span>
                      <input
                        ref={logoFileInputRef}
                        type="file"
                        accept="image/png,image/svg+xml,image/webp,image/jpeg"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                    </label>
                  </div>

                  {/* Direct Logo Image URL */}
                  <div className="admin-settings-field-row" style={{ marginTop: "6px" }}>
                    <label htmlFor="admin-logo-url-input" className="admin-field__title">
                      Or Enter Direct Logo Image URL / CDN Link
                    </label>
                    <input
                      id="admin-logo-url-input"
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={formData.logoCustom || ""}
                      onChange={(e) => handleChange("logoCustom", e.target.value.trim() || null)}
                      onBlur={async (e) => {
                        const val = e.target.value.trim();
                        if (val && val.startsWith("data:image/")) {
                          const opt = await optimizeLogoDataUrl(val, 360);
                          handleChange("logoCustom", opt);
                        }
                      }}
                    />
                    <p className="admin-field__help">
                      Paste an image URL directly to load the logo from an external cloud host or CDN.
                    </p>
                  </div>
                </div>

                {/* Logo Action Row */}
                <div className="admin-settings-btn-row" style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    onClick={handleSaveLogo}
                    disabled={uploadingLogo}
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                  >
                    <FloppyDisk size={17} weight="bold" />
                    <span>{uploadingLogo ? "Saving Brand Logo..." : "Save Brand Logo"}</span>
                  </button>
                  {logoSaveSuccess && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#15803D", background: "#DCFCE7", padding: "8px 14px", borderRadius: "6px", fontSize: "0.84rem", fontWeight: 700 }}>
                      <CheckCircle size={17} weight="fill" />
                      <span>Brand logo saved and live on website!</span>
                    </span>
                  )}
                  {isCustomLogo && (
                    <button
                      type="button"
                      className="admin-link-btn"
                      onClick={handleResetLogo}
                      style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA", padding: "9px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <Trash size={15} />
                      <span>Reset to Default Logo</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Card 2: Homepage Hero Photograph */}
              <div className="admin-settings-card">
              <div className="admin-settings-card__header">
                <div className="admin-settings-card__header-left">
                  <ImageSquare size={22} weight="duotone" color="var(--color-peach-deep)" />
                  <div>
                    <h2 className="admin-settings-card__title">Homepage Hero Photograph</h2>
                    <p className="admin-settings-card__subtitle">
                      Change the high-resolution landscape photo displayed in the Hero card on the public website.
                    </p>
                  </div>
                </div>
                {formData.heroImageCustom && (
                  <button
                    type="button"
                    className="admin-link-btn"
                    onClick={handleResetPhoto}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <Trash size={14} />
                    <span>Reset to Default</span>
                  </button>
                )}
              </div>

              {/* Current Active Photo Banner */}
              <div className="admin-settings-photo-banner">
                <img
                  src={activeHeroPhoto}
                  alt="Current Hero Preview"
                  className="admin-settings-photo-thumb"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="admin-settings-photo-info">
                  <div className="admin-settings-photo-title">
                    {formData.heroImageCustom ? "Custom Uploaded Photograph" : "Default Scenic Himalayan Landscape"}
                  </div>
                  <div className="admin-settings-photo-sub">
                    {formData.heroImageCustom
                      ? "This custom photograph is currently active on the public homepage."
                      : "Using authentic Kanchenjunga sunrise photo with prayer flags."}
                  </div>
                </div>
              </div>

              <div className="admin-settings-field-group">
                {/* Upload Section */}
                <div className="admin-settings-field-row">
                  <label className="admin-field__title">Upload New Photograph</label>
                  <label className="admin-settings-upload-dropzone">
                    <UploadSimple size={26} weight="duotone" color="var(--color-peach-deep)" />
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--color-navy)" }}>
                      {uploading ? "Compressing & uploading photo..." : "Click to select a photo from your computer"}
                    </span>
                    <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
                      JPG, PNG, WebP up to 10MB (automatically compressed for rapid loading)
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>

                {/* Sikkim Landscape Presets */}
                <div className="admin-settings-field-row" style={{ marginTop: "6px" }}>
                  <div className="admin-settings-field-label-wrap">
                    <label className="admin-field__title">Or Choose a Sikkim Landscape Preset</label>
                    <span style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
                      1-click themes
                    </span>
                  </div>

                  <div className="admin-settings-preset-grid">
                    {SIKKIM_PRESETS.map((p) => {
                      const isActive =
                        (p.id === "default-kanchenjunga" && !formData.heroImageCustom) ||
                        formData.heroImageCustom === p.url;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className={`admin-settings-preset-card ${
                            isActive ? "admin-settings-preset-card--active" : ""
                          }`}
                          onClick={() => handleSelectPreset(p)}
                          title={`Select ${p.name}`}
                        >
                          <img src={p.url} alt={p.name} className="admin-settings-preset-img" />
                          <div className="admin-settings-preset-label">{p.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Direct Image URL Option */}
                <div className="admin-settings-field-row" style={{ marginTop: "6px" }}>
                  <label htmlFor="admin-photo-url-input" className="admin-field__title">
                    Or Enter Image URL
                  </label>
                  <input
                    id="admin-photo-url-input"
                    type="url"
                    placeholder="https://images.unsplash.com/... or https://..."
                    value={formData.heroImageCustom || ""}
                    onChange={(e) => handleChange("heroImageCustom", e.target.value || null)}
                  />
                </div>

                {/* Location Badge */}
                <div className="admin-settings-field-row" style={{ marginTop: "6px" }}>
                  <label htmlFor="admin-location-badge-input" className="admin-field__title">
                    Hero Location Badge Text
                  </label>
                  <input
                    id="admin-location-badge-input"
                    type="text"
                    placeholder="Sikkim • Eastern Himalayas"
                    value={formData.locationBadge}
                    onChange={(e) => handleChange("locationBadge", e.target.value)}
                  />
                  <p className="admin-field__help">
                    Displayed on the floating pill badge at the bottom of the scenic photo.
                  </p>
                </div>
              </div>

              {/* Action Save Row */}
              <div className="admin-settings-btn-row">
                <button type="button" className="admin-btn-primary" onClick={handleSave}>
                  <FloppyDisk size={17} weight="bold" />
                  <span>Save Photo Changes</span>
                </button>
              </div>
            </div>
          </>
        )}

          {/* TAB 2: DIRECT CONTACT DESK */}
          {activeTab === "channels" && (
            <div className="admin-settings-card">
              <div className="admin-settings-card__header">
                <div className="admin-settings-card__header-left">
                  <PhoneCall size={22} weight="duotone" color="var(--color-peach-deep)" />
                  <div>
                    <h2 className="admin-settings-card__title">Direct Contact Desk</h2>
                    <p className="admin-settings-card__subtitle">
                      Configure customer hotline numbers for telephone dialing and instant WhatsApp chats.
                    </p>
                  </div>
                </div>
              </div>

              <div className="admin-settings-field-group">
                {/* Phone Field */}
                <div className="admin-settings-field-row">
                  <div className="admin-settings-field-label-wrap">
                    <label htmlFor="admin-phone-input" className="admin-field__title">
                      Customer Support Phone Number
                    </label>
                    <a href={phoneLink} className="admin-settings-test-link" title="Test direct dial link">
                      <span>Test Call</span>
                      <ArrowSquareOut size={13} weight="bold" />
                    </a>
                  </div>
                  <input
                    id="admin-phone-input"
                    type="text"
                    placeholder="+91 98000 12345"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                  <p className="admin-field__help">
                    Clicking Phone on the public website triggers telephone dialing protocol (<code>{phoneLink}</code>).
                  </p>
                </div>

                {/* WhatsApp Field */}
                <div className="admin-settings-field-row">
                  <div className="admin-settings-field-label-wrap">
                    <label htmlFor="admin-whatsapp-input" className="admin-field__title">
                      WhatsApp Chat Number
                    </label>
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-settings-test-link"
                      title="Test WhatsApp chat link in new tab"
                    >
                      <span>Test WhatsApp</span>
                      <ArrowSquareOut size={13} weight="bold" />
                    </a>
                  </div>
                  <input
                    id="admin-whatsapp-input"
                    type="text"
                    placeholder="+91 98000 12345 or 9800012345"
                    value={formData.whatsapp}
                    onChange={(e) => handleChange("whatsapp", e.target.value)}
                  />
                  <p className="admin-field__help">
                    Enter full number with country code. Opens direct WhatsApp conversation with prefilled Sikkim inquiry.
                  </p>
                </div>
              </div>

              <div className="admin-settings-btn-row">
                <button type="button" className="admin-btn-primary" onClick={handleSave}>
                  <FloppyDisk size={17} weight="bold" />
                  <span>Save Contact Desk</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SOCIAL MEDIA LINKS */}
          {activeTab === "social" && (
            <div className="admin-settings-card">
              <div className="admin-settings-card__header">
                <div className="admin-settings-card__header-left">
                  <InstagramLogo size={22} weight="duotone" color="#e1306c" />
                  <div>
                    <h2 className="admin-settings-card__title">Social Media Presence</h2>
                    <p className="admin-settings-card__subtitle">
                      Link Lama Bhai's official Instagram and Facebook pages to build traveler trust.
                    </p>
                  </div>
                </div>
              </div>

              <div className="admin-settings-field-group">
                {/* Instagram Field */}
                <div className="admin-settings-field-row">
                  <div className="admin-settings-field-label-wrap">
                    <label htmlFor="admin-instagram-input" className="admin-field__title">
                      Instagram Profile Link or @Handle
                    </label>
                    <a
                      href={instagramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-settings-test-link"
                      title="Test Instagram link in new tab"
                    >
                      <span>Test Instagram</span>
                      <ArrowSquareOut size={13} weight="bold" />
                    </a>
                  </div>
                  <input
                    id="admin-instagram-input"
                    type="text"
                    placeholder="https://instagram.com/lamabhaitourism or @lamabhaitourism"
                    value={formData.instagram}
                    onChange={(e) => handleChange("instagram", e.target.value)}
                  />
                  <p className="admin-field__help">
                    Resolves to: <code>{instagramLink}</code>
                  </p>
                </div>

                {/* Facebook Field */}
                <div className="admin-settings-field-row">
                  <div className="admin-settings-field-label-wrap">
                    <label htmlFor="admin-facebook-input" className="admin-field__title">
                      Facebook Page URL
                    </label>
                    <a
                      href={facebookLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-settings-test-link"
                      title="Test Facebook link in new tab"
                    >
                      <span>Test Facebook</span>
                      <ArrowSquareOut size={13} weight="bold" />
                    </a>
                  </div>
                  <input
                    id="admin-facebook-input"
                    type="text"
                    placeholder="https://facebook.com/lamabhaitourism"
                    value={formData.facebook}
                    onChange={(e) => handleChange("facebook", e.target.value)}
                  />
                  <p className="admin-field__help">
                    Resolves to: <code>{facebookLink}</code>
                  </p>
                </div>
              </div>

              <div className="admin-settings-btn-row">
                <button type="button" className="admin-btn-primary" onClick={handleSave}>
                  <FloppyDisk size={17} weight="bold" />
                  <span>Save Social Links</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: AGENCY & OPERATIONS */}
          {activeTab === "agency" && (
            <div className="admin-settings-card">
              <div className="admin-settings-card__header">
                <div className="admin-settings-card__header-left">
                  <Buildings size={22} weight="duotone" color="var(--color-navy)" />
                  <div>
                    <h2 className="admin-settings-card__title">Agency & Operations</h2>
                    <p className="admin-settings-card__subtitle">
                      Internal and public agency contact credentials, hours of operation, and headquarters.
                    </p>
                  </div>
                </div>
              </div>

              <div className="admin-settings-field-group">
                <div className="admin-settings-field-row">
                  <label htmlFor="admin-email-input" className="admin-field__title">
                    Official Agency Email
                  </label>
                  <input
                    id="admin-email-input"
                    type="email"
                    placeholder="contact@lamabhaitourism.com"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange("contactEmail", e.target.value)}
                  />
                  <p className="admin-field__help">
                    Primary business address for traveler confirmations and partner communications.
                  </p>
                </div>

                <div className="admin-settings-field-row">
                  <label htmlFor="admin-hours-input" className="admin-field__title">
                    Operational Desk Hours
                  </label>
                  <input
                    id="admin-hours-input"
                    type="text"
                    placeholder="7:00 AM – 9:00 PM IST (Daily)"
                    value={formData.operatingHours}
                    onChange={(e) => handleChange("operatingHours", e.target.value)}
                  />
                </div>

                <div className="admin-settings-field-row">
                  <label htmlFor="admin-location-input" className="admin-field__title">
                    Base / Registered Operating Office
                  </label>
                  <input
                    id="admin-location-input"
                    type="text"
                    placeholder="Gangtok / Mangan, North Sikkim"
                    value={formData.operatingLocation}
                    onChange={(e) => handleChange("operatingLocation", e.target.value)}
                  />
                </div>

                <div className="admin-settings-field-row">
                  <label htmlFor="admin-copyright-input" className="admin-field__title">
                    Website Copyright Year / Notice
                  </label>
                  <input
                    id="admin-copyright-input"
                    type="text"
                    placeholder="2026 or 2024–2026"
                    value={formData.copyrightYear !== undefined ? formData.copyrightYear : "2026"}
                    onChange={(e) => handleChange("copyrightYear", e.target.value)}
                  />
                  <p className="admin-field__help">
                    Displays at the bottom of the public website footer: <code>© {formData.copyrightYear || "2026"} Lama Bhai Tourism &amp; Hospitality. All rights reserved.</code>
                  </p>
                </div>
              </div>

              <div className="admin-settings-btn-row">
                <button type="button" className="admin-btn-primary" onClick={handleSave}>
                  <FloppyDisk size={17} weight="bold" />
                  <span>Save Operational Details</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Hero Card Preview Studio */}
        <div className="admin-settings-preview-wrap">
          <div className="admin-settings-card" style={{ padding: "18px" }}>
            {/* Live Website Header Preview Studio */}
            <div style={{ marginBottom: "20px", paddingBottom: "18px", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "0.80rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-navy)" }}>
                  Live Navigation Bar Preview
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <span style={{ fontSize: "0.70rem", background: "rgba(237,106,75,0.12)", color: "var(--color-peach-deep)", padding: "2px 7px", borderRadius: "10px", fontWeight: 700 }}>
                    {activeLogoPlaque.toUpperCase()} • {activeLogoHeight}px • CONTAINED
                  </span>
                  <span style={{ fontSize: "0.70rem", background: isCustomLogo ? "#DCFCE7" : "rgba(15,24,38,0.06)", color: isCustomLogo ? "#15803D" : "var(--color-navy)", padding: "2px 7px", borderRadius: "10px", fontWeight: 600 }}>
                    {isCustomLogo ? "Custom Active" : "No Logo"}
                  </span>
                </div>
              </div>

              {/* Dynamic Navbar Simulation */}
              <div className="admin-nav-preview-bar">
                {/* Micro Himalayan Scroll Indicator line */}
                <div className="admin-nav-preview-scroll-line" />

                <div className="admin-nav-preview-row">
                  {/* Brand Logo with exact selected plaque & dynamic height */}
                  <div className="admin-nav-preview-brand-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {activeLogo ? (
                      <div className={`admin-nav-preview-plaque--${activeLogoPlaque} admin-nav-preview-logo-box admin-nav-preview-logo-box--${activeLogoShape}`}>
                        <img
                          src={activeLogo}
                          alt="Brand Logo"
                          className={`admin-nav-preview-logo admin-nav-preview-logo--${activeLogoShape}`}
                          style={{
                            height: `${Math.min(activeLogoHeight, 66)}px`,
                            maxHeight: "66px",
                            width: "auto",
                            maxWidth: "160px",
                            objectFit: "contain",
                          }}
                        />
                      </div>
                    ) : null}
                    {(showBrandText || !activeLogo) && (
                      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.86rem", color: "var(--color-navy)", whiteSpace: "nowrap" }}>
                          Lama Bhai
                        </span>
                        <span style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "0.52rem", color: "var(--color-peach-deep)", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                          Tours &amp; Travels
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Clean Nav links */}
                  <div className="admin-nav-preview-links">
                    <div className="admin-nav-preview-link admin-nav-preview-link--active">
                      <span>Home</span>
                    </div>
                    <div className="admin-nav-preview-link">
                      <span>Cars</span>
                    </div>
                    <div className="admin-nav-preview-link">
                      <span>Stays</span>
                    </div>
                  </div>

                  {/* Clean Actions */}
                  <div className="admin-nav-preview-actions">
                    <div className="admin-nav-preview-btn-cta">
                      <span>Plan Trip</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-peach-deep)" }}>
                Live Hero Card Studio
              </span>
              <span style={{ fontSize: "0.72rem", background: "rgba(15,24,38,0.06)", padding: "2px 8px", borderRadius: "12px", color: "var(--color-navy)", fontWeight: 600 }}>
                Instant Homepage Sync
              </span>
            </div>

            {/* Simulated Hero Card with active photo & non-clickable badges */}
            <div className="hero-card" style={{ margin: 0, maxWidth: "100%", boxShadow: "none" }}>
              {/* Scenic Photo */}
              <div
                className="hero-card__media"
                style={{
                  height: "190px",
                  backgroundImage: `url("${activeHeroPhoto}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center 35%",
                }}
              >
                {activeHeroPhoto && (
                  <img
                    src={activeHeroPhoto}
                    alt={heroImageAlt}
                    className="hero-card__image"
                    loading="eager"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <div className="hero-card__media-overlay" />
                <div className="hero-card__badge">
                  <MapPin size={13} weight="fill" color="var(--color-peach)" />
                  <span>{locationBadge}</span>
                </div>
              </div>

              {/* Body */}
              <div className="hero-card__body">
                {/* Services Available Badges (Non-clickable showcase: Stays, Cars, Bikes, Permits) */}
                <div className="hero-card__services-box">
                  <div className="hero-card__services-grid">
                    <div className="hero-card__svc-badge">
                      <Bed size={14} weight="duotone" />
                      <span>Stays</span>
                    </div>
                    <div className="hero-card__svc-badge">
                      <Car size={14} weight="duotone" />
                      <span>Cars</span>
                    </div>
                    <div className="hero-card__svc-badge">
                      <Bicycle size={14} weight="duotone" />
                      <span>Bikes</span>
                    </div>
                    <div className="hero-card__svc-badge">
                      <IdentificationCard size={14} weight="duotone" />
                      <span>Permits</span>
                    </div>
                  </div>
                </div>

                {/* Direct Connect */}
                <div className="hero-card__connect-box">
                  <div className="hero-card__connect-header">
                    <span className="hero-card__connect-title">Direct Connect</span>
                    <span className="hero-card__connect-sub">Local Support Desk</span>
                  </div>

                  <div className="hero-card__channels-grid">
                    <a
                      href={phoneLink}
                      className="hero-card__channel hero-card__channel--phone"
                      title={`Direct Call: ${formData.phone || "+91 98000 12345"}`}
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(phoneLink, "_self");
                      }}
                    >
                      <div className="hero-card__channel-icon-wrap hero-card__channel-icon-wrap--phone">
                        <ModernPhoneIcon size={18} />
                      </div>
                      <div className="hero-card__channel-meta">
                        <span className="hero-card__channel-name">Phone</span>
                        <span className="hero-card__channel-val">Call Now</span>
                      </div>
                    </a>

                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hero-card__channel hero-card__channel--whatsapp"
                      title={`Chat on WhatsApp: ${formData.whatsapp || "+91 98000 12345"}`}
                    >
                      <div className="hero-card__channel-icon-wrap hero-card__channel-icon-wrap--whatsapp">
                        <ModernWhatsAppIcon size={19} />
                      </div>
                      <div className="hero-card__channel-meta">
                        <span className="hero-card__channel-name">WhatsApp</span>
                        <span className="hero-card__channel-val">Chat Now</span>
                      </div>
                    </a>

                    <a
                      href={instagramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hero-card__channel hero-card__channel--instagram"
                      title={instagramLink}
                    >
                      <div className="hero-card__channel-icon-wrap hero-card__channel-icon-wrap--instagram">
                        <ModernInstagramIcon size={18} />
                      </div>
                      <div className="hero-card__channel-meta">
                        <span className="hero-card__channel-name">Instagram</span>
                        <span className="hero-card__channel-val">Follow Us</span>
                      </div>
                    </a>

                    <a
                      href={facebookLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hero-card__channel hero-card__channel--facebook"
                      title={facebookLink}
                    >
                      <div className="hero-card__channel-icon-wrap hero-card__channel-icon-wrap--facebook">
                        <ModernFacebookIcon size={18} />
                      </div>
                      <div className="hero-card__channel-meta">
                        <span className="hero-card__channel-name">Facebook</span>
                        <span className="hero-card__channel-val">Visit Page</span>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Plan Entire Trip Button */}
                <div className="hero-card__plan-btn" style={{ pointerEvents: "none" }}>
                  <span>Plan Entire Trip</span>
                  <ArrowRight size={16} weight="bold" />
                </div>
              </div>
            </div>

            <div style={{ marginTop: "14px", display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>
                Changes made in this panel sync automatically with the public homepage. Click the channels in the preview to test phone and chat redirects.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}