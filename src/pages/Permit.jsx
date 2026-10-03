import React, { useState } from "react";
import {
  CheckCircle,
  WarningCircle,
  XCircle,
  Mountains,
  Info,
  ArrowRight,
  CaretDown,
  Check,
  ShieldCheck,
  User,
  GlobeHemisphereWest,
  Warning,
} from "phosphor-react";
import {
  nationalities,
  STATUS,
  destinationList,
  getPermitInfo,
  getStatusMeaning,
} from "../data/northSikkimPermitData.js";
import {
  getContactSettings,
  buildWhatsAppLink,
} from "../data/contactSettings.js";
import Dropdown from "../components/Dropdown.jsx";
import BookingForm from "../components/BookingForm.jsx";
import PermitBookingModal from "../components/PermitBookingModal.jsx";
import { ModernWhatsAppIcon } from "../components/SocialIcons.jsx";
import IndiaFlag from "../components/IndiaFlag.jsx";
import "./Permit.css";

// Destination list with altitudes and descriptions
const DESTINATIONS = [
  { name: "Gurudongmar Lake", alt: "17,800 ft", desc: "Sacred high-altitude lake" },
  { name: "Yumthang Valley", alt: "11,800 ft", desc: "Valley of Flowers" },
  { name: "Zero Point / Yumesamdong", alt: "15,300 ft", desc: "Snow viewpoint beyond Yumthang" },
  { name: "Lachen", alt: "8,838 ft", desc: "Base village for Gurudongmar" },
  { name: "Lachung", alt: "8,610 ft", desc: "Base village for Yumthang Valley" },
  { name: "Thangu", alt: "13,000 ft", desc: "Alpine village en route to Gurudongmar" },
  { name: "Chopta Valley", alt: "13,200 ft", desc: "Alpine meadow beyond Thangu" },
  { name: "Dzongu", alt: "4,500 ft", desc: "Protected Lepcha cultural reserve" },
  { name: "Green Lake Trek", alt: "16,190 ft", desc: "Kanchenjunga base expedition trek" },
];

const FAQS = [
  {
    q: "Can solo travelers visit North Sikkim (Gurudongmar / Yumthang)?",
    a: "Indian solo travelers can visit by booking a dedicated commercial cab or joining a shared tourist vehicle. Foreign solo travelers cannot obtain North Sikkim permits alone due to the mandatory 2-person minimum group rule enforced by the Ministry of Home Affairs.",
  },
  {
    q: "Can foreign nationals visit Zero Point or Gurudongmar Lake?",
    a: "No. Zero Point, Gurudongmar Lake, and Nathula Pass border sensitive defense zones and are restricted to Indian citizens only. However, foreign nationals are warmly permitted to visit Yumthang Valley, Lachen, Lachung, Chopta Valley, and Dzongu with an approved Protected Area Permit (PAP).",
  },
  {
    q: "How many days in advance should I arrange my permit?",
    a: "We recommend applying at least 24 to 48 hours prior to travel. In peak seasons (April–June and October–December), applying 3 to 5 days in advance ensures smooth vehicle pass and police stamp approvals without checkpoint delays.",
  },
  {
    q: "What physical documents must I carry during the trip?",
    a: "Every traveler must carry original government photo ID (Voter ID or Passport are strongly preferred by police checkposts; Aadhaar is accepted for Indian citizens) plus 4 physical passport-size photographs per person. Digital copies on phones are not accepted at checkpoints.",
  },
  {
    q: "Does Lama Bhai Tourism take care of all paperwork and clearances?",
    a: "Yes! When you book your stay, cab, or tour package with Lama Bhai Tourism, our local team in Gangtok and Mangan handles all photo attestations, police passes, and checkpost clearance stamps for you.",
  },
];

