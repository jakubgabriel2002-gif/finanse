import { WEATHERS, TSTEPS, BD } from '../data.js';

export const SAVE_KEY = 'neocity_v7';

export const INIT_STATE = {
  budget: 90000,
  buildings: [],
  grid: {},
  roads: new Set(),
  powerLines: new Set(),
  waterPipes: new Set(),
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
  serviceEventCD: 0,
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
    powerLines: new Set(),
    waterPipes: new Set(),
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

  if (
    save.buildMode &&
    (
      save.buildMode === 'road' ||
      save.buildMode === 'powerline' ||
      save.buildMode === 'waterpipe' ||
      BD[save.buildMode]
    )
  ) {
    return save.buildMode;
  }

  if (step?.waitForRoads && roads.size < step.waitForRoads) {
    return 'road';
  }

  return null;
}

function normalizeBuildings(buildings) {
  if (!Array.isArray(buildings)) return [];
  return buildings.filter(building => building && BD[building.type]);
}

function rebuildGridFromBuildings(buildings) {
  const grid = {};

  buildings.forEach(building => {
    if (
      Number.isFinite(building.x) &&
      Number.isFinite(building.y)
    ) {
      grid[`${building.x},${building.y}`] = building;
    }
  });

  return grid;
}

export function normalizeLoadedGameState(save) {
  const base = createInitialGameState();
  const roads = new Set(Array.isArray(save?.roads) ? save.roads : []);
  const powerLines = new Set(Array.isArray(save?.powerLines) ? save.powerLines : []);
  const waterPipes = new Set(Array.isArray(save?.waterPipes) ? save.waterPipes : []);
  const buildMode = restoreTutorialBuildMode(save, roads);
  const buildings = normalizeBuildings(save?.buildings);
  const grid = rebuildGridFromBuildings(buildings);

  return {
    ...base,
    ...save,
    roads,
    powerLines,
    waterPipes,
    serviceEventCD: Number.isFinite(save?.serviceEventCD) ? save.serviceEventCD : base.serviceEventCD,
    weather: save?.weather || WEATHERS[0],
    buildMode,
    buildings,
    grid,
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
  const buildings = normalizeBuildings(gameState.buildings);
  const grid = rebuildGridFromBuildings(buildings);

  return {
    ...gameState,
    buildings,
    grid,
    roads: [...gameState.roads],
    powerLines: [...(gameState.powerLines || new Set())],
    waterPipes: [...(gameState.waterPipes || new Set())],
    serviceEventCD: Number.isFinite(gameState.serviceEventCD) ? gameState.serviceEventCD : 0,
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