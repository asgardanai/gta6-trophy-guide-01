// Boot and routing: load the trophy data, wire the controls, keep the three
// views (checklist, roadmap, missables) in sync with the hash and the saved
// progress. Runs entirely offline; the only fetch is the local data file.
import { loadProgress, saveProgress, exportProgress, importProgress, clearProgress } from './store.js';
import { filterTrophies } from './filters.js';
import { renderProgress, renderList, renderDetail, renderRoadmap, renderMissables } from './views.js';

const VIEWS = ['checklist', 'roadmap', 'missables'];

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

const state = loadProgress();
const filters = { search: '', kind: 'all', grade: 'all', earned: 'all', missableOnly: false };
let selectedId = null;
let currentView = 'checklist';

const listEl = document.getElementById('list');
const detailEl = document.getElementById('detail');
const roadmapEl = document.getElementById('roadmap');
const missablesEl = document.getElementById('missables');
const spoilerButton = document.getElementById('spoiler-toggle');

function showView(view) {
  currentView = VIEWS.includes(view) ? view : 'checklist';
  for (const name of VIEWS) {
    document.getElementById(`view-${name}`).hidden = name !== currentView;
    document.querySelector(`#tabs a[data-view="${name}"]`).classList.toggle('active', name === currentView);
  }
}

function render() {
  renderProgress(trophies, state);
  renderList(listEl, filterTrophies(trophies, state, filters), state, selectedId, selectTrophy, toggleEarned);
  renderDetail(detailEl, selectedId === null ? null : byId.get(selectedId), state, toggleEarned);
  renderRoadmap(roadmapEl, trophies, state, selectTrophy);
  renderMissables(missablesEl, trophies, state, selectTrophy);
  spoilerButton.setAttribute('aria-pressed', String(state.spoiler));
  spoilerButton.textContent = state.spoiler ? 'Spoilers: on' : 'Spoilers: off';
}

function selectTrophy(id) {
  selectedId = byId.has(id) ? id : null;
  if (location.hash !== `#/trophy/${id}`) location.hash = `#/trophy/${id}`;
  showView('checklist');
  render();
  detailEl.scrollIntoView({ block: 'nearest' });
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveProgress(state);
  render();
}

function routeFromHash() {
  const hash = location.hash || '#/checklist';
  const trophyMatch = hash.match(/^#\/trophy\/(\d+)$/);
  if (trophyMatch) {
    const id = Number(trophyMatch[1]);
    selectedId = byId.has(id) ? id : null;
    showView('checklist');
  } else {
    const view = hash.replace(/^#\//, '');
    showView(view);
  }
  render();
}

document.getElementById('search').addEventListener('input', (event) => {
  filters.search = event.target.value;
  render();
});
document.getElementById('filter-kind').addEventListener('change', (event) => {
  filters.kind = event.target.value;
  render();
});
document.getElementById('filter-grade').addEventListener('change', (event) => {
  filters.grade = event.target.value;
  render();
});
document.getElementById('filter-earned').addEventListener('change', (event) => {
  filters.earned = event.target.value;
  render();
});
document.getElementById('filter-missable').addEventListener('change', (event) => {
  filters.missableOnly = event.target.checked;
  render();
});
spoilerButton.addEventListener('click', () => {
  state.spoiler = !state.spoiler;
  saveProgress(state);
  render();
});
document.getElementById('export').addEventListener('click', () => exportProgress(state));
document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imported = await importProgress(file, new Set(trophies.map((t) => t.id)));
    state.earned = imported.earned;
    state.spoiler = imported.spoiler;
    saveProgress(state);
    render();
  } catch (error) {
    document.getElementById('result-count').textContent = `Could not import that file: ${error.message}`;
  }
  event.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  if (!window.confirm('Clear all earned trophies and the spoiler setting?')) return;
  clearProgress();
  state.earned = new Set();
  state.spoiler = false;
  saveProgress(state);
  render();
});

window.addEventListener('hashchange', routeFromHash);
routeFromHash();
window.__shotReady = true;
