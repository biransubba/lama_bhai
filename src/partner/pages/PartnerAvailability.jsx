import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  PencilSimple,
  Clock,
  Eye,
  Info,
  ShieldCheck,
  MapPin,
  MagnifyingGlass,
  Bed,
  CaretDown,
  CaretUp,
  SlidersHorizontal,
} from "phosphor-react";
import { usePartnerAuth } from "../context/PartnerAuthContext.jsx";
import { staysStore, getAllRoomsByPropertyId, updateRoom } from "../../data/staysStore.js";
import PropertyRoomsManagerModal from "../../admin/components/PropertyRoomsManagerModal.jsx";

export default function PartnerAvailability() {
  const { currentPartner, partnerStays, partnerRooms, refreshAll } = usePartnerAuth();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [editingStay, setEditingStay] = useState(null);
  const [statusNote, setStatusNote] = useState("");
  const [expandedStayIds, setExpandedStayIds] = useState(() => new Set());
  const [roomModalStay, setRoomModalStay] = useState(null);

  const availableCount = partnerStays.filter((s) => s.availability === "available").length;
  const unavailableCount = partnerStays.length - availableCount;

  const availableRoomsCount = partnerRooms.filter((r) => r.availability === "available").length;
  const unavailableRoomsCount = partnerRooms.length - availableRoomsCount;

  function toggleExpandStay(id) {
    setExpandedStayIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAvailability(stay) {
    const nextStatus = stay.availability === "available" ? "unavailable" : "available";
    staysStore.update("id", stay.id, {
      availability: nextStatus,
      availabilityUpdatedAt: new Date().toISOString(),
    });
    refreshAll();
  }

  function toggleRoomAvailability(room) {
    const nextStatus = room.availability === "available" ? "unavailable" : "available";
    updateRoom(room.id, { availability: nextStatus });
    refreshAll();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin-storage-changed", { detail: { repo: "admin_rooms" } }));
      window.dispatchEvent(new CustomEvent("storage"));
    }
  }

  function handleOpenNoteEdit(stay) {
    setEditingStay(stay);
    setStatusNote(stay.availabilityNote || "");
  }

  function handleSaveNote(e) {
    e.preventDefault();
    if (!editingStay) return;
    staysStore.update("id", editingStay.id, {
      availabilityNote: statusNote.trim() || null,
      availabilityUpdatedAt: new Date().toISOString(),
    });
    setEditingStay(null);
    refreshAll();
  }

  const filteredStays = partnerStays.filter((stay) => {
    const matchSearch =
      !search ||
      stay.name.toLowerCase().includes(search.toLowerCase()) ||
      stay.location.toLowerCase().includes(search.toLowerCase());
    const matchFilter = !filter || stay.availability === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "var(--space-md)" }}>
        <div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            Property &amp; Room Availability ({partnerStays.length})
          </h1>
          <p className="admin-page-note" style={{ margin: "4px 0 0" }}>
            Availability management for properties assigned to <strong>{currentPartner?.name}</strong>.
          </p>
        </div>
      </div>

      {/* Guide Card */}
      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderLeft: "4px solid #16a34a",
          borderRadius: "var(--radius-sm)",
          padding: "12px 16px",
          marginBottom: "var(--space-lg)",
          fontSize: "0.84rem",
          color: "#166534",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
        }}
      >
        <ShieldCheck size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <strong>Manual Coordination:</strong> Availability indicates whether your homestay is currently accepting guest inquiries. Toggle between <em>Available</em> and <em>Unavailable</em> as needed. Availability status is kept separate from customer booking requests and does not claim automatic calendar synchronization or automatic inventory locking.
        </div>
      </div>

      {/* Status Summary Bar */}
      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "var(--space-lg)" }}>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "var(--color-navy)" }}>
            {partnerStays.length}
          </span>
          <span className="admin-stat-card__label">Assigned Properties</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "#16a34a" }}>
            {availableCount}
          </span>
          <span className="admin-stat-card__label">Properties Open</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "var(--color-peach-deep)" }}>
            {partnerRooms.length}
          </span>
          <span className="admin-stat-card__label">Total Room Units</span>
        </div>

        <div className="admin-stat-card">
          <span
            className="admin-stat-card__value"
            style={{ color: availableRoomsCount > 0 ? "#16a34a" : "#dc2626" }}
          >
            {availableRoomsCount} / {partnerRooms.length}
          </span>
          <span className="admin-stat-card__label">Rooms Available</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-bar" style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "var(--space-md)" }}>
        <div style={{ position: "relative", flexGrow: 1, maxWidth: "360px" }}>
          <MagnifyingGlass
            size={16}
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search homestays..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ paddingLeft: "32px", width: "100%" }}
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="admin-input"
          style={{ width: "auto" }}
        >
          <option value="">All Availability</option>
          <option value="available">Available Only</option>
          <option value="unavailable">Unavailable Only</option>
        </select>
      </div>

      {/* Availability Management Table */}
      {filteredStays.length === 0 ? (
        <div className="admin-card" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
          <CalendarCheck size={36} color="var(--color-peach-deep)" style={{ marginBottom: "8px" }} />
          <h3 style={{ margin: "0 0 6px", color: "var(--color-navy)" }}>No Properties Found</h3>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            {partnerStays.length === 0
              ? "No properties have been assigned to your host account yet. The platform owner assigns properties in the Main Admin."
              : "No properties match your current search."}
          </p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Location</th>
                <th>Current Status</th>
                <th>Quick 1-Click Toggle</th>
                <th>Operational Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStays.map((stay) => {
                const isAvailable = stay.availability === "available";
                const stayRooms = getAllRoomsByPropertyId(stay.id);
                const stayAvailRooms = stayRooms.filter((r) => r.availability === "available");
                const isExpanded = expandedStayIds.has(stay.id);

                return (
                  <React.Fragment key={stay.id}>
                    <tr>
                      <td>
                        <strong style={{ color: "var(--color-navy)", fontSize: "0.95rem" }}>{stay.name}</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          {stay.type} · ID: {stay.id}
                        </div>
                        <div style={{ marginTop: "4px" }}>
                          <button
                            type="button"
                            onClick={() => toggleExpandStay(stay.id)}
                            style={{
                              padding: "2px 8px",
                              borderRadius: "999px",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              border: isExpanded ? "1px solid var(--color-peach-deep)" : "1px solid var(--color-border)",
                              background: isExpanded ? "var(--color-peach-light)" : "#f8fafc",
                              color: "var(--color-navy)",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title="Click to view and toggle individual room availability"
                          >
                            <Bed size={12} weight="bold" />
                            <span>{stayRooms.length} {stayRooms.length === 1 ? "Room" : "Rooms"} ({stayAvailRooms.length} Open)</span>
                            {isExpanded ? <CaretUp size={11} weight="bold" /> : <CaretDown size={11} weight="bold" />}
                          </button>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          <MapPin size={13} color="var(--color-forest)" /> {stay.location}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: "999px",
                            background: isAvailable ? "#e8f5e9" : "#ffebee",
                            color: isAvailable ? "#1b5e20" : "#b71c1c",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          {isAvailable ? <CheckCircle size={14} weight="fill" /> : <XCircle size={14} weight="fill" />}
                          {isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() => toggleAvailability(stay)}
                          className={`partner-toggle-btn ${
                            isAvailable ? "partner-toggle-btn--available" : "partner-toggle-btn--unavailable"
                          }`}
                          title="Click to toggle property master availability"
                        >
                          {isAvailable ? (
                            <>
                              <XCircle size={14} weight="fill" /> Set Unavailable
                            </>
                          ) : (
                            <>
                              <CheckCircle size={14} weight="fill" /> Set Available
                            </>
                          )}
                        </button>
                      </td>

                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "0.82rem", color: stay.availabilityNote ? "var(--color-navy)" : "var(--color-text-muted)", fontStyle: stay.availabilityNote ? "normal" : "italic" }}>
                            {stay.availabilityNote || "Standard availability"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenNoteEdit(stay)}
                            title="Add or edit availability note"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--color-peach-deep)",
                              padding: "2px",
                            }}
                          >
                            <PencilSimple size={14} />
                          </button>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                          <button
                            type="button"
                            onClick={() => setRoomModalStay(stay)}
                            className="admin-link-btn"
                            style={{ fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "3px", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                            title="Open room manager for this property"
                          >
                            <Bed size={13} weight="bold" /> Manage Rooms
                          </button>

                          <Link
                            to={`/stays/${stay.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-link-btn"
                            style={{ fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "3px" }}
                          >
                            <Eye size={13} /> View on Site
                          </Link>
                        </div>
                      </td>
                    </tr>

                    {/* Room-Level Availability Breakdown (Sub-row) */}
                    {isExpanded && (
                      <tr style={{ background: "#f8fafc" }}>
                        <td colSpan={6} style={{ padding: "12px 20px", borderBottom: "2px solid #e2e8f0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <strong style={{ fontSize: "0.82rem", color: "var(--color-navy)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <Bed size={15} weight="duotone" color="var(--color-peach-deep)" />
                              Room Availability for {stay.name} ({stayRooms.length} {stayRooms.length === 1 ? "unit" : "units"})
                            </strong>
                            <button
                              type="button"
                              onClick={() => setRoomModalStay(stay)}
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-peach-deep)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 700,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              Manage in Room Studio &rarr;
                            </button>
                          </div>

                          {stayRooms.length === 0 ? (
                            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontStyle: "italic", padding: "6px 0" }}>
                              No individual rooms added yet. Click "Manage in Room Studio" to configure rooms.
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {stayRooms.map((room, rIdx) => {
                                const roomAvail = room.availability === "available";
                                return (
                                  <div
                                    key={room.id}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      background: "#ffffff",
                                      border: "1px solid var(--color-border)",
                                      borderRadius: "var(--radius-sm)",
                                      padding: "8px 12px",
                                      fontSize: "0.82rem",
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                      <span style={{ fontWeight: 700, color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                                        #{rIdx + 1}
                                      </span>
                                      <strong style={{ color: "var(--color-navy)" }}>{room.name}</strong>
                                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                        {room.type} {room.capacity ? `· Max ${room.capacity} Guests` : ""} {room.price ? `· ${room.price}` : ""}
                                      </span>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                      <span
                                        style={{
                                          fontSize: "0.72rem",
                                          fontWeight: 700,
                                          padding: "3px 8px",
                                          borderRadius: "999px",
                                          background: roomAvail ? "#e8f5e9" : "#ffebee",
                                          color: roomAvail ? "#1b5e20" : "#b71c1c",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "4px",
                                        }}
                                      >
                                        {roomAvail ? <CheckCircle size={12} weight="fill" /> : <XCircle size={12} weight="fill" />}
                                        {roomAvail ? "Available" : "Blocked"}
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() => toggleRoomAvailability(room)}
                                        className={`partner-toggle-btn ${
                                          roomAvail ? "partner-toggle-btn--available" : "partner-toggle-btn--unavailable"
                                        }`}
                                        style={{ fontSize: "0.72rem", padding: "4px 8px" }}
                                        title="Quick 1-click room availability toggle"
                                      >
                                        {roomAvail ? (
                                          <>
                                            <XCircle size={12} weight="fill" /> Set Blocked
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle size={12} weight="fill" /> Set Available
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Note Modal */}
      {editingStay && (
        <div className="admin-modal-backdrop" onClick={() => setEditingStay(null)}>
          <div
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "460px" }}
          >
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--color-navy)" }}>
                Availability Note: {editingStay.name}
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setEditingStay(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveNote}>
              <div className="admin-modal-body">
                <label className="admin-label">Status Note / Reason</label>
                <input
                  type="text"
                  className="admin-input"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Fully Booked (Apple Harvest Week), Open for Winter Trekkers"
                  autoFocus
                />
                <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "6px" }}>
                  This internal note helps track why rooms are blocked or special guest dates.
                </p>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={() => setEditingStay(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary">
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Property Rooms Manager Modal (Scoped to Partner's Assigned Properties) */}
      {roomModalStay && (
        <PropertyRoomsManagerModal
          property={roomModalStay}
          allProperties={partnerStays}
          onSelectProperty={(stay) => setRoomModalStay(stay)}
          onClose={() => {
            setRoomModalStay(null);
            refreshAll();
          }}
        />
      )}
    </div>
  );
}
