import { createRepo } from "../utils/localRepo.js";
import { DEFAULT_DESTINATION_PHOTOS, unwrapImageUrl, getDefaultDestinationPhotos } from "./destinationImages.js";
import { getDefaultDestinationDetails } from "./destinationDetailsData.js";

const initialDestinations = [
  {
    slug: "lachen",
    name: "Lachen",
    tag: "Mountain village",
    shortDescription: "A quiet base village on the route to Sikkim's high-altitude circuit.",
    description: "Lachen is a small mountain village that serves as a common base for onward travel toward Gurudongmar Lake and the surrounding high-altitude areas. It sits along the Teesta valley route and is typically used as a stopover point rather than a final destination in itself.",
    whyVisit: [
      "A base point for onward travel deeper into the northern alpine zones of Sikkim",
      "Mountain village setting away from busier towns",
      "Access point for high-altitude routes further north",
    ],
    highlights: ["Mountain village atmosphere", "Gateway to Gurudongmar Lake route", "Teesta valley surroundings"],
    travelInfo: "Typically reached by road from Gangtok as part of a scenic Sikkim circuit. Road conditions and travel duration can vary with season and weather.",
    permitNote: "Requires a permit for Indian and foreign tourists. See the Permit Guide for details.",
    image: DEFAULT_DESTINATION_PHOTOS["lachen"]?.cover || null,
    gallery: DEFAULT_DESTINATION_PHOTOS["lachen"]?.gallery || [],
    images: {
      hero: DEFAULT_DESTINATION_PHOTOS["lachen"]?.cover || null,
      card: DEFAULT_DESTINATION_PHOTOS["lachen"]?.cover || null,
      thumbnail: DEFAULT_DESTINATION_PHOTOS["lachen"]?.cover || null,
      gallery: DEFAULT_DESTINATION_PHOTOS["lachen"]?.gallery || [],
    },
    relatedSlugs: ["gurudongmar-lake", "thangu"],
  },
  {
    slug: "lachung",
    name: "Lachung",
    tag: "Mountain village",
    shortDescription: "Terraced valleys and orchards, close to Yumthang and Zero Point.",
    description: "Lachung is a mountain village known for its terraced landscape and proximity to Yumthang Valley and Zero Point. It commonly serves as a base for exploring the northern high-altitude viewpoints of the region.",
    whyVisit: [
      "Close to Yumthang Valley and Zero Point",
      "Terraced valley and orchard scenery",
      "Common base for the northern circuit",
    ],
    highlights: ["Terraced valley landscape", "Gateway to Yumthang Valley", "Gateway to Zero Point"],
    travelInfo: "Typically reached by road as part of a scenic Sikkim circuit. Road conditions and travel duration can vary with season and weather.",
    permitNote: "Requires a permit for Indian and foreign tourists. See the Permit Guide for details.",
    image: DEFAULT_DESTINATION_PHOTOS["lachung"]?.cover || null,
    gallery: DEFAULT_DESTINATION_PHOTOS["lachung"]?.gallery || [],
    images: {
      hero: DEFAULT_DESTINATION_PHOTOS["lachung"]?.cover || null,
      card: DEFAULT_DESTINATION_PHOTOS["lachung"]?.cover || null,
      thumbnail: DEFAULT_DESTINATION_PHOTOS["lachung"]?.cover || null,
      gallery: DEFAULT_DESTINATION_PHOTOS["lachung"]?.gallery || [],
    },
    relatedSlugs: ["yumthang-valley", "zero-point"],
  },
  {
    slug: "yumthang-valley",
    name: "Yumthang Valley",
    tag: "Valley",
    shortDescription: "Known as the Valley of Flowers, framed by snow-capped peaks.",
    description: "Yumthang Valley is known locally as the Valley of Flowers, with a landscape shaped by surrounding snow-capped peaks. It is one of the most celebrated valleys in Sikkim and is usually reached from Lachung.",
    whyVisit: [
      "Known as the Valley of Flowers",
      "Surrounded by snow-capped peaks",
      "One of the most accessible and picturesque Sikkim valleys",
    ],
    highlights: ["Valley of Flowers", "Mountain backdrop", "Reached via Lachung"],
    travelInfo: "Typically visited as a day trip from Lachung. Conditions vary by season.",
    permitNote: "Requires a permit for Indian and foreign tourists. See the Permit Guide for details.",
    image: DEFAULT_DESTINATION_PHOTOS["yumthang-valley"]?.cover || null,
    gallery: DEFAULT_DESTINATION_PHOTOS["yumthang-valley"]?.gallery || [],
    images: {
      hero: DEFAULT_DESTINATION_PHOTOS["yumthang-valley"]?.cover || null,
      card: DEFAULT_DESTINATION_PHOTOS["yumthang-valley"]?.cover || null,
      thumbnail: DEFAULT_DESTINATION_PHOTOS["yumthang-valley"]?.cover || null,
      gallery: DEFAULT_DESTINATION_PHOTOS["yumthang-valley"]?.gallery || [],
    },
    relatedSlugs: ["lachung", "zero-point"],
  },
  {
    slug: "zero-point",
    name: "Zero Point / Yumesamdong",
    tag: "High altitude",
    shortDescription: "A high-altitude viewpoint near the region's northern edge.",
    description: "Zero Point, also known as Yumesamdong, is a high-altitude viewpoint near the northern edge of the accessible tourist route in this part of Sikkim. It lies beyond Yumthang Valley and is typically the furthest point reached on this route.",
    whyVisit: [
      "High-altitude viewpoint",
      "Furthest accessible point on this route",
      "Beyond Yumthang Valley",
    ],
    highlights: ["High-altitude terrain", "Mountain viewpoint", "End point of the Yumthang route"],
    travelInfo: "Typically visited as an extension of a Yumthang Valley trip. Access can be affected by weather and snow conditions.",
    permitNote: "Requires a permit for Indian tourists. Not permitted for foreign tourists. See the Permit Guide for details.",
    image: DEFAULT_DESTINATION_PHOTOS["zero-point"]?.cover || null,
    gallery: DEFAULT_DESTINATION_PHOTOS["zero-point"]?.gallery || [],
    images: {
      hero: DEFAULT_DESTINATION_PHOTOS["zero-point"]?.cover || null,
      card: DEFAULT_DESTINATION_PHOTOS["zero-point"]?.cover || null,
      thumbnail: DEFAULT_DESTINATION_PHOTOS["zero-point"]?.cover || null,
      gallery: DEFAULT_DESTINATION_PHOTOS["zero-point"]?.gallery || [],
    },
    relatedSlugs: ["yumthang-valley", "lachung"],
  },
  {
    slug: "thangu",
    name: "Thangu",
    tag: "Remote village",
    shortDescription: "A remote valley village en route to Gurudongmar and Chopta.",
    description: "Thangu is a remote valley village that lies along the route toward Gurudongmar Lake and Chopta Valley. It is less visited than other popular Sikkim destinations and retains a quieter, more remote character.",
    whyVisit: [
      "Quieter, less visited valley village",
      "En route to Gurudongmar Lake",
      "En route to Chopta Valley",
    ],
    highlights: ["Remote valley setting", "Gateway to Chopta Valley", "Gateway to Gurudongmar Lake"],
    travelInfo: "Typically reached from Lachen as part of the northern circuit. Road conditions can vary with season.",
    permitNote: "Requires a permit for Indian and foreign tourists. See the Permit Guide for details.",
    image: DEFAULT_DESTINATION_PHOTOS["thangu"]?.cover || null,
    gallery: DEFAULT_DESTINATION_PHOTOS["thangu"]?.gallery || [],
    images: {
      hero: DEFAULT_DESTINATION_PHOTOS["thangu"]?.cover || null,
      card: DEFAULT_DESTINATION_PHOTOS["thangu"]?.cover || null,
      thumbnail: DEFAULT_DESTINATION_PHOTOS["thangu"]?.cover || null,
      gallery: DEFAULT_DESTINATION_PHOTOS["thangu"]?.gallery || [],
    },
    relatedSlugs: ["chopta-valley", "gurudongmar-lake"],
  },
  {
    slug: "chopta-valley",
    name: "Chopta Valley",
    tag: "Alpine meadow",
    shortDescription: "A high alpine meadow beyond Thangu, less visited than Yumthang.",
    description: "Chopta Valley is a high alpine meadow located beyond Thangu. It is less frequently visited than Yumthang Valley and offers a quieter alternative within the same general region.",
    whyVisit: [
      "High alpine meadow landscape",
      "Less visited than Yumthang Valley",
      "Quieter alpine alternative within Sikkim",
    ],
    highlights: ["Alpine meadow terrain", "Located beyond Thangu", "Less crowded than other valleys"],
    travelInfo: "Typically reached from Thangu. Access and conditions can vary by season.",
    permitNote: "Requires a permit for Indian and foreign tourists. See the Permit Guide for details.",
    image: DEFAULT_DESTINATION_PHOTOS["chopta-valley"]?.cover || null,
    gallery: DEFAULT_DESTINATION_PHOTOS["chopta-valley"]?.gallery || [],
    images: {
      hero: DEFAULT_DESTINATION_PHOTOS["chopta-valley"]?.cover || null,
      card: DEFAULT_DESTINATION_PHOTOS["chopta-valley"]?.cover || null,
      thumbnail: DEFAULT_DESTINATION_PHOTOS["chopta-valley"]?.cover || null,
      gallery: DEFAULT_DESTINATION_PHOTOS["chopta-valley"]?.gallery || [],
    },
    relatedSlugs: ["thangu", "gurudongmar-lake"],
  },
  {
    slug: "gurudongmar-lake",
    name: "Gurudongmar Lake",
    tag: "Sacred lake",
    shortDescription: "One of the highest lakes in the region, held sacred locally.",
    description: "Gurudongmar Lake is one of the higher-altitude lakes in the region and is considered sacred by local communities. It is typically reached from Lachen via Thangu and is among the most revered and iconic destinations in Sikkim.",
    whyVisit: [
      "One of the highest lakes in the region",
      "Considered sacred locally",
      "A renowned Sikkim high-altitude landmark",
    ],
    highlights: ["High-altitude sacred lake", "Reached via Lachen and Thangu", "Notable Sikkim landmark"],
    travelInfo: "Typically reached as part of a Lachen-based itinerary. Altitude and weather conditions can affect access.",
    permitNote: "Requires a permit for Indian tourists. Not permitted for foreign tourists. See the Permit Guide for details.",
    image: DEFAULT_DESTINATION_PHOTOS["gurudongmar-lake"]?.cover || null,
    gallery: DEFAULT_DESTINATION_PHOTOS["gurudongmar-lake"]?.gallery || [],
    images: {
      hero: DEFAULT_DESTINATION_PHOTOS["gurudongmar-lake"]?.cover || null,
      card: DEFAULT_DESTINATION_PHOTOS["gurudongmar-lake"]?.cover || null,
      thumbnail: DEFAULT_DESTINATION_PHOTOS["gurudongmar-lake"]?.cover || null,
      gallery: DEFAULT_DESTINATION_PHOTOS["gurudongmar-lake"]?.gallery || [],
    },
    relatedSlugs: ["lachen", "thangu"],
  },
  {
    slug: "dzongu",
    name: "Dzongu",
    tag: "Protected reserve",
    shortDescription: "A reserve for the Lepcha community, rich in biodiversity.",
    description: "Dzongu is a protected reserve set aside for the Lepcha community, known for its biodiversity. Access is regulated, and travel here is generally more restricted than other popular Sikkim destinations.",
    whyVisit: [
      "Protected reserve with notable biodiversity",
      "Culturally significant to the Lepcha community",
      "A more regulated, less commercial destination",
    ],
    highlights: ["Protected biodiversity reserve", "Lepcha community area", "Regulated access"],
    travelInfo: "Access is regulated and generally requires prior arrangement. Conditions vary by season.",
    permitNote: "Requires a permit for Indian tourists. Restricted access for foreign tourists (maximum stay applies). See the Permit Guide for details.",
    image: DEFAULT_DESTINATION_PHOTOS["dzongu"]?.cover || null,
    gallery: DEFAULT_DESTINATION_PHOTOS["dzongu"]?.gallery || [],
    images: {
      hero: DEFAULT_DESTINATION_PHOTOS["dzongu"]?.cover || null,
      card: DEFAULT_DESTINATION_PHOTOS["dzongu"]?.cover || null,
      thumbnail: DEFAULT_DESTINATION_PHOTOS["dzongu"]?.cover || null,
      gallery: DEFAULT_DESTINATION_PHOTOS["dzongu"]?.gallery || [],
    },
    relatedSlugs: ["lachen", "lachung"],
  },
];

