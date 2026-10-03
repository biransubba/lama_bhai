import { destinations } from "./destinations.js";
import { createRepo } from "../utils/localRepo.js";
import { normalizeCarModel, normalizeCarUnit, VEHICLE_CATEGORIES } from "./schema.js";

// Two-level Cars inventory: models/categories → individual vehicle units.
//
// Vehicle numbers are left as null (not invented) until real data is
// provided. Components must render "Not yet added" rather than a fake number.

export const journeyOptions = destinations.map((d) => d.name);

export const vehicleCategories = VEHICLE_CATEGORIES;

// LEVEL 1 — Vehicle models
const initialVehicleModels = [
  {
    id: "tata-sumo",
    slug: "tata-sumo",
    name: "Tata Sumo",
    category: "SUV",
    description: "A rugged SUV suited to Sikkim's mountain roads.",
    image: null,
    gallery: [],
    active: true,
  },
  {
    id: "mahindra-xylo",
    slug: "mahindra-xylo",
    name: "Mahindra Xylo",
    category: "MUV",
    description: "A comfortable MUV suited to standard Sikkim journeys.",
    image: null,
    gallery: [],
    active: true,
  },
  {
    id: "toyota-innova",
    slug: "toyota-innova",
    name: "Toyota Innova",
    category: "MUV",
    description: "A comfortable MUV suited to standard Sikkim journeys.",
    image: null,
    gallery: [],
    active: true,
  },
  {
    id: "mahindra-bolero",
    slug: "mahindra-bolero",
    name: "Mahindra Bolero",
    category: "SUV",
    description: "A rugged SUV suited to Sikkim's mountain roads.",
    image: null,
    gallery: [],
    active: true,
  },
  {
    id: "mahindra-scorpio",
    slug: "mahindra-scorpio",
    name: "Mahindra Scorpio",
    category: "SUV",
    description: "A higher-clearance SUV suited to mountain terrain.",
    image: null,
    gallery: [],
    active: true,
  },
  {
    id: "tempo-traveller",
    slug: "tempo-traveller",
    name: "Tempo Traveller",
    category: "Traveller",
    description: "A larger vehicle suited to group travel across Sikkim.",
    image: null,
    gallery: [],
    active: true,
  },
];

// LEVEL 2 — Individual vehicle units under each model.
// isSampleData: true marks demo entries not yet backed by real records —
// replace with actual fleet data when available.
const initialVehicleUnits = [
  {
    id: "xylo-01",
    modelSlug: "mahindra-xylo",
    vehicleNumber: null,
    availability: "available",
    active: true,
    seatingCapacity: 7,
    description: "Sample unit — replace with real fleet data.",
    image: null,
    isSampleData: true,
  },
  {
    id: "xylo-02",
    modelSlug: "mahindra-xylo",
    vehicleNumber: null,
    availability: "unavailable",
    active: true,
    seatingCapacity: 7,
    description: "Sample unit — replace with real fleet data.",
    image: null,
    isSampleData: true,
  },
  {
    id: "innova-01",
    modelSlug: "toyota-innova",
    vehicleNumber: null,
    availability: "available",
    active: true,
    seatingCapacity: 7,
    description: "Sample unit — replace with real fleet data.",
    image: null,
    isSampleData: true,
  },
  {
    id: "sumo-01",
    modelSlug: "tata-sumo",
    vehicleNumber: null,
    availability: "available",
    active: true,
    seatingCapacity: 9,
    description: "Sample unit — replace with real fleet data.",
    image: null,
    isSampleData: true,
  },
  {
    id: "bolero-01",
    modelSlug: "mahindra-bolero",
    vehicleNumber: null,
    availability: "available",
    active: true,
    seatingCapacity: 7,
    description: "Sample unit — replace with real fleet data.",
    image: null,
    isSampleData: true,
  },
  {
    id: "scorpio-01",
    modelSlug: "mahindra-scorpio",
    vehicleNumber: null,
    availability: "unavailable",
    active: true,
    seatingCapacity: 7,
    description: "Sample unit — replace with real fleet data.",
    image: null,
    isSampleData: true,
  },
  {
    id: "traveller-01",
    modelSlug: "tempo-traveller",
    vehicleNumber: null,
    availability: "available",
    active: true,
    seatingCapacity: 12,
    description: "Sample unit — replace with real fleet data.",
    image: null,
    isSampleData: true,
  },
];

export const carModelsRepo = createRepo("admin_car_models", initialVehicleModels, {
  normalize: normalizeCarModel,
  idField: "slug",
  mergeNewSeeds: true,
});

export const carUnitsRepo = createRepo("admin_car_units", initialVehicleUnits, {
  normalize: normalizeCarUnit,
  idField: "id",
  mergeNewSeeds: true,
});

// Live proxy arrays for vehicleModels and vehicleUnits so public pages and components stay reactive without code changes
export const vehicleModels = new Proxy([], {
  get(target, prop) {
    const list = carModelsRepo.getAll();
    if (prop === "length") return list.length;
    if (prop === Symbol.iterator) return list[Symbol.iterator].bind(list);
    const val = list[prop];
    return typeof val === "function" ? val.bind(list) : val;
  },
});

export const vehicleUnits = new Proxy([], {
  get(target, prop) {
    const list = carUnitsRepo.getAll();
    if (prop === "length") return list.length;
    if (prop === Symbol.iterator) return list[Symbol.iterator].bind(list);
    const val = list[prop];
    return typeof val === "function" ? val.bind(list) : val;
  },
});

export function getModelBySlug(slug) {
  if (!slug) return null;
  return carModelsRepo.getAll().find((m) => m.slug === slug) || null;
}

export function getUnitsByModel(modelSlug) {
  if (!modelSlug) return [];
  return carUnitsRepo.getAll().filter((u) => u.modelSlug === modelSlug && u.active);
}

export function getUnitById(id) {
  if (!id) return null;
  return carUnitsRepo.getAll().find((u) => u.id === id) || null;
}

export function getAvailableUnitCount(modelSlug) {
  if (!modelSlug) return 0;
  return carUnitsRepo.getAll().filter(
    (u) => u.modelSlug === modelSlug && u.active && u.availability === "available"
  ).length;
}