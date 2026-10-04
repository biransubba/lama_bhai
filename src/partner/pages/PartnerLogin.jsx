import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HouseLine,
  ShieldCheck,
  ArrowRight,
  ArrowSquareOut,
  EnvelopeSimple,
  LockKey,
  WarningCircle,
  Sparkle,
} from "phosphor-react";
import { usePartnerAuth } from "../context/PartnerAuthContext.jsx";

export default function PartnerLogin() {
  const { user, authenticated, loading, login } = usePartnerAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // If already authenticated with partner/admin role, redirect directly to dashboard
  useEffect(() => {
    if (!loading && authenticated && user) {
      navigate("/partner", { replace: true });
    }
  }, [loading, authenticated, user, navigate]);

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    try {
      setSubmitting(true);
      await login(email.trim(), password);
      // Upon successful session creation, navigate to partner dashboard
      navigate("/partner");
    } catch (err) {
      setErrorMsg(err.message || "Invalid credentials or unauthorized account.");
    } finally {
      setSubmitting(false);
    }
  }

  // Quick helper to fill test accounts during QA/evaluation
  function quickFill(testEmail, testPass = "password123") {
    setEmail(testEmail);
    setPassword(testPass);
    setErrorMsg("");
  }

  return (
    <div className="partner-login-wrap">
      <div className="partner-login-card">
        {/* Header Branding */}
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
          <h1
            style={{
              fontSize: "1.75rem",
              margin: "0 0 8px",
              color: "var(--color-navy)",
              fontFamily: "var(--font-display)",
            }}
          >
            Lama Bhai Host &amp; Partner Portal
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "0.95rem",
              margin: 0,
              maxWidth: "560px",
              marginInline: "auto",
            }}
          >
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
          <ShieldCheck
            size={20}
            weight="fill"
            color="#16a34a"
            style={{ flexShrink: 0, marginTop: "2px" }}
          />
          <div>
            <strong>Session Authenticated:</strong> Access is protected by HTTP-only session cookies and backend role authorization. Once authenticated, your access is strictly confined to your partner homestays and booking requests.
          </div>
        </div>

        {/* Real Backend Authentication Form */}
        <div style={{ maxWidth: "440px", margin: "0 auto var(--space-lg)" }}>
          <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label
                htmlFor="partner-email"
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--color-navy)",
                  marginBottom: "6px",
                }}
              >
                Registered Email Address
              </label>
              <div style={{ position: "relative" }}>
                <EnvelopeSimple
                  size={18}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-muted)",
                  }}
                />
                <input
                  id="partner-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. host@lamabhaila.com"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.92rem",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="partner-password"
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--color-navy)",
                  marginBottom: "6px",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <LockKey
                  size={18}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-muted)",
                  }}
                />
                <input
                  id="partner-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.92rem",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            {errorMsg && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.84rem",
                  lineHeight: 1.4,
                }}
              >
                <WarningCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              id="partner-login-btn"
              type="submit"
              disabled={submitting}
              style={{
                background: "var(--color-peach-deep)",
                color: "#ffffff",
                border: "none",
                padding: "12px 20px",
                borderRadius: "var(--radius-sm)",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background 0.2s ease",
              }}
            >
              {submitting ? "Signing In..." : "Log In to Host Portal"}
              <ArrowRight size={16} weight="bold" />
            </button>
          </form>

          {/* Quick Demo / QA Credentials Helper */}
          <div
            style={{
              marginTop: "var(--space-md)",
              padding: "12px 14px",
              background: "var(--color-cream)",
              border: "1px dashed var(--color-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--color-navy)",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              <Sparkle size={14} color="var(--color-peach-deep)" />
              <span>Quick Test Accounts (Backend Session)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <button
                type="button"
                onClick={() => quickFill("norbu_52704@lama.test", "password123")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  background: "#ffffff",
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  padding: "5px 8px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span><strong>Approved Host (3 Stays):</strong> norbu_52704@lama.test</span>
                <span style={{ color: "var(--color-forest)", fontWeight: 600 }}>Fill &rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => quickFill("mw_owner_82977@lama.test", "password123")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  background: "#ffffff",
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  padding: "5px 8px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span><strong>Approved Host (0 Stays):</strong> mw_owner_82977@lama.test</span>
                <span style={{ color: "var(--color-forest)", fontWeight: 600 }}>Fill &rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => quickFill("mingma_05167@lama.test", "password123")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  background: "#ffffff",
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  padding: "5px 8px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span><strong>Pending Host:</strong> mingma_05167@lama.test</span>
                <span style={{ color: "#b45309", fontWeight: 600 }}>Fill &rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => quickFill("passang_05167@lama.test", "password123")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  background: "#ffffff",
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  padding: "5px 8px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span><strong>Tourist (Blocked):</strong> passang_05167@lama.test</span>
                <span style={{ color: "#991b1b", fontWeight: 600 }}>Fill &rarr;</span>
              </button>
            </div>
          </div>
        </div>

        {/* Return Links */}
        <div
          style={{
            marginTop: "var(--space-md)",
            borderTop: "1px solid var(--color-border)",
            paddingTop: "var(--space-md)",
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            fontSize: "0.85rem",
          }}
        >
          <Link
            to="/"
            style={{
              color: "var(--color-navy)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            &larr; Return to Lama Bhai Tourism
          </Link>
          <Link
            to="/admin"
            style={{
              color: "var(--color-peach-deep)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Main Admin Console <ArrowSquareOut size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
