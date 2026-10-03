// Journey concepts — structured so this can later be swapped for an API call.
// No prices or exact durations invented. Permit status is a summary only —
// the Permit Guide (src/data/northSikkimPermitData.js) is the source of truth.
//
// HOW TO ADD A REAL PHOTO LATER:
// 1. Drop the file in src/assets/images/north-sikkim/general/ (or reuse a destination photo)
// 2. Add: import journeyCard from "../assets/images/...";
// 3. Replace the relevant image: null below with the imported variable.

import { createRepo } from "../utils/localRepo.js";

const initialJourneys = [
  {
    slug: "lachen-gurudongmar-lake",
    name: "Lachen & Gurudongmar Lake",
    shortDescription: "A high-altitude route through Lachen toward one of the region's most revered lakes.",
    description: "This journey travels through Lachen, a mountain base village, onward to Gurudongmar Lake — one of the higher-altitude lakes in the region, considered sacred locally.",
    destinations: ["Lachen", "Gurudongmar Lake"],
    suggestedSequence: ["Base point: Lachen", "Onward travel toward Thangu", "Continue to Gurudongmar Lake"],
    highlights: ["Mountain village base at Lachen", "High-altitude sacred lake", "Teesta valley surroundings"],
    permitNote: "Permit required. Not permitted for foreign tourists at Gurudongmar Lake.",
    travelInfo: "Typically arranged as part of a multi-day Sikkim circuit. Access depends on weather and road conditions.",
    image: null,
  },
  {
    slug: "lachung-yumthang-valley",
    name: "Lachung & Yumthang Valley",
    shortDescription: "Travel through Lachung into the Valley of Flowers, framed by snow-capped peaks.",
    description: "This journey is based in Lachung, with a visit to nearby Yumthang Valley, known as the Valley of Flowers and framed by snow-capped peaks.",
    destinations: ["Lachung", "Yumthang Valley"],
    suggestedSequence: ["Base point: Lachung", "Day visit to Yumthang Valley"],
    highlights: ["Terraced valley village of Lachung", "Valley of Flowers", "Mountain backdrop"],
    permitNote: "Permit required for both destinations.",
    travelInfo: "Typically visited as a day trip from Lachung. Conditions vary by season.",
    image: null,
  },
  {
    slug: "lachung-zero-point",
    name: "Lachung & Zero Point",
    shortDescription: "An extension beyond Yumthang toward the high-altitude edge near Zero Point.",
    description: "Based in Lachung, this journey extends beyond Yumthang Valley toward Zero Point (Yumesamdong), a high-altitude viewpoint near the northern edge of the accessible route.",
    destinations: ["Lachung", "Zero Point / Yumesamdong"],
    suggestedSequence: ["Base point: Lachung", "Travel via Yumthang Valley", "Continue to Zero Point"],
    highlights: ["Terraced valley village of Lachung", "High-altitude viewpoint", "Furthest accessible point on this route"],
    permitNote: "Permit required. Not permitted for foreign tourists at Zero Point.",
    travelInfo: "Access to Zero Point can be affected by weather and snow conditions.",
    image: null,
  },
  {
    slug: "thangu-chopta-valley",
    name: "Thangu & Chopta Valley",
    shortDescription: "A quieter route through remote valley villages, less visited than Yumthang.",
    description: "This journey travels through Thangu, a remote valley village, onward to Chopta Valley — a high alpine meadow that sees fewer visitors than Yumthang Valley.",
    destinations: ["Thangu", "Chopta Valley"],
    suggestedSequence: ["Base point: Thangu", "Onward travel to Chopta Valley"],
    highlights: ["Remote valley village of Thangu", "High alpine meadow", "Quieter alternative route"],
    permitNote: "Permit required for both destinations.",
    travelInfo: "Typically reached from Lachen as part of the northern circuit. Road conditions can vary with season.",
    image: null,
  },
  {
    slug: "dzongu",
    name: "Dzongu",
    shortDescription: "A journey into the protected Lepcha reserve, known for its biodiversity.",
    description: "This journey covers Dzongu, a protected reserve set aside for the Lepcha community, known for its biodiversity and regulated access.",
    destinations: ["Dzongu"],
    suggestedSequence: ["Entry into the Dzongu reserve area"],
    highlights: ["Protected biodiversity reserve", "Lepcha community area", "Regulated access"],
    permitNote: "Permit required. Restricted, shorter-duration access for foreign tourists.",
    travelInfo: "Access is regulated and generally requires prior arrangement.",
    image: null,
  },
  {
    slug: "green-lake-trek",
    name: "Green Lake Trek",
    shortDescription: "A multi-day high-altitude trek toward the Kangchenjunga base, for experienced trekkers.",
    description: "The Green Lake Trek is a multi-day, high-altitude trekking route toward the base of Kangchenjunga. It is a special adventure activity rather than a standard sightseeing journey.",
    destinations: ["Green Lake Trek"],
    suggestedSequence: ["Multi-day trekking itinerary toward the Kangchenjunga base"],
    highlights: ["Multi-day high-altitude trek", "Kangchenjunga base approach", "For experienced trekkers only"],
    permitNote: "Requires special mountaineering/adventure clearance, separate from standard tourist permits.",
    travelInfo: "Suitability depends on trekking experience and fitness. This is a multi-day itinerary, not a single-day visit.",
    image: null,
  },
];

export const journeysRepo = createRepo("admin_journeys", initialJourneys);


// Live proxy array for journeys so public pages and components stay reactive without code changes
export const journeys = new Proxy([], {
  get(target, prop) {
    const list = journeysRepo.getAll();
    if (prop === "length") return list.length;
    if (prop === Symbol.iterator) return list[Symbol.iterator].bind(list);
    const val = list[prop];
    return typeof val === "function" ? val.bind(list) : val;
  },
});

export function getJourneyBySlug(slug) {
  return journeysRepo.getAll().find((j) => j.slug === slug);
}