const initialGreenLakeTrek = {
  slug: "green-lake-trek",
  name: "Green Lake Trek",
  tag: "Special adventure / trek",
  badge: "Special adventure / trek",
  shortDescription: "A multi-day high-altitude trek toward the Kangchenjunga base — for experienced trekkers only.",
  description: "The Green Lake Trek is a multi-day, high-altitude trek that heads toward the base of Kangchenjunga. It is a special adventure activity rather than a standard sightseeing trip, and is intended for experienced trekkers.",
  whyVisit: [
    "A high-altitude trekking experience toward the Kangchenjunga base",
    "Suited to experienced trekkers seeking a multi-day route",
    "A distinct adventure activity, separate from standard sightseeing",
  ],
  highlights: ["Multi-day high-altitude trek", "Kangchenjunga base approach", "For experienced trekkers only"],
  travelInfo: "This is a multi-day trekking itinerary rather than a single-day visit. Suitability depends on trekking experience and fitness.",
  permitNote: "Requires special mountaineering/adventure clearance, separate from standard tourist permits. See the Permit Guide for details.",
  image: DEFAULT_DESTINATION_PHOTOS["green-lake-trek"]?.cover || null,
  gallery: DEFAULT_DESTINATION_PHOTOS["green-lake-trek"]?.gallery || [],
  images: {
    hero: DEFAULT_DESTINATION_PHOTOS["green-lake-trek"]?.cover || null,
    card: DEFAULT_DESTINATION_PHOTOS["green-lake-trek"]?.cover || null,
    thumbnail: DEFAULT_DESTINATION_PHOTOS["green-lake-trek"]?.cover || null,
    gallery: DEFAULT_DESTINATION_PHOTOS["green-lake-trek"]?.gallery || [],
  },
  relatedSlugs: ["gurudongmar-lake", "thangu"],
};

