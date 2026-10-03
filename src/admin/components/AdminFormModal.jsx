import React, { useState } from "react";
import { X, ArrowLeft, UploadSimple } from "phosphor-react";
import Dropdown from "../../components/Dropdown.jsx";
import { compressImageFile } from "../../utils/mediaService.js";

export default function AdminFormModal({ title, fields, initialValues, onSave, onClose, enablePreview = false, onFieldChange }) {
  const [values, setValues] = useState(() => {
    const v = {};
    fields.forEach((f) => {
      if (f.type === "gallery") {
        v[f.name] = Array.isArray(initialValues?.[f.name]) ? [...initialValues[f.name]] : [];
      } else {
        v[f.name] = initialValues?.[f.name] ?? "";
      }
    });
    return v;
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState("edit");
  const [uploadingGallery, setUploadingGallery] = useState(false);

  function handleChange(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (onFieldChange) onFieldChange(name, value);
  }

  async function handleImageChange(name, file) {
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      handleChange(name, compressed.dataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = () => handleChange(name, reader.result);
      reader.readAsDataURL(file);
    }
  }

  async function handleGalleryFiles(name, files) {
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    const newItems = [];
    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImageFile(file);
        newItems.push({
          src: compressed.dataUrl,
          alt: `${values.name || "Homestay"} photo`,
          category: "Gallery",
        });
      } catch (err) {
        console.warn("Failed to compress gallery image", err);
      }
    }
    setValues((prev) => {
      const existing = Array.isArray(prev[name]) ? prev[name] : [];
      const updated = [...existing, ...newItems];
      if (onFieldChange) onFieldChange(name, updated);
      return { ...prev, [name]: updated };
    });
    setUploadingGallery(false);
  }

  function handleRemoveGalleryItem(name, idxToRemove) {
    setValues((prev) => {
      const existing = Array.isArray(prev[name]) ? prev[name] : [];
      const updated = existing.filter((_, idx) => idx !== idxToRemove);
      if (onFieldChange) onFieldChange(name, updated);
      return { ...prev, [name]: updated };
    });
  }

  function validate() {
    const nextErrors = {};
    fields.forEach((f) => {
      if (f.required) {
        if (f.type === "gallery") {
          if (!Array.isArray(values[f.name]) || values[f.name].length === 0) {
            nextErrors[f.name] = "Required";
          }
        } else if (!String(values[f.name] || "").trim()) {
          nextErrors[f.name] = "Required";
        }
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmitEdit(e) {
    e.preventDefault();
    if (!validate()) return;
    if (enablePreview) {
      setStep("preview");
    } else {
      onSave(values);
    }
  }

  function handleConfirm() {
    onSave(values);
  }

  return (
    <div className="admin-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="admin-modal__backdrop" onClick={onClose} />
      <div className="admin-modal__panel">
        <button className="admin-modal__close" onClick={onClose} aria-label="Close">
          <X size={20} weight="bold" />
        </button>
        <h2 className="admin-modal__title">{title}</h2>

        {step === "edit" && (
          <form onSubmit={handleSubmitEdit} className="admin-form">
            {fields.map((f) => (
              <div key={f.name} className="admin-field">
                {f.type === "textarea" && (
                  <label className="admin-field__label">
                    <span className="admin-field__title">{f.label}{f.required && " *"}</span>
                    {f.help && <p className="admin-field__help">{f.help}</p>}
                    <textarea rows="3" value={values[f.name]} onChange={(e) => handleChange(f.name, e.target.value)} />
                  </label>
                )}

                {f.type === "select" && (
                  <div className="admin-field__label">
                    <Dropdown
                      label={f.label + (f.required ? " *" : "")}
                      options={f.options}
                      value={values[f.name]}
                      onChange={(v) => handleChange(f.name, v)}
                      placeholder="Select"
                      allowCustom={f.allowCustom}
                      customPlaceholder={f.customPlaceholder}
                      light
                    />
                    {f.help && <p className="admin-field__help">{f.help}</p>}
                  </div>
                )}

                {f.type === "image" && (
                  <div className="admin-image-field">
                    <span className="admin-field__title">{f.label}{f.required && " *"}</span>
                    {f.help && <p className="admin-field__help">{f.help}</p>}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(f.name, e.target.files?.[0])}
                    />
                    {values[f.name] && (
                      <div className="admin-image-preview-wrap">
                        <img src={values[f.name]} alt="Preview" className="admin-image-preview" />
                        <button type="button" className="admin-link-btn" onClick={() => handleChange(f.name, "")}>
                          Remove photo
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {f.type === "gallery" && (
                  <div className="admin-gallery-field">
                    <div className="admin-gallery-header">
                      <span className="admin-field__title">{f.label}{f.required && " *"}</span>
                      <span className="admin-gallery-count">
                        {(values[f.name] || []).length} {(values[f.name] || []).length === 1 ? "photo" : "photos"} added
                      </span>
                    </div>
                    {f.help && <p className="admin-field__help">{f.help}</p>}
                    
                    <div className="admin-gallery-actions">
                      <label className={`admin-gallery-upload-btn ${uploadingGallery ? "admin-gallery-upload-btn--loading" : ""}`}>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={uploadingGallery}
                          onChange={(e) => {
                            handleGalleryFiles(f.name, e.target.files);
                            e.target.value = "";
                          }}
                        />
                        <UploadSimple size={16} weight="bold" />
                        <span>{uploadingGallery ? "Compressing & Adding..." : "Upload Gallery Photos"}</span>
                      </label>
                    </div>

                    {Array.isArray(values[f.name]) && values[f.name].length > 0 && (
                      <div className="admin-gallery-grid">
                        {values[f.name].map((photo, idx) => {
                          const src = typeof photo === "string" ? photo : photo.src;
                          return (
                            <div key={src || idx} className="admin-gallery-thumb-card">
                              <img src={src} alt={`Gallery ${idx + 1}`} className="admin-gallery-thumb" />
                              <button
                                type="button"
                                className="admin-gallery-thumb-delete"
                                onClick={() => handleRemoveGalleryItem(f.name, idx)}
                                title="Remove photo"
                                aria-label={`Remove photo ${idx + 1}`}
                              >
                                <X size={12} weight="bold" />
                              </button>
                              <span className="admin-gallery-thumb-num">#{idx + 1}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {(!f.type || f.type === "text" || f.type === "number" || f.type === "date") && (
                  <label className="admin-field__label">
                    <span className="admin-field__title">{f.label}{f.required && " *"}</span>
                    {f.help && <p className="admin-field__help">{f.help}</p>}
                    <input
                      type={f.type || "text"}
                      value={values[f.name]}
                      onChange={(e) => handleChange(f.name, e.target.value)}
                      list={f.suggestions ? `${f.name}-list` : undefined}
                    />
                    {f.suggestions && (
                      <datalist id={`${f.name}-list`}>
                        {f.suggestions.map((s) => <option key={s} value={s} />)}
                      </datalist>
                    )}
                  </label>
                )}

                {errors[f.name] && <span className="admin-field__error">{errors[f.name]}</span>}
              </div>
            ))}
            <button type="submit" className="admin-form__submit">
              {enablePreview ? "Preview" : "Save"}
            </button>
          </form>
        )}

        {step === "preview" && (
          <div className="admin-preview">
            <p className="admin-page-note">Review before saving. Nothing has been saved yet.</p>
            <div className="admin-preview__list">
              {fields.map((f) => (
                <div key={f.name} className="admin-preview__row">
                  <span className="admin-preview__label">{f.label}</span>
                  {f.type === "image" ? (
                    values[f.name] ? <img src={values[f.name]} alt="Cover" className="admin-image-preview admin-image-preview--small" /> : <span>—</span>
                  ) : f.type === "gallery" ? (
                    Array.isArray(values[f.name]) && values[f.name].length > 0 ? (
                      <div className="admin-preview__gallery">
                        {values[f.name].map((photo, idx) => (
                          <img
                            key={idx}
                            src={typeof photo === "string" ? photo : photo.src}
                            alt=""
                            className="admin-image-preview admin-image-preview--small"
                          />
                        ))}
                      </div>
                    ) : (
                      <span>No gallery photos added</span>
                    )
                  ) : (
                    <span className="admin-preview__value">{values[f.name] || "—"}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="admin-preview__actions">
              <button type="button" className="admin-btn-secondary" onClick={() => setStep("edit")}>
                <ArrowLeft size={16} weight="bold" /> Back to edit
              </button>
              <button type="button" className="admin-form__submit" onClick={handleConfirm}>
                Confirm &amp; Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}