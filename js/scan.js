/**
 * scan.js — Client-side logic for scan.html.
 * Handles file upload, API communication, result rendering, and import to order.
 * Only imports from scan-learn.js. No dependencies on orders.js, storage.js, etc.
 */

import { learnCorrection, applyLearning } from './scan-learn.js';

// ── Config ──────────────────────────────────────────────────

const SCAN_API = localStorage.getItem('scanApiUrl') || 'http://localhost:5000';
const SCAN_TIMEOUT_MS = 120_000;

// ── DOM refs ────────────────────────────────────────────────

const apiUrlInput    = document.getElementById('api-url');
const saveApiBtn     = document.getElementById('save-api');
const testApiBtn     = document.getElementById('test-api');
const apiStatus      = document.getElementById('api-status');
const fileInput      = document.getElementById('file-input');
const uploadSection  = document.getElementById('upload');
const loadingSection = document.getElementById('loading');
const loadingMsg     = document.getElementById('loading-msg');
const errorSection   = document.getElementById('error-section');
const errorMsg       = document.getElementById('error-msg');
const retryBtn       = document.getElementById('retry-btn');
const resultsSection = document.getElementById('results');
const aiBadge        = document.getElementById('ai-badge');
const supplierInput  = document.getElementById('supplier-name');
const docDateInput   = document.getElementById('doc-date');
const docTotalInput  = document.getElementById('doc-total');
const itemsTable     = document.getElementById('items-table');
const addRowBtn      = document.getElementById('add-row');
const importBtn      = document.getElementById('import-btn');
const rawTextPre     = document.getElementById('raw-text');

// ── Utility ─────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function confidenceEmoji(c) {
  if (c >= 0.8) return '🟢';
  if (c >= 0.5) return '🟡';
  return '🔴';
}

function confidenceColor(c) {
  if (c >= 0.8) return 'rgba(16, 185, 129, 0.08)';
  if (c >= 0.5) return 'rgba(245, 158, 11, 0.08)';
  return 'rgba(239, 68, 68, 0.08)';
}

// ── Settings ────────────────────────────────────────────────

apiUrlInput.value = localStorage.getItem('scanApiUrl') || '';

saveApiBtn.addEventListener('click', () => {
  const url = apiUrlInput.value.trim();
  if (url) {
    localStorage.setItem('scanApiUrl', url);
  } else {
    localStorage.removeItem('scanApiUrl');
  }
  location.reload();
});

testApiBtn.addEventListener('click', async () => {
  apiStatus.textContent = '⏳ בודק...';
  apiStatus.style.color = '#64748b';

  try {
    const res = await fetch(`${SCAN_API}/health`);
    const data = await res.json();
    if (data.status === 'ok') {
      apiStatus.textContent = '✅ מחובר';
      apiStatus.style.color = '#059669';
    } else {
      apiStatus.textContent = '⚠️ תגובה לא צפויה';
      apiStatus.style.color = '#d97706';
    }
  } catch {
    apiStatus.textContent = '❌ לא ניתן להתחבר';
    apiStatus.style.color = '#ef4444';
  }
});

