import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "40px 24px",
            maxWidth: "700px",
            margin: "60px auto",
            fontFamily: "var(--font-sans, system-ui, sans-serif)",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            border: "1px solid #fed7aa",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <span style={{ fontSize: "28px" }}>⚠️</span>
            <h2 style={{ margin: 0, color: "#9a3412", fontSize: "1.3rem" }}>
              Something went wrong loading this view
            </h2>
          </div>
          <p style={{ color: "#4b5563", fontSize: "0.95rem", lineHeight: 1.5, margin: "0 0 16px" }}>
            A rendering error occurred in this section. Details:
          </p>
          <pre
            style={{
              background: "#fff7ed",
              color: "#9a3412",
              padding: "12px 16px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {this.state.error?.message || "Unknown error"}
          </pre>
          <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                background: "#f97316",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 18px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 18px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                color: "#374151",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Return Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