export function normalizeDestination(d) {
  if (!d || typeof d !== "object") return d;
  const defaults = getDefaultDestinationPhotos(d.slug);
  const details = getDefaultDestinationDetails(d.slug);

  const cleanCover =
    unwrapImageUrl(d.image) ||
    unwrapImageUrl(d.images?.card) ||
    unwrapImageUrl(d.images?.hero) ||
    unwrapImageUrl(d.images?.thumbnail) ||
    defaults.cover ||
    "";

  let rawGallery = (Array.isArray(d.gallery) && d.gallery.length > 0)
    ? d.gallery
    : (Array.isArray(d.images?.gallery) && d.images.gallery.length > 0)
    ? d.images.gallery
    : null;

  let cleanGallery = [];
  if (rawGallery && rawGallery.length > 0) {
    cleanGallery = rawGallery
      .map((g, idx) => {
        if (typeof g === "string") {
          const s = unwrapImageUrl(g);
          return s ? { id: `gal_${d.slug}_${idx}`, src: s, alt: `${d.name || "Destination"} photo ${idx + 1}`, category: idx === 0 ? "Cover Photo" : "Scenic View" } : null;
        }
        if (typeof g === "object" && g) {
          const s = unwrapImageUrl(g.src || g.dataUrl || g.url);
          return s ? { ...g, id: g.id || `gal_${d.slug}_${idx}`, src: s } : null;
        }
        return null;
      })
      .filter(Boolean);
  }

  if (cleanGallery.length === 0 && defaults.gallery && defaults.gallery.length > 0) {
    cleanGallery = defaults.gallery;
  }

  return {
    ...d,
    altitude: d.altitude || details.altitude || "High Altitude Mountain Zone",
    elevationMeters: d.elevationMeters || details.elevationMeters || null,
    distanceFromGangtok: d.distanceFromGangtok || details.distanceFromGangtok || "",
    bestTime: d.bestTime || details.bestTime || "March – June & October – December",
    temperature: d.temperature || details.temperature || "Cool Alpine Climate",
    idealDuration: d.idealDuration || details.idealDuration || "1 - 2 Days",
    foreignerAccess: d.foreignerAccess || details.foreignerAccess || "permitted",
    foreignerBadge: d.foreignerBadge || details.foreignerBadge || "Permit Required",
    foreignAccessNote: d.foreignAccessNote || details.foreignAccessNote || "",
    indianAccessNote: d.indianAccessNote || details.indianAccessNote || "",
    recommendedVehicle: d.recommendedVehicle || details.recommendedVehicle || "4x4 Mountain SUV",
    routeGuide: d.routeGuide || details.routeGuide || "",
    localCulture: d.localCulture || details.localCulture || "",
    whyVisit: (Array.isArray(d.whyVisit) && d.whyVisit.length > 0 && typeof d.whyVisit[0] === "object")
      ? d.whyVisit
      : (details.whyVisit || []),
    topExperiences: (Array.isArray(d.topExperiences) && d.topExperiences.length > 0)
      ? d.topExperiences
      : (details.topExperiences || []),
    insiderTips: (Array.isArray(d.insiderTips) && d.insiderTips.length > 0)
      ? d.insiderTips
      : (details.insiderTips || []),
    image: cleanCover,
    gallery: cleanGallery,
    images: {
      card: unwrapImageUrl(d.images?.card) || cleanCover,
      hero: unwrapImageUrl(d.images?.hero) || cleanCover,
      thumbnail: unwrapImageUrl(d.images?.thumbnail) || cleanCover,
      gallery: cleanGallery,
    },
  };
}

