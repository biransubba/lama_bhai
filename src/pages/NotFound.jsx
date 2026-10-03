import React from "react";
import { Link } from "react-router-dom";
import { Compass, HouseLine, ArrowLeft } from "phosphor-react";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        background: "var(--color-cream, #fbf8f3)",
        fontFamily: "var(--font-body, system-ui, sans-serif)",
      }}
    >
      <div
        style={{
          maxWidth: "560px",
          width: "100%",
          background: "#fff",
          borderRadius: "16px",
          padding: "40px 32px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(23, 36, 58, 0.08)",
          border: "1px solid #fed7aa",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#fff7ed",
            color: "#f97316",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          <Compass size={36} weight="duotone" />
        </div>

        <h1
          style={{
            fontSize: "1.8rem",
            color: "var(--color-navy, #17243a)",
            margin: "0 0 8px",
            fontFamily: "var(--font-display, serif)",
          }}
        >
          Page Not Found
        </h1>

        <p
          style={{
            color: "var(--color-text-muted, #64748b)",
            fontSize: "0.95rem",
            lineHeight: 1.5,
            margin: "0 0 24px",
          }}
        >
          The page or route you navigated to doesn't exist. Were you looking for one of these sections?
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "24px",
          }}
        >
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "var(--color-peach, #e8a58c)",
              color: "var(--color-navy, #17243a)",
              borderRadius: "8px",
              padding: "12px",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
            }}
          >
            <HouseLine size={18} weight="bold" /> Return to Homepage
          </Link>

          <Link
            to="/manage-booking"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "var(--color-surface, #fff)",
              color: "var(--color-navy, #17243a)",
              border: "1px solid var(--color-border, #e2e8f0)",
              borderRadius: "8px",
              padding: "12px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
            }}
          >
            Manage / Cancel Existing Booking
          </Link>
        </div>

        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--color-text-muted, #64748b)",
            textDecoration: "none",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Return to Homepage
        </Link>
      </div>
    </main>
  );
}
