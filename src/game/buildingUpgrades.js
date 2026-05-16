import { BD } from '../data.js';

export const SOLAR_UPGRADE_COST = 3000;
export const FILTER_UPGRADE_COST = 2500;
export const GREEN_ROOF_UPGRADE_COST = 2500;

export const MAX_FILTER_LEVEL = 3;

export const FILTER_REDUCTION_BY_LEVEL = {
  0: 0,
  1: 0.5,
  2: 0.7,
  3: 0.85,
};

export const GREEN_ROOF_ABSORPTION_BY_TYPE = {
  apartment: 8,
  house: 4,
  shop: 5,
  office: 8,
  bank: 7,
  hospital: 9,
  school: 7,
  police: 4,
  fire: 4,
  townhall: 8,
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

const GREEN_ROOF_ALLOWED_TYPES = Object.keys(GREEN_ROOF_ABSORPTION_BY_TYPE);

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

export function hasGreenRoof(building) {
  return !!building?.greenRoof;
}

export function getGreenRoofAbsorption(building) {
  if (!building || !hasGreenRoof(building)) return 0;

  const base = GREEN_ROOF_ABSORPTION_BY_TYPE[building.type] || 0;
  return base * Math.max(1, building.lv || 1);
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

function canUpgradeFilterOnly(building) {
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
    return { ok: false, reason: '⚠️ Ten budynek nie obsługuje filtra CO₂.' };
  }

  if ((data.co2 || 0) <= 0) {
    return { ok: false, reason: '⚠️ Ten budynek nie emituje CO₂.' };
  }

  if (getFilterLevel(building) >= MAX_FILTER_LEVEL) {
    return { ok: false, reason: '⚠️ Filtr CO₂ jest już na maksymalnym poziomie.' };
  }

  return { ok: true, reason: '' };
}

export function canInstallGreenRoof(building) {
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

  if (!GREEN_ROOF_ALLOWED_TYPES.includes(building.type)) {
    return { ok: false, reason: '⚠️ Na tym budynku nie można zrobić zielonego dachu.' };
  }

  if (hasGreenRoof(building)) {
    return { ok: false, reason: '⚠️ Ten budynek ma już zielony dach.' };
  }

  return { ok: true, reason: '' };
}

export function getNextEcoUpgrade(building) {
  const filterCheck = canUpgradeFilterOnly(building);

  if (filterCheck.ok) {
    const nextLevel = getNextFilterLevel(building);

    return {
      ok: true,
      kind: 'filter',
      label: `Filtr CO₂ Lv${nextLevel}`,
      cost: getFilterUpgradeCost(building),
      nextLevel,
      reductionPercent: getFilterReductionPercent(nextLevel),
    };
  }

  const greenRoofCheck = canInstallGreenRoof(building);

  if (greenRoofCheck.ok) {
    return {
      ok: true,
      kind: 'greenRoof',
      label: 'Zielony dach',
      cost: GREEN_ROOF_UPGRADE_COST,
      absorption: (GREEN_ROOF_ABSORPTION_BY_TYPE[building.type] || 0) * Math.max(1, building.lv || 1),
    };
  }

  return {
    ok: false,
    kind: null,
    label: '',
    cost: 0,
    reason: greenRoofCheck.reason || filterCheck.reason,
  };
}

// Stara nazwa zostaje, bo App.jsx już z niej korzysta.
// Od teraz oznacza: „najbliższy ekologiczny upgrade”: filtr albo zielony dach.
export function canInstallFilter(building) {
  const next = getNextEcoUpgrade(building);
  return {
    ok: next.ok,
    reason: next.reason || '',
  };
}

export function applySolarUpgrade(building) {
  return {
    ...building,
    solar: true,
  };
}

export function applyGreenRoofUpgrade(building) {
  return {
    ...building,
    greenRoof: true,
  };
}

// Stara nazwa zostaje, bo App.jsx już z niej korzysta.
// Najpierw ulepsza filtr CO₂, a gdy filtr jest skończony albo budynek nie ma filtra,
// instaluje zielony dach, jeśli budynek go obsługuje.
export function applyFilterUpgrade(building) {
  const next = getNextEcoUpgrade(building);

  if (next.kind === 'filter') {
    const nextLevel = getNextFilterLevel(building);

    return {
      ...building,
      co2f: nextLevel > 0,
      co2fLv: nextLevel,
    };
  }

  if (next.kind === 'greenRoof') {
    return applyGreenRoofUpgrade(building);
  }

  return building;
}