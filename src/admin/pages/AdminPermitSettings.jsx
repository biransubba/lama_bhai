import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Plus,
  PencilSimple,
  Trash,
  ToggleLeft,
  ToggleRight,
  UploadSimple,
  TextAa,
  ListBullets,
  CheckSquare,
  CalendarBlank,
  CheckCircle,
  Eye,
  ArrowClockwise,
  GlobeHemisphereWest,
  Info,
  Sparkle,
  X,
  FileText,
  LockKey,
} from "phosphor-react";
import {
  getAllPermitRequirements,
  savePermitRequirement,
  togglePermitRequirementActive,
  deletePermitRequirement,
  resetPermitRequirementsToDefault,
  PERMIT_FIELD_TYPES,
  TARGET_TRAVELERS,
  PERMIT_DESTINATION_SCOPES,
} from "../../data/permitSettingsStore.js";
import IndiaFlag from "../../components/IndiaFlag.jsx";
import Dropdown from "../../components/Dropdown.jsx";
import "./AdminPermitSettings.css";

export default function AdminPermitSettings() {
  const [requirements, setRequirements] = useState(getAllPermitRequirements());
  const [activeTab, setActiveTab] = useState("all"); // "all" | "file" | "text" | "indian" | "foreign" | "custom"
  const [searchQuery, setSearchQuery] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form Fields
  const [formLabel, setFormLabel] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("file");
  const [formTarget, setFormTarget] = useState("Both");
  const [formDestination, setFormDestination] = useState("All Protected & Restricted Areas");
  const [formRequired, setFormRequired] = useState(true);
  const [formActive, setFormActive] = useState(true);
  const [formOptions, setFormOptions] = useState("");
  const [formAllowedFormats, setFormAllowedFormats] = useState("JPG, JPEG, PNG, PDF");
  const [formPlaceholder, setFormPlaceholder] = useState("");
  const [formError, setFormError] = useState("");

  // Live Simulation state
  const [showPreview, setShowPreview] = useState(false);
  const [previewNationality, setPreviewNationality] = useState("Indian Tourist");

  // Sync state on storage event
  useEffect(() => {
    function refresh() {
      setRequirements(getAllPermitRequirements());
    }
    window.addEventListener("admin-storage-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("admin-storage-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function triggerSuccess(msg) {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(""), 3500);
  }

  // Open modal for Adding new requirement
  function handleOpenAdd() {
    setEditingItem(null);
    setFormLabel("");
    setFormDescription("");
    setFormType("file");
    setFormTarget("Both");
    setFormDestination("All Protected & Restricted Areas");
    setFormRequired(false);
    setFormActive(true);
    setFormOptions("");
    setFormAllowedFormats("JPG, JPEG, PNG, PDF");
    setFormPlaceholder("");
    setFormError("");
    setShowModal(true);
  }

  // Open modal for Editing
  function handleOpenEdit(item) {
    setEditingItem(item);
    setFormLabel(item.label || "");
    setFormDescription(item.description || "");
    setFormType(item.type || "file");
    setFormTarget(item.targetNationality || "Both");
    setFormDestination(item.applicableDestination || "All Protected & Restricted Areas");
    setFormRequired(Boolean(item.required));
    setFormActive(item.active !== false);
    setFormOptions(Array.isArray(item.options) ? item.options.join(", ") : "");
    setFormAllowedFormats(item.allowedFormats || "JPG, JPEG, PNG, PDF");
    setFormPlaceholder(item.placeholder || "");
    setFormError("");
    setShowModal(true);
  }

  // Save (Create or Update)
  function handleSave(e) {
    e.preventDefault();
    if (!formLabel.trim()) {
      setFormError("Requirement Label / Title is required.");
      return;
    }

    const optionsArray =
      formType === "select"
        ? formOptions
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    const reqData = {
      ...(editingItem || {}),
      label: formLabel.trim(),
      description: formDescription.trim(),
      type: formType,
      targetNationality: formTarget,
      applicableDestination: formDestination,
      required: formRequired,
      active: formActive,
      options: optionsArray,
      allowedFormats: formAllowedFormats,
      placeholder: formPlaceholder.trim(),
    };

    savePermitRequirement(reqData);
    setRequirements(getAllPermitRequirements());
    setShowModal(false);
    triggerSuccess(`Successfully saved "${reqData.label}"`);
  }

  // Toggle Active
  function handleToggle(item) {
    togglePermitRequirementActive(item.id);
    setRequirements(getAllPermitRequirements());
    triggerSuccess(`Updated status for "${item.label}"`);
  }

  // Delete
  function handleDelete(item) {
    if (item.isSystemDefault) {
      alert("System Core document requirements cannot be deleted, but you can toggle them Inactive if not needed.");
      return;
    }
    if (window.confirm(`Are you sure you want to remove the requirement "${item.label}"? This will remove it from future public permit applications.`)) {
      deletePermitRequirement(item.id);
      setRequirements(getAllPermitRequirements());
      triggerSuccess(`Deleted "${item.label}"`);
    }
  }

  // Reset to Defaults
  function handleReset() {
    if (window.confirm("Reset all permit document rules to factory defaults? Any custom added requirements will be replaced with standard Sikkim Police PAP defaults.")) {
      const def = resetPermitRequirementsToDefault();
      setRequirements(def);
      triggerSuccess("Reset permit rules to system defaults.");
    }
  }

  // Filtered requirements
  const filtered = requirements.filter((item) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLabel = item.label?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchKey = item.key?.toLowerCase().includes(q);
      if (!matchLabel && !matchDesc && !matchKey) return false;
    }

    // Tabs
    if (activeTab === "file") return item.type === "file";
    if (activeTab === "text") return item.type === "text" || item.type === "select" || item.type === "date";
    if (activeTab === "indian") return item.targetNationality === "Indian Tourist" || item.targetNationality === "Both";
    if (activeTab === "foreign") return item.targetNationality === "Foreign Tourist" || item.targetNationality === "Both";
    if (activeTab === "custom") return !item.isSystemDefault;

    return true;
  });

  // Calculate metrics
  const totalActive = requirements.filter((r) => r.active).length;
  const totalFiles = requirements.filter((r) => r.type === "file" && r.active).length;
  const totalCustom = requirements.filter((r) => !r.isSystemDefault && r.active).length;
  const totalMandatory = requirements.filter((r) => r.required && r.active).length;

  return (
    <div className="admin-page admin-permit-settings">
      {/* 1. Header */}
      <div className="admin-page-header">
        <p className="admin-page-eyebrow">GOVERNMENT PERMIT SYSTEM</p>
        <h1 className="admin-page-title">Permit Document Rules &amp; Feature Manager</h1>
        <p className="admin-page-note">
          Configure and manage all official document, certificate, and verification requirements for Sikkim Protected Area Permits (PAP / RAP).
          Any rule or field added here automatically renders on the public permit booking form and syncs directly into the admin booking dossiers.
        </p>
      </div>

      {/* Success notification */}
      {saveSuccessMsg && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#e8f5ed",
            border: "1px solid #b7dfc7",
            color: "var(--color-forest)",
            padding: "10px 16px",
            borderRadius: "var(--radius-sm)",
            marginBottom: "16px",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          <CheckCircle size={18} weight="bold" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 2. Vital Stats Cards */}
      <div className="admin-permit-stat-grid">
        <div className="admin-permit-stat-card">
          <div className="admin-permit-stat-icon" style={{ background: "rgba(255, 159, 122, 0.15)", color: "var(--color-peach-deep)" }}>
            <ShieldCheck size={24} weight="duotone" />
          </div>
          <div>
            <div className="admin-permit-stat-val">{totalActive}</div>
            <div className="admin-permit-stat-lbl">Active Rules</div>
          </div>
        </div>

        <div className="admin-permit-stat-card">
          <div className="admin-permit-stat-icon" style={{ background: "rgba(33, 150, 243, 0.12)", color: "#1976d2" }}>
            <UploadSimple size={24} weight="duotone" />
          </div>
          <div>
            <div className="admin-permit-stat-val">{totalFiles}</div>
            <div className="admin-permit-stat-lbl">Document Uploads</div>
          </div>
        </div>

        <div className="admin-permit-stat-card">
          <div className="admin-permit-stat-icon" style={{ background: "rgba(224, 109, 68, 0.12)", color: "var(--color-peach-deep)" }}>
            <Sparkle size={24} weight="duotone" />
          </div>
          <div>
            <div className="admin-permit-stat-val">{totalCustom}</div>
            <div className="admin-permit-stat-lbl">Custom Admin Rules</div>
          </div>
        </div>

        <div className="admin-permit-stat-card">
          <div className="admin-permit-stat-icon" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#dc2626" }}>
            <FileText size={24} weight="duotone" />
          </div>
          <div>
            <div className="admin-permit-stat-val">{totalMandatory}</div>
            <div className="admin-permit-stat-lbl">Mandatory Fields</div>
          </div>
        </div>
      </div>

      {/* 3. Action Toolbar */}
      <div className="admin-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
          <input
            type="text"
            className="admin-form-input"
            placeholder="Search requirements by name, keyword, or key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: "380px" }}
          />
          {searchQuery && (
            <button
              type="button"
              className="admin-btn-action"
              onClick={() => setSearchQuery("")}
              style={{ padding: "6px 12px", fontSize: "0.8rem" }}
            >
              Clear
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="admin-btn-primary"
            onClick={handleOpenAdd}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} weight="bold" />
            <span>Add New Requirement</span>
          </button>

          <button
            type="button"
            className="admin-btn-action"
            onClick={() => setShowPreview(!showPreview)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: showPreview ? "var(--color-navy)" : "#ffffff",
              color: showPreview ? "#ffffff" : "var(--color-navy)",
              border: "1px solid var(--color-border)",
            }}
          >
            <Eye size={16} weight="bold" />
            <span>{showPreview ? "Hide Live Simulator" : "Live Form Simulator"}</span>
          </button>

          <button
            type="button"
            className="admin-btn-action"
            onClick={handleReset}
            title="Reset to factory Sikkim PAP requirements"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--color-text-muted)" }}
          >
            <ArrowClockwise size={15} />
            <span>Defaults</span>
          </button>
        </div>
      </div>

      {/* 4. Live Simulation Drawer / Box (if toggled) */}
      {showPreview && (
        <div className="admin-permit-preview-box">
          <div className="admin-permit-preview-header">
            <div>
              <strong style={{ fontSize: "0.95rem", color: "var(--color-navy)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Eye size={18} color="var(--color-peach-deep)" weight="fill" />
                Live Public Website Form Simulation
              </strong>
              <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                This is how the document checklist appears to customers applying on the website.
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-navy)" }}>Viewing as:</span>
              <button
                type="button"
                className={`admin-permit-preview-dest-badge ${previewNationality === "Indian Tourist" ? "admin-permit-tab--active" : ""}`}
                onClick={() => setPreviewNationality("Indian Tourist")}
                style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <IndiaFlag width={18} height={12} />
                <span>Indian Tourist</span>
              </button>
              <button
                type="button"
                className={`admin-permit-preview-dest-badge ${previewNationality === "Foreign Tourist" ? "admin-permit-tab--active" : ""}`}
                onClick={() => setPreviewNationality("Foreign Tourist")}
                style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <GlobeHemisphereWest size={16} color="var(--color-peach-deep)" weight="fill" />
                <span>Foreign Tourist</span>
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {requirements
              .filter(
                (r) =>
                  r.active &&
                  (r.targetNationality === "Both" || r.targetNationality === previewNationality)
              )
              .map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: "#fbf8f5",
                    border: "1px solid var(--color-border)",
                    borderRadius: "6px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <strong style={{ fontSize: "0.85rem", color: "var(--color-navy)" }}>{r.label}</strong>
                    {r.required ? (
                      <span style={{ background: "#fee2e2", color: "#b91c1c", fontSize: "0.7rem", fontWeight: 700, padding: "2px 6px", borderRadius: "3px" }}>
                        Required
                      </span>
                    ) : (
                      <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: "0.7rem", fontWeight: 600, padding: "2px 6px", borderRadius: "3px" }}>
                        Optional
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "0.76rem", color: "var(--color-text-muted)", margin: 0 }}>
                    {r.description || "No description provided."}
                  </p>
                  <div style={{ marginTop: "auto", paddingTop: "6px", borderTop: "1px dashed var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", color: "var(--color-navy)" }}>
                    <span style={{ fontWeight: 600 }}>Type: {r.type.toUpperCase()}</span>
                    {!r.isSystemDefault && (
                      <span style={{ color: "var(--color-peach-deep)", fontWeight: 700 }}>Custom Rule</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 5. Filter Tabs */}
      <div className="admin-permit-tabs">
        <button
          type="button"
          className={`admin-permit-tab ${activeTab === "all" ? "admin-permit-tab--active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <span>All Rules</span>
          <span className="admin-permit-tab-badge">{requirements.length}</span>
        </button>

        <button
          type="button"
          className={`admin-permit-tab ${activeTab === "file" ? "admin-permit-tab--active" : ""}`}
          onClick={() => setActiveTab("file")}
        >
          <UploadSimple size={15} />
          <span>Uploads &amp; Files</span>
          <span className="admin-permit-tab-badge">{requirements.filter((r) => r.type === "file").length}</span>
        </button>

        <button
          type="button"
          className={`admin-permit-tab ${activeTab === "text" ? "admin-permit-tab--active" : ""}`}
          onClick={() => setActiveTab("text")}
        >
          <TextAa size={15} />
          <span>Text &amp; ID Fields</span>
          <span className="admin-permit-tab-badge">{requirements.filter((r) => r.type !== "file").length}</span>
        </button>

        <button
          type="button"
          className={`admin-permit-tab ${activeTab === "indian" ? "admin-permit-tab--active" : ""}`}
          onClick={() => setActiveTab("indian")}
        >
          <IndiaFlag width={18} height={12} />
          <span>Indian Citizens</span>
          <span className="admin-permit-tab-badge">
            {requirements.filter((r) => r.targetNationality === "Indian Tourist" || r.targetNationality === "Both").length}
          </span>
        </button>

        <button
          type="button"
          className={`admin-permit-tab ${activeTab === "foreign" ? "admin-permit-tab--active" : ""}`}
          onClick={() => setActiveTab("foreign")}
        >
          <GlobeHemisphereWest size={16} />
          <span>Foreign Nationals</span>
          <span className="admin-permit-tab-badge">
            {requirements.filter((r) => r.targetNationality === "Foreign Tourist" || r.targetNationality === "Both").length}
          </span>
        </button>

        <button
          type="button"
          className={`admin-permit-tab ${activeTab === "custom" ? "admin-permit-tab--active" : ""}`}
          onClick={() => setActiveTab("custom")}
        >
          <Sparkle size={15} color="var(--color-peach-deep)" />
          <span>Custom Rules Added</span>
          <span className="admin-permit-tab-badge">{requirements.filter((r) => !r.isSystemDefault).length}</span>
        </button>
      </div>

      {/* 6. Requirements Table */}
      <div style={{ background: "#ffffff", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: "32%" }}>Requirement / Document Name</th>
              <th style={{ width: "14%" }}>Type</th>
              <th style={{ width: "16%" }}>Target Travelers</th>
              <th style={{ width: "14%" }}>Requirement</th>
              <th style={{ width: "10%" }}>Status</th>
              <th style={{ width: "14%", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--color-text-muted)" }}>
                  No permit requirements match your search or filter.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} style={{ opacity: item.active ? 1 : 0.65 }}>
                  {/* Name & Desc */}
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <strong style={{ color: "var(--color-navy)", fontSize: "0.9rem" }}>{item.label}</strong>
                        {!item.isSystemDefault ? (
                          <span
                            style={{
                              background: "#fff0eb",
                              color: "var(--color-peach-deep)",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: "3px",
                              border: "1px solid #ffdcd0",
                            }}
                          >
                            Custom
                          </span>
                        ) : (
                          <span
                            title="System Core PAP Requirement"
                            style={{
                              color: "var(--color-text-muted)",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            <LockKey size={13} />
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.3 }}>
                        {item.description || "No instructions specified."}
                      </span>
                      {item.key && (
                        <span style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#94a3b8" }}>
                          key: {item.key}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Type */}
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "var(--color-navy)",
                        background: "var(--color-cream)",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      {item.type === "file" && <UploadSimple size={14} color="var(--color-peach-deep)" />}
                      {item.type === "text" && <TextAa size={14} />}
                      {item.type === "select" && <ListBullets size={14} />}
                      {item.type === "checkbox" && <CheckSquare size={14} />}
                      {item.type === "date" && <CalendarBlank size={14} />}
                      <span>
                        {item.type === "file"
                          ? "File Upload"
                          : item.type === "text"
                          ? "Text Field"
                          : item.type === "select"
                          ? "Dropdown"
                          : item.type === "checkbox"
                          ? "Declaration"
                          : "Date Picker"}
                      </span>
                    </span>
                  </td>

                  {/* Target Nationality */}
                  <td>
                    {item.targetNationality === "Both" && (
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-navy)" }}>
                        Both (All Tourists)
                      </span>
                    )}
                    {item.targetNationality === "Indian Tourist" && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-navy)" }}>
                        <IndiaFlag width={18} height={12} />
                        <span>Indian Only</span>
                      </span>
                    )}
                    {item.targetNationality === "Foreign Tourist" && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 600, color: "#1e40af" }}>
                        <GlobeHemisphereWest size={15} color="#2563eb" weight="fill" />
                        <span>Foreign Only</span>
                      </span>
                    )}
                  </td>

                  {/* Mandatory */}
                  <td>
                    {item.required ? (
                      <span
                        style={{
                          background: "#fee2e2",
                          color: "#991b1b",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        Mandatory
                      </span>
                    ) : (
                      <span
                        style={{
                          background: "#f1f5f9",
                          color: "#64748b",
                          fontSize: "0.74rem",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        Optional
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td>
                    {item.active ? (
                      <span
                        style={{
                          background: "#e8f5ed",
                          color: "var(--color-forest)",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        Active
                      </span>
                    ) : (
                      <span
                        style={{
                          background: "#f1f5f9",
                          color: "#64748b",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        Disabled
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        className="admin-btn-action"
                        onClick={() => handleToggle(item)}
                        title={item.active ? "Deactivate this rule" : "Activate this rule"}
                        style={{ padding: "4px 8px" }}
                      >
                        {item.active ? (
                          <ToggleRight size={18} color="var(--color-forest)" weight="fill" />
                        ) : (
                          <ToggleLeft size={18} color="var(--color-text-muted)" />
                        )}
                      </button>

                      <button
                        type="button"
                        className="admin-btn-action"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit requirement properties"
                        style={{ padding: "4px 8px" }}
                      >
                        <PencilSimple size={15} />
                      </button>

                      {!item.isSystemDefault ? (
                        <button
                          type="button"
                          className="admin-btn-action admin-btn-action--danger"
                          onClick={() => handleDelete(item)}
                          title="Delete custom requirement"
                          style={{ padding: "4px 8px", color: "#dc2626" }}
                        >
                          <Trash size={15} />
                        </button>
                      ) : (
                        <span style={{ width: "24px" }} />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 7. Modal: Add or Edit Requirement */}
      {showModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="admin-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editingItem ? `Edit Requirement: ${editingItem.label}` : "Add New Document / Information Rule"}
              </h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="admin-modal-body">
                {formError && (
                  <div
                    style={{
                      background: "#fee2e2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                    }}
                  >
                    {formError}
                  </div>
                )}

                {/* Requirement Label */}
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Requirement Title / Document Name <span style={{ color: "var(--color-peach-deep)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="e.g. Covid-19 Vaccination Certificate, Parental Consent Letter, etc."
                    required
                  />
                  <span className="admin-form-hint">
                    This exact name will appear as the label on the website application form and in the admin dossier.
                  </span>
                </div>

                {/* Field Type Selector */}
                <div className="admin-form-group">
                  <label className="admin-form-label">Requirement Input Type</label>
                  <div className="admin-radio-pills">
                    {PERMIT_FIELD_TYPES.map((t) => (
                      <div
                        key={t.value}
                        className={`admin-radio-pill ${formType === t.value ? "admin-radio-pill--active" : ""}`}
                        onClick={() => setFormType(t.value)}
                      >
                        {t.value === "file" && <UploadSimple size={16} />}
                        {t.value === "text" && <TextAa size={16} />}
                        {t.value === "select" && <ListBullets size={16} />}
                        {t.value === "checkbox" && <CheckSquare size={16} />}
                        {t.value === "date" && <CalendarBlank size={16} />}
                        <span>{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target Nationality */}
                <div className="admin-form-group">
                  <label className="admin-form-label">Applicable Tourist Category</label>
                  <div className="admin-radio-pills">
                    <div
                      className={`admin-radio-pill ${formTarget === "Both" ? "admin-radio-pill--active" : ""}`}
                      onClick={() => setFormTarget("Both")}
                    >
                      <span>Both (All Tourists)</span>
                    </div>

                    <div
                      className={`admin-radio-pill ${formTarget === "Indian Tourist" ? "admin-radio-pill--active" : ""}`}
                      onClick={() => setFormTarget("Indian Tourist")}
                    >
                      <IndiaFlag width={18} height={12} />
                      <span>Indian Citizens Only</span>
                    </div>

                    <div
                      className={`admin-radio-pill ${formTarget === "Foreign Tourist" ? "admin-radio-pill--active" : ""}`}
                      onClick={() => setFormTarget("Foreign Tourist")}
                    >
                      <GlobeHemisphereWest size={16} color="var(--color-peach-deep)" />
                      <span>Foreign Nationals Only</span>
                    </div>
                  </div>
                </div>

                {/* Target Destination */}
                <div className="admin-form-group">
                  <label className="admin-form-label">Applicable Protected Area / Destination</label>
                  <Dropdown
                    options={PERMIT_DESTINATION_SCOPES}
                    value={formDestination}
                    onChange={(val) => setFormDestination(val)}
                  />
                  <span className="admin-form-hint">
                    Choose "All Protected &amp; Restricted Areas" for general permits, or limit to specific sensitive locations.
                  </span>
                </div>

                {/* Conditional options for Dropdown Select */}
                {formType === "select" && (
                  <div className="admin-form-group">
                    <label className="admin-form-label">Dropdown Choices (Comma-separated)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={formOptions}
                      onChange={(e) => setFormOptions(e.target.value)}
                      placeholder="e.g. Option 1, Option 2, Option 3"
                    />
                    <span className="admin-form-hint">Separate options with commas.</span>
                  </div>
                )}

                {/* Conditional hint for Text input */}
                {formType === "text" && (
                  <div className="admin-form-group">
                    <label className="admin-form-label">Input Field Placeholder</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={formPlaceholder}
                      onChange={(e) => setFormPlaceholder(e.target.value)}
                      placeholder="e.g. Enter document registration number"
                    />
                  </div>
                )}

                {/* Conditional hint for File input */}
                {formType === "file" && (
                  <div className="admin-form-group">
                    <label className="admin-form-label">Allowed File Formats</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={formAllowedFormats}
                      onChange={(e) => setFormAllowedFormats(e.target.value)}
                      placeholder="e.g. JPG, JPEG, PNG, PDF"
                    />
                    <span className="admin-form-hint">Recommended: JPG, PNG, PDF (max 10MB, auto-compressed for speed).</span>
                  </div>
                )}

                {/* Instructions / Description */}
                <div className="admin-form-group">
                  <label className="admin-form-label">Traveler Instructions / Helper Text</label>
                  <textarea
                    className="admin-form-textarea"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Provide guidance to the applicant on what document is required, valid issuing bodies, or specifications..."
                  />
                </div>

                {/* Checkboxes: Required & Active */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label className="admin-checkbox-card">
                    <input
                      type="checkbox"
                      checked={formRequired}
                      onChange={(e) => setFormRequired(e.target.checked)}
                    />
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "var(--color-navy)", display: "block" }}>
                        Mandatory Document
                      </strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        Applicant cannot submit permit form without this.
                      </span>
                    </div>
                  </label>

                  <label className="admin-checkbox-card">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                    />
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "var(--color-navy)", display: "block" }}>
                        Active Status
                      </strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        Show this requirement on the live website now.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn-action"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                >
                  {editingItem ? "Update Requirement" : "Save & Activate Requirement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
