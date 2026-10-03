/**
 * Contact & Social Channels Repository & Helpers
 * Stored in localStorage under "lamabhai_admin_settings"
 * Managed dynamically by Main Admin in Admin -> Settings
 */

const STORAGE_KEY = "lamabhai_admin_settings";
const ACTIVE_LOGO_STORAGE_KEY = "lamabhai_active_logo";

// There is NO default logo. The website only uses the admin's uploaded logo.
export const DEFAULT_LOGO = null;

export const DEFAULT_CONTACT_SETTINGS = {
  phone: "+91 98000 12345",
  whatsapp: "+91 98000 12345",
  instagram: "https://www.instagram.com/lamabhaitourism",
  facebook: "https://www.facebook.com/lamabhaitourism",
  contactEmail: "contact@lamabhaitourism.com",
  locationBadge: "Sikkim • Eastern Himalayas",
  heroImageCustom: null,
  logoCustom: null,
  logoHeight: 78, // Bold & prominent brand presence
  logoShape: "natural", // "natural" (all shapes: rectangular, oval, horizontal, badge) | "rounded" | "circle"
  logoPlaqueStyle: "transparent", // Clean seamless floating emblem directly on the navbar
  showBrandText: true, // Elegant brand typography ("Lama Bhai • Tours & Travels Sikkim")
  logoOverhang: false, // Strictly contained within navbar boundary (zero overhang)
  operatingHours: "7:00 AM – 9:00 PM IST (Daily)",
  operatingLocation: "Gangtok / Mangan, North Sikkim",
  copyrightYear: "2026",
};

export function getContactSettings() {
  if (typeof window === "undefined" || !window.localStorage) {
    return { ...DEFAULT_CONTACT_SETTINGS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const activeLogo = localStorage.getItem(ACTIVE_LOGO_STORAGE_KEY);
    if (!raw) {
      return {
        ...DEFAULT_CONTACT_SETTINGS,
        logoCustom: activeLogo || null,
      };
    }
    const parsed = JSON.parse(raw);
    const logo = parsed.logoCustom || activeLogo || null;
    return {
      phone: parsed.phone || parsed.contactPhone || DEFAULT_CONTACT_SETTINGS.phone,
      whatsapp: parsed.whatsapp || DEFAULT_CONTACT_SETTINGS.whatsapp,
      instagram: parsed.instagram || DEFAULT_CONTACT_SETTINGS.instagram,
      facebook: parsed.facebook || DEFAULT_CONTACT_SETTINGS.facebook,
      contactEmail: parsed.contactEmail || parsed.email || DEFAULT_CONTACT_SETTINGS.contactEmail,
      locationBadge: parsed.locationBadge || DEFAULT_CONTACT_SETTINGS.locationBadge,
      heroImageCustom: parsed.heroImageCustom || null,
      logoCustom: logo,
      logoHeight: parsed.logoHeight !== undefined ? Number(parsed.logoHeight) : DEFAULT_CONTACT_SETTINGS.logoHeight,
      logoShape: parsed.logoShape || DEFAULT_CONTACT_SETTINGS.logoShape,
      logoPlaqueStyle: parsed.logoPlaqueStyle && parsed.logoPlaqueStyle !== "landscape-fade" ? parsed.logoPlaqueStyle : "transparent",
      showBrandText: parsed.showBrandText !== undefined ? Boolean(parsed.showBrandText) : DEFAULT_CONTACT_SETTINGS.showBrandText,
      logoOverhang: false, // Permanently contained, zero overhang
      operatingHours: parsed.operatingHours || DEFAULT_CONTACT_SETTINGS.operatingHours,
      operatingLocation: parsed.operatingLocation || DEFAULT_CONTACT_SETTINGS.operatingLocation,
      copyrightYear: parsed.copyrightYear !== undefined ? parsed.copyrightYear : DEFAULT_CONTACT_SETTINGS.copyrightYear,
    };
  } catch (err) {
    console.warn("[contactSettings] Error loading settings:", err);
    return { ...DEFAULT_CONTACT_SETTINGS };
  }
}

export function getSiteLogo() {
  const settings = getContactSettings();
  return settings.logoCustom || null;
}

export function getSiteLogoDetails() {
  const settings = getContactSettings();
  return {
    src: settings.logoCustom || null,
    isCustom: Boolean(settings.logoCustom),
    height: settings.logoHeight || 78,
    shape: settings.logoShape || "natural",
    plaqueStyle: settings.logoPlaqueStyle || "transparent",
    showBrandText: settings.showBrandText !== undefined ? settings.showBrandText : true,
    overhang: false, // Zero crossing of navbar bottom line
  };
}

export function saveContactSettings(newSettings) {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    const current = getContactSettings();
    const updated = {
      ...current,
      ...newSettings,
      // Keep legacy keys in sync for backwards compatibility
      contactPhone: newSettings.phone || current.phone,
      contactEmail: newSettings.contactEmail || current.contactEmail,
      heroImageCustom: newSettings.heroImageCustom !== undefined ? newSettings.heroImageCustom : current.heroImageCustom,
      logoCustom: newSettings.logoCustom !== undefined ? newSettings.logoCustom : current.logoCustom,
      logoHeight: newSettings.logoHeight !== undefined ? Number(newSettings.logoHeight) : current.logoHeight,
      logoShape: newSettings.logoShape !== undefined ? newSettings.logoShape : current.logoShape,
      logoPlaqueStyle: newSettings.logoPlaqueStyle !== undefined ? newSettings.logoPlaqueStyle : current.logoPlaqueStyle,
      showBrandText: newSettings.showBrandText !== undefined ? Boolean(newSettings.showBrandText) : current.showBrandText,
      logoOverhang: newSettings.logoOverhang !== undefined ? Boolean(newSettings.logoOverhang) : current.logoOverhang,
      copyrightYear: newSettings.copyrightYear !== undefined ? newSettings.copyrightYear : current.copyrightYear,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (updated.logoCustom) {
        localStorage.setItem(ACTIVE_LOGO_STORAGE_KEY, updated.logoCustom);
      } else if (newSettings.logoCustom === null) {
        localStorage.removeItem(ACTIVE_LOGO_STORAGE_KEY);
      }
    } catch (quotaErr) {
      console.warn("[contactSettings] Storage quota exceeded on first attempt, auto-trimming:", quotaErr);
      // If quota exceeded, reset huge heroImageCustom if present to prioritize brand logo
      const optimized = { ...updated };
      if (optimized.heroImageCustom && optimized.heroImageCustom.length > 250000) {
        optimized.heroImageCustom = null;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(optimized));
      } catch (secondErr) {
        console.warn("[contactSettings] Second attempt failed, trimming hero completely:", secondErr);
        optimized.heroImageCustom = null;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(optimized));
        } catch (finalErr) {
          console.error("[contactSettings] Could not save even after trimming:", finalErr);
          return false;
        }
      }
    }

    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("admin-storage-changed", { detail: { key: STORAGE_KEY } }));
      window.dispatchEvent(new Event("storage"));
    }
    return true;
  } catch (err) {
    console.error("[contactSettings] Error saving settings:", err);
    return false;
  }
}

