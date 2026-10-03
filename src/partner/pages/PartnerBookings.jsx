import React, { useState } from "react";
import {
  CalendarCheck,
  Phone,
  EnvelopeSimple,
  Users,
  Moon,
  Clock,
  CheckCircle,
  Eye,
  MagnifyingGlass,
  WarningCircle,
  ArrowCounterClockwise,
  XCircle,
  Bed,
} from "phosphor-react";
import { usePartnerAuth } from "../context/PartnerAuthContext.jsx";
import { updateBookingRequestStatus, BOOKING_STATUSES } from "../../utils/bookingStorage.js";
import { staysStore, getRoomById, updateRoom } from "../../data/staysStore.js";

export default function PartnerBookings() {
  const { currentPartner, partnerStays, partnerBookings, refreshAll } = usePartnerAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bannerNotice, setBannerNotice] = useState("");

  // Map stay ID to name and full object
  const stayMap = {};
  const stayObjMap = {};
  partnerStays.forEach((s) => {
    stayMap[s.id] = s.name;
    stayObjMap[s.id] = s;
  });

  // Resolves both parent Property and individual Room for any stay booking enquiry
  function resolveBookingTarget(b) {
    if (!b) return { propertyId: null, propertyName: "Stay", roomId: null, roomName: null, roomObj: null };
    const targetRoomId = b.roomId || (b.inventoryId?.startsWith("room_") ? b.inventoryId : null);
    const targetPropertyId = b.propertyId || (b.inventoryId && !b.inventoryId.startsWith("room_") ? b.inventoryId : null);

    const room = targetRoomId ? getRoomById(targetRoomId) : null;
    const propId = targetPropertyId || room?.propertyId || b.inventoryId;
    const propObj = stayObjMap[propId] || (propId ? staysStore.getById(propId) : null);
    const propertyName = propObj?.name || stayMap[propId] || b.propertyName || "Assigned Stay";
    const roomName = room?.name || b.roomName || (b.details?.find((d) => d.label === "Room")?.value) || null;

    return {
      propertyId: propId,
      propertyName,
      propertyObj: propObj,
      roomId: targetRoomId || room?.id || null,
      roomName,
      roomObj: room,
    };
  }

  function handleReopenRoomAvailability(booking) {
    if (!booking) return;
    const target = resolveBookingTarget(booking);
    if (target.roomId) {
      updateRoom(target.roomId, { availability: "available" });
    }
    if (target.propertyId) {
      staysStore.update("id", target.propertyId, { availability: "available" });
    }
    refreshAll();
    const title = target.roomName ? `${target.propertyName} (${target.roomName})` : target.propertyName;
    setBannerNotice(`Availability for "${title}" has been successfully set to "Available".`);
    setTimeout(() => setBannerNotice(""), 6000);
  }

  function handleStatusChange(requestId, newStatus) {
    updateBookingRequestStatus(requestId, newStatus);
    refreshAll();
    if (selectedBooking && selectedBooking.id === requestId) {
      setSelectedBooking({ ...selectedBooking, status: newStatus });
    }
  }

  // Filter scoped bookings
  const filteredBookings = partnerBookings.filter((b) => {
    const target = resolveBookingTarget(b);
    const matchSearch =
      !search ||
      (b.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.phone || "").toLowerCase().includes(search.toLowerCase()) ||
      target.propertyName.toLowerCase().includes(search.toLowerCase()) ||
      (target.roomName || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "var(--space-md)" }}>
        <div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            Guest Booking Inquiries ({partnerBookings.length})
          </h1>
          <p className="admin-page-note" style={{ margin: "4px 0 0" }}>
            Direct reservation requests from travelers for properties managed by <strong>{currentPartner?.name}</strong>. Availability is managed separately and does not claim automatic calendar synchronization.
          </p>
        </div>
      </div>

      {/* Action Notification Banner */}
      {bannerNotice && (
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderLeft: "4px solid #10b981",
            borderRadius: "var(--radius-sm)",
            padding: "10px 14px",
            marginBottom: "var(--space-md)",
            fontSize: "0.85rem",
            color: "#065f46",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle size={18} weight="fill" color="#10b981" />
            <span>{bannerNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerNotice("")}
            style={{ background: "none", border: "none", color: "#065f46", cursor: "pointer", fontWeight: 700 }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Cancellation Notice Banner */}
      {partnerBookings.filter((b) => b.status === "Cancelled").length > 0 && (
        <div
          style={{
            background: "#fff5f5",
            border: "1px solid #fed7d7",
            borderLeft: "4px solid #e53e3e",
            borderRadius: "var(--radius-sm)",
            padding: "12px 16px",
            marginBottom: "var(--space-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <WarningCircle size={22} color="#e53e3e" weight="fill" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: "#9b2c2c", fontSize: "0.88rem" }}>
                {partnerBookings.filter((b) => b.status === "Cancelled").length} booking inquiry{" "}
                {partnerBookings.filter((b) => b.status === "Cancelled").length === 1 ? "was" : "were"} cancelled by travelers
              </strong>
              <div style={{ fontSize: "0.78rem", color: "#742a2a", marginTop: "2px" }}>
                You can manually adjust property availability below or on the Availability tab.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter((prev) => (prev === "Cancelled" ? "" : "Cancelled"))}
            className="admin-btn admin-btn--secondary"
            style={{
              fontSize: "0.78rem",
              padding: "4px 10px",
              background: statusFilter === "Cancelled" ? "#fed7d7" : "transparent",
              color: "#9b2c2c",
              border: "1px solid #feb2b2",
            }}
          >
            {statusFilter === "Cancelled" ? "Show All Inquiries" : `Filter Cancelled (${partnerBookings.filter((b) => b.status === "Cancelled").length})`}
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="admin-filter-bar" style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "var(--space-md)" }}>
        <div style={{ position: "relative", flexGrow: 1, maxWidth: "360px" }}>
          <MagnifyingGlass
            size={16}
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search guest name, phone, property..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ paddingLeft: "32px", width: "100%" }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-input"
          style={{ width: "auto" }}
        >
          <option value="">All Inquiry Statuses</option>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table of Inquiries */}
      {filteredBookings.length === 0 ? (
        <div className="admin-card" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
          <CalendarCheck size={36} color="var(--color-peach-deep)" style={{ marginBottom: "8px" }} />
          <h3 style={{ margin: "0 0 6px", color: "var(--color-navy)" }}>No Inquiries Found</h3>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            {partnerBookings.length === 0
              ? "When guests request a stay at your homestays, their requests will appear here immediately."
              : "No requests match your current search and filter settings."}
          </p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Property &amp; Room</th>
                <th>Guest</th>
                <th>Contact</th>
                <th>Check-in Date</th>
                <th>Party Size</th>
                <th>Status</th>
                <th>Update Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => {
                const target = resolveBookingTarget(b);

                return (
                  <tr key={b.id}>
                    <td>
                      <strong style={{ color: "var(--color-navy)", fontSize: "0.9rem", display: "block" }}>
                        {target.propertyName}
                      </strong>
                      {target.roomName ? (
                        <div
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: 600,
                            color: "var(--color-navy)",
                            background: "var(--color-peach-light)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            marginTop: "4px",
                          }}
                        >
                          <Bed size={12} weight="bold" color="var(--color-peach-deep)" />
                          <span>{target.roomName}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", display: "block", marginTop: "2px" }}>
                          Main Property Unit
                        </span>
                      )}
                    </td>

                    <td>
                      <strong style={{ color: "var(--color-navy)" }}>{b.name || "Guest"}</strong>
                      <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>ID: {b.id}</div>
                    </td>

                    <td>
                      <div style={{ fontSize: "0.82rem" }}>
                        <div>{b.phone || "—"}</div>
                        {b.email && <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>{b.email}</div>}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{b.date || "Requested"}</span>
                      {b.nights && (
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          {b.nights} {b.nights === 1 ? "night" : "nights"}
                        </div>
                      )}
                    </td>

                    <td>
                      <span style={{ fontSize: "0.82rem" }}>
                        {b.travellers ? `${b.travellers} Guests` : "—"}
                      </span>
                    </td>

                    <td>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background:
                            b.status === "Confirmed"
                              ? "#e8f5e9"
                              : b.status === "New"
                              ? "#fff8e1"
                              : b.status === "Cancelled"
                              ? "#ffebee"
                              : "#f1f5f9",
                          color:
                            b.status === "Confirmed"
                              ? "#1b5e20"
                              : b.status === "New"
                              ? "#b78103"
                              : b.status === "Cancelled"
                              ? "#b71c1c"
                              : "#334155",
                        }}
                      >
                        {b.status === "Cancelled" ? "Cancelled by Guest" : b.status}
                      </span>
                      {b.status === "Cancelled" && b.cancellationReason && (
                        <div style={{ fontSize: "0.72rem", color: "#c53030", marginTop: "3px", maxWidth: "160px", lineHeight: 1.2 }}>
                          {b.cancellationReason}
                        </div>
                      )}
                    </td>

                    <td>
                      <select
                        value={b.status}
                        onChange={(e) => handleStatusChange(b.id, e.target.value)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          border: "1px solid var(--color-border)",
                          background: "var(--color-surface)",
                        }}
                      >
                        {BOOKING_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-start" }}>
                        <button
                          type="button"
                          className="admin-link-btn"
                          onClick={() => setSelectedBooking(b)}
                          style={{ fontSize: "0.8rem", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        >
                          View &rarr;
                        </button>
                        {b.status === "Cancelled" && (
                          <button
                            type="button"
                            onClick={() => handleReopenRoomAvailability(b)}
                            className="admin-btn admin-btn--secondary"
                            style={{
                              fontSize: "0.72rem",
                              padding: "2px 7px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              color: "var(--color-navy)",
                              border: "1px solid var(--color-peach)",
                              background: "rgba(232, 165, 140, 0.12)",
                              whiteSpace: "nowrap",
                            }}
                            title="Re-open availability for this reservation"
                          >
                            <ArrowCounterClockwise size={11} weight="bold" />
                            Re-open Availability
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Guest Details Modal */}
      {selectedBooking && (() => {
        const selectedTarget = resolveBookingTarget(selectedBooking);

        return (
          <div className="admin-modal-backdrop" onClick={() => setSelectedBooking(null)}>
            <div
              className="admin-modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "560px" }}
            >
              <div className="admin-modal-header">
                <h3 style={{ margin: 0, fontSize: "1.15rem", color: "var(--color-navy)" }}>
                  Guest Inquiry Details
                </h3>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setSelectedBooking(null)}
                >
                  &times;
                </button>
              </div>

              <div className="admin-modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", paddingBottom: "12px", borderBottom: "1px solid var(--color-border)" }}>
                  <div>
                    <h4 style={{ margin: "0 0 2px", color: "var(--color-navy)", fontSize: "1.1rem" }}>
                      {selectedBooking.name || "Guest"}
                    </h4>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                      Request ID: {selectedBooking.id}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "999px",
                      background:
                        selectedBooking.status === "Confirmed"
                          ? "#e8f5e9"
                          : selectedBooking.status === "New"
                          ? "#fff8e1"
                          : selectedBooking.status === "Cancelled"
                          ? "#ffebee"
                          : "#f1f5f9",
                      color:
                        selectedBooking.status === "Confirmed"
                          ? "#1b5e20"
                          : selectedBooking.status === "New"
                          ? "#b78103"
                          : selectedBooking.status === "Cancelled"
                          ? "#b71c1c"
                          : "#334155",
                    }}
                  >
                    {selectedBooking.status === "Cancelled" ? "Cancelled by Guest" : selectedBooking.status}
                  </span>
                </div>

                {selectedBooking.status === "Cancelled" && (
                  <div
                    style={{
                      background: "#fff5f5",
                      border: "1px solid #fed7d7",
                      borderLeft: "4px solid #e53e3e",
                      borderRadius: "var(--radius-sm)",
                      padding: "12px 14px",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#c53030", fontWeight: 700, fontSize: "0.9rem" }}>
                      <XCircle size={18} weight="fill" />
                      Reservation Cancelled by Guest
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px", fontSize: "0.82rem" }}>
                      <div>
                        <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", display: "block", fontWeight: 600 }}>
                          Cancellation Date
                        </span>
                        <strong style={{ color: "var(--color-navy)" }}>
                          {selectedBooking.cancelledAt ? new Date(selectedBooking.cancelledAt).toLocaleString() : "Recently cancelled"}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", display: "block", fontWeight: 600 }}>
                          Reason
                        </span>
                        <strong style={{ color: "#c53030" }}>
                          {selectedBooking.cancellationReason || "Guest requested cancellation"}
                        </strong>
                      </div>
                    </div>
                    {selectedBooking.cancellationNotes && (
                      <div style={{ marginTop: "10px", background: "#fff", border: "1px dashed #feb2b2", borderRadius: "4px", padding: "8px 10px", fontSize: "0.82rem", color: "#4a5568" }}>
                        <strong>Guest Remarks:</strong> {selectedBooking.cancellationNotes}
                      </div>
                    )}
                    <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #fed7d7", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        Availability status:{" "}
                        <strong style={{ color: selectedTarget.propertyObj?.availability === "available" ? "#16a34a" : "#b71c1c" }}>
                          {selectedTarget.propertyObj?.availability === "available" ? "Open (Available)" : "Blocked/Unavailable"}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleReopenRoomAvailability(selectedBooking)}
                        className="admin-btn admin-btn--secondary"
                        style={{
                          fontSize: "0.78rem",
                          padding: "4px 10px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          color: "var(--color-navy)",
                          border: "1px solid var(--color-peach)",
                          background: "rgba(232, 165, 140, 0.15)",
                        }}
                      >
                        <ArrowCounterClockwise size={13} weight="bold" />
                        Re-open Availability
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      Requested Property
                    </label>
                    <div style={{ fontWeight: 600, color: "var(--color-navy)", marginTop: "2px" }}>
                      {selectedTarget.propertyName}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                      Property ID: <code>{selectedTarget.propertyId || "—"}</code>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      Requested Room Unit
                    </label>
                    <div style={{ fontWeight: 600, color: "var(--color-navy)", marginTop: "2px" }}>
                      {selectedTarget.roomName ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Bed size={13} weight="bold" color="var(--color-peach-deep)" />
                          {selectedTarget.roomName}
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>
                          Main Property Unit
                        </span>
                      )}
                    </div>
                    {selectedTarget.roomId && (
                      <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                        Room ID: <code>{selectedTarget.roomId}</code>
                      </div>
                    )}
                  </div>

                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Check-in Date
                  </label>
                  <div style={{ fontWeight: 600, color: "var(--color-navy)", marginTop: "2px" }}>
                    {selectedBooking.date || "Scheduled date"}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Phone Number
                  </label>
                  <div style={{ fontWeight: 600, color: "var(--color-navy)", marginTop: "2px" }}>
                    {selectedBooking.phone || "—"}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Email Address
                  </label>
                  <div style={{ fontWeight: 600, color: "var(--color-navy)", marginTop: "2px" }}>
                    {selectedBooking.email || "—"}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Number of Guests
                  </label>
                  <div style={{ fontWeight: 600, color: "var(--color-navy)", marginTop: "2px" }}>
                    {selectedBooking.travellers ? `${selectedBooking.travellers} People` : "Not specified"}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Nights Requested
                  </label>
                  <div style={{ fontWeight: 600, color: "var(--color-navy)", marginTop: "2px" }}>
                    {selectedBooking.nights ? `${selectedBooking.nights} Nights` : "Not specified"}
                  </div>
                </div>
              </div>

              {selectedBooking.details && selectedBooking.details.length > 0 && (
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                    Stay &amp; Meal Preferences
                  </label>
                  <div
                    style={{
                      background: "rgba(232, 165, 140, 0.08)",
                      border: "1px solid rgba(232, 165, 140, 0.3)",
                      borderRadius: "var(--radius-sm)",
                      padding: "10px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {selectedBooking.details
                      .filter((d) => d.label !== "Property" && d.label !== "Check-in Date" && d.label !== "Nights" && d.label !== "Guests")
                      .map((d) => (
                        <div key={d.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", fontSize: "0.84rem" }}>
                          <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>{d.label}:</span>
                          <span style={{ color: "var(--color-navy)", fontWeight: 700, textAlign: "right" }}>{d.value}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {selectedBooking.notes && (
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Guest Special Requests &amp; Notes
                  </label>
                  <div
                    style={{
                      background: "#f8fafc",
                      padding: "10px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.85rem",
                      color: "var(--color-navy)",
                      marginTop: "4px",
                      lineHeight: 1.4,
                    }}
                  >
                    {selectedBooking.notes}
                  </div>
                </div>
              )}

              {/* Status Update Dropdown */}
              <div>
                <label className="admin-label">Update Status</label>
                <select
                  value={selectedBooking.status}
                  onChange={(e) => handleStatusChange(selectedBooking.id, e.target.value)}
                  className="admin-input"
                >
                  {BOOKING_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    })()}
    </div>
  );
}
