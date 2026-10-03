import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Camera, Bed } from "phosphor-react";
import { staysRepo } from "../store/repos.js";
import { deleteRoomsForProperty, getAllRoomsByPropertyId, saveRoomsForProperty } from "../../data/staysStore.js";
import AdminTable from "../components/AdminTable.jsx";
import StayFormModal from "../components/StayFormModal.jsx";
import StayPhotoManager from "../components/StayPhotoManager.jsx";
import PropertyRoomsManagerModal from "../components/PropertyRoomsManagerModal.jsx";
import { deletePhotosForEntity } from "../../utils/stayPhotoStorage.js";
import { assignPropertyToPartner, unassignProperty, getAllPartners } from "../../data/partners.js";

const DEFAULT_LOCATIONS = ["Mangan", "Lachen", "Lachung", "Dzongu", "Thangu"];

export default function AdminStays() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stays, setStays] = useState(staysRepo.getAll());
  const [partners, setPartners] = useState(getAllPartners());
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [managingPhotosStay, setManagingPhotosStay] = useState(null);
  const [managingRoomsStay, setManagingRoomsStay] = useState(null);

  function refresh() {
    setStays(staysRepo.getAll());
    setPartners(getAllPartners());
  }

  useEffect(() => {
    function onStorage() {
      refresh();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("admin-storage-changed", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("admin-storage-changed", onStorage);
    };
  }, []);

  useEffect(() => {
    const propParam = searchParams.get("property") || searchParams.get("manageRooms");
    if (propParam) {
      const found = stays.find((s) => s.id === propParam || s.id.toLowerCase() === propParam.toLowerCase());
      if (found) {
        setManagingRoomsStay(found);
      }
    }
  }, [searchParams, stays]);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(row) {
    setEditing(row);
    setShowForm(true);
  }

  function save(payload, allPhotos, roomsList) {
    if (editing && editing.id) {
      if (editing.partnerId && editing.partnerId !== payload.partnerId) {
        unassignProperty(editing.id);
      }
      staysRepo.update("id", editing.id, payload);
    } else {
      staysRepo.add(payload);
    }
    if (payload.partnerId) {
      assignPropertyToPartner(payload.partnerId, payload.id);
    }
    if (Array.isArray(roomsList)) {
      saveRoomsForProperty(payload.id, roomsList);
    }
    refresh();
    setShowForm(false);
    setEditing(null);
  }

  function toggleActive(row) {
    const isDraft = row.status === "draft" || row.active === false;
    const nextActive = isDraft;
    const nextStatus = isDraft ? "published" : "draft";
    staysRepo.update("id", row.id, { active: nextActive, status: nextStatus });
    refresh();
  }

  function toggleAvailability(row) {
    const next = row.availability === "available" ? "unavailable" : "available";
    staysRepo.update("id", row.id, { availability: next });
    refresh();
  }

  async function remove(row) {
    const propertyName = row.name || "this property";
    if (
      !window.confirm(
        `Are you sure you want to delete "${propertyName}"? This will permanently remove the stay and its uploaded photos from local storage.`
      )
    ) {
      return;
    }
    staysRepo.remove("id", row.id);
    unassignProperty(row.id);
    deleteRoomsForProperty(row.id);
    try {
      await deletePhotosForEntity(row.id);
    } catch (e) {
      console.warn("Could not delete photos from IndexedDB:", e);
    }
    refresh();
  }

  const locations = [
    ...new Set([
      ...DEFAULT_LOCATIONS,
      ...stays.map((s) => s.location).filter(Boolean),
    ]),
  ];

  return (
    <div>
      <h1 className="admin-page-title">Stays</h1>
      <div className="admin-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <button className="admin-btn-primary" onClick={openCreate}>
          <Plus size={16} weight="bold" /> Add New Stay
        </button>

        {stays.length > 0 && (
          <div className="admin-quick-room-select">
            <label htmlFor="admin-quick-rooms-dropdown">
              <Bed size={16} weight="bold" color="var(--color-peach-deep)" />
              <span>Manage Rooms by Property:</span>
            </label>
            <select
              id="admin-quick-rooms-dropdown"
              value={managingRoomsStay?.id || ""}
              onChange={(e) => {
                const target = stays.find((s) => s.id === e.target.value);
                if (target) setManagingRoomsStay(target);
              }}
            >
              <option value="">— Select Property to Manage Rooms —</option>
              {stays.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.location})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {locations.length === 0 && <p className="admin-page-note">No properties yet.</p>}

      {locations.map((loc) => {
        const staysInLoc = stays.filter((s) => s.location === loc);
        if (staysInLoc.length === 0) return null;

        return (
          <div key={loc} className="admin-subsection">
            <h2 className="admin-section-heading">{loc}</h2>
            <AdminTable
              columns={[
                {
                  key: "name",
                  label: "Property",
                  render: (r) => (
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <strong style={{ color: "var(--color-navy)" }}>{r.name || "Name not added"}</strong>
                      {r.id && (
                        <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                          ID: {r.id}
                        </span>
                      )}
                    </div>
                  ),
                },
                { key: "type", label: "Type" },
                {
                  key: "partnerId",
                  label: "Assigned Partner",
                  render: (r) => {
                    const partner = partners.find((p) => p.id === r.partnerId);
                    return r.partnerId ? (
                      <span className="admin-stay-partner-badge" title={`Partner ID: ${r.partnerId}`}>
                        {partner ? `${partner.name} (${partner.agency || partner.location})` : r.partnerId}
                      </span>
                    ) : (
                      <span className="admin-stay-unassigned-badge">Unassigned</span>
                    );
                  },
                },
                {
                  key: "status",
                  label: "Status",
                  render: (r) => {
                    const isDraft = r.status === "draft" || r.active === false;
                    return (
                      <button
                        type="button"
                        onClick={() => toggleActive(r)}
                        className={`admin-stay-status-pill ${
                          isDraft ? "admin-stay-status-pill--draft" : "admin-stay-status-pill--published"
                        }`}
                        title="Click to toggle Published / Draft"
                      >
                        {isDraft ? "Draft" : "Published"}
                      </button>
                    );
                  },
                },
                {
                  key: "availability",
                  label: "Availability",
                  render: (r) => (
                    <button
                      type="button"
                      onClick={() => toggleAvailability(r)}
                      className={`admin-stay-status-pill ${
                        r.availability === "available"
                          ? "admin-stay-status-pill--available"
                          : "admin-stay-status-pill--unavailable"
                      }`}
                      title="Click to toggle Available / Unavailable"
                    >
                      {r.availability === "available" ? "Available" : "Unavailable"}
                    </button>
                  ),
                },
                {
                  key: "rooms",
                  label: "Rooms",
                  render: (r) => {
                    const propertyRooms = getAllRoomsByPropertyId(r.id);
                    const count = propertyRooms.length;
                    const availableCount = propertyRooms.filter((rm) => rm.availability === "available").length;
                    return (
                      <button
                        type="button"
                        className="admin-rooms-count-btn"
                        onClick={() => setManagingRoomsStay(r)}
                        title={`Manage rooms for ${r.name}`}
                      >
                        <Bed size={14} weight="bold" />
                        <span>
                          {count > 0 ? `${count} ${count === 1 ? "room" : "rooms"} (${availableCount} open)` : "+ Add Rooms"}
                        </span>
                      </button>
                    );
                  },
                },
                {
                  key: "photos",
                  label: "Photos",
                  render: (r) => {
                    const hasCover = Boolean(r.image);
                    const galleryCount = Array.isArray(r.gallery) ? r.gallery.length : 0;
                    const total = (hasCover ? 1 : 0) + galleryCount;
                    return (
                      <button
                        type="button"
                        className="admin-photo-count-btn"
                        onClick={() => setManagingPhotosStay(r)}
                        title="Manage cover photo, upload images, reorder slideshow"
                      >
                        <Camera size={14} weight="bold" />
                        <span>
                          {total > 0
                            ? `${hasCover ? "Cover" : ""}${hasCover && galleryCount > 0 ? " + " : ""}${
                                galleryCount > 0 ? `${galleryCount} gallery` : ""
                              }`
                            : "Add Photos"}
                        </span>
                      </button>
                    );
                  },
                },
                {
                  key: "isSampleData",
                  label: "Source",
                  render: (r) => (r.isSampleData ? "Sample" : "Custom"),
                },
              ]}
              rows={staysInLoc.map((s) => ({ ...s, _rowKey: s.id }))}
              onEdit={openEdit}
              onDelete={remove}
              onToggleActive={toggleActive}
              onManageRooms={(r) => setManagingRoomsStay(r)}
            />
          </div>
        );
      })}

      {showForm && (
        <StayFormModal
          initialValues={editing}
          locations={locations}
          onSave={save}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {managingPhotosStay && (
        <StayPhotoManager
          stay={managingPhotosStay}
          onClose={() => setManagingPhotosStay(null)}
          onSaveSuccess={() => {
            refresh();
          }}
        />
      )}

      {managingRoomsStay && (
        <PropertyRoomsManagerModal
          property={managingRoomsStay}
          allProperties={stays}
          onSelectProperty={(nextStay) => setManagingRoomsStay(nextStay)}
          onClose={() => {
            setManagingRoomsStay(null);
            if (searchParams.get("property") || searchParams.get("manageRooms")) {
              setSearchParams({});
            }
            refresh();
          }}
        />
      )}
    </div>
  );
}