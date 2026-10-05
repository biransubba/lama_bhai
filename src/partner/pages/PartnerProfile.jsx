import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  UserCircle,
  Buildings,
  Phone,
  EnvelopeSimple,
  MapPin,
  CheckCircle,
  ShieldCheck,
  HouseLine,
  FloppyDisk,
  LockKey,
  Info,
  CalendarCheck,
  ImageSquare,
} from "phosphor-react";
import { usePartnerAuth } from "../context/PartnerAuthContext.jsx";

export default function PartnerProfile() {
  const { currentPartner, partnerStays, updatePartnerProfile, refreshAll } = usePartnerAuth();

  const [businessName, setBusinessName] = useState(
    currentPartner?.partnerProfile?.businessName || currentPartner?.agency || ""
  );
  const [phone, setPhone] = useState(currentPartner?.phone || "");
  const [email, setEmail] = useState(currentPartner?.email || "");
  const [district, setDistrict] = useState(
    currentPartner?.partnerProfile?.district || "South Sikkim"
  );
  const [town, setTown] = useState(
    currentPartner?.partnerProfile?.town || currentPartner?.location || "Namchi"
  );
  const [address, setAddress] = useState(
    currentPartner?.partnerProfile?.address || ""
  );
  const [pincode, setPincode] = useState(
    currentPartner?.partnerProfile?.pincode || ""
  );
  const [notes, setNotes] = useState(currentPartner?.notes || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (updatePartnerProfile) {
      updatePartnerProfile({
        agency: businessName.trim(),
        businessName: businessName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        district: district.trim(),
        town: town.trim(),
        address: address.trim(),
        pincode: pincode.trim(),
        location: `${town.trim()}, ${district.trim()}`,
        notes: notes.trim(),
      });
    }
    setSavedSuccess(true);
    if (refreshAll) refreshAll();
    setTimeout(() => setSavedSuccess(false), 3500);
  }

  return (
    <div className="partner-profile-page">
      {/* Top Banner Header */}
      <div className="partner-page-header">
        <div>
          <h1 className="partner-page-title">
            Partner Profile &amp; Business Details
          </h1>
          <p className="partner-page-subtitle">
            Business location and contact information for <strong>{currentPartner?.name}</strong>.
          </p>
        </div>

        <div className="partner-page-header-actions">
          <span className="partner-status-pill partner-status-pill--approved">
            <CheckCircle size={15} weight="fill" /> Verified Partner Account
          </span>
        </div>
      </div>

      {/* Main Grid: Left Form, Right Properties & Guidelines */}
      <div className="partner-profile-grid">
        {/* Left Column: Form Card */}
        <div className="partner-card">
          <div className="partner-card-header">
            <div className="partner-card-icon-wrap">
              <UserCircle size={22} weight="duotone" color="var(--color-peach-deep)" />
            </div>
            <div>
              <h2 className="partner-card-title">Profile Information</h2>
              <p className="partner-card-subtitle">
                This business location serves as the default location for all your room listings.
              </p>
            </div>
          </div>

          {savedSuccess && (
            <div className="partner-alert partner-alert--success">
              <CheckCircle size={18} weight="fill" />
              <span>Profile information successfully updated and saved!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="partner-form">
            {/* Host Full Name */}
            <div className="partner-form-group">
              <div className="partner-form-label-wrap">
                <label className="partner-form-label">Full Name</label>
                <span className="partner-form-badge">
                  <LockKey size={11} weight="bold" /> Registered Account Name
                </span>
              </div>
              <input
                type="text"
                className="partner-form-input partner-form-input--disabled"
                value={currentPartner?.name || ""}
                disabled
              />
            </div>

            {/* Business / Homestay Name */}
            <div className="partner-form-group">
              <label className="partner-form-label">
                Business / Homestay Name <span className="partner-form-required">*</span>
              </label>
              <input
                type="text"
                className="partner-form-input"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Biran Homestay"
                required
              />
            </div>

            {/* 2-Column: Phone & Email */}
            <div className="partner-form-row">
              <div className="partner-form-group">
                <label className="partner-form-label">
                  Primary Phone <span className="partner-form-required">*</span>
                </label>
                <div className="partner-input-with-icon">
                  <Phone size={16} className="partner-input-icon" />
                  <input
                    type="text"
                    className="partner-form-input partner-form-input--has-icon"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              </div>

              <div className="partner-form-group">
                <label className="partner-form-label">
                  Email Address <span className="partner-form-required">*</span>
                </label>
                <div className="partner-input-with-icon">
                  <EnvelopeSimple size={16} className="partner-input-icon" />
                  <input
                    type="email"
                    className="partner-form-input partner-form-input--has-icon"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@example.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 2-Column: District & Town/City */}
            <div className="partner-form-row">
              <div className="partner-form-group">
                <label className="partner-form-label">
                  Location / District <span className="partner-form-required">*</span>
                </label>
                <input
                  type="text"
                  className="partner-form-input"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. South Sikkim"
                  required
                />
              </div>

              <div className="partner-form-group">
                <label className="partner-form-label">
                  Town / City <span className="partner-form-required">*</span>
                </label>
                <input
                  type="text"
                  className="partner-form-input"
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                  placeholder="e.g. Namchi"
                  required
                />
              </div>
            </div>

            {/* Address & Pincode */}
            <div className="partner-form-row">
              <div className="partner-form-group" style={{ flex: 2 }}>
                <label className="partner-form-label">
                  Business Address <span className="partner-form-required">*</span>
                </label>
                <input
                  type="text"
                  className="partner-form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Central Park, Namchi"
                  required
                />
              </div>

              <div className="partner-form-group" style={{ flex: 1 }}>
                <label className="partner-form-label">Pincode</label>
                <input
                  type="text"
                  className="partner-form-input"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="737126"
                />
              </div>
            </div>

            {/* Host Story & Notes */}
            <div className="partner-form-group">
              <label className="partner-form-label">Host Story &amp; Operational Notes</label>
              <textarea
                rows={4}
                className="partner-form-input partner-form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe your hospitality background, local food specialties, village traditions, or seasonal operational guidance for travelers..."
              />
              <span className="partner-form-help">
                Share authentic background about your homestay for booking coordinators.
              </span>
            </div>

            {/* Submit Action */}
            <div className="partner-form-actions">
              <button type="submit" className="partner-btn-primary">
                <FloppyDisk size={18} weight="bold" /> Save Profile Details
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Assigned Stays & Policies */}
        <div className="partner-profile-sidebar-cards">
          {/* Card 1: Assigned Properties */}
          <div className="partner-card">
            <div className="partner-card-header">
              <div className="partner-card-icon-wrap">
                <HouseLine size={20} weight="duotone" color="var(--color-peach-deep)" />
              </div>
              <div>
                <h3 className="partner-card-title">
                  My Assigned Homestays ({partnerStays.length})
                </h3>
                <p className="partner-card-subtitle">
                  Properties linked to your partner account ID: <code>{currentPartner?.id}</code>
                </p>
              </div>
            </div>

            <p className="partner-card-text">
              You have host access to manage photos, availability, and guest requests for these properties. Platform listing status is controlled by the Main Admin.
            </p>

            {partnerStays.length === 0 ? (
              <div className="partner-empty-box">
                <HouseLine size={32} color="var(--color-peach)" />
                <p>No homestays assigned to this account yet.</p>
                <span>Please contact Lama Bhai Main Admin to assign your homestay.</span>
              </div>
            ) : (
              <div className="partner-assigned-list">
                {partnerStays.map((stay) => {
                  const isAvail = stay.availability === "available";
                  return (
                    <div key={stay.id} className="partner-assigned-item">
                      <div className="partner-assigned-item-info">
                        <strong className="partner-assigned-item-title">
                          {stay.name}
                        </strong>
                        <div className="partner-assigned-item-meta">
                          <span className="partner-meta-tag">{stay.type || "Homestay"}</span>
                          <span className="partner-meta-location">
                            <MapPin size={12} /> {stay.location}
                          </span>
                        </div>
                      </div>

                      <div className="partner-assigned-item-actions">
                        <span
                          className={`partner-status-pill ${
                            isAvail ? "partner-status-pill--approved" : "partner-status-pill--suspended"
                          }`}
                        >
                          {isAvail ? "Available" : "Unavailable"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {partnerStays.length > 0 && (
              <div className="partner-card-footer-links">
                <Link to="/partner/properties" className="partner-link-btn">
                  Manage Stays &amp; Prices &rarr;
                </Link>
                <Link to="/partner/availability" className="partner-link-btn">
                  Update Availability &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Card 2: Role Boundary Policy */}
          <div className="partner-card partner-card--policy">
            <div className="partner-policy-header">
              <ShieldCheck size={22} weight="fill" color="var(--color-forest)" />
              <h4 className="partner-policy-title">Role Boundary &amp; Platform Guidelines</h4>
            </div>
            <p className="partner-policy-text">
              As a verified partner host, you have full control over your assigned stays, photos, room availability, and booking inquiries.
            </p>
            <ul className="partner-policy-list">
              <li>
                <strong>Public Listings:</strong> Stays are made live on the website exclusively under Main Admin verification.
              </li>
              <li>
                <strong>Data Privacy:</strong> Other hosts' booking requests and fleet inventory remain private.
              </li>
              <li>
                <strong>Direct Bookings:</strong> Guest inquiries submitted through the website appear in your <em>Booking Requests</em> tab.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
