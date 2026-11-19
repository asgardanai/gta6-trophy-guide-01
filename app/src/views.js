// Renderers: the progress header, the checklist rows, the guide detail pane,
// the roadmap stages and the missables list. All text comes from the trophy
// data; nothing is fetched at run time.

import {
  KIND_LABELS,
  GRADE_LABELS,
  SOURCE_LABELS,
  SOURCE_LINKS,
  STAGES,
  displayName,
  displayDescription,
  isHiddenBySpoiler,
  gradeCounts,
  stageCounts,
} from './filters.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function countLabel(trophy) {
  if (trophy.count === null || trophy.count === undefined) return '';
  if (trophy.count >= 1000) return `Target: $${trophy.count.toLocaleString('en-US')}`;
  return `Target: ${trophy.count}`;
}

function gradePill(trophy) {
  return el('span', `pill grade-${trophy.grade}`, GRADE_LABELS[trophy.grade]);
}

function kindPill(trophy) {
  if (trophy.kind === 'platinum') return null;
  return el('span', 'pill', KIND_LABELS[trophy.kind]);
}

function missablePill(trophy) {
  if (trophy.missable === 'yes') return el('span', 'pill missable-yes', 'Missable');
  if (trophy.missable === 'possible') return el('span', 'pill missable-possible', 'Possibly missable');
  return null;
}

export function renderProgress(trophies, state) {
  const earned = state.earned.size;
  document.getElementById('earned-count').textContent = String(earned);
  document.getElementById('progress-fill').style.width = `${Math.round((earned / trophies.length) * 100)}%`;
  const counts = gradeCounts(trophies, state);
  const holder = document.getElementById('grade-counts');
  holder.replaceChildren();
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const [got, total] = counts[grade];
    const span = el('span', '', `${GRADE_LABELS[grade]} `);
    span.append(el('b', '', `${got}/${total}`));
    holder.append(span);
  }
  const missableTotal = trophies.filter((t) => t.missable !== 'no').length;
  document.getElementById('missable-count').textContent = String(missableTotal);
}

export function renderList(list, trophies, state, selectedId, onSelect, onToggle) {
  document.getElementById('result-count').textContent =
    `Showing ${trophies.length} of 55 trophies — click one for its guide.`;
  list.replaceChildren();
  if (trophies.length === 0) {
    list.append(el('p', 'empty-note', 'No trophies match these filters.'));
    return;
  }
  for (const t of trophies) {
    const row = el('button', 'row');
    row.type = 'button';
    row.setAttribute('role', 'listitem');
    if (state.earned.has(t.id)) row.classList.add('earned');
    if (t.id === selectedId) row.classList.add('selected');

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => onToggle(t.id));
    row.append(box);

    const body = el('div', 'body');
    body.append(el('div', 'name', displayName(t, state)));
    body.append(el('div', 'desc', displayDescription(t, state)));
    const tags = el('div', 'tags');
    tags.append(gradePill(t));
    const kind = kindPill(t);
    if (kind) tags.append(kind);
    const count = countLabel(t);
    if (count) tags.append(el('span', 'pill count', count));
    const miss = missablePill(t);
    if (miss) tags.append(miss);
    body.append(tags);
    row.append(body);

    row.addEventListener('click', () => onSelect(t.id));
    list.append(row);
  }
}

