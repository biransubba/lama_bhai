/**
 * imageProcessor.js
 * 
 * Modular image optimization pipeline for Lama Bhai Tourism.
 * Provides client-side validation, high-quality WebP & AVIF conversion,
 * responsive variant generation, and picture-source metadata construction.
 * 
 * Quality guidelines:
 * - WebP: 0.80 - 0.88 (default 0.84) - rich tones for Himalayan photography
 * - AVIF: 0.75 - 0.85 (default 0.80) - cutting-edge efficiency with pristine detail
 * - Sensible downscaling preserving photography sharpness
 */

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB max raw upload
const DEFAULT_AVIF_QUALITY = 0.80;
const DEFAULT_WEBP_QUALITY = 0.84;
const DEFAULT_JPEG_QUALITY = 0.85;

export const BREAKPOINTS = {
  THUMBNAIL: 420,  // cards on mobile / thumb grids
  PREVIEW: 840,    // cards on tablet / half-screen
  FULL: 1440,      // hero / full-width detail
  MAX_RAW: 2048,   // preserve maximum detail for pristine zoom
};

let _hasAvifCanvasSupport = null;
let _hasWebpCanvasSupport = null;

/**
 * Checks if the browser canvas can encode to AVIF.
 */
export function isAvifCanvasSupported() {
  if (_hasAvifCanvasSupport !== null) return _hasAvifCanvasSupport;
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    const uri = c.toDataURL("image/avif");
    _hasAvifCanvasSupport = typeof uri === "string" && uri.startsWith("data:image/avif");
  } catch {
    _hasAvifCanvasSupport = false;
  }
  return _hasAvifCanvasSupport;
}

/**
 * Checks if the browser canvas can encode to WebP.
 */
export function isWebpCanvasSupported() {
  if (_hasWebpCanvasSupport !== null) return _hasWebpCanvasSupport;
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    const uri = c.toDataURL("image/webp");
    _hasWebpCanvasSupport = typeof uri === "string" && uri.startsWith("data:image/webp");
  } catch {
    _hasWebpCanvasSupport = false;
  }
  return _hasWebpCanvasSupport;
}

/**
 * Formats byte size into human readable string.
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Validates an image file before processing.
 * Checks file type, file size bounds, and dimensions.
 * 
 * @param {File|Blob} file 
 * @param {object} [options]
 * @returns {Promise<{ isValid: boolean, error?: string, width?: number, height?: number, size?: number, type?: string }>}
 */
export async function validateImage(file, options = {}) {
  const maxBytes = options.maxSizeBytes || MAX_FILE_SIZE_BYTES;
  const allowedTypes = options.allowedTypes || [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/avif",
    "image/heic",
    "image/heif"
  ];

  if (!file) {
    return { isValid: false, error: "No image file provided." };
  }

  // Type check (allow loose fallback if mime is missing or generic octet-stream with image extension)
  const isImageMime = file.type && file.type.startsWith("image/");
  const hasImageExt = file.name && /\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name);
  if (!isImageMime && !hasImageExt) {
    return {
      isValid: false,
      error: "Please upload an image file (JPEG, PNG, WebP, or AVIF)."
    };
  }

  if (file.size > maxBytes) {
    return {
      isValid: false,
      error: `Image size (${formatBytes(file.size)}) exceeds the maximum allowed ${formatBytes(maxBytes)}.`
    };
  }

  // Load image to test decode and inspect dimensions
  try {
    const img = await loadImageElement(file);
    const minW = options.minWidth || 50;
    const minH = options.minHeight || 50;
    if (img.width < minW || img.height < minH) {
      return {
        isValid: false,
        error: `Image dimensions (${img.width}x${img.height}px) are too small. Minimum required: ${minW}x${minH}px.`
      };
    }

    return {
      isValid: true,
      width: img.width,
      height: img.height,
      aspectRatio: Number((img.width / img.height).toFixed(3)),
      size: file.size,
      type: file.type || "image/jpeg"
    };
  } catch (err) {
    return {
      isValid: false,
      error: "Could not decode image. The file may be corrupt or an unsupported format."
    };
  }
}

/**
 * Loads an image from File, Blob, DataURL, or Object URL into an HTMLImageElement.
 */
export function loadImageElement(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let cleanup = null;

    img.onload = () => {
      if (cleanup) cleanup();
      resolve(img);
    };
    img.onerror = (e) => {
      if (cleanup) cleanup();
      reject(new Error("Failed to load image source into Image element"));
    };

    if (typeof source === "string") {
      img.src = source;
    } else if (source instanceof Blob || source instanceof File) {
      const url = URL.createObjectURL(source);
      cleanup = () => URL.revokeObjectURL(url);
      img.src = url;
    } else {
      reject(new Error("Unsupported source passed to loadImageElement"));
    }
  });
}