export default function Permit() {
  const [nationality, setNationality] = useState("Indian Tourist");
  const [destination, setDestination] = useState("Gurudongmar Lake");
  const [showForm, setShowForm] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const [accessFilter, setAccessFilter] = useState("all"); // "all" | "permitted" | "restricted"
  const [tableFilter, setTableFilter] = useState("all"); // "all" | "permitted" | "restricted"

  const contactSettings = getContactSettings();
  const result = getPermitInfo(nationality, destination);

  const isPermitted = result && result.status !== STATUS.NOT_PERMITTED;
  const currentDestMeta = DESTINATIONS.find((d) => d.name === destination) || { alt: "", desc: "" };

  // Filter destinations based on accessFilter when foreign nationality is selected
  const filteredDestinations = DESTINATIONS.filter((d) => {
    if (nationality !== "Foreign Tourist" || accessFilter === "all") return true;
    const rule = getPermitInfo("Foreign Tourist", d.name);
    const isDenied = rule && rule.status === STATUS.NOT_PERMITTED;
    if (accessFilter === "permitted") return !isDenied;
    if (accessFilter === "restricted") return isDenied;
    return true;
  });

  // Formatted dropdown options for the custom Dropdown component
  const destinationOptions = filteredDestinations.map((d) => {
    const foreignRule = getPermitInfo("Foreign Tourist", d.name);
    const isRestrictedForForeign = foreignRule?.status === STATUS.NOT_PERMITTED;
    const isSpecial = foreignRule?.status === STATUS.SPECIAL_CLEARANCE;

    let tag = " · PAP Required";
    if (nationality === "Foreign Tourist") {
      if (isRestrictedForForeign) {
        tag = " · Indian Citizens Only";
      } else if (isSpecial) {
        tag = " · ⚠️ Special Clearance";
      } else {
        tag = " · ✅ PAP Permitted (Min 2 Pax)";
      }
    }

    return {
      value: d.name,
      label: `${d.name} (${d.alt}${tag})`,
    };
  });

  const bookingContext = result ? {
    service: "Permit",
    details: [
      { label: "Nationality", value: nationality },
      { label: "Destination", value: destination },
      { label: "Permit Type", value: result.permitType || "Protected Area Permit (PAP)" },
      { label: "Access Status", value: result.status === STATUS.REQUIRED ? "Permit Required" : result.status },
    ],
  } : null;

  const whatsappMsg = `Hi Lama Bhai Tourism, I would like assistance with a permit for ${destination} as an ${nationality}. Please guide me on documents and timings.`;
  const whatsappUrl = buildWhatsAppLink(contactSettings.whatsapp, whatsappMsg);

  return (
    <main className="permit-page">
      {/* 1. Page Header */}
      <section className="permit-hero">
        <p className="permit-hero__eyebrow">Sikkim, Eastern Himalayas</p>
        <h1 className="permit-hero__heading">Sikkim Permit Guide</h1>
        <p className="permit-hero__sub">
          Check permit requirements and document checklists for protected and restricted circuits across Sikkim before you travel.
        </p>
      </section>

      {/* 2. Focused Permit Checker Card */}
      <section className="permit-card" aria-label="Permit Checker Tool">
        <div className="permit-form-row">
          {/* Step 1: Nationality Selector */}
          <div className="permit-field">
            <span className="permit-field__label">1. Nationality</span>
            <div className="permit-pills-group">
              <button
                type="button"
                className={`permit-pill-btn ${nationality === "Indian Tourist" ? "permit-pill-btn--active" : ""}`}
                onClick={() => setNationality("Indian Tourist")}
              >
                <IndiaFlag width={22} height={15} />
                <span>Indian Tourist</span>
              </button>

              <button
                type="button"
                className={`permit-pill-btn ${nationality === "Foreign Tourist" ? "permit-pill-btn--active" : ""}`}
                onClick={() => setNationality("Foreign Tourist")}
              >
                <GlobeHemisphereWest size={18} weight="bold" />
                <span>Foreign / International</span>
              </button>
            </div>
          </div>

          {/* Step 2: Destination Dropdown (Using custom Dropdown component) */}
          <div className="permit-field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
              <span className="permit-field__label">2. Destination</span>
              {nationality === "Foreign Tourist" && (
                <span style={{ fontSize: "0.75rem", color: "#b45309", fontWeight: 700 }}>
                  ⚠️ Defense restrictions active
                </span>
              )}
            </div>

            <Dropdown
              options={destinationOptions}
              value={destination}
              onChange={(val) => setDestination(val)}
              placeholder="Select a destination"
              light
            />

            {nationality === "Foreign Tourist" && (
              <div className="permit-filter-pills" style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={`permit-filter-btn ${accessFilter === "all" ? "permit-filter-btn--active" : ""}`}
                  onClick={() => setAccessFilter("all")}
                >
                  All ({DESTINATIONS.length})
                </button>
                <button
                  type="button"
                  className={`permit-filter-btn ${accessFilter === "permitted" ? "permit-filter-btn--active" : ""}`}
                  onClick={() => {
                    setAccessFilter("permitted");
                    const currRule = getPermitInfo("Foreign Tourist", destination);
                    if (currRule?.status === STATUS.NOT_PERMITTED) {
                      setDestination("Yumthang Valley");
                    }
                  }}
                >
                  ✅ Permitted for Foreigners (6)
                </button>
                <button
                  type="button"
                  className={`permit-filter-btn ${accessFilter === "restricted" ? "permit-filter-btn--active" : ""}`}
                  onClick={() => {
                    setAccessFilter("restricted");
                    const currRule = getPermitInfo("Foreign Tourist", destination);
                    if (currRule?.status !== STATUS.NOT_PERMITTED) {
                      setDestination("Gurudongmar Lake");
                    }
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <IndiaFlag width={16} height={11} />
                  <span>Indian Only (3)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Result Area */}
        {result && (
          <div className="permit-result">
            {/* Top Result Row */}
            <div className="permit-result__top">
              <div className="permit-result__heading-wrap">
                <h2>{result.destination}</h2>
                <span className="permit-result__meta">
                  {currentDestMeta.alt ? `${currentDestMeta.alt} • ` : ""}
                  {currentDestMeta.desc}
                </span>
              </div>

              {/* Status Badge */}
              {result.status === STATUS.REQUIRED && (
                <span className="status-badge status-badge--required">
                  <CheckCircle size={17} weight="fill" />
                  <span>Permit Required — Assistance Available</span>
                </span>
              )}
              {result.status === STATUS.RESTRICTED && (
                <span className="status-badge status-badge--restricted">
                  <WarningCircle size={17} weight="fill" />
                  <span>Restricted Access</span>
                </span>
              )}
              {result.status === STATUS.NOT_PERMITTED && (
                <span className="status-badge status-badge--denied">
                  <XCircle size={17} weight="fill" />
                  <span>Not Permitted for Foreign Tourists</span>
                </span>
              )}
              {result.status === STATUS.SPECIAL_CLEARANCE && (
                <span className="status-badge status-badge--special">
                  <Mountains size={17} weight="fill" />
                  <span>Special Clearance Required</span>
                </span>
              )}
            </div>

            {/* Explanation */}
            {isPermitted ? (
              <div className="permit-result__meaning">
                <strong>What this means:</strong> {getStatusMeaning(result.status)} {result.restrictions}
              </div>
            ) : (
              <div className="permit-result__meaning permit-result__meaning--denied">
                <strong>Notice:</strong> {result.restrictions} Foreign tourists are not permitted past border defense checkposts for this location. We recommend exploring <strong>Yumthang Valley</strong> or <strong>Lachung</strong> instead.
              </div>
            )}

            {/* Checklist of what to carry */}
            {isPermitted && (
              <div className="permit-result__docs">
                <span className="permit-result__label">What You Need to Carry</span>
                <div className="permit-result__checklist">
                  {nationality === "Indian Tourist" ? (
                    <>
                      <div className="permit-doc-item">
                        <Check size={18} weight="bold" />
                        <span>Original Govt Photo ID (Voter ID, Passport, or Aadhaar) + 2 photocopies</span>
                      </div>
                      <div className="permit-doc-item">
                        <Check size={18} weight="bold" />
                        <span>2 Passport-size physical photographs per person</span>
                      </div>
                      <div className="permit-doc-item">
                        <Check size={18} weight="bold" />
                        <span>Registered Sikkim tourist vehicle pass (Arranged by Lama Bhai)</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="permit-doc-item">
                        <Check size={18} weight="bold" />
                        <span>Original Passport with valid Indian Tourist Visa / OCI</span>
                      </div>
                      <div className="permit-doc-item">
                        <Check size={18} weight="bold" />
                        <span>Minimum 2 travelers booked through registered agency (Lama Bhai)</span>
                      </div>
                      <div className="permit-doc-item">
                        <Check size={18} weight="bold" />
                        <span>4 Passport-size physical photographs per person</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="permit-result__actions">
              {isPermitted ? (
                <>
                  <button
                    type="button"
                    className="permit-btn-primary"
                    onClick={() => setShowForm(true)}
                  >
                    <span>Request Permit Assistance</span>
                    <ArrowRight size={16} weight="bold" />
                  </button>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="permit-btn-whatsapp"
                    title="Chat directly on WhatsApp with Lama Bhai"
                  >
                    <ModernWhatsAppIcon size={18} />
                    <span>Ask on WhatsApp</span>
                  </a>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="permit-btn-primary"
                    onClick={() => setDestination("Yumthang Valley")}
                  >
                    <span>Switch to Yumthang Valley (Permitted)</span>
                    <ArrowRight size={16} weight="bold" />
                  </button>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="permit-btn-whatsapp"
                  >
                    <ModernWhatsAppIcon size={18} />
                    <span>Consult on WhatsApp</span>
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 3. At a Glance Table (Scannable for Multi-Stop Trips) */}
      <section className="permit-overview" aria-label="Permits at a Glance Table">
        <div className="permit-overview__header">
          <h2 className="permit-overview__title">All Destinations at a Glance</h2>
          <p className="permit-overview__sub">
            Planning a multi-destination itinerary? Compare requirements for Indian vs International travelers across all circuits.
          </p>

          <div className="permit-filter-pills" style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              className={`permit-filter-btn ${tableFilter === "all" ? "permit-filter-btn--active" : ""}`}
              onClick={() => setTableFilter("all")}
            >
              Show All ({DESTINATIONS.length})
            </button>
            <button
              type="button"
              className={`permit-filter-btn ${tableFilter === "permitted" ? "permit-filter-btn--active" : ""}`}
              onClick={() => setTableFilter("permitted")}
            >
              🌍 Permitted for Foreign Nationals (6)
            </button>
            <button
              type="button"
              className={`permit-filter-btn ${tableFilter === "restricted" ? "permit-filter-btn--active" : ""}`}
              onClick={() => setTableFilter("restricted")}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <IndiaFlag width={16} height={11} />
              <span>Indian Citizens Only (3)</span>
            </button>
          </div>
        </div>

        <div className="permit-overview__table-wrap">
          <table className="permit-table">
            <thead>
              <tr>
                <th>Destination</th>
                <th>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <IndiaFlag width={18} height={12} />
                    <span>Indian Citizens</span>
                  </span>
                </th>
                <th>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <GlobeHemisphereWest size={16} weight="bold" />
                    <span>International Tourists</span>
                  </span>
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {DESTINATIONS.filter((d) => {
                if (tableFilter === "all") return true;
                const fRule = getPermitInfo("Foreign Tourist", d.name);
                const isDenied = fRule?.status === STATUS.NOT_PERMITTED;
                if (tableFilter === "permitted") return !isDenied;
                if (tableFilter === "restricted") return isDenied;
                return true;
              }).map((d) => {
                const indianRule = getPermitInfo("Indian Tourist", d.name);
                const foreignRule = getPermitInfo("Foreign Tourist", d.name);
                const isSelected = destination === d.name;

                return (
                  <tr key={d.name} style={{ background: isSelected ? "rgba(232, 165, 140, 0.12)" : undefined }}>
                    <td>
                      <span className="permit-table__dest-title">{d.name}</span>
                      <span className="permit-table__dest-sub">{d.alt ? `${d.alt} • ` : ""}{d.desc}</span>
                    </td>
                    <td>
                      <span className="permit-table__pill permit-table__pill--ok">
                        <Check size={13} weight="bold" />
                        <span>Permit Required (PAP)</span>
                      </span>
                    </td>
                    <td>
                      {foreignRule?.status === STATUS.NOT_PERMITTED ? (
                        <span className="permit-table__pill permit-table__pill--denied">
                          <span>Not Permitted</span>
                        </span>
                      ) : foreignRule?.status === STATUS.SPECIAL_CLEARANCE ? (
                        <span className="permit-table__pill permit-table__pill--special">
                          <span>Special Clearance</span>
                        </span>
                      ) : (
                        <span className="permit-table__pill permit-table__pill--ok">
                          <Check size={13} weight="bold" />
                          <span>PAP (Min 2 Pax)</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="permit-table__select-btn"
                        onClick={() => {
                          setDestination(d.name);
                          window.scrollTo({ top: 180, behavior: "smooth" });
                        }}
                      >
                        {isSelected ? "Selected" : "Check Rules"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Simple 4-Step Process */}
      <section className="permit-steps" aria-label="Permit Process Steps">
        <h2 className="permit-steps__title">How Sikkim Permits Work</h2>

        <div className="permit-steps__grid">
          <div className="permit-step-card">
            <span className="permit-step-card__num">Step 1</span>
            <h4>Original ID &amp; Photos</h4>
            <p>Carry your original government photo ID and 2 physical passport-size photographs per traveler.</p>
          </div>

          <div className="permit-step-card">
            <span className="permit-step-card__num">Step 2</span>
            <h4>Commercial Vehicle Pass</h4>
            <p>Sikkim law mandates registered commercial tourist cabs for protected mountain passes. We assign your cab.</p>
          </div>

          <div className="permit-step-card">
            <span className="permit-step-card__num">Step 3</span>
            <h4>Police Clearance</h4>
            <p>Our team in Gangtok &amp; Mangan submits paperwork to local tourism and police counters for stamping.</p>
          </div>

          <div className="permit-step-card">
            <span className="permit-step-card__num">Step 4</span>
            <h4>Checkpost Entry</h4>
            <p>Your driver presents stamped passes at Toong and Chungthang gates for smooth clearance.</p>
          </div>
        </div>
      </section>

      {/* 5. FAQs Section */}
      <section className="permit-faq" aria-label="Frequently Asked Questions">
        <h2 className="permit-faq__title">Frequently Asked Questions</h2>
        <div className="permit-faq__list">
          {FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.q}
                className={`permit-faq__row ${isOpen ? "permit-faq__row--open" : ""}`}
              >
                <button
                  type="button"
                  className="permit-faq__trigger"
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <CaretDown size={18} weight="bold" />
                </button>
                {isOpen && (
                  <div className="permit-faq__content">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Official Notice Bar */}
      <div className="permit-notice-bar">
        <Warning size={22} weight="fill" />
        <p>
          Permit requirements and access restrictions may change based on weather, road conditions, and civil administration directives. Please verify current requirements before travel.
        </p>
      </div>

      {/* Official Government Permit Booking Modal */}
      {showForm && bookingContext && (
        <PermitBookingModal
          context={bookingContext}
          initialNationality={nationality}
          initialDestination={destination}
          onClose={() => setShowForm(false)}
        />
      )}
    </main>
  );
}