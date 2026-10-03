import React, { useState, useEffect } from "react";
import { Plus, Camera } from "phosphor-react";
import { destinationsRepo } from "../store/repos.js";
import { destinationFields } from "../config/fieldSchemas.js";
import { getAllEntityPhotoSummaries, savePhotosForProperty } from "../../utils/stayPhotoStorage.js";
import { getDefaultDestinationPhotos } from "../../data/destinationImages.js";
import AdminTable from "../components/AdminTable.jsx";
import AdminFormModal from "../components/AdminFormModal.jsx";
import PhotoManagerModal from "../components/PhotoManagerModal.jsx";

export default function AdminDestinations() {
  const [items, setItems] = useState(destinationsRepo.getAll());
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [managingPhotosDestination, setManagingPhotosDestination] = useState(null);
  const [photoSummaries, setPhotoSummaries] = useState({});

  async function loadPhotoSummaries() {
    try {
      const summaries = await getAllEntityPhotoSummaries();
      setPhotoSummaries(summaries || {});
    } catch (err) {
      console.warn("Failed to load destination photo summaries:", err);
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
    setItems(destinationsRepo.getAll());
    loadPhotoSummaries();
  }

  function openEdit(row) {
    const summary = photoSummaries[row.slug];
    const defaults = getDefaultDestinationPhotos(row.slug);
    const coverUrl = summary?.coverUrl || row.image || row.images?.card || row.images?.hero || defaults?.cover || "";
    let galleryList = [];
    if (Array.isArray(row.gallery) && row.gallery.length > 0) {
      galleryList = row.gallery;
    } else if (Array.isArray(row.images?.gallery) && row.images.gallery.length > 0) {
      galleryList = row.images.gallery;
    } else if (defaults?.gallery && defaults.gallery.length > 0) {
      galleryList = defaults.gallery;
    }

    setEditing({
      ...row,
      image: coverUrl,
      gallery: galleryList,
      highlights: Array.isArray(row.highlights) ? row.highlights.join(", ") : (row.highlights || ""),
      whyVisit: Array.isArray(row.whyVisit)
        ? row.whyVisit.map((v) => (typeof v === "object" ? v.title : v)).join(", ")
        : (row.whyVisit || ""),
    });
    setShowForm(true);
  }

  async function save(values) {
    let formattedWhyVisit = editing?.whyVisit || [];
    if (typeof values.whyVisit === "string") {
      const titles = values.whyVisit.split(",").map((s) => s.trim()).filter(Boolean);
      formattedWhyVisit = titles.map((t, idx) => {
        const existing = Array.isArray(editing?.whyVisit) ? editing.whyVisit[idx] : null;
        if (existing && typeof existing === "object" && existing.title === t) {
          return existing;
        }
        return {
          title: t,
          desc: existing?.desc || "",
          tag: existing?.tag || "Highlight",
        };
      });
    }

    const coverUrl = values.image || editing?.image || null;
    const galleryItems = Array.isArray(values.gallery)
      ? values.gallery.map((g, idx) => ({
          id: g.id || `gal_${idx}`,
          src: typeof g === "string" ? g : (g.src || g.dataUrl || ""),
          alt: g.alt || `${values.name || "Destination"} photo ${idx + 1}`,
          category: "Gallery",
        }))
      : (editing?.gallery || []);

    const targetSlug = editing?.slug || values.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const payload = {
      ...values,
      image: coverUrl,
      gallery: galleryItems,
      images: {
        ...(editing?.images || {}),
        card: coverUrl,
        hero: coverUrl,
        thumbnail: coverUrl,
        gallery: galleryItems,
      },
      highlights: values.highlights
        ? values.highlights.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      whyVisit: formattedWhyVisit,
    };

    if (editing) {
      destinationsRepo.update("slug", editing.slug, payload);
    } else {
      const newDest = {
        slug: targetSlug,
        active: true,
        relatedSlugs: [],
        ...payload,
      };
      destinationsRepo.add(newDest);
    }

    // Sync photos to IndexedDB photo store so useEntityPhotos reflects changes immediately
    if (coverUrl || (galleryItems && galleryItems.length > 0)) {
      try {
        const allPhotos = [];
        if (coverUrl) {
          allPhotos.push({
            id: `cover_${targetSlug}`,
            propertyId: targetSlug,
            dataUrl: coverUrl,
            name: `${values.name || "Destination"} Cover Photo`,
            isCover: true,
            order: 0,
            category: "Cover",
          });
        }
        galleryItems.forEach((g, idx) => {
          const cleanSrc = typeof g === "string" ? g : (g.src || g.dataUrl);
          if (cleanSrc && cleanSrc !== coverUrl) {
            allPhotos.push({
              id: g.id || `gal_${targetSlug}_${idx}`,
              propertyId: targetSlug,
              dataUrl: cleanSrc,
              name: g.alt || `${values.name || "Destination"} Photo ${idx + 1}`,
              isCover: false,
              order: allPhotos.length,
              category: "Gallery",
            });
          }
        });
        await savePhotosForProperty(targetSlug, allPhotos);
      } catch (err) {
        console.warn("Failed to sync destination photos to IndexedDB:", err);
      }
    }

    refresh();
    setShowForm(false);
    setEditing(null);
  }

  function toggleActive(row) {
    destinationsRepo.update("slug", row.slug, { active: row.active === false ? true : false });
    refresh();
  }

  function remove(row) {
    if (!window.confirm(`Delete destination "${row.name}"?`)) return;
    destinationsRepo.remove("slug", row.slug);
    refresh();
  }

  return (
    <div>
      <h1 className="admin-page-title">Destinations</h1>
      <div className="admin-toolbar">
        <button
          className="admin-btn-primary"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus size={16} weight="bold" /> Add Destination
        </button>
      </div>

      <AdminTable
        columns={[
          { key: "name", label: "Destination" },
          { key: "altitude", label: "Altitude" },
          { key: "distanceFromGangtok", label: "Distance" },
          { key: "tag", label: "Tag" },
          {
            key: "photos",
            label: "Photos",
            render: (r) => {
              const summary = photoSummaries[r.slug];
              const hasCover = Boolean(summary?.coverUrl || r.images?.card || r.images?.hero);
              const galleryCount = summary?.count
                ? Math.max(0, summary.count - (hasCover ? 1 : 0))
                : (Array.isArray(r.images?.gallery) ? r.images.gallery.length : 0);
              const total = summary?.count ?? ((hasCover ? 1 : 0) + galleryCount);

              return (
                <button
                  type="button"
                  className="admin-photo-count-btn"
                  onClick={() => setManagingPhotosDestination(r)}
                  title="Manage destination cover photo and gallery slideshow"
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
        rows={items.map((d) => ({ ...d, _rowKey: d.slug }))}
        onEdit={openEdit}
        onDelete={remove}
        onToggleActive={toggleActive}
        onManagePhotos={(r) => setManagingPhotosDestination(r)}
      />

      {showForm && (
        <AdminFormModal
          title={editing ? `Edit ${editing.name}` : "Add Destination"}
          fields={destinationFields}
          initialValues={editing}
          enablePreview
          onSave={save}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {managingPhotosDestination && (
        <PhotoManagerModal
          entity={managingPhotosDestination}
          entityType="Destination"
          idKey="slug"
          repo={destinationsRepo}
          onClose={() => setManagingPhotosDestination(null)}
          onSaveSuccess={refresh}
        />
      )}
    </div>
  );
}