export const destinationsRepo = createRepo(
  "admin_destinations",
  [...initialDestinations, initialGreenLakeTrek],
  {
    normalize: normalizeDestination,
    idField: "slug",
  }
);

// Auto-hydrate and persist normalized destinations (ensures legacy storage is updated)
try {
  const current = destinationsRepo.getAll();
  destinationsRepo.set(current);
} catch (e) {
  console.warn("Destination photo auto-hydration check:", e);
}

// Live proxy array for destinations so public pages and components stay reactive without code changes
export const destinations = new Proxy([], {
  get(target, prop) {
    const list = destinationsRepo.getAll().filter((d) => d.slug !== "green-lake-trek");
    if (prop === "length") return list.length;
    if (prop === Symbol.iterator) return list[Symbol.iterator].bind(list);
    const val = list[prop];
    return typeof val === "function" ? val.bind(list) : val;
  },
});

export const greenLakeTrek = new Proxy({}, {
  get(target, prop) {
    const found = destinationsRepo.getAll().find((d) => d.slug === "green-lake-trek");
    return found ? found[prop] : initialGreenLakeTrek[prop];
  },
});

export const allDestinations = new Proxy([], {
  get(target, prop) {
    const list = destinationsRepo.getAll();
    if (prop === "length") return list.length;
    if (prop === Symbol.iterator) return list[Symbol.iterator].bind(list);
    const val = list[prop];
    return typeof val === "function" ? val.bind(list) : val;
  },
});

export function getDestinationBySlug(slug) {
  return destinationsRepo.getAll().find((d) => d.slug === slug);
}

export function getRelatedDestinations(slugs = []) {
  const all = destinationsRepo.getAll();
  return slugs
    .map((s) => all.find((d) => d.slug === s))
    .filter(Boolean);
}

export function getDestinationSlugByName(name) {
  const found = destinationsRepo.getAll().find((d) => d.name === name);
  return found ? found.slug : null;
}