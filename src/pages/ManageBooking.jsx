import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  CalendarCheck,
  HouseLine,
  Car,
  Bicycle,
  ShieldCheck,
  MapPin,
  Clock,
  WarningCircle,
  Phone,
  EnvelopeSimple,
  ArrowLeft,
  X,
  Printer,
  Sparkle,
} from "phosphor-react";
import { api } from "../utils/api.js";
import "./ManageBooking.css";

export const CANCELLATION_REASONS = [
  "Change of travel dates",
  "Weather / road blockade concerns",
  "Health / personal emergency",
  "Found alternative accommodation",
  "Cancelled trip to Sikkim entirely",
  "Other reason",
];

export default function ManageBooking() {
  const [searchParams] = useSearchParams();

  // Lookup form fields
  const [bookingId, setBookingId] = useState(searchParams.get("id") || "");
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");

  // State
  const [searching, setSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [currentBooking, setCurrentBooking] = useState(null);

  // Cancellation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCELLATION_REASONS[0]);
  const [cancelNotes, setCancelNotes] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccessNotice, setCancelSuccessNotice] = useState(false);

  // Auto-verify if query params are present in URL
  useEffect(() => {
    const qId = searchParams.get("id");
    const qPhone = searchParams.get("phone");
    const qEmail = searchParams.get("email");

    if (qId) {
      handleLookup(qId, qPhone || "", qEmail || "");
    }
  }, [searchParams]);

  async function handleLookup(idVal = bookingId, phoneVal = phone, emailVal = email) {
    setErrorMessage(null);
    setCancelSuccessNotice(false);

    if (!idVal.trim()) {
      setErrorMessage("Please enter your Booking Reference ID.");
      return;
    }

    setSearching(true);
    try {
      const res = await api.bookings.getById(idVal.trim());

      if (res && res.success && res.data) {
        const b = res.data;

        // Security check: if phone and email were entered in the form, verify match
        if (phoneVal.trim() && emailVal.trim()) {
          const cleanPhoneDigits = phoneVal.replace(/\D/g, "");
          const bPhoneDigits = (b.customerDetails?.phone || "").replace(/\D/g, "");
          const matchPhone =
            cleanPhoneDigits.length >= 10 && bPhoneDigits.length >= 10
              ? cleanPhoneDigits.slice(-10) === bPhoneDigits.slice(-10)
              : cleanPhoneDigits === bPhoneDigits;

          const matchEmail =
            (emailVal || "").trim().toLowerCase() === (b.customerDetails?.email || "").trim().toLowerCase();

          if (!matchPhone && !matchEmail) {
            setCurrentBooking(null);
            setErrorMessage("The phone number and email address do not match this booking record.");
            setSearching(false);
            return;
          }
        }

        const checkInStr = b.schedule?.checkIn ? new Date(b.schedule.checkIn).toLocaleDateString("en-IN") : "";
        const checkOutStr = b.schedule?.checkOut ? new Date(b.schedule.checkOut).toLocaleDateString("en-IN") : "";

        const mappedBooking = {
          id: b.bookingRequestId || b._id,
          _id: b._id,
          bookingRequestId: b.bookingRequestId,
          service: b.service || "Stay",
          status: b.status || "New",
          name: b.customerDetails?.name || "Guest",
          phone: b.customerDetails?.phone || "",
          email: b.customerDetails?.email || "",
          propertyName: b.propertyName || b.property?.name || "",
          roomName: b.roomName || b.room?.name || "",
          date: checkInStr ? `${checkInStr}${checkOutStr ? ` to ${checkOutStr}` : ""}` : "",
          travellers: b.travellers || 1,
          nights: b.schedule?.nights || 1,
          price: b.pricing?.totalPrice ? `₹${b.pricing.totalPrice.toLocaleString("en-IN")}` : "—",
          notes: b.notes || "",
          submittedAt: b.createdAt,
          cancelledAt: b.cancellation?.cancelledAt,
          cancellationReason: b.cancellation?.reason,
          cancellationNotes: b.cancellation?.notes,
          details: [
            ...(b.propertyName ? [{ label: "Property", value: b.propertyName }] : []),
            ...(b.roomName ? [{ label: "Room", value: b.roomName }] : []),
            ...(checkInStr ? [{ label: "Check-in", value: checkInStr }] : []),
            ...(checkOutStr ? [{ label: "Check-out", value: checkOutStr }] : []),
            ...(b.pricing?.totalPrice ? [{ label: "Total Tariff", value: `₹${b.pricing.totalPrice.toLocaleString("en-IN")}` }] : []),
          ],
        };

        setCurrentBooking(mappedBooking);
        setErrorMessage(null);
      } else {
        setCurrentBooking(null);
        setErrorMessage("No booking found with this reference ID. Please check the ID and try again.");
      }
    } catch (err) {
      console.error("[ManageBooking] Lookup error:", err);
      setCurrentBooking(null);
      setErrorMessage("No booking matched the details provided. Please verify your reference ID.");
    } finally {
      setSearching(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    handleLookup();
  }

  function handleOpenCancelModal() {
    setCancelReason(CANCELLATION_REASONS[0]);
    setCancelNotes("");
    setShowCancelModal(true);
  }

  async function handleConfirmCancellation() {
    if (!currentBooking) return;

    setCancelling(true);
    try {
      const idToCancel = currentBooking.bookingRequestId || currentBooking._id || currentBooking.id;
      const res = await api.bookings.cancel(idToCancel, {
        reason: cancelReason,
        notes: cancelNotes,
      });

      if (res && res.success && res.data) {
        const b = res.data;
        setCurrentBooking((prev) => ({
          ...prev,
          status: b.status || "Cancelled",
          cancelledAt: b.cancellation?.cancelledAt || new Date().toISOString(),
          cancellationReason: b.cancellation?.reason || cancelReason,
          cancellationNotes: b.cancellation?.notes || cancelNotes,
        }));
        setShowCancelModal(false);
        setCancelSuccessNotice(true);
      } else {
        alert(res?.error || "Failed to cancel booking. Please try again or contact Lama Bhai support.");
      }
    } catch (err) {
      console.error("[ManageBooking] Error during cancellation:", err);
      alert(err.message || "Error cancelling booking.");
    } finally {
      setCancelling(false);
    }
  }

  const serviceIcon = {
    Stay: <HouseLine size={20} weight="duotone" />,
    Car: <Car size={20} weight="duotone" />,
    Bike: <Bicycle size={20} weight="duotone" />,
    Permit: <ShieldCheck size={20} weight="duotone" />,
  }[currentBooking?.service] || <CalendarCheck size={20} weight="duotone" />;

  const isCancelled = currentBooking?.status === "Cancelled";

  return (
    <main className="manage-booking-page">
      <div className="manage-booking-container">
        {/* Breadcrumb / Back Link */}
        <Link to="/" className="back-pill-btn" aria-label="Back to Lama Bhai Home">
          <span>&larr;</span> Back to Home
        </Link>

        {/* Header */}
        <div className="manage-booking__header">
          <span className="manage-booking__eyebrow">
            <Sparkle size={14} weight="bold" /> Guest Care &amp; Reservations
          </span>
          <h1>Manage &amp; Track Your Booking</h1>
          <p>
            Verify your reservation status, review trip specifications, or cancel your booking if your travel plans have changed.
          </p>
        </div>

        {/* Verification & Lookup Card */}
        <div className="manage-booking__card">
          <h2 className="manage-booking__card-title">
            <MagnifyingGlass size={20} weight="bold" /> Booking Verification Lookup
          </h2>
          <p className="manage-booking__card-sub">
            Please enter your <strong>Booking Reference ID</strong>, and optionally your phone or email for verified lookup.
          </p>

          <form onSubmit={handleSearchSubmit} className="manage-booking__form">
            <div className="manage-booking__form-grid">
              <label className="manage-booking__field">
                <span>Booking Reference ID *</span>
                <input
                  type="text"
                  placeholder="e.g. LB-ST-... or MongoDB ID"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  required
                />
                <small>Reference code provided on booking confirmation</small>
              </label>

              <label className="manage-booking__field">
                <span>Phone / WhatsApp Number</span>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <small>Contact phone number registered with booking</small>
              </label>

              <label className="manage-booking__field">
                <span>Email Address</span>
                <input
                  type="email"
                  placeholder="e.g. yourname@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <small>Email address registered with booking</small>
              </label>
            </div>

            {errorMessage && (
              <div className="manage-booking__error" role="alert">
                <WarningCircle size={18} weight="fill" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="manage-booking__form-actions">
              <button
                type="submit"
                className="btn-primary manage-booking__submit-btn"
                disabled={searching}
              >
                {searching ? (
                  "Verifying..."
                ) : (
                  <>
                    <MagnifyingGlass size={16} weight="bold" /> Retrieve Booking
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Cancellation Success Toast */}
        {cancelSuccessNotice && (
          <div className="manage-booking__cancel-alert" role="status">
            <CheckCircle size={24} weight="fill" className="manage-booking__cancel-alert-icon" />
            <div>
              <h3>Booking Successfully Cancelled</h3>
              <p>
                Your reservation (<strong>{currentBooking?.id}</strong>) has been cancelled in the system. The host and operations team have been notified.
              </p>
            </div>
          </div>
        )}

        {/* Retrieved Booking Details */}
        {currentBooking && (
          <div className="manage-booking__details-card">
            {/* Status Header Bar */}
            <div className="manage-booking__details-top">
              <div className="manage-booking__details-title-row">
                <span className="manage-booking__service-tag">
                  {serviceIcon} {currentBooking.service} Reservation
                </span>
                <span className="manage-booking__id-tag">ID: {currentBooking.id}</span>
              </div>

              {/* Status Badge */}
              <div className="manage-booking__status-badge-wrap">
                <span
                  className={`manage-booking__status-badge manage-booking__status-badge--${currentBooking.status.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {isCancelled ? <XCircle size={16} weight="fill" /> : <CheckCircle size={16} weight="fill" />}
                  {isCancelled ? "Cancelled" : currentBooking.status}
                </span>
              </div>
            </div>

            {/* Cancelled Banner */}
            {isCancelled && (
              <div className="manage-booking__cancelled-banner">
                <div className="manage-booking__cancelled-banner-header">
                  <XCircle size={20} weight="fill" color="#b71c1c" />
                  <strong>This booking has been cancelled</strong>
                </div>
                {currentBooking.cancelledAt && (
                  <p className="manage-booking__cancelled-meta">
                    Cancelled on: {new Date(currentBooking.cancelledAt).toLocaleString()}
                  </p>
                )}
                {currentBooking.cancellationReason && (
                  <p className="manage-booking__cancelled-reason">
                    <strong>Reason:</strong> {currentBooking.cancellationReason}
                  </p>
                )}
                {currentBooking.cancellationNotes && (
                  <p className="manage-booking__cancelled-notes">
                    <strong>Guest remarks:</strong> "{currentBooking.cancellationNotes}"
                  </p>
                )}
              </div>
            )}

            {/* Details Grid */}
            <div className="manage-booking__info-grid">
              <div className="manage-booking__info-section">
                <h3>Trip &amp; Reservation Details</h3>
                <dl className="manage-booking__dl">
                  <div className="manage-booking__dl-row">
                    <dt>Service:</dt>
                    <dd>{currentBooking.service}</dd>
                  </div>
                  {currentBooking.service === "Stay" && (
                    <>
                      <div className="manage-booking__dl-row">
                        <dt>Property:</dt>
                        <dd><strong>{currentBooking.propertyName || "Homestay"}</strong></dd>
                      </div>
                      <div className="manage-booking__dl-row">
                        <dt>Room:</dt>
                        <dd><strong style={{ color: "var(--color-peach-deep)" }}>{currentBooking.roomName || "Entire Property / General Stay"}</strong></dd>
                      </div>
                    </>
                  )}
                  {currentBooking.date && (
                    <div className="manage-booking__dl-row">
                      <dt>Scheduled Date:</dt>
                      <dd>{currentBooking.date}</dd>
                    </div>
                  )}
                  {currentBooking.travellers && (
                    <div className="manage-booking__dl-row">
                      <dt>Travellers / Guests:</dt>
                      <dd>{currentBooking.travellers} Person(s)</dd>
                    </div>
                  )}
                  {currentBooking.nights && (
                    <div className="manage-booking__dl-row">
                      <dt>Duration:</dt>
                      <dd>{currentBooking.nights} night(s)</dd>
                    </div>
                  )}
                  {currentBooking.price && (
                    <div className="manage-booking__dl-row">
                      <dt>Total Tariff:</dt>
                      <dd><strong>{currentBooking.price}</strong></dd>
                    </div>
                  )}
                  {currentBooking.submittedAt && (
                    <div className="manage-booking__dl-row">
                      <dt>Requested On:</dt>
                      <dd>{new Date(currentBooking.submittedAt).toLocaleDateString()}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Service Specifications & Options */}
              <div className="manage-booking__info-section">
                <h3>Options &amp; Preferences</h3>
                {currentBooking.details && currentBooking.details.length > 0 ? (
                  <dl className="manage-booking__dl">
                    {currentBooking.details
                      .filter((d) => !d.label?.toLowerCase().includes("id"))
                      .map((d, idx) => (
                        <div className="manage-booking__dl-row" key={idx}>
                          <dt>{d.label}:</dt>
                          <dd>{d.value}</dd>
                        </div>
                      ))}
                  </dl>
                ) : (
                  <p className="manage-booking__muted">Standard package reservation</p>
                )}
              </div>

              {/* Guest Information */}
              <div className="manage-booking__info-section manage-booking__info-section--full">
                <h3>Guest &amp; Contact Details</h3>
                <dl className="manage-booking__dl manage-booking__dl--horizontal">
                  <div className="manage-booking__dl-row">
                    <dt>Guest Name:</dt>
                    <dd>{currentBooking.name || "—"}</dd>
                  </div>
                  <div className="manage-booking__dl-row">
                    <dt>Phone Number:</dt>
                    <dd>{currentBooking.phone || "—"}</dd>
                  </div>
                  <div className="manage-booking__dl-row">
                    <dt>Email Address:</dt>
                    <dd>{currentBooking.email || "—"}</dd>
                  </div>
                  {currentBooking.notes && (
                    <div className="manage-booking__dl-row manage-booking__dl-row--full">
                      <dt>Special Requests:</dt>
                      <dd>{currentBooking.notes}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="manage-booking__actions-bar">
              <button
                type="button"
                className="btn-secondary manage-booking__print-btn"
                onClick={() => window.print()}
              >
                <Printer size={16} /> Print Confirmation
              </button>

              {!isCancelled ? (
                <div className="manage-booking__cancel-wrap">
                  <p className="manage-booking__cancel-prompt">
                    Plans changed or emergency? You can cancel this reservation instantly.
                  </p>
                  <button
                    type="button"
                    className="manage-booking__cancel-btn"
                    onClick={handleOpenCancelModal}
                  >
                    <XCircle size={16} weight="bold" /> Cancel This Booking
                  </button>
                </div>
              ) : (
                <span className="manage-booking__cancelled-tag">
                  <XCircle size={16} weight="bold" /> Booking Cancelled
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div
          className="manage-booking-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
        >
          <div
            className="manage-booking-modal__backdrop"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="manage-booking-modal__panel">
            <button
              type="button"
              className="manage-booking-modal__close"
              onClick={() => setShowCancelModal(false)}
              aria-label="Close cancellation dialog"
            >
              <X size={20} weight="bold" />
            </button>

            <div className="manage-booking-modal__header">
              <div className="manage-booking-modal__icon-wrap">
                <WarningCircle size={32} weight="fill" color="#c1622d" />
              </div>
              <h2 id="cancel-modal-title">Confirm Booking Cancellation</h2>
              <p>
                Are you sure you want to cancel booking <strong>{currentBooking?.id}</strong>?
                This action is immediate and records your cancellation in the reservation system.
              </p>
            </div>

            <div className="manage-booking-modal__body">
              <label className="manage-booking-modal__field">
                <span>Reason for Cancellation *</span>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="manage-booking-modal__select"
                >
                  {CANCELLATION_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </label>

              <label className="manage-booking-modal__field">
                <span>Additional Notes / Remarks (Optional)</span>
                <textarea
                  rows={3}
                  placeholder="Tell our operations team or host any relevant context..."
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  className="manage-booking-modal__textarea"
                />
              </label>
            </div>

            <div className="manage-booking-modal__footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Keep Booking
              </button>
              <button
                type="button"
                className="manage-booking-modal__confirm-btn"
                onClick={handleConfirmCancellation}
                disabled={cancelling}
              >
                {cancelling ? "Processing Cancellation..." : "Yes, Cancel My Booking Instantly"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
