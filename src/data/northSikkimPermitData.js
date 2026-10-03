import { allDestinations } from "./destinations.js";

// Single source of truth for Sikkim permit rules.
// Update this file when government rules change — components read from here only.
// No fees or processing times are stated since they haven't been confirmed.

export const nationalities = ["Indian Tourist", "Foreign Tourist"];

export const STATUS = {
  REQUIRED: "required",
  RESTRICTED: "restricted",
  NOT_PERMITTED: "not-permitted",
  SPECIAL_CLEARANCE: "special-clearance",
  INFORMATION: "information",
};

export const destinationList = allDestinations.map((d) => d.name);

const indianRules = {
  "Lachen": {
    status: STATUS.REQUIRED,
    permitType: "Protected Area Permit (PAP)",
    restrictions: "Typically processed through the relevant police/tourism authorities.",
    notes: "Subject to applicable government rules and approval.",
  },
  "Lachung": {
    status: STATUS.REQUIRED,
    permitType: "Protected Area Permit (PAP)",
    restrictions: "Typically processed through the relevant police/tourism authorities.",
    notes: "Subject to applicable government rules and approval.",
  },
  "Yumthang Valley": {
    status: STATUS.REQUIRED,
    permitType: "Protected Area Permit (PAP)",
    restrictions: "Typically processed through the relevant police/tourism authorities.",
    notes: "Subject to applicable government rules and approval.",
  },
  "Zero Point / Yumesamdong": {
    status: STATUS.REQUIRED,
    permitType: "Protected Area Permit (PAP)",
    restrictions: "Typically processed through the relevant police/tourism authorities.",
    notes: "Subject to applicable government rules and approval.",
  },
  "Thangu": {
    status: STATUS.REQUIRED,
    permitType: "Protected Area Permit (PAP)",
    restrictions: "Typically processed through the relevant police/tourism authorities.",
    notes: "Subject to applicable government rules and approval.",
  },
  "Chopta Valley": {
    status: STATUS.REQUIRED,
    permitType: "Protected Area Permit (PAP)",
    restrictions: "Typically processed through the relevant police/tourism authorities.",
    notes: "Subject to applicable government rules and approval.",
  },
  "Gurudongmar Lake": {
    status: STATUS.REQUIRED,
    permitType: "Protected Area Permit (PAP)",
    restrictions: "Typically processed through the relevant police/tourism authorities.",
    notes: "Subject to applicable government rules and approval.",
  },
  "Dzongu": {
    status: STATUS.REQUIRED,
    permitType: "Protected Area Permit (PAP)",
    restrictions: "Typically processed through the relevant police/tourism authorities.",
    notes: "Subject to applicable government rules and approval.",
  },
  "Green Lake Trek": {
    status: STATUS.SPECIAL_CLEARANCE,
    permitType: "Mountaineering / adventure clearance",
    restrictions: "Separate from standard tourist permits — not an ordinary sightseeing permit.",
    notes: "Subject to applicable government rules and approval.",
  },
};

const foreignRules = {
  "Lachen": {
    status: STATUS.REQUIRED,
    permitType: "Restricted Area Permit (RAP) / Protected Area Permit (PAP)",
    restrictions: "Minimum group size of 2. Travel must be arranged through a registered travel agency.",
    notes: "Subject to applicable government rules and approval.",
  },
  "Lachung": {
    status: STATUS.REQUIRED,
    permitType: "RAP/PAP",
    restrictions: "Minimum group size of 2. Travel must be arranged through a registered travel agency.",
    notes: "Subject to applicable government rules and approval.",
  },
  "Yumthang Valley": {
    status: STATUS.REQUIRED,
    permitType: "RAP/PAP",
    restrictions: "Minimum group size of 2. Travel must be arranged through a registered travel agency.",
    notes: "Subject to applicable government rules and approval.",
  },
  "Zero Point / Yumesamdong": {
    status: STATUS.NOT_PERMITTED,
    permitType: null,
    restrictions: "Not permitted for foreign tourists.",
    notes: "No permit pathway currently available for foreign nationals.",
  },
  "Thangu": {
    status: STATUS.REQUIRED,
    permitType: "RAP/PAP",
    restrictions: "Minimum group size of 2. Travel must be arranged through a registered travel agency.",
    notes: "Subject to applicable government rules and approval.",
  },
  "Chopta Valley": {
    status: STATUS.REQUIRED,
    permitType: "RAP/PAP",
    restrictions: "Minimum group size of 2. Travel must be arranged through a registered travel agency.",
    notes: "Subject to applicable government rules and approval.",
  },
  "Gurudongmar Lake": {
    status: STATUS.NOT_PERMITTED,
    permitType: null,
    restrictions: "Not permitted for foreign tourists.",
    notes: "No permit pathway currently available for foreign nationals.",
  },
  "Dzongu": {
    status: STATUS.RESTRICTED,
    permitType: "RAP/PAP",
    restrictions: "Minimum group size of 2. Travel must be arranged through a registered travel agency. Maximum stay of 5 days.",
    notes: "Subject to applicable government rules and approval.",
  },
  "Green Lake Trek": {
    status: STATUS.SPECIAL_CLEARANCE,
    permitType: "Mountaineering / adventure clearance",
    restrictions: "Separate from standard tourist permits — not an ordinary sightseeing permit.",
    notes: "Subject to applicable government rules and approval.",
  },
};

const rulesByNationality = {
  "Indian Tourist": indianRules,
  "Foreign Tourist": foreignRules,
};

export const statusMeaning = {
  [STATUS.REQUIRED]: "A permit is required. Assistance is available to help prepare your request.",
  [STATUS.RESTRICTED]: "Access is allowed only under specific conditions.",
  [STATUS.NOT_PERMITTED]: "This destination is not permitted for your nationality at this time.",
  [STATUS.SPECIAL_CLEARANCE]: "This requires additional mountaineering/adventure clearance beyond a standard permit. Clearance is not guaranteed.",
  [STATUS.INFORMATION]: "General information for this destination — no specific permit action needed here.",
};

export function getStatusMeaning(status) {
  return statusMeaning[status] || "";
}

export function getPermitInfo(nationality, destination) {
  const rules = rulesByNationality[nationality];
  if (!rules) return null;
  const rule = rules[destination];
  if (!rule) return null;
  return { destination, ...rule };
}

export function getDestinationsForNationality() {
  return destinationList;
}