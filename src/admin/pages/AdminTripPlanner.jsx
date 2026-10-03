import React, { useState, useEffect } from "react";
import {
  MapPin,
  MapTrifold,
  Plus,
  PencilSimple,
  Trash,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  CheckCircle,
  FloppyDisk,
  Gear,
  Info,
  Mountains,
  Sparkle,
  Clock,
  Car,
  Bed,
} from "phosphor-react";
import {
  getAllPlannerDestinations,
  savePlannerDestination,
  togglePlannerDestinationActive,
  deletePlannerDestination,
  getAllPlannerCircuits,
  savePlannerCircuit,
  togglePlannerCircuitActive,
  deletePlannerCircuit,
  getPlannerSettings,
  savePlannerSettings,
} from "../../data/plannerStore.js";
import AdminTable from "../components/AdminTable.jsx";
import Dropdown from "../../components/Dropdown.jsx";
import IndiaFlag from "../../components/IndiaFlag.jsx";

const REGION_OPTIONS = ["North Sikkim", "West Sikkim", "East Sikkim", "South Sikkim"];

export default function AdminTripPlanner() {
  const [activeTab, setActiveTab] = useState("destinations"); // "destinations" | "circuits" | "settings"

  // Data states
  const [destinations, setDestinations] = useState(getAllPlannerDestinations());
  const [circuits, setCircuits] = useState(getAllPlannerCircuits());
  const [settings, setSettings] = useState(getPlannerSettings());

  // Modal states
  const [editingDest, setEditingDest] = useState(null);
  const [showDestModal, setShowDestModal] = useState(false);

  const [editingCircuit, setEditingCircuit] = useState(null);
  const [showCircuitModal, setShowCircuitModal] = useState(false);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Sync when storage changes
  useEffect(() => {
    function refresh() {
      setDestinations(getAllPlannerDestinations());
      setCircuits(getAllPlannerCircuits());
      setSettings(getPlannerSettings());
    }
    window.addEventListener("admin-storage-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("admin-storage-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function triggerSuccessNotice(msg) {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(""), 3500);
  }

  // --------------------------------------------------------------------------
  // Destination Handlers
  // --------------------------------------------------------------------------
  function handleToggleDestActive(row) {
    togglePlannerDestinationActive(row.id);
    setDestinations(getAllPlannerDestinations());
    triggerSuccessNotice(`Updated visibility for ${row.name}`);
  }

  function handleDeleteDest(row) {
    if (window.confirm(`Are you sure you want to remove "${row.name}" from the planner?`)) {
      deletePlannerDestination(row.id);
      setDestinations(getAllPlannerDestinations());
      triggerSuccessNotice(`Removed ${row.name}`);
    }
  }

  function handleOpenAddDest() {
    setEditingDest({
      id: "",
      name: "",
      region: "North Sikkim",
      altitude: "",
      category: "",
      badge: "",
      minDays: "2 Nights / 3 Days",
      baseHub: "Lachen",
      highlight: "",
      insiderTip: "",
      permitRequired: true,
      restrictedForForeigners: false,
      foreignAccessNote: "",
      active: true,
    });
    setShowDestModal(true);
  }

  function handleOpenEditDest(row) {
    setEditingDest({ ...row });
    setShowDestModal(true);
  }

  function handleSaveDest(e) {
    e.preventDefault();
    if (!editingDest.name.trim()) return;

    savePlannerDestination({
      ...editingDest,
      name: editingDest.name.trim(),
      altitude: editingDest.altitude?.trim() || "5,000 ft",
      badge: editingDest.badge?.trim() || `${editingDest.altitude || ""} · ${editingDest.category || ""}`,
    });

    setDestinations(getAllPlannerDestinations());
    setShowDestModal(false);
    triggerSuccessNotice(`Saved destination "${editingDest.name}"`);
  }

  // --------------------------------------------------------------------------
  // Circuit Handlers
  // --------------------------------------------------------------------------
  function handleToggleCircuitActive(row) {
    togglePlannerCircuitActive(row.id);
    setCircuits(getAllPlannerCircuits());
    triggerSuccessNotice(`Updated visibility for ${row.name}`);
  }

  function handleDeleteCircuit(row) {
    if (window.confirm(`Are you sure you want to delete circuit "${row.name}"?`)) {
      deletePlannerCircuit(row.id);
      setCircuits(getAllPlannerCircuits());
      triggerSuccessNotice(`Removed circuit ${row.name}`);
    }
  }

  function handleOpenAddCircuit() {
    setEditingCircuit({
      id: "",
      name: "",
      tagline: "",
      places: "",
      altitude: "All Altitudes",
      duration: "3–4 Days",
      badge: "Popular Circuit",
      permitRequired: true,
      highlight: "",
      active: true,
    });
    setShowCircuitModal(true);
  }

  function handleOpenEditCircuit(row) {
    setEditingCircuit({ ...row });
    setShowCircuitModal(true);
  }

  function handleSaveCircuit(e) {
    e.preventDefault();
    if (!editingCircuit.name.trim()) return;

    savePlannerCircuit({
      ...editingCircuit,
      name: editingCircuit.name.trim(),
    });

    setCircuits(getAllPlannerCircuits());
    setShowCircuitModal(false);
    triggerSuccessNotice(`Saved circuit "${editingCircuit.name}"`);
  }

  // --------------------------------------------------------------------------
  // General Settings Handlers
  // --------------------------------------------------------------------------
  function handleSaveSettings(e) {
    e.preventDefault();
    savePlannerSettings(settings);
    triggerSuccessNotice("Planner settings and season notice updated successfully!");
  }

  // --------------------------------------------------------------------------
  // Columns Definition
  // --------------------------------------------------------------------------
  const destColumns = [
    {
      key: "name",
      label: "Destination",
      render: (r) => (
        <div>
          <strong style={{ color: "var(--color-navy)", display: "block" }}>{r.name}</strong>
          <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{r.category || r.highlight}</span>
        </div>
      ),
    },
    { key: "region", label: "Region" },
    { key: "altitude", label: "Altitude" },
    { key: "minDays", label: "Min Pace" },
    { key: "baseHub", label: "Base Hub" },
    {
      key: "permitRequired",
      label: "Permits",
      render: (r) =>
        r.permitRequired ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "#edf5f0",
              color: "var(--color-forest)",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            <ShieldCheck size={14} weight="bold" /> PAP Mandatory
          </span>
        ) : (
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Open Area</span>
        ),
    },
    {
      key: "foreignAccess",
      label: "Foreign Nationals",
      render: (r) =>
        r.restrictedForForeigners ? (
          <span
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "4px",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <IndiaFlag width={15} height={10} />
            <span>Indian Only</span>
          </span>
        ) : (
          <span
            style={{
              background: "#e8f5ed",
              color: "var(--color-forest)",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "4px",
              whiteSpace: "nowrap",
            }}
          >
            ✅ Permitted (PAP/Open)
          </span>
        ),
    },
    {
      key: "active",
      label: "Status",
      render: (r) =>
        r.active !== false ? (
          <span
            style={{
              background: "#e8f5ed",
              color: "var(--color-forest)",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            Active (Visible)
          </span>
        ) : (
          <span
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            Disabled (Hidden)
          </span>
        ),
    },
  ];

  const circuitColumns = [
    {
      key: "name",
      label: "Circuit Name",
      render: (r) => (
        <div>
          <strong style={{ color: "var(--color-navy)", display: "block" }}>{r.name}</strong>
          <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{r.tagline}</span>
        </div>
      ),
    },
    { key: "duration", label: "Duration" },
    { key: "altitude", label: "Altitude" },
    { key: "places", label: "Key Stops" },
    {
      key: "permitRequired",
      label: "Permit",
      render: (r) => (r.permitRequired ? "PAP Required" : "Open"),
    },
    {
      key: "active",
      label: "Status",
      render: (r) =>
        r.active !== false ? (
          <span
            style={{
              background: "#e8f5ed",
              color: "var(--color-forest)",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            Active
          </span>
        ) : (
          <span
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            Hidden
          </span>
        ),
    },
  ];

  return (
    <div className="admin-page">
      {/* 1. Header with Title and Note */}
      <div className="admin-page-header">
        <p className="admin-page-eyebrow">PLANNER MANAGEMENT</p>
        <h1 className="admin-page-title">Trip Planner & Itinerary Settings</h1>
        <p className="admin-page-note">
          Control destinations, curated circuits, permit rules, and seasonal advisories displayed on the public "Plan Your Trip" page.
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

      {/* 2. Distinct Admin Tab Navigation */}
      <div className="admin-planner-tabs">
        <button
          type="button"
          className={`admin-planner-tab ${activeTab === "destinations" ? "admin-planner-tab--active" : ""}`}
          onClick={() => setActiveTab("destinations")}
        >
          <MapPin size={16} weight="bold" />
          <span>Destinations ({destinations.length})</span>
        </button>

        <button
          type="button"
          className={`admin-planner-tab ${activeTab === "circuits" ? "admin-planner-tab--active" : ""}`}
          onClick={() => setActiveTab("circuits")}
        >
          <MapTrifold size={16} weight="bold" />
          <span>Curated Circuits ({circuits.length})</span>
        </button>

        <button
          type="button"
          className={`admin-planner-tab ${activeTab === "settings" ? "admin-planner-tab--active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <Gear size={16} weight="bold" />
          <span>Advisories & General Settings</span>
        </button>
      </div>

      {/* ====================================================================
          TAB 1: DESTINATIONS
          ==================================================================== */}
      {activeTab === "destinations" && (
        <div>
          <div className="admin-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-navy)", fontWeight: 600 }}>
              Showing {destinations.length} destinations ({destinations.filter((d) => d.active !== false).length} active on public website)
            </p>
            <button
              type="button"
              className="admin-btn-primary"
              onClick={handleOpenAddDest}
            >
              <Plus size={16} weight="bold" />
              <span>Add Destination</span>
            </button>
          </div>

          <AdminTable
            columns={destColumns}
            rows={destinations.map((d) => ({ ...d, _rowKey: d.id }))}
            onEdit={handleOpenEditDest}
            onDelete={handleDeleteDest}
            onToggleActive={handleToggleDestActive}
          />
        </div>
      )}

      {/* ====================================================================
          TAB 2: CIRCUITS
          ==================================================================== */}
      {activeTab === "circuits" && (
        <div>
          <div className="admin-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-navy)", fontWeight: 600 }}>
              Showing {circuits.length} curated circuits ({circuits.filter((c) => c.active !== false).length} active on public website)
            </p>
            <button
              type="button"
              className="admin-btn-primary"
              onClick={handleOpenAddCircuit}
            >
              <Plus size={16} weight="bold" />
              <span>Add Circuit</span>
            </button>
          </div>

          <AdminTable
            columns={circuitColumns}
            rows={circuits.map((c) => ({ ...c, _rowKey: c.id }))}
            onEdit={handleOpenEditCircuit}
            onDelete={handleDeleteCircuit}
            onToggleActive={handleToggleCircuitActive}
          />
        </div>
      )}

      {/* ====================================================================
          TAB 3: SETTINGS & SEASON ADVISORIES
          ==================================================================== */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} style={{ maxWidth: "800px" }}>
          {/* Seasonal Notice Banner */}
          <div className="admin-form-section" style={{ background: "var(--color-surface)", padding: "24px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "1.1rem", color: "var(--color-navy)" }}>
              Seasonal Road Advisory Banner
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0 0 16px" }}>
              Displayed at the top of the public "Plan Your Trip" page to inform travelers about current mountain conditions, snowfall, or permits.
            </p>

            <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", cursor: "pointer", fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={settings.showNoticeBanner}
                onChange={(e) => setSettings({ ...settings, showNoticeBanner: e.target.checked })}
                style={{ width: "18px", height: "18px" }}
              />
              <span>Show Season Notice Banner on Public Trip Planner</span>
            </label>

            <label className="admin-field" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Notice Message</span>
              <textarea
                rows="2"
                value={settings.noticeBanner}
                onChange={(e) => setSettings({ ...settings, noticeBanner: e.target.value })}
                className="admin-input"
                style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontFamily: "inherit" }}
              />
            </label>
          </div>

          {/* Response Promise */}
          <div className="admin-form-section" style={{ background: "var(--color-surface)", padding: "24px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "1.1rem", color: "var(--color-navy)" }}>
              Traveler Communication Promise
            </h3>
            <label className="admin-field" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Response Time Badge</span>
              <input
                type="text"
                value={settings.responseTimeText}
                onChange={(e) => setSettings({ ...settings, responseTimeText: e.target.value })}
                className="admin-input"
                style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
              />
            </label>
          </div>

          {/* Vehicle Offerings */}
          <div className="admin-form-section" style={{ background: "var(--color-surface)", padding: "24px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "1.1rem", color: "var(--color-navy)" }}>
              Available Vehicle Categories in Planner
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.enableSuv}
                  onChange={(e) => setSettings({ ...settings, enableSuv: e.target.checked })}
                />
                <span>4x4 High-Clearance SUV (Scorpio / Bolero)</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.enableMuv}
                  onChange={(e) => setSettings({ ...settings, enableMuv: e.target.checked })}
                />
                <span>Comfort Family MUV (Toyota Innova)</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.enableCab}
                  onChange={(e) => setSettings({ ...settings, enableCab: e.target.checked })}
                />
                <span>Standard Mountain Cab (Sumo / Swift)</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.enableBikes}
                  onChange={(e) => setSettings({ ...settings, enableBikes: e.target.checked })}
                />
                <span>Royal Enfield Adventure Bikes</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn--primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px" }}
          >
            <FloppyDisk size={18} weight="bold" />
            <span>Save Planner Settings</span>
          </button>
        </form>
      )}

      {/* ====================================================================
          MODAL: ADD / EDIT DESTINATION
          ==================================================================== */}
      {showDestModal && editingDest && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <div className="admin-modal__backdrop" onClick={() => setShowDestModal(false)} />
          <div className="admin-modal__panel" style={{ maxWidth: "560px" }}>
            <h2 className="admin-modal__title">
              {editingDest.id ? `Edit ${editingDest.name}` : "Add New Destination"}
            </h2>

            <form onSubmit={handleSaveDest} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <label className="admin-field">
                <span>Destination Name *</span>
                <input
                  type="text"
                  required
                  value={editingDest.name}
                  onChange={(e) => setEditingDest({ ...editingDest, name: e.target.value })}
                  placeholder="e.g. Gurudongmar Lake"
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label className="admin-field">
                  <span>Region</span>
                  <select
                    value={editingDest.region}
                    onChange={(e) => setEditingDest({ ...editingDest, region: e.target.value })}
                  >
                    {REGION_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </label>

                <label className="admin-field">
                  <span>Altitude</span>
                  <input
                    type="text"
                    value={editingDest.altitude}
                    onChange={(e) => setEditingDest({ ...editingDest, altitude: e.target.value })}
                    placeholder="e.g. 17,800 ft"
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label className="admin-field">
                  <span>Min Recommended Pace</span>
                  <input
                    type="text"
                    value={editingDest.minDays}
                    onChange={(e) => setEditingDest({ ...editingDest, minDays: e.target.value })}
                    placeholder="e.g. 2 Nights / 3 Days"
                  />
                </label>

                <label className="admin-field">
                  <span>Base Hub Village</span>
                  <input
                    type="text"
                    value={editingDest.baseHub}
                    onChange={(e) => setEditingDest({ ...editingDest, baseHub: e.target.value })}
                    placeholder="e.g. Lachen"
                  />
                </label>
              </div>

              <div style={{ background: "var(--color-cream)", padding: "12px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={editingDest.permitRequired}
                    onChange={(e) => setEditingDest({ ...editingDest, permitRequired: e.target.checked })}
                  />
                  <span>Requires Protected Area Permit (PAP)</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600, color: editingDest.restrictedForForeigners ? "#991b1b" : "inherit" }}>
                  <input
                    type="checkbox"
                    checked={editingDest.restrictedForForeigners || false}
                    onChange={(e) => setEditingDest({ ...editingDest, restrictedForForeigners: e.target.checked })}
                  />
                  <span>Restricted to Indian Citizens Only (Foreign Nationals Restricted)</span>
                </label>

                {editingDest.restrictedForForeigners && (
                  <label className="admin-field" style={{ margin: 0 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#991b1b" }}>Defense Restriction Note for International Visitors</span>
                    <input
                      type="text"
                      value={editingDest.foreignAccessNote || ""}
                      onChange={(e) => setEditingDest({ ...editingDest, foreignAccessNote: e.target.value })}
                      placeholder="e.g. Restricted to Indian citizens only (Defense border checkpost)."
                    />
                  </label>
                )}
              </div>

              <label className="admin-field">
                <span>Short Highlight</span>
                <input
                  type="text"
                  value={editingDest.highlight}
                  onChange={(e) => setEditingDest({ ...editingDest, highlight: e.target.value })}
                  placeholder="e.g. Sacred frozen high-altitude lake"
                />
              </label>

              <label className="admin-field">
                <span>Local Insider Tip (Shown in Dynamic Insight)</span>
                <textarea
                  rows="2"
                  value={editingDest.insiderTip}
                  onChange={(e) => setEditingDest({ ...editingDest, insiderTip: e.target.value })}
                  placeholder="e.g. Vehicles depart by 4:00 AM. Requires 1 night stay at Lachen for acclimatization."
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => setShowDestModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary">
                  Save Destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: ADD / EDIT CIRCUIT
          ==================================================================== */}
      {showCircuitModal && editingCircuit && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <div className="admin-modal__backdrop" onClick={() => setShowCircuitModal(false)} />
          <div className="admin-modal__panel" style={{ maxWidth: "560px" }}>
            <h2 className="admin-modal__title">
              {editingCircuit.id ? `Edit ${editingCircuit.name}` : "Add New Circuit"}
            </h2>

            <form onSubmit={handleSaveCircuit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <label className="admin-field">
                <span>Circuit Name *</span>
                <input
                  type="text"
                  required
                  value={editingCircuit.name}
                  onChange={(e) => setEditingCircuit({ ...editingCircuit, name: e.target.value })}
                  placeholder="e.g. North Sikkim High Lakes Circuit"
                />
              </label>

              <label className="admin-field">
                <span>Tagline</span>
                <input
                  type="text"
                  value={editingCircuit.tagline}
                  onChange={(e) => setEditingCircuit({ ...editingCircuit, tagline: e.target.value })}
                  placeholder="e.g. Sacred high lakes & rhododendron valleys"
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label className="admin-field">
                  <span>Duration</span>
                  <input
                    type="text"
                    value={editingCircuit.duration}
                    onChange={(e) => setEditingCircuit({ ...editingCircuit, duration: e.target.value })}
                    placeholder="e.g. 3–4 Days"
                  />
                </label>

                <label className="admin-field">
                  <span>Badge Tag</span>
                  <input
                    type="text"
                    value={editingCircuit.badge}
                    onChange={(e) => setEditingCircuit({ ...editingCircuit, badge: e.target.value })}
                    placeholder="e.g. Most Popular"
                  />
                </label>
              </div>

              <label className="admin-field">
                <span>Key Destinations / Places Included</span>
                <input
                  type="text"
                  value={editingCircuit.places}
                  onChange={(e) => setEditingCircuit({ ...editingCircuit, places: e.target.value })}
                  placeholder="e.g. Gurudongmar Lake, Yumthang Valley, Zero Point, Lachen & Lachung"
                />
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={editingCircuit.permitRequired}
                  onChange={(e) => setEditingCircuit({ ...editingCircuit, permitRequired: e.target.checked })}
                />
                <span>Requires Protected Area Permit (PAP)</span>
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => setShowCircuitModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary">
                  Save Circuit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
