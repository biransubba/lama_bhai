import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ImageSquare,
  Camera,
  Star,
  ArrowsLeftRight,
  Eye,
  HouseLine,
  CheckCircle,
  MapPin,
  Bed,
  WarningCircle,
} from "phosphor-react";
import { usePartnerAuth } from "../context/PartnerAuthContext.jsx";
import { api } from "../../utils/api.js";
import PhotoManagerModal from "../../admin/components/PhotoManagerModal.jsx";

export default function PartnerPhotos() {
  const { currentPartner } = usePartnerAuth();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [activeStayForPhotos, setActiveStayForPhotos] = useState(null);
  const [activeRoomForPhotos, setActiveRoomForPhotos] = useState(null);

  // Load properties scoped strictly to authenticated owner from backend MongoDB
  const loadProperties = useCallback(async () => {
    try {
      setPageError("");
      const res = await api.owner.getProperties();
      if (res && res.success) {
        setProperties(res.data || []);
      } else {
        setProperties([]);
      }
    } catch (err) {
      if (err.status === 401) {
        setPageError("Authentication required. Please log in to view your properties.");
      } else if (err.status === 403) {
        setPageError("Access denied: Partner/Owner account required to manage photos.");
      } else if (err.status >= 500) {
        setPageError("A server error occurred while retrieving properties. Please try again later.");
      } else {
        setPageError(err.message || "Failed to load properties from backend.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "var(--space-md)" }}>
        <div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            Photo Gallery &amp; Cover Images ({properties.length})
          </h1>
          <p className="admin-page-note" style={{ margin: "4px 0 0" }}>
            Upload high-resolution pictures, set your primary cover image, and arrange room gallery display order for <strong>{currentPartner?.name}</strong>'s properties.
          </p>
        </div>
      </div>

      {pageError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#fee2e2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            marginBottom: "var(--space-md)",
            fontSize: "0.85rem",
          }}
        >
          <WarningCircle size={18} style={{ flexShrink: 0 }} />
          <span>{pageError}</span>
        </div>
      )}

      {/* Guide Banner */}
      <div
        style={{
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          borderLeft: "4px solid #f97316",
          borderRadius: "var(--radius-sm)",
          padding: "12px 16px",
          marginBottom: "var(--space-lg)",
          fontSize: "0.84rem",
          color: "#9a3412",
          lineHeight: 1.5,
        }}
      >
        <Star size={16} weight="fill" color="#ea580c" style={{ display: "inline", verticalAlign: "text-bottom", marginRight: "6px" }} />
        <strong>Photo Management Guide:</strong> Click <em>Manage Photos</em> on any stay below to open the Photo Studio. You can upload multiple room views, click the <strong>Star</strong> icon to set any photo as the primary cover, and use the <strong>&larr; / &rarr;</strong> arrows to adjust gallery display order.
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid var(--color-peach-light)",
              borderTopColor: "var(--color-peach-deep)",
              borderRadius: "50%",
              animation: "partner-spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <style>{`@keyframes partner-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <span style={{ color: "var(--color-navy)", fontSize: "0.95rem", fontWeight: 600 }}>
            Loading properties from database...
          </span>
        </div>
      ) : properties.length === 0 ? (
        <div className="admin-card" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
          <ImageSquare size={36} color="var(--color-peach-deep)" style={{ marginBottom: "8px" }} />
          <h3 style={{ margin: "0 0 6px", color: "var(--color-navy)" }}>No Assigned Properties</h3>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            Your host account does not have properties assigned yet. Once assigned by Main Admin, you can upload photos here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {properties.map((stay) => {
            const stayId = stay._id || stay.id;
            const rawCover = stay.image || (stay.gallery?.[0]?.src || stay.gallery?.[0]?.dataUrl) || null;
            const coverUrl = typeof rawCover === "object" && rawCover !== null
              ? (rawCover.dataUrl || rawCover.src || "")
              : rawCover;
            const totalCount = Array.isArray(stay.gallery) ? stay.gallery.length : 0;

            const locationDisplay =
              typeof stay.location === "object" && stay.location !== null
                ? (stay.location.town ? `${stay.location.town}, ${stay.location.district}` : stay.location.district || "Sikkim")
                : (stay.location || "Sikkim");

            const stayRooms = Array.isArray(stay.rooms) ? stay.rooms.filter((r) => r.active !== false) : [];

            return (
              <div
                key={stayId}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "20px",
                  display: "flex",
                  gap: "20px",
                  alignItems: "center",
                  flexWrap: "wrap",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {/* Cover Preview */}
                <div
                  style={{
                    width: "160px",
                    height: "110px",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    background: "#e2e8f0",
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={stay.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-text-muted)",
                        fontSize: "0.75rem",
                      }}
                    >
                      <Camera size={28} color="#94a3b8" />
                      <span>No Cover Set</span>
                    </div>
                  )}

                  {coverUrl && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "6px",
                        left: "6px",
                        background: "rgba(23, 36, 58, 0.85)",
                        color: "#fed7aa",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <Star size={10} weight="fill" /> Cover
                    </span>
                  )}
                </div>

                {/* Details */}
                <div style={{ flexGrow: 1, minWidth: "240px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", color: "var(--color-navy)" }}>
                      {stay.name}
                    </h3>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        padding: "2px 7px",
                        borderRadius: "999px",
                        background: "var(--color-peach-light)",
                        color: "var(--color-navy)",
                        fontWeight: 700,
                      }}
                    >
                      {stay.type}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
                    <MapPin size={13} color="var(--color-forest)" /> {locationDisplay}
                  </div>

                  <div style={{ fontSize: "0.84rem", color: "var(--color-navy)", fontWeight: 600 }}>
                    {totalCount > 0 ? (
                      <span style={{ color: "var(--color-forest)" }}>
                        <CheckCircle size={14} weight="fill" style={{ verticalAlign: "middle", marginRight: "4px" }} />
                        {totalCount} {totalCount === 1 ? "Photo in Gallery" : "Photos in Gallery"}
                      </span>
                    ) : (
                      <span style={{ color: "#d97706" }}>
                        No gallery photos yet — add photos to attract travelers!
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    onClick={() => setActiveStayForPhotos(stay)}
                    style={{ fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <Camera size={16} weight="bold" /> Manage Photos &amp; Order
                  </button>

                  <Link
                    to={`/stays/${stay.slug || stayId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn admin-btn--secondary"
                    style={{ fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <Eye size={15} /> View on Site
                  </Link>
                </div>

                {/* Room Photo Galleries Breakdown */}
                {stayRooms.length > 0 && (
                  <div style={{ width: "100%", marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed var(--color-border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                      <strong style={{ fontSize: "0.82rem", color: "var(--color-navy)", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <Bed size={14} weight="duotone" color="var(--color-peach-deep)" />
                        Room-Specific Galleries ({stayRooms.length} {stayRooms.length === 1 ? "room unit" : "room units"})
                      </strong>
                      <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                        Room photos are stored separately from the main property gallery in MongoDB.
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                      {stayRooms.map((room) => {
                        const roomId = room._id || room.id;
                        const roomPhotoCount = (room.image ? 1 : 0) + (Array.isArray(room.gallery) ? room.gallery.length : 0);
                        return (
                          <div
                            key={roomId}
                            style={{
                              background: "#f8fafc",
                              border: "1px solid var(--color-border)",
                              borderRadius: "var(--radius-sm)",
                              padding: "8px 12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "8px",
                            }}
                          >
                            <div style={{ minWidth: 0, overflow: "hidden" }}>
                              <strong style={{ display: "block", fontSize: "0.82rem", color: "var(--color-navy)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {room.name}
                              </strong>
                              <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                                {roomPhotoCount} {roomPhotoCount === 1 ? "Photo" : "Photos"} · {room.type}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="admin-btn admin-btn--secondary"
                              onClick={() => setActiveRoomForPhotos(room)}
                              style={{ fontSize: "0.75rem", padding: "4px 8px", flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "4px" }}
                              title="Manage room-specific photos"
                            >
                              <Camera size={12} /> Photos
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stay Photo Manager Modal */}
      {activeStayForPhotos && (
        <PhotoManagerModal
          entity={activeStayForPhotos}
          entityType="Stay"
          idKey="_id"
          backendMode={true}
          onClose={() => setActiveStayForPhotos(null)}
          onSaveSuccess={() => {
            setActiveStayForPhotos(null);
            loadProperties();
          }}
        />
      )}

      {/* Room Photo Manager Modal (Keeps Room Media strictly isolated from Property Media) */}
      {activeRoomForPhotos && (
        <PhotoManagerModal
          entity={activeRoomForPhotos}
          entityType="Room"
          idKey="_id"
          backendMode={true}
          onClose={() => setActiveRoomForPhotos(null)}
          onSaveSuccess={() => {
            setActiveRoomForPhotos(null);
            loadProperties();
          }}
        />
      )}
    </div>
  );
}