// ── File Upload ─────────────────────────────────────────────

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;

  // Reset UI
  errorSection.hidden = true;
  resultsSection.hidden = true;
  loadingSection.hidden = false;
  loadingMsg.textContent = 'מעבד את הקובץ...';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${SCAN_API}/scan`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `שגיאת שרת: ${res.status}`);
    }

    const data = await res.json();

    // Apply learning corrections to each item
    const supplier = data.supplierName || '';
    if (data.items && data.items.length) {
      data.items = data.items.map(item => applyLearning(item, supplier));
    }

    renderResults(data);
  } catch (err) {
    loadingSection.hidden = true;

    if (err.name === 'AbortError') {
      showError('תם הזמן — בדוק ש-Termux רץ');
    } else if (err.message === 'Failed to fetch') {
      showError(`לא ניתן להתחבר ל-${SCAN_API}`);
    } else {
      showError(err.message || 'שגיאה לא צפויה');
    }
  } finally {
    loadingSection.hidden = true;
    fileInput.value = '';
  }
});

// ── Error handling ──────────────────────────────────────────

function showError(msg) {
  errorMsg.textContent = msg;
  errorSection.hidden = false;
}

retryBtn.addEventListener('click', () => {
  errorSection.hidden = true;
  fileInput.click();
});

// ── Render Results ──────────────────────────────────────────

function renderResults(data) {
  // AI badge
  if (data.usedAI) {
    aiBadge.textContent = '🤖 זוהה עם AI';
    aiBadge.className = 'ai-badge-on';
  } else {
    aiBadge.textContent = '📐 זוהה עם תבניות';
    aiBadge.className = 'ai-badge-off';
  }
  // Restore the ID (className= wipes it)
  aiBadge.id = 'ai-badge';

  // Meta fields
  supplierInput.value = data.supplierName || '';
  docDateInput.value = data.documentDate || '';
  docTotalInput.value = data.totalAmount || '';

  // Raw text
  rawTextPre.textContent = data.rawText || '';

  // Items table
  const tbody = itemsTable.querySelector('tbody');
  tbody.innerHTML = '';

  if (data.items && data.items.length) {
    data.items.forEach(item => addResultRow(item));
  }

  resultsSection.hidden = false;
  uploadSection.style.display = 'none';
}

// ── Add Result Row ──────────────────────────────────────────

function addResultRow(item) {
  const tbody = itemsTable.querySelector('tbody');
  const tr = document.createElement('tr');

  const name       = item ? escapeHtml(item.name)     : '';
  const quantity   = item ? (item.quantity || '')      : '';
  const unit       = item ? escapeHtml(item.unit)      : '';
  const price      = item ? (item.price || '')         : '';
  const confidence = item ? (item.confidence || 0)     : 0;

  tr.dataset.originalName = item ? (item.name || '') : '';
  tr.style.backgroundColor = confidenceColor(confidence);

  tr.innerHTML = `
    <td><input type="text" class="item-name" value="${name}"></td>
    <td><input type="number" class="item-qty" value="${quantity}" step="0.01" min="0"></td>
    <td>
      <select class="item-unit">
        <option value="ק&quot;ג" ${unit === 'ק"ג' ? 'selected' : ''}>ק"ג</option>
        <option value="יח'" ${unit === "יח'" ? 'selected' : ''}>יח'</option>
        <option value="קרטון" ${unit === 'קרטון' ? 'selected' : ''}>קרטון</option>
        <option value="שק" ${unit === 'שק' ? 'selected' : ''}>שק</option>
        <option value="ארגז" ${unit === 'ארגז' ? 'selected' : ''}>ארגז</option>
        <option value="חבילה" ${unit === 'חבילה' ? 'selected' : ''}>חבילה</option>
      </select>
    </td>
    <td><input type="number" class="item-price" value="${price}" step="0.01" min="0"></td>
    <td class="conf-cell" style="text-align:center; font-size:1.1rem;">${confidenceEmoji(confidence)}</td>
    <td><button type="button" class="delete-row-btn del" title="מחק שורה">×</button></td>
  `;

  // Name change → learn correction
  const nameInput = tr.querySelector('.item-name');
  nameInput.addEventListener('change', () => {
    const original = tr.dataset.originalName;
    const edited = nameInput.value.trim();
    if (original && edited && original !== edited) {
      const supplier = supplierInput.value.trim();
      learnCorrection(original, edited, supplier || null);
      // Update visual to high confidence
      tr.style.backgroundColor = confidenceColor(0.9);
      tr.querySelector('.conf-cell').textContent = '🟢';
    }
  });

  // Delete button
  tr.querySelector('.del').addEventListener('click', () => {
    tr.remove();
  });

  tbody.appendChild(tr);
}

// ── Add empty row ───────────────────────────────────────────

addRowBtn.addEventListener('click', () => {
  addResultRow();
});

// ── Import to Order ─────────────────────────────────────────

importBtn.addEventListener('click', () => {
  const tbody = itemsTable.querySelector('tbody');
  const rows = tbody.querySelectorAll('tr');
  const items = [];

  rows.forEach(tr => {
    const name     = tr.querySelector('.item-name')?.value.trim();
    const quantity = parseFloat(tr.querySelector('.item-qty')?.value) || 0;
    const unit     = tr.querySelector('.item-unit')?.value || "יח'";
    const price    = parseFloat(tr.querySelector('.item-price')?.value) || 0;

    if (name) {
      items.push({ name, quantity, unit, price });
    }
  });

  if (!items.length) {
    alert('אין פריטים לייבוא');
    return;
  }

  const payload = {
    supplierName: supplierInput.value.trim(),
    documentDate: docDateInput.value,
    items,
  };

  sessionStorage.setItem('scannedOrder', JSON.stringify(payload));
  window.location.href = 'new-order.html?fromScan=1';
});
