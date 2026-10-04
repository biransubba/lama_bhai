import React, { useState, useEffect } from "react";
import {
  X,
  Bed,
  Plus,
  PencilSimple,
  Trash,
  Camera,
  ArrowSquareOut,
  HouseLine,
  MapPinLine,
  Users,
  CurrencyInr,
  CheckCircle,
  XCircle,
  WarningCircle,
  Info,
  ArrowsDownUp,
  CaretRight,
} from "phosphor-react";
import {
  getAllRoomsByPropertyId,
  updateRoom,
  deleteRoom,
  roomsStore,
} from "../../data/staysStore.js";
import { parseAndFormatPrice } from "../../utils/priceFormatter.js";
import { api } from "../../utils/api.js";
import PhotoManagerModal from "./PhotoManagerModal.jsx";
import RoomFormModal from "./RoomFormModal.jsx";
import "./PropertyRoomsManagerModal.css";

export default function PropertyRoomsManagerModal({
  property,
  allProperties = [],
  onSelectProperty,
  onClose,
  backendMode = false,
}) {
  // Backend (MongoDB) properties use `_id`; legacy local-store properties use `id`.
  const propId = property ? property._id || property.id : null;
  if (!property || !propId) return null;

  const roomKey = (r) => r._id || r.id;
  const propLocation =
    property.location && typeof property.location === "object"
      ? [property.location.town, property.location.district].filter(Boolean).join(", ")
      : property.location;

  // Rooms state (MongoDB when backendMode, local store otherwise)
  const [rooms, setRooms] = useState(() => (backendMode ? [] : getAllRoomsByPropertyId(propId)));
  const [loadingRooms, setLoadingRooms] = useState(backendMode);
  const [roomError, setRoomError] = useState("");
  const [editingRoom, setEditingRoom] = useState(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [photoManagingRoom, setPhotoManagingRoom] = useState(null);

  function describeError(err) {
    if (err?.status === 401) return "Your session has expired. Please log in again.";
    if (err?.status === 403) return "Access denied: you do not have permission to manage this room.";
    if (err?.status === 404) return "Room or property not found. It may have been removed.";
    if (err?.status === 400) return err.message || "Invalid room details.";
    return "Something went wrong while contacting the server. Please try again.";
  }

  async function refreshRooms() {
    if (!backendMode) {
      setRooms(getAllRoomsByPropertyId(propId));
      return;
    }
    try {
      const res = await api.owner.getPropertyById(propId);
      const list = Array.isArray(res?.data?.rooms) ? res.data.rooms : [];
      // Deleted rooms are soft-deleted (active=false) by the backend
      setRooms(list.filter((r) => r.active !== false));
    } catch (err) {
      setRoomError(describeError(err));
    } finally {
      setLoadingRooms(false);
    }
  }

  useEffect(() => {
    refreshRooms();
  }, [propId]);

  useEffect(() => {
    if (backendMode) return undefined;
    function onStorage() {
      refreshRooms();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("admin-storage-changed", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("admin-storage-changed", onStorage);
    };
  }, [propId]);

  function notifyLocalChange() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin-storage-changed", { detail: { repo: "admin_rooms" } }));
      window.dispatchEvent(new CustomEvent("storage"));
    }
  }

  // 1-Click Availability Toggle
  async function handleToggleAvailability(room) {
    const nextAvailability = room.availability === "available" ? "unavailable" : "available";
    if (backendMode) {
      try {
        setRoomError("");
        await api.owner.updateRoom(roomKey(room), { availability: nextAvailability });
        await refreshRooms();
      } catch (err) {
        setRoomError(describeError(err));
      }
      return;
    }
    updateRoom(room.id, { availability: nextAvailability });
    refreshRooms();
    notifyLocalChange();
  }

  // 1-Click Status / Active Toggle
  async function handleToggleStatus(room) {
    const isDraft = room.status === "draft" || room.active === false;
    const nextStatus = isDraft ? "published" : "draft";
    const nextActive = isDraft;
    if (backendMode) {
      try {
        setRoomError("");
        // Draft is expressed via status only; active=false is reserved for deleted rooms
        await api.owner.updateRoom(roomKey(room), { status: nextStatus });
        await refreshRooms();
      } catch (err) {
        setRoomError(describeError(err));
      }
      return;
    }
    updateRoom(room.id, { status: nextStatus, active: nextActive });
    refreshRooms();
    notifyLocalChange();
  }

  // Delete Room
  async function handleDeleteRoom(room) {
    const confirmMsg = `Are you sure you want to remove "${room.name}" from ${property.name}?\n\nThis will remove the room and its booking options from the property.`;
    if (!window.confirm(confirmMsg)) return;

    if (backendMode) {
      try {
        setRoomError("");
        await api.owner.deleteRoom(roomKey(room));
        await refreshRooms();
      } catch (err) {
        setRoomError(describeError(err));
      }
      return;
    }
    deleteRoom(room.id);
    refreshRooms();
    notifyLocalChange();
  }

  const availableCount = rooms.filter((r) => r.availability === "available").length;
  const publishedCount = rooms.filter((r) => r.status !== "draft" && r.active !== false).length;

  return (
    <div className="prop-rooms-overlay" role="dialog" aria-modal="true" aria-labelledby="prop-rooms-title">
      <div className="prop-rooms-modal">
        {/* TOP NAVIGATION BREADCRUMB & HEADER */}
        <div className="prop-rooms__header">
          <div className="prop-rooms__header-info">
            <nav className="prop-rooms__breadcrumbs" aria-label="Breadcrumbs">
              <span className="prop-rooms__crumb-root">Stays / Properties</span>
              <span className="prop-rooms__crumb-sep">&gt;</span>
              <span className="prop-rooms__crumb-prop">{property.name}</span>
              <span className="prop-rooms__crumb-sep">&gt;</span>
              <span className="prop-rooms__crumb-current">Manage Rooms</span>
            </nav>
            <h1 id="prop-rooms-title" className="prop-rooms__title">
              Room Inventory for {property.name}
            </h1>
          </div>

          <button
            type="button"
            className="prop-rooms__close-btn"
            onClick={onClose}
            aria-label="Close Room Manager"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* PARENT PROPERTY CONTEXT CARD */}
        <section className="prop-rooms__parent-card" aria-label="Parent Property Details">
          <div className="prop-rooms__parent-main">
            <div className="prop-rooms__parent-avatar">
              <HouseLine size={24} weight="duotone" />
            </div>
            <div className="prop-rooms__parent-details">
              <div className="prop-rooms__parent-badges">
                <span className="prop-rooms__badge prop-rooms__badge--parent">Parent Property</span>
                <span className="prop-rooms__badge prop-rooms__badge--type">{property.type || "Accommodation"}</span>
                {propLocation && (
                  <span className="prop-rooms__badge prop-rooms__badge--loc">
                    <MapPinLine size={12} weight="bold" /> {propLocation}, Sikkim
                  </span>
                )}
                <span className="prop-rooms__badge prop-rooms__badge--id">
                  ID: <code>{propId}</code>
                </span>
              </div>
              <h2 className="prop-rooms__parent-name">{property.name}</h2>
              <p className="prop-rooms__parent-note">
                Managing all room units under this property. Adding rooms here automatically assigns <code>propertyId: "{propId}"</code> without manual entry.
              </p>
            </div>
          </div>

          {/* Quick Property Switcher */}
          {allProperties.length > 1 && (
            <div className="prop-rooms__switcher">
              <label htmlFor="prop-switcher-select">Switch Property:</label>
              <select
                id="prop-switcher-select"
                value={propId}
                onChange={(e) => {
                  const targetStay = allProperties.find((p) => (p._id || p.id) === e.target.value);
                  if (targetStay && onSelectProperty) onSelectProperty(targetStay);
                }}
              >
                {allProperties.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>
                    {p.name} ({(p.location && typeof p.location === "object" ? p.location.town : p.location) || "Sikkim"})
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        {/* TOOLBAR & STATS BAR */}
        <div className="prop-rooms__toolbar">
          <div className="prop-rooms__stats">
            <div className="prop-rooms__stat-item">
              <span className="prop-rooms__stat-val">{rooms.length}</span>
              <span className="prop-rooms__stat-label">Total Rooms</span>
            </div>
            <div className="prop-rooms__stat-item prop-rooms__stat-item--available">
              <span className="prop-rooms__stat-val">{availableCount}</span>
              <span className="prop-rooms__stat-label">Available</span>
            </div>
            <div className="prop-rooms__stat-item prop-rooms__stat-item--unavailable">
              <span className="prop-rooms__stat-val">{rooms.length - availableCount}</span>
              <span className="prop-rooms__stat-label">Blocked</span>
            </div>
            <div className="prop-rooms__stat-item">
              <span className="prop-rooms__stat-val">{publishedCount}</span>
              <span className="prop-rooms__stat-label">Published</span>
            </div>
          </div>

          <button
            type="button"
            className="admin-btn-primary prop-rooms__add-btn"
            onClick={() => setIsAddingRoom(true)}
          >
            <Plus size={16} weight="bold" /> Add Room to {property.name}
          </button>
        </div>

        {roomError && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "8px 14px",
              margin: "0 0 8px",
              borderRadius: "6px",
              fontSize: "0.84rem",
            }}
          >
            <WarningCircle size={16} style={{ flexShrink: 0 }} />
            <span>{roomError}</span>
          </div>
        )}

        {/* ROOMS LIST CONTAINER */}
        <div className="prop-rooms__content">
          {loadingRooms ? (
            <div className="prop-rooms__empty">
              <p className="prop-rooms__empty-text">Loading rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="prop-rooms__empty">
              <div className="prop-rooms__empty-icon">
                <Bed size={40} weight="duotone" />
              </div>
              <h3 className="prop-rooms__empty-title">No rooms currently added</h3>
              <p className="prop-rooms__empty-text">
                {property.name} has no individual room listings. Add room units (e.g. Standard Room, Deluxe Room, Suite) to offer room choices and direct booking options to travellers.
              </p>
              <button
                type="button"
                className="admin-btn-primary"
                onClick={() => setIsAddingRoom(true)}
              >
                <Plus size={16} weight="bold" /> Add First Room
              </button>
            </div>
          ) : (
            <div className="prop-rooms__grid">
              {rooms.map((room, idx) => {
                const formattedPrice = room.price ? parseAndFormatPrice(room.price) : null;
                const isAvailable = room.availability === "available";
                const isPublished = room.status !== "draft" && room.active !== false;
                const photoCount = (room.image ? 1 : 0) + (Array.isArray(room.gallery) ? room.gallery.length : 0);
                const amenitiesArr = Array.isArray(room.amenities)
                  ? room.amenities
                  : typeof room.amenities === "string"
                  ? room.amenities.split(",").map((s) => s.trim()).filter(Boolean)
                  : [];

                return (
                  <article key={roomKey(room)} className="prop-room-card">
                    {/* Index Badge */}
                    <div className="prop-room-card__index-pill">
                      #{idx + 1}
                    </div>

                    {/* Room Media Thumbnail */}
                    <div className="prop-room-card__media">
                      {room.image ? (
                        <img src={room.image} alt={room.name} className="prop-room-card__thumb" />
                      ) : (
                        <div className="prop-room-card__placeholder">
                          <Bed size={28} weight="duotone" />
                        </div>
                      )}
                      <span className="prop-room-card__type-badge">{room.type || "Room"}</span>
                    </div>

                    {/* Room Core Info */}
                    <div className="prop-room-card__body">
                      <div className="prop-room-card__meta-top">
                        <h3 className="prop-room-card__name">{room.name}</h3>
                        <span className="prop-room-card__id">ID: <code>{roomKey(room)}</code></span>
                      </div>

                      <div className="prop-room-card__chips">
                        {/* Price */}
                        <div className="prop-room-card__chip prop-room-card__chip--price">
                          <CurrencyInr size={14} weight="bold" />
                          <span>
                            {formattedPrice
                              ? `${formattedPrice.currency}${formattedPrice.formatted} ${formattedPrice.unit}`
                              : room.price || "Rate on inquiry"}
                          </span>
                        </div>

                        {/* Capacity */}
                        {room.capacity != null && (
                          <div className="prop-room-card__chip">
                            <Users size={14} />
                            <span>Up to {room.capacity} {room.capacity === 1 ? "Guest" : "Guests"}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {room.description && (
                        <p className="prop-room-card__desc">{room.description}</p>
                      )}

                      {/* Amenities */}
                      {amenitiesArr.length > 0 && (
                        <div className="prop-room-card__amenities">
                          {amenitiesArr.slice(0, 4).map((a, aIdx) => (
                            <span key={`${roomKey(room)}_am_${aIdx}`} className="prop-room-card__amenity-tag">
                              ✓ {a}
                            </span>
                          ))}
                          {amenitiesArr.length > 4 && (
                            <span className="prop-room-card__amenity-more">
                              +{amenitiesArr.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Interactive Toggles & Actions Bar */}
                    <div className="prop-room-card__controls">
                      {/* Availability & Publish Toggles */}
                      <div className="prop-room-card__toggles">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(room)}
                          className={`prop-room-toggle ${
                            isAvailable ? "prop-room-toggle--available" : "prop-room-toggle--unavailable"
                          }`}
                          title="Click to toggle availability"
                        >
                          {isAvailable ? <CheckCircle size={14} weight="fill" /> : <XCircle size={14} weight="fill" />}
                          <span>{isAvailable ? "Available" : "Blocked"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(room)}
                          className={`prop-room-toggle ${
                            isPublished ? "prop-room-toggle--published" : "prop-room-toggle--draft"
                          }`}
                          title="Click to toggle Published / Draft"
                        >
                          <span>{isPublished ? "Published" : "Draft"}</span>
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="prop-room-card__btns">
                        <a
                          href={`/stays/${property.slug || propId}/rooms/${roomKey(room)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="prop-room-btn prop-room-btn--view"
                          title="Preview public room view in new tab"
                        >
                          <ArrowSquareOut size={14} weight="bold" />
                          <span>View</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setEditingRoom(room)}
                          className="prop-room-btn prop-room-btn--edit"
                          title="Edit room specifications, pricing, amenities"
                        >
                          <PencilSimple size={14} weight="bold" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => !backendMode && setPhotoManagingRoom(room)}
                          disabled={backendMode}
                          className="prop-room-btn prop-room-btn--photos"
                          title={backendMode ? "Room photo management is handled in the Photos section" : "Manage room-specific photos & gallery"}
                        >
                          <Camera size={14} weight="bold" />
                          <span>Photos ({photoCount})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(room)}
                          className="prop-room-btn prop-room-btn--delete"
                          title="Remove room from property"
                        >
                          <Trash size={14} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="prop-rooms__footer">
          <span className="prop-rooms__footer-note">
            💡 Changes to rooms take effect immediately across customer booking inquiries and live availability displays.
          </span>
          <button type="button" className="admin-btn-secondary" onClick={onClose}>
            Done Managing Rooms
          </button>
        </div>
      </div>

      {/* ADD / EDIT ROOM MODAL */}
      {(isAddingRoom || editingRoom) && (
        <RoomFormModal
          property={property}
          backendMode={backendMode}
          room={editingRoom}
          onSave={() => {
            refreshRooms();
            setIsAddingRoom(false);
            setEditingRoom(null);
          }}
          onClose={() => {
            setIsAddingRoom(false);
            setEditingRoom(null);
          }}
        />
      )}

      {/* ROOM PHOTO MANAGER MODAL (Strictly isolates Room Media from Property Media) */}
      {photoManagingRoom && (
        <PhotoManagerModal
          entity={photoManagingRoom}
          entityType="Room"
          idKey={backendMode ? "_id" : "id"}
          backendMode={backendMode}
          repo={backendMode ? null : roomsStore}
          onClose={() => setPhotoManagingRoom(null)}
          onSaveSuccess={() => {
            refreshRooms();
          }}
        />
      )}
    </div>
  );
}