/**
 * Builds a valid tel: protocol link from any phone string or settings object
 */
export function buildPhoneLink(phoneOrSettings) {
  const phone =
    typeof phoneOrSettings === "object" && phoneOrSettings !== null
      ? phoneOrSettings.phone || phoneOrSettings.contactPhone
      : phoneOrSettings;
  if (!phone || typeof phone !== "string") return "tel:+919800012345";
  const cleanDigits = phone.replace(/[^0-9+]/g, "");
  return `tel:${cleanDigits}`;
}

/**
 * Builds a direct wa.me link with friendly default inquiry message
 * Accepts either a whatsapp string or settings object
 */
export function buildWhatsAppLink(
  whatsappOrSettings,
  message = "Hi Lama Bhai, I would like to inquire about Sikkim homestays, cabs, and permits."
) {
  const num =
    typeof whatsappOrSettings === "object" && whatsappOrSettings !== null
      ? whatsappOrSettings.whatsapp || whatsappOrSettings.phone
      : whatsappOrSettings;
  if (!num || typeof num !== "string") {
    return `https://wa.me/919800012345?text=${encodeURIComponent(message)}`;
  }
  const cleanDigits = num.replace(/[^0-9]/g, "");
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleanDigits}?text=${encodedMsg}`;
}

/**
 * Normalizes an Instagram handle or URL to a clickable https:// URL
 */
export function buildInstagramLink(val) {
  if (!val) return "https://www.instagram.com/lamabhaitourism";
  const trimmed = val.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, "");
  return `https://www.instagram.com/${handle}/`;
}

/**
 * Normalizes a Facebook page name or URL to a clickable https:// URL
 */
export function buildFacebookLink(val) {
  if (!val) return "https://www.facebook.com/lamabhaitourism";
  const trimmed = val.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://www.facebook.com/${trimmed.replace(/^\//, "")}`;
}

