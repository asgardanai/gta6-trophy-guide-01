// Progress store: earned trophies and the spoiler setting, saved in localStorage,
// with export to a JSON file and import back. Nothing leaves the browser.
const KEY = 'leonida-platinum-guide-v1';

function readRaw() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // Corrupt save: fall through to a fresh state.
  }
  return null;
}

export function loadProgress() {
  const raw = readRaw();
  const earned = new Set();
  if (raw && Array.isArray(raw.earned)) {
    for (const id of raw.earned) {
      const n = Number(id);
      if (Number.isInteger(n)) earned.add(n);
    }
  }
  const spoiler = raw ? raw.spoiler === true : false;
  return { earned, spoiler };
}

export function saveProgress(state) {
  localStorage.setItem(KEY, JSON.stringify({
    version: 1,
    earned: [...state.earned].sort((a, b) => a - b),
    spoiler: state.spoiler,
    savedAt: new Date().toISOString(),
  }));
}

export function exportProgress(state) {
  const blob = new Blob([JSON.stringify({
    app: 'leonida-platinum-guide',
    version: 1,
    earned: [...state.earned].sort((a, b) => a - b),
    spoiler: state.spoiler,
    exportedAt: new Date().toISOString(),
  }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function importProgress(file, validIds) {
  const parsed = JSON.parse(await file.text());
  const ids = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(ids)) throw new Error('Not a progress file: no earned list.');
  const earned = new Set();
  for (const id of ids) {
    const n = Number(id);
    if (Number.isInteger(n) && validIds.has(n)) earned.add(n);
  }
  const spoiler = parsed && !Array.isArray(parsed) ? parsed.spoiler === true : false;
  return { earned, spoiler };
}

export function clearProgress() {
  localStorage.removeItem(KEY);
}
