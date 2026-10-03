import React, { useState, useEffect } from "react";
import { Plus, Camera } from "phosphor-react";
import { bikeModelsRepo, bikeUnitsRepo } from "../store/repos.js";
import { bikeModelFields, bikeUnitFields } from "../config/fieldSchemas.js";
import { getAllEntityPhotoSummaries } from "../../utils/stayPhotoStorage.js";
import AdminTable from "../components/AdminTable.jsx";
import AdminFormModal from "../components/AdminFormModal.jsx";
import PhotoManagerModal from "../components/PhotoManagerModal.jsx";

export default function AdminBikes() {
  const [models, setModels] = useState(bikeModelsRepo.getAll());
  const [units, setUnits] = useState(bikeUnitsRepo.getAll());
  const [selectedModel, setSelectedModel] = useState(null);
  const [editingModel, setEditingModel] = useState(null);
  const [editingUnit, setEditingUnit] = useState(null);
  const [showModelForm, setShowModelForm] = useState(false);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [managingPhotosModel, setManagingPhotosModel] = useState(null);
  const [managingPhotosUnit, setManagingPhotosUnit] = useState(null);
  const [photoSummaries, setPhotoSummaries] = useState({});

  async function loadPhotoSummaries() {
    try {
      const summaries = await getAllEntityPhotoSummaries();
      setPhotoSummaries(summaries || {});
    } catch (err) {
      console.warn("Failed to load bike photo summaries:", err);
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

  function refreshModels() {
    setModels(bikeModelsRepo.getAll());
    loadPhotoSummaries();
  }
  function refreshUnits() {
    setUnits(bikeUnitsRepo.getAll());
    loadPhotoSummaries();
  }

  function saveModel(values) {
    if (editingModel) {
      bikeModelsRepo.update("slug", editingModel.slug, values);
    } else {
      const slug = values.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
      bikeModelsRepo.add({ slug, image: null, gallery: [], ...values });
    }
    refreshModels();
    setShowModelForm(false);
    setEditingModel(null);
  }

  function saveUnit(values) {
    if (editingUnit) {
      bikeUnitsRepo.update("id", editingUnit.id, values);
    } else {
      const id = `${selectedModel.slug}-${Date.now()}`;
      bikeUnitsRepo.add({
        id,
        modelSlug: selectedModel.slug,
        active: true,
        seating: 2,
        isSampleData: false,
        ...values,
      });
    }
    refreshUnits();
    setShowUnitForm(false);
    setEditingUnit(null);
  }

  function toggleModelActive(model) {
    bikeModelsRepo.update("slug", model.slug, { active: model.active === false ? true : false });
    refreshModels();
  }

  function toggleUnitActive(unit) {
    bikeUnitsRepo.update("id", unit.id, { active: !unit.active });
    refreshUnits();
  }
  function toggleUnitAvailability(unit) {
    const next = unit.availability === "available" ? "unavailable" : "available";
    bikeUnitsRepo.update("id", unit.id, { availability: next });
    refreshUnits();
  }

  function deleteModel(model) {
    if (!window.confirm(`Delete model "${model.name}" and all its units?`)) return;
    const unitsToDelete = bikeUnitsRepo.getAll().filter((u) => u.modelSlug === model.slug);
    unitsToDelete.forEach((u) => bikeUnitsRepo.remove("id", u.id));
    bikeModelsRepo.remove("slug", model.slug);
    if (selectedModel?.slug === model.slug) setSelectedModel(null);
    refreshModels();
    refreshUnits();
  }

  function deleteUnit(unit) {
    if (!window.confirm("Delete this bike?")) return;
    bikeUnitsRepo.remove("id", unit.id);
    refreshUnits();
  }

  const unitsForSelected = selectedModel
    ? units.filter((u) => u.modelSlug === selectedModel.slug)
    : [];

  return (
    <div>
      <h1 className="admin-page-title">Bikes</h1>

      <div className="admin-toolbar">
        <button className="admin-btn-primary" onClick={() => { setEditingModel(null); setShowModelForm(true); }}>
          <Plus size={16} weight="bold" /> Add bike model
        </button>
      </div>

      <AdminTable
        columns={[
          { key: "name", label: "Model" },
          { key: "category", label: "Category" },
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
                  onClick={() => setManagingPhotosModel(r)}
                  title="Manage bike model cover photo and gallery slideshow"
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
          {
            key: "manage",
            label: "Bikes",
            render: (row) => (
              <button type="button" className="admin-link-btn" onClick={() => setSelectedModel(row)}>
                Manage bikes
              </button>
            ),
          },
        ]}
        rows={models.map((m) => ({ ...m, _rowKey: m.slug }))}
        onEdit={(row) => { setEditingModel(row); setShowModelForm(true); }}
        onDelete={deleteModel}
        onToggleActive={toggleModelActive}
        onManagePhotos={(row) => setManagingPhotosModel(row)}
      />

      {selectedModel && (
        <div className="admin-subsection">
          <div className="admin-toolbar">
            <h2 className="admin-section-heading">{selectedModel.name} — individual bikes</h2>
            <button className="admin-btn-primary" onClick={() => { setEditingUnit(null); setShowUnitForm(true); }}>
              <Plus size={16} weight="bold" /> Add individual bike
            </button>
          </div>

          <AdminTable
            columns={[
              { key: "identifier", label: "Identifier", render: (r) => r.identifier || "Not yet added" },
              { key: "engineCC", label: "Engine", render: (r) => (r.engineCC ? `${r.engineCC}cc` : "—") },
              { key: "transmission", label: "Transmission", render: (r) => r.transmission || "—" },
              {
                key: "availability",
                label: "Availability",
                render: (r) => (
                  <span className={`admin-stay-status-pill ${r.availability === "available" ? "admin-stay-status-pill--published" : "admin-stay-status-pill--draft"}`}>
                    {r.availability === "available" ? "Available" : "Unavailable"}
                  </span>
                ),
              },
              {
                key: "photos",
                label: "Photos",
                render: (r) => {
                  const summary = photoSummaries[r.id];
                  const hasCover = Boolean(summary?.coverUrl || r.image);
                  const galleryCount = summary?.count
                    ? Math.max(0, summary.count - (hasCover ? 1 : 0))
                    : (Array.isArray(r.gallery) ? r.gallery.length : 0);
                  const total = summary?.count ?? ((hasCover ? 1 : 0) + galleryCount);

                  return (
                    <button
                      type="button"
                      className="admin-photo-count-btn"
                      onClick={() => setManagingPhotosUnit({ ...r, name: `${selectedModel?.name} (${r.identifier || "Unit"})` })}
                      title="Manage individual bike photos"
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
              { key: "isSampleData", label: "Fleet Type", render: (r) => (r.isSampleData ? "Standard Fleet" : "Verified Fleet") },
            ]}
            rows={unitsForSelected.map((u) => ({ ...u, _rowKey: u.id }))}
            onEdit={(row) => { setEditingUnit(row); setShowUnitForm(true); }}
            onDelete={deleteUnit}
            onToggleActive={toggleUnitActive}
            onToggleAvailability={toggleUnitAvailability}
            onManagePhotos={(row) => setManagingPhotosUnit({ ...row, name: `${selectedModel?.name} (${row.identifier || "Unit"})` })}
          />
        </div>
      )}

      {showModelForm && (
        <AdminFormModal
          title={editingModel ? "Edit bike model" : "Add bike model"}
          fields={bikeModelFields}
          initialValues={editingModel}
          onSave={saveModel}
          onClose={() => { setShowModelForm(false); setEditingModel(null); }}
        />
      )}

      {showUnitForm && (
        <AdminFormModal
          title={editingUnit ? "Edit bike" : `Add bike to ${selectedModel?.name}`}
          fields={bikeUnitFields}
          initialValues={editingUnit}
          onSave={saveUnit}
          onClose={() => { setShowUnitForm(false); setEditingUnit(null); }}
        />
      )}

      {managingPhotosModel && (
        <PhotoManagerModal
          entity={managingPhotosModel}
          entityType="Bike Model"
          idKey="slug"
          repo={bikeModelsRepo}
          onClose={() => setManagingPhotosModel(null)}
          onSaveSuccess={refreshModels}
        />
      )}

      {managingPhotosUnit && (
        <PhotoManagerModal
          entity={managingPhotosUnit}
          entityType="Bike Unit"
          idKey="id"
          repo={bikeUnitsRepo}
          onClose={() => setManagingPhotosUnit(null)}
          onSaveSuccess={() => { refreshUnits(); loadPhotoSummaries(); }}
        />
      )}
    </div>
  );
}