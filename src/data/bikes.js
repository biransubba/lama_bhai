import { createRepo } from "../utils/localRepo.js";
import { normalizeBikeModel, normalizeBikeUnit, BIKE_CATEGORIES } from "./schema.js";

// Two-level Bikes inventory: models/categories → individual bike units.
//
// Identifiers/registration numbers are left as null (not invented) until
// real data is provided. Components must render "Not yet added" rather
// than a fake number.

export const bikeCategories = BIKE_CATEGORIES;

// LEVEL 1 — Bike models
const initialBikeModels = [
  {
    id: "royal-enfield",
    slug: "royal-enfield",
    name: "Royal Enfield",
    category: "Mountain touring",
    description: "A touring bike suited to Sikkim's mountain roads.",
    image: null,
    gallery: [],
    active: true,
  },
  {
    id: "himalayan",
    slug: "himalayan",
    name: "Royal Enfield Himalayan",
    category: "Mountain touring",
    description: "Built for long-distance mountain terrain.",
    image: null,
    gallery: [],
    active: true,
  },
  {
    id: "pulsar",
    slug: "pulsar",
    name: "Bajaj Pulsar",
    category: "City / short-distance",
    description: "A lighter bike suited to shorter routes.",
    image: null,
    gallery: [],
    active: true,
  },
];

// LEVEL 2 — Individual bike units under each model.
// isSampleData: true marks demo entries not yet backed by real records —
// replace with actual fleet data when available.
const initialBikeUnits = [
  {
    id: "re-01",
    modelSlug: "royal-enfield",
    identifier: null,
    availability: "available",
    active: true,
    engineCC: null,
    transmission: null,
    seating: 2,
    description: "Sample unit — replace with real fleet data.",
    image: null,
    isSampleData: true,
  },
  {
    id: "re-02",
    modelSlug: "royal-enfield",
    identifier: null,
    availability: "unavailable",
    active: true,
    engineCC: null,
    transmission: null,
    seating: 2,
    description: "Sample unit — replace with real fleet data.",
    image: null,
    isSampleData: true,
  },
  {
    id: "himalayan-01",
    modelSlug: "himalayan",
    identifier: null,
    availability: "available",
    active: true,
    engineCC: null,
    transmission: null,
    seating: 2,
    description: "Sample unit — replace with real fleet data.",
    image: null,
    isSampleData: true,
  },
  {
    id: "pulsar-01",
    modelSlug: "pulsar",
    identifier: null,
    availability: "available",
    active: true,
    engineCC: null,
    transmission: null,
    seating: 2,
    description: "Sample unit — replace with real fleet data.",
    image: null,
    isSampleData: true,
  },
];

export const bikeModelsRepo = createRepo("admin_bike_models", initialBikeModels, {
  normalize: normalizeBikeModel,
  idField: "slug",
  mergeNewSeeds: true,
});

export const bikeUnitsRepo = createRepo("admin_bike_units", initialBikeUnits, {
  normalize: normalizeBikeUnit,
  idField: "id",
  mergeNewSeeds: true,
});

// Live proxy arrays for bikeModels and bikeUnits so public pages and components stay reactive without code changes
export const bikeModels = new Proxy([], {
  get(target, prop) {
    const list = bikeModelsRepo.getAll();
    if (prop === "length") return list.length;
    if (prop === Symbol.iterator) return list[Symbol.iterator].bind(list);
    const val = list[prop];
    return typeof val === "function" ? val.bind(list) : val;
  },
});

export const bikeUnits = new Proxy([], {
  get(target, prop) {
    const list = bikeUnitsRepo.getAll();
    if (prop === "length") return list.length;
    if (prop === Symbol.iterator) return list[Symbol.iterator].bind(list);
    const val = list[prop];
    return typeof val === "function" ? val.bind(list) : val;
  },
});

export function getBikeModelBySlug(slug) {
  if (!slug) return null;
  return bikeModelsRepo.getAll().find((m) => m.slug === slug) || null;
}

export function getUnitsByBikeModel(modelSlug) {
  if (!modelSlug) return [];
  return bikeUnitsRepo.getAll().filter((u) => u.modelSlug === modelSlug && u.active);
}

export function getBikeUnitById(id) {
  if (!id) return null;
  return bikeUnitsRepo.getAll().find((u) => u.id === id) || null;
}

export function getAvailableBikeCount(modelSlug) {
  if (!modelSlug) return 0;
  return bikeUnitsRepo.getAll().filter(
    (u) => u.modelSlug === modelSlug && u.active && u.availability === "available"
  ).length;
}