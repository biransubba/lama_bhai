export const carModelFields = [
  { name: "name", label: "Model name", type: "text", required: true },
  { name: "category", label: "Category", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "image", label: "Image URL (optional)", type: "text" },
];

export const carUnitFields = [
  { name: "vehicleNumber", label: "Vehicle number", type: "text" },
  { name: "seatingCapacity", label: "Seating capacity", type: "number" },
  { name: "availability", label: "Availability", type: "select", options: ["available", "unavailable"] },
  { name: "description", label: "Description", type: "textarea" },
  { name: "image", label: "Image URL (optional)", type: "text" },
];

export const bikeModelFields = [
  { name: "name", label: "Model name", type: "text", required: true },
  { name: "category", label: "Category", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "image", label: "Image URL (optional)", type: "text" },
];

export const bikeUnitFields = [
  { name: "identifier", label: "Identifier", type: "text" },
  { name: "engineCC", label: "Engine (cc)", type: "number" },
  { name: "transmission", label: "Transmission", type: "text" },
  { name: "availability", label: "Availability", type: "select", options: ["available", "unavailable"] },
  { name: "description", label: "Description", type: "textarea" },
  { name: "image", label: "Image URL (optional)", type: "text" },
];

export const stayFields = [
  { name: "name", label: "Property name", type: "text", required: true },
  { name: "type", label: "Property type", type: "select", options: ["Homestay", "Hotel", "Guest House", "Resort"], required: true },
  {
    name: "location",
    label: "Location",
    type: "select",
    options: ["Mangan", "Lachen", "Lachung", "Dzongu", "Thangu"],
    allowCustom: true,
    customPlaceholder: "Enter new Sikkim location name...",
    required: true,
  },
  { name: "partnerId", label: "Partner ID (Optional)", type: "text", placeholder: "e.g., partner_001" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "amenities", label: "Amenities (comma-separated)", type: "text" },
  { name: "offers", label: "Offers (comma-separated)", type: "text" },
  { name: "availability", label: "Availability", type: "select", options: ["available", "unavailable"], required: true },
  {
    name: "image",
    label: "Cover Photo",
    type: "image",
    help: "Main photo shown on homestay cards and starts the gallery slideshow",
  },
  {
    name: "gallery",
    label: "Gallery Photos",
    type: "gallery",
    help: "Upload multiple photos (rooms, views, dining) for the dynamic auto-sliding slideshow",
  },
];

export const destinationFields = [
  { name: "name", label: "Destination name", type: "text", required: true },
  { name: "tag", label: "Tag / Category", type: "text", placeholder: "e.g. Mountain village, Valley, Sacred lake" },
  { name: "shortDescription", label: "Short description", type: "textarea", required: true },
  { name: "altitude", label: "Altitude / Elevation", type: "text", placeholder: "e.g. 8,838 ft (2,750 m)" },
  { name: "distanceFromGangtok", label: "Distance from Gangtok", type: "text", placeholder: "e.g. 120 km (~6 Hours drive)" },
  { name: "bestTime", label: "Best Time to Visit", type: "text", placeholder: "e.g. March – June & Oct – Dec" },
  { name: "temperature", label: "Climate & Temperature", type: "text", placeholder: "e.g. Summer: 8°C–16°C | Winter: -5°C" },
  { name: "idealDuration", label: "Ideal Stay Duration", type: "text", placeholder: "e.g. 1 Night / 2 Days" },
  { name: "foreignerAccess", label: "Foreigner Access Status", type: "select", options: ["permitted", "restricted", "conditional"] },
  { name: "recommendedVehicle", label: "Recommended Vehicle", type: "text", placeholder: "e.g. 4x4 Mountain SUV (Scorpio / Bolero)" },
  { name: "description", label: "Full description", type: "textarea" },
  { name: "routeGuide", label: "Road & Route Guide", type: "textarea" },
  { name: "highlights", label: "Highlights (comma-separated)", type: "text" },
  { name: "whyVisit", label: "Why visit points (comma-separated)", type: "text" },
  { name: "travelInfo", label: "Travel Information", type: "textarea" },
  { name: "permitNote", label: "Permit note", type: "text" },
  {
    name: "image",
    label: "Cover Photo",
    type: "image",
    help: "Main cover photo shown on destination cards and hero slideshow",
  },
  {
    name: "gallery",
    label: "Gallery Photos",
    type: "gallery",
    help: "Upload multiple high-resolution photos for the destination slideshow",
  },
];

export const journeyFields = [
  { name: "name", label: "Journey name", type: "text", required: true },
  { name: "shortDescription", label: "Short description", type: "textarea", required: true },
  { name: "description", label: "Full description", type: "textarea" },
  { name: "destinations", label: "Destinations (comma-separated)", type: "text" },
  { name: "suggestedSequence", label: "Suggested itinerary sequence (comma-separated)", type: "text" },
  { name: "highlights", label: "Highlights (comma-separated)", type: "text" },
  { name: "permitNote", label: "Permit note", type: "text" },
  { name: "travelInfo", label: "Travel information", type: "textarea" },
];

// appliesToTarget is filled in dynamically at runtime (see AdminOffers.jsx)
// with the actual vehicle/property/journey names that exist, based on
// which service is chosen — it is never hardcoded here.
export const offerFields = [
  { name: "title", label: "Offer title", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "appliesToService", label: "Applicable service", type: "select", options: ["Car", "Bike", "Stay", "Journey"], required: true },
  { name: "appliesToTarget", label: "Applicable vehicle / property / journey", type: "select", options: [] },
  { name: "startDate", label: "Start date", type: "date" },
  { name: "endDate", label: "End date", type: "date" },
  { name: "terms", label: "Terms", type: "textarea" },
  { name: "active", label: "Active", type: "select", options: ["true", "false"], required: true },
];

export const partnerFields = [
  { name: "name", label: "Partner / Host Full Name", type: "text", required: true },
  { name: "agency", label: "Homestay / Agency / Business Name", type: "text", required: true },
  {
    name: "location",
    label: "Base Location",
    type: "select",
    options: ["Lachen", "Lachung", "Dzongu", "Mangan", "Gangtok", "Thangu", "Ravangla", "Pelling"],
    required: true,
  },
  {
    name: "status",
    label: "Partnership Status",
    type: "select",
    options: ["Pending", "Approved", "Rejected", "Suspended", "Inactive"],
    required: true,
  },
  { name: "phone", label: "Contact Phone Number", type: "text", required: true },
  { name: "email", label: "Contact Email Address", type: "text", required: true },
  {
    name: "propertyDetails",
    label: "Homestay / Property Details (Submitted by Applicant)",
    type: "textarea",
    placeholder: "e.g. 4 traditional wooden guest rooms, home-cooked food, mountain facing...",
  },
  {
    name: "notes",
    label: "Partnership & Review Notes",
    type: "textarea",
    placeholder: "Internal review notes, approval details, contact history...",
  },
];