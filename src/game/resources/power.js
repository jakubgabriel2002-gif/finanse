import { BD } from '../../data.js';

/**
 * System energii / prądu.
 *
 * Stara logika działała na jednym polu `pw`:
 * - dodatnie `pw` = zużycie / deficyt
 * - ujemne `pw` = produkcja / nadwyżka
 *
 * Ten moduł rozbija to na czytelniejsze wartości:
 * - demand  = całkowite zużycie energii
 * - supply  = całkowita produkcja energii
 * - balance = supply - demand
 * - deficit = ile energii brakuje
 * - surplus = ile energii zostaje
 *
 * Dla kompatybilności z obecnym UI zwracamy też `legacyPw`,
 * czyli stare saldo w formacie: demand - supply.
 */

function getWeatherSolarMultiplier(weather) {
  return weather?.sm || 1;
}

function getBuildingPowerValue(building, weather) {
  const data = BD[building.type];
  if (!data) return 0;

  const basePower = data.pw || 0;

  // Farmy solarne produkują mniej / więcej zależnie od pogody.
  if (building.type === 'solar') {
    return basePower * building.lv * getWeatherSolarMultiplier(weather);
  }

  // Budynki zużywające prąd mogą mieć panele solarne,
  // które zmniejszają ich zużycie o 50%.
  if (basePower > 0) {
    return basePower * building.lv * (building.solar ? 0.5 : 1);
  }

  // Inne źródła energii, np. wiatrak i elektrownia.
  return basePower * building.lv;
}

export function calcPower(activeBuildings, weather) {
  let demand = 0;
  let supply = 0;

  const consumers = [];
  const producers = [];

  activeBuildings.forEach(building => {
    const data = BD[building.type];
    if (!data) return;

    const value = getBuildingPowerValue(building, weather);

    if (value > 0) {
      demand += value;
      consumers.push({
        uid: building.uid,
        type: building.type,
        name: data.n,
        icon: data.e,
        level: building.lv,
        value,
      });
    }

    if (value < 0) {
      const produced = Math.abs(value);
      supply += produced;
      producers.push({
        uid: building.uid,
        type: building.type,
        name: data.n,
        icon: data.e,
        level: building.lv,
        value: produced,
      });
    }
  });

  const balance = supply - demand;
  const deficit = Math.max(0, demand - supply);
  const surplus = Math.max(0, supply - demand);

  return {
    demand: Math.floor(demand),
    supply: Math.floor(supply),
    balance: Math.floor(balance),
    deficit: Math.floor(deficit),
    surplus: Math.floor(surplus),
    ok: balance >= 0,

    // Kompatybilność ze starym systemem:
    // stare `pw` było dodatnie przy deficycie i ujemne przy nadwyżce.
    legacyPw: Math.floor(demand - supply),

    consumers,
    producers,
  };
}