import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  CheckCircle,
  Car,
  Bicycle,
  HouseLine,
  CalendarBlank,
  Users,
  Info,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Ticket,
  Tag,
  Bed,
} from "phosphor-react";
import Dropdown from "./Dropdown.jsx";
import { saveBookingRequest } from "../utils/bookingStorage.js";
import { getRoomsByPropertyId, getRoomById, getStayById } from "../data/staysStore.js";
import PermitBookingModal from "./PermitBookingModal.jsx";
import "./BookingForm.css";

// Meal plan options: Simple, clean options
// Only two organic options (Organic Lunch & Organic Dinner),
// standard Vegetarian Lunch and Non-Vegetarian Lunch,
// Breakfast Included, and Room Only. (No EP/CP)
export const MEAL_PLAN_OPTIONS = [
  "Vegetarian Lunch",
  "Non-Vegetarian Lunch",
  "Organic Lunch",
  "Organic Dinner",
  "Breakfast Included",
  "Room Only (No Meals Included)",
];

export const ARRIVAL_TIME_OPTIONS = [
  "Morning (9:00 AM - 12:00 PM)",
  "Afternoon (12:00 PM - 4:00 PM)",
  "Evening (4:00 PM - 8:00 PM)",
  "Late Evening (After 8:00 PM)",
];

export const CAR_TRIP_DURATIONS = [
  "1 Day Sightseeing Tour",
  "2 Days / 1 Night",
  "3 Days / 2 Nights (North Sikkim)",
  "4 Days / 3 Nights",
  "5+ Days Custom Tour",
  "One-way Airport / Station Drop",
];

export const CAR_PICKUP_POINTS = [
  "Gangtok Hotel / Taxi Stand",
  "Bagdogra Airport (IXB)",
  "NJP Railway Station (Siliguri)",
  "Siliguri City",
  "Pelling / West Sikkim",
  "Other / Custom Location",
];

export const CAR_ROUTES = [
  "North Sikkim (Lachen, Lachung, Yumthang)",
  "East Sikkim (Nathula Pass, Tsomgo Lake, Baba Mandir)",
  "West Sikkim (Pelling, Skywalk, Yuksom)",
  "South Sikkim (Namchi Chardham, Ravangla)",
  "Airport / Railway Transfer Only",
  "Full Sikkim Circuit",
];

export const BIKE_ROUTES = [
  "North Sikkim (Lachen, Lachung, Gurudongmar)",
  "Old Silk Route (Zuluk, Gnathang)",
  "West Sikkim (Pelling, Yuksom, Ravangla)",
  "Local Gangtok & Mountain Passes",
  "Custom Himalayan Expedition",
];

export const HELMET_CHOICES = [
  "1 Helmet (Included with bike)",
  "2 Helmets (Rider + Pillion)",
  "Bringing Own Helmets",
];

export const RIDER_CHOICES = [
  { value: "1", label: "Solo Rider" },
  { value: "2", label: "Rider + Pillion" },
];

