/**
 * scan-learn.js — Self-contained learning module for scan corrections.
 * Stores corrections in localStorage and applies them to future scans.
 * No external imports.
 */

const STORAGE_KEY = 'scan_learning_db';
const MAX_ENTRIES = 500;

// ── DB helpers ──────────────────────────────────────────────

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { global: [], suppliers: {} };
    return JSON.parse(raw);
  } catch {
    return { global: [], suppliers: {} };
  }
}

function saveDB(db) {
  // Trim old entries if over limit
  if (db.global.length > MAX_ENTRIES) {
    db.global = db.global.slice(-MAX_ENTRIES);
  }
  for (const key of Object.keys(db.suppliers)) {
    if (db.suppliers[key].length > MAX_ENTRIES) {
      db.suppliers[key] = db.suppliers[key].slice(-MAX_ENTRIES);
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// ── Hebrew normalization ────────────────────────────────────

function normalizeHebrew(str) {
  let s = str.trim();
  // Remove common Hebrew suffixes: ים, ות, יות, ה
  s = s.replace(/יות$/, '');
  s = s.replace(/ות$/, '');
  s = s.replace(/ים$/, '');
  s = s.replace(/ה$/, '');
  return s;
}

function isMatch(a, b) {
  return normalizeHebrew(a) === normalizeHebrew(b);
}

// ── Public API ──────────────────────────────────────────────

/**
 * Store a correction. If the same original already exists, replace it.
 */
export function learnCorrection(original, corrected, supplier) {
  if (!original || !corrected) return;

  const db = loadDB();
  const entry = { original, corrected, ts: Date.now() };

  if (supplier) {
    if (!db.suppliers[supplier]) db.suppliers[supplier] = [];
    const list = db.suppliers[supplier];
    const idx = list.findIndex(e => e.original === original);
    if (idx !== -1) {
      list[idx] = entry;
    } else {
      list.push(entry);
    }
  } else {
    const idx = db.global.findIndex(e => e.original === original);
    if (idx !== -1) {
      db.global[idx] = entry;
    } else {
      db.global.push(entry);
    }
  }

  saveDB(db);
}

/**
 * Apply learned corrections to an item.
 * Supplier-specific corrections take priority over global.
 * Returns item with corrected name and confidence >= 0.85 if matched.
 */
export function applyLearning(item, supplier) {
  if (!item || !item.name) return item;

  const db = loadDB();

  // 1. Check supplier-specific corrections first
  if (supplier && db.suppliers[supplier]) {
    const match = db.suppliers[supplier].find(e => isMatch(e.original, item.name));
    if (match) {
      return {
        ...item,
        name: match.corrected,
        confidence: Math.max(item.confidence || 0, 0.85),
      };
    }
  }

  // 2. Check global corrections
  const globalMatch = db.global.find(e => isMatch(e.original, item.name));
  if (globalMatch) {
    return {
      ...item,
      name: globalMatch.corrected,
      confidence: Math.max(item.confidence || 0, 0.85),
    };
  }

  return item;
}

/**
 * Clear all learned corrections.
 */
export function clearLearning() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get statistics about stored corrections.
 */
export function getLearningStats() {
  const db = loadDB();
  const supplierCount = Object.keys(db.suppliers).length;
  let supplierEntries = 0;
  for (const key of Object.keys(db.suppliers)) {
    supplierEntries += db.suppliers[key].length;
  }

  return {
    globalEntries: db.global.length,
    supplierCount,
    supplierEntries,
    totalEntries: db.global.length + supplierEntries,
  };
}