/**
 * Renders an Image or Canvas to a target Canvas at scaled dimensions.
 */
function renderToCanvas(imgSource, targetWidth, targetHeight) {
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Could not acquire 2D canvas context.");

  // Image smoothing quality high for Himalayan landscape sharpness
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(imgSource, 0, 0, targetWidth, targetHeight);
  return canvas;
}

/**
 * Encodes canvas to AVIF with fallback detection.
 * 
 * @param {HTMLCanvasElement|HTMLImageElement} source
 * @param {object} [options]
 * @returns {Promise<{ dataUrl: string, mimeType: string, width: number, height: number, bytes: number, isNativeAvif: boolean }>}
 */
export async function createAVIF(source, options = {}) {
  const quality = options.quality !== undefined ? options.quality : DEFAULT_AVIF_QUALITY;
  let canvas;
  if (source instanceof HTMLCanvasElement) {
    canvas = source;
  } else {
    canvas = renderToCanvas(source, source.naturalWidth || source.width, source.naturalHeight || source.height);
  }

  const supportsAvif = isAvifCanvasSupported();
  let mimeType = supportsAvif ? "image/avif" : (isWebpCanvasSupported() ? "image/webp" : "image/jpeg");
  let dataUrl;

  try {
    dataUrl = canvas.toDataURL(mimeType, quality);
    if (!dataUrl.startsWith(`data:${mimeType}`)) {
      // Browser silently ignored format and gave PNG
      mimeType = isWebpCanvasSupported() ? "image/webp" : "image/jpeg";
      dataUrl = canvas.toDataURL(mimeType, quality);
    }
  } catch {
    mimeType = "image/jpeg";
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  const approxBytes = Math.round((dataUrl.length * 3) / 4);
  return {
    dataUrl,
    mimeType,
    width: canvas.width,
    height: canvas.height,
    bytes: approxBytes,
    isNativeAvif: mimeType === "image/avif"
  };
}

/**
 * Encodes canvas to WebP with JPEG fallback.
 * 
 * @param {HTMLCanvasElement|HTMLImageElement} source
 * @param {object} [options]
 * @returns {Promise<{ dataUrl: string, mimeType: string, width: number, height: number, bytes: number }>}
 */
export async function createWebP(source, options = {}) {
  const quality = options.quality !== undefined ? options.quality : DEFAULT_WEBP_QUALITY;
  let canvas;
  if (source instanceof HTMLCanvasElement) {
    canvas = source;
  } else {
    canvas = renderToCanvas(source, source.naturalWidth || source.width, source.naturalHeight || source.height);
  }

  const supportsWebp = isWebpCanvasSupported();
  let mimeType = supportsWebp ? "image/webp" : "image/jpeg";
  let dataUrl;

  try {
    dataUrl = canvas.toDataURL(mimeType, quality);
    if (!dataUrl.startsWith(`data:${mimeType}`)) {
      mimeType = "image/jpeg";
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }
  } catch {
    mimeType = "image/jpeg";
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  const approxBytes = Math.round((dataUrl.length * 3) / 4);
  return {
    dataUrl,
    mimeType,
    width: canvas.width,
    height: canvas.height,
    bytes: approxBytes
  };
}

/**
 * Generates responsive variants (thumbnail, preview, full display)
 * in WebP, AVIF (if supported), and clean JPEG.
 * 
 * @param {File|Blob|HTMLImageElement|string} source 
 * @param {object} [options]
 * @returns {Promise<object>}
 */
export async function createResponsiveVariants(source, options = {}) {
  let img;
  if (source instanceof HTMLCanvasElement) {
    img = source;
  } else if (source instanceof HTMLImageElement && source.complete && source.naturalWidth > 0) {
    img = source;
  } else {
    img = await loadImageElement(source);
  }

  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;
  const aspect = origWidth / origHeight;

  // Compute dimensions preserving aspect ratio
  function getDims(maxWidth) {
    if (origWidth <= maxWidth) {
      return { width: origWidth, height: origHeight };
    }
    const width = maxWidth;
    const height = Math.round(maxWidth / aspect);
    return { width, height };
  }

  const sizes = {
    thumbnail: getDims(options.thumbnailWidth || BREAKPOINTS.THUMBNAIL),
    preview: getDims(options.previewWidth || BREAKPOINTS.PREVIEW),
    full: getDims(options.fullWidth || BREAKPOINTS.FULL),
  };

  const avifQ = options.avifQuality || DEFAULT_AVIF_QUALITY;
  const webpQ = options.webpQuality || DEFAULT_WEBP_QUALITY;
  const jpegQ = options.jpegQuality || DEFAULT_JPEG_QUALITY;

  const variants = {};

  for (const [key, dim] of Object.entries(sizes)) {
    const canvas = renderToCanvas(img, dim.width, dim.height);

    // Primary: AVIF
    const avifResult = await createAVIF(canvas, { quality: avifQ });

    // Fallback: WebP
    const webpResult = await createWebP(canvas, { quality: webpQ });

    // Legacy Fallback: JPEG
    const jpegDataUrl = canvas.toDataURL("image/jpeg", jpegQ);
    const jpegBytes = Math.round((jpegDataUrl.length * 3) / 4);

    variants[key] = {
      width: dim.width,
      height: dim.height,
      avif: avifResult.dataUrl,
      webp: webpResult.dataUrl,
      jpeg: jpegDataUrl,
      bestUrl: avifResult.isNativeAvif ? avifResult.dataUrl : webpResult.dataUrl,
      bytes: {
        avif: avifResult.bytes,
        webp: webpResult.bytes,
        jpeg: jpegBytes
      }
    };
  }

  return {
    originalWidth: origWidth,
    originalHeight: origHeight,
    aspectRatio: Number(aspect.toFixed(3)),
    variants,
    // Convenient shortcut references
    thumbnail: variants.thumbnail.bestUrl,
    preview: variants.preview.bestUrl,
    full: variants.full.bestUrl,
    fallback: variants.full.jpeg,
    dataUrl: variants.full.bestUrl,
  };
}

/**
 * Normalizes any asset input into an optimized picture metadata descriptor.
 * Can take a string URL, a data URL, an object with variants, or a raw file.
 * 
 * @param {string|object} asset 
 * @param {object} [options]
 * @returns {object} { src, avifSrc, webpSrc, fallbackSrc, srcSet, sizes, width, height, aspectRatio, hasPictureSources }
 */
export function getOptimizedImage(asset, options = {}) {
  if (!asset) {
    return {
      src: "",
      avifSrc: "",
      webpSrc: "",
      fallbackSrc: "",
      srcSet: "",
      sizes: options.sizes || "100vw",
      width: options.width || undefined,
      height: options.height || undefined,
      hasPictureSources: false,
    };
  }

  // If asset is already a variants descriptor object
  if (typeof asset === "object") {
    if (asset.variants) {
      const v = asset.variants;
      const avifSrcSet = [
        v.thumbnail?.avif ? `${v.thumbnail.avif} ${v.thumbnail.width}w` : null,
        v.preview?.avif ? `${v.preview.avif} ${v.preview.width}w` : null,
        v.full?.avif ? `${v.full.avif} ${v.full.width}w` : null,
      ].filter(Boolean).join(", ");

      const webpSrcSet = [
        v.thumbnail?.webp ? `${v.thumbnail.webp} ${v.thumbnail.width}w` : null,
        v.preview?.webp ? `${v.preview.webp} ${v.preview.width}w` : null,
        v.full?.webp ? `${v.full.webp} ${v.full.width}w` : null,
      ].filter(Boolean).join(", ");

      const jpegSrcSet = [
        v.thumbnail?.jpeg ? `${v.thumbnail.jpeg} ${v.thumbnail.width}w` : null,
        v.preview?.jpeg ? `${v.preview.jpeg} ${v.preview.width}w` : null,
        v.full?.jpeg ? `${v.full.jpeg} ${v.full.width}w` : null,
      ].filter(Boolean).join(", ");

      return {
        src: v.full?.bestUrl || asset.dataUrl || asset.src || "",
        avifSrc: v.full?.avif || "",
        avifSrcSet: avifSrcSet || undefined,
        webpSrc: v.full?.webp || "",
        webpSrcSet: webpSrcSet || undefined,
        fallbackSrc: v.full?.jpeg || asset.fallback || asset.dataUrl || "",
        fallbackSrcSet: jpegSrcSet || undefined,
        sizes: options.sizes || "(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw",
        width: asset.originalWidth || v.full?.width,
        height: asset.originalHeight || v.full?.height,
        aspectRatio: asset.aspectRatio,
        hasPictureSources: Boolean(v.full?.avif || v.full?.webp),
      };
    }

    // Object with direct properties
    const directUrl = asset.dataUrl || asset.src || asset.url || "";
    return getOptimizedImage(directUrl, options);
  }

  const urlStr = String(asset);

  // If already an AVIF or WebP or Data URL
  const isAvif = urlStr.endsWith(".avif") || urlStr.startsWith("data:image/avif");
  const isWebp = urlStr.endsWith(".webp") || urlStr.startsWith("data:image/webp");

  return {
    src: urlStr,
    avifSrc: isAvif ? urlStr : "",
    webpSrc: isWebp ? urlStr : "",
    fallbackSrc: urlStr,
    sizes: options.sizes || "100vw",
    width: options.width || undefined,
    height: options.height || undefined,
    hasPictureSources: isAvif || isWebp,
  };
}
