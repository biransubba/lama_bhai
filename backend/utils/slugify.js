/**
 * Generates URL-friendly slug from title
 * @param {string} text - Input text
 * @returns {string} - Clean URL slug
 */
function createSlug(text) {
  if (!text || typeof text !== 'string') {
    return `item-${Date.now().toString(36)}`;
  }

  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-word characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // collapse spaces and dashes into a single dash
    .replace(/^-+|-+$/g, ''); // trim leading and trailing dashes
}

module.exports = { createSlug };
