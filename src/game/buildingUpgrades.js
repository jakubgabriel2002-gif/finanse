import { BD } from '../data.js';

export const SOLAR_UPGRADE_COST = 3000;
export const FILTER_UPGRADE_COST = 2500;

export const MAX_FILTER_LEVEL = 3;

export const FILTER_REDUCTION_BY_LEVEL = {
  0: 0,
  1: 0.5,
  2: 0.7,
  3: 0.85,
};

const POWER_PRODUCER_TYPES = ['solar', 'windmill', 'powerplant'];

const FILTER_ALLOWED_TYPES = [
  'factory',
  'powerplant',
  'office',
  'hospital',
  'shop',
  'waterplant',
  'sewage',
];

function clampFilterLevel(level) {
  return Math.max(0, Math.min(MAX_FILTER_LEVEL, Math.floor(level || 0)));
}

export function getFilterLevel(building) {
  if (!building) return 0;

  if (Number.isFinite(building.co2fLv)) {
    return clampFilterLevel(building.co2fLv);
  }

  // Kompatybilność ze starym save’em.
  // Stare `co2f:true` traktujemy jako filtr Lv1.
  if (building.co2f) return 1;

  return 0;
}

export function getNextFilterLevel(building) {
  return Math.min(MAX_FILTER_LEVEL, getFilterLevel(building) + 1);
}

export function getFilterReduction(levelOrBuilding) {
  const level = typeof levelOrBuilding === 'number'
    ? clampFilterLevel(levelOrBuilding)
    : getFilterLevel(levelOrBuilding);

  return FILTER_REDUCTION_BY_LEVEL[level] || 0;
}

export function getFilterReductionPercent(levelOrBuilding) {
  return Math.round(getFilterReduction(levelOrBuilding) * 100);
}

export function getFilterEmissionMultiplier(building) {
  return 1 - getFilterReduction(building);
}

export function getFilterUpgradeCost(building) {
  const nextLevel = getNextFilterLevel(building);

  if (nextLevel <= 1) return FILTER_UPGRADE_COST;
  if (nextLevel === 2) return FILTER_UPGRADE_COST;
  if (nextLevel === 3) return FILTER_UPGRADE_COST;

  return FILTER_UPGRADE_COST;
}

export function canInstallSolar(building) {
  if (!building) {
    return { ok: false, reason: '⚠️ Nie wybrano budynku.' };
  }

  const data = BD[building.type];

  if (!data) {
    return { ok: false, reason: '⚠️ Nieznany typ budynku.' };
  }

  if (building.building) {
    return { ok: false, reason: '⚠️ Budynek jest jeszcze w budowie.' };
  }

  if (building.solar) {
    return { ok: false, reason: '⚠️ Ten budynek ma już panele solarne.' };
  }

  if (POWER_PRODUCER_TYPES.includes(building.type)) {
    return { ok: false, reason: '⚠️ Na budynkach energetycznych nie instalujemy paneli.' };
  }

  if ((data.pw || 0) <= 0) {
    return { ok: false, reason: '⚠️ Ten budynek nie zużywa energii, więc panele nic tu nie dadzą.' };
  }

  return { ok: true, reason: '' };
}

export function canInstallFilter(building) {
  if (!building) {
    return { ok: false, reason: '⚠️ Nie wybrano budynku.' };
  }

  const data = BD[building.type];

  if (!data) {
    return { ok: false, reason: '⚠️ Nieznany typ budynku.' };
  }

  if (building.building) {
    return { ok: false, reason: '⚠️ Budynek jest jeszcze w budowie.' };
  }

  if (!FILTER_ALLOWED_TYPES.includes(building.type)) {
    return { ok: false, reason: '⚠️ Filtr CO₂ można zamontować tylko w wybranych budynkach przemysłowych/usługowych.' };
  }

  if ((data.co2 || 0) <= 0) {
    return { ok: false, reason: '⚠️ Ten budynek nie emituje CO₂.' };
  }

  if (getFilterLevel(building) >= MAX_FILTER_LEVEL) {
    return { ok: false, reason: '⚠️ Filtr CO₂ jest już na maksymalnym poziomie.' };
  }

  return { ok: true, reason: '' };
}

export function applySolarUpgrade(building) {
  return {
    ...building,
    solar: true,
  };
}

export function applyFilterUpgrade(building) {
  const nextLevel = getNextFilterLevel(building);

  return {
    ...building,
    co2f: nextLevel > 0,
    co2fLv: nextLevel,
  };
}