import React, { useState, useMemo } from "react";
import { MagnifyingGlass } from "phosphor-react";
import {
  getAllBookingRequests,
  updateBookingRequestStatus,
  BOOKING_STATUSES,
  SERVICE_TYPES,
  getDetailValue,
  getInventoryForBooking,
} from "../../utils/bookingStorage.js";
import { staysStore } from "../../data/staysStore.js";
import { carModelsRepo } from "../../data/vehicles.js";
import { bikeModelsRepo } from "../../data/bikes.js";
import BookingDetailModal from "../components/BookingDetailModal.jsx";
import Dropdown from "../../components/Dropdown.jsx";
import IndiaFlag from "../../components/IndiaFlag.jsx";

function buildSummaryColumns(service) {
  switch (service) {
    case "Car":
      return [
        {
          label: "Vehicle",
          render: (r) => {
            const inv = getInventoryForBooking(r);
            const val = inv?.name || getDetailValue(r, "Vehicle");
            return val !== "—" ? val : (r.inventoryId || "—");
          },
        },
        {
          label: "Route",
          render: (r) =>
            getDetailValue(r, "Destination Route") !== "—"
              ? getDetailValue(r, "Destination Route")
              : (getDetailValue(r, "Route") || "—"),
        },
        {
          label: "Passengers",
          render: (r) => (r.travellers ? `${r.travellers} pax` : (getDetailValue(r, "Passengers") || "—")),
        },
      ];
    case "Bike":
      return [
        {
          label: "Bike",
          render: (r) => {
            const inv = getInventoryForBooking(r);
            const val =
              inv?.name ||
              (getDetailValue(r, "Bike Model") !== "—"
                ? getDetailValue(r, "Bike Model")
                : getDetailValue(r, "Bike"));
            return val !== "—" ? val : (r.inventoryId || "—");
          },
        },
        {
          label: "Route",
          render: (r) =>
            getDetailValue(r, "Riding Route") !== "—"
              ? getDetailValue(r, "Riding Route")
              : (getDetailValue(r, "Route") || "—"),
        },
        {
          label: "Duration",
          render: (r) =>
            getDetailValue(r, "Rental Duration") !== "—"
              ? getDetailValue(r, "Rental Duration")
              : "—",
        },
      ];
    case "Stay":
      return [
        {
          label: "Property",
          render: (r) => {
            const inv = getInventoryForBooking(r);
            const propName = r.propertyName || inv?.propertyName || (inv && !inv.roomName ? inv.name : null) || getDetailValue(r, "Property");
            return propName !== "—" ? propName : (r.propertyId || r.inventoryId || "—");
          },
        },
        {
          label: "Room",
          render: (r) => {
            const inv = getInventoryForBooking(r);
            const roomName = r.roomName || inv?.roomName || getDetailValue(r, "Room") || getDetailValue(r, "Selected Room");
            if (roomName && roomName !== "—") return roomName;
            if (r.roomId) return r.roomId;
            return "Whole Property";
          },
        },
        {
          label: "Location",
          render: (r) => {
            const inv = getInventoryForBooking(r);
            return inv?.location || getDetailValue(r, "Location");
          },
        },
        {
          label: "Nights",
          render: (r) => (r.nights ? `${r.nights} night(s)` : (getDetailValue(r, "Nights") || "—")),
        },
      ];
    case "Permit":
      return [
        {
          label: "Nationality",
          render: (r) => {
            const nat = r.nationality || getDetailValue(r, "Nationality");
            if (nat === "Foreign Tourist") {
              return (
                <span
                  style={{
                    background: "#fef3c7",
                    color: "#92400e",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    display: "inline-block",
                  }}
                >
                  🌍 Foreign
                </span>
              );
            }
            return (
              <span
                style={{
                  background: "#e0f2fe",
                  color: "#0369a1",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <IndiaFlag width={15} height={10} />
                <span>Indian</span>
              </span>
            );
          },
        },
        {
          label: "Destination",
          render: (r) => r.permitData?.destination || getDetailValue(r, "Destination"),
        },
        {
          label: "Travellers",
          render: (r) => (r.travellers ? `${r.travellers} pax` : (getDetailValue(r, "Travellers") || "1 pax")),
        },
        {
          label: "Official Docs",
          render: (r) => {
            const docCount = r.permitData?.documentCount;
            if (docCount && docCount > 0) {
              return (
                <span
                  style={{
                    background: "#e8f5e9",
                    color: "#1b5e20",
                    fontWeight: 700,
                    fontSize: "0.74rem",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  ✓ {docCount} Docs Attached
                </span>
              );
            }
            return (
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.74rem" }}>
                Pending / Basic
              </span>
            );
          },
        },
      ];
    case "Plan My Trip":
      return [
        {
          label: "Nationality",
          render: (r) => {
            const nat = r.nationality || getDetailValue(r, "Nationality");
            if (nat === "Foreign Tourist") {
              return (
                <span
                  style={{
                    background: "#fef3c7",
                    color: "#b45309",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    display: "inline-block",
                  }}
                >
                  🌍 Foreign
                </span>
              );
            }
            return (
              <span
                style={{
                  background: "#e0f2fe",
                  color: "#0369a1",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <IndiaFlag width={15} height={10} />
                <span>Indian</span>
              </span>
            );
          },
        },
        {
          label: "Places / Route",
          render: (r) =>
            getDetailValue(r, "Selected Destination(s)") !== "—"
              ? getDetailValue(r, "Selected Destination(s)")
              : getDetailValue(r, "Circuits") !== "—"
              ? getDetailValue(r, "Circuits")
              : getDetailValue(r, "Destinations"),
        },
        {
          label: "Travellers",
          render: (r) => (r.travellers ? `${r.travellers} pax` : (getDetailValue(r, "Travellers") || "—")),
        },
        {
          label: "Vehicle",
          render: (r) =>
            getDetailValue(r, "Vehicle Preference") !== "—"
              ? getDetailValue(r, "Vehicle Preference")
              : (getDetailValue(r, "Transport preference") || "—"),
        },
      ];
    default:
      return [];
  }
}

export default function AdminBookingRequests() {
  const [requests, setRequests] = useState(getAllBookingRequests());
  const [serviceFilter, setServiceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  React.useEffect(() => {
    function refresh() {
      setRequests(getAllBookingRequests());
    }
    window.addEventListener("admin-storage-changed", refresh);
    window.addEventListener("booking-cancelled", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("admin-storage-changed", refresh);
      window.removeEventListener("booking-cancelled", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function handleStatusChange(id, status) {
    updateBookingRequestStatus(id, status);
    const updated = getAllBookingRequests();
    setRequests(updated);
    if (selected?.id === id) setSelected(updated.find((r) => r.id === id));
  }

  // Dynamically aggregate properties & vehicles based on service selection and current records
  const propertyVehicleOptions = useMemo(() => {
    const list = [];
    const seen = new Set();

    function addOpt(val, lbl, category) {
      if (!val || seen.has(val)) return;
      seen.add(val);
      list.push({
        value: val,
        label: category && !serviceFilter ? `[${category}] ${lbl}` : lbl,
      });
    }

    if (!serviceFilter || serviceFilter === "Stay") {
      staysStore.getAll().forEach((s) => addOpt(s.id, s.name, "Stay"));
    }
    if (!serviceFilter || serviceFilter === "Car") {
      carModelsRepo.getAll().forEach((m) => addOpt(m.slug, m.name, "Car"));
    }
    if (!serviceFilter || serviceFilter === "Bike") {
      bikeModelsRepo.getAll().forEach((b) => addOpt(b.slug, b.name, "Bike"));
    }

    // Also include any property/vehicle names from existing requests
    requests.forEach((r) => {
      if (serviceFilter && r.service !== serviceFilter) return;
      const prop = getDetailValue(r, "Property");
      const veh = getDetailValue(r, "Vehicle");
      const bike =
        getDetailValue(r, "Bike Model") !== "—"
          ? getDetailValue(r, "Bike Model")
          : getDetailValue(r, "Bike");

      if (prop !== "—") addOpt(r.inventoryId || prop, prop, "Stay");
      if (veh !== "—") addOpt(r.inventoryId || veh, veh, "Car");
      if (bike !== "—") addOpt(r.inventoryId || bike, bike, "Bike");
    });

    return list;
  }, [serviceFilter, requests]);

  let filtered = requests;
  if (serviceFilter !== "") filtered = filtered.filter((r) => r.service === serviceFilter);
  if (statusFilter !== "") filtered = filtered.filter((r) => r.status === statusFilter);

  if (propertyFilter !== "") {
    const pLow = propertyFilter.toLowerCase();
    filtered = filtered.filter((r) => {
      if (r.inventoryId && (r.inventoryId === propertyFilter || r.inventoryId.toLowerCase() === pLow)) {
        return true;
      }
      if (r.propertyId && (r.propertyId === propertyFilter || r.propertyId.toLowerCase() === pLow)) {
        return true;
      }
      const inv = getInventoryForBooking(r);
      if (inv) {
        if (inv.id && (inv.id === propertyFilter || inv.id.toLowerCase() === pLow)) return true;
        if (inv.propertyId && (inv.propertyId === propertyFilter || inv.propertyId.toLowerCase() === pLow)) return true;
        if (inv.slug && (inv.slug === propertyFilter || inv.slug.toLowerCase() === pLow)) return true;
        if (inv.name && inv.name.toLowerCase() === pLow) return true;
        if (inv.propertyName && (inv.propertyName === propertyFilter || inv.propertyName.toLowerCase() === pLow)) return true;
      }
      const prop = (getDetailValue(r, "Property") || "").toLowerCase();
      const veh = (getDetailValue(r, "Vehicle") || "").toLowerCase();
      const bike = (getDetailValue(r, "Bike Model") || getDetailValue(r, "Bike") || "").toLowerCase();
      return prop === pLow || veh === pLow || bike === pLow ||
             prop.includes(pLow) || veh.includes(pLow) || bike.includes(pLow);
    });
  }

  if (dateFilter !== "") {
    filtered = filtered.filter((r) => {
      const travelDate = r.date || "";
      const submittedDate = r.submittedAt ? r.submittedAt.slice(0, 10) : "";
      if (travelDate.includes(dateFilter) || submittedDate.includes(dateFilter)) return true;
      try {
        const parsed = new Date(travelDate);
        if (!isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === dateFilter) {
          return true;
        }
      } catch {}
      return false;
    });
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((r) =>
      (r.name || "").toLowerCase().includes(q) ||
      (r.phone || "").toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q) ||
      (r.id || "").toLowerCase().includes(q) ||
      (r.inventoryId || "").toLowerCase().includes(q) ||
      (r.permitData?.destination || "").toLowerCase().includes(q) ||
      (r.permitData?.gangtokHotel || "").toLowerCase().includes(q) ||
      (r.permitData?.leadTraveler?.idNumber || "").toLowerCase().includes(q) ||
      (r.permitData?.leadTraveler?.passportNumber || "").toLowerCase().includes(q) ||
      (r.details || []).some((d) => (d.value || "").toLowerCase().includes(q))
    );
  }

  const sorted = [...filtered].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  const cancelledCount = requests.filter((r) => r.status === "Cancelled").length;
  const hasActiveFilters = Boolean(serviceFilter || statusFilter || propertyFilter || dateFilter || search);

  return (
    <div>
      <h1 className="admin-page-title">Booking Requests</h1>
      <p className="admin-page-note">
        Customer requests submitted through Car, Bike, and Stay bookings, Permit assistance, and Plan My Trip.
        Review inquiries, filter by service, property/vehicle, date, or status, and contact guests directly for trip confirmations.
        Availability is managed separately and does not claim automatic calendar synchronization or automatic inventory locking.
      </p>

      {cancelledCount > 0 && (
        <div
          style={{
            background: "#fff1f2",
            border: "1.5px solid #fecdd3",
            borderLeft: "4px solid #e11d48",
            borderRadius: "var(--radius-sm)",
            padding: "12px 16px",
            marginBottom: "var(--space-md)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <strong style={{ color: "#9f1239" }}>
              Notice: {cancelledCount} {cancelledCount === 1 ? "booking has" : "bookings have"} been cancelled by guests.
            </strong>
            <p style={{ margin: "2px 0 0", fontSize: "0.84rem", color: "#be123c" }}>
              Inquiry cancelled by guest. Review inventory availability manually if dates were blocked.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: "0.8rem", borderColor: "#e11d48", color: "#9f1239" }}
            onClick={() => setStatusFilter("Cancelled")}
          >
            Filter Cancelled Requests
          </button>
        </div>
      )}

      <div className="admin-toolbar" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: "10px" }}>
        <label className="admin-inline-field" style={{ minWidth: 200, flex: "1 1 200px" }}>
          <span>Search</span>
          <div className="admin-search-box">
            <MagnifyingGlass size={16} />
            <input
              type="text"
              placeholder="Name, phone, ID, details…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </label>

        <div style={{ minWidth: 160, flex: "0 1 160px" }}>
          <Dropdown
            label="Service"
            options={SERVICE_TYPES}
            value={serviceFilter}
            onChange={(val) => {
              setServiceFilter(val);
              setPropertyFilter(""); // reset property selection on service change
            }}
            placeholder="All Services"
            light
          />
        </div>

        <div style={{ minWidth: 220, flex: "1 1 220px" }}>
          <Dropdown
            label="Property / Vehicle"
            options={propertyVehicleOptions}
            value={propertyFilter}
            onChange={setPropertyFilter}
            placeholder={serviceFilter ? `All ${serviceFilter}s` : "All Properties & Vehicles"}
            light
          />
        </div>

        <label className="admin-inline-field" style={{ minWidth: 160, flex: "0 1 160px" }}>
          <span>Travel / Date</span>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                fontSize: "0.85rem",
                color: "var(--color-navy)",
                background: "#ffffff",
                width: "100%",
              }}
            />
            {dateFilter && (
              <button
                type="button"
                className="admin-link-btn"
                onClick={() => setDateFilter("")}
                title="Clear date filter"
                style={{ fontSize: "0.78rem", whiteSpace: "nowrap", padding: "4px" }}
              >
                Clear
              </button>
            )}
          </div>
        </label>

        <div style={{ minWidth: 160, flex: "0 1 160px" }}>
          <Dropdown
            label="Status"
            options={BOOKING_STATUSES}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            light
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={() => {
              setServiceFilter("");
              setStatusFilter("");
              setPropertyFilter("");
              setDateFilter("");
              setSearch("");
            }}
            style={{
              padding: "9px 14px",
              fontSize: "0.82rem",
              alignSelf: "flex-end",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="admin-page-note">No requests match this filter.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Summary</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const cols = buildSummaryColumns(r.service);
                return (
                  <tr key={r.id}>
                    <td>{r.service}</td>
                    <td>{r.name || "Not provided"}</td>
                    <td>{r.date || "—"}</td>
                    <td>{cols.map((c) => `${c.label}: ${c.render(r)}`).join(" · ")}</td>
                    <td>{new Date(r.submittedAt).toLocaleString()}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <select
                          value={r.status}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          style={{
                            fontWeight: r.status === "Cancelled" ? 700 : 500,
                            color: r.status === "Cancelled" ? "#991b1b" : "inherit",
                          }}
                        >
                          {BOOKING_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        {r.status === "Cancelled" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                color: "#dc2626",
                                background: "#fee2e2",
                                padding: "2px 6px",
                                borderRadius: "3px",
                                display: "inline-block",
                              }}
                            >
                              Cancelled by {r.cancelledBy || "Guest"}
                            </span>
                            {r.cancellationReason && (
                              <span style={{ fontSize: "0.7rem", color: "#b91c1c", maxWidth: "160px", lineHeight: 1.2 }}>
                                {r.cancellationReason}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <button type="button" className="admin-link-btn" onClick={() => setSelected(r)}>
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <BookingDetailModal
          request={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}