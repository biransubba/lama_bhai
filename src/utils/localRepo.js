// Generic localStorage-backed repository factory — shared by admin and
// any public pages that need to read admin-managed data.
//
// SAFE HANDLING (Requirement 10):
// - Prevents silent deletion of existing records when data is missing or corrupted.
// - Automatically creates timestamped recovery backups if JSON corruption is detected.
// - Supports safe record normalization so legacy records cleanly receive schema updates.
// - Dispatches "admin-storage-changed" events on all write operations.

const memoryFallback = {};

function readAll(key) {
  if (typeof window === "undefined" || !window.localStorage) {
    return memoryFallback[key] || null;
  }

  const raw = localStorage.getItem(key);
  if (raw === null || raw === undefined) {
    return null; // Key does not exist yet (clean first run)
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn(`[localRepo] Expected array in localStorage for key "${key}", found:`, typeof parsed);
      return Array.isArray(parsed?.data) ? parsed.data : [parsed];
    }
    return parsed;
  } catch (err) {
    console.error(`[localRepo] Corrupt JSON detected in localStorage key "${key}". Preserving backup before recovery.`, err);
    try {
      // Safe preservation: Never silently delete or overwrite user data!
      const backupKey = `${key}_corrupt_bak_${Date.now()}`;
      localStorage.setItem(backupKey, raw);
      console.warn(`[localRepo] Corrupt data backed up to "${backupKey}".`);
    } catch (bakErr) {
      console.error("[localRepo] Failed to save corrupt data backup:", bakErr);
    }
    return null;
  }
}

function writeAll(key, records) {
  if (typeof window === "undefined" || !window.localStorage) {
    memoryFallback[key] = records;
    return true;
  }

  try {
    localStorage.setItem(key, JSON.stringify(records));
    window.dispatchEvent(
      new CustomEvent("admin-storage-changed", { detail: { storageKey: key } })
    );
    return true;
  } catch (err) {
    console.error(`[localRepo] Failed to write records to localStorage key "${key}":`, err);
    return false;
  }
}

/**
 * Creates a reactive, safe repository backed by localStorage.
 *
 * @param {string} storageKey - localStorage key name
 * @param {Array} seedData - Default seed data to initialize if key never existed
 * @param {object} [options] - Configuration options
 * @param {function} [options.normalize] - Function to normalize records on read/write
 * @param {string} [options.idField="id"] - Default ID field
 * @param {boolean} [options.mergeNewSeeds=false] - Whether to merge missing seed records
 */
export function createRepo(storageKey, seedData = [], options = {}) {
  const normalize = typeof options?.normalize === "function" ? options.normalize : (r) => r;
  const defaultIdField = options?.idField || "id";

  function ensureSeeded() {
    const existing = readAll(storageKey);
    if (existing === null) {
      // Key does not exist; initialize with normalized seed data
      const normalizedSeeds = (Array.isArray(seedData) ? seedData : []).map(normalize).filter(Boolean);
      writeAll(storageKey, normalizedSeeds);
      return;
    }

    // If options.mergeNewSeeds is enabled, add any seed records that aren't yet in storage
    if (options?.mergeNewSeeds && Array.isArray(seedData) && seedData.length > 0) {
      const existingIds = new Set(existing.map((r) => r[defaultIdField]));
      const missingSeeds = seedData.filter((s) => !existingIds.has(s[defaultIdField]));
      if (missingSeeds.length > 0) {
        const merged = [...existing, ...missingSeeds.map(normalize).filter(Boolean)];
        writeAll(storageKey, merged);
      }
    }
  }

  return {
    getAll() {
      ensureSeeded();
      const records = readAll(storageKey) || [];
      return records.map(normalize).filter(Boolean);
    },

    set(records) {
      const normalized = (Array.isArray(records) ? records : []).map(normalize).filter(Boolean);
      writeAll(storageKey, normalized);
      return normalized;
    },

    getById(id, idField = defaultIdField) {
      return this.getAll().find((r) => r[idField] === id) || null;
    },

    add(record) {
      ensureSeeded();
      const normalized = normalize(record);
      if (!normalized) return null;
      const current = this.getAll();
      const updated = [...current, normalized];
      writeAll(storageKey, updated);
      return normalized;
    },

    update(idField = defaultIdField, id, patch) {
      ensureSeeded();
      const current = this.getAll();
      const updated = current.map((r) => {
        if (r[idField] === id) {
          const patched = { ...r, ...patch };
          return normalize(patched);
        }
        return r;
      }).filter(Boolean);

      writeAll(storageKey, updated);
      return updated.find((r) => r[idField] === id) || null;
    },

    remove(idField = defaultIdField, id) {
      ensureSeeded();
      const current = this.getAll();
      const filtered = current.filter((r) => r[idField] !== id);
      writeAll(storageKey, filtered);
    },

    count() {
      return this.getAll().length;
    },
  };
}