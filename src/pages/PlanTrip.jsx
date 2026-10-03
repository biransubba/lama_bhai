import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CalendarBlank,
  Users,
  Mountains,
  MapPinLine,
  Car,
  Bed,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Compass,
  Check,
  Sparkle,
  PhoneCall,
  Clock,
  Info,
  MapTrifold,
  User,
  Envelope,
  ChatCircleText,
  AirplaneTakeoff,
  Lightbulb,
  CaretDown,
  GlobeHemisphereWest,
  WarningCircle,
} from "phosphor-react";
import {
  SIKKIM_DESTINATIONS,
  SIKKIM_CIRCUITS,
  TRAVEL_VIBES,
  VEHICLE_OPTIONS,
  STAY_OPTIONS,
  PICKUP_POINTS,
  DURATION_PRESETS,
} from "../data/planner.js";
import {
  getActivePlannerDestinations,
  getActivePlannerCircuits,
  getPlannerSettings,
} from "../data/plannerStore.js";
import { saveBookingRequest } from "../utils/bookingStorage.js";
import { getContactSettings, buildWhatsAppLink, buildPhoneLink } from "../data/contactSettings.js";
import { ModernWhatsAppIcon, ModernPhoneIcon } from "../components/SocialIcons.jsx";
import { carModelsRepo } from "../data/vehicles.js";
import { getAllActiveStays } from "../data/staysStore.js";
import Dropdown from "../components/Dropdown.jsx";
import IndiaFlag from "../components/IndiaFlag.jsx";
import "./PlanTrip.css";

const STEPS = [
  { id: 0, title: "Destinations & Dates", subtitle: "Where & When" },
  { id: 1, title: "Ride, Stay & Permits", subtitle: "Comfort & Safety" },
  { id: 2, title: "Review & Quote", subtitle: "Contact & Delivery" },
];

const REGION_FILTERS = [
  "All Destinations",
  "North Sikkim",
  "West Sikkim",
  "East Sikkim",
  "South Sikkim",
];

const POPULAR_MONTHS = [
  "March 2026",
  "April 2026",
  "May 2026",
  "October 2026",
  "November 2026",
  "December 2026",
  "January 2027",
  "Spring (March–May)",
  "Autumn (Oct–Dec)",
];

export default function PlanTrip() {
  const [searchParams] = useSearchParams();
  const contact = getContactSettings();

  // Active wizard step: 0, 1, or 2
  const [step, setStep] = useState(0);

  // Dynamic admin-managed inventory
  const [plannerDestinations, setPlannerDestinations] = useState(getActivePlannerDestinations());
  const [plannerCircuits, setPlannerCircuits] = useState(getActivePlannerCircuits());
  const [plannerSettings, setPlannerSettings] = useState(getPlannerSettings());
  const [carModels, setCarModels] = useState(() => carModelsRepo.getAll().filter((m) => m.active !== false));
  const [activeStaysList, setActiveStaysList] = useState(() => getAllActiveStays());

  // Subscribe to live admin storage updates
  useEffect(() => {
    function refresh() {
      setPlannerDestinations(getActivePlannerDestinations());
      setPlannerCircuits(getActivePlannerCircuits());
      setPlannerSettings(getPlannerSettings());
      setCarModels(carModelsRepo.getAll().filter((m) => m.active !== false));
      setActiveStaysList(getAllActiveStays());
    }
    window.addEventListener("admin-storage-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("admin-storage-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // Destination Selection Mode: "destinations" (pick individual places) vs "circuits" (curated circuits)
  const [selectionMode, setSelectionMode] = useState("destinations");
  const [regionFilter, setRegionFilter] = useState("All Destinations");

  // Selected destination IDs
  const initialDestParam = searchParams.get("destination");
  const defaultSelectedDest = initialDestParam
    ? [initialDestParam]
    : [plannerDestinations[0]?.id || "gurudongmar-lake"];
  const [selectedDestIds, setSelectedDestIds] = useState(defaultSelectedDest);

  // Selected circuit ID
  const [selectedCircuitId, setSelectedCircuitId] = useState(
    plannerCircuits[0]?.id || "north-sikkim-circuit"
  );

  // Traveler Nationality ("Indian Tourist" | "Foreign Tourist")
  const [nationality, setNationality] = useState("Indian Tourist");
  const [foreignAccessFilter, setForeignAccessFilter] = useState("all"); // "all" | "permitted" | "restricted"
  const [circuitAccessFilter, setCircuitAccessFilter] = useState("all"); // "all" | "permitted" | "restricted"

  // Travel Vibes
  const [selectedVibes, setSelectedVibes] = useState(["High Altitude & Snow Peaks"]);

  // Dates & Duration
  const [dateMode, setDateMode] = useState("specific"); // "specific" | "flexible"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [flexibleMonth, setFlexibleMonth] = useState("October 2026");
  const [flexibleDuration, setFlexibleDuration] = useState("2–3 Days");

  // Guests
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // Step 2: Vehicle, stay & permits
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    () => carModelsRepo.getAll().find((m) => m.active !== false)?.slug || "mahindra-scorpio"
  );
  const [selectedStayId, setSelectedStayId] = useState("mixed");
  const [wantsPermitHelp, setWantsPermitHelp] = useState(true);

  // Step 3: Contact information
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupPoint, setPickupPoint] = useState(PICKUP_POINTS[0]);
  const [specialRequests, setSpecialRequests] = useState("");

  // UI state & validation
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Sync destination query param if URL has it
  useEffect(() => {
    const param = searchParams.get("destination");
    if (param) {
      const matchDest = plannerDestinations.find(
        (d) => d.id === param || d.name.toLowerCase().includes(param.toLowerCase())
      );
      if (matchDest && !selectedDestIds.includes(matchDest.id)) {
        setSelectedDestIds([matchDest.id]);
        setSelectionMode("destinations");
      }
    }
  }, [searchParams, plannerDestinations]);

  // Toggle individual destination
  function toggleDestination(destId) {
    setSelectedDestIds((prev) => {
      if (prev.includes(destId)) {
        return prev.length > 1 ? prev.filter((id) => id !== destId) : prev;
      }
      return [...prev, destId];
    });
  }

  // Toggle vibe
  function toggleVibe(vibe) {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  }

  // Active resolved entities
  const activeDestinations = plannerDestinations.filter((d) =>
    selectedDestIds.includes(d.id)
  );
  const activeCircuit =
    plannerCircuits.find((c) => c.id === selectedCircuitId) || plannerCircuits[0] || SIKKIM_CIRCUITS[0];

  // Helper to determine foreign accessibility for a circuit
  function getCircuitEligibility(circuit) {
    if (!circuit) {
      return {
        hasRestrictions: false,
        isEntirelyRestricted: false,
        isPartiallyRestricted: false,
        restrictedPlaces: [],
        permittedPlaces: [],
      };
    }

    const destIds = circuit.destinationIds || [];
    const matchedDestinations = plannerDestinations.filter((d) =>
      destIds.includes(d.id)
    );

    const placesText = `${circuit.name} ${circuit.places} ${circuit.tagline || ""}`.toLowerCase();
    const hasGurudongmar = placesText.includes("gurudongmar") || destIds.includes("gurudongmar-lake");
    const hasZeroPoint = placesText.includes("zero point") || destIds.includes("zero-point");
    const hasNathula = placesText.includes("nathula") || destIds.includes("nathula-pass");
    const hasZuluk = placesText.includes("zuluk") || destIds.includes("zuluk-silk-route");

    const restrictedNames = [];
    const permittedNames = [];

    if (matchedDestinations.length > 0) {
      matchedDestinations.forEach((d) => {
        if (d.restrictedForForeigners) {
          restrictedNames.push(d.name);
        } else {
          permittedNames.push(d.name);
        }
      });
    }

    if (hasGurudongmar && !restrictedNames.some((n) => n.toLowerCase().includes("gurudongmar"))) {
      restrictedNames.push("Gurudongmar Lake");
    }
    if (hasZeroPoint && !restrictedNames.some((n) => n.toLowerCase().includes("zero point"))) {
      restrictedNames.push("Zero Point");
    }
    if (hasNathula && !restrictedNames.some((n) => n.toLowerCase().includes("nathula"))) {
      restrictedNames.push("Nathula Pass");
    }
    if (hasZuluk && !restrictedNames.some((n) => n.toLowerCase().includes("zuluk"))) {
      restrictedNames.push("Zuluk & Old Silk Route");
    }

    if ((placesText.includes("lachen") || destIds.includes("lachen")) && !permittedNames.some((n) => n.toLowerCase().includes("lachen"))) {
      permittedNames.push("Lachen");
    }
    if ((placesText.includes("lachung") || destIds.includes("lachung")) && !permittedNames.some((n) => n.toLowerCase().includes("lachung"))) {
      permittedNames.push("Lachung");
    }
    if ((placesText.includes("yumthang") || destIds.includes("yumthang-valley")) && !permittedNames.some((n) => n.toLowerCase().includes("yumthang"))) {
      permittedNames.push("Yumthang Valley");
    }
    if ((placesText.includes("pelling") || destIds.includes("pelling")) && !permittedNames.some((n) => n.toLowerCase().includes("pelling"))) {
      permittedNames.push("Pelling & Skywalk");
    }
    if ((placesText.includes("gangtok") || destIds.includes("gangtok-sightseeing")) && !permittedNames.some((n) => n.toLowerCase().includes("gangtok"))) {
      permittedNames.push("Gangtok");
    }
    if ((placesText.includes("temi") || placesText.includes("ravangla") || destIds.includes("ravangla-namchi")) && !permittedNames.some((n) => n.toLowerCase().includes("ravangla"))) {
      permittedNames.push("Ravangla & Namchi");
    }

    const uniqueRestricted = [...new Set(restrictedNames)];
    const uniquePermitted = [...new Set(permittedNames)];

    const hasRestrictions = uniqueRestricted.length > 0;
    const isEntirelyRestricted = hasRestrictions && uniquePermitted.length === 0;
    const isPartiallyRestricted = hasRestrictions && uniquePermitted.length > 0;

    return {
      hasRestrictions,
      isEntirelyRestricted,
      isPartiallyRestricted,
      restrictedPlaces: uniqueRestricted,
      permittedPlaces: uniquePermitted,
    };
  }

  const activeCircuitEligibility = getCircuitEligibility(activeCircuit);

  // Filtered circuits list for UI
  const allCircuitsList = plannerCircuits.length > 0 ? plannerCircuits : SIKKIM_CIRCUITS;
  const visibleCircuits = allCircuitsList.filter((circuit) => {
    if (nationality === "Foreign Tourist") {
      const elig = getCircuitEligibility(circuit);
      if (circuitAccessFilter === "permitted" && elig.hasRestrictions) return false;
      if (circuitAccessFilter === "restricted" && !elig.hasRestrictions) return false;
    }
    return true;
  });

  const permittedCircuitsCount = allCircuitsList.filter(
    (c) => !getCircuitEligibility(c).hasRestrictions
  ).length;
  const restrictedCircuitsCount = allCircuitsList.filter(
    (c) => getCircuitEligibility(c).hasRestrictions
  ).length;

  // Dynamic permit requirement detection
  const isPermitNeeded =
    selectionMode === "destinations"
      ? activeDestinations.some((d) => d.permitRequired)
      : (activeCircuit?.permitRequired ?? true);

  // Auto-adapt permit checkbox when destinations change
  useEffect(() => {
    if (isPermitNeeded) {
      setWantsPermitHelp(true);
    }
  }, [isPermitNeeded]);

  // Filtered destinations list for UI
  const visibleDestinations = plannerDestinations.filter((d) => {
    if (regionFilter !== "All Destinations" && d.region !== regionFilter) {
      return false;
    }
    if (nationality === "Foreign Tourist") {
      if (foreignAccessFilter === "permitted" && d.restrictedForForeigners) return false;
      if (foreignAccessFilter === "restricted" && !d.restrictedForForeigners) return false;
    }
    return true;
  });

  const restrictedSelectedDestinations = activeDestinations.filter(
    (d) => d.restrictedForForeigners
  );

  const hasForeignRestrictions =
    nationality === "Foreign Tourist" &&
    (selectionMode === "destinations"
      ? restrictedSelectedDestinations.length > 0
      : activeCircuitEligibility.hasRestrictions);

  const foreignRestrictedItems =
    selectionMode === "destinations"
      ? restrictedSelectedDestinations.map((d) => ({
          id: d.id,
          name: d.name,
          note: d.foreignAccessNote || "Restricted to Indian citizens only (Indo-China defense sector).",
        }))
      : activeCircuitEligibility.restrictedPlaces.map((name) => ({
          id: name,
          name: name,
          note: "Indo-China defense border zone restricted to Indian citizens only by MHA.",
        }));

  // Calculate dynamic duration string
  function getComputedDuration() {
    if (dateMode === "specific" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        return `${diffDays} Nights / ${diffDays + 1} Days`;
      }
    }
    if (dateMode === "flexible") {
      return `${flexibleDuration} (${flexibleMonth})`;
    }
    return "Custom duration";
  }

  // Selected places summary string
  function getSelectedPlacesString() {
    if (selectionMode === "destinations") {
      return activeDestinations.map((d) => d.name).join(", ");
    }
    if (nationality === "Foreign Tourist" && activeCircuitEligibility.hasRestrictions) {
      const perm = activeCircuitEligibility.permittedPlaces.length > 0
        ? `Foreign-Permitted Route: ${activeCircuitEligibility.permittedPlaces.join(", ")}`
        : "Military Defense Corridor";
      return `${activeCircuit.name} (${perm} · ${activeCircuitEligibility.restrictedPlaces.join(", ")} restricted to Indian citizens)`;
    }
    return `${activeCircuit.name} (${activeCircuit.places})`;
  }

  // Helper to resolve vehicle model/option
  function resolveVehicle(vehicleId) {
    // 1. Check in live car models from inventory
    const foundModel = carModels.find(
      (m) => (m.slug || m.id) === vehicleId || m.id === vehicleId || m.name === vehicleId
    );
    if (foundModel) {
      const isSuv = foundModel.category === "SUV";
      const isTraveller = foundModel.category === "Traveller";
      return {
        id: foundModel.slug || foundModel.id,
        title: foundModel.name,
        models: `${foundModel.category} Mountain Fleet`,
        capacity: isTraveller
          ? "Up to 12–14 Guests + Luggage"
          : foundModel.category === "MUV"
          ? "Up to 6–7 Guests + Luggage"
          : "Up to 6 Guests + Mountain Luggage",
        desc:
          foundModel.description ||
          `Rugged ${foundModel.category} specially equipped and maintained for Sikkim's high-altitude mountain roads and passes.`,
        badge: isSuv
          ? "★ High Altitude Ready"
          : isTraveller
          ? "Group Expedition"
          : "Comfort Highway MUV",
        terrain: isSuv
          ? "High Passes, North Sikkim & Snow Routes"
          : "Scenic Highways & Mountain Valleys",
        highAltitudeReady: isSuv,
        image: foundModel.image,
      };
    }

    // 2. Check in curated vehicle options
    const curated = VEHICLE_OPTIONS.find((v) => v.id === vehicleId);
    if (curated) return curated;

    // 3. Fallback
    if (carModels.length > 0) {
      return resolveVehicle(carModels[0].slug || carModels[0].id);
    }
    return VEHICLE_OPTIONS[0];
  }

  // Helper to resolve stay option or property
  function resolveStay(stayId) {
    // 1. Check if it's a specific active stay from admin stays store
    if (typeof stayId === "string" && stayId.startsWith("stay_")) {
      const realId = stayId.replace("stay_", "");
      const foundStay = activeStaysList.find((s) => s.id === realId || s.id === stayId);
      if (foundStay) {
        return {
          id: stayId,
          title: foundStay.name,
          badge: `${foundStay.type} · ${foundStay.location}`,
          desc:
            foundStay.description ||
            `Handpicked ${foundStay.type} in ${foundStay.location} offering warm Himalayan hospitality, clean heated rooms, and mountain views.`,
          amenities: foundStay.amenities || [],
          image: foundStay.image,
          location: foundStay.location,
          type: foundStay.type,
        };
      }
    }

    // 2. Check direct ID in active stays
    const directStay = activeStaysList.find((s) => s.id === stayId);
    if (directStay) {
      return {
        id: `stay_${directStay.id}`,
        title: directStay.name,
        badge: `${directStay.type} · ${directStay.location}`,
        desc:
          directStay.description ||
          `Handpicked ${directStay.type} in ${directStay.location} offering warm Himalayan hospitality, clean heated rooms, and mountain views.`,
        amenities: directStay.amenities || [],
        image: directStay.image,
        location: directStay.location,
        type: directStay.type,
      };
    }

    // 3. Search in curated stay options
    const curated = STAY_OPTIONS.find((s) => s.id === stayId);
    if (curated) return curated;

    return STAY_OPTIONS[0];
  }

  // Active resolved vehicle & stay
  const selectedVehicle = resolveVehicle(selectedVehicleId);
  const selectedStay = resolveStay(selectedStayId);

  // Dynamic dropdown options for vehicles
  const carDropdownOptions = [
    ...carModels.map((car) => {
      const isSuv = car.category === "SUV";
      return {
        value: car.slug || car.id,
        label: `${car.name} (${car.category} · ${isSuv ? "High Altitude 4x4 Ready" : "Mountain Fleet"})`,
      };
    }),
    {
      value: "bike-re",
      label: "Royal Enfield Mountain Bike (Himalayan / Scram · 1–2 Riders)",
    },
    {
      value: "recommend-vehicle",
      label: "Let Lama Bhai Recommend (Tailored for group & season)",
    },
  ];

  // Dynamic dropdown options for stays
  const stayDropdownOptions = [
    {
      value: "mixed",
      label: "Balanced Mix (North Sikkim Homestays + Town Hotels)",
    },
    {
      value: "homestay",
      label: "Authentic Village Homestays (Warm Bhutia & Lepcha Hosts)",
    },
    {
      value: "boutique",
      label: "Boutique Alpine Hotels & Resorts (Deluxe Mountain Comfort)",
    },
    {
      value: "recommend-stay",
      label: "Let Lama Bhai Curate (Personally Vetted & Clean Stays)",
    },
    ...(activeStaysList && activeStaysList.length > 0
      ? activeStaysList.map((stay) => ({
          value: `stay_${stay.id}`,
          label: `${stay.name} (${stay.type} · ${stay.location})`,
        }))
      : []),
  ];

  // Form Step Validation
  function validateCurrentStep() {
    const newErrors = {};

    if (step === 0) {
      if (selectionMode === "destinations" && selectedDestIds.length === 0) {
        newErrors.destinations = "Please select at least one destination to visit.";
      }
      if (dateMode === "specific") {
        if (!startDate) newErrors.startDate = "Please select your arrival date.";
        if (!endDate) newErrors.endDate = "Please select your departure date.";
        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
          newErrors.endDate = "Departure date must be after arrival date.";
        }
      }
      if (adults < 1) {
        newErrors.adults = "At least 1 adult traveler is required.";
      }
    }

    if (step === 2) {
      if (!fullName.trim()) {
        newErrors.fullName = "Please enter your full name.";
      }
      if (!phone.trim()) {
        newErrors.phone = "Please enter your WhatsApp or calling number.";
      } else {
        const cleanDigits = phone.replace(/[^0-9]/g, "");
        if (cleanDigits.length < 9) {
          newErrors.phone = "Please enter a valid 10-digit mobile or WhatsApp number.";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (validateCurrentStep()) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  // Submit to Lama Bhai Main Admin
  function handleSubmitPlan(e) {
    if (e) e.preventDefault();
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);

    const placesString = getSelectedPlacesString();
    const durationText = getComputedDuration();
    const dateText =
      dateMode === "specific" && startDate && endDate
        ? `${startDate} to ${endDate}`
        : `${flexibleMonth} (${flexibleDuration})`;

    const totalPax = adults + children;
    const activeVehicle = resolveVehicle(selectedVehicleId);
    const activeStay = resolveStay(selectedStayId);

    const requestPayload = {
      service: "Plan My Trip",
      name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      date: dateMode === "specific" ? startDate : flexibleMonth,
      travellers: totalPax,
      notes: specialRequests.trim() || "Custom mountain trip plan requested.",
      details: [
        { label: "Nationality", value: nationality },
        {
          label: selectionMode === "destinations" ? "Selected Destination(s)" : "Selected Circuit",
          value: placesString,
        },
        { label: "Travel Dates", value: dateText },
        { label: "Duration", value: durationText },
        {
          label: "Travellers",
          value: `${adults} Adult(s)${children > 0 ? `, ${children} Child(ren)` : ""}`,
        },
        {
          label: "Travel Style / Vibe",
          value: selectedVibes.length ? selectedVibes.join(", ") : "Scenic Sightseeing",
        },
        {
          label: "Vehicle Preference",
          value: `${activeVehicle.title} (${activeVehicle.models || activeVehicle.badge || "Mountain Fleet"})`,
        },
        {
          label: "Stay Preference",
          value: `${activeStay.title} — ${activeStay.badge}`,
        },
        {
          label: "Permit Assistance (PAP)",
          value: wantsPermitHelp
            ? `Requested (${nationality === "Foreign Tourist" ? "Foreign RAP/PAP clearance" : "Indian PAP clearance"} by Lama Bhai)`
            : "Self-arranged",
        },
        { label: "Pickup Location", value: pickupPoint },
      ],
      nationality,
    };

    try {
      const saved = saveBookingRequest(requestPayload);
      setSubmittedData({
        ...saved,
        placesString,
        durationText,
        dateText,
        totalPax,
        nationality,
        vehicleTitle: activeVehicle.title,
        stayTitle: activeStay.title,
      });
    } catch (err) {
      console.error("Error saving trip enquiry:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Pre-filled WhatsApp link for instant traveler chat
  const whatsappPreFillMsg = submittedData
    ? `Hi Lama Bhai Tourism, I just planned my custom Sikkim trip on your website!
*Reference ID:* ${submittedData.id || "New Enquiry"}
*Guest Name:* ${submittedData.name}
*Nationality:* ${submittedData.nationality || nationality}
*Places to Visit:* ${submittedData.placesString}
*Travel Dates:* ${submittedData.dateText} (${submittedData.durationText})
*Group Size:* ${adults} Adults${children > 0 ? `, ${children} Children` : ""}
*Vehicle:* ${submittedData.vehicleTitle}
*Stay Style:* ${submittedData.stayTitle}
*Permits Handled:* ${wantsPermitHelp ? `Yes, please (${submittedData.nationality || nationality} paperwork)` : "Self-arranged"}
*Pickup Hub:* ${pickupPoint}

Please review road clearances and send me the day-by-day plan with transparent quotation. Thank you!`
    : "";

  // --------------------------------------------------------------------------
  // SUCCESS / CONFIRMATION VIEW
  // --------------------------------------------------------------------------
  if (submittedData) {
    return (
      <main className="planner-page">
        <div className="planner-success-card">
          <div className="planner-success-header">
            <div className="planner-success-icon-badge">
              <CheckCircle size={36} weight="fill" color="var(--color-forest)" />
            </div>
            <p className="planner-hero__eyebrow">Trip Plan Submitted Successfully</p>
            <h1 className="planner-success-title">We Received Your Custom Sikkim Journey!</h1>
            <p className="planner-success-sub">
              Your itinerary details have been saved directly to <strong>Lama Bhai’s Main Administration</strong>.
              Lama Bhai or his senior local coordinator will review road clearances and send you a
              tailored day-by-day quotation.
            </p>
          </div>

          <div className="planner-receipt-box">
            <div className="receipt-row">
              <span className="receipt-label">Enquiry Reference ID</span>
              <span className="receipt-value receipt-value--mono">{submittedData.id}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Primary Traveler</span>
              <span className="receipt-value">{submittedData.name} ({submittedData.phone})</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Traveler Nationality</span>
              <span className="receipt-value" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                {submittedData.nationality === "Foreign Tourist" ? (
                  <>
                    <GlobeHemisphereWest size={16} weight="bold" color="var(--color-navy)" />
                    <span>Foreign / International</span>
                  </>
                ) : (
                  <>
                    <IndiaFlag width={20} height={14} />
                    <span>Indian Citizen</span>
                  </>
                )}
              </span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Places to Visit</span>
              <span className="receipt-value">{submittedData.placesString}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Travel Window</span>
              <span className="receipt-value">{submittedData.dateText} · {submittedData.durationText}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Group Composition</span>
              <span className="receipt-value">{adults} Adult(s){children > 0 ? `, ${children} Child(ren)` : ""}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Vehicle & Stay</span>
              <span className="receipt-value">{submittedData.vehicleTitle} · {submittedData.stayTitle}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Government Permits</span>
              <span className="receipt-value">
                {wantsPermitHelp
                  ? submittedData.nationality === "Foreign Tourist"
                    ? "Restricted Area Permit (RAP/PAP) Handled by Lama Bhai"
                    : "Protected Area Permits (PAP) Handled by Lama Bhai"
                  : "Self-arranged"}
              </span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Pickup Hub</span>
              <span className="receipt-value">{pickupPoint}</span>
            </div>
          </div>

          {/* Instant Handshake CTAs */}
          <div className="planner-success-actions">
            <a
              href={buildWhatsAppLink(contact, whatsappPreFillMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="planner-btn-primary planner-btn-whatsapp"
            >
              <ModernWhatsAppIcon size={20} />
              <span>Connect on WhatsApp for Instant Quotation</span>
            </a>

            <a href={buildPhoneLink(contact)} className="planner-btn-secondary">
              <ModernPhoneIcon size={18} />
              <span>Call Lama Bhai Directly ({contact.phone})</span>
            </a>
          </div>

          <div className="planner-success-guarantee">
            <div className="guarantee-item">
              <Clock size={20} weight="bold" color="var(--color-peach-deep)" />
              <div>
                <strong>Fast Local Response</strong>
                <p>Personalized itinerary & cost breakdown typically shared within 2 hours.</p>
              </div>
            </div>
            <div className="guarantee-item">
              <ShieldCheck size={20} weight="bold" color="var(--color-forest)" />
              <div>
                <strong>Zero Advance Deposit for Planning</strong>
                <p>We co-design and adjust your route for free before you pay any advance token.</p>
              </div>
            </div>
          </div>

          <div className="planner-success-footer">
            <button
              type="button"
              className="planner-link-btn"
              onClick={() => {
                setSubmittedData(null);
                setStep(0);
              }}
            >
              ← Plan another custom trip
            </button>
            <Link to="/" className="planner-link-btn">
              Return to Homepage
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------------------------------
  // MAIN WIZARD VIEW (CLEAN CENTERED SINGLE-COLUMN LAYOUT)
  // --------------------------------------------------------------------------
  return (
    <main className="planner-page">
      {/* 1. Hero Header */}
      <section className="planner-hero">
        <p className="planner-hero__eyebrow">Personalized Himalayan Journeys</p>
        <h1 className="planner-hero__heading">Plan Your Sikkim Trip</h1>
        <p className="planner-hero__sub">
          Whether you want to visit just one destination like Gurudongmar Lake, or explore an entire circuit,
          tell us what you have in mind. Lama Bhai co-designs your journey with safe 4x4 cabs, warm homestays,
          and pre-arranged government permits.
        </p>
      </section>

      {/* Seasonal Advisory Banner (Admin Controllable) */}
      {plannerSettings.showNoticeBanner && plannerSettings.noticeBanner && (
        <div className="planner-season-banner">
          <Sparkle size={20} weight="fill" color="var(--color-peach-deep)" />
          <span>{plannerSettings.noticeBanner}</span>
        </div>
      )}

      {/* 2. Top Progress Stepper */}
      <nav aria-label="Trip planning progress" className="planner-stepper">
        {STEPS.map((s, idx) => {
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <button
              type="button"
              key={s.id}
              className={`stepper-item ${isActive ? "stepper-item--active" : ""} ${isDone ? "stepper-item--done" : ""}`}
              onClick={() => {
                if (s.id < step) setStep(s.id);
              }}
              disabled={s.id > step}
              aria-current={isActive ? "step" : undefined}
            >
              <div className="stepper-circle">
                {isDone ? <Check size={16} weight="bold" /> : idx + 1}
              </div>
              <div className="stepper-meta">
                <span className="stepper-step-num">Step {idx + 1}</span>
                <span className="stepper-step-title">{s.title}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* 3. Main Form Container (Clean Centered Card) */}
      <div className="planner-centered-panel">
        {/* ==================================================================
            STEP 1: WHERE & WHEN (FLEXIBLE DESTINATIONS & DATES)
            ================================================================== */}
        {step === 0 && (
          <div className="step-content">
            <div className="step-content__header">
              <span className="step-badge">Step 1 of 3</span>
              <h2 className="step-title">Where & When Would You Like to Go?</h2>
              <p className="step-desc">
                Choose individual destinations (even just 1 place!) or pick a curated mountain circuit.
              </p>
            </div>

            {/* 1. Global Step 1 Nationality Selector (Sikkim Permit Eligibility) */}
            <div className="planner-nationality-row">
              <div className="planner-nationality-header">
                <span className="planner-nationality-label">
                  <GlobeHemisphereWest size={18} weight="bold" color="var(--color-peach-deep)" />
                  <span>Traveler Nationality (Sikkim Government Permit Rules)</span>
                </span>
                <span className="planner-nationality-sub">
                  {nationality === "Indian Tourist"
                    ? "Indian citizens have broad access to high passes & sacred lakes with standard PAP."
                    : "International passport holders have special MHA clearance & defense zone rules."}
                </span>
              </div>

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
                  <span>Foreign / International Tourist</span>
                </button>
              </div>
            </div>

            {/* Mode Selector Tabs: Pick Destinations vs Curated Circuit */}
            <div className="planner-mode-tabs" role="tablist" aria-label="Planning approach">
              <button
                type="button"
                role="tab"
                aria-selected={selectionMode === "destinations"}
                className={`mode-tab ${selectionMode === "destinations" ? "mode-tab--active" : ""}`}
                onClick={() => setSelectionMode("destinations")}
              >
                <MapPinLine size={18} weight="bold" />
                <span>Pick Specific Destination(s)</span>
                <span className="mode-tab__counter">{selectedDestIds.length}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={selectionMode === "circuits"}
                className={`mode-tab ${selectionMode === "circuits" ? "mode-tab--active" : ""}`}
                onClick={() => setSelectionMode("circuits")}
              >
                <MapTrifold size={18} weight="bold" />
                <span>Choose Curated Circuit</span>
              </button>
            </div>

            {/* A. INDIVIDUAL DESTINATIONS MODE WITH DROPDOWNS */}
            {selectionMode === "destinations" && (
              <div className="form-group">
                {/* International Access Filter & Advisory (when Foreign Tourist is selected) */}
                {nationality === "Foreign Tourist" && (
                  <div className="planner-nationality-row" style={{ marginBottom: "16px" }}>
                    {/* Filter by International Accessibility */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-navy)" }}>
                        Filter by Access:
                      </span>
                      <button
                        type="button"
                        className={`permit-filter-btn ${foreignAccessFilter === "all" ? "permit-filter-btn--active" : ""}`}
                        onClick={() => setForeignAccessFilter("all")}
                      >
                        All ({plannerDestinations.length})
                      </button>
                      <button
                        type="button"
                        className={`permit-filter-btn ${foreignAccessFilter === "permitted" ? "permit-filter-btn--active" : ""}`}
                        onClick={() => setForeignAccessFilter("permitted")}
                      >
                        ✅ Permitted for Foreign Nationals ({plannerDestinations.filter((d) => !d.restrictedForForeigners).length})
                      </button>
                      <button
                        type="button"
                        className={`permit-filter-btn ${foreignAccessFilter === "restricted" ? "permit-filter-btn--active" : ""}`}
                        onClick={() => setForeignAccessFilter("restricted")}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <IndiaFlag width={16} height={11} />
                        <span>Indian Only ({plannerDestinations.filter((d) => d.restrictedForForeigners).length})</span>
                      </button>
                    </div>

                    <div className="foreign-advisory-box">
                      <WarningCircle size={22} weight="fill" color="#b45309" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                        <div>
                          <strong>Notice for International Visitors:</strong> Gurudongmar Lake, Zero Point, and Nathula Pass border sensitive defense zones and are restricted to Indian citizens only by the Ministry of Home Affairs.
                          {" "}For international guests, Lama Bhai arranges official PAP permits for <strong>Yumthang Valley, Lachung, Lachen, Tsomgo Lake, and West Sikkim</strong> (minimum 2 travelers per group per MHA guidelines).
                        </div>

                        {restrictedSelectedDestinations.length > 0 && (
                          <div style={{ marginTop: "6px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="alert-action-btn alert-action-btn--primary"
                              onClick={() => {
                                setSelectedDestIds((prev) => {
                                  const clean = prev.filter((id) => {
                                    const found = plannerDestinations.find((d) => d.id === id);
                                    return !found?.restrictedForForeigners;
                                  });
                                  const fallback = ["yumthang-valley", "lachung"];
                                  const merged = [...new Set([...clean, ...fallback])];
                                  return merged.length > 0 ? merged : ["yumthang-valley"];
                                });
                              }}
                            >
                              Switch to Yumthang Valley &amp; Lachung (Permitted)
                            </button>
                            <button
                              type="button"
                              className="alert-action-btn alert-action-btn--secondary"
                              onClick={() => {
                                setSelectedDestIds((prev) => {
                                  const clean = prev.filter((id) => {
                                    const found = plannerDestinations.find((d) => d.id === id);
                                    return !found?.restrictedForForeigners;
                                  });
                                  return clean.length > 0 ? clean : ["yumthang-valley"];
                                });
                              }}
                            >
                              Remove Restricted Places
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Paired Premium Peach Dropdown Menus for Region & Destination */}
                <div className="planner-dropdowns-row">
                  {/* Dropdown 1: Region */}
                  <div className="planner-dropdown-col">
                    <Dropdown
                      label="Filter Region in Sikkim"
                      icon={<Compass size={18} weight="bold" color="var(--color-peach-deep)" />}
                      options={[
                        { value: "All Destinations", label: "All Sikkim (All 11 Destinations)" },
                        { value: "North Sikkim", label: "North Sikkim (High Lakes & Snow Valleys)" },
                        { value: "West Sikkim", label: "West Sikkim (Monasteries & Kanchenjunga)" },
                        { value: "East Sikkim", label: "East Sikkim (Old Silk Route & High Passes)" },
                        { value: "South Sikkim", label: "South Sikkim (Tea Gardens & Buddha Park)" },
                      ]}
                      value={regionFilter}
                      onChange={(val) => setRegionFilter(val)}
                      placeholder="Select Region"
                      hideEmptyOption
                      light
                    />
                  </div>

                  {/* Dropdown 2: Destination / Place */}
                  <div className="planner-dropdown-col">
                    <Dropdown
                      label="Select Destination / Place"
                      icon={<MapPinLine size={18} weight="bold" color="var(--color-peach-deep)" />}
                      options={visibleDestinations.map((d) => {
                        const isRestrictedForForeign = nationality === "Foreign Tourist" && d.restrictedForForeigners;
                        return {
                          value: d.id,
                          label: `${d.name} (${d.altitude}${isRestrictedForForeign ? " · Indian Citizens Only" : d.permitRequired ? " · PAP Required" : ""})`,
                        };
                      })}
                      value={
                        selectedDestIds.length === 1
                          ? selectedDestIds[0]
                          : ""
                      }
                      placeholder={
                        selectedDestIds.length === 0
                          ? "Choose destination to add..."
                          : "Choose another destination to add..."
                      }
                      onChange={(newDestId) => {
                        if (!newDestId) return;
                        if (!selectedDestIds.includes(newDestId)) {
                          setSelectedDestIds((prev) => [...prev, newDestId]);
                        }
                      }}
                      hideEmptyOption
                      light
                    />
                  </div>
                </div>

                {/* Quick Single-Destination vs Multi-Destination Helper */}
                {selectedDestIds.length > 0 && (
                  <div className="planner-quick-select-actions">
                    <span className="planner-quick-help-text">
                      {selectedDestIds.length === 1 ? (
                        <>
                          📍 <strong>Single Destination Planned:</strong> {activeDestinations[0]?.name || "Selected"}.{" "}
                          <span style={{ color: "var(--color-text-muted)" }}>
                            (Pick from the dropdown above if you wish to add more stops).
                          </span>
                        </>
                      ) : (
                        <>
                          📍 <strong>Multi-Destination Journey:</strong> {selectedDestIds.length} places selected.
                        </>
                      )}
                    </span>

                    {selectedDestIds.length > 1 && (
                      <button
                        type="button"
                        className="planner-btn-reset-single"
                        onClick={() => setSelectedDestIds([selectedDestIds[0]])}
                        title="Keep only the first destination"
                      >
                        Plan ONLY {activeDestinations[0]?.name}
                      </button>
                    )}
                  </div>
                )}

                {errors.destinations && <p className="field-error">{errors.destinations}</p>}

                {/* 2. Selected Places Tag Bar */}
                <div className="selected-places-bar">
                  <div className="selected-places-header">
                    <span className="selected-places-title">
                      Your Selected Destination{selectedDestIds.length > 1 ? "s" : ""} ({selectedDestIds.length}):
                    </span>
                    <span className="selected-places-hint">
                      {selectedDestIds.length === 0
                        ? "No places selected yet. Pick from the dropdown above."
                        : selectedDestIds.length === 1
                        ? "Planning 1 destination. You can add more from the dropdown or continue."
                        : "Click ✕ to remove any place from your journey."}
                    </span>
                  </div>

                  {selectedDestIds.length === 0 ? (
                    <div style={{ padding: "8px 0", color: "var(--color-text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
                      No destinations in your route yet. Choose a destination from the dropdown above to begin.
                    </div>
                  ) : (
                    <div className="selected-places-pills">
                      {activeDestinations.map((d) => (
                        <div key={d.id} className="selected-place-pill">
                          <span className="pill-dot" />
                          <span className="pill-name">
                            <strong>{d.name}</strong> ({d.altitude})
                          </span>
                          {d.permitRequired && (
                            <span className="pill-permit-tag">
                              <ShieldCheck size={12} weight="bold" /> PAP
                            </span>
                          )}
                          <button
                            type="button"
                            className="pill-remove-btn"
                            onClick={() => setSelectedDestIds((prev) => prev.filter((id) => id !== d.id))}
                            title={`Remove ${d.name}`}
                            aria-label={`Remove ${d.name}`}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Spotlight Cards for Selected Destinations */}
                <div className="selected-destinations-showcase">
                  {activeDestinations.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", background: "var(--color-cream)", borderRadius: "var(--radius-sm)", border: "1.5px dashed var(--color-border)", color: "var(--color-text-muted)", width: "100%" }}>
                      <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--color-navy)", fontSize: "1rem" }}>
                        No Destination Selected
                      </p>
                      <p style={{ margin: 0, fontSize: "0.88rem" }}>
                        Please select a destination from the dropdown above to view altitude details, base hubs, and local route tips.
                      </p>
                    </div>
                  ) : (
                    activeDestinations.map((dest) => (
                      <div
                        key={dest.id}
                        className="dest-spotlight-card"
                        style={
                          nationality === "Foreign Tourist" && dest.restrictedForForeigners
                            ? { borderColor: "#fca5a5", background: "#fffafa" }
                            : undefined
                        }
                      >
                        <div className="dest-spotlight-top">
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span className="dest-spotlight-region">{dest.region}</span>
                            <span className="dest-spotlight-altitude">
                              <Mountains size={14} /> {dest.altitude}
                            </span>
                          </div>

                          {nationality === "Foreign Tourist" ? (
                            dest.restrictedForForeigners ? (
                              <span className="dest-restricted-badge" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <IndiaFlag width={15} height={10} />
                                <span>Indian Citizens Only</span>
                              </span>
                            ) : (
                              <span className="dest-permitted-badge">
                                <Check size={12} weight="bold" /> Permitted (Min 2 Pax)
                              </span>
                            )
                          ) : (
                            dest.permitRequired && (
                              <span className="dest-spotlight-permit">
                                <ShieldCheck size={14} weight="bold" /> PAP Permit Handled
                              </span>
                            )
                          )}
                        </div>

                        <h3 className="dest-spotlight-title">{dest.name}</h3>

                        {nationality === "Foreign Tourist" && dest.restrictedForForeigners && (
                          <div className="dest-foreign-note">
                            ⚠️ {dest.foreignAccessNote || "Restricted to Indian citizens only (Border defense zone)."}
                          </div>
                        )}

                        <p className="dest-spotlight-highlight">{dest.highlight}</p>

                        <div className="dest-spotlight-footer">
                          <span className="dest-meta-tag">
                            <strong>Base Hub:</strong> {dest.baseHub}
                          </span>
                          <span className="dest-meta-tag">
                            <strong>Min Pace:</strong> {dest.minDays}
                          </span>
                          <button
                            type="button"
                            className="dest-remove-link"
                            onClick={() => setSelectedDestIds((prev) => prev.filter((id) => id !== dest.id))}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Dynamic Smart Mountain Route Intelligence Box */}
                {activeDestinations.length > 0 && (
                  <div className="smart-route-insight-box">
                    <div className="smart-insight-header">
                      <Lightbulb size={20} weight="fill" color="var(--color-peach-deep)" />
                      <div>
                        <strong>
                          {activeDestinations.length === 1
                            ? `Mountain Insight for ${activeDestinations[0].name}`
                            : `Dynamic Route Feasibility for ${activeDestinations.length} Destinations`}
                        </strong>
                        <p>
                          {activeDestinations.length === 1
                            ? activeDestinations[0].insiderTip
                            : `Selected: ${activeDestinations.map((d) => d.name).join(" · ")}`}
                        </p>
                      </div>
                    </div>

                    <div className="smart-insight-pills">
                      <span className="insight-pill">
                        <strong>Recommended Pace:</strong>{" "}
                        {activeDestinations.length === 1
                          ? activeDestinations[0].minDays
                          : `${Math.min(activeDestinations.length * 2, 7)}–${Math.min(activeDestinations.length * 2 + 1, 9)} Days`}
                      </span>

                      <span className="insight-pill">
                        <strong>Permit Status:</strong>{" "}
                        {isPermitNeeded ? "🛡️ PAP Required (Lama Bhai Handled)" : "No Protected Area Permit Required"}
                      </span>

                      {activeDestinations.length > 1 && (
                        <span className="insight-pill">
                          <strong>Key Mountain Bases:</strong>{" "}
                          {[...new Set(activeDestinations.map((d) => d.baseHub))].join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* B. CURATED CIRCUITS MODE */}
            {selectionMode === "circuits" && (
              <div className="form-group">
                {/* Circuit Access Filter (when Foreign Tourist is selected) */}
                {nationality === "Foreign Tourist" && (
                  <div className="planner-nationality-row" style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-navy)" }}>
                        Filter Circuits by Access:
                      </span>
                      <button
                        type="button"
                        className={`permit-filter-btn ${circuitAccessFilter === "all" ? "permit-filter-btn--active" : ""}`}
                        onClick={() => setCircuitAccessFilter("all")}
                      >
                        All Circuits ({allCircuitsList.length})
                      </button>
                      <button
                        type="button"
                        className={`permit-filter-btn ${circuitAccessFilter === "permitted" ? "permit-filter-btn--active" : ""}`}
                        onClick={() => setCircuitAccessFilter("permitted")}
                      >
                        ✅ 100% Permitted for Foreign Nationals ({permittedCircuitsCount})
                      </button>
                      <button
                        type="button"
                        className={`permit-filter-btn ${circuitAccessFilter === "restricted" ? "permit-filter-btn--active" : ""}`}
                        onClick={() => setCircuitAccessFilter("restricted")}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <IndiaFlag width={16} height={11} />
                        <span>Contains Defense Zones ({restrictedCircuitsCount})</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="circuit-cards-grid">
                  {visibleCircuits.map((circuit) => {
                    const isSelected = selectedCircuitId === circuit.id;
                    const elig = getCircuitEligibility(circuit);
                    const isForeign = nationality === "Foreign Tourist";

                    let cardModifierClass = "";
                    let badgeNode = <span className="circuit-card__badge">{circuit.badge}</span>;

                    if (isForeign) {
                      if (elig.isEntirelyRestricted) {
                        cardModifierClass = "circuit-card--restricted";
                        badgeNode = (
                          <span
                            className="circuit-card__badge circuit-card__badge--restricted"
                            style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                          >
                            <IndiaFlag width={14} height={10} />
                            <span>Indian Citizens Only</span>
                          </span>
                        );
                      } else if (elig.isPartiallyRestricted) {
                        cardModifierClass = "circuit-card--warning";
                        badgeNode = (
                          <span className="circuit-card__badge circuit-card__badge--warning">
                            ⚠️ Partial Foreign Access
                          </span>
                        );
                      } else {
                        badgeNode = (
                          <span className="circuit-card__badge circuit-card__badge--success">
                            ✅ 100% Foreign Open
                          </span>
                        );
                      }
                    }

                    return (
                      <button
                        type="button"
                        key={circuit.id}
                        className={`circuit-card ${cardModifierClass} ${isSelected ? "circuit-card--selected" : ""}`}
                        onClick={() => setSelectedCircuitId(circuit.id)}
                        aria-pressed={isSelected}
                      >
                        <div className="circuit-card__top">
                          {badgeNode}
                          <div className={`circuit-card__check ${isSelected ? "circuit-card__check--active" : ""}`}>
                            {isSelected && <Check size={14} weight="bold" />}
                          </div>
                        </div>

                        <h3 className="circuit-card__title">{circuit.name}</h3>
                        <p className="circuit-card__places">{circuit.places}</p>

                        {isForeign && elig.hasRestrictions && (
                          <div className="circuit-foreign-breakdown">
                            {elig.permittedPlaces.length > 0 && (
                              <div className="circuit-foreign-row">
                                <span className="circuit-foreign-tag circuit-foreign-tag--permitted">
                                  ✓ Foreign Permitted: {elig.permittedPlaces.join(", ")}
                                </span>
                              </div>
                            )}
                            <div className="circuit-foreign-row">
                              <span
                                className="circuit-foreign-tag circuit-foreign-tag--restricted"
                                style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                              >
                                <IndiaFlag width={13} height={9} />
                                <span>Indian Citizens Only: {elig.restrictedPlaces.join(", ")}</span>
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="circuit-card__footer">
                          <span className="circuit-meta-pill">
                            <Compass size={14} /> {circuit.duration}
                          </span>
                          <span className="circuit-meta-pill circuit-meta-pill--alt">
                            Altitude: {circuit.altitude}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Circuit Insight with Foreign Eligibility Awareness */}
                {nationality === "Foreign Tourist" && activeCircuitEligibility.hasRestrictions ? (
                  <div className="smart-route-insight-box smart-route-insight-box--warning">
                    <div className="smart-insight-header">
                      <WarningCircle size={26} weight="fill" color="#b45309" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                        <strong style={{ color: "#92400e", fontSize: "0.98rem" }}>
                          Clearance Notice for International Guests on {activeCircuit.name}
                        </strong>
                        <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: "1.5", color: "#92400e" }}>
                          This circuit contains high-altitude Indo-China defense sectors (<strong>{activeCircuitEligibility.restrictedPlaces.join(", ")}</strong>).
                          Under Ministry of Home Affairs (MHA) regulations, foreign passport holders cannot visit Gurudongmar Lake, Zero Point, or Nathula Pass.
                        </p>
                        <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: "1.5", color: "#92400e" }}>
                          {activeCircuitEligibility.isEntirelyRestricted ? (
                            <>
                              The Old Silk Route passes through frontline defense corridors and is <strong>restricted to Indian citizens only</strong>.
                              International travelers are advised to choose the <strong>West Sikkim Heritage Circuit</strong> or <strong>South Sikkim Scenic Circuit</strong>.
                            </>
                          ) : (
                            <>
                              <strong>How Lama Bhai adapts this circuit for you:</strong> You will enjoy full official PAP clearance to explore <strong>{activeCircuitEligibility.permittedPlaces.join(", ")}</strong>!
                              {" "}Instead of restricted border passes, our licensed local mountain drivers take you through permissible alpine wonders like Yumthang Flower Valley, Chopta Valley, and Katao (subject to local checkpost clearance).
                            </>
                          )}
                        </p>
                        <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="alert-action-btn alert-action-btn--primary"
                            onClick={() => setSelectedCircuitId("west-sikkim-circuit")}
                          >
                            Switch to 100% Permitted Circuit (West Sikkim)
                          </button>
                          <button
                            type="button"
                            className="alert-action-btn alert-action-btn--secondary"
                            onClick={() => setSelectedCircuitId("south-sikkim-circuit")}
                          >
                            Switch to South Sikkim Scenic Circuit
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="smart-insight-pills" style={{ marginTop: "12px" }}>
                      <span className="insight-pill">
                        <strong>Recommended Duration:</strong> {activeCircuit.duration}
                      </span>
                      <span className="insight-pill">
                        <strong>International Status:</strong>{" "}
                        {activeCircuitEligibility.isEntirelyRestricted
                          ? "Restricted Route (Indian Citizens Only)"
                          : "Partial Access (PAP Arranged for Permitted Sectors)"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="smart-route-insight-box">
                    <div className="smart-insight-header">
                      <Lightbulb size={20} weight="fill" color="var(--color-peach-deep)" />
                      <div>
                        <strong>Curated Route: {activeCircuit.name}</strong>
                        <p>{activeCircuit.highlight}</p>
                      </div>
                    </div>
                    <div className="smart-insight-pills">
                      <span className="insight-pill">
                        <strong>Recommended Duration:</strong> {activeCircuit.duration}
                      </span>
                      <span className="insight-pill">
                        <strong>Permit Status:</strong>{" "}
                        {activeCircuit.permitRequired
                          ? "🛡️ PAP Required (Lama Bhai Handled)"
                          : "Open Circuit"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Travel Vibe & Experiences */}
            <div className="form-group">
              <label className="field-label">
                <Sparkle size={18} weight="bold" color="var(--color-peach-deep)" />
                <span>Travel Style & Experiences</span>
              </label>
              <div className="chips-cloud">
                {TRAVEL_VIBES.map((vibe) => {
                  const isSelected = selectedVibes.includes(vibe);
                  return (
                    <button
                      type="button"
                      key={vibe}
                      className={`chip-pill ${isSelected ? "chip-pill--active" : ""}`}
                      onClick={() => toggleVibe(vibe)}
                      aria-pressed={isSelected}
                    >
                      {isSelected && <Check size={14} weight="bold" />}
                      <span>{vibe}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dates & Travel Window */}
            <div className="form-group form-group--dates">
              <div className="dates-header-row">
                <label className="field-label">
                  <CalendarBlank size={18} weight="bold" color="var(--color-peach-deep)" />
                  <span>When Are You Planning to Visit?</span>
                </label>

                <div className="date-mode-toggle" role="group" aria-label="Date selection type">
                  <button
                    type="button"
                    className={`mode-btn ${dateMode === "specific" ? "mode-btn--active" : ""}`}
                    onClick={() => setDateMode("specific")}
                  >
                    Exact Dates
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${dateMode === "flexible" ? "mode-btn--active" : ""}`}
                    onClick={() => setDateMode("flexible")}
                  >
                    Flexible Month
                  </button>
                </div>
              </div>

              {dateMode === "specific" ? (
                <div className="dates-input-row">
                  <div className="input-field-wrap">
                    <label htmlFor="startDate" className="input-sublabel">Arrival in Sikkim</label>
                    <input
                      id="startDate"
                      type="date"
                      min={todayStr}
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: null }));
                      }}
                      className={`input-date ${errors.startDate ? "input-date--error" : ""}`}
                    />
                    {errors.startDate && <p className="field-error">{errors.startDate}</p>}
                  </div>

                  <div className="input-field-wrap">
                    <label htmlFor="endDate" className="input-sublabel">Departure Date</label>
                    <input
                      id="endDate"
                      type="date"
                      min={startDate || todayStr}
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: null }));
                      }}
                      className={`input-date ${errors.endDate ? "input-date--error" : ""}`}
                    />
                    {errors.endDate && <p className="field-error">{errors.endDate}</p>}
                  </div>
                </div>
              ) : (
                <div className="flexible-dates-wrap">
                  <div className="input-field-wrap">
                    <label className="input-sublabel">Preferred Travel Month / Season</label>
                    <div className="chips-cloud">
                      {POPULAR_MONTHS.map((m) => (
                        <button
                          type="button"
                          key={m}
                          className={`chip-pill ${flexibleMonth === m ? "chip-pill--active" : ""}`}
                          onClick={() => setFlexibleMonth(m)}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="input-field-wrap" style={{ marginTop: "14px" }}>
                    <label className="input-sublabel">Trip Duration</label>
                    <div className="duration-grid">
                      {DURATION_PRESETS.map((d) => (
                        <button
                          type="button"
                          key={d.label}
                          className={`duration-card ${flexibleDuration === d.label ? "duration-card--active" : ""}`}
                          onClick={() => setFlexibleDuration(d.label)}
                        >
                          <span className="duration-card__days">{d.label}</span>
                          <span className="duration-card__desc">{d.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Travelers Stepper */}
            <div className="form-group">
              <label className="field-label">
                <Users size={18} weight="bold" color="var(--color-peach-deep)" />
                <span>Number of Travelers</span>
              </label>
              {errors.adults && <p className="field-error">{errors.adults}</p>}

              <div className="guests-steppers-row">
                <div className="guest-counter-card">
                  <div className="counter-meta">
                    <span className="counter-title">Adults</span>
                    <span className="counter-desc">Ages 12+ years</span>
                  </div>
                  <div className="stepper-controls">
                    <button
                      type="button"
                      className="counter-btn"
                      onClick={() => setAdults((a) => Math.max(1, a - 1))}
                      disabled={adults <= 1}
                      aria-label="Decrease adult travelers"
                    >
                      −
                    </button>
                    <span className="counter-value">{adults}</span>
                    <button
                      type="button"
                      className="counter-btn"
                      onClick={() => setAdults((a) => a + 1)}
                      aria-label="Increase adult travelers"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="guest-counter-card">
                  <div className="counter-meta">
                    <span className="counter-title">Children</span>
                    <span className="counter-desc">Under 12 years</span>
                  </div>
                  <div className="stepper-controls">
                    <button
                      type="button"
                      className="counter-btn"
                      onClick={() => setChildren((c) => Math.max(0, c - 1))}
                      disabled={children <= 0}
                      aria-label="Decrease child travelers"
                    >
                      −
                    </button>
                    <span className="counter-value">{children}</span>
                    <button
                      type="button"
                      className="counter-btn"
                      onClick={() => setChildren((c) => c + 1)}
                      aria-label="Increase child travelers"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            STEP 2: RIDE, STAY & PERMITS
            ================================================================== */}
        {step === 1 && (
          <div className="step-content">
            <div className="step-content__header">
              <span className="step-badge">Step 2 of 3</span>
              <h2 className="step-title">Choose Your Mountain Ride & Stay Comfort</h2>
              <p className="step-desc">
                Sikkim’s high-altitude roads demand dependable vehicles and heated mountain stays.
                Select what suits your traveling style best.
              </p>
            </div>

            {/* Vehicle Options Dropdown */}
            <div className="form-group">
              <Dropdown
                label="Vehicle Preference for Mountain Roads"
                icon={<Car size={18} weight="bold" color="var(--color-peach-deep)" />}
                options={carDropdownOptions}
                value={selectedVehicleId}
                onChange={(val) => setSelectedVehicleId(val)}
                placeholder="Choose your mountain vehicle..."
                hideEmptyOption
                light
              />

              {/* Selected Vehicle Spotlight Preview */}
              {selectedVehicle && (
                <div
                  className="preference-card preference-card--active"
                  style={{ marginTop: "12px", cursor: "default" }}
                >
                  <div className="pref-card-header">
                    <div className="pref-title-wrap">
                      <h3 className="pref-title">{selectedVehicle.title}</h3>
                      <span className="pref-models">{selectedVehicle.models}</span>
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {isPermitNeeded && selectedVehicle.highAltitudeReady && (
                        <span className="pref-badge pref-badge--highlight">
                          ★ Recommended for your route
                        </span>
                      )}
                      <span className="pref-badge">{selectedVehicle.badge}</span>
                    </div>
                  </div>
                  <p className="pref-desc">{selectedVehicle.desc}</p>
                  <div className="pref-footer">
                    <span className="pref-meta-tag">Capacity: {selectedVehicle.capacity}</span>
                    <span className="pref-meta-tag">{selectedVehicle.terrain}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Stay Options Dropdown */}
            <div className="form-group">
              <Dropdown
                label="Accommodation Style & Stay Preferences"
                icon={<Bed size={18} weight="bold" color="var(--color-peach-deep)" />}
                options={stayDropdownOptions}
                value={selectedStayId}
                onChange={(val) => setSelectedStayId(val)}
                placeholder="Choose your accommodation style..."
                hideEmptyOption
                light
              />

              {/* Selected Stay Spotlight Preview */}
              {selectedStay && (
                <div
                  className="preference-card preference-card--active"
                  style={{ marginTop: "12px", cursor: "default" }}
                >
                  <div className="pref-card-header">
                    <div className="pref-title-wrap">
                      <h3 className="pref-title">{selectedStay.title}</h3>
                      {selectedStay.location && (
                        <span className="pref-models">
                          {selectedStay.type} · {selectedStay.location}
                        </span>
                      )}
                    </div>
                    <span className="pref-badge">{selectedStay.badge}</span>
                  </div>
                  <p className="pref-desc">{selectedStay.desc}</p>
                  {selectedStay.amenities && selectedStay.amenities.length > 0 && (
                    <div className="pref-footer" style={{ marginTop: "8px" }}>
                      <span className="pref-meta-tag">
                        Amenities: {selectedStay.amenities.slice(0, 4).join(" · ")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ================================================================
                STEP 2 PERMIT SECTION: NATIONALITY FILTER & CLEARANCE CHECKLIST
                ================================================================ */}
            <div className="form-group form-group--permits">
              <div className="permit-section-header">
                <div className="permit-section-title-wrap">
                  <ShieldCheck size={28} weight="fill" color="var(--color-forest)" />
                  <div>
                    <h3 className="permit-section-title">Government Permits &amp; Border Checkpost Clearance</h3>
                    <p className="permit-section-subtitle">
                      Protected and restricted circuits across Sikkim require official permits. Rules strictly differ based on traveler nationality.
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. Nationality Filter Selector within Step 2 Permit Section */}
              <div className="permit-nationality-selector-card">
                <div className="permit-nat-header">
                  <span className="permit-nat-title">
                    <GlobeHemisphereWest size={18} weight="bold" color="var(--color-peach-deep)" />
                    <span>Traveler Nationality (Sikkim Permit Category):</span>
                  </span>
                  <span className="permit-nat-indicator">
                    Active Rule: <strong>{nationality}</strong>
                  </span>
                </div>

                <div className="permit-pills-group">
                  <button
                    type="button"
                    className={`permit-pill-btn ${nationality === "Indian Tourist" ? "permit-pill-btn--active" : ""}`}
                    onClick={() => setNationality("Indian Tourist")}
                  >
                    <IndiaFlag width={22} height={15} />
                    <span>Indian Citizen / Domestic</span>
                  </button>

                  <button
                    type="button"
                    className={`permit-pill-btn ${nationality === "Foreign Tourist" ? "permit-pill-btn--active" : ""}`}
                    onClick={() => setNationality("Foreign Tourist")}
                  >
                    <GlobeHemisphereWest size={18} weight="bold" />
                    <span>Foreign / International Tourist</span>
                  </button>
                </div>
              </div>

              {/* 2. Route Feasibility & Restriction Audit for Selected Nationality */}
              {hasForeignRestrictions ? (
                <div className="permit-route-alert permit-route-alert--warning">
                  <WarningCircle size={26} weight="fill" color="#b45309" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div className="permit-route-alert-body">
                    <strong>Notice: Your Route Contains Indo-China Border Defense Sectors</strong>
                    <p>
                      The following sector(s) in your trip plan {selectionMode === "circuits" ? `(curated circuit "${activeCircuit.name}")` : "(selected destinations)"} are legally restricted to Indian citizens only by the Ministry of Home Affairs:
                    </p>
                    <ul className="permit-restricted-list">
                      {foreignRestrictedItems.map((item) => (
                        <li key={item.id}>
                          <strong>{item.name}:</strong> {item.note}
                        </li>
                      ))}
                    </ul>
                    <p className="permit-recommendation">
                      Lama Bhai will automatically adjust your itinerary to visit permitted alpine highlights like <strong>Yumthang Valley, Lachung, Lachen, Chopta Valley, and West Sikkim</strong>.
                    </p>
                    <div style={{ marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {selectionMode === "destinations" ? (
                        <>
                          <button
                            type="button"
                            className="alert-action-btn alert-action-btn--primary"
                            onClick={() => {
                              setSelectedDestIds((prev) => {
                                const clean = prev.filter((id) => {
                                  const found = plannerDestinations.find((d) => d.id === id);
                                  return !found?.restrictedForForeigners;
                                });
                                const fallback = ["yumthang-valley", "lachung"];
                                const merged = [...new Set([...clean, ...fallback])];
                                return merged.length > 0 ? merged : ["yumthang-valley"];
                              });
                            }}
                          >
                            Switch Route to Yumthang Valley &amp; Lachung (Permitted)
                          </button>
                          <button
                            type="button"
                            className="alert-action-btn alert-action-btn--secondary"
                            onClick={() => {
                              setSelectedDestIds((prev) => {
                                const clean = prev.filter((id) => {
                                  const found = plannerDestinations.find((d) => d.id === id);
                                  return !found?.restrictedForForeigners;
                                });
                                return clean.length > 0 ? clean : ["yumthang-valley"];
                              });
                            }}
                          >
                            Remove Restricted Places
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="alert-action-btn alert-action-btn--primary"
                            onClick={() => setSelectedCircuitId("west-sikkim-circuit")}
                          >
                            Switch to 100% Permitted Circuit (West Sikkim)
                          </button>
                          <button
                            type="button"
                            className="alert-action-btn alert-action-btn--secondary"
                            onClick={() => setSelectedCircuitId("south-sikkim-circuit")}
                          >
                            Switch to South Sikkim Scenic Circuit
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="permit-route-alert permit-route-alert--ok">
                  <CheckCircle size={24} weight="fill" color="var(--color-forest)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div className="permit-route-alert-body">
                    <strong>
                      {nationality === "Foreign Tourist"
                        ? "✅ All Selected Destinations are Permitted for International Travelers!"
                        : "✅ All Selected Destinations are Fully Accessible for Indian Citizens!"}
                    </strong>
                    <p>
                      {nationality === "Foreign Tourist"
                        ? `Your route (${getSelectedPlacesString()}) qualifies for Protected Area Permits (PAP) arranged by Lama Bhai Tourism.`
                        : `Your itinerary (${getSelectedPlacesString()}) will be cleared smoothly at Sikkim Police checkposts with our registered commercial passes.`}
                    </p>
                  </div>
                </div>
              )}

              {/* 3. Detailed Document Checklist Cards for Selected Nationality */}
              <div className="permit-checklist-card">
                <span className="permit-checklist-label">
                  {nationality === "Indian Tourist"
                    ? "🪪 Required Documents for Indian Citizens (Sikkim Police & Tourism Dept)"
                    : "🛂 Required Documents for International Tourists (MHA & Sikkim Tourism)"}
                </span>

                <div className="permit-checklist-grid">
                  {nationality === "Indian Tourist" ? (
                    <>
                      <div className="permit-check-item">
                        <Check size={18} weight="bold" color="var(--color-forest)" />
                        <div>
                          <strong>Original Govt Photo ID + 2 Photocopies</strong>
                          <p>Voter ID card or Indian Passport strongly preferred at checkposts; Aadhaar card accepted.</p>
                        </div>
                      </div>

                      <div className="permit-check-item">
                        <Check size={18} weight="bold" color="var(--color-forest)" />
                        <div>
                          <strong>2 Physical Passport Photographs</strong>
                          <p>Original print photos required per traveler for counter police stamping.</p>
                        </div>
                      </div>

                      <div className="permit-check-item">
                        <Check size={18} weight="bold" color="var(--color-forest)" />
                        <div>
                          <strong>Commercial Tourist Vehicle Pass</strong>
                          <p>Private personal cars are not permitted into North Sikkim. Lama Bhai provides authorized commercial 4x4 vehicles.</p>
                        </div>
                      </div>

                      <div className="permit-check-item">
                        <Check size={18} weight="bold" color="var(--color-forest)" />
                        <div>
                          <strong>Solo Travel Permitted</strong>
                          <p>Solo Indian travelers can visit North Sikkim by hiring a dedicated commercial vehicle.</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="permit-check-item">
                        <Check size={18} weight="bold" color="var(--color-forest)" />
                        <div>
                          <strong>Original Passport with Valid Indian Visa / OCI</strong>
                          <p>Passport must be valid for at least 6 months. Must present original passport at checkpoints.</p>
                        </div>
                      </div>

                      <div className="permit-check-item">
                        <Check size={18} weight="bold" color="var(--color-forest)" />
                        <div>
                          <strong>Mandatory Minimum 2 Travelers (Group Rule)</strong>
                          <p>Under Ministry of Home Affairs rules, solo foreign travelers cannot be issued North Sikkim PAP permits alone. Minimum 2 foreigners must travel together.</p>
                        </div>
                      </div>

                      <div className="permit-check-item">
                        <Check size={18} weight="bold" color="var(--color-forest)" />
                        <div>
                          <strong>4 Physical Passport Photographs</strong>
                          <p>Required per traveler for Gangtok and Mangan tourism and police verification.</p>
                        </div>
                      </div>

                      <div className="permit-check-item">
                        <Check size={18} weight="bold" color="var(--color-forest)" />
                        <div>
                          <strong>Registered Agency Clearance (Lama Bhai)</strong>
                          <p>Foreign PAP permits must be officially sponsored and filed by a certified local tour operator like Lama Bhai Tourism.</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 4. Full-Service Permit Handling Checkbox */}
              <div
                className={`permit-assurance-card ${wantsPermitHelp ? "permit-assurance-card--checked" : ""}`}
                onClick={() => setWantsPermitHelp(!wantsPermitHelp)}
                role="checkbox"
                aria-checked={wantsPermitHelp}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setWantsPermitHelp(!wantsPermitHelp);
                  }
                }}
              >
                <div className="permit-assurance-check">
                  <input
                    type="checkbox"
                    checked={wantsPermitHelp}
                    onChange={(e) => setWantsPermitHelp(e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    id="permitCheckbox"
                  />
                </div>
                <div className="permit-assurance-text">
                  <div className="permit-assurance-heading">
                    <ShieldCheck size={22} weight="fill" color="var(--color-forest)" />
                    <strong>Have Lama Bhai Tourism Handle All Government Permits &amp; Checkpost Stamps</strong>
                  </div>
                  <p>
                    {nationality === "Foreign Tourist"
                      ? "Our local team in Gangtok and Mangan prepares your international passport dossier, secures Protected Area Permits (PAP), and coordinates checkpost clearance at Toong and Chungthang gates."
                      : "Our team in Gangtok & Mangan handles all photo attestations, vehicle permits, and police checkpost stamps so you never wait in government administrative queues."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            STEP 3: CONTACT & SUBMISSION
            ================================================================== */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-content__header">
              <span className="step-badge">Step 3 of 3</span>
              <h2 className="step-title">Review & Request Your Custom Itinerary</h2>
              <p className="step-desc">
                Review your selections below. Lama Bhai will check road conditions, acclimatization pacing,
                and send you a transparent day-by-day plan directly on WhatsApp.
              </p>
            </div>

            {/* Clean Inline Trip Summary Card */}
            <div className="inline-trip-summary-card">
              <div className="inline-summary-header">
                <Sparkle size={18} weight="fill" color="var(--color-peach-deep)" />
                <strong>Your Selected Trip Specifications</strong>
              </div>
              <div className="inline-summary-grid">
                <div className="inline-summary-item">
                  <span className="summary-item-label">Destinations / Places</span>
                  <span className="summary-item-value">{getSelectedPlacesString()}</span>
                </div>
                <div className="inline-summary-item">
                  <span className="summary-item-label">Travel Window</span>
                  <span className="summary-item-value">
                    {dateMode === "specific" && startDate ? `${startDate} → ${endDate}` : `${flexibleMonth} (${flexibleDuration})`}
                    {" · "}
                    <strong style={{ color: "var(--color-peach-deep)" }}>{getComputedDuration()}</strong>
                  </span>
                </div>
                <div className="inline-summary-item">
                  <span className="summary-item-label">Travelers</span>
                  <span className="summary-item-value">{adults} Adult(s){children > 0 ? `, ${children} Child(ren)` : ""}</span>
                </div>
                <div className="inline-summary-item">
                  <span className="summary-item-label">Vehicle & Stay</span>
                  <span className="summary-item-value">
                    {selectedVehicle?.title} · {selectedStay?.title}
                  </span>
                </div>
                <div className="inline-summary-item">
                  <span className="summary-item-label">Traveler Nationality</span>
                  <span className="summary-item-value" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    {nationality === "Foreign Tourist" ? (
                      <>
                        <GlobeHemisphereWest size={16} weight="bold" color="var(--color-navy)" />
                        <span>Foreign / International</span>
                      </>
                    ) : (
                      <>
                        <IndiaFlag width={20} height={14} />
                        <span>Indian Citizen</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="inline-summary-item">
                  <span className="summary-item-label">Permits</span>
                  <span className="summary-item-value">
                    {wantsPermitHelp
                      ? nationality === "Foreign Tourist"
                        ? "🛡️ Foreign RAP/PAP Handled by Lama Bhai"
                        : "🛡️ Domestic PAP Handled by Lama Bhai"
                      : "Self-arranged"}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-card">
              <div className="form-row-2">
                <div className="input-field-wrap">
                  <label htmlFor="fullName" className="input-sublabel">
                    Your Full Name <span className="req-asterisk">*</span>
                  </label>
                  <div className="input-with-icon">
                    <User size={18} className="field-icon" />
                    <input
                      id="fullName"
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
                      }}
                      className={`input-text ${errors.fullName ? "input-text--error" : ""}`}
                    />
                  </div>
                  {errors.fullName && <p className="field-error">{errors.fullName}</p>}
                </div>

                <div className="input-field-wrap">
                  <label htmlFor="phone" className="input-sublabel">
                    WhatsApp / Phone Number <span className="req-asterisk">*</span>
                  </label>
                  <div className="input-with-icon">
                    <PhoneCall size={18} className="field-icon" />
                    <input
                      id="phone"
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                      }}
                      className={`input-text ${errors.phone ? "input-text--error" : ""}`}
                    />
                  </div>
                  {errors.phone && <p className="field-error">{errors.phone}</p>}
                </div>
              </div>

              <div className="form-row-2">
                <div className="input-field-wrap">
                  <label htmlFor="email" className="input-sublabel">
                    Email Address <span className="optional-tag">(Optional)</span>
                  </label>
                  <div className="input-with-icon">
                    <Envelope size={18} className="field-icon" />
                    <input
                      id="email"
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-text"
                    />
                  </div>
                </div>

                <div className="input-field-wrap">
                  <label htmlFor="pickupPoint" className="input-sublabel">
                    Preferred Pickup Hub
                  </label>
                  <div className="input-with-icon">
                    <AirplaneTakeoff size={18} className="field-icon" />
                    <select
                      id="pickupPoint"
                      value={pickupPoint}
                      onChange={(e) => setPickupPoint(e.target.value)}
                      className="input-select"
                    >
                      {PICKUP_POINTS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="input-field-wrap">
                <label htmlFor="specialRequests" className="input-sublabel">
                  Special Requests or Mountain Notes <span className="optional-tag">(Optional)</span>
                </label>
                <textarea
                  id="specialRequests"
                  rows="3"
                  placeholder="e.g. Traveling with senior parents (need gradual acclimatization), pure vegetarian food preference, or special anniversary stops."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="input-textarea"
                />
              </div>

              {/* Privacy and Direct Handshake Assurance */}
              <div className="privacy-reassurance">
                <Info size={18} weight="fill" color="var(--color-navy)" />
                <span>
                  <strong>Direct Admin Guarantee:</strong> Your information is stored directly in Lama Bhai’s
                  Main Administration panel. We never spam or distribute your data.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            BOTTOM NAVIGATION BAR (SINGLE UNAMBIGUOUS BUTTON SET)
            ================================================================== */}
        <div className="planner-step-navigation">
          {step > 0 ? (
            <button
              type="button"
              className="planner-nav-back-btn"
              onClick={handleBack}
            >
              <ArrowLeft size={18} weight="bold" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="planner-nav-next-btn"
              onClick={handleNext}
            >
              <span>Continue to {STEPS[step + 1].title}</span>
              <ArrowRight size={18} weight="bold" />
            </button>
          ) : (
            <button
              type="button"
              className="planner-nav-submit-btn"
              onClick={handleSubmitPlan}
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? "Submitting to Lama Bhai..." : "Submit Plan & Request Free Quote"}</span>
              <ArrowRight size={18} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}