/**
 * Automatically trims empty or uniform whitespace/background borders around logo artwork.
 * This expands the rendered size of the logo by removing dead margins so it fills the display height boldly.
 */
export function trimCanvasWhitespace(sourceCanvas, tolerance = 24) {
  if (!sourceCanvas) return sourceCanvas;
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  if (!width || !height || width < 12 || height < 12) return sourceCanvas;

  const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return sourceCanvas;

  let imgData;
  try {
    imgData = ctx.getImageData(0, 0, width, height);
  } catch (e) {
    return sourceCanvas;
  }

  const data = imgData.data;

  // Sample the 4 corner pixels to determine the background color & transparency
  const corners = [
    0, // top-left
    (width - 1) * 4, // top-right
    (height - 1) * width * 4, // bottom-left
    ((height - 1) * width + (width - 1)) * 4, // bottom-right
  ];

  let avgR = 0, avgG = 0, avgB = 0, avgA = 0;
  let transparentCorners = 0;
  for (const idx of corners) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];
    if (a < 20) transparentCorners++;
    avgR += r;
    avgG += g;
    avgB += b;
    avgA += a;
  }
  avgR = Math.round(avgR / 4);
  avgG = Math.round(avgG / 4);
  avgB = Math.round(avgB / 4);
  avgA = Math.round(avgA / 4);

  const isTransparentBg = transparentCorners >= 2 || avgA < 30;

  function isBackground(r, g, b, a) {
    if (isTransparentBg) {
      return a < 30;
    }
    if (a < 30) return true;
    const diff = Math.max(Math.abs(r - avgR), Math.abs(g - avgG), Math.abs(b - avgB));
    return diff <= tolerance;
  }

  let minX = width, minY = height, maxX = -1, maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (!isBackground(r, g, b, a)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If no content found or invalid bounding box
  if (minX > maxX || minY > maxY) {
    return sourceCanvas;
  }

  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;

  // If trimming saves negligible margin (<4%), retain original
  if (contentWidth > width * 0.96 && contentHeight > height * 0.96) {
    return sourceCanvas;
  }

  // Add small 2% padding around artwork so anti-aliasing edges aren't clipped
  const padX = Math.min(8, Math.max(2, Math.round(contentWidth * 0.02)));
  const padY = Math.min(8, Math.max(2, Math.round(contentHeight * 0.02)));

  const cropX = Math.max(0, minX - padX);
  const cropY = Math.max(0, minY - padY);
  const cropW = Math.min(width - cropX, contentWidth + padX * 2);
  const cropH = Math.min(height - cropY, contentHeight + padY * 2);

  const trimmedCanvas = document.createElement("canvas");
  trimmedCanvas.width = cropW;
  trimmedCanvas.height = cropH;

  const trimmedCtx = trimmedCanvas.getContext("2d");
  if (!trimmedCtx) return sourceCanvas;

  trimmedCtx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return trimmedCanvas;
}

/**
 * Compresses an uploaded logo File, auto-trimming dead margins and preserving transparency (< 60KB)
 */
export async function compressLogoFile(file, maxDimension = 380) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      return reject(new Error("Please select a valid image file (PNG, JPG, SVG, WebP)."));
    }

    // Direct read for SVG to keep scalable vector crispness
    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read SVG file."));
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image for processing."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(e.target.result);

        // Keep transparent background
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Auto-trim empty border padding so artwork fills canvas boldly
        const trimmed = trimCanvasWhitespace(canvas);

        // Prefer webp for ultra lightweight storage while keeping alpha transparency
        let dataUrl = trimmed.toDataURL("image/webp", 0.90);
        if (!dataUrl.startsWith("data:image/webp") || dataUrl.length > 180000) {
          dataUrl = trimmed.toDataURL("image/png");
        }
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Optimizes an existing base64 dataUrl string to auto-trim margins and prevent quota issues
 */
export async function optimizeLogoDataUrl(dataUrl, maxDimension = 380) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    return dataUrl;
  }
  // SVG doesn't need canvas re-compression
  if (dataUrl.startsWith("data:image/svg+xml")) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(dataUrl);
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Auto-trim dead whitespace/background margins
      const trimmed = trimCanvasWhitespace(canvas);

      let out = trimmed.toDataURL("image/webp", 0.88);
      if (!out.startsWith("data:image/webp") || out.length > 180000) {
        out = trimmed.toDataURL("image/png");
      }
      resolve(out);
    };
    img.src = dataUrl;
  });
}

