const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Destination } = require('../models');

const destinationsData = [
  {
    slug: 'lachen',
    name: 'Lachen',
    tag: 'Mountain village',
    district: 'North Sikkim',
    shortDescription: "A quiet base village on the route to Sikkim's high-altitude circuit.",
    description:
      'Lachen is a small mountain village that serves as a common base for onward travel toward Gurudongmar Lake and the surrounding high-altitude areas. It sits along the Teesta valley route and is typically used as a stopover point rather than a final destination in itself.',
    whyVisit: [
      'A base point for onward travel deeper into the northern alpine zones of Sikkim',
      'Mountain village setting away from busier towns',
      'Access point for high-altitude routes further north',
    ],
    highlights: [
      'Mountain village atmosphere',
      'Gateway to Gurudongmar Lake route',
      'Teesta valley surroundings',
    ],
    travelInfo:
      'Typically reached by road from Gangtok as part of a scenic Sikkim circuit. Road conditions and travel duration can vary with season and weather.',
    permitNote:
      'Requires a permit for Indian and foreign tourists. See the Permit Guide for details.',
    bestTimeToVisit: 'March to May & October to Mid-December',
    relatedSlugs: ['gurudongmar-lake', 'thangu'],
    isActive: true,
  },
  {
    slug: 'lachung',
    name: 'Lachung',
    tag: 'Mountain village',
    district: 'North Sikkim',
    shortDescription: 'Terraced valleys and orchards, close to Yumthang and Zero Point.',
    description:
      'Lachung is a mountain village known for its terraced landscape and proximity to Yumthang Valley and Zero Point. It commonly serves as a base for exploring the northern high-altitude viewpoints of the region.',
    whyVisit: [
      'Close to Yumthang Valley and Zero Point',
      'Terraced valley and orchard scenery',
      'Common base for the northern circuit',
    ],
    highlights: [
      'Terraced valley landscape',
      'Gateway to Yumthang Valley',
      'Gateway to Zero Point',
    ],
    travelInfo:
      'Typically reached by road as part of a scenic Sikkim circuit. Road conditions and travel duration can vary with season and weather.',
    permitNote:
      'Requires a permit for Indian and foreign tourists. See the Permit Guide for details.',
    bestTimeToVisit: 'March to June & September to December',
    relatedSlugs: ['yumthang-valley', 'zero-point'],
    isActive: true,
  },
  {
    slug: 'yumthang-valley',
    name: 'Yumthang Valley',
    tag: 'Valley',
    district: 'North Sikkim',
    shortDescription: 'Known as the Valley of Flowers, framed by snow-capped peaks.',
    description:
      'Yumthang Valley is known locally as the Valley of Flowers, with a landscape shaped by surrounding snow-capped peaks. It is one of the most celebrated valleys in Sikkim and is usually reached from Lachung.',
    whyVisit: [
      'Known as the Valley of Flowers',
      'Surrounded by snow-capped peaks',
      'One of the most accessible and picturesque Sikkim valleys',
    ],
    highlights: ['Valley of Flowers', 'Mountain backdrop', 'Reached via Lachung'],
    travelInfo: 'Typically visited as a day trip from Lachung. Conditions vary by season.',
    permitNote:
      'Requires a permit for Indian and foreign tourists. See the Permit Guide for details.',
    bestTimeToVisit: 'Late February to mid-June',
    relatedSlugs: ['lachung', 'zero-point'],
    isActive: true,
  },
  {
    slug: 'zero-point',
    name: 'Zero Point / Yumesamdong',
    tag: 'High altitude',
    district: 'North Sikkim',
    shortDescription: "A high-altitude viewpoint near the region's northern edge.",
    description:
      'Zero Point, also known as Yumesamdong, is a high-altitude viewpoint near the northern edge of the accessible tourist route in this part of Sikkim. It lies beyond Yumthang Valley and is typically the furthest point reached on this route.',
    whyVisit: [
      'High-altitude viewpoint',
      'Furthest accessible point on this route',
      'Beyond Yumthang Valley',
    ],
    highlights: [
      'High-altitude terrain',
      'Mountain viewpoint',
      'End point of the Yumthang route',
    ],
    travelInfo:
      'Typically visited as an extension of a Yumthang Valley trip. Access can be affected by weather and snow conditions.',
    permitNote:
      'Requires a permit for Indian tourists. Not permitted for foreign tourists. See the Permit Guide for details.',
    bestTimeToVisit: 'March to May & October to December',
    relatedSlugs: ['yumthang-valley', 'lachung'],
    isActive: true,
  },
  {
    slug: 'thangu',
    name: 'Thangu',
    tag: 'Remote village',
    district: 'North Sikkim',
    shortDescription: 'A remote valley village en route to Gurudongmar and Chopta.',
    description:
      'Thangu is a remote valley village that lies along the route toward Gurudongmar Lake and Chopta Valley. It is less visited than other popular Sikkim destinations and retains a quieter, more remote character.',
    whyVisit: [
      'Quieter, less visited valley village',
      'En route to Gurudongmar Lake',
      'En route to Chopta Valley',
    ],
    highlights: [
      'Remote valley setting',
      'Gateway to Chopta Valley',
      'Gateway to Gurudongmar Lake',
    ],
    travelInfo:
      'Typically reached from Lachen as part of the northern circuit. Road conditions can vary with season.',
    permitNote:
      'Requires a permit for Indian and foreign tourists. See the Permit Guide for details.',
    bestTimeToVisit: 'May to June & September to October',
    relatedSlugs: ['chopta-valley', 'gurudongmar-lake'],
    isActive: true,
  },
  {
    slug: 'chopta-valley',
    name: 'Chopta Valley',
    tag: 'Alpine meadow',
    district: 'North Sikkim',
    shortDescription: 'A high alpine meadow beyond Thangu, less visited than Yumthang.',
    description:
      'Chopta Valley is a high alpine meadow located beyond Thangu. It is less frequently visited than Yumthang Valley and offers a quieter alternative within the same general region.',
    whyVisit: [
      'High alpine meadow landscape',
      'Less visited than Yumthang Valley',
      'Quieter alpine alternative within Sikkim',
    ],
    highlights: [
      'Alpine meadow terrain',
      'Located beyond Thangu',
      'Less crowded than other valleys',
    ],
    travelInfo:
      'Typically reached from Thangu. Access and conditions can vary by season.',
    permitNote:
      'Requires a permit for Indian and foreign tourists. See the Permit Guide for details.',
    bestTimeToVisit: 'May to September',
    relatedSlugs: ['thangu', 'gurudongmar-lake'],
    isActive: true,
  },
  {
    slug: 'gurudongmar-lake',
    name: 'Gurudongmar Lake',
    tag: 'Sacred lake',
    district: 'North Sikkim',
    shortDescription: 'One of the highest lakes in the region, held sacred locally.',
    description:
      'Gurudongmar Lake is one of the higher-altitude lakes in the region and is considered sacred by local communities. It is typically reached from Lachen via Thangu and is among the most revered and iconic destinations in Sikkim.',
    whyVisit: [
      'One of the highest lakes in the region',
      'Considered sacred locally',
      'A renowned Sikkim high-altitude landmark',
    ],
    highlights: [
      'High-altitude sacred lake',
      'Reached via Lachen and Thangu',
      'Notable Sikkim landmark',
    ],
    travelInfo:
      'Typically reached as part of a Lachen-based itinerary. Altitude and weather conditions can affect access.',
    permitNote:
      'Requires a permit for Indian tourists. Not permitted for foreign tourists. See the Permit Guide for details.',
    bestTimeToVisit: 'April to June & October to November',
    relatedSlugs: ['lachen', 'thangu'],
    isActive: true,
  },
  {
    slug: 'dzongu',
    name: 'Dzongu',
    tag: 'Protected reserve',
    district: 'North Sikkim',
    shortDescription: 'A reserve for the Lepcha community, rich in biodiversity.',
    description:
      'Dzongu is a protected reserve set aside for the Lepcha community, known for its biodiversity. Access is regulated, and travel here is generally more restricted than other popular Sikkim destinations.',
    whyVisit: [
      'Protected reserve with notable biodiversity',
      'Culturally significant to the Lepcha community',
      'A more regulated, less commercial destination',
    ],
    highlights: [
      'Protected biodiversity reserve',
      'Lepcha community area',
      'Regulated access',
    ],
    travelInfo:
      'Access is regulated and generally requires prior arrangement. Conditions vary by season.',
    permitNote:
      'Requires a permit for Indian tourists. Restricted access for foreign tourists (maximum stay applies). See the Permit Guide for details.',
    bestTimeToVisit: 'October to May',
    relatedSlugs: ['lachen', 'lachung'],
    isActive: true,
  },
  {
    slug: 'green-lake-trek',
    name: 'Green Lake Trek',
    tag: 'Special adventure / trek',
    district: 'North Sikkim',
    shortDescription:
      'A multi-day high-altitude trek toward the Kangchenjunga base — for experienced trekkers only.',
    description:
      'The Green Lake Trek is a multi-day, high-altitude trek that heads toward the base of Kangchenjunga. It is a special adventure activity rather than a standard sightseeing trip, and is intended for experienced trekkers.',
    whyVisit: [
      'A high-altitude trekking experience toward the Kangchenjunga base',
      'Suited to experienced trekkers seeking a multi-day route',
      'A distinct adventure activity, separate from standard sightseeing',
    ],
    highlights: [
      'Multi-day high-altitude trek',
      'Kangchenjunga base approach',
      'For experienced trekkers only',
    ],
    travelInfo:
      'This is a multi-day trekking itinerary rather than a single-day visit. Suitability depends on trekking experience and fitness.',
    permitNote:
      'Requires special mountaineering/adventure clearance, separate from standard tourist permits. See the Permit Guide for details.',
    bestTimeToVisit: 'April to May & October to November',
    relatedSlugs: ['gurudongmar-lake', 'thangu'],
    isActive: true,
  },
];

async function seedDestinations() {
  const mongoUri =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lama-bhaila';

  console.log(`Connecting to MongoDB at: ${mongoUri}`);
  await mongoose.connect(mongoUri);

  console.log('Seeding Sikkim curated destinations...');
  let upsertedCount = 0;

  for (const item of destinationsData) {
    const result = await Destination.findOneAndUpdate(
      { slug: item.slug },
      { $set: item },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    upsertedCount++;
    console.log(`✓ Seeded: ${result.name} (${result.slug})`);
  }

  console.log(`\nSuccessfully seeded ${upsertedCount} destinations.`);
  await mongoose.disconnect();
  console.log('Database connection closed.');
}

if (require.main === module) {
  seedDestinations().catch((err) => {
    console.error('Failed to seed destinations:', err);
    process.exit(1);
  });
}

module.exports = { seedDestinations, destinationsData };
