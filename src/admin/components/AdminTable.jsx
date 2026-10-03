import React from "react";
import { PencilSimple, Trash, ToggleLeft, ToggleRight, Camera, Bed } from "phosphor-react";

export default function AdminTable({
  columns,
  rows,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleAvailability,
  onManagePhotos,
  onManageRooms,
  activeField = "active",
}) {
  const hasAvailabilityCol = columns.some((c) => c.key === "availability");
  const hasPhotosCol = columns.some((c) => c.key === "photos");

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`admin-table__th admin-table__th--${c.key}`}>
                {c.label}
              </th>
            ))}
            <th className="admin-table__th admin-table__th--actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="admin-table__empty">
                No records yet.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row._rowKey}>
              {columns.map((c) => (
                <td key={c.key} className={`admin-table__td admin-table__td--${c.key}`}>
                  {c.render ? c.render(row) : (row[c.key] ?? "—")}
                </td>
              ))}
              <td className="admin-table__td admin-table__td--actions">
                <div className="admin-table__actions">
                  {onToggleAvailability && !hasAvailabilityCol && (
                    <button
                      type="button"
                      onClick={() => onToggleAvailability(row)}
                      className={`admin-availability-btn ${
                        row.availability === "available"
                          ? "admin-availability-btn--available"
                          : "admin-availability-btn--unavailable"
                      }`}
                      title="Toggle availability"
                    >
                      {row.availability === "available" ? "Available" : "Unavailable"}
                    </button>
                  )}
                  {onToggleActive && (
                    <button
                      type="button"
                      onClick={() => onToggleActive(row)}
                      title={row[activeField] !== false ? "Active / Published (Click to Draft)" : "Draft (Click to Publish)"}
                      aria-label={row[activeField] !== false ? "Active / Published" : "Draft"}
                      className="admin-icon-btn admin-icon-btn--toggle"
                    >
                      {row[activeField] !== false ? (
                        <ToggleRight size={20} weight="fill" color="#16a34a" />
                      ) : (
                        <ToggleLeft size={20} color="#94a3b8" />
                      )}
                    </button>
                  )}
                  {onManagePhotos && !hasPhotosCol && (
                    <button
                      type="button"
                      onClick={() => onManagePhotos(row)}
                      title="Manage Photos & Slideshow"
                      aria-label="Manage Photos & Slideshow"
                      className="admin-icon-btn admin-icon-btn--photos"
                    >
                      <Camera size={16} weight="bold" />
                    </button>
                  )}
                  {onManageRooms && (
                    <button
                      type="button"
                      onClick={() => onManageRooms(row)}
                      title="Manage Rooms"
                      aria-label="Manage Rooms"
                      className="admin-icon-btn admin-icon-btn--rooms"
                    >
                      <Bed size={16} weight="bold" />
                    </button>
                  )}
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      title="Edit details"
                      aria-label="Edit details"
                      className="admin-icon-btn admin-icon-btn--edit"
                    >
                      <PencilSimple size={16} weight="bold" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(row)}
                      title="Delete record"
                      aria-label="Delete record"
                      className="admin-icon-btn admin-icon-btn--danger"
                    >
                      <Trash size={16} weight="bold" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}