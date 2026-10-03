/**
 * permitSettingsStore.js
 * 
 * Central data store & management for Sikkim Government Permit Document Requirements.
 * Allows the Admin to dynamically add, edit, toggle, or delete document and information
 * requirements.
 * Any change made here dynamically updates the public website Permit Application Form
 * and Admin Booking Dossiers without needing code modifications.
 */

const STORAGE_KEY = "lamabhai_permit_doc_requirements_v1";

export const PERMIT_FIELD_TYPES = [
  { value: "file", label: "Document / Photo Upload (File)", icon: "UploadSimple" },
  { value: "text", label: "Text Field / Document ID Number", icon: "TextAa" },
  { value: "select", label: "Dropdown Select (Choices)", icon: "ListBullets" },
  { value: "checkbox", label: "Compliance Checkbox / Declaration", icon: "CheckSquare" },
  { value: "date", label: "Date Picker", icon: "CalendarBlank" },
];

export const TARGET_TRAVELERS = [
  { value: "Both", label: "Both (All Tourists)" },
  { value: "Indian Tourist", label: "Indian Citizens Only" },
  { value: "Foreign Tourist", label: "Foreign Nationals Only" },
];

export const PERMIT_DESTINATION_SCOPES = [
  "All Protected & Restricted Areas",
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

// Initial default system requirements & sample custom fields
const DEFAULT_PERMIT_REQUIREMENTS = [
  // --- Indian Tourists Core System Docs ---
  {
    id: "req_in_photo",
    key: "lead_photo",
    label: "Passport-size Photograph",
    description: "Recent color passport-size photograph with white/light background.",
    type: "file",
    targetNationality: "Indian Tourist",
    applicableDestination: "All Protected & Restricted Areas",
    required: true,
    active: true,
    isSystemDefault: true,
    allowedFormats: "JPG, JPEG, PNG",
    order: 1,
  },
  {
    id: "req_in_id_proof",
    key: "lead_id_proof",
    label: "Government Photo ID Proof (Copy)",
    description: "Clear photo or scan of your Government issued photo identity card.",
    type: "file",
    targetNationality: "Indian Tourist",
    applicableDestination: "All Protected & Restricted Areas",
    required: true,
    active: true,
    isSystemDefault: true,
    allowedFormats: "JPG, JPEG, PNG, PDF",
    order: 2,
  },
  {
    id: "req_in_id_type",
    key: "lead_id_type",
    label: "Government ID Proof Type",
    description: "Select the government approved photo identity document you are presenting.",
    type: "select",
    targetNationality: "Indian Tourist",
    applicableDestination: "All Protected & Restricted Areas",
    required: true,
    active: true,
    isSystemDefault: true,
    options: [
      "Voter ID Card (Election EPIC) — Strongly Recommended",
      "Indian Passport",
      "Driving License",
      "Aadhaar Card (With full address & DOB)",
    ],
    order: 3,
  },
  {
    id: "req_in_id_number",
    key: "lead_id_number",
    label: "Government ID Card Number",
    description: "Exact alphanumeric number printed on your chosen ID card.",
    type: "text",
    targetNationality: "Indian Tourist",
    applicableDestination: "All Protected & Restricted Areas",
    required: true,
    active: true,
    isSystemDefault: true,
    placeholder: "e.g. EPIC / Passport / DL / Aadhaar Number",
    order: 4,
  },
  {
    id: "req_in_father_spouse",
    key: "father_or_spouse",
    label: "Father's or Spouse's Name",
    description: "Parent / Spouse name for police checkpost verification register.",
    type: "text",
    targetNationality: "Indian Tourist",
    applicableDestination: "All Protected & Restricted Areas",
    required: false,
    active: true,
    isSystemDefault: true,
    placeholder: "Full legal name as per government records",
    order: 5,
  },

  // --- Foreign Nationals Core System Docs ---
  {
    id: "req_fn_photo",
    key: "foreign_photo",
    label: "Passport-size Photograph",
    description: "Recent color passport-size photograph on light background.",
    type: "file",
    targetNationality: "Foreign Tourist",
    applicableDestination: "All Protected & Restricted Areas",
    required: true,
    active: true,
    isSystemDefault: true,
    allowedFormats: "JPG, JPEG, PNG",
    order: 6,
  },
  {
    id: "req_fn_passport_copy",
    key: "foreign_passport_copy",
    label: "Passport Bio-Data Page Copy",
    description: "Clear scanned copy showing photo, passport number, validity & date of birth.",
    type: "file",
    targetNationality: "Foreign Tourist",
    applicableDestination: "All Protected & Restricted Areas",
    required: true,
    active: true,
    isSystemDefault: true,
    allowedFormats: "JPG, JPEG, PNG, PDF",
    order: 7,
  },
  {
    id: "req_fn_visa_copy",
    key: "foreign_visa_copy",
    label: "Indian Visa / e-Visa Copy",
    description: "Valid Indian tourist visa or electronic visa (e-Visa) approval document.",
    type: "file",
    targetNationality: "Foreign Tourist",
    applicableDestination: "All Protected & Restricted Areas",
    required: true,
    active: true,
    isSystemDefault: true,
    allowedFormats: "JPG, JPEG, PNG, PDF",
    order: 8,
  },
  {
    id: "req_fn_country",
    key: "foreign_country",
    label: "Country of Passport / Nationality",
    description: "Official nationality as stamped on your international passport.",
    type: "text",
    targetNationality: "Foreign Tourist",
    applicableDestination: "All Protected & Restricted Areas",
    required: true,
    active: true,
    isSystemDefault: true,
    placeholder: "e.g. United Kingdom, Germany, Japan, France",
    order: 9,
  },
  {
    id: "req_fn_passport_no",
    key: "foreign_passport_number",
    label: "Passport Number",
    description: "Valid international passport number.",
    type: "text",
    targetNationality: "Foreign Tourist",
    applicableDestination: "All Protected & Restricted Areas",
    required: true,
    active: true,
    isSystemDefault: true,
    placeholder: "e.g. A12345678",
    order: 10,
  },

  // --- Universal Requirements (Both Nationalities) ---
  {
    id: "req_both_hotel",
    key: "gangtok_hotel",
    label: "Sikkim Hotel / Gangtok Base Stay",
    description: "Police checkposts require your registered hotel/stay name and location in Sikkim.",
    type: "text",
    targetNationality: "Both",
    applicableDestination: "All Protected & Restricted Areas",
    required: true,
    active: true,
    isSystemDefault: true,
    placeholder: "e.g. Norbu Gangtok Hotel / Local Homestay",
    order: 11,
  },
  {
    id: "req_both_emergency",
    key: "emergency_contact",
    label: "Emergency Contact Person & Phone",
    description: "Primary kin/friend contact number for mountain safety & SOS rescue.",
    type: "text",
    targetNationality: "Both",
    applicableDestination: "All Protected & Restricted Areas",
    required: false,
    active: true,
    isSystemDefault: true,
    placeholder: "e.g. Name & Phone (+91 ...)",
    order: 12,
  },

  // --- Configurable Custom Requirements (Admin Can Add More Anytime) ---
  {
    id: "req_custom_altitude_fitness",
    key: "fitness_clearance",
    label: "High-Altitude Medical Fitness Clearance",
    description: "Doctor's fitness certification or self-declaration for high altitude (14,000+ ft) travel in North Sikkim.",
    type: "file",
    targetNationality: "Both",
    applicableDestination: "All Protected & Restricted Areas",
    required: false,
    active: true,
    isSystemDefault: false,
    allowedFormats: "JPG, JPEG, PNG, PDF",
    order: 13,
  },
  {
    id: "req_custom_hotel_voucher",
    key: "hotel_booking_voucher",
    label: "Sikkim Hotel Booking Confirmation Voucher",
    description: "Confirmed hotel booking receipt or voucher copy in Gangtok or North Sikkim.",
    type: "file",
    targetNationality: "Both",
    applicableDestination: "All Protected & Restricted Areas",
    required: false,
    active: false,
    isSystemDefault: false,
    allowedFormats: "JPG, JPEG, PNG, PDF",
    order: 14,
  },
];

/**
 * Retrieve all configured permit requirements from localStorage or default seed.
 */
export function getAllPermitRequirements() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PERMIT_REQUIREMENTS));
      return DEFAULT_PERMIT_REQUIREMENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn("Failed to load permit doc requirements from storage:", err);
  }
  return DEFAULT_PERMIT_REQUIREMENTS;
}

