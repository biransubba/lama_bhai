import lachenCover from "url:../assets/images/destinations/lachen-cover.png";
import lachenGal1 from "url:../assets/images/destinations/lachen-gal-1.png";
import lachenGal2 from "url:../assets/images/destinations/lachen-gal-2.png";

import lachungCover from "url:../assets/images/destinations/lachung-cover.png";
import lachungGal1 from "url:../assets/images/destinations/lachung-gal-1.png";
import lachungGal2 from "url:../assets/images/destinations/lachung-gal-2.png";

import yumthangCover from "url:../assets/images/destinations/yumthang-valley-cover.png";
import yumthangGal1 from "url:../assets/images/destinations/yumthang-valley-gal-1.png";
import yumthangGal2 from "url:../assets/images/destinations/yumthang-valley-gal-2.png";

import zeroPointCover from "url:../assets/images/destinations/zero-point-cover.png";
import zeroPointGal1 from "url:../assets/images/destinations/zero-point-gal-1.png";
import zeroPointGal2 from "url:../assets/images/destinations/zero-point-gal-2.png";

import thanguCover from "url:../assets/images/destinations/thangu-cover.png";
import thanguGal1 from "url:../assets/images/destinations/thangu-gal-1.png";
import thanguGal2 from "url:../assets/images/destinations/thangu-gal-2.png";

import choptaCover from "url:../assets/images/destinations/chopta-valley-cover.png";
import choptaGal1 from "url:../assets/images/destinations/chopta-valley-gal-1.png";
import choptaGal2 from "url:../assets/images/destinations/chopta-valley-gal-2.png";

import gurudongmarCover from "url:../assets/images/destinations/gurudongmar-lake-cover.png";
import gurudongmarGal1 from "url:../assets/images/destinations/gurudongmar-lake-gal-1.png";
import gurudongmarGal2 from "url:../assets/images/destinations/gurudongmar-lake-gal-2.png";

import dzonguCover from "url:../assets/images/destinations/dzongu-cover.png";
import dzonguGal1 from "url:../assets/images/destinations/dzongu-gal-1.png";
import dzonguGal2 from "url:../assets/images/destinations/dzongu-gal-2.png";

import greenLakeCover from "url:../assets/images/destinations/green-lake-trek-cover.png";
import greenLakeGal1 from "url:../assets/images/destinations/green-lake-trek-gal-1.png";
import greenLakeGal2 from "url:../assets/images/destinations/green-lake-trek-gal-2.png";

/**
 * Universal safe unwrapper for bundled URLs across Parcel, ES modules, or data URLs.
 */
export function unwrapImageUrl(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    if (typeof val.default === "string") return val.default;
    if (typeof val.dataUrl === "string") return val.dataUrl;
    if (typeof val.src === "string") return val.src;
    if (typeof val.url === "string") return val.url;
    if (val.default && typeof val.default === "object") return unwrapImageUrl(val.default);
  }
  return "";
}