// Supported service-specific booking forms:
// context shape:
// {
//   service: "Car" | "Bike" | "Stay" | "Permit",
//   inventoryId: string,
//   title: string,
//   details: { label: string, value: string }[],
//   partnerId?: string,
// }
export default function BookingForm({ context, onClose }) {
  const service = context?.service || "Stay";

  if (service === "Permit") {
    return <PermitBookingModal context={context} onClose={onClose} />;
  }

  // Common customer contact fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  // Car-specific fields
  const [tripDuration, setTripDuration] = useState("1 Day Sightseeing Tour");
  const [pickupLocation, setPickupLocation] = useState("Gangtok Hotel / Taxi Stand");
  const [destinationRoute, setDestinationRoute] = useState("North Sikkim (Lachen, Lachung, Yumthang)");
  const [passengers, setPassengers] = useState(2);
  const [extraLuggage, setExtraLuggage] = useState(false);

  // Bike-specific fields
  const [rentalDays, setRentalDays] = useState(2);
  const [bikeRoute, setBikeRoute] = useState("North Sikkim (Lachen, Lachung, Gurudongmar)");
  const [riders, setRiders] = useState(1);
  const [helmetOption, setHelmetOption] = useState("1 Helmet (Included with bike)");
  const [saddleBags, setSaddleBags] = useState(false);
  const [permitHelp, setPermitHelp] = useState(true);
  const [licenseConfirmed, setLicenseConfirmed] = useState(false);

  // Stay-specific fields & room selection
  const stayPropId = context?.propertyId || (service === "Stay" && context?.inventoryId && !context.inventoryId.startsWith("room_") ? context.inventoryId : null);
  const [availableRooms, setAvailableRooms] = useState(() => {
    if (context?.availableRooms && context.availableRooms.length > 0) return context.availableRooms;
    if (stayPropId) return getRoomsByPropertyId(stayPropId);
    return [];
  });
  const [selectedRoomId, setSelectedRoomId] = useState(() => context?.roomId || "");
  const [nights, setNights] = useState(2);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [mealPlan, setMealPlan] = useState("Vegetarian Lunch");
  const [arrivalTime, setArrivalTime] = useState("Afternoon (12:00 PM - 4:00 PM)");

  // Active stay & room details
  const stayProperty = stayPropId ? getStayById(stayPropId) : null;
  const activeRoom = selectedRoomId
    ? (availableRooms.find((r) => r.id === selectedRoomId) || getRoomById(selectedRoomId))
    : null;
  const activePropertyName = context?.propertyName || (stayPropId ? getStayById(stayPropId)?.name : null) || context?.title || "Mountain Stay";
  const propertySubtext = stayProperty?.location ? `${stayProperty.location}, Sikkim` : (stayProperty?.type || "Verified Homestay");
  const roomSubtext = activeRoom
    ? `${activeRoom.type || "Standard Room"}${activeRoom.capacity ? ` · Up to ${activeRoom.capacity} guests` : ""}`
    : "Entire Property / General Stay";

  // Generic fallback fields
  const [travellers, setTravellers] = useState(2);

  // Submission state
  const [submitted, setSubmitted] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();

    let serviceDetails = [];
    let travellersCount = null;
    let nightsCount = null;
    const primaryDate = date;

    if (service === "Car") {
      travellersCount = Number(passengers) || 2;
      serviceDetails = [
        { label: "Vehicle", value: context.title || "Mountain Vehicle" },
        ...(context.details || []).filter((d) => d.label !== "Vehicle"),
        { label: "Pickup Location", value: pickupLocation },
        { label: "Destination Route", value: destinationRoute },
        { label: "Trip Duration", value: tripDuration },
        { label: "Passengers", value: `${passengers} passenger(s)` },
        ...(extraLuggage ? [{ label: "Luggage Carrier", value: "Requested" }] : []),
      ];
    } else if (service === "Bike") {
      travellersCount = Number(riders) || 1;
      serviceDetails = [
        { label: "Bike Model", value: context.title || "Adventure Bike" },
        ...(context.details || []).filter((d) => d.label !== "Bike"),
        { label: "Rental Duration", value: `${rentalDays} day(s)` },
        { label: "Riding Route", value: bikeRoute },
        { label: "Riders", value: `${riders} rider(s)` },
        { label: "Helmets", value: helmetOption },
        ...(saddleBags ? [{ label: "Saddle Bags / Luggage Carrier", value: "Requested" }] : []),
        ...(permitHelp ? [{ label: "Permit Assistance", value: "Requested" }] : []),
        { label: "Valid License", value: licenseConfirmed ? "Confirmed by Rider" : "Not yet confirmed" },
      ];
    } else if (service === "Stay") {
      travellersCount = (Number(adults) || 1) + (Number(children) || 0);
      nightsCount = Number(nights) || 1;
      const finalPropId = stayPropId || (context.inventoryId && !context.inventoryId.startsWith("room_") ? context.inventoryId : activeRoom?.propertyId) || null;
      const finalPropName = activePropertyName;
      const finalRoomId = activeRoom?.id || null;
      const finalRoomName = activeRoom?.name || null;

      serviceDetails = [
        { label: "Property", value: finalPropName },
        { label: "Room", value: finalRoomName ? `${finalRoomName} (${activeRoom.type || 'Room'})` : "Entire Property / General Stay" },
        ...(context.details || []).filter(
          (d) => d.label !== "Property" && d.label !== "Room" && d.label !== "Selected Room" && !d.label?.toLowerCase().includes("id")
        ),
        { label: "Check-in Date", value: date },
        { label: "Nights", value: `${nights} night(s)` },
        { label: "Guests", value: `${adults} adult(s)${children > 0 ? `, ${children} child(ren)` : ""}` },
        { label: "Rooms Required", value: `${rooms} room(s)` },
        { label: "Meal Plan", value: mealPlan },
      ];
    } else {
      travellersCount = Number(travellers) || null;
      nightsCount = Number(nights) || null;
      serviceDetails = context.details || [];
    }

    const finalPropId = service === "Stay"
      ? (stayPropId || (context.inventoryId && !context.inventoryId.startsWith("room_") ? context.inventoryId : activeRoom?.propertyId) || null)
      : (context.propertyId || null);
    const finalRoomId = service === "Stay" ? (activeRoom?.id || null) : (context.roomId || null);

    const saved = saveBookingRequest({
      service,
      inventoryId: finalRoomId || finalPropId || context.inventoryId || context.unitId || null,
      propertyId: finalPropId,
      roomId: finalRoomId,
      propertyName: service === "Stay" ? activePropertyName : null,
      roomName: service === "Stay" ? (activeRoom?.name || null) : null,
      partnerId: context.partnerId || null,
      details: serviceDetails,
      name,
      phone,
      email,
      date: primaryDate,
      travellers: travellersCount,
      nights: nightsCount,
      notes,
      message: notes,
    });

    setSubmittedRequest(saved);
    setSubmitted(true);
  }

  // Service configuration icons and labels
  const serviceConfig = {
    Car: {
      badge: "Car Rental & Cab Inquiry",
      heading: "Book Mountain Vehicle",
      subheading: "Verified local Sikkim driver, high-altitude clearance, and transparent rates.",
      icon: <Car size={18} weight="duotone" />,
    },
    Bike: {
      badge: "Motorcycle Rental Inquiry",
      heading: "Book Adventure Bike",
      subheading: "Touring-ready Himalayan bikes with protective gear and Sikkim route assistance.",
      icon: <Bicycle size={18} weight="duotone" />,
    },
    Stay: {
      badge: "Village Homestay & Stay Inquiry",
      heading: "Book Homestay",
      subheading: "Authentic local host family stay, organic dining, and scenic Himalayan views.",
      icon: <HouseLine size={18} weight="duotone" />,
    },
    Permit: {
      badge: "Permit Processing Inquiry",
      heading: "Request Permit Assistance",
      subheading: "Official Inner Line Permit (ILP) guidance for protected North & East Sikkim borders.",
      icon: <ShieldCheck size={18} weight="duotone" />,
    },
  }[service] || {
    badge: `${service} Booking Inquiry`,
    heading: `Book ${service}`,
    subheading: "Submit your travel request directly to the Lama Bhai team.",
    icon: <CalendarBlank size={18} weight="duotone" />,
  };

  return (
    <div className="booking-modal" role="dialog" aria-modal="true" aria-label={`Book ${service}`}>
      <div className="booking-modal__backdrop" onClick={onClose} />
      <div className="booking-modal__panel">
        <button className="booking-modal__close" onClick={onClose} aria-label="Close booking form">
          <X size={20} weight="bold" />
        </button>

        {submitted ? (
          <div className="booking-success">
            <div className="booking-success__icon-wrap">
              <CheckCircle size={36} weight="fill" />
            </div>

            <h2>Booking Request Received</h2>
            <div className="booking-success__id-badge">
              Request ID: {submittedRequest?.id || "Submitted"}
            </div>

            {/* Request Summary Recap */}
            <div className="booking-success__recap">
              <div className="booking-success__recap-row">
                <span className="booking-success__recap-label">Service</span>
                <span className="booking-success__recap-val">{service}</span>
              </div>
              {service === "Stay" ? (
                <>
                  <div className="booking-success__recap-row">
                    <span className="booking-success__recap-label">Property</span>
                    <span className="booking-success__recap-val">{submittedRequest?.propertyName || activePropertyName}</span>
                  </div>
                  <div className="booking-success__recap-row">
                    <span className="booking-success__recap-label">Room</span>
                    <span className="booking-success__recap-val" style={{ color: "var(--color-peach-deep)", fontWeight: 700 }}>
                      {submittedRequest?.roomName || (submittedRequest?.roomId ? submittedRequest.roomId : "Entire Property / General Stay")}
                    </span>
                  </div>
                </>
              ) : (
                <div className="booking-success__recap-row">
                  <span className="booking-success__recap-label">Requested Item</span>
                  <span className="booking-success__recap-val">{context.title}</span>
                </div>
              )}
              <div className="booking-success__recap-row">
                <span className="booking-success__recap-label">Travel Date</span>
                <span className="booking-success__recap-val">
                  {date || "Scheduled"}
                  {service === "Stay" && nights ? ` (${nights} nights)` : ""}
                  {service === "Bike" && rentalDays ? ` (${rentalDays} days)` : ""}
                </span>
              </div>
              <div className="booking-success__recap-row">
                <span className="booking-success__recap-label">Contact</span>
                <span className="booking-success__recap-val">{name} ({phone})</span>
              </div>
            </div>

            {/* Clear Non-Confirmed / No-Payment Notice (Requirement 7) */}
            <div className="booking-success__notice-card">
              <strong>Inquiry Status: New (Pending Operator Review)</strong>
              Please note: This is an inquiry request. Your reservation is <strong>not yet confirmed</strong>, and <strong>no payment has been made</strong>. The Lama Bhai local operations team will review live availability and contact you via phone or WhatsApp within a few hours to confirm route feasibility, documents, and final pricing.
            </div>

            {/* Manage Booking Callout */}
            <div
              style={{
                background: "rgba(232, 165, 140, 0.12)",
                border: "1.5px solid var(--color-peach)",
                borderRadius: "var(--radius-sm)",
                padding: "14px 16px",
                marginBottom: "var(--space-md)",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "var(--color-navy)", fontSize: "0.95rem" }}>
                <Ticket size={20} color="var(--color-peach-deep)" />
                Want to track, manage or cancel this booking?
              </div>
              <p style={{ margin: "4px 0 12px", fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
                You can review details, check confirmation status, or cancel this booking anytime using your Booking ID (<strong>{submittedRequest?.id}</strong>), phone number, and email.
              </p>
              <Link
                to={`/manage-booking?id=${encodeURIComponent(submittedRequest?.id || "")}&phone=${encodeURIComponent(phone)}&email=${encodeURIComponent(email)}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "var(--color-peach)",
                  color: "var(--color-navy)",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  padding: "10px 18px",
                  borderRadius: "var(--radius-sm)",
                  textDecoration: "none",
                  border: "none",
                  boxShadow: "0 2px 6px rgba(237, 106, 75, 0.25)",
                }}
                onClick={onClose}
              >
                <Ticket size={16} weight="bold" />
                Go to Manage Booking Now &rarr;
              </Link>
            </div>

            <button
              type="button"
              className="booking-success__done-btn"
              onClick={onClose}
              style={{ width: "100%", background: "#fff", border: "1px solid var(--color-border)", color: "var(--color-navy)" }}
            >
              Done / Return to Page
            </button>
          </div>
        ) : (
          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="booking-form__header">
              <h2 className="booking-form__heading">{serviceConfig.heading}</h2>
              <p className="booking-form__subheading">{serviceConfig.subheading}</p>
            </div>

            {/* Preselected Item Card (Requirement 1, 2, 3, 5) */}
            <div className="booking-preselect">
              <span className="booking-preselect__eyebrow">
                {serviceConfig.icon}
                {serviceConfig.badge}
              </span>
              {service === "Stay" ? (
                <div className="booking-stay-context-card">
                  <div className="booking-stay-context-row">
                    <div className="booking-stay-context-col">
                      <span className="booking-stay-context-label">
                        <HouseLine size={14} weight="bold" /> Property:
                      </span>
                      <div className="booking-stay-context-value">{activePropertyName}</div>
                      <span className="booking-stay-context-sub">{propertySubtext}</span>
                    </div>

                    <div className="booking-stay-context-col">
                      <span className="booking-stay-context-label">
                        <Bed size={14} weight="bold" /> Room:
                      </span>
                      <div className="booking-stay-context-value booking-stay-context-value--room">
                        {activeRoom ? activeRoom.name : "Entire Property / General Stay"}
                      </div>
                      <span className="booking-stay-context-sub">{roomSubtext}</span>
                    </div>
                  </div>

                  {availableRooms && availableRooms.length > 0 && (
                    <div className="booking-stay-room-picker">
                      <label className="booking-stay-room-picker-label">
                        Selected Room Unit:
                      </label>
                      <select
                        className="booking-stay-room-select"
                        value={selectedRoomId}
                        onChange={(e) => setSelectedRoomId(e.target.value)}
                      >
                        <option value="">Entire Property / Any Available Room</option>
                        {availableRooms.map((rm) => (
                          <option key={rm.id} value={rm.id}>
                            {rm.name} ({rm.type || "Room"}{rm.price ? ` · ${rm.price}` : ""})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <h3 className="booking-preselect__title">{context.title}</h3>
              )}

              <div className="booking-preselect__details">
                {(context.details || [])
                  .filter((d) => d.label !== "Vehicle" && d.label !== "Bike" && (service !== "Stay" || (d.label !== "Property" && d.label !== "Room" && d.label !== "Selected Room" && d.label !== "Property ID" && d.label !== "Room ID")))
                  .map((d) => (
                    <span key={d.label} className="booking-preselect__chip">
                      <strong>{d.label}:</strong> {d.value}
                    </span>
                  ))}
              </div>

              {context?.appliedOffer && (
                <div
                  className="booking-preselect__offer-banner"
                  style={{
                    marginTop: "12px",
                    padding: "10px 14px",
                    background: "linear-gradient(135deg, rgba(224, 122, 95, 0.12) 0%, rgba(224, 122, 95, 0.05) 100%)",
                    border: "1.5px solid rgba(224, 122, 95, 0.35)",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <Tag size={16} color="var(--color-peach-deep)" weight="fill" />
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--color-peach-deep)" }}>
                      {context.appliedOffer.badgeText || context.appliedOffer.discountValue || context.appliedOffer.title}
                    </span>
                    <span style={{ fontSize: "0.78rem", background: "var(--color-peach-soft)", color: "var(--color-navy)", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>
                      {context.appliedOffer.title}
                    </span>
                  </div>
                  {context.appliedOffer.description && (
                    <div style={{ fontSize: "0.8rem", color: "var(--color-navy)", opacity: 0.88, paddingLeft: "24px" }}>
                      ✓ {context.appliedOffer.description}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Customer Contact Details */}
            <div className="booking-form__grid">
              <label className="booking-field">
                <span>Your Full Name *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tenzing Norbu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label className="booking-field">
                <span>Phone / WhatsApp *</span>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
            </div>

            <label className="booking-field booking-field--full">
              <span>Email Address (Optional)</span>
              <input
                type="email"
                placeholder="e.g. travel@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            {/* ============================================================ */}
            {/* CAR SPECIFIC FLOW (Requirement 1 & 4)                         */}
            {/* ============================================================ */}
            {service === "Car" && (
              <>
                <div className="booking-form__grid">
                  <label className="booking-field">
                    <span>Trip Start / Pickup Date *</span>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </label>

                  <div className="booking-field">
                    <Dropdown
                      label="Estimated Trip Duration"
                      options={CAR_TRIP_DURATIONS}
                      value={tripDuration}
                      onChange={setTripDuration}
                      light
                      hideEmptyOption
                    />
                  </div>
                </div>

                <div className="booking-form__grid">
                  <div className="booking-field">
                    <Dropdown
                      label="Pickup Point"
                      options={CAR_PICKUP_POINTS}
                      value={pickupLocation}
                      onChange={setPickupLocation}
                      light
                      hideEmptyOption
                    />
                  </div>

                  <div className="booking-field">
                    <Dropdown
                      label="Destination Route"
                      options={CAR_ROUTES}
                      value={destinationRoute}
                      onChange={setDestinationRoute}
                      light
                      hideEmptyOption
                    />
                  </div>
                </div>

                <div className="booking-form__grid">
                  <label className="booking-field">
                    <span>Number of Passengers</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={passengers}
                      onChange={(e) => setPassengers(e.target.value)}
                    />
                    <span className="booking-field__hint">Vehicle configured for comfortable mountain travel</span>
                  </label>

                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <label className="booking-checkbox">
                      <input
                        type="checkbox"
                        checked={extraLuggage}
                        onChange={(e) => setExtraLuggage(e.target.checked)}
                      />
                      <span>Request extra roof luggage carrier</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* ============================================================ */}
            {/* BIKE SPECIFIC FLOW (Requirement 2 & 4)                        */}
            {/* ============================================================ */}
            {service === "Bike" && (
              <>
                <div className="booking-form__grid">
                  <label className="booking-field">
                    <span>Rental Start Date *</span>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </label>

                  <label className="booking-field">
                    <span>Rental Duration (Days) *</span>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      required
                      value={rentalDays}
                      onChange={(e) => setRentalDays(e.target.value)}
                    />
                  </label>
                </div>

                <div className="booking-form__grid">
                  <div className="booking-field">
                    <Dropdown
                      label="Planned Riding Route"
                      options={BIKE_ROUTES}
                      value={bikeRoute}
                      onChange={setBikeRoute}
                      light
                      hideEmptyOption
                    />
                  </div>

                  <div className="booking-field">
                    <Dropdown
                      label="Helmets Required"
                      options={HELMET_CHOICES}
                      value={helmetOption}
                      onChange={setHelmetOption}
                      light
                      hideEmptyOption
                    />
                  </div>
                </div>

                <div className="booking-form__grid">
                  <div className="booking-field">
                    <Dropdown
                      label="Riders on this Machine"
                      options={RIDER_CHOICES}
                      value={String(riders)}
                      onChange={(val) => setRiders(Number(val) || 1)}
                      light
                      hideEmptyOption
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <label className="booking-checkbox">
                      <input
                        type="checkbox"
                        checked={saddleBags}
                        onChange={(e) => setSaddleBags(e.target.checked)}
                      />
                      <span>Request saddle bags / luggage rack</span>
                    </label>
                  </div>
                </div>

                <label className="booking-checkbox">
                  <input
                    type="checkbox"
                    checked={permitHelp}
                    onChange={(e) => setPermitHelp(e.target.checked)}
                  />
                  <span>Need assistance with Sikkim Inner Line Permit (ILP) for bike</span>
                </label>

                <label className="booking-checkbox" style={{ fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    required
                    checked={licenseConfirmed}
                    onChange={(e) => setLicenseConfirmed(e.target.checked)}
                  />
                  <span>I confirm that the rider holds a valid 2-wheeler driving license. *</span>
                </label>
              </>
            )}

            {/* ============================================================ */}
            {/* STAY / HOMESTAY SPECIFIC FLOW (Requirement 3 & 4)             */}
            {/* ============================================================ */}
            {service === "Stay" && (
              <>
                <div className="booking-form__grid">
                  <label className="booking-field">
                    <span>Check-in Date *</span>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </label>

                  <label className="booking-field">
                    <span>Number of Nights *</span>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      required
                      value={nights}
                      onChange={(e) => setNights(e.target.value)}
                    />
                  </label>
                </div>

                <div className="booking-form__grid">
                  <label className="booking-field">
                    <span>Adult Guests (12+ yrs) *</span>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      required
                      value={adults}
                      onChange={(e) => setAdults(e.target.value)}
                    />
                  </label>

                  <label className="booking-field">
                    <span>Children (0-11 yrs)</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={children}
                      onChange={(e) => setChildren(e.target.value)}
                    />
                  </label>
                </div>

                <div className="booking-form__grid">
                  <label className="booking-field">
                    <span>Rooms Required</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={rooms}
                      onChange={(e) => setRooms(e.target.value)}
                    />
                  </label>

                  <div className="booking-field">
                    <Dropdown
                      label="Estimated Arrival Time"
                      options={ARRIVAL_TIME_OPTIONS}
                      value={arrivalTime}
                      onChange={setArrivalTime}
                      light
                      hideEmptyOption
                    />
                  </div>
                </div>

                <div className="booking-field booking-field--full">
                  <Dropdown
                    label="Meal Plan Preference"
                    options={MEAL_PLAN_OPTIONS}
                    value={mealPlan}
                    onChange={setMealPlan}
                    light
                    hideEmptyOption
                  />
                </div>
              </>
            )}

            {/* ============================================================ */}
            {/* PERMIT / GENERIC FALLBACK FLOW                                */}
            {/* ============================================================ */}
            {service !== "Car" && service !== "Bike" && service !== "Stay" && (
              <div className="booking-form__grid">
                <label className="booking-field">
                  <span>Requested Date *</span>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>

                <label className="booking-field">
                  <span>Travellers</span>
                  <input
                    type="number"
                    min="1"
                    value={travellers}
                    onChange={(e) => setTravellers(e.target.value)}
                  />
                </label>
              </div>
            )}

            {/* Additional Notes */}
            <label className="booking-field booking-field--full">
              <span>Special Requests or Notes (Optional)</span>
              <textarea
                rows="2"
                placeholder="Luggage requirements, food preferences, senior citizen assistance..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            {/* Inquiry Notice (Requirement 7) */}
            <div className="booking-info-notice">
              <Info size={18} />
              <span>
                <strong>Direct Enquiry:</strong> No upfront payment is taken. Submitting this request allows our local team to check driver/host schedules and confirm your itinerary.
              </span>
            </div>

            <button type="submit" className="booking-form__submit">
              Submit {service} Booking Request <ArrowRight size={16} weight="bold" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}