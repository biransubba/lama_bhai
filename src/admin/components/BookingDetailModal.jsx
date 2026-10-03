import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Eye,
  DownloadSimple,
  Printer,
  IdentificationCard,
  Camera,
  GlobeHemisphereWest,
  Users,
  MapPin,
  CalendarBlank,
  HouseLine,
  Bed,
} from "phosphor-react";
import { BOOKING_STATUSES, getInventoryForBooking } from "../../utils/bookingStorage.js";
import IndiaFlag from "../../components/IndiaFlag.jsx";

export default function BookingDetailModal({ request, onClose, onStatusChange }) {
  const [activeDocPreview, setActiveDocPreview] = useState(null);
  const resolvedInventory = getInventoryForBooking(request);
  const isStay = request.service === "Stay";
  const propertyName = resolvedInventory?.propertyName || (resolvedInventory && !resolvedInventory.roomName ? resolvedInventory.name : null) || request.propertyName || request.details?.find((d) => d.label === "Property")?.value || "Homestay";
  const roomName = resolvedInventory?.roomName || request.roomName || request.details?.find((d) => d.label === "Room" || d.label === "Selected Room")?.value || null;

  const permitData = request.permitData;
  const isPermit = request.service === "Permit" || Boolean(permitData);

  // Collect all uploaded documents from permitData
  const allPermitDocs = [];
  if (permitData) {
    const lead = permitData.leadTraveler || {};
    if (lead.passportPhoto) {
      allPermitDocs.push({
        id: "lead_photo",
        title: "Passport Photograph",
        role: "Lead Traveler",
        personName: lead.name || request.name,
        type: "Passport Photo",
        dataUrl: lead.passportPhoto,
      });
    }
    if (lead.idProof) {
      allPermitDocs.push({
        id: "lead_id",
        title: lead.idType || "Government ID Proof",
        role: "Lead Traveler",
        personName: lead.name || request.name,
        type: "Govt ID Proof",
        docNumber: lead.idNumber,
        dataUrl: lead.idProof,
      });
    }
    if (lead.passportCopy) {
      allPermitDocs.push({
        id: "lead_pass_copy",
        title: "International Passport (Bio Page)",
        role: "Lead Traveler",
        personName: lead.name || request.name,
        type: "Passport Copy",
        docNumber: lead.passportNumber,
        dataUrl: lead.passportCopy,
      });
    }
    if (lead.visaCopy) {
      allPermitDocs.push({
        id: "lead_visa_copy",
        title: "Indian Visa / e-Visa",
        role: "Lead Traveler",
        personName: lead.name || request.name,
        type: "Indian Visa",
        docNumber: lead.visaNumber,
        dataUrl: lead.visaCopy,
      });
    }

    // Co-travelers
    (permitData.coTravelers || []).forEach((ct, idx) => {
      if (ct.passportPhoto) {
        allPermitDocs.push({
          id: `cotrav_${idx}_photo`,
          title: "Passport Photograph",
          role: `Co-Traveler #${idx + 2}`,
          personName: ct.name || `Traveler ${idx + 2}`,
          type: "Passport Photo",
          dataUrl: ct.passportPhoto,
        });
      }
      if (ct.idProof) {
        allPermitDocs.push({
          id: `cotrav_${idx}_id`,
          title: ct.idType || "Government ID Proof",
          role: `Co-Traveler #${idx + 2}`,
          personName: ct.name || `Traveler ${idx + 2}`,
          type: "Govt ID Proof",
          docNumber: ct.idNumber,
          dataUrl: ct.idProof,
        });
      }
    });

    // Custom admin-configured uploaded documents
    if (Array.isArray(permitData.customDocuments)) {
      permitData.customDocuments.forEach((cd, idx) => {
        if (cd.dataUrl) {
          allPermitDocs.push({
            id: `custom_doc_${cd.key || idx}`,
            title: cd.label || "Custom Official Document",
            role: "Lead Traveler",
            personName: lead.name || request.name,
            type: cd.label || "Custom Requirement",
            docNumber: cd.name || "File attached",
            dataUrl: cd.dataUrl,
          });
        }
      });
    }
  }

  function handlePrintDoc(doc) {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${doc.role} - ${doc.title}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 20px; }
            h2 { margin: 0 0 6px; color: #17243a; }
            p { margin: 0 0 20px; color: #64748b; font-size: 14px; }
            img { max-width: 90%; max-height: 80vh; object-fit: contain; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <h2>${doc.role}: ${doc.personName}</h2>
          <p>${doc.title} ${doc.docNumber ? `(Doc No: ${doc.docNumber})` : ""} · Sikkim Police PAP Application</p>
          <img src="${doc.dataUrl}" />
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-label="Booking request detail">
        <div className="admin-modal__backdrop" onClick={onClose} />
        <div className="admin-modal__panel" style={{ maxWidth: isPermit ? "840px" : "640px" }}>
          <button className="admin-modal__close" onClick={onClose} aria-label="Close">
            <X size={20} weight="bold" />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
            <h2 className="admin-modal__title" style={{ margin: 0 }}>
              {request.service} Request ({request.id})
            </h2>
            {isPermit && (
              <span
                style={{
                  background: "#e8f5e9",
                  color: "#1b5e20",
                  border: "1px solid #b7dfc7",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <ShieldCheck size={14} weight="fill" />
                <span>Sikkim Police PAP Clearance</span>
              </span>
            )}
          </div>

          {/* Quick Customer Strip */}
          <div className="admin-preview__list">
            <div className="admin-preview__row">
              <span className="admin-preview__label">Customer Name</span>
              <span className="admin-preview__value">
                <strong>{request.name || "Not provided"}</strong>
              </span>
            </div>

            <div className="admin-preview__row">
              <span className="admin-preview__label">Phone / WhatsApp</span>
              <span className="admin-preview__value" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span>{request.phone || "Not provided"}</span>
                {request.phone && (
                  <>
                    <a
                      href={`https://wa.me/${request.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Hi ${request.name || "there"}, this is Lama Bhai Tourism regarding your ${request.service} inquiry (${request.id}).`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "#25d366",
                        color: "#fff",
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        textDecoration: "none",
                      }}
                    >
                      Chat on WhatsApp
                    </a>
                    <a
                      href={`tel:${request.phone.replace(/[^0-9+]/g, "")}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "var(--color-cream)",
                        color: "var(--color-navy)",
                        border: "1px solid var(--color-border)",
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        textDecoration: "none",
                      }}
                    >
                      Call
                    </a>
                  </>
                )}
              </span>
            </div>

            {request.email && (
              <div className="admin-preview__row">
                <span className="admin-preview__label">Email</span>
                <span className="admin-preview__value">{request.email}</span>
              </div>
            )}

            {isStay ? (
              <div
                style={{
                  background: "#f8fafc",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "14px 18px",
                  margin: "12px 0 16px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                    <HouseLine size={14} weight="bold" /> Property
                  </div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-navy)" }}>
                    {propertyName}
                  </div>
                  {request.propertyId && (
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "3px" }}>
                      Property ID: <code style={{ fontFamily: "monospace", color: "var(--color-navy)", background: "#e2e8f0", padding: "1px 5px", borderRadius: "3px" }}>{request.propertyId}</code>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                    <Bed size={14} weight="bold" /> Room
                  </div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: request.roomId ? "var(--color-peach-deep)" : "var(--color-navy)" }}>
                    {roomName && !roomName.includes("Entire Property") ? roomName : "Entire Property / General Stay"}
                  </div>
                  {request.roomId ? (
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "3px" }}>
                      Room ID: <code style={{ fontFamily: "monospace", color: "var(--color-peach-deep)", background: "#fee2e2", padding: "1px 5px", borderRadius: "3px" }}>{request.roomId}</code>
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontStyle: "italic", marginTop: "3px" }}>
                      Whole Property Reservation (No specific room)
                    </div>
                  )}
                </div>
              </div>
            ) : resolvedInventory ? (
              <div className="admin-preview__row">
                <span className="admin-preview__label">Referenced Asset</span>
                <span className="admin-preview__value">
                  <strong style={{ color: "var(--color-navy)" }}>
                    {resolvedInventory.name || resolvedInventory.modelSlug || resolvedInventory.vehicleNumber || resolvedInventory.identifier}
                  </strong>
                  {resolvedInventory.location ? ` · ${resolvedInventory.location}` : ""}
                </span>
              </div>
            ) : null}

            {!isStay && request.propertyId && (
              <div className="admin-preview__row">
                <span className="admin-preview__label">Property ID</span>
                <span className="admin-preview__value" style={{ fontFamily: "monospace", fontWeight: 600 }}>
                  {request.propertyId}
                </span>
              </div>
            )}

            {!isStay && request.roomId && (
              <div className="admin-preview__row">
                <span className="admin-preview__label">Room ID</span>
                <span className="admin-preview__value" style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--color-peach-deep)" }}>
                  {request.roomId}
                </span>
              </div>
            )}

            {request.inventoryId && !request.propertyId && !request.roomId && (
              <div className="admin-preview__row">
                <span className="admin-preview__label">Inventory ID</span>
                <span className="admin-preview__value" style={{ fontFamily: "monospace", fontWeight: 600 }}>
                  {request.inventoryId}
                </span>
              </div>
            )}

            {request.travellers && (
              <div className="admin-preview__row">
                <span className="admin-preview__label">Total Passengers / Travellers</span>
                <span className="admin-preview__value">
                  <strong>{request.travellers} Pax</strong>
                </span>
              </div>
            )}

            <div className="admin-preview__row">
              <span className="admin-preview__label">Submitted At</span>
              <span className="admin-preview__value">{new Date(request.submittedAt).toLocaleString()}</span>
            </div>
          </div>

          {/* ================================================================
              SPECIALIZED SIKKIM GOVERNMENT PERMIT DOSSIER (Requirement)
              ================================================================ */}
          {isPermit && permitData && (
            <div className="admin-permit-dossier">
              <div className="admin-permit-dossier__header">
                <h3 className="admin-permit-dossier__title">
                  <ShieldCheck size={20} color="var(--color-peach-deep)" />
                  <span>Sikkim Police &amp; PAP Clearance Application</span>
                </h3>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {permitData.nationality === "Foreign Tourist" ? (
                    <span style={{ background: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: "0.76rem", padding: "3px 8px", borderRadius: "4px" }}>
                      🌍 Foreign Passport ({permitData.leadTraveler?.nationalityCountry || "International"})
                    </span>
                  ) : (
                    <span style={{ background: "#e0f2fe", color: "#0369a1", fontWeight: 700, fontSize: "0.76rem", padding: "3px 8px", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <IndiaFlag width={16} height={11} />
                      <span>Indian Domestic Citizen</span>
                    </span>
                  )}

                  <span style={{ background: "var(--color-cream)", color: "var(--color-navy)", fontSize: "0.76rem", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", border: "1px solid var(--color-border)" }}>
                    {permitData.destination}
                  </span>
                </div>
              </div>

              {/* Logistics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "14px", background: "#ffffff", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Travel Start Date</span>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--color-navy)" }}>{permitData.travelDate || request.date || "—"}</div>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Duration in Sector</span>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--color-navy)" }}>{permitData.duration || "—"}</div>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Sikkim Hotel / Base</span>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--color-navy)" }}>{permitData.gangtokHotel || "Not specified"}</div>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Pickup Hub</span>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--color-navy)" }}>{permitData.pickupPoint || "Gangtok"}</div>
                </div>

                {permitData.emergencyContact && (
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Emergency Contact</span>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--color-navy)" }}>
                      {permitData.emergencyContact.name} ({permitData.emergencyContact.phone})
                    </div>
                  </div>
                )}

                {Array.isArray(permitData.customFields) &&
                  permitData.customFields.map((cf) => (
                    <div key={cf.key || cf.label}>
                      <span style={{ fontSize: "0.72rem", color: "var(--color-peach-deep)", fontWeight: 700, textTransform: "uppercase" }}>
                        {cf.label}
                      </span>
                      <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--color-navy)" }}>
                        {cf.value || "—"}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Traveler Roster Table */}
              <div style={{ margin: "14px 0 8px" }}>
                <strong style={{ fontSize: "0.88rem", color: "var(--color-navy)", display: "block", marginBottom: "4px" }}>
                  Official Traveler Roster ({1 + (permitData.coTravelers?.length || 0)} Pax)
                </strong>
                <div style={{ overflowX: "auto" }}>
                  <table className="admin-permit-roster-table">
                    <thead>
                      <tr>
                        <th>Role</th>
                        <th>Full Name</th>
                        <th>Age / Gender</th>
                        <th>ID Proof Type</th>
                        <th>ID / Passport No</th>
                        <th>Father / Spouse</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong style={{ color: "var(--color-peach-deep)" }}>Lead Traveler</strong></td>
                        <td><strong>{permitData.leadTraveler?.name || request.name}</strong></td>
                        <td>{permitData.leadTraveler?.age} yrs · {permitData.leadTraveler?.gender}</td>
                        <td>{permitData.leadTraveler?.idType || (permitData.nationality === "Foreign Tourist" ? "International Passport" : "Voter ID / Govt ID")}</td>
                        <td><code style={{ fontWeight: 700 }}>{permitData.leadTraveler?.idNumber || permitData.leadTraveler?.passportNumber || "—"}</code></td>
                        <td>{permitData.leadTraveler?.fatherOrSpouse || "—"}</td>
                      </tr>
                      {(permitData.coTravelers || []).map((ct, idx) => (
                        <tr key={ct.id || idx}>
                          <td>Co-Traveler #{idx + 2}</td>
                          <td><strong>{ct.name}</strong></td>
                          <td>{ct.age} yrs · {ct.gender}</td>
                          <td>{ct.idType}</td>
                          <td><code>{ct.idNumber || "—"}</code></td>
                          <td>—</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Uploaded Documents & Photos Gallery */}
              <div style={{ marginTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <strong style={{ fontSize: "0.88rem", color: "var(--color-navy)" }}>
                    Uploaded Government Documents &amp; Passport Photographs ({allPermitDocs.length})
                  </strong>
                  <span style={{ fontSize: "0.76rem", color: "var(--color-forest)", fontWeight: 700 }}>
                    ✓ Stored &amp; Ready for Checkpost Police Filing
                  </span>
                </div>

                {allPermitDocs.length === 0 ? (
                  <div style={{ background: "#ffffff", padding: "14px", borderRadius: "var(--radius-sm)", border: "1px dashed var(--color-border)", textAlign: "center", fontSize: "0.84rem", color: "var(--color-text-muted)" }}>
                    No digital documents were attached during this submission. (Physical copies must be verified at Gangtok office).
                  </div>
                ) : (
                  <div className="admin-permit-docs-grid">
                    {allPermitDocs.map((doc) => (
                      <div key={doc.id} className="admin-permit-doc-card">
                        <img
                          src={doc.dataUrl}
                          alt={doc.title}
                          className="admin-permit-doc-thumb"
                          onClick={() => setActiveDocPreview(doc)}
                          title="Click to view full size"
                        />
                        <div className="admin-permit-doc-meta">
                          <span className="admin-permit-doc-role">{doc.role}</span>
                          <span className="admin-permit-doc-name">{doc.title}</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                            {doc.personName} {doc.docNumber ? `· ${doc.docNumber}` : ""}
                          </span>
                        </div>
                        <div className="admin-permit-doc-btns">
                          <button
                            type="button"
                            className="admin-permit-btn-action"
                            onClick={() => setActiveDocPreview(doc)}
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>
                          <a
                            href={doc.dataUrl}
                            download={`permit_${doc.role.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${doc.type.toLowerCase().replace(/[^a-z0-9]/g, "_")}.jpg`}
                            className="admin-permit-btn-action"
                          >
                            <DownloadSimple size={14} />
                            <span>Save</span>
                          </a>
                          <button
                            type="button"
                            className="admin-permit-btn-action"
                            onClick={() => handlePrintDoc(doc)}
                          >
                            <Printer size={14} />
                            <span>Print</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Standard Details Fallback (if not a permit or for extra details) */}
          {(!isPermit || !permitData) && (
            <div className="admin-preview__list" style={{ marginTop: "12px" }}>
              {request.details?.map((d) => (
                <div className="admin-preview__row" key={d.label}>
                  <span className="admin-preview__label">{d.label}</span>
                  <span className="admin-preview__value">{d.value}</span>
                </div>
              ))}
              {request.notes && (
                <div className="admin-preview__row">
                  <span className="admin-preview__label">Additional requirements</span>
                  <span className="admin-preview__value">{request.notes}</span>
                </div>
              )}
            </div>
          )}

          {/* Cancellation Info */}
          {request.status === "Cancelled" && (
            <div
              style={{
                background: "#fef2f2",
                border: "1.5px solid #fecaca",
                borderLeft: "4px solid #ef4444",
                padding: "12px 16px",
                borderRadius: "var(--radius-sm)",
                margin: "14px 0",
              }}
            >
              <strong style={{ color: "#991b1b", display: "block", marginBottom: "4px" }}>
                Cancelled by {request.cancelledBy || "Guest"}
              </strong>
              {request.cancelledAt && (
                <div style={{ fontSize: "0.82rem", color: "#b91c1c", marginBottom: "2px" }}>
                  Cancelled on: {new Date(request.cancelledAt).toLocaleString()}
                </div>
              )}
              {request.cancellationReason && (
                <div style={{ fontSize: "0.84rem", color: "#7f1d1d", marginBottom: "2px" }}>
                  <strong>Reason:</strong> {request.cancellationReason}
                </div>
              )}
              {request.cancellationNotes && (
                <div style={{ fontSize: "0.84rem", color: "#7f1d1d" }}>
                  <strong>Guest Remarks:</strong> "{request.cancellationNotes}"
                </div>
              )}
            </div>
          )}

          {/* Status Selector */}
          <div style={{ marginTop: "18px", padding: "14px", background: "var(--color-cream)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
            <label className="admin-field" style={{ margin: 0 }}>
              <span style={{ fontSize: "0.85rem", color: "var(--color-navy)", fontWeight: 700 }}>
                Update Permit / Booking Processing Status:
              </span>
              <select
                value={request.status}
                onChange={(e) => onStatusChange(request.id, e.target.value)}
                style={{ marginTop: "4px", padding: "9px 12px", fontWeight: 700 }}
              >
                {BOOKING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s} {s === "Confirmed" ? "— (Permit Issued & Vehicle Cleared)" : s === "In Progress" ? "— (Verification at Police Checkpost)" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="admin-page-note" style={{ marginTop: "1rem", marginBottom: 0 }}>
            Inquiry record stored in administration database. Follow up directly with customer via phone or WhatsApp.
          </p>
        </div>
      </div>

      {/* Full Size Document Lightbox */}
      {activeDocPreview && (
        <div className="admin-doc-lightbox" role="dialog" aria-modal="true">
          <div className="admin-doc-lightbox__panel">
            <div className="admin-doc-lightbox__header">
              <div>
                <strong style={{ color: "var(--color-navy)", fontSize: "0.95rem" }}>
                  {activeDocPreview.role}: {activeDocPreview.personName}
                </strong>
                <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                  {activeDocPreview.title} {activeDocPreview.docNumber ? `· No: ${activeDocPreview.docNumber}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <a
                  href={activeDocPreview.dataUrl}
                  download="document.jpg"
                  className="admin-permit-btn-action"
                  style={{ background: "#ffffff" }}
                >
                  <DownloadSimple size={15} />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  className="admin-permit-btn-action"
                  style={{ background: "#ffffff" }}
                  onClick={() => handlePrintDoc(activeDocPreview)}
                >
                  <Printer size={15} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  className="permit-modal__close"
                  style={{ position: "static" }}
                  onClick={() => setActiveDocPreview(null)}
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
            </div>
            <div className="admin-doc-lightbox__body">
              <img src={activeDocPreview.dataUrl} alt={activeDocPreview.title} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}