import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle,
  WarningCircle,
  UploadSimple,
  Trash,
  Plus,
  ArrowRight,
  GlobeHemisphereWest,
  User,
  Users,
  IdentificationCard,
  Camera,
  MapPin,
  CalendarBlank,
  Sparkle,
  FileText,
} from "phosphor-react";
import IndiaFlag from "./IndiaFlag.jsx";
import Dropdown from "./Dropdown.jsx";
import { ModernWhatsAppIcon } from "./SocialIcons.jsx";
import { saveBookingRequest } from "../utils/bookingStorage.js";
import { compressImageFile } from "../utils/mediaService.js";
import { getContactSettings, buildWhatsAppLink } from "../data/contactSettings.js";
import { getPermitInfo, STATUS } from "../data/northSikkimPermitData.js";
import { getActiveCustomPermitRequirements } from "../data/permitSettingsStore.js";
import "./PermitBookingModal.css";

const SIKKIM_PERMIT_DESTINATIONS = [
  "Gurudongmar Lake",
  "Yumthang Valley",
  "Zero Point / Yumesamdong",
  "Lachen",
  "Lachung",
  "Thangu & Chopta Valley",
  "Tsomgo Lake & Baba Mandir",
  "Nathula Pass",
  "Dzongu (Lepcha Reserve)",
  "Green Lake Expedition",
];

const TRIP_DURATIONS = [
  "1 Day Excursion (East Sikkim / Tsomgo)",
  "2 Days / 1 Night (Lachen or Lachung)",
  "3 Days / 2 Nights (North Sikkim Circuit)",
  "4 Days / 3 Nights (Complete North Sikkim)",
  "5+ Days Custom Expedition",
];

const ID_TYPES_INDIAN = [
  "Voter ID Card (Election EPIC) — Strongly Recommended",
  "Indian Passport",
  "Driving License",
  "Aadhaar Card (With full address & DOB)",
];

export default function PermitBookingModal({
  context,
  initialNationality = "Indian Tourist",
  initialDestination = "Gurudongmar Lake",
  onClose,
}) {
  const [nationality, setNationality] = useState(
    context?.details?.find((d) => d.label === "Nationality")?.value || initialNationality
  );
  const [destination, setDestination] = useState(
    context?.details?.find((d) => d.label === "Destination")?.value || initialDestination
  );
  const [travelDate, setTravelDate] = useState("");
  const [duration, setDuration] = useState("3 Days / 2 Nights (North Sikkim Circuit)");
  const [gangtokHotel, setGangtokHotel] = useState("");
  const [pickupPoint, setPickupPoint] = useState("Gangtok Hotel / Taxi Stand");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Lead Traveler details
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [fatherOrSpouse, setFatherOrSpouse] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Indian Docs
  const [idType, setIdType] = useState(ID_TYPES_INDIAN[0]);
  const [idNumber, setIdNumber] = useState("");
  const [leadPhoto, setLeadPhoto] = useState(null);
  const [leadIdProof, setLeadIdProof] = useState(null);

  // Foreign Docs
  const [foreignCountry, setForeignCountry] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [visaNumber, setVisaNumber] = useState("");
  const [visaExpiry, setVisaExpiry] = useState("");
  const [ilpStatus, setIlpStatus] = useState("Arrange on border arrival (Lama Bhai assistance)");
  const [foreignPassportCopy, setForeignPassportCopy] = useState(null);
  const [foreignVisaCopy, setForeignVisaCopy] = useState(null);
  const [foreignPhoto, setForeignPhoto] = useState(null);

  // Co-travelers
  const [coTravelers, setCoTravelers] = useState([]);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // Dynamic Admin-Configured Document Requirements
  const [customRequirements, setCustomRequirements] = useState(() =>
    getActiveCustomPermitRequirements(nationality, destination)
  );
  const [customDocUploads, setCustomDocUploads] = useState({});
  const [customFieldValues, setCustomFieldValues] = useState({});

  useEffect(() => {
    function refreshRequirements() {
      setCustomRequirements(getActiveCustomPermitRequirements(nationality, destination));
    }
    refreshRequirements();
    window.addEventListener("admin-storage-changed", refreshRequirements);
    window.addEventListener("storage", refreshRequirements);
    return () => {
      window.removeEventListener("admin-storage-changed", refreshRequirements);
      window.removeEventListener("storage", refreshRequirements);
    };
  }, [nationality, destination]);

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const contactSettings = getContactSettings();
  const rule = getPermitInfo(nationality, destination);
  const isRestrictedForForeign = nationality === "Foreign Tourist" && rule?.status === STATUS.NOT_PERMITTED;

  // Helper to handle and compress file uploads
  async function handleFile(file, setFn, fieldKey) {
    if (!file) return;
    setUploadingField(fieldKey);
    try {
      const dataUrl = await compressImageFile(file, { maxWidth: 900, quality: 0.78 });
      setFn({
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        dataUrl,
      });
    } catch (err) {
      console.warn("Canvas compression fallback:", err);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFn({
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          dataUrl: e.target.result,
        });
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingField(null);
    }
  }

  // Helper to handle dynamic custom document uploads
  async function handleCustomFile(file, req) {
    if (!file) return;
    setUploadingField(req.key);
    try {
      const dataUrl = await compressImageFile(file, { maxWidth: 900, quality: 0.78 });
      setCustomDocUploads((prev) => ({
        ...prev,
        [req.key]: {
          key: req.key,
          label: req.label,
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          dataUrl,
          type: req.type,
          required: req.required,
        },
      }));
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[req.key];
        return copy;
      });
    } catch (err) {
      console.warn("Custom document compression fallback:", err);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomDocUploads((prev) => ({
          ...prev,
          [req.key]: {
            key: req.key,
            label: req.label,
            name: file.name,
            size: `${Math.round(file.size / 1024)} KB`,
            dataUrl: e.target.result,
            type: req.type,
            required: req.required,
          },
        }));
        setFormErrors((prev) => {
          const copy = { ...prev };
          delete copy[req.key];
          return copy;
        });
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingField(null);
    }
  }

  // Add co-traveler
  function addCoTraveler() {
    setCoTravelers((prev) => [
      ...prev,
      {
        id: `cotrav_${Date.now()}_${prev.length + 1}`,
        name: "",
        age: "",
        gender: "Male",
        fatherOrSpouse: "",
        idType: ID_TYPES_INDIAN[0],
        idNumber: "",
        passportPhoto: null,
        idProof: null,
      },
    ]);
  }

  // Update co-traveler
  function updateCoTraveler(index, key, val) {
    setCoTravelers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: val };
      return copy;
    });
  }

  // Remove co-traveler
  function removeCoTraveler(index) {
    setCoTravelers((prev) => prev.filter((_, idx) => idx !== index));
  }

  // Form Validation
  function validateForm() {
    const errs = {};
    if (!fullName.trim()) errs.fullName = "Lead traveler full name is required.";
    if (!phone.trim()) errs.phone = "Primary contact phone / WhatsApp is required.";
    if (!travelDate) errs.travelDate = "Please select your travel start date.";
    if (!gangtokHotel.trim()) errs.gangtokHotel = "Local Sikkim hotel / stay name is required by police checkposts.";

    if (nationality === "Indian Tourist") {
      if (!idNumber.trim()) errs.idNumber = "Government ID proof number is required.";
      if (!leadPhoto) errs.leadPhoto = "Please upload a recent passport-size photograph.";
      if (!leadIdProof) errs.leadIdProof = "Please upload a clear copy of your Govt ID proof.";
    } else {
      if (!foreignCountry.trim()) errs.foreignCountry = "Country of nationality is required.";
      if (!passportNumber.trim()) errs.passportNumber = "Valid passport number is required.";
      if (!foreignPhoto) errs.foreignPhoto = "Please upload a recent passport-size photograph.";
      if (!foreignPassportCopy) errs.foreignPassportCopy = "Please upload your Passport bio-data page.";
      if (!foreignVisaCopy) errs.foreignVisaCopy = "Please upload your valid Indian Visa / e-Visa.";
    }

    // Dynamic Admin-Configured Requirements Validation
    customRequirements.forEach((req) => {
      if (req.required) {
        if (req.type === "file") {
          if (!customDocUploads[req.key]) {
            errs[req.key] = `Please upload ${req.label}.`;
          }
        } else if (req.type === "checkbox") {
          if (!customFieldValues[req.key]) {
            errs[req.key] = `You must confirm ${req.label}.`;
          }
        } else {
          if (!customFieldValues[req.key] || !String(customFieldValues[req.key]).trim()) {
            errs[req.key] = `Please provide ${req.label}.`;
          }
        }
      }
    });

    if (!declarationAccepted) {
      errs.declaration = "You must accept the checkpost document authenticity declaration.";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Handle Submission
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const totalTravellers = 1 + coTravelers.length;

    const customDocsList = Object.values(customDocUploads).map((d) => ({
      key: d.key,
      label: d.label,
      name: d.name,
      size: d.size,
      dataUrl: d.dataUrl,
      type: d.type,
    }));

    const customFieldsList = Object.entries(customFieldValues).map(([k, val]) => {
      const req = customRequirements.find((r) => r.key === k);
      return {
        key: k,
        label: req?.label || k,
        value: typeof val === "boolean" ? (val ? "Yes / Confirmed" : "No") : String(val),
      };
    });

    // Structured Permit Dossier
    const permitData = {
      permitType: nationality === "Foreign Tourist" ? "Protected Area Permit (Foreign PAP & RAP)" : "Protected Area Permit (Domestic PAP)",
      nationality,
      destination,
      travelDate,
      duration,
      gangtokHotel,
      pickupPoint,
      emergencyContact: {
        name: emergencyName || "Not provided",
        phone: emergencyPhone || "Not provided",
      },
      leadTraveler: {
        name: fullName,
        age: age || "—",
        gender,
        fatherOrSpouse: fatherOrSpouse || "—",
        phone,
        email,
        ...(nationality === "Indian Tourist"
          ? {
              idType,
              idNumber,
              passportPhoto: leadPhoto?.dataUrl || null,
              idProof: leadIdProof?.dataUrl || null,
            }
          : {
              nationalityCountry: foreignCountry,
              passportNumber,
              passportExpiry: passportExpiry || "—",
              visaNumber: visaNumber || "—",
              visaExpiry: visaExpiry || "—",
              ilpStatus,
              passportPhoto: foreignPhoto?.dataUrl || null,
              passportCopy: foreignPassportCopy?.dataUrl || null,
              visaCopy: foreignVisaCopy?.dataUrl || null,
            }),
      },
      customDocuments: customDocsList,
      customFields: customFieldsList,
      coTravelers: coTravelers.map((ct) => ({
        id: ct.id,
        name: ct.name || "Co-Traveler",
        age: ct.age || "—",
        gender: ct.gender,
        idType: ct.idType,
        idNumber: ct.idNumber || "—",
        passportPhoto: ct.passportPhoto?.dataUrl || null,
        idProof: ct.idProof?.dataUrl || null,
      })),
      declarationAccepted: true,
      hasDocumentsAttached: true,
      documentCount:
        (nationality === "Indian Tourist"
          ? (leadPhoto ? 1 : 0) + (leadIdProof ? 1 : 0)
          : (foreignPhoto ? 1 : 0) + (foreignPassportCopy ? 1 : 0) + (foreignVisaCopy ? 1 : 0)) +
        coTravelers.reduce(
          (acc, ct) => acc + (ct.passportPhoto ? 1 : 0) + (ct.idProof ? 1 : 0),
          0
        ) +
        customDocsList.length,
    };

    // Generic key-value pairs for universal backward compatibility
    const details = [
      { label: "Permit Type", value: permitData.permitType },
      { label: "Nationality", value: nationality },
      { label: "Destination", value: destination },
      { label: "Travel Date", value: travelDate },
      { label: "Duration", value: duration },
      { label: "Total Travellers", value: `${totalTravellers} pax (1 Lead + ${coTravelers.length} Co-travelers)` },
      { label: "Sikkim Hotel", value: gangtokHotel },
      { label: "Pickup Hub", value: pickupPoint },
      ...(nationality === "Indian Tourist"
        ? [
            { label: "ID Type", value: idType },
            { label: "Govt ID Number", value: idNumber },
          ]
        : [
            { label: "Country", value: foreignCountry },
            { label: "Passport Number", value: passportNumber },
            { label: "Visa Number", value: visaNumber || "Not entered" },
            { label: "ILP / RAP", value: ilpStatus },
          ]),
      ...customDocsList.map((doc) => ({
        label: doc.label,
        value: `✓ Attached (${doc.name})`,
      })),
      ...customFieldsList.map((f) => ({
        label: f.label,
        value: f.value,
      })),
      { label: "Document Status", value: `✓ ${permitData.documentCount} Official Documents & Passport Photos Attached` },
      { label: "Emergency Contact", value: `${emergencyName} (${emergencyPhone})` },
    ];

    try {
      const saved = saveBookingRequest({
        service: "Permit",
        name: fullName,
        phone,
        email,
        date: travelDate,
        travellers: totalTravellers,
        nationality,
        details,
        permitData,
      });

      setSubmittedData({
        ...saved,
        totalTravellers,
        destination,
        travelDate,
        nationality,
      });
      window.dispatchEvent(new CustomEvent("admin-storage-changed"));
    } catch (err) {
      console.error("Error saving permit application:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Pre-filled WhatsApp notification message
  const whatsappPreFill = submittedData
    ? `Hi Lama Bhai Tourism, I have submitted my official Sikkim Permit application on your website!
*Permit Reference:* ${submittedData.id}
*Applicant:* ${submittedData.name}
*Nationality:* ${submittedData.nationality}
*Destination:* ${submittedData.destination}
*Travel Date:* ${submittedData.travelDate}
*Group Size:* ${submittedData.totalTravellers} traveler(s)
*Documents Uploaded:* Photos and Government ID Proofs attached.

Please review my documents and confirm checkpost vehicle permit clearance. Thank you!`
    : "";

  const whatsappUrl = buildWhatsAppLink(contactSettings.whatsapp, whatsappPreFill);

  // --------------------------------------------------------------------------
  // SUCCESS RECEIPT VIEW
  // --------------------------------------------------------------------------
  if (submittedData) {
    return (
      <div className="permit-modal" role="dialog" aria-modal="true">
        <div className="permit-modal__backdrop" onClick={onClose} />
        <div className="permit-modal__panel" style={{ maxWidth: "600px" }}>
          <button className="permit-modal__close" onClick={onClose} aria-label="Close">
            <X size={20} weight="bold" />
          </button>

          <div className="permit-success-view">
            <div className="permit-success-icon">
              <CheckCircle size={44} weight="fill" />
            </div>

            <h2 className="permit-modal__title">Permit Application Submitted!</h2>
            <p className="permit-modal__sub">
              Your official Protected Area Permit (PAP) application and uploaded identity documents have been securely transmitted to the Lama Bhai Tourism permit operations desk in Gangtok.
            </p>

            <div className="permit-receipt-box">
              <div className="permit-receipt-row">
                <span className="permit-receipt-label">Permit Reference ID</span>
                <span className="permit-receipt-val" style={{ fontFamily: "monospace", color: "var(--color-peach-deep)" }}>
                  {submittedData.id}
                </span>
              </div>
              <div className="permit-receipt-row">
                <span className="permit-receipt-label">Applicant Name</span>
                <span className="permit-receipt-val">{submittedData.name}</span>
              </div>
              <div className="permit-receipt-row">
                <span className="permit-receipt-label">Nationality & Category</span>
                <span className="permit-receipt-val">{submittedData.nationality}</span>
              </div>
              <div className="permit-receipt-row">
                <span className="permit-receipt-label">Permit Sector</span>
                <span className="permit-receipt-val">{submittedData.destination}</span>
              </div>
              <div className="permit-receipt-row">
                <span className="permit-receipt-label">Travel Date</span>
                <span className="permit-receipt-val">{submittedData.travelDate}</span>
              </div>
              <div className="permit-receipt-row">
                <span className="permit-receipt-label">Total Travelers</span>
                <span className="permit-receipt-val">{submittedData.totalTravellers} Pax</span>
              </div>
              <div className="permit-receipt-row">
                <span className="permit-receipt-label">Attached Documents</span>
                <span className="permit-receipt-val" style={{ color: "var(--color-forest)" }}>
                  ✓ Passport Photos &amp; IDs Uploaded
                </span>
              </div>
            </div>

            <div className="permit-reminder-list">
              <strong>Mandatory Checkpost Instructions:</strong>
              <ul>
                <li>All travelers must carry their <strong>original physical Government Photo ID / Passport</strong> during travel.</li>
                <li>Carry <strong>4 physical passport-size photographs per person</strong> for physical police checkpost stamping.</li>
                <li>Digital copies on mobile phones are strictly not accepted at Indian Army and Sikkim Police checkposts.</li>
              </ul>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "20px" }}>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="permit-btn-submit"
                style={{ textDecoration: "none", background: "#25d366" }}
              >
                <ModernWhatsAppIcon size={18} />
                <span>Confirm on WhatsApp ({submittedData.id})</span>
              </a>

              <button type="button" className="permit-btn-cancel" onClick={onClose}>
                Close &amp; Return to Guide
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // PERMIT APPLICATION FORM
  // --------------------------------------------------------------------------
  return (
    <div className="permit-modal" role="dialog" aria-modal="true" aria-label="Official Sikkim Government Permit Application">
      <div className="permit-modal__backdrop" onClick={onClose} />
      <div className="permit-modal__panel">
        <button className="permit-modal__close" onClick={onClose} aria-label="Close permit application">
          <X size={20} weight="bold" />
        </button>

        <div className="permit-modal__header">
          <div className="permit-modal__badge-row">
            <span className="permit-modal__badge">
              <ShieldCheck size={16} weight="fill" />
              <span>Sikkim Police &amp; Tourism Department Clearance</span>
            </span>
            <span className="permit-modal__badge" style={{ background: "#fef3c7", color: "#92400e", borderColor: "#fde68a" }}>
              <span>Official Protected Area Permit (PAP)</span>
            </span>
          </div>

          <h2 className="permit-modal__title">Sikkim Government Permit Application</h2>
          <p className="permit-modal__sub">
            Please fill in traveler details and upload clear copies of government-mandated documents (photo ID proofs and passport photographs) as strictly required by Sikkim Police checkposts.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Section 0: Nationality Selector */}
          <div className="permit-form-section" style={{ background: "#ffffff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <strong style={{ display: "block", color: "var(--color-navy)", fontSize: "0.92rem" }}>
                  1. Traveler Nationality (Permit Rule Set)
                </strong>
                <span className="permit-hint">
                  Requirements and checkpost clearances differ by citizenship.
                </span>
              </div>

              <div className="permit-pills-group" style={{ margin: 0 }}>
                <button
                  type="button"
                  className={`permit-pill-btn ${nationality === "Indian Tourist" ? "permit-pill-btn--active" : ""}`}
                  onClick={() => setNationality("Indian Tourist")}
                >
                  <IndiaFlag width={20} height={14} />
                  <span>Indian Citizen</span>
                </button>

                <button
                  type="button"
                  className={`permit-pill-btn ${nationality === "Foreign Tourist" ? "permit-pill-btn--active" : ""}`}
                  onClick={() => setNationality("Foreign Tourist")}
                >
                  <GlobeHemisphereWest size={18} weight="bold" />
                  <span>Foreign National</span>
                </button>
              </div>
            </div>

            {isRestrictedForForeign && (
              <div style={{ marginTop: "12px", background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 14px", borderRadius: "6px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <WarningCircle size={22} weight="fill" color="#dc2626" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div style={{ fontSize: "0.82rem", color: "#991b1b", lineHeight: 1.45 }}>
                  <strong>Notice for International Visitors:</strong> {destination} borders an Indo-China defense zone and is restricted to Indian citizens only.
                  {" "}Foreign travelers are permitted to visit <strong>Yumthang Valley, Lachen, Lachung, and Chopta Valley</strong>.
                  <div style={{ marginTop: "6px" }}>
                    <button
                      type="button"
                      className="alert-action-btn alert-action-btn--primary"
                      onClick={() => setDestination("Yumthang Valley")}
                    >
                      Switch to Yumthang Valley (Permitted)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 1: Trip & Route Details */}
          <div className="permit-form-section">
            <div className="permit-form-section__header">
              <span className="permit-form-section__number">2</span>
              <div>
                <h3 className="permit-form-section__title">Permit Route &amp; Mountain Logistics</h3>
                <p className="permit-form-section__subtitle">Specify travel dates, requested sector, and local stay in Sikkim</p>
              </div>
            </div>

            <div className="permit-grid-2">
              <div className="permit-field-wrap">
                <label>
                  <MapPin size={16} color="var(--color-peach-deep)" />
                  <span>Permit Destination / Sector <span className="permit-req">*</span></span>
                </label>
                <select
                  className="permit-select"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                >
                  {SIKKIM_PERMIT_DESTINATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} {nationality === "Foreign Tourist" && (d.includes("Gurudongmar") || d.includes("Zero Point") || d.includes("Nathula")) ? "(Indian Citizens Only)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="permit-field-wrap">
                <label>
                  <CalendarBlank size={16} color="var(--color-peach-deep)" />
                  <span>Travel Start Date <span className="permit-req">*</span></span>
                </label>
                <input
                  type="date"
                  className="permit-input"
                  value={travelDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setTravelDate(e.target.value)}
                />
                {formErrors.travelDate && <span className="permit-req" style={{ fontSize: "0.75rem" }}>{formErrors.travelDate}</span>}
              </div>

              <div className="permit-field-wrap">
                <label>
                  <span>Duration in Protected Zone</span>
                </label>
                <select
                  className="permit-select"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  {TRIP_DURATIONS.map((dur) => (
                    <option key={dur} value={dur}>{dur}</option>
                  ))}
                </select>
              </div>

              <div className="permit-field-wrap">
                <label>
                  <span>Hotel / Stay in Sikkim <span className="permit-req">*</span></span>
                </label>
                <input
                  type="text"
                  className="permit-input"
                  placeholder="e.g. Hotel Golden Crest, Gangtok"
                  value={gangtokHotel}
                  onChange={(e) => setGangtokHotel(e.target.value)}
                />
                <span className="permit-hint">Required by checkpost police to record your local base.</span>
                {formErrors.gangtokHotel && <span className="permit-req" style={{ fontSize: "0.75rem" }}>{formErrors.gangtokHotel}</span>}
              </div>

              <div className="permit-field-wrap">
                <label>
                  <span>Pickup Location in Gangtok</span>
                </label>
                <input
                  type="text"
                  className="permit-input"
                  placeholder="e.g. Hotel lobby, Vajra Stand, Deorali Stand"
                  value={pickupPoint}
                  onChange={(e) => setPickupPoint(e.target.value)}
                />
              </div>

              <div className="permit-field-wrap">
                <label>
                  <span>Emergency Contact (Name &amp; Phone)</span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <input
                    type="text"
                    className="permit-input"
                    placeholder="Contact person"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                  />
                  <input
                    type="tel"
                    className="permit-input"
                    placeholder="Phone number"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Lead Traveler Information & Official Documents */}
          <div className="permit-form-section">
            <div className="permit-form-section__header">
              <span className="permit-form-section__number">3</span>
              <div>
                <h3 className="permit-form-section__title">
                  Lead Traveler &amp; Official Government Documents
                </h3>
                <p className="permit-form-section__subtitle">
                  {nationality === "Indian Tourist"
                    ? "Upload clear Passport-size Photo & Government Photo ID Proof (Voter ID, Passport, DL, or Aadhaar)"
                    : "Upload clear Passport-size Photo, International Passport bio-data page, and Indian Visa / e-Visa"}
                </p>
              </div>
            </div>

            <div className="permit-grid-2" style={{ marginBottom: "14px" }}>
              <div className="permit-field-wrap">
                <label>
                  <User size={16} color="var(--color-peach-deep)" />
                  <span>Full Name (as per Govt ID) <span className="permit-req">*</span></span>
                </label>
                <input
                  type="text"
                  className="permit-input"
                  placeholder="Full name as printed on ID proof"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                {formErrors.fullName && <span className="permit-req" style={{ fontSize: "0.75rem" }}>{formErrors.fullName}</span>}
              </div>

              <div className="permit-field-wrap">
                <label>
                  <span>Father's / Spouse's Name</span>
                </label>
                <input
                  type="text"
                  className="permit-input"
                  placeholder="Required for Sikkim Police PAP Form 2"
                  value={fatherOrSpouse}
                  onChange={(e) => setFatherOrSpouse(e.target.value)}
                />
              </div>

              <div className="permit-field-wrap">
                <label>
                  <span>Age &amp; Gender <span className="permit-req">*</span></span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "8px" }}>
                  <input
                    type="number"
                    className="permit-input"
                    placeholder="Age"
                    min="1"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                  <select
                    className="permit-select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="permit-field-wrap">
                <label>
                  <span>Mobile / WhatsApp Number <span className="permit-req">*</span></span>
                </label>
                <input
                  type="tel"
                  className="permit-input"
                  placeholder="10-digit WhatsApp number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {formErrors.phone && <span className="permit-req" style={{ fontSize: "0.75rem" }}>{formErrors.phone}</span>}
              </div>

              <div className="permit-field-wrap">
                <label>
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  className="permit-input"
                  placeholder="For permit clearance copy"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* A. INDIAN TOURIST DOCUMENT UPLOADS */}
            {nationality === "Indian Tourist" && (
              <div style={{ borderTop: "1px dashed var(--color-border)", paddingTop: "14px", marginTop: "10px" }}>
                <div className="permit-grid-2" style={{ marginBottom: "14px" }}>
                  <div className="permit-field-wrap">
                    <label>
                      <IdentificationCard size={16} color="var(--color-peach-deep)" />
                      <span>Government ID Proof Type <span className="permit-req">*</span></span>
                    </label>
                    <select
                      className="permit-select"
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                    >
                      {ID_TYPES_INDIAN.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <span className="permit-hint">
                      Voter ID card is processed fastest at police checkposts. (PAN card is not accepted).
                    </span>
                  </div>

                  <div className="permit-field-wrap">
                    <label>
                      <span>ID Document Number <span className="permit-req">*</span></span>
                    </label>
                    <input
                      type="text"
                      className="permit-input"
                      placeholder="e.g. Voter EPIC No / Passport No / Aadhaar No"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                    />
                    {formErrors.idNumber && <span className="permit-req" style={{ fontSize: "0.75rem" }}>{formErrors.idNumber}</span>}
                  </div>
                </div>

                <div className="permit-grid-2">
                  {/* Upload 1: Passport-size Photo */}
                  <div className="permit-field-wrap">
                    <label>
                      <Camera size={16} color="var(--color-peach-deep)" />
                      <span>Passport-Size Photograph <span className="permit-req">*</span></span>
                    </label>
                    {leadPhoto ? (
                      <div className="permit-doc-preview">
                        <img src={leadPhoto.dataUrl} alt="Passport photo" className="permit-doc-thumb" />
                        <div className="permit-doc-info">
                          <span className="permit-doc-name">{leadPhoto.name}</span>
                          <span className="permit-doc-tag">✓ Passport Photo Uploaded ({leadPhoto.size})</span>
                        </div>
                        <button type="button" className="permit-doc-remove" onClick={() => setLeadPhoto(null)}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="permit-upload-box">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFile(e.target.files[0], setLeadPhoto, "leadPhoto")}
                        />
                        <UploadSimple size={24} className="permit-upload-icon" />
                        <span className="permit-upload-label">
                          {uploadingField === "leadPhoto" ? "Compressing & Attaching..." : "Upload Passport Photo"}
                        </span>
                        <span className="permit-upload-sub">Clear color face photo (White / Light background)</span>
                      </div>
                    )}
                    {formErrors.leadPhoto && <span className="permit-req" style={{ fontSize: "0.75rem" }}>{formErrors.leadPhoto}</span>}
                  </div>

                  {/* Upload 2: Govt ID Proof */}
                  <div className="permit-field-wrap">
                    <label>
                      <IdentificationCard size={16} color="var(--color-peach-deep)" />
                      <span>Government ID Proof Scan / Photo <span className="permit-req">*</span></span>
                    </label>
                    {leadIdProof ? (
                      <div className="permit-doc-preview">
                        <img src={leadIdProof.dataUrl} alt="ID proof" className="permit-doc-thumb" />
                        <div className="permit-doc-info">
                          <span className="permit-doc-name">{leadIdProof.name}</span>
                          <span className="permit-doc-tag">✓ Govt ID Uploaded ({leadIdProof.size})</span>
                        </div>
                        <button type="button" className="permit-doc-remove" onClick={() => setLeadIdProof(null)}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="permit-upload-box">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFile(e.target.files[0], setLeadIdProof, "leadIdProof")}
                        />
                        <UploadSimple size={24} className="permit-upload-icon" />
                        <span className="permit-upload-label">
                          {uploadingField === "leadIdProof" ? "Compressing & Attaching..." : "Upload ID Proof Copy"}
                        </span>
                        <span className="permit-upload-sub">Clear front &amp; back scan or phone photo</span>
                      </div>
                    )}
                    {formErrors.leadIdProof && <span className="permit-req" style={{ fontSize: "0.75rem" }}>{formErrors.leadIdProof}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* B. FOREIGN TOURIST DOCUMENT UPLOADS */}
            {nationality === "Foreign Tourist" && (
              <div style={{ borderTop: "1px dashed var(--color-border)", paddingTop: "14px", marginTop: "10px" }}>
                <div className="permit-grid-2" style={{ marginBottom: "14px" }}>
                  <div className="permit-field-wrap">
                    <label>
                      <GlobeHemisphereWest size={16} color="var(--color-peach-deep)" />
                      <span>Country of Citizenship / Nationality <span className="permit-req">*</span></span>
                    </label>
                    <input
                      type="text"
                      className="permit-input"
                      placeholder="e.g. United Kingdom, USA, France, Japan"
                      value={foreignCountry}
                      onChange={(e) => setForeignCountry(e.target.value)}
                    />
                    {formErrors.foreignCountry && <span className="permit-req" style={{ fontSize: "0.75rem" }}>{formErrors.foreignCountry}</span>}
                  </div>

                  <div className="permit-field-wrap">
                    <label>
                      <span>Passport Number <span className="permit-req">*</span></span>
                    </label>
                    <input
                      type="text"
                      className="permit-input"
                      placeholder="Passport number"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                    />
                    {formErrors.passportNumber && <span className="permit-req" style={{ fontSize: "0.75rem" }}>{formErrors.passportNumber}</span>}
                  </div>

                  <div className="permit-field-wrap">
                    <label>
                      <span>Passport Expiry Date</span>
                    </label>
                    <input
                      type="date"
                      className="permit-input"
                      value={passportExpiry}
                      onChange={(e) => setPassportExpiry(e.target.value)}
                    />
                    <span className="permit-hint">Must have at least 6 months validity from date of entry.</span>
                  </div>

                  <div className="permit-field-wrap">
                    <label>
                      <span>Indian Visa / e-Visa Number</span>
                    </label>
                    <input
                      type="text"
                      className="permit-input"
                      placeholder="Indian Visa / ETA number"
                      value={visaNumber}
                      onChange={(e) => setVisaNumber(e.target.value)}
                    />
                  </div>

                  <div className="permit-field-wrap">
                    <label>
                      <span>Visa Expiry Date</span>
                    </label>
                    <input
                      type="date"
                      className="permit-input"
                      value={visaExpiry}
                      onChange={(e) => setVisaExpiry(e.target.value)}
                    />
                  </div>

                  <div className="permit-field-wrap">
                    <label>
                      <span>Sikkim Inner Line Permit (ILP / RAP) Status</span>
                    </label>
                    <select
                      className="permit-select"
                      value={ilpStatus}
                      onChange={(e) => setIlpStatus(e.target.value)}
                    >
                      <option value="Arrange on border arrival (Lama Bhai assistance)">
                        Arrange upon border arrival at Rangpo / Melli (Lama Bhai handles)
                      </option>
                      <option value="Already obtained at Indian Embassy / Entry Port">
                        Already stamped at Indian Port of Entry / Embassy
                      </option>
                    </select>
                  </div>
                </div>

                <div className="permit-grid-3">
                  {/* Upload 1: Passport Photo */}
                  <div className="permit-field-wrap">
                    <label>
                      <Camera size={16} color="var(--color-peach-deep)" />
                      <span>Passport Photo <span className="permit-req">*</span></span>
                    </label>
                    {foreignPhoto ? (
                      <div className="permit-doc-preview">
                        <img src={foreignPhoto.dataUrl} alt="Passport photo" className="permit-doc-thumb" />
                        <div className="permit-doc-info">
                          <span className="permit-doc-name">{foreignPhoto.name}</span>
                          <span className="permit-doc-tag">✓ Uploaded</span>
                        </div>
                        <button type="button" className="permit-doc-remove" onClick={() => setForeignPhoto(null)}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="permit-upload-box">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFile(e.target.files[0], setForeignPhoto, "foreignPhoto")}
                        />
                        <UploadSimple size={24} className="permit-upload-icon" />
                        <span className="permit-upload-label">
                          {uploadingField === "foreignPhoto" ? "Attaching..." : "Upload Photo"}
                        </span>
                        <span className="permit-upload-sub">White background</span>
                      </div>
                    )}
                    {formErrors.foreignPhoto && <span className="permit-req" style={{ fontSize: "0.75rem" }}>{formErrors.foreignPhoto}</span>}
                  </div>

                  {/* Upload 2: Passport Copy */}
                  <div className="permit-field-wrap">
                    <label>
                      <IdentificationCard size={16} color="var(--color-peach-deep)" />
                      <span>Passport Bio Page <span className="permit-req">*</span></span>
                    </label>
                    {foreignPassportCopy ? (
                      <div className="permit-doc-preview">
                        <img src={foreignPassportCopy.dataUrl} alt="Passport copy" className="permit-doc-thumb" />
                        <div className="permit-doc-info">
                          <span className="permit-doc-name">{foreignPassportCopy.name}</span>
                          <span className="permit-doc-tag">✓ Uploaded</span>
                        </div>
                        <button type="button" className="permit-doc-remove" onClick={() => setForeignPassportCopy(null)}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="permit-upload-box">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFile(e.target.files[0], setForeignPassportCopy, "foreignPassportCopy")}
                        />
                        <UploadSimple size={24} className="permit-upload-icon" />
                        <span className="permit-upload-label">
                          {uploadingField === "foreignPassportCopy" ? "Attaching..." : "Upload Passport"}
                        </span>
                        <span className="permit-upload-sub">Clear photo page</span>
                      </div>
                    )}
                    {formErrors.foreignPassportCopy && <span className="permit-req" style={{ fontSize: "0.75rem" }}>{formErrors.foreignPassportCopy}</span>}
                  </div>

                  {/* Upload 3: Visa Copy */}
                  <div className="permit-field-wrap">
                    <label>
                      <IdentificationCard size={16} color="var(--color-peach-deep)" />
                      <span>Indian Visa / e-Visa <span className="permit-req">*</span></span>
                    </label>
                    {foreignVisaCopy ? (
                      <div className="permit-doc-preview">
                        <img src={foreignVisaCopy.dataUrl} alt="Visa copy" className="permit-doc-thumb" />
                        <div className="permit-doc-info">
                          <span className="permit-doc-name">{foreignVisaCopy.name}</span>
                          <span className="permit-doc-tag">✓ Uploaded</span>
                        </div>
                        <button type="button" className="permit-doc-remove" onClick={() => setForeignVisaCopy(null)}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="permit-upload-box">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFile(e.target.files[0], setForeignVisaCopy, "foreignVisaCopy")}
                        />
                        <UploadSimple size={24} className="permit-upload-icon" />
                        <span className="permit-upload-label">
                          {uploadingField === "foreignVisaCopy" ? "Attaching..." : "Upload Visa / ETA"}
                        </span>
                        <span className="permit-upload-sub">Valid tourist visa</span>
                      </div>
                    )}
                    {formErrors.foreignVisaCopy && <span className="permit-req" style={{ fontSize: "0.75rem" }}>{formErrors.foreignVisaCopy}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section: Dynamic Admin-Configured Document Requirements */}
          {customRequirements.length > 0 && (
            <div className="permit-form-section">
              <div className="permit-form-section__header">
                <span className="permit-form-section__number">3</span>
                <div>
                  <h3 className="permit-form-section__title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>Route &amp; Checkpost Verifications</span>
                    <span style={{ fontSize: "0.72rem", background: "rgba(255, 159, 122, 0.2)", color: "var(--color-peach-deep)", padding: "2px 8px", borderRadius: "999px", fontWeight: 700 }}>
                      Official Clearance
                    </span>
                  </h3>
                  <p className="permit-form-section__subtitle">
                    The following additional documents and verifications are required for {destination} ({nationality}).
                  </p>
                </div>
              </div>

              <div className="permit-grid-2">
                {customRequirements.map((req) => (
                  <div key={req.id || req.key} className="permit-field-wrap">
                    <label>
                      {req.type === "file" && <UploadSimple size={16} color="var(--color-peach-deep)" />}
                      {req.type === "text" && <FileText size={16} color="var(--color-peach-deep)" />}
                      {req.type === "select" && <Sparkle size={16} color="var(--color-peach-deep)" />}
                      {req.type === "checkbox" && <CheckCircle size={16} color="var(--color-peach-deep)" />}
                      {req.type === "date" && <CalendarBlank size={16} color="var(--color-peach-deep)" />}
                      <span>
                        {req.label} {req.required && <span className="permit-req">*</span>}
                      </span>
                    </label>

                    {/* 1. FILE UPLOAD TYPE */}
                    {req.type === "file" && (
                      <>
                        {customDocUploads[req.key] ? (
                          <div className="permit-doc-preview">
                            <img
                              src={customDocUploads[req.key].dataUrl}
                              alt={req.label}
                              className="permit-doc-thumb"
                            />
                            <div className="permit-doc-info">
                              <span className="permit-doc-name">{customDocUploads[req.key].name}</span>
                              <span className="permit-doc-tag">✓ Uploaded ({customDocUploads[req.key].size})</span>
                            </div>
                            <button
                              type="button"
                              className="permit-doc-remove"
                              onClick={() => {
                                setCustomDocUploads((prev) => {
                                  const copy = { ...prev };
                                  delete copy[req.key];
                                  return copy;
                                });
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="permit-upload-box">
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleCustomFile(e.target.files[0], req)}
                            />
                            <UploadSimple size={24} className="permit-upload-icon" />
                            <span className="permit-upload-label">
                              {uploadingField === req.key ? "Compressing & Attaching..." : `Upload ${req.label}`}
                            </span>
                            <span className="permit-upload-sub">
                              {req.description || "Clear scanned copy or phone photo (JPG, PNG, PDF)"}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* 2. TEXT INPUT TYPE */}
                    {req.type === "text" && (
                      <>
                        <input
                          type="text"
                          className="permit-input"
                          placeholder={req.placeholder || `Enter ${req.label}`}
                          value={customFieldValues[req.key] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomFieldValues((prev) => ({ ...prev, [req.key]: val }));
                            if (val.trim()) {
                              setFormErrors((prev) => {
                                const copy = { ...prev };
                                delete copy[req.key];
                                return copy;
                              });
                            }
                          }}
                        />
                        {req.description && <span className="permit-hint">{req.description}</span>}
                      </>
                    )}

                    {/* 3. SELECT DROPDOWN TYPE */}
                    {req.type === "select" && (
                      <>
                        <select
                          className="permit-select"
                          value={customFieldValues[req.key] || (req.options && req.options[0]) || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomFieldValues((prev) => ({ ...prev, [req.key]: val }));
                            setFormErrors((prev) => {
                              const copy = { ...prev };
                              delete copy[req.key];
                              return copy;
                            });
                          }}
                        >
                          <option value="">-- Select an option --</option>
                          {(req.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        {req.description && <span className="permit-hint">{req.description}</span>}
                      </>
                    )}

                    {/* 4. DATE PICKER TYPE */}
                    {req.type === "date" && (
                      <>
                        <input
                          type="date"
                          className="permit-input"
                          value={customFieldValues[req.key] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomFieldValues((prev) => ({ ...prev, [req.key]: val }));
                            if (val) {
                              setFormErrors((prev) => {
                                const copy = { ...prev };
                                delete copy[req.key];
                                return copy;
                              });
                            }
                          }}
                        />
                        {req.description && <span className="permit-hint">{req.description}</span>}
                      </>
                    )}

                    {/* 5. CHECKBOX COMPLIANCE TYPE */}
                    {req.type === "checkbox" && (
                      <label className="permit-checkbox-card" style={{ display: "flex", gap: "10px", alignItems: "flex-start", cursor: "pointer", background: "var(--color-cream)", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                        <input
                          type="checkbox"
                          checked={Boolean(customFieldValues[req.key])}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setCustomFieldValues((prev) => ({ ...prev, [req.key]: val }));
                            if (val) {
                              setFormErrors((prev) => {
                                const copy = { ...prev };
                                delete copy[req.key];
                                return copy;
                              });
                            }
                          }}
                          style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "var(--color-peach-deep)" }}
                        />
                        <div>
                          <strong style={{ fontSize: "0.85rem", color: "var(--color-navy)", display: "block" }}>
                            {req.label}
                          </strong>
                          <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
                            {req.description || "I acknowledge and agree to comply with this official requirement."}
                          </span>
                        </div>
                      </label>
                    )}

                    {formErrors[req.key] && (
                      <span className="permit-req" style={{ fontSize: "0.75rem" }}>
                        {formErrors[req.key]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Group Travelers / Co-Travelers Roster */}
          <div className="permit-form-section">
            <div className="permit-form-section__header">
              <span className="permit-form-section__number">{customRequirements.length > 0 ? "4" : "3"}</span>
              <div>
                <h3 className="permit-form-section__title">
                  Group Members &amp; Co-Travelers Roster ({1 + coTravelers.length} Pax Total)
                </h3>
                <p className="permit-form-section__subtitle">
                  Sikkim permits list every passenger in the vehicle. Add details and photo IDs for accompanying family or group members.
                </p>
              </div>
            </div>

            {nationality === "Foreign Tourist" && coTravelers.length === 0 && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "10px 14px", borderRadius: "6px", marginBottom: "14px", fontSize: "0.82rem", color: "#92400e", lineHeight: 1.45 }}>
                <strong>Ministry of Home Affairs Rule:</strong> Foreign tourists traveling to North Sikkim (Yumthang Valley, Lachen, Lachung) require a minimum group of 2 foreign travelers.
                {" "}If you are a solo traveler, Lama Bhai Tourism will assign an authorized local escort guide to satisfy checkpost compliance.
              </div>
            )}

            {coTravelers.map((ct, idx) => (
              <div key={ct.id} className="permit-cotraveler-card">
                <div className="permit-cotraveler-header">
                  <span className="permit-cotraveler-title">
                    <Users size={16} color="var(--color-peach-deep)" style={{ marginRight: "6px" }} />
                    Co-Traveler #{idx + 2}
                  </span>
                  <button
                    type="button"
                    className="permit-cotraveler-remove"
                    onClick={() => removeCoTraveler(idx)}
                  >
                    <Trash size={14} />
                    <span>Remove Traveler</span>
                  </button>
                </div>

                <div className="permit-grid-2">
                  <div className="permit-field-wrap">
                    <label><span>Full Name (as per ID) *</span></label>
                    <input
                      type="text"
                      className="permit-input"
                      placeholder="Co-traveler full name"
                      value={ct.name}
                      onChange={(e) => updateCoTraveler(idx, "name", e.target.value)}
                    />
                  </div>

                  <div className="permit-field-wrap">
                    <label><span>Age &amp; Gender</span></label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "8px" }}>
                      <input
                        type="number"
                        className="permit-input"
                        placeholder="Age"
                        value={ct.age}
                        onChange={(e) => updateCoTraveler(idx, "age", e.target.value)}
                      />
                      <select
                        className="permit-select"
                        value={ct.gender}
                        onChange={(e) => updateCoTraveler(idx, "gender", e.target.value)}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="permit-field-wrap">
                    <label><span>ID Proof Type &amp; Number</span></label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <select
                        className="permit-select"
                        value={ct.idType}
                        onChange={(e) => updateCoTraveler(idx, "idType", e.target.value)}
                      >
                        {ID_TYPES_INDIAN.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="permit-input"
                        placeholder="ID Document number"
                        value={ct.idNumber}
                        onChange={(e) => updateCoTraveler(idx, "idNumber", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="permit-field-wrap">
                    <label><span>Upload Co-Traveler Passport Photo</span></label>
                    {ct.passportPhoto ? (
                      <div className="permit-doc-preview">
                        <img src={ct.passportPhoto.dataUrl} alt="Photo" className="permit-doc-thumb" />
                        <div className="permit-doc-info">
                          <span className="permit-doc-name">{ct.passportPhoto.name}</span>
                          <span className="permit-doc-tag">✓ Photo Attached</span>
                        </div>
                        <button
                          type="button"
                          className="permit-doc-remove"
                          onClick={() => updateCoTraveler(idx, "passportPhoto", null)}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="permit-upload-box" style={{ minHeight: "85px" }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFile(
                              e.target.files[0],
                              (val) => updateCoTraveler(idx, "passportPhoto", val),
                              `cotrav_${idx}_photo`
                            )
                          }
                        />
                        <Camera size={18} className="permit-upload-icon" />
                        <span className="permit-upload-label" style={{ fontSize: "0.78rem" }}>Upload Photo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button type="button" className="permit-add-traveler-btn" onClick={addCoTraveler}>
              <Plus size={16} weight="bold" />
              <span>Add Another Group Traveler (+ Co-Traveler)</span>
            </button>
          </div>

          {/* Legal Self-Declaration Checkbox */}
          <div className="permit-declaration-box">
            <input
              type="checkbox"
              id="permit-declare-check"
              checked={declarationAccepted}
              onChange={(e) => setDeclarationAccepted(e.target.checked)}
            />
            <label htmlFor="permit-declare-check" style={{ cursor: "pointer" }}>
              <strong>Official Checkpost Declaration:</strong> I hereby certify that all uploaded identity documents, passport photographs, and passenger details are genuine. I understand that all travelers must physically carry their <strong>original government IDs / passports</strong> and <strong>4 physical passport photographs</strong> during travel for verification at Sikkim Police and Indian Army checkposts.
            </label>
          </div>
          {formErrors.declaration && (
            <div style={{ color: "#dc2626", fontSize: "0.78rem", fontWeight: 700, marginBottom: "14px" }}>
              {formErrors.declaration}
            </div>
          )}

          {/* Action Bar */}
          <div className="permit-modal-actions">
            <button type="button" className="permit-btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>

            <button type="submit" className="permit-btn-submit" disabled={isSubmitting}>
              <ShieldCheck size={18} weight="fill" />
              <span>{isSubmitting ? "Processing Documents & Submitting..." : "Submit Permit Application"}</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
