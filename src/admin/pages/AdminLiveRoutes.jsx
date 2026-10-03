import React, { useState, useEffect } from "react";
import {
  Broadcast,
  Plus,
  ArrowClockwise,
  CheckCircle,
  WarningCircle,
  XCircle,
  ShieldCheck,
  PencilSimple,
  Trash,
  Mountains,
  FloppyDisk,
  X,
} from "phosphor-react";
import {
  getLiveRoutes,
  saveLiveRoutes,
  updateRouteStatus,
  addLiveRoute,
  deleteLiveRoute,
  resetLiveRoutesToDefault,
  ROUTE_STATUS_CONFIG,
} from "../../data/liveRoutesStore.js";
import "../styles/admin.css";

export default function AdminLiveRoutes() {
  const [routes, setRoutes] = useState(getLiveRoutes());
  const [editingRoute, setEditingRoute] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    altitude: "",
    region: "North Sikkim",
    category: "north",
    status: "open",
    note: "",
    recommendedVehicle: "Scorpio / Bolero 4x4",
  });

  useEffect(() => {
    function refresh() {
      setRoutes(getLiveRoutes());
    }
    window.addEventListener("storage", refresh);
    window.addEventListener("admin-storage-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("admin-storage-changed", refresh);
    };
  }, []);

  function flashSuccess(msg) {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(""), 3500);
  }

  function handleQuickStatusChange(id, newStatus) {
    updateRouteStatus(id, newStatus);
    setRoutes(getLiveRoutes());
    flashSuccess("Route status updated and synced live to website!");
  }

  function handleStartAdd() {
    setFormData({
      name: "",
      altitude: "",
      region: "North Sikkim",
      category: "north",
      status: "open",
      note: "Route clear and open for travel",
      recommendedVehicle: "Scorpio / Bolero 4x4",
    });
    setIsAdding(true);
    setEditingRoute(null);
  }

  function handleStartEdit(route) {
    setFormData({
      name: route.name,
      altitude: route.altitude || "",
      region: route.region || "North Sikkim",
      category: route.category || "north",
      status: route.status || "open",
      note: route.note || "",
      recommendedVehicle: route.recommendedVehicle || "",
    });
    setEditingRoute(route);
    setIsAdding(false);
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter a location name.");
      return;
    }

    if (isAdding) {
      addLiveRoute({
        name: formData.name.trim(),
        altitude: formData.altitude.trim() || "Altitude TBD",
        region: formData.region.trim(),
        category: formData.category,
        status: formData.status,
        note: formData.note.trim() || "Pass status active",
        recommendedVehicle: formData.recommendedVehicle.trim() || "4x4 / Mountain Vehicle",
      });
      flashSuccess(`Added "${formData.name.trim()}" to live routes!`);
    } else if (editingRoute) {
      const updated = routes.map((r) => {
        if (r.id === editingRoute.id) {
          return {
            ...r,
            name: formData.name.trim(),
            altitude: formData.altitude.trim(),
            region: formData.region.trim(),
            category: formData.category,
            status: formData.status,
            note: formData.note.trim(),
            recommendedVehicle: formData.recommendedVehicle.trim(),
            lastUpdated: "Updated just now",
          };
        }
        return r;
      });
      saveLiveRoutes(updated);
      flashSuccess(`Updated "${formData.name.trim()}"!`);
    }

    setIsAdding(false);
    setEditingRoute(null);
    setRoutes(getLiveRoutes());
  }

  function handleDelete(id, name) {
    if (window.confirm(`Are you sure you want to remove "${name}" from the live route board?`)) {
      deleteLiveRoute(id);
      setRoutes(getLiveRoutes());
      flashSuccess(`Removed "${name}".`);
    }
  }

  function handleReset() {
    if (window.confirm("Reset all routes back to default Sikkim passes and locations? Any custom routes will be restored.")) {
      resetLiveRoutesToDefault();
      setRoutes(getLiveRoutes());
      flashSuccess("Reset all routes to default Sikkim network.");
    }
  }

  // Summary counts
  const countOpen = routes.filter((r) => r.status === "open").length;
  const countAdvisory = routes.filter((r) => r.status === "advisory").length;
  const countClosed = routes.filter((r) => r.status === "closed").length;
  const countPermit = routes.filter((r) => r.status === "permit").length;

  return (
    <div className="admin-page" style={{ padding: "24px 32px", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ display: "inline-flex", p: 6, background: "rgba(34, 197, 94, 0.15)", borderRadius: "8px", color: "#22c55e" }}>
              <Broadcast size={24} weight="duotone" />
            </span>
            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--color-navy, #0F1826)", margin: 0 }}>
              Live Mountain Pass & Route Clearance Status
            </h1>
          </div>
          <p style={{ color: "#64748b", margin: 0, fontSize: "14px", maxWidth: "700px" }}>
            Control real-time road conditions, high-altitude pass availability, and defense permit clearance shown directly on the website hero. Changes sync live across the website instantly.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleReset}
            className="btn btn--secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 14px" }}
            title="Reset to default locations"
          >
            <ArrowClockwise size={16} /> Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleStartAdd}
            className="btn btn--primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", padding: "9px 18px", fontWeight: "600" }}
          >
            <Plus size={18} weight="bold" /> Add New Location
          </button>
        </div>
      </div>

      {/* Success notification banner */}
      {saveSuccessMsg && (
        <div
          style={{
            background: "rgba(34, 197, 94, 0.12)",
            border: "1px solid rgba(34, 197, 94, 0.35)",
            color: "#15803d",
            padding: "12px 18px",
            borderRadius: "10px",
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle size={20} weight="fill" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Real-time status counter bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", fontWeight: "600" }}>Total Tracked</span>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#0F1826", marginTop: "4px" }}>{routes.length} Locations</div>
        </div>
        <div style={{ background: "rgba(34, 197, 94, 0.08)", padding: "16px 20px", borderRadius: "12px", border: "1px solid rgba(34, 197, 94, 0.25)" }}>
          <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#166534", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
            Route Open & Clear
          </span>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#166534", marginTop: "4px" }}>{countOpen}</div>
        </div>
        <div style={{ background: "rgba(245, 158, 11, 0.08)", padding: "16px 20px", borderRadius: "12px", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
          <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#92400e", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }}></span>
            4x4 Only / Advisory
          </span>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#92400e", marginTop: "4px" }}>{countAdvisory}</div>
        </div>
        <div style={{ background: "rgba(56, 189, 248, 0.08)", padding: "16px 20px", borderRadius: "12px", border: "1px solid rgba(56, 189, 248, 0.25)" }}>
          <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#0369a1", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0284c7", display: "inline-block" }}></span>
            Special Permit Active
          </span>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#0369a1", marginTop: "4px" }}>{countPermit}</div>
        </div>
        <div style={{ background: "rgba(239, 68, 68, 0.08)", padding: "16px 20px", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
          <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#991b1b", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }}></span>
            Temporarily Closed
          </span>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#991b1b", marginTop: "4px" }}>{countClosed}</div>
        </div>
      </div>

      {/* Routes List Table */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "14px 20px", fontWeight: "600", color: "#475569" }}>Location & Altitude</th>
                <th style={{ padding: "14px 20px", fontWeight: "600", color: "#475569" }}>Region</th>
                <th style={{ padding: "14px 20px", fontWeight: "600", color: "#475569" }}>Live Status (1-Click Toggle)</th>
                <th style={{ padding: "14px 20px", fontWeight: "600", color: "#475569" }}>Current Road Condition Note</th>
                <th style={{ padding: "14px 20px", fontWeight: "600", color: "#475569", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => {
                const config = ROUTE_STATUS_CONFIG[route.status] || ROUTE_STATUS_CONFIG.open;
                return (
                  <tr key={route.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontWeight: "700", color: "#0F1826", fontSize: "15px" }}>{route.name}</div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                        <Mountains size={13} />
                        <span>{route.altitude}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px", color: "#475569", fontSize: "13px" }}>
                      <span style={{ background: "#f1f5f9", padding: "4px 10px", borderRadius: "6px", fontWeight: "500" }}>
                        {route.region}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <select
                        value={route.status}
                        onChange={(e) => handleQuickStatusChange(route.id, e.target.value)}
                        style={{
                          background: config.bg,
                          color: config.color === "#22c55e" ? "#166534" : config.color === "#f59e0b" ? "#92400e" : config.color === "#38bdf8" ? "#0369a1" : "#991b1b",
                          border: `1.5px solid ${config.border}`,
                          borderRadius: "8px",
                          padding: "6px 12px",
                          fontWeight: "700",
                          fontSize: "13px",
                          cursor: "pointer",
                          outline: "none",
                        }}
                      >
                        <option value="open">🟢 Route Open & Clear</option>
                        <option value="advisory">🟡 4x4 Only / Advisory</option>
                        <option value="closed">🔴 Temporarily Closed</option>
                        <option value="permit">🔵 Special Permit Active</option>
                      </select>
                    </td>
                    <td style={{ padding: "16px 20px", color: "#334155", fontSize: "13px", maxWidth: "340px" }}>
                      <div>{route.note}</div>
                      {route.recommendedVehicle && (
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                          🚗 Vehicle: {route.recommendedVehicle}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(route)}
                          title="Edit location details"
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            padding: "6px 10px",
                            cursor: "pointer",
                            color: "#334155",
                          }}
                        >
                          <PencilSimple size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(route.id, route.name)}
                          title="Delete route"
                          style={{
                            background: "rgba(239, 68, 68, 0.08)",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            borderRadius: "6px",
                            padding: "6px 10px",
                            cursor: "pointer",
                            color: "#ef4444",
                          }}
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(isAdding || editingRoute) && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 24, 38, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px 32px",
              width: "100%",
              maxWidth: "560px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0F1826", margin: 0 }}>
                {isAdding ? "Add New Location / Pass" : `Edit "${editingRoute.name}"`}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingRoute(null);
                }}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gurudongmar Lake, Zero Point, Dzongu"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Altitude (e.g. 17,800 ft)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 17,800 ft"
                    value={formData.altitude}
                    onChange={(e) => setFormData({ ...formData, altitude: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Region / Sector
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. North Sikkim, East Sikkim"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Category Filter
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  >
                    <option value="north">North Sikkim (High Passes)</option>
                    <option value="east">East Sikkim (Border Routes)</option>
                    <option value="reserve">Tribal / Cultural Reserves</option>
                    <option value="west">West Sikkim</option>
                    <option value="south">South Sikkim</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Live Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "600" }}
                  >
                    <option value="open">🟢 Route Open & Clear</option>
                    <option value="advisory">🟡 4x4 Only / Advisory</option>
                    <option value="closed">🔴 Temporarily Closed</option>
                    <option value="permit">🔵 Special Permit Active</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Road Condition & Permit Note *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Sub-zero pass open • Army permits issuing normally"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", fontFamily: "inherit" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Recommended Vehicle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scorpio / Bolero 4x4, Innova Crysta"
                  value={formData.recommendedVehicle}
                  onChange={(e) => setFormData({ ...formData, recommendedVehicle: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingRoute(null);
                  }}
                  className="btn btn--secondary"
                  style={{ padding: "10px 18px", fontSize: "14px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 22px", fontSize: "14px", fontWeight: "600" }}
                >
                  <FloppyDisk size={18} weight="bold" />
                  {isAdding ? "Save & Publish Route" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
