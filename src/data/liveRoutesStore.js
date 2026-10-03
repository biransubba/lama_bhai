/**
 * Live Mountain Routes & Pass Clearance Store
 * Stored in localStorage under "lamabhai_live_routes"
 * Managed dynamically by Main Admin in Admin -> Live Routes
 * Synchronizes in real time across the site via "admin-storage-changed" & "storage" events
 */

const STORAGE_KEY = "lamabhai_live_routes";

export const ROUTE_STATUS_CONFIG = {
  open: {
    key: "open",
    label: "Route Open & Clear",
    shortLabel: "OPEN & CLEAR",
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.15)",
    border: "rgba(34, 197, 94, 0.4)",
  },
  advisory: {
    key: "advisory",
    label: "4x4 Only / Advisory",
    shortLabel: "4x4 ONLY",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.4)",
  },
  closed: {
    key: "closed",
    label: "Temporarily Closed",
    shortLabel: "TEMP CLOSED",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.4)",
  },
  permit: {
    key: "permit",
    label: "Special Permit Active",
    shortLabel: "PERMIT ACTIVE",
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.15)",
    border: "rgba(56, 189, 248, 0.4)",
  },
};

export const DEFAULT_LIVE_ROUTES = [
  {
    id: "gurudongmar-lake",
    name: "Gurudongmar Lake",
    altitude: "17,800 ft",
    region: "North Sikkim",
    category: "north",
    status: "open",
    note: "Sub-zero pass open • Army checkpost clearance active",
    recommendedVehicle: "Scorpio / Bolero 4x4",
    lastUpdated: "Live Today",
    order: 1,
  },
  {
    id: "zero-point",
    name: "Zero Point",
    altitude: "15,300 ft",
    region: "North Sikkim • Yumesamdong",
    category: "north",
    status: "advisory",
    note: "High-altitude snow patches • High-clearance 4x4 mandatory",
    recommendedVehicle: "4x4 All-Terrain Only",
    lastUpdated: "Live Today",
    order: 2,
  },
  {
    id: "yumthang-valley",
    name: "Yumthang Valley",
    altitude: "11,800 ft",
    region: "North Sikkim",
    category: "north",
    status: "open",
    note: "Alpine highway clear • Civilian permits processing normally",
    recommendedVehicle: "Innova / Scorpio / Bolero",
    lastUpdated: "Live Today",
    order: 3,
  },
  {
    id: "lachen-thangu",
    name: "Lachen & Thangu",
    altitude: "8,830 – 13,000 ft",
    region: "North Sikkim",
    category: "north",
    status: "open",
    note: "Teesta river road open • Base for high-altitude acclimatization",
    recommendedVehicle: "All SUV & 4x4 Fleet",
    lastUpdated: "Live Today",
    order: 4,
  },
  {
    id: "lachung-valley",
    name: "Lachung Valley",
    altitude: "8,610 ft",
    region: "North Sikkim",
    category: "north",
    status: "open",
    note: "Scenic alpine village open • Direct access corridor to Yumthang",
    recommendedVehicle: "All SUV & Sedan Fleet",
    lastUpdated: "Live Today",
    order: 5,
  },
  {
    id: "dzongu-reserve",
    name: "Dzongu Reserve",
    altitude: "5,000 ft",
    region: "Protected Indigenous Territory",
    category: "reserve",
    status: "permit",
    note: "Special protected tribal territory • Verified native host clearance",
    recommendedVehicle: "4x4 / Mountain SUV",
    lastUpdated: "Live Today",
    order: 6,
  },
  {
    id: "nathula-pass",
    name: "Nathula Pass",
    altitude: "14,140 ft",
    region: "East Sikkim • Tsomgo Border",
    category: "east",
    status: "open",
    note: "Defense border gate active • Indian civilian permits issued daily",
    recommendedVehicle: "Innova / Scorpio / Bolero",
    lastUpdated: "Live Today",
    order: 7,
  },
  {
    id: "zuluk-silk-route",
    name: "Zuluk Silk Route",
    altitude: "9,400 ft",
    region: "East Sikkim • 32 Loops",
    category: "east",
    status: "open",
    note: "All 32 hairpin loops clear • Sunrise Kanchenjunga point accessible",
    recommendedVehicle: "All Mountain Vehicles",
    lastUpdated: "Live Today",
    order: 8,
  },
];

export function getLiveRoutes() {
  if (typeof window === "undefined" || !window.localStorage) {
    return [...DEFAULT_LIVE_ROUTES];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_LIVE_ROUTES];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [...DEFAULT_LIVE_ROUTES];
  } catch (err) {
    console.warn("[liveRoutesStore] Failed reading routes from localStorage:", err);
    return [...DEFAULT_LIVE_ROUTES];
  }
}

export function saveLiveRoutes(routes) {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("admin-storage-changed", { detail: { key: STORAGE_KEY } }));
      window.dispatchEvent(new Event("storage"));
    }
    return true;
  } catch (err) {
    console.error("[liveRoutesStore] Failed saving routes:", err);
    return false;
  }
}

export function updateRouteStatus(id, newStatus, newNote = null) {
  const routes = getLiveRoutes();
  const index = routes.findIndex((r) => r.id === id);
  if (index === -1) return false;

  routes[index].status = newStatus;
  if (newNote !== null) {
    routes[index].note = newNote;
  }
  routes[index].lastUpdated = "Updated just now";
  return saveLiveRoutes(routes);
}

export function addLiveRoute(newRoute) {
  const routes = getLiveRoutes();
  const id = newRoute.id || newRoute.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  
  const created = {
    ...newRoute,
    id: id || `route-${Date.now()}`,
    order: routes.length + 1,
    lastUpdated: "Just added",
  };
  routes.push(created);
  return saveLiveRoutes(routes);
}

export function deleteLiveRoute(id) {
  const routes = getLiveRoutes();
  const filtered = routes.filter((r) => r.id !== id);
  return saveLiveRoutes(filtered);
}

export function resetLiveRoutesToDefault() {
  return saveLiveRoutes([...DEFAULT_LIVE_ROUTES]);
}
