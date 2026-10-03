import React, { useState, useEffect } from "react";
import {
  Plus,
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  WarningCircle,
  ShieldWarning,
  MapPin,
  Phone,
  EnvelopeSimple,
  PencilSimple,
  Trash,
  HouseLine,
  ArrowSquareOut,
  ArrowsClockwise,
  Clock,
  UserCheck,
  UserMinus,
  Info,
  Check,
} from "phosphor-react";
import {
  getAllPartners,
  partnersRepo,
  assignPropertyToPartner,
  unassignProperty,
  setPartnerAssignedProperties,
  updatePartnerStatus,
} from "../../data/partners.js";
import { staysStore } from "../../data/staysStore.js";
import { partnerFields } from "../config/fieldSchemas.js";
import { generateUniqueId, PARTNER_STATUSES } from "../../data/schema.js";
import AdminFormModal from "../components/AdminFormModal.jsx";
import Dropdown from "../../components/Dropdown.jsx";

export default function AdminPartners() {
  const [partners, setPartners] = useState(getAllPartners());
  const [stays, setStays] = useState(staysStore.getAll());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [editingPartner, setEditingPartner] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [assigningPartner, setAssigningPartner] = useState(null);
  const [selectedStayIds, setSelectedStayIds] = useState([]);
  const [staySearch, setStaySearch] = useState("");

  function refresh() {
    setPartners(getAllPartners());
    setStays(staysStore.getAll());
  }

  useEffect(() => {
    refresh();

    function onStorageChanged() {
      refresh();
    }
    window.addEventListener("storage", onStorageChanged);
    window.addEventListener("admin-storage-changed", onStorageChanged);
    return () => {
      window.removeEventListener("storage", onStorageChanged);
      window.removeEventListener("admin-storage-changed", onStorageChanged);
    };
  }, []);

  function handleSave(values) {
    if (editingPartner) {
      const updates = {
        ...values,
      };
      if (values.status === "Approved" && editingPartner.status !== "Approved") {
        updates.reviewedAt = new Date().toISOString();
      }
      partnersRepo.update("id", editingPartner.id, updates);
    } else {
      const newId = generateUniqueId("partner", values.location || "host");
      const initialStatus = values.status || "Pending";
      partnersRepo.add({
        id: newId,
        assignedPropertyIds: [],
        status: initialStatus,
        ...values,
        submittedAt: new Date().toISOString(),
        reviewedAt: initialStatus === "Approved" ? new Date().toISOString() : null,
      });
    }
    refresh();
    setShowFormModal(false);
    setEditingPartner(null);
  }

  function handleStatusChange(partnerId, newStatus, reviewerNotes = "") {
    updatePartnerStatus(partnerId, newStatus, reviewerNotes);
    refresh();
  }

  function handleDelete(partner) {
    if (
      !window.confirm(
        `Are you sure you want to delete partner "${partner.name}" (${partner.agency || partner.id})?\n\nAll assigned stays will become unassigned.`
      )
    ) {
      return;
    }

    // Unassign properties first
    (partner.assignedPropertyIds || []).forEach((propId) => {
      unassignProperty(propId);
    });

    partnersRepo.remove("id", partner.id);
    refresh();
  }

  function handleOpenAssignModal(partner) {
    const isApproved = partner.status === "Approved" || partner.status === "approved";
    if (!isApproved) {
      const shouldApprove = window.confirm(
        `Partner "${partner.name}" is currently "${partner.status || "Pending"}".\n\nOnly Approved partners can manage properties in the Host Portal.\n\nWould you like to APPROVE this partner now and continue to property assignment?`
      );
      if (shouldApprove) {
        updatePartnerStatus(partner.id, "Approved", "Approved by admin for property assignment");
        refresh();
        const updated = getAllPartners().find((p) => p.id === partner.id);
        setAssigningPartner(updated || partner);
        setSelectedStayIds(updated?.assignedPropertyIds || partner.assignedPropertyIds || []);
        setStaySearch("");
      }
      return;
    }

    setAssigningPartner(partner);
    setSelectedStayIds(partner.assignedPropertyIds || []);
    setStaySearch("");
  }

  function handleToggleStaySelection(stayId) {
    setSelectedStayIds((prev) => {
      if (prev.includes(stayId)) {
        return prev.filter((id) => id !== stayId);
      } else {
        return [...prev, stayId];
      }
    });
  }

  function handleSaveAssignments() {
    if (!assigningPartner) return;
    setPartnerAssignedProperties(assigningPartner.id, selectedStayIds);
    refresh();
    setAssigningPartner(null);
  }

  function handleQuickUnassign(propertyId) {
    unassignProperty(propertyId);
    refresh();
  }

  // Filtered partners
  const filtered = partners.filter((p) => {
    if (statusFilter && statusFilter !== "All") {
      if ((p.status || "").toLowerCase() !== statusFilter.toLowerCase()) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = (p.name || "").toLowerCase().includes(q);
      const matchAgency = (p.agency || "").toLowerCase().includes(q);
      const matchLoc = (p.location || "").toLowerCase().includes(q);
      const matchPhone = (p.phone || "").toLowerCase().includes(q);
      const matchEmail = (p.email || "").toLowerCase().includes(q);
      const matchId = (p.id || "").toLowerCase().includes(q);
      if (!matchName && !matchAgency && !matchLoc && !matchPhone && !matchEmail && !matchId) return false;
    }
    return true;
  });

  // Overview stats
  const totalCount = partners.length;
  const approvedCount = partners.filter(
    (p) => (p.status || "").toLowerCase() === "approved"
  ).length;
  const pendingCount = partners.filter(
    (p) => (p.status || "").toLowerCase() === "pending"
  ).length;
  const suspendedCount = partners.filter(
    (p) => (p.status || "").toLowerCase() === "suspended"
  ).length;
  const inactiveOrRejectedCount = partners.filter((p) => {
    const s = (p.status || "").toLowerCase();
    return s === "inactive" || s === "rejected";
  }).length;
  const assignedStaysCount = stays.filter((s) => s.partnerId).length;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "var(--space-md)",
        }}
      >
        <div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            Partners &amp; Host Network
          </h1>
          <p className="admin-page-note" style={{ marginTop: "4px" }}>
            Record incoming partnership requests, review and approve hosts, assign properties, and manage portal access.
          </p>
        </div>

        <button
          className="admin-btn-primary"
          onClick={() => {
            setEditingPartner(null);
            setShowFormModal(true);
          }}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={16} weight="bold" /> Record Partnership Request
        </button>
      </div>

      {/* Pending Applications Banner if any */}
      {pendingCount > 0 && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
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
            <Clock size={20} weight="fill" color="#d97706" />
            <div>
              <strong style={{ color: "#92400e", fontSize: "0.9rem" }}>
                {pendingCount} Pending Partnership Application{pendingCount > 1 ? "s" : ""}
              </strong>
              <div style={{ color: "#b45309", fontSize: "0.8rem" }}>
                Review and approve applicants to assign homestays and grant host portal access.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("Pending")}
            style={{
              background: "#d97706",
              color: "#ffffff",
              border: "none",
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Filter Pending Applications
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: "var(--space-md)" }}>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value">{totalCount}</span>
          <span className="admin-stat-card__label">Total Recorded</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "var(--color-forest)" }}>
            {approvedCount}
          </span>
          <span className="admin-stat-card__label">Approved Hosts</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "#d97706" }}>
            {pendingCount}
          </span>
          <span className="admin-stat-card__label">Pending Review</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "#b91c1c" }}>
            {suspendedCount}
          </span>
          <span className="admin-stat-card__label">Suspended</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "var(--color-peach-deep)" }}>
            {assignedStaysCount}
          </span>
          <span className="admin-stat-card__label">Assigned Stays</span>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="admin-toolbar" style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <label className="admin-inline-field" style={{ flexGrow: 1, minWidth: "240px" }}>
          <span>Search Partners</span>
          <div className="admin-search-box">
            <MagnifyingGlass size={16} />
            <input
              type="text"
              placeholder="Name, agency, location, phone, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </label>

        <div style={{ minWidth: 200 }}>
          <Dropdown
            label="Filter by Status"
            options={["All", "Pending", "Approved", "Suspended", "Inactive", "Rejected"]}
            value={statusFilter || "All"}
            onChange={(val) => setStatusFilter(val === "All" ? "" : val)}
            placeholder="All Statuses"
            light
          />
        </div>
      </div>

      {/* Partners Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Partner / Homestay</th>
              <th>Base Location</th>
              <th>Contact Info</th>
              <th>Partnership Status</th>
              <th>Assigned Properties</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-table__empty">
                  No partners match your criteria. Click "Record Partnership Request" to add one.
                </td>
              </tr>
            ) : (
              filtered.map((partner) => {
                const assignedStays = stays.filter((s) => s.partnerId === partner.id);
                const status = partner.status || "Pending";
                const isApproved = status === "Approved" || status === "approved";
                const isPending = status === "Pending" || status === "pending";
                const isSuspended = status === "Suspended" || status === "suspended";

                // Badge styling
                const badgeStyles = {
                  Approved: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
                  Pending: { bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
                  Suspended: { bg: "#fee2e2", color: "#b91c1c", border: "#fecaca" },
                  Rejected: { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
                  Inactive: { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
                };
                const currentBadge = badgeStyles[status] || badgeStyles.Pending;

                return (
                  <tr key={partner.id}>
                    {/* Column 1: Partner & Agency */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <strong style={{ color: "var(--color-navy)", fontSize: "0.95rem" }}>
                          {partner.name}
                        </strong>
                        <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                          {partner.agency || "Homestay Operator"}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                          ID: <code>{partner.id}</code>
                        </span>
                        {partner.submittedAt && (
                          <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                            Req: {new Date(partner.submittedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 2: Location */}
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                        <MapPin size={14} color="var(--color-peach-deep)" />
                        {partner.location || "Sikkim"}
                      </span>
                    </td>

                    {/* Column 3: Contact Info */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px", fontSize: "0.82rem" }}>
                        {partner.phone && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <Phone size={13} /> {partner.phone}
                          </span>
                        )}
                        {partner.email && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--color-text-muted)" }}>
                            <EnvelopeSimple size={13} /> {partner.email}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 4: Partnership Status & Review Actions */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "999px",
                            fontSize: "0.76rem",
                            fontWeight: 700,
                            background: currentBadge.bg,
                            color: currentBadge.color,
                            border: `1px solid ${currentBadge.border}`,
                            width: "fit-content",
                          }}
                        >
                          {isApproved && <CheckCircle size={13} weight="fill" />}
                          {isPending && <Clock size={13} weight="fill" />}
                          {isSuspended && <ShieldWarning size={13} weight="fill" />}
                          {status}
                        </span>

                        {/* Quick Review Action Buttons */}
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(partner.id, "Approved", "Approved by Main Admin")}
                                title="Approve Partnership"
                                style={{
                                  background: "#15803d",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "4px",
                                  padding: "2px 8px",
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                <Check size={12} weight="bold" /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(partner.id, "Rejected", "Rejected during review")}
                                title="Reject Application"
                                style={{
                                  background: "#fee2e2",
                                  color: "#991b1b",
                                  border: "1px solid #fecaca",
                                  borderRadius: "4px",
                                  padding: "2px 8px",
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(partner.id, "Suspended", "Suspended by admin")}
                                title="Suspend Partner"
                                style={{
                                  background: "#fff1f2",
                                  color: "#b91c1c",
                                  border: "1px solid #fecdd3",
                                  borderRadius: "4px",
                                  padding: "2px 6px",
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                Suspend
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(partner.id, "Inactive", "Deactivated by admin")}
                                title="Deactivate Partner"
                                style={{
                                  background: "#f1f5f9",
                                  color: "#475569",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "4px",
                                  padding: "2px 6px",
                                  fontSize: "0.72rem",
                                  cursor: "pointer",
                                }}
                              >
                                Deactivate
                              </button>
                            </>
                          )}

                          {(isSuspended || status === "Inactive" || status === "Rejected") && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(partner.id, "Approved", "Reactivated by admin")}
                              title="Reactivate and Approve Partner"
                              style={{
                                background: "#dcfce7",
                                color: "#15803d",
                                border: "1px solid #bbf7d0",
                                borderRadius: "4px",
                                padding: "2px 8px",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Reactivate / Approve
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Column 5: Assigned Stays */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <button
                          type="button"
                          className="admin-link-btn"
                          onClick={() => handleOpenAssignModal(partner)}
                          style={{
                            textAlign: "left",
                            cursor: "pointer",
                            fontWeight: 600,
                            color: isApproved ? "var(--color-peach-deep)" : "#94a3b8",
                          }}
                          title={isApproved ? "Assign or remove properties" : "Approve partner first to assign properties"}
                        >
                          <HouseLine size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />
                          {assignedStays.length} stay{assignedStays.length !== 1 ? "s" : ""} assigned &rarr;
                        </button>

                        {assignedStays.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "260px" }}>
                            {assignedStays.map((s) => (
                              <span
                                key={s.id}
                                style={{
                                  fontSize: "0.72rem",
                                  background: "var(--color-cream)",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  border: "1px solid var(--color-border)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <span>{s.name || s.id}</span>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickUnassign(s.id);
                                  }}
                                  title="Unassign this stay"
                                  style={{
                                    cursor: "pointer",
                                    color: "#b91c1c",
                                    fontWeight: "bold",
                                    fontSize: "0.75rem",
                                    marginLeft: "2px",
                                  }}
                                >
                                  ×
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Column 6: Actions */}
                    <td className="admin-table__actions">
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            localStorage.setItem("lama_active_partner_id", partner.id);
                            sessionStorage.setItem("lama_active_partner_id", partner.id);
                          } catch (e) {}
                          window.open("/partner", "_blank");
                        }}
                        title={
                          isApproved
                            ? `Open Host Portal as ${partner.name}`
                            : `Simulate login as ${partner.name} (Access restricted: ${status})`
                        }
                        className="admin-icon-btn"
                        style={{ color: isApproved ? "var(--color-peach-deep)" : "#94a3b8" }}
                      >
                        <ArrowSquareOut size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingPartner(partner);
                          setShowFormModal(true);
                        }}
                        title="Edit Partner & Notes"
                        className="admin-icon-btn"
                      >
                        <PencilSimple size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(partner)}
                        title="Delete Partner Record"
                        className="admin-icon-btn admin-icon-btn--danger"
                      >
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit / Add Partner Modal */}
      {showFormModal && (
        <AdminFormModal
          title={editingPartner ? `Edit Partner: ${editingPartner.name}` : "Record New Partnership Request"}
          fields={partnerFields}
          initialValues={
            editingPartner || {
              status: "Pending",
              location: "Lachen",
            }
          }
          onSave={handleSave}
          onClose={() => {
            setShowFormModal(false);
            setEditingPartner(null);
          }}
        />
      )}

      {/* Assign / Reassign Properties Modal */}
      {assigningPartner && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <div className="admin-modal__backdrop" onClick={() => setAssigningPartner(null)} />
          <div
            className="admin-modal__panel"
            style={{ maxWidth: 700, maxHeight: "88vh", display: "flex", flexDirection: "column" }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-sm)" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", margin: 0, color: "var(--color-navy)" }}>
                  Assign Homestays to {assigningPartner.name}
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  {assigningPartner.agency} ({assigningPartner.location}) • Partner ID: <code>{assigningPartner.id}</code>
                </p>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setAssigningPartner(null)}
              >
                ✕
              </button>
            </div>

            {/* Explanatory Notice regarding Main Admin Control */}
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "var(--radius-sm)",
                padding: "10px 14px",
                marginBottom: "var(--space-sm)",
                fontSize: "0.82rem",
                color: "#1e40af",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
              }}
            >
              <Info size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>Property Assignment Rules:</strong>
                <div>
                  • Assigned homestays appear in the partner's Host Portal for photo management and availability toggling.
                </div>
                <div>
                  • <strong>Public Listing Control:</strong> Assigning a property does NOT automatically publish it. Main Admin retains strict control over whether a stay is <em>Published (Public)</em> or <em>Draft (Admin Only)</em>.
                </div>
              </div>
            </div>

            {/* Search Filter for Stays */}
            <div style={{ marginBottom: "var(--space-sm)" }}>
              <input
                type="text"
                placeholder="Search stays by name or location..."
                value={staySearch}
                onChange={(e) => setStaySearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  fontSize: "0.85rem",
                }}
              />
            </div>

            {/* List of Stays with Multi-select Checkboxes */}
            <div style={{ overflowY: "auto", flexGrow: 1, paddingRight: "6px" }}>
              {stays.length === 0 ? (
                <p className="admin-page-note">No stays available in the system. Add stays first under Admin &rarr; Stays.</p>
              ) : (
                stays
                  .filter((stay) => {
                    if (!staySearch.trim()) return true;
                    const q = staySearch.toLowerCase();
                    return (
                      (stay.name || "").toLowerCase().includes(q) ||
                      (stay.location || "").toLowerCase().includes(q)
                    );
                  })
                  .map((stay) => {
                    const isSelected = selectedStayIds.includes(stay.id);
                    const isAssignedToOther = stay.partnerId && stay.partnerId !== assigningPartner.id;
                    const otherPartner = isAssignedToOther
                      ? partners.find((p) => p.id === stay.partnerId)
                      : null;
                    const isPublished = stay.status === "published" && stay.active !== false;

                    return (
                      <label
                        key={stay.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          borderRadius: "var(--radius-sm)",
                          border: isSelected
                            ? "1px solid var(--color-peach-deep)"
                            : "1px solid var(--color-border)",
                          marginBottom: "8px",
                          background: isSelected ? "var(--color-peach-light)" : "var(--color-surface)",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleStaySelection(stay.id)}
                            style={{ width: "16px", height: "16px", cursor: "pointer" }}
                          />
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <strong style={{ color: "var(--color-navy)", fontSize: "0.9rem" }}>
                                {stay.name || "Unnamed Stay"}
                              </strong>
                              {/* Listing status pill */}
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  background: isPublished ? "#dcfce7" : "#fef3c7",
                                  color: isPublished ? "#15803d" : "#b45309",
                                  border: `1px solid ${isPublished ? "#bbf7d0" : "#fde68a"}`,
                                }}
                              >
                                {isPublished ? "Publicly Listed" : "Draft (Not Listed)"}
                              </span>
                            </div>
                            <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                              {stay.location} · {stay.type || "Homestay"} · ID: <code>{stay.id}</code>
                            </span>
                          </div>
                        </div>

                        {/* Assignment Status Pill */}
                        <div>
                          {isSelected && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                background: "#dcfce7",
                                color: "#15803d",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                fontWeight: 700,
                                border: "1px solid #bbf7d0",
                              }}
                            >
                              ✓ Selected for Assignment
                            </span>
                          )}

                          {!isSelected && isAssignedToOther && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                background: "#fffbeb",
                                color: "#b45309",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                border: "1px solid #fde68a",
                              }}
                            >
                              Currently with: {otherPartner?.name || stay.partnerId} (Checking will reassign)
                            </span>
                          )}

                          {!isSelected && !stay.partnerId && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                background: "#f1f5f9",
                                color: "#64748b",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                border: "1px solid #cbd5e1",
                              }}
                            >
                              Unassigned
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })
              )}
            </div>

            {/* Modal Actions */}
            <div
              style={{
                marginTop: "var(--space-md)",
                paddingTop: "var(--space-sm)",
                borderTop: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "0.85rem", color: "var(--color-navy)", fontWeight: 600 }}>
                {selectedStayIds.length} propert{selectedStayIds.length !== 1 ? "ies" : "y"} selected
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setAssigningPartner(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={handleSaveAssignments}
                >
                  Save Assignments
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
