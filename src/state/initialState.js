import { WEATHERS, TSTEPS } from '../data.js';

export const SAVE_KEY = 'neocity_v7';

// Budżet startowy: 90 000 zł
// Koszt tutorialu: ratusz(3k) + 2x blok(10k) + dom(2k) + fabryka(8k) + szpital(12k) + drogi(~2k) = ~37k
// Zostaje: ~50 000 zł po ukończeniu samouczka
export const INIT_STATE = {
  budget: 90000,
  buildings: [],
  grid: {},
  roads: new Set(),
  thLv: 1,
  month: 1,
  year: 1,
  speed: 1,
  paused: false,
  stats: null,
  log: [{ id: 0, label: '🏙️ NeoCity — nowa gra!', amount: 0 }],
  taxRate: 12,
  policies: {
    green: false,
    work: false,
    night: false,
    trans: false,
  },
  fees: {
    rent: 0,
    water: 0,
    power: 0,
    transit: 0,
    sewage: 0,
  },
  loan: null,
  elTmr: 48,
  riotOn: false,
  riotTmr: 0,
  inbox: [],
  events: [],
  news: [],
  nextUID: 100,
  buildMode: null,
  selUID: null,
  tab: 'map',
  weather: WEATHERS[0],
  tutDone: false,
  tutStep: 0,
  auditCD: 0,
};

export function createInitialGameState(overrides = {}) {
  return {
    ...INIT_STATE,
    buildings: [],
    grid: {},
    roads: new Set(),
    log: [{ id: 0, label: '🏙️ NeoCity — nowa gra!', amount: 0 }],
    policies: { ...INIT_STATE.policies },
    fees: { ...INIT_STATE.fees },
    inbox: [],
    events: [],
    news: [],
    weather: WEATHERS[0],
    ...overrides,
  };
}

function restoreTutorialBuildMode(save, roads) {
  if (!save || save.tutDone) return null;

  const tutStep = Number.isFinite(save.tutStep) ? save.tutStep : 0;
  const step = TSTEPS[tutStep];

  if (save.buildMode) return save.buildMode;

  // Stare zapisy mogły mieć tutStep = 1, ale buildMode = null.
  // To blokowało tutorial na etapie dróg.
  if (step?.waitForRoads && roads.size < step.waitForRoads) {
    return 'road';
  }

  return null;
}

export function normalizeLoadedGameState(save) {
  const base = createInitialGameState();
  const roads = new Set(Array.isArray(save?.roads) ? save.roads : []);
  const buildMode = restoreTutorialBuildMode(save, roads);

  return {
    ...base,
    ...save,
    roads,
    weather: save?.weather || WEATHERS[0],
    buildMode,
    buildings: Array.isArray(save?.buildings) ? save.buildings : [],
    grid: save?.grid || {},
    log: Array.isArray(save?.log) ? save.log : base.log,
    inbox: Array.isArray(save?.inbox) ? save.inbox : [],
    events: Array.isArray(save?.events) ? save.events : [],
    news: Array.isArray(save?.news) ? save.news : [],
    policies: {
      ...INIT_STATE.policies,
      ...(save?.policies || {}),
    },
    fees: {
      ...INIT_STATE.fees,
      ...(save?.fees || {}),
    },
  };
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;

    const save = JSON.parse(raw);
    return normalizeLoadedGameState(save);
  } catch (e) {
    return null;
  }
}

export function prepareGameForSave(gameState) {
  return {
    ...gameState,
    roads: [...gameState.roads],

    // Po tutorialu nie zapisujemy aktywnego trybu budowania.
    // W trakcie tutoriala zapisujemy buildMode, bo inaczej po odświeżeniu
    // gracz traci aktywną akcję tutoriala.
    buildMode: gameState.tutDone ? null : gameState.buildMode,
  };
}

export function saveGame(gameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(prepareGameForSave(gameState)));
    return true;
  } catch (e) {
    return false;
  }
}

export function clearSavedGame() {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch (e) {
    return false;
  }
}