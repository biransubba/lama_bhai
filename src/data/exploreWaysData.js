import exploreCarsImg from "url:../assets/images/explore/explore-cars.png";
import exploreStaysImg from "url:../assets/images/explore/explore-stays.png";
import exploreBikesImg from "url:../assets/images/explore/explore-bikes.png";
import explorePermitsImg from "url:../assets/images/explore/explore-permits.png";

export const DEFAULT_EXPLORE_WAYS = [
  {
    id: "cars",
    title: "Cars & 4x4 Mountain SUVs",
    desc: "Comfortable high-clearance 4x4 vehicles and experienced local mountain drivers for all Sikkim sectors.",
    tag: "4x4 Fleet & Boleros",
    badge: "Local Mountain Drivers",
    image: exploreCarsImg,
    cta: "Explore cars",
    path: "/car-booking",
  },
  {
    id: "stays",
    title: "Curated Stays & Homestays",
    desc: "Authentic wooden cottages, warm family homestays, and boutique mountain lodges across scenic valleys.",
    tag: "Traditional Stays",
    badge: "Vetted Himalayan Stays",
    image: exploreStaysImg,
    cta: "Explore stays",
    path: "/hotel-homestay",
  },
  {
    id: "bikes",
    title: "Motorcycles & Adventure Bikes",
    desc: "Royal Enfield Himalayan touring motorcycles built for Sikkim's high alpine roads and winding passes.",
    tag: "Royal Enfield Fleet",
    badge: "Adventure Ready",
    image: exploreBikesImg,
    cta: "Explore bikes",
    path: "/rental-bike",
  },
  {
    id: "permits",
    title: "Permits & Protected Passes",
    desc: "Protected Area Permit (PAP) guidance and hassle-free document clearance for Indian and Foreign tourists.",
    tag: "Border Passes & PAP",
    badge: "Instant PAP Support",
    image: explorePermitsImg,
    cta: "Check permits",
    path: "/permit",
  },
];

const STORAGE_KEY = "lama_bhai_explore_ways";

export function getExploreWays() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_EXPLORE_WAYS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_EXPLORE_WAYS;

    // Merge parsed with defaults to ensure all properties & images exist
    return DEFAULT_EXPLORE_WAYS.map((defItem) => {
      const match = parsed.find((p) => p.id === defItem.id);
      if (!match) return defItem;
      return {
        ...defItem,
        ...match,
        // If image was cleared or empty, fall back to default bundled PNG
        image: match.image || defItem.image,
      };
    });
  } catch (err) {
    console.warn("Failed to load explore ways from storage, using defaults:", err);
    return DEFAULT_EXPLORE_WAYS;
  }
}

export function saveExploreWays(waysList) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(waysList));
    window.dispatchEvent(new Event("explore-ways-changed"));
    window.dispatchEvent(new Event("admin-storage-changed"));
    window.dispatchEvent(new Event("storage"));
    return true;
  } catch (err) {
    console.error("Failed to save explore ways to storage:", err);
    return false;
  }
}

export function resetExploreWays() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("explore-ways-changed"));
    window.dispatchEvent(new Event("admin-storage-changed"));
    window.dispatchEvent(new Event("storage"));
    return DEFAULT_EXPLORE_WAYS;
  } catch (err) {
    console.error("Failed to reset explore ways:", err);
    return DEFAULT_EXPLORE_WAYS;
  }
}
