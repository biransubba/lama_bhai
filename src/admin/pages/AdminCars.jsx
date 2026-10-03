import React, { useState, useEffect } from "react";
import { Plus, Camera } from "phosphor-react";
import { carModelsRepo, carUnitsRepo } from "../store/repos.js";
import { carModelFields, carUnitFields } from "../config/fieldSchemas.js";
import { getAllEntityPhotoSummaries, deletePhotosForEntity } from "../../utils/stayPhotoStorage.js";
import AdminTable from "../components/AdminTable.jsx";
import AdminFormModal from "../components/AdminFormModal.jsx";
import PhotoManagerModal from "../components/PhotoManagerModal.jsx";

export default function AdminCars() {
  const [models, setModels] = useState(carModelsRepo.getAll());
  const [units, setUnits] = useState(carUnitsRepo.getAll());
  const [selectedModel, setSelectedModel] = useState(null);
  const [editingModel, setEditingModel] = useState(null);
  const [editingUnit, setEditingUnit] = useState(null);
  const [showModelForm, setShowModelForm] = useState(false);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [managingPhotosModel, setManagingPhotosModel] = useState(null);
  const [photoSummaries, setPhotoSummaries] = useState({});

  async function loadPhotoSummaries() {
    try {
      const summaries = await getAllEntityPhotoSummaries();
      setPhotoSummaries(summaries || {});
    } catch (err) {
      console.warn("Failed to load vehicle photo summaries:", err);
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
    setModels(carModelsRepo.getAll());
    loadPhotoSummaries();
  }
  function refreshUnits() { setUnits(carUnitsRepo.getAll()); }

  function saveModel(values) {
    if (editingModel) {
      carModelsRepo.update("slug", editingModel.slug, values);
    } else {
      const slug = values.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
      carModelsRepo.add({ slug, image: null, gallery: [], ...values });
    }
    refreshModels();
    setShowModelForm(false);
    setEditingModel(null);
  }

  function saveUnit(values) {
    if (editingUnit) {
      carUnitsRepo.update("id", editingUnit.id, values);
    } else {
      const id = `${selectedModel.slug}-${Date.now()}`;
      carUnitsRepo.add({
        id,
        modelSlug: selectedModel.slug,
        active: true,
        isSampleData: false,
        ...values,
      });
    }
    refreshUnits();
    setShowUnitForm(false);
    setEditingUnit(null);
  }

  function toggleModelActive(model) {
    carModelsRepo.update("slug", model.slug, { active: model.active === false ? true : false });
    refreshModels();
  }

  function toggleUnitActive(unit) {
    carUnitsRepo.update("id", unit.id, { active: !unit.active });
    refreshUnits();
  }
  function toggleUnitAvailability(unit) {
    const next = unit.availability === "available" ? "unavailable" : "available";
    carUnitsRepo.update("id", unit.id, { availability: next });
    refreshUnits();
  }

  function deleteModel(model) {
    if (!window.confirm(`Delete model "${model.name}" and all its vehicles?`)) return;
    const unitsToDelete = carUnitsRepo.getAll().filter((u) => u.modelSlug === model.slug);
    unitsToDelete.forEach((u) => carUnitsRepo.remove("id", u.id));
    carModelsRepo.remove("slug", model.slug);
    if (selectedModel?.slug === model.slug) setSelectedModel(null);
    refreshModels();
    refreshUnits();
  }

  async function deleteUnit(unit) {
    if (!window.confirm(`Delete vehicle unit "${unit.id}"? This action cannot be undone.`)) return;
    carUnitsRepo.remove("id", unit.id);
    try {
      await deletePhotosForEntity(unit.id);
    } catch (e) {
      console.warn("Could not delete vehicle photos:", e);
    }
    refreshUnits();
  }

  const unitsForSelected = selectedModel
    ? units.filter((u) => u.modelSlug === selectedModel.slug)
    : [];

  return (
    <div>
      <h1 className="admin-page-title">Cars</h1>

      <div className="admin-toolbar">
        <button className="admin-btn-primary" onClick={() => { setEditingModel(null); setShowModelForm(true); }}>
          <Plus size={16} weight="bold" /> Add vehicle model
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
                  title="Manage vehicle model cover photo and gallery slideshow"
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
            label: "Vehicles",
            render: (row) => (
              <button type="button" className="admin-link-btn" onClick={() => setSelectedModel(row)}>
                Manage vehicles
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
            <h2 className="admin-section-heading">{selectedModel.name} — individual vehicles</h2>
            <button className="admin-btn-primary" onClick={() => { setEditingUnit(null); setShowUnitForm(true); }}>
              <Plus size={16} weight="bold" /> Add individual vehicle
            </button>
          </div>

          <AdminTable
            columns={[
              { key: "id", label: "Vehicle ID" },
              { key: "vehicleNumber", label: "Vehicle number", render: (r) => r.vehicleNumber || "Not yet added" },
              { key: "seatingCapacity", label: "Seats" },
              {
                key: "availability",
                label: "Availability",
                render: (r) => (
                  <span className={`admin-stay-status-pill ${r.availability === "available" ? "admin-stay-status-pill--published" : "admin-stay-status-pill--draft"}`}>
                    {r.availability === "available" ? "Available" : "Unavailable"}
                  </span>
                ),
              },
              { key: "isSampleData", label: "Fleet Type", render: (r) => (r.isSampleData ? "Standard Fleet" : "Verified Fleet") },
            ]}
            rows={unitsForSelected.map((u) => ({ ...u, _rowKey: u.id }))}
            onEdit={(row) => { setEditingUnit(row); setShowUnitForm(true); }}
            onDelete={deleteUnit}
            onToggleActive={toggleUnitActive}
            onToggleAvailability={toggleUnitAvailability}
          />
        </div>
      )}

      {showModelForm && (
        <AdminFormModal
          title={editingModel ? "Edit vehicle model" : "Add vehicle model"}
          fields={carModelFields}
          initialValues={editingModel}
          onSave={saveModel}
          onClose={() => { setShowModelForm(false); setEditingModel(null); }}
        />
      )}

      {showUnitForm && (
        <AdminFormModal
          title={editingUnit ? "Edit vehicle" : `Add vehicle to ${selectedModel?.name}`}
          fields={carUnitFields}
          initialValues={editingUnit}
          onSave={saveUnit}
          onClose={() => { setShowUnitForm(false); setEditingUnit(null); }}
        />
      )}

      {managingPhotosModel && (
        <PhotoManagerModal
          entity={managingPhotosModel}
          entityType="Vehicle Model"
          idKey="slug"
          repo={carModelsRepo}
          onClose={() => setManagingPhotosModel(null)}
          onSaveSuccess={refreshModels}
        />
      )}
    </div>
  );
}