/**
 * Get active permit requirements filtered by nationality and optional destination.
 * @param {string} nationality - "Indian Tourist" | "Foreign Tourist"
 * @param {string} destination - specific destination name or "All"
 */
export function getActivePermitRequirements(nationality = null, destination = null) {
  const all = getAllPermitRequirements();
  return all.filter((req) => {
    if (!req.active) return false;

    // Nationality match: "Both" matches everyone
    if (nationality && req.targetNationality !== "Both" && req.targetNationality !== nationality) {
      return false;
    }

    // Destination match: "All Protected & Restricted Areas" matches any
    if (
      destination &&
      req.applicableDestination &&
      req.applicableDestination !== "All Protected & Restricted Areas" &&
      req.applicableDestination !== destination
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Get only custom (admin-created) active fields that need dynamic rendering in the form.
 * @param {string} nationality
 * @param {string} destination
 */
export function getActiveCustomPermitRequirements(nationality = null, destination = null) {
  const active = getActivePermitRequirements(nationality, destination);
  return active.filter((req) => !req.isSystemDefault);
}

/**
 * Save all requirements to storage and notify listeners
 */
export function saveAllPermitRequirements(requirements) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requirements));
    window.dispatchEvent(new CustomEvent("admin-storage-changed", { detail: { type: "permit_requirements" } }));
    return true;
  } catch (err) {
    console.error("Failed to save permit doc requirements:", err);
    return false;
  }
}

