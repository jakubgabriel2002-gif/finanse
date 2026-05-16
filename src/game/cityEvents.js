function clampPenalty(value, maxAbs) {
  return -Math.min(maxAbs, Math.max(0, Math.floor(value)));
}

function clampBonus(value, max) {
  return Math.min(max, Math.max(0, Math.floor(value)));
}

function makeEvent({ t, m, b, tp = 'err', chance = 0.1, cooldown = 4, priority = 1 }) {
  return { t, m, b, tp, chance, cooldown, priority };
}

function pickEvent(candidates) {
  const rolled = candidates
    .filter(event => Math.random() < event.chance)
    .sort((a, b) => b.priority - a.priority);

  return rolled[0] || null;
}

export function rollCityServiceEvent(gameState, stats) {
  if (!gameState?.tutDone) return null;
  if ((gameState.serviceEventCD || 0) > 0) return null;
  if (!stats) return null;

  const candidates = [];
  const pop = stats.pop || 0;
  const power = stats.power || {};
  const water = stats.water || {};
  const sewage = stats.sewage || {};
  const weather = gameState.weather || {};

  const hasCity = gameState.buildings?.filter(b => !b.building).length > 5;
  if (!hasCity) return null;

  if ((power.gridDeficit || 0) > 10 || (power.disconnectedCount || 0) > 0) {
    const penalty = clampPenalty(
      1100 +
      (power.gridDeficit || 0) * 28 +
      (power.disconnectedCount || 0) * 420 +
      Math.floor(pop / 4),
      14000
    );

    candidates.push(makeEvent({
      t: '⚡ Awaria energetyczna',
      m: 'Niestabilna sieć prądu spowodowała awarie urządzeń i przestoje w usługach.',
      b: penalty,
      tp: 'err',
      chance: Math.min(0.32, 0.12 + (power.deficit || 0) / 450),
      cooldown: 4,
      priority: 7,
    }));
  }

  if ((power.surplus || 0) > 90 && (power.serviceEfficiency || 0) >= 95 && pop > 120) {
    const bonus = clampBonus(900 + (power.surplus || 0) * 7 + Math.floor(pop / 8), 7000);

    candidates.push(makeEvent({
      t: '⚡ Premia za stabilną sieć',
      m: 'Miasto dostało premię za stabilną i dobrze zaprojektowaną sieć energetyczną.',
      b: bonus,
      tp: 'ok',
      chance: 0.045,
      cooldown: 5,
      priority: 1,
    }));
  }

  if ((water.gridDeficit || 0) > 10 || (water.disconnectedCount || 0) > 0) {
    const penalty = clampPenalty(
      1000 +
      (water.gridDeficit || 0) * 22 +
      (water.disconnectedCount || 0) * 520 +
      Math.floor(pop / 5),
      13000
    );

    candidates.push(makeEvent({
      t: '🚱 Awaria wodociągów',
      m: 'Część miasta ma problem z ciśnieniem i dostępem do wody. Mieszkańcy żądają szybkiej reakcji.',
      b: penalty,
      tp: 'err',
      chance: Math.min(0.34, 0.13 + (water.deficit || 0) / 500),
      cooldown: 4,
      priority: 8,
    }));
  }

  if (
    weather.id === 'sunny' &&
    (water.totalDemand || 0) > 0 &&
    ((water.surplus || 0) < 80 || (water.supplyCoverage || 100) < 95)
  ) {
    const penalty = clampPenalty(
      800 +
      Math.max(0, 100 - (water.supplyCoverage || 100)) * 75 +
      Math.floor(pop / 6),
      9000
    );

    candidates.push(makeEvent({
      t: '☀️ Lokalna susza',
      m: 'Upały zwiększyły zużycie wody. Słaba rezerwa wodociągów od razu odbiła się na budżecie.',
      b: penalty,
      tp: 'err',
      chance: 0.16,
      cooldown: 5,
      priority: 5,
    }));
  }

  if ((sewage.disconnectedCount || 0) > 0) {
    const penalty = clampPenalty(
      1200 +
      (sewage.disconnectedCount || 0) * 650 +
      Math.floor(pop / 5),
      15000
    );

    candidates.push(makeEvent({
      t: '🧪 Kontrola sanepidu',
      m: 'Sanepid wykrył budynki bez kanalizacji. Miasto musi zapłacić za działania awaryjne.',
      b: penalty,
      tp: 'err',
      chance: Math.min(0.38, 0.14 + (sewage.disconnectedCount || 0) * 0.035),
      cooldown: 4,
      priority: 9,
    }));
  }

  if ((sewage.treatmentDeficit || 0) > 10) {
    const penalty = clampPenalty(
      1000 +
      (sewage.treatmentDeficit || 0) * 26 +
      Math.floor(pop / 6),
      14000
    );

    candidates.push(makeEvent({
      t: '🏗️ Przeciążenie oczyszczalni',
      m: 'Oczyszczalnia nie wyrabia z ilością ścieków. Rosną koszty awaryjnego oczyszczania.',
      b: penalty,
      tp: 'err',
      chance: Math.min(0.34, 0.12 + (sewage.treatmentDeficit || 0) / 420),
      cooldown: 4,
      priority: 8,
    }));
  }

  if (
    (weather.id === 'rainy' || weather.id === 'storm') &&
    (sewage.totalLoad || 0) > 0 &&
    ((sewage.serviceEfficiency || 100) < 95 || (sewage.surplus || 0) < 60)
  ) {
    const penalty = clampPenalty(
      900 +
      Math.max(0, 100 - (sewage.serviceEfficiency || 100)) * 65 +
      Math.floor(pop / 7),
      10000
    );

    candidates.push(makeEvent({
      t: '🌊 Ulewa przeciąża kanalizację',
      m: 'Intensywne opady przeciążyły słabą kanalizację. Potrzebne są prace awaryjne.',
      b: penalty,
      tp: 'err',
      chance: weather.id === 'storm' ? 0.24 : 0.14,
      cooldown: 5,
      priority: 6,
    }));
  }

  const infrastructureStable =
    (power.serviceEfficiency || 0) >= 95 &&
    (water.serviceEfficiency || 0) >= 95 &&
    (sewage.serviceEfficiency || 0) >= 95 &&
    (power.disconnectedCount || 0) === 0 &&
    (water.disconnectedCount || 0) === 0 &&
    (sewage.disconnectedCount || 0) === 0 &&
    pop > 180;

  if (infrastructureStable) {
    const bonus = clampBonus(1500 + Math.floor(pop / 3), 9000);

    candidates.push(makeEvent({
      t: '✅ Dotacja za stabilną infrastrukturę',
      m: 'Region nagrodził miasto za stabilną sieć prądu, wody i kanalizacji.',
      b: bonus,
      tp: 'ok',
      chance: 0.055,
      cooldown: 6,
      priority: 1,
    }));
  }

  return pickEvent(candidates);
}