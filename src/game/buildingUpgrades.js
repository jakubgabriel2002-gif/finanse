import { BD } from '../data.js';

export const SOLAR_UPGRADE_COST = 3000;
export const FILTER_UPGRADE_COST = 2000;

const POWER_PRODUCER_TYPES = ['solar', 'windmill', 'powerplant'];
const FILTER_ALLOWED_TYPES = ['factory', 'powerplant', 'office', 'hospital'];

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

  if (building.co2f) {
    return { ok: false, reason: '⚠️ Ten budynek ma już filtr CO₂.' };
  }

  if (!FILTER_ALLOWED_TYPES.includes(building.type)) {
    return { ok: false, reason: '⚠️ Filtr CO₂ można zamontować tylko w wybranych budynkach przemysłowych/usługowych.' };
  }

  if ((data.co2 || 0) <= 0) {
    return { ok: false, reason: '⚠️ Ten budynek nie emituje CO₂.' };
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
  return {
    ...building,
    co2f: true,
  };
}