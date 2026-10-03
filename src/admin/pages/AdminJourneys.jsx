import React, { useState, useEffect } from "react";
import { Plus, Camera } from "phosphor-react";
import { journeysRepo } from "../store/repos.js";
import { journeyFields } from "../config/fieldSchemas.js";
import { getAllEntityPhotoSummaries } from "../../utils/stayPhotoStorage.js";
import AdminTable from "../components/AdminTable.jsx";
import AdminFormModal from "../components/AdminFormModal.jsx";
import PhotoManagerModal from "../components/PhotoManagerModal.jsx";

export default function AdminJourneys() {
  const [items, setItems] = useState(journeysRepo.getAll());
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [managingPhotosJourney, setManagingPhotosJourney] = useState(null);
  const [photoSummaries, setPhotoSummaries] = useState({});

  async function loadPhotoSummaries() {
    try {
      const summaries = await getAllEntityPhotoSummaries();
      setPhotoSummaries(summaries || {});
    } catch (err) {
      console.warn("Failed to load journey photo summaries:", err);
    }
  }

  useEffect(() => {
    loadPhotoSummaries();

    function onPhotoUpdate() {
      loadPhotoSummaries();
    }
    window.addEventListener("photos-changed", onPhotoUpdate);
    window.addEventListener("homestay-photos-changed", onPhotoUpdate);
    return () => {
      window.removeEventListener("photos-changed", onPhotoUpdate);
      window.removeEventListener("homestay-photos-changed", onPhotoUpdate);
    };
  }, []);

  function refresh() {
    setItems(journeysRepo.getAll());
    loadPhotoSummaries();
  }

  function openEdit(row) {
    setEditing({
      ...row,
      destinations: Array.isArray(row.destinations) ? row.destinations.join(", ") : (row.destinations || ""),
      suggestedSequence: Array.isArray(row.suggestedSequence) ? row.suggestedSequence.join(", ") : (row.suggestedSequence || ""),
      highlights: Array.isArray(row.highlights) ? row.highlights.join(", ") : (row.highlights || ""),
    });
    setShowForm(true);
  }

  function save(values) {
    const payload = {
      ...values,
      destinations: values.destinations
        ? values.destinations.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      suggestedSequence: values.suggestedSequence
        ? values.suggestedSequence.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      highlights: values.highlights
        ? values.highlights.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    };

    if (editing) {
      journeysRepo.update("slug", editing.slug, payload);
    } else {
      const slug = values.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const newJourney = {
        slug,
        active: true,
        image: null,
        gallery: [],
        ...payload,
      };
      journeysRepo.add(newJourney);
    }
    refresh();
    setShowForm(false);
    setEditing(null);
  }

  function toggleActive(row) {
    journeysRepo.update("slug", row.slug, { active: row.active === false ? true : false });
    refresh();
  }

  function remove(row) {
    if (!window.confirm(`Delete journey "${row.name}"?`)) return;
    journeysRepo.remove("slug", row.slug);
    refresh();
  }

  return (
    <div>
      <h1 className="admin-page-title">Journeys</h1>
      <div className="admin-toolbar">
        <button
          className="admin-btn-primary"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus size={16} weight="bold" /> Add Journey
        </button>
      </div>

      <AdminTable
        columns={[
          { key: "name", label: "Journey" },
          { key: "permitNote", label: "Permit note" },
          {
            key: "photos",
            label: "Photos",
            render: (r) => {
              const summary = photoSummaries[r.slug];
              const hasCover = Boolean(summary?.coverUrl || r.image);
              const galleryCount = summary?.count
                ? Math.max(0, summary.count - (hasCover ? 1 : 0))
                : (Array.isArray(r.gallery) ? r.gallery.length : 0);
              const total = summary?.count ?? ((hasCover ? 1 : 0) + galleryCount);

              return (
                <button
                  type="button"
                  className="admin-photo-count-btn"
                  onClick={() => setManagingPhotosJourney(r)}
                  title="Manage journey cover photo and gallery slideshow"
                >
                  <Camera size={14} weight="bold" />
                  <span>
                    {total > 0
                      ? `${hasCover ? "Cover" : ""}${hasCover && galleryCount > 0 ? " + " : ""}${galleryCount > 0 ? `${galleryCount} gallery` : ""}`
                      : "Add Photos"}
                  </span>
                </button>
              );
            },
          },
        ]}
        rows={items.map((j) => ({ ...j, _rowKey: j.slug }))}
        onEdit={openEdit}
        onDelete={remove}
        onToggleActive={toggleActive}
        onManagePhotos={(r) => setManagingPhotosJourney(r)}
      />

      {showForm && (
        <AdminFormModal
          title={editing ? `Edit ${editing.name}` : "Add Journey"}
          fields={journeyFields}
          initialValues={editing}
          enablePreview
          onSave={save}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {managingPhotosJourney && (
        <PhotoManagerModal
          entity={managingPhotosJourney}
          entityType="Journey"
          idKey="slug"
          repo={journeysRepo}
          onClose={() => setManagingPhotosJourney(null)}
          onSaveSuccess={refresh}
        />
      )}
    </div>
  );
}