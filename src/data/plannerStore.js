import { createRepo } from "../utils/localRepo.js";
import { SIKKIM_DESTINATIONS, SIKKIM_CIRCUITS, VEHICLE_OPTIONS, STAY_OPTIONS } from "./planner.js";

const DEST_STORAGE_KEY = "lamabhai_planner_destinations";
const CIRCUIT_STORAGE_KEY = "lamabhai_planner_circuits";
const SETTINGS_STORAGE_KEY = "lamabhai_planner_settings";

// Initial seeded destinations with active status
const initialDestinations = SIKKIM_DESTINATIONS.map((d) => ({
  ...d,
  active: d.active !== false,
}));

// Initial seeded circuits with active status
const initialCircuits = SIKKIM_CIRCUITS.map((c) => ({
  ...c,
  active: c.active !== false,
}));

export const DEFAULT_PLANNER_SETTINGS = {
  noticeBanner: "Spring & Summer 2026: North Sikkim high-altitude routes open. Advance permits arranged by Lama Bhai.",
  showNoticeBanner: true,
  responseTimeText: "Tailored day-by-day plan & direct quote within 2 hours on WhatsApp",
  enableSuv: true,
  enableMuv: true,
  enableCab: true,
  enableBikes: true,
  enableHomestays: true,
  enableBoutique: true,
  enableMixedStays: true,
};

// 1. Destinations Repo
export const plannerDestinationsRepo = createRepo(
  DEST_STORAGE_KEY,
  initialDestinations,
  { idField: "id" }
);

export function getAllPlannerDestinations() {
  const all = plannerDestinationsRepo.getAll();
  return all.map((d) => {
    const seed = SIKKIM_DESTINATIONS.find((s) => s.id === d.id);
    return {
      ...d,
      restrictedForForeigners:
        d.restrictedForForeigners !== undefined
          ? d.restrictedForForeigners
          : (seed?.restrictedForForeigners ?? false),
      foreignAccessNote: d.foreignAccessNote || seed?.foreignAccessNote || "",
    };
  });
}

export function getActivePlannerDestinations() {
  return getAllPlannerDestinations().filter((d) => d.active !== false);
}

export function savePlannerDestination(dest) {
  if (!dest.id) {
    dest.id = dest.name
      ? dest.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : `dest_${Date.now()}`;
  }
  return plannerDestinationsRepo.save(dest);
}

export function togglePlannerDestinationActive(id) {
  const all = plannerDestinationsRepo.getAll();
  const found = all.find((d) => d.id === id);
  if (!found) return null;
  const updated = { ...found, active: found.active === false ? true : false };
  plannerDestinationsRepo.save(updated);
  return updated;
}

export function deletePlannerDestination(id) {
  return plannerDestinationsRepo.remove(id);
}

// 2. Circuits Repo
export const plannerCircuitsRepo = createRepo(
  CIRCUIT_STORAGE_KEY,
  initialCircuits,
  { idField: "id" }
);

export function getAllPlannerCircuits() {
  return plannerCircuitsRepo.getAll();
}

export function getActivePlannerCircuits() {
  return plannerCircuitsRepo.getAll().filter((c) => c.active !== false);
}

export function savePlannerCircuit(circuit) {
  if (!circuit.id) {
    circuit.id = circuit.name
      ? circuit.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : `circuit_${Date.now()}`;
  }
  return plannerCircuitsRepo.save(circuit);
}

export function togglePlannerCircuitActive(id) {
  const all = plannerCircuitsRepo.getAll();
  const found = all.find((c) => c.id === id);
  if (!found) return null;
  const updated = { ...found, active: found.active === false ? true : false };
  plannerCircuitsRepo.save(updated);
  return updated;
}

export function deletePlannerCircuit(id) {
  return plannerCircuitsRepo.remove(id);
}

// 3. Planner General Settings
export function getPlannerSettings() {
  if (typeof window === "undefined" || !window.localStorage) {
    return { ...DEFAULT_PLANNER_SETTINGS };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PLANNER_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PLANNER_SETTINGS, ...parsed };
  } catch (e) {
    console.warn("[plannerStore] Error loading planner settings:", e);
    return { ...DEFAULT_PLANNER_SETTINGS };
  }
}

export function savePlannerSettings(newSettings) {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    const current = getPlannerSettings();
    const merged = { ...current, ...newSettings, updatedAt: new Date().toISOString() };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(
      new CustomEvent("admin-storage-changed", { detail: { storageKey: SETTINGS_STORAGE_KEY } })
    );
    window.dispatchEvent(new Event("storage"));
    return true;
  } catch (e) {
    console.error("[plannerStore] Error saving planner settings:", e);
    return false;
  }
}
