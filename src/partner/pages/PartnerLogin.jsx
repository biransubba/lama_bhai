import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HouseLine, UsersThree, CheckCircle, ArrowRight, ShieldCheck, ArrowSquareOut } from "phosphor-react";
import { usePartnerAuth } from "../context/PartnerAuthContext.jsx";
import { staysStore } from "../../data/staysStore.js";

export default function PartnerLogin() {
  const { approvedPartners, allPartners = [], loginAsPartner } = usePartnerAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [statusNotice, setStatusNotice] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const allStays = staysStore.getAll();
  const pendingOrSuspendedPartners = allPartners.filter(
    (p) => p.status !== "Approved" && p.status !== "approved"
  );

  function handleSelectHost(id) {
    const partner = allPartners.find((p) => p.id === id);
    if (!partner) return;

    if (partner.status !== "Approved" && partner.status !== "approved") {
      setStatusNotice({
        partner,
        status: partner.status || "Pending",
      });
      loginAsPartner(id);
      navigate("/partner");
      return;
    }

    loginAsPartner(id);
    navigate("/partner");
  }

  function handlePhoneSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setStatusNotice(null);

    const cleaned = phoneNumber.replace(/[^0-9]/g, "");
    if (!cleaned) {
      setErrorMsg("Please enter a valid phone number");
      return;
    }

    // 1. Check approved partners first
    const foundApproved = approvedPartners.find((p) => {
      const pClean = (p.phone || "").replace(/[^0-9]/g, "");
      return pClean.includes(cleaned) || cleaned.includes(pClean);
    });

    if (foundApproved) {
      handleSelectHost(foundApproved.id);
      return;
    }

    // 2. Check all partners to give precise status explanation
    const foundOther = allPartners.find((p) => {
      const pClean = (p.phone || "").replace(/[^0-9]/g, "");
      return pClean.includes(cleaned) || cleaned.includes(pClean);
    });

    if (foundOther) {
      const status = foundOther.status || "Pending";
      if (status === "Pending") {
        setErrorMsg(
          `Application Found (${foundOther.name} • ${foundOther.agency}): Your partnership request is currently PENDING review by Main Admin. Access to the portal will be granted once approved.`
        );
      } else if (status === "Suspended") {
        setErrorMsg(
          `Account Suspended (${foundOther.name} • ${foundOther.agency}): This partner account is temporarily suspended by Main Admin. Please contact Lama Bhai Tourism.`
        );
      } else if (status === "Rejected") {
        setErrorMsg(
          `Application Not Approved (${foundOther.name}): This partnership application was reviewed and not accepted.`
        );
      } else if (status === "Inactive") {
        setErrorMsg(
          `Account Inactive (${foundOther.name}): This partner account has been deactivated.`
        );
      } else {
        setErrorMsg(`Partner account status: ${status}. Access is limited to approved partners.`);
      }
      return;
    }

    setErrorMsg(
      "No partner account found with that phone number. Please choose your host profile below or contact Main Admin."
    );
  }

  return (
    <div className="partner-login-wrap">
      <div className="partner-login-card">
        <div style={{ textAlign: "center", marginBottom: "var(--space-lg)" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "var(--color-peach-light)",
              color: "var(--color-peach-deep)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
            }}
          >
            <HouseLine size={32} weight="duotone" />
          </div>
          <h1 style={{ fontSize: "1.75rem", margin: "0 0 8px", color: "var(--color-navy)", fontFamily: "var(--font-display)" }}>
            Lama Bhai Host &amp; Partner Portal
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", margin: 0, maxWidth: "560px", marginInline: "auto" }}>
            Self-management console for homestay owners, village lodge operators, and local hosts across Sikkim.
          </p>
        </div>

        {/* Security / Boundary Disclaimer */}
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "var(--radius-sm)",
            padding: "12px 16px",
            marginBottom: "var(--space-lg)",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            fontSize: "0.84rem",
            color: "#166534",
          }}
        >
          <ShieldCheck size={20} weight="fill" color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong>Strict Partner Scoping:</strong> Once you log in, your access is strictly confined to your assigned homestays and guest booking requests. Other partners' data and platform administration remain private.
          </div>
        </div>

        {/* Option A: Quick Host Selection */}
        <div style={{ marginBottom: "var(--space-xl)" }}>
          <h2 style={{ fontSize: "1.05rem", color: "var(--color-navy)", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <UsersThree size={20} color="var(--color-peach-deep)" />
            Select Your Host Profile:
          </h2>

          {approvedPartners.length === 0 ? (
            <div
              style={{
                background: "var(--color-surface)",
                border: "1px dashed var(--color-border)",
                borderRadius: "var(--radius-sm)",
                padding: "32px 20px",
                textAlign: "center",
                color: "var(--color-text-muted)",
              }}
            >
              <UsersThree size={36} color="var(--color-peach-deep)" style={{ marginBottom: "8px" }} />
              <h3 style={{ margin: "0 0 6px", color: "var(--color-navy)", fontSize: "1rem" }}>
                No Partner Accounts Created Yet
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", maxWidth: "460px", marginInline: "auto" }}>
                All dummy partner records have been cleared. As an administrator, you can add verified host partners from the{" "}
                <Link to="/admin/partners" style={{ color: "var(--color-peach-deep)", fontWeight: 700 }}>
                  Admin Console &rarr; Partners
                </Link>{" "}
                page.
              </p>
            </div>
          ) : (
            <div className="partner-host-select-grid">
              {approvedPartners.map((partner) => {
                // Count stays assigned
                const stayCount = allStays.filter(
                  (s) => s.partnerId === partner.id || (partner.assignedPropertyIds || []).includes(s.id)
                ).length;

                return (
                  <div
                    key={partner.id}
                    className="partner-host-tile"
                    onClick={() => handleSelectHost(partner.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "0.95rem", color: "var(--color-navy)" }}>{partner.name}</strong>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          padding: "2px 6px",
                          borderRadius: "999px",
                          background: "#e8f5e9",
                          color: "#1b5e20",
                          fontWeight: 700,
                        }}
                      >
                        {partner.location}
                      </span>
                    </div>

                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0 0 8px" }}>
                      {partner.agency || "Local Homestay Host"}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
                      <span style={{ color: "var(--color-forest)", fontWeight: 600 }}>
                        {stayCount} {stayCount === 1 ? "Homestay" : "Homestays"}
                      </span>
                      <span style={{ color: "var(--color-peach-deep)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        Log in <ArrowRight size={13} weight="bold" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pending / Suspended / Other Partners Section */}
          {pendingOrSuspendedPartners.length > 0 && (
            <div style={{ marginTop: "var(--space-lg)", paddingTop: "var(--space-md)", borderTop: "1px dashed var(--color-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-navy)" }}>
                  Pending Applications &amp; Non-Active Partner Accounts ({pendingOrSuspendedPartners.length})
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  Access is blocked until approved by Main Admin
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {pendingOrSuspendedPartners.map((p) => {
                  const statusColors = {
                    Pending: { bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
                    Suspended: { bg: "#fee2e2", color: "#b91c1c", border: "#fecaca" },
                    Rejected: { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
                    Inactive: { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
                  };
                  const colors = statusColors[p.status] || statusColors.Pending;

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectHost(p.id)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        border: `1px solid ${colors.border}`,
                        background: colors.bg,
                        cursor: "pointer",
                        fontSize: "0.82rem",
                      }}
                      title="Click to check access restriction behavior"
                    >
                      <div>
                        <strong style={{ color: "var(--color-navy)" }}>{p.name}</strong>{" "}
                        <span style={{ color: "var(--color-text-muted)" }}>({p.agency || "Homestay"}, {p.location})</span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "999px",
                          background: "#ffffff",
                          color: colors.color,
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        {p.status || "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Option B: Enter phone number */}
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-md)" }}>
          <form onSubmit={handlePhoneSubmit} style={{ maxWidth: "420px", margin: "0 auto" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-navy)", marginBottom: "6px" }}>
              Or enter your registered phone number:
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                style={{
                  flexGrow: 1,
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  fontSize: "0.9rem",
                }}
              />
              <button
                type="submit"
                style={{
                  background: "var(--color-peach)",
                  color: "var(--color-navy)",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Log In
              </button>
            </div>
            {errorMsg && (
              <p style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: "6px" }}>{errorMsg}</p>
            )}
          </form>
        </div>

        {/* Return Links */}
        <div style={{ marginTop: "var(--space-xl)", textAlign: "center", display: "flex", justifyContent: "center", gap: "20px", fontSize: "0.85rem" }}>
          <Link to="/" style={{ color: "var(--color-navy)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            &larr; Return to Lama Bhai Tourism
          </Link>
          <Link to="/admin" style={{ color: "var(--color-peach-deep)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            Main Admin Console <ArrowSquareOut size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