/**
 * Add or update a permit requirement.
 */
export function savePermitRequirement(req) {
  const list = getAllPermitRequirements();
  const id = req.id || `req_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const key = req.key || req.label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_");

  const normalized = {
    ...req,
    id,
    key,
    label: req.label?.trim() || "Untitled Requirement",
    description: req.description?.trim() || "",
    type: req.type || "file",
    targetNationality: req.targetNationality || "Both",
    applicableDestination: req.applicableDestination || "All Protected & Restricted Areas",
    required: Boolean(req.required),
    active: req.active !== false,
    isSystemDefault: Boolean(req.isSystemDefault),
    options: Array.isArray(req.options) ? req.options : [],
    allowedFormats: req.allowedFormats || "JPG, JPEG, PNG, PDF",
    placeholder: req.placeholder || "",
    updatedAt: new Date().toISOString(),
  };

  const existingIdx = list.findIndex((item) => item.id === id);
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = normalized;
  } else {
    normalized.order = list.length + 1;
    normalized.createdAt = new Date().toISOString();
    updatedList = [...list, normalized];
  }

  saveAllPermitRequirements(updatedList);
  return normalized;
}

/**
 * Toggle active status of a requirement
 */
export function togglePermitRequirementActive(id) {
  const list = getAllPermitRequirements();
  const updated = list.map((item) => {
    if (item.id === id) {
      return { ...item, active: !item.active, updatedAt: new Date().toISOString() };
    }
    return item;
  });
  saveAllPermitRequirements(updated);
}

/**
 * Delete a custom permit requirement (System defaults cannot be deleted, only deactivated)
 */
export function deletePermitRequirement(id) {
  const list = getAllPermitRequirements();
  const target = list.find((item) => item.id === id);
  if (target?.isSystemDefault) {
    // If it's system default, we just deactivate it rather than deleting schema
    togglePermitRequirementActive(id);
    return false;
  }
  const filtered = list.filter((item) => item.id !== id);
  saveAllPermitRequirements(filtered);
  return true;
}

/**
 * Reset all requirements back to factory defaults
 */
export function resetPermitRequirementsToDefault() {
  saveAllPermitRequirements(DEFAULT_PERMIT_REQUIREMENTS);
  return DEFAULT_PERMIT_REQUIREMENTS;
}
