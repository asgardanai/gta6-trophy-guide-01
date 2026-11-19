// Filtering, searching and the spoiler rule. The spoiler setting hides the names
// and descriptions of story trophies until they are earned; everything else stays
// visible. Kinds and roadmap stages are fixed labels for the whole app.

export const KIND_LABELS = {
  platinum: 'Platinum',
  story: 'Story',
  side: 'Strangers & contacts',
  collectible: 'Collectible',
  activity: 'Activity',
  crime: 'Crime',
  grind: 'Grind',
  misc: 'Odd job',
};

export const GRADE_LABELS = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

// Where each fact comes from. Exophase carries the official list (name, description,
// grade); PSNProfiles carries PSN's progress targets (the counts); the guide text is
// our own reading of the official description, written for this entry.
export const SOURCE_LABELS = {
  exophase: 'Exophase — official trophy list (name, description, grade)',
  psnprofiles: 'PSNProfiles — PSN progress target (the count)',
  own: 'Guide — our own reading of the official description (not yet verified in the game)',
};

export const SOURCE_LINKS = {
  exophase: 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/',
  psnprofiles: 'https://psnprofiles.com/trophies/43531-grand-theft-auto-vi',
};

export const STAGES = [
  {
    stage: 1,
    title: 'Play the story',
    note: 'Chapters 1–4, the final mission and every named story mission. Do the partner trophies (Hot Together, Retail Therapy) while your partner is with you, and keep a manual save before every big decision — Actions Speak Louder is the one trophy the descriptions mark as clearly missable.',
  },
  {
    stage: 2,
    title: 'Strangers and contacts',
    note: 'Finish the mission strands for Andy, Kenton, Billy, Randy, Tyrone and Bret, plus two more strangers, for Strangers & Freaks. Bret\'s strand ends in the unique-animal hunt.',
  },
  {
    stage: 3,
    title: 'Activities and collectibles',
    note: 'The map work: 42 Shooting Range golds, 14 drone race wins, 20 race wins, fishing, arcade, bowling, 18 meditation spots, 3 card sets, WAiNK It at 100 spots, 100 vehicles, 52 areas, 8 garages — and the crime trophies (vaults, armored truck, jewelry store, one illegal operation per gang).',
  },
  {
    stage: 4,
    title: 'Cleanup and the grind',
    note: 'The long counts: 250 stunts, 50 challenges, $250,000 laundered, $100,000 spent — then 100% Completion for A Long Road, and the platinum is yours.',
  },
];

export function isHiddenBySpoiler(trophy, state) {
  return state.spoiler && trophy.kind === 'story' && !state.earned.has(trophy.id);
}

export function displayName(trophy, state) {
  return isHiddenBySpoiler(trophy, state) ? 'Hidden story trophy' : trophy.name;
}

export function displayDescription(trophy, state) {
  return isHiddenBySpoiler(trophy, state)
    ? 'Earn this trophy to reveal its name and description.'
    : trophy.description;
}

export function filterTrophies(trophies, state, filters) {
  const query = filters.search.trim().toLowerCase();
  return trophies.filter((t) => {
    if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.earned === 'earned' && !state.earned.has(t.id)) return false;
    if (filters.earned === 'unearned' && state.earned.has(t.id)) return false;
    if (filters.missableOnly && t.missable === 'no') return false;
    if (query) {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

export function gradeCounts(trophies, state) {
  const counts = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const t of trophies) {
    counts[t.grade][1] += 1;
    if (state.earned.has(t.id)) counts[t.grade][0] += 1;
  }
  return counts;
}

export function stageCounts(trophies, state) {
  const counts = { 1: [0, 0], 2: [0, 0], 3: [0, 0], 4: [0, 0] };
  for (const t of trophies) {
    counts[t.stage][1] += 1;
    if (state.earned.has(t.id)) counts[t.stage][0] += 1;
  }
  return counts;
}
