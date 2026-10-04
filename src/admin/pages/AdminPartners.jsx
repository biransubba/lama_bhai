import React, { useState, useEffect, useCallback } from "react";
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
  LockKey,
  Eye,
  EyeSlash,
  X,
} from "phosphor-react";
import { api } from "../../utils/api.js";
import Dropdown from "../../components/Dropdown.jsx";

const SIKKIM_LOCATIONS = [
  "Lachen",
  "Lachung",
  "Dzongu",
  "Mangan",
  "Gangtok",
  "Thangu",
  "Ravangla",
  "Pelling",
  "Yuksom",
  "Namchi",
];

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successBanner, setSuccessBanner] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Add Partner Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    temporaryPassword: "",
    agencyName: "",
    location: "Lachen",
  });

  // Edit / Status Modal state
  const [editingPartner, setEditingPartner] = useState(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("Approved");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch partners and properties from backend
  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [partnersRes, propsRes] = await Promise.all([
        api.admin.getPartners({ limit: 100 }),
        api.admin.getProperties({ limit: 100 }).catch(() => ({ data: [] })),
      ]);

      if (partnersRes && partnersRes.success && Array.isArray(partnersRes.data)) {
        setPartners(partnersRes.data);
      } else {
        setPartners([]);
      }

      if (propsRes && propsRes.success && Array.isArray(propsRes.data)) {
        setProperties(propsRes.data);
      } else {
        setProperties([]);
      }
    } catch (err) {
      console.error("Error loading partners:", err);
      setError(err.message || "Failed to load partners from server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Form input handler
  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError("");
  }

  // Handle Add Partner Submission
  async function handleAddPartnerSubmit(e) {
    e.preventDefault();
    setFormError("");

    // Client validation
    if (!formData.name.trim()) {
      setFormError("Partner full name is required.");
      return;
    }
    if (!formData.phone.trim()) {
      setFormError("Phone number is required.");
      return;
    }
    if (!formData.email.trim()) {
      setFormError("Email address is required.");
      return;
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (!formData.temporaryPassword || formData.temporaryPassword.length < 6) {
      setFormError("Temporary password must be at least 6 characters long.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        temporaryPassword: formData.temporaryPassword,
        agencyName: formData.agencyName.trim() || formData.name.trim(),
        location: formData.location.trim() || "Sikkim",
      };

      const res = await api.admin.createPartner(payload);

      if (res && res.success) {
        setSuccessBanner("Partner created successfully.");
        setShowAddModal(false);
        setFormData({
          name: "",
          phone: "",
          email: "",
          temporaryPassword: "",
          agencyName: "",
          location: "Lachen",
        });
        await fetchPartners();
        setTimeout(() => setSuccessBanner(""), 6000);
      } else {
        setFormError(res?.error || "Failed to create partner account.");
      }
    } catch (err) {
      setFormError(err.message || "Failed to create partner. Please check inputs.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Partner Status Update
  async function handleStatusChange(partnerId, newStatus, notes = "") {
    try {
      const res = await api.admin.updatePartnerStatus(partnerId, newStatus, notes);
      if (res && res.success) {
        setSuccessBanner(`Partner status updated to ${newStatus}.`);
        setTimeout(() => setSuccessBanner(""), 4000);
        await fetchPartners();
      }
    } catch (err) {
      alert(err.message || "Failed to update partner status.");
    }
  }

  async function handleSaveEditStatus(e) {
    e.preventDefault();
    if (!editingPartner) return;
    try {
      setIsUpdatingStatus(true);
      await api.admin.updatePartnerStatus(
        editingPartner._id || editingPartner.id,
        editStatus,
        editNotes
      );
      setSuccessBanner(`Partner updated successfully.`);
      setTimeout(() => setSuccessBanner(""), 4000);
      setEditingPartner(null);
      await fetchPartners();
    } catch (err) {
      alert(err.message || "Failed to update partner.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  // Filtered partners
  const filtered = partners.filter((p) => {
    const status = (p.partnerProfile?.verificationStatus || p.status || "Pending").toLowerCase();
    if (statusFilter && statusFilter !== "All") {
      if (status !== statusFilter.toLowerCase()) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = (p.name || "").toLowerCase().includes(q);
      const matchAgency = (p.partnerProfile?.agencyName || p.agency || "").toLowerCase().includes(q);
      const matchLoc = (p.partnerProfile?.location || p.location || "").toLowerCase().includes(q);
      const matchPhone = (p.phone || "").toLowerCase().includes(q);
      const matchEmail = (p.email || "").toLowerCase().includes(q);
      const matchId = (p._id || p.id || "").toLowerCase().includes(q);
      if (!matchName && !matchAgency && !matchLoc && !matchPhone && !matchEmail && !matchId) {
        return false;
      }
    }
    return true;
  });

  // Overview stats
  const totalCount = partners.length;
  const approvedCount = partners.filter((p) => {
    const s = (p.partnerProfile?.verificationStatus || p.status || "").toLowerCase();
    return s === "approved";
  }).length;
  const pendingCount = partners.filter((p) => {
    const s = (p.partnerProfile?.verificationStatus || p.status || "").toLowerCase();
    return s === "pending";
  }).length;
  const suspendedCount = partners.filter((p) => {
    const s = (p.partnerProfile?.verificationStatus || p.status || "").toLowerCase();
    return s === "suspended";
  }).length;

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
            Add and manage verified homestay hosts, configure login access, and monitor host activity across Sikkim.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            className="admin-btn-secondary"
            onClick={fetchPartners}
            disabled={loading}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            title="Refresh Partners List"
          >
            <ArrowsClockwise size={16} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button
            className="admin-btn-primary"
            onClick={() => {
              setFormError("");
              setShowAddModal(true);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            id="admin-add-partner-btn"
          >
            <Plus size={16} weight="bold" /> Add Partner
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div
          style={{
            background: "#dcfce7",
            border: "1px solid #bbf7d0",
            borderRadius: "var(--radius-sm)",
            padding: "12px 16px",
            marginBottom: "var(--space-md)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#15803d",
            fontWeight: 600,
          }}
        >
          <CheckCircle size={20} weight="fill" color="#15803d" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "var(--radius-sm)",
            padding: "12px 16px",
            marginBottom: "var(--space-md)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#b91c1c",
          }}
        >
          <WarningCircle size={20} weight="fill" color="#b91c1c" />
          <span>{error}</span>
        </div>
      )}

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
                {pendingCount} Pending Partner Account{pendingCount > 1 ? "s" : ""}
              </strong>
              <div style={{ color: "#b45309", fontSize: "0.8rem" }}>
                Review and approve partners to grant them Host Portal access.
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
            Filter Pending
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: "var(--space-md)" }}>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value">{totalCount}</span>
          <span className="admin-stat-card__label">Total Registered</span>
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
          <span className="admin-stat-card__label">Pending Approval</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value" style={{ color: "#b91c1c" }}>
            {suspendedCount}
          </span>
          <span className="admin-stat-card__label">Suspended</span>
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
              placeholder="Name, agency, location, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </label>

        <div style={{ minWidth: 200 }}>
          <Dropdown
            label="Filter by Status"
            options={["All", "Approved", "Pending", "Suspended", "Inactive", "Rejected"]}
            value={statusFilter || "All"}
            onChange={(val) => setStatusFilter(val || "All")}
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
              <th>Partner / Host</th>
              <th>Base Location</th>
              <th>Contact Info</th>
              <th>Status</th>
              <th>Properties</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="admin-table__empty">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "20px" }}>
                    <ArrowsClockwise size={20} className="spin" />
                    <span>Loading partners from server...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-table__empty">
                  No partners match your criteria. Click &quot;Add Partner&quot; to create a new host account.
                </td>
              </tr>
            ) : (
              filtered.map((partner) => {
                const partnerId = partner._id || partner.id;
                const status = partner.partnerProfile?.verificationStatus || partner.status || "Pending";
                const isApproved = status.toLowerCase() === "approved";
                const isPending = status.toLowerCase() === "pending";
                const isSuspended = status.toLowerCase() === "suspended";
                const agencyName = partner.partnerProfile?.agencyName || partner.agency || "Homestay Operator";
                const location = partner.partnerProfile?.location || partner.location || "Sikkim";
                const propertiesCount =
                  partner.propertiesCount !== undefined
                    ? partner.propertiesCount
                    : properties.filter((p) => p.owner?._id === partnerId || p.owner === partnerId).length;

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
                  <tr key={partnerId}>
                    {/* Column 1: Partner & Agency */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <strong style={{ color: "var(--color-navy)", fontSize: "0.95rem" }}>
                          {partner.name}
                        </strong>
                        <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                          {agencyName}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                          Role: <span style={{ fontWeight: 600, color: "var(--color-peach-deep)" }}>{partner.role}</span> · ID: <code>{String(partnerId).slice(-6)}</code>
                        </span>
                        {partner.createdAt && (
                          <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                            Joined: {new Date(partner.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 2: Location */}
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                        <MapPin size={14} color="var(--color-peach-deep)" />
                        {location}
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

                    {/* Column 4: Status & Quick Actions */}
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

                        {/* Quick review buttons */}
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(partnerId, "Approved", "Approved by Administrator")}
                                title="Approve Partner"
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
                                onClick={() => handleStatusChange(partnerId, "Rejected", "Rejected during review")}
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
                            <button
                              type="button"
                              onClick={() => handleStatusChange(partnerId, "Suspended", "Suspended by admin")}
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
                          )}

                          {isSuspended && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(partnerId, "Approved", "Reactivated by admin")}
                              title="Reactivate Partner"
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
                              Reactivate
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Column 5: Properties */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <HouseLine size={16} color="var(--color-peach-deep)" />
                        <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                          {propertiesCount} {propertiesCount === 1 ? "Stay" : "Stays"}
                        </span>
                      </div>
                    </td>

                    {/* Column 6: Actions */}
                    <td className="admin-table__actions">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPartner(partner);
                          setEditStatus(status);
                          setEditNotes(partner.partnerProfile?.notes || partner.partnerProfile?.reviewerNotes || "");
                        }}
                        title="Edit Partner & Review Notes"
                        className="admin-icon-btn"
                      >
                        <PencilSimple size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ADD PARTNER MODAL */}
      {showAddModal && (
        <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="add-partner-title">
          <div className="admin-modal__backdrop" onClick={() => !isSubmitting && setShowAddModal(false)} />
          <div
            className="admin-modal__panel"
            style={{
              maxWidth: 580,
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* MODAL HEADER (Sticky Top) */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexShrink: 0,
                background: "#ffffff",
              }}
            >
              <div>
                <h2 id="add-partner-title" className="admin-modal__title" style={{ margin: "0 0 4px", fontSize: "1.25rem" }}>
                  Add Partner Account
                </h2>
                <p className="admin-page-note" style={{ margin: 0, fontSize: "0.82rem" }}>
                  Create a new verified partner account. The host can immediately log in to the Host Portal using these credentials.
                </p>
              </div>
              <button
                className="admin-modal__close"
                onClick={() => !isSubmitting && setShowAddModal(false)}
                aria-label="Close"
                disabled={isSubmitting}
                style={{ marginLeft: "12px", marginTop: "-2px" }}
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* FORM WRAPPER */}
            <form
              onSubmit={handleAddPartnerSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: "1 1 auto",
                overflow: "hidden",
                margin: 0,
              }}
            >
              {/* SCROLLABLE BODY */}
              <div
                style={{
                  flex: "1 1 auto",
                  overflowY: "auto",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {formError && (
                  <div
                    style={{
                      background: "#fee2e2",
                      border: "1px solid #fecaca",
                      borderRadius: "var(--radius-sm)",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#991b1b",
                      fontSize: "0.85rem",
                    }}
                  >
                    <WarningCircle size={18} weight="fill" style={{ flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* SECTION 1: PARTNER INFORMATION */}
                <div>
                  <h3
                    style={{
                      fontSize: "0.82rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--color-navy)",
                      margin: "0 0 10px",
                      fontWeight: 700,
                      paddingBottom: "4px",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    Partner Information
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginBottom: "10px" }}>
                    <div className="admin-field">
                      <label className="admin-field__label">
                        <span className="admin-field__title">Full Name *</span>
                        <input
                          type="text"
                          name="name"
                          placeholder="e.g., Tenzing Norbu"
                          value={formData.name}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                          required
                        />
                      </label>
                    </div>

                    <div className="admin-field">
                      <label className="admin-field__label">
                        <span className="admin-field__title">Phone Number *</span>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="e.g., 9876543210"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                          required
                        />
                      </label>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                    <div className="admin-field">
                      <label className="admin-field__label">
                        <span className="admin-field__title">Homestay / Agency Name</span>
                        <input
                          type="text"
                          name="agencyName"
                          placeholder="e.g., Lachen Mountain View Homestay"
                          value={formData.agencyName}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                        />
                      </label>
                    </div>

                    <div className="admin-field">
                      <label className="admin-field__label">
                        <span className="admin-field__title">Base Location *</span>
                        <Dropdown
                          options={SIKKIM_LOCATIONS}
                          value={formData.location}
                          onChange={(val) => setFormData((prev) => ({ ...prev, location: val }))}
                          disabled={isSubmitting}
                          light
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: LOGIN CREDENTIALS */}
                <div>
                  <h3
                    style={{
                      fontSize: "0.82rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--color-navy)",
                      margin: "0 0 10px",
                      fontWeight: 700,
                      paddingBottom: "4px",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    Login Credentials
                  </h3>

                  <div className="admin-field" style={{ marginBottom: "10px" }}>
                    <label className="admin-field__label">
                      <span className="admin-field__title">Email (Used for Partner Login) *</span>
                      <input
                        type="email"
                        name="email"
                        placeholder="e.g., partner@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        required
                      />
                    </label>
                    <p className="admin-field__help" style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                      This email is unique and will be used by the host to log in at /partner/login.
                    </p>
                  </div>

                  <div className="admin-field">
                    <label className="admin-field__label">
                      <span className="admin-field__title">Temporary Password *</span>
                      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="temporaryPassword"
                          placeholder="At least 6 characters"
                          value={formData.temporaryPassword}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                          style={{ paddingRight: "40px" }}
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: "absolute",
                            right: "10px",
                            background: "none",
                            border: "none",
                            color: "#64748b",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            padding: "4px",
                          }}
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </label>
                    <p className="admin-field__help" style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                      Password is automatically hashed securely before saving to the database.
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS (Sticky Footer - Always Visible on Screen) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 20px",
                  borderTop: "1px solid var(--color-border)",
                  background: "#f8fafc",
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={isSubmitting}
                  id="admin-submit-partner-btn"
                >
                  {isSubmitting ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <ArrowsClockwise size={16} className="spin" />
                      Creating partner...
                    </span>
                  ) : (
                    "Create Partner Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PARTNER MODAL */}
      {editingPartner && (
        <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="edit-partner-title">
          <div className="admin-modal__backdrop" onClick={() => !isUpdatingStatus && setEditingPartner(null)} />
          <div
            className="admin-modal__panel"
            style={{
              maxWidth: 520,
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* HEADER */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexShrink: 0,
                background: "#ffffff",
              }}
            >
              <div>
                <h2 id="edit-partner-title" className="admin-modal__title" style={{ margin: "0 0 4px", fontSize: "1.25rem" }}>
                  Edit Partner: {editingPartner.name}
                </h2>
                <p className="admin-page-note" style={{ margin: 0, fontSize: "0.82rem" }}>
                  {editingPartner.email} · Role: <code>{editingPartner.role}</code>
                </p>
              </div>
              <button
                className="admin-modal__close"
                onClick={() => !isUpdatingStatus && setEditingPartner(null)}
                aria-label="Close"
                disabled={isUpdatingStatus}
                style={{ marginLeft: "12px", marginTop: "-2px" }}
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* FORM WRAPPER */}
            <form
              onSubmit={handleSaveEditStatus}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: "1 1 auto",
                overflow: "hidden",
                margin: 0,
              }}
            >
              <div
                style={{
                  flex: "1 1 auto",
                  overflowY: "auto",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div className="admin-field">
                  <label className="admin-field__label">
                    <span className="admin-field__title">Verification Status</span>
                    <Dropdown
                      options={["Approved", "Pending", "Suspended", "Inactive", "Rejected"]}
                      value={editStatus}
                      onChange={(val) => setEditStatus(val)}
                      disabled={isUpdatingStatus}
                      light
                    />
                  </label>
                </div>

                <div className="admin-field">
                  <label className="admin-field__label">
                    <span className="admin-field__title">Administrative / Review Notes</span>
                    <textarea
                      rows={3}
                      placeholder="Internal notes regarding this partner..."
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      disabled={isUpdatingStatus}
                    />
                  </label>
                </div>
              </div>

              {/* FOOTER */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 20px",
                  borderTop: "1px solid var(--color-border)",
                  background: "#f8fafc",
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setEditingPartner(null)}
                  disabled={isUpdatingStatus}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