export const DEFAULT_DESTINATION_PHOTOS = {
  "lachen": {
    cover: lachenCover,
    gallery: [
      { id: "lachen_cover", src: lachenCover, alt: "Lachen Himalayan Village", category: "Cover" },
      { id: "lachen_gal_1", src: lachenGal1, alt: "Pine forests and mountain peaks in Lachen", category: "Alpine View" },
      { id: "lachen_gal_2", src: lachenGal2, alt: "Teesta river valley near Lachen", category: "Valley Landscape" },
    ],
  },
  "lachung": {
    cover: lachungCover,
    gallery: [
      { id: "lachung_cover", src: lachungCover, alt: "Lachung Mountain Village", category: "Cover" },
      { id: "lachung_gal_1", src: lachungGal1, alt: "Snowy peaks surrounding Lachung", category: "Mountain Vista" },
      { id: "lachung_gal_2", src: lachungGal2, alt: "Terraced orchards and valley trail in Lachung", category: "Orchards & Valley" },
    ],
  },
  "yumthang-valley": {
    cover: yumthangCover,
    gallery: [
      { id: "yumthang_cover", src: yumthangCover, alt: "Yumthang Valley of Flowers", category: "Cover" },
      { id: "yumthang_gal_1", src: yumthangGal1, alt: "Alpine river meandering through Yumthang", category: "River & Meadow" },
      { id: "yumthang_gal_2", src: yumthangGal2, alt: "Golden sun over Yumthang valley floor", category: "Valley Vista" },
    ],
  },
  "zero-point": {
    cover: zeroPointCover,
    gallery: [
      { id: "zero_point_cover", src: zeroPointCover, alt: "Zero Point Yumesamdong High Altitude Snow", category: "Cover" },
      { id: "zero_point_gal_1", src: zeroPointGal1, alt: "Frozen mountain pass at 15,300 ft", category: "Mountain Pass" },
      { id: "zero_point_gal_2", src: zeroPointGal2, alt: "Snow-covered peaks at the edge of Sikkim", category: "Glacier Ridge" },
    ],
  },
  "thangu": {
    cover: thanguCover,
    gallery: [
      { id: "thangu_cover", src: thanguCover, alt: "Thangu Remote Valley Village", category: "Cover" },
      { id: "thangu_gal_1", src: thanguGal1, alt: "Pristine streams and high alpine vegetation in Thangu", category: "High Valley" },
      { id: "thangu_gal_2", src: thanguGal2, alt: "Rocky crags and tranquil settlement of Thangu", category: "Village Outpost" },
    ],
  },
  "chopta-valley": {
    cover: choptaCover,
    gallery: [
      { id: "chopta_cover", src: choptaCover, alt: "Chopta Valley Alpine Meadow", category: "Cover" },
      { id: "chopta_gal_1", src: choptaGal1, alt: "Golden afternoon light on Chopta meadow", category: "Alpine Grasslands" },
      { id: "chopta_gal_2", src: choptaGal2, alt: "Rolling slopes and sub-alpine pine slopes of Chopta", category: "Meadow Slopes" },
    ],
  },
  "gurudongmar-lake": {
    cover: gurudongmarCover,
    gallery: [
      { id: "gurudongmar_cover", src: gurudongmarCover, alt: "Sacred Glacial Lake Gurudongmar (17,800 ft)", category: "Cover" },
      { id: "gurudongmar_gal_1", src: gurudongmarGal1, alt: "Pristine azure reflection of Mount Kangchengyao", category: "Sacred Waters" },
      { id: "gurudongmar_gal_2", src: gurudongmarGal2, alt: "High altitude plateau around Gurudongmar", category: "Himalayan Ridge" },
    ],
  },
  "dzongu": {
    cover: dzonguCover,
    gallery: [
      { id: "dzongu_cover", src: dzonguCover, alt: "Dzongu Lepcha Protected Reserve", category: "Cover" },
      { id: "dzongu_gal_1", src: dzonguGal1, alt: "Lush ancient rainforest canopy in Dzongu", category: "Protected Flora" },
      { id: "dzongu_gal_2", src: dzonguGal2, alt: "Cascading streams and terraced hills of Dzongu", category: "Mountain Stream" },
    ],
  },
  "green-lake-trek": {
    cover: greenLakeCover,
    gallery: [
      { id: "green_lake_cover", src: greenLakeCover, alt: "Green Lake Trek toward Kangchenjunga", category: "Cover" },
      { id: "green_lake_gal_1", src: greenLakeGal1, alt: "Glacial moraines and high altitude trekking trail", category: "Moraine Trail" },
      { id: "green_lake_gal_2", src: greenLakeGal2, alt: "Mountaineering campsite beneath Himalayan peaks", category: "Expedition Camp" },
    ],
  },
};

export function getDefaultDestinationPhotos(slug) {
  const item = DEFAULT_DESTINATION_PHOTOS[slug];
  if (!item) return { cover: "", gallery: [] };
  const cover = unwrapImageUrl(item.cover);
  const gallery = (item.gallery || []).map((g, idx) => ({
    id: g.id || `gal_${slug}_${idx}`,
    src: unwrapImageUrl(g.src) || cover,
    alt: g.alt || `${slug} photo`,
    category: g.category || "Scenic View",
  })).filter((g) => Boolean(g.src));
  return { cover, gallery };
}