export function renderDetail(detail, trophy, state, onToggle) {
  detail.replaceChildren();
  if (!trophy) {
    detail.classList.add('empty');
    detail.append(el('p', '', 'Select a trophy on the left to read its guide, its sources and whether it can be missed.'));
    return;
  }
  detail.classList.remove('empty');

  const tags = el('div', 'tags');
  tags.append(gradePill(trophy));
  const kind = kindPill(trophy);
  if (kind) tags.append(kind);
  const count = countLabel(trophy);
  if (count) tags.append(el('span', 'pill count', count));
  const miss = missablePill(trophy);
  if (miss) tags.append(miss);
  detail.append(tags);

  detail.append(el('h2', '', displayName(trophy, state)));
  detail.append(el('p', 'official', `“${displayDescription(trophy, state)}”`));

  if (isHiddenBySpoiler(trophy, state)) {
    detail.append(el('p', '', 'Spoilers are on, and this story trophy is not earned yet — its guide is hidden with its name. Earn it, or turn spoilers off, to read the guide.'));
  } else {
    detail.append(el('h3', '', 'Guide'));
    detail.append(el('p', 'guide', trophy.guide));
    if (trophy.missable !== 'no') {
      const box = el('div', trophy.missable === 'yes' ? 'warn-box yes' : 'warn-box');
      box.append(el('strong', '', trophy.missable === 'yes' ? 'Missable. ' : 'Possibly missable. '));
      box.append(document.createTextNode(trophy.missableNote));
      detail.append(box);
    }
    detail.append(el('h3', '', 'Sources'));
    const list = el('ul', 'sources');
    for (const key of trophy.sources) {
      const item = el('li', '', SOURCE_LABELS[key]);
      const link = SOURCE_LINKS[key];
      if (link) {
        item.append(document.createTextNode(' '));
        const a = el('a', '', 'open');
        a.href = link;
        a.rel = 'noopener';
        item.append(a);
      }
      list.append(item);
    }
    detail.append(list);
  }

  const line = el('div', 'earned-line');
  const button = el('button', '', state.earned.has(trophy.id) ? 'Mark as not earned' : 'Mark as earned');
  button.type = 'button';
  button.addEventListener('click', () => onToggle(trophy.id));
  line.append(button);
  detail.append(line);
}

export function renderRoadmap(holder, trophies, state, onSelect) {
  holder.replaceChildren();
  const counts = stageCounts(trophies, state);
  for (const stage of STAGES) {
    const card = el('div', 'stage');
    const head = el('div', 'head');
    const title = el('h2', '');
    title.append(el('span', 'num', `Stage ${stage.stage}`));
    title.append(document.createTextNode(stage.title));
    head.append(title);
    const [got, total] = counts[stage.stage];
    head.append(el('span', 'count', `${got} of ${total} earned`));
    card.append(head);
    card.append(el('p', '', stage.note));
    const chips = el('div', 'trophies');
    for (const t of trophies.filter((x) => x.stage === stage.stage)) {
      const chip = el('button', 'chip', displayName(t, state));
      chip.type = 'button';
      if (state.earned.has(t.id)) chip.classList.add('earned');
      chip.addEventListener('click', () => onSelect(t.id));
      chips.append(chip);
    }
    card.append(chips);
    holder.append(card);
  }
}

export function renderMissables(holder, trophies, state, onSelect) {
  holder.replaceChildren();
  if (state.spoiler) {
    holder.append(el('p', 'lede', 'Spoilers are on: story trophies stay hidden until earned, so one flagged trophy below shows as a hidden story trophy. Turn spoilers off in the checklist to reveal it.'));
  }
  const flagged = trophies
    .filter((t) => t.missable !== 'no')
    .sort((a, b) => (a.missable === 'yes' ? 0 : 1) - (b.missable === 'yes' ? 0 : 1));
  for (const t of flagged) {
    const card = el('div', 'miss-card');
    card.append(el('span', `flag ${t.missable}`, t.missable === 'yes' ? 'Missable' : 'Possible'));
    const body = el('div', '');
    body.append(el('h2', '', displayName(t, state)));
    body.append(el('p', 'official', `“${displayDescription(t, state)}”`));
    if (isHiddenBySpoiler(t, state)) {
      body.append(el('p', '', 'This story trophy is hidden while spoilers are on. Earn it, or turn spoilers off, to read its guide.'));
    } else {
      body.append(el('p', '', t.guide));
      body.append(el('p', 'why', `Why it is flagged: ${t.missableNote}`));
    }
    const open = el('button', 'chip', state.earned.has(t.id) ? 'Earned — open in checklist' : 'Open in checklist');
    open.type = 'button';
    open.addEventListener('click', () => onSelect(t.id));
    body.append(open);
    card.append(body);
    holder.append(card);
  }
}
