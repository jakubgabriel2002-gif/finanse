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

function hasPolicy(gameState, policyId) {
  return !!gameState?.policies?.[policyId];
}

function getActiveEcoPolicyCount(gameState) {
  return [
    'green',
    'cleanAir',
    'industryRules',
    'lowEmissionZone',
  ].filter(policyId => hasPolicy(gameState, policyId)).length;
}

function getSmogRisk(emissions) {
  if (!emissions) return 0;

  const airQuality = emissions.airQuality ?? 100;
  const net = emissions.net || 0;

  if (airQuality < 20 || net > 220) return 5;
  if (airQuality < 35 || net > 160) return 4;
  if (airQuality < 50 || net > 110) return 3;
  if (airQuality < 70 || net > 70) return 2;
  if (airQuality < 85 || net > 35) return 1;

  return 0;
}

function getCleanCityScore(emissions) {
  if (!emissions) return 0;

  const airQuality = emissions.airQuality ?? 0;
  const greenCoverage = emissions.greenCoverage?.coverage ?? 0;
  const net = emissions.net || 0;

  let score = 0;

  if (airQuality >= 90) score += 3;
  else if (airQuality >= 80) score += 2;
  else if (airQuality >= 70) score += 1;

  if (greenCoverage >= 80) score += 2;
  else if (greenCoverage >= 55) score += 1;

  if (net <= 0) score += 2;
  else if (net <= 25) score += 1;

  return score;
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
  const emissions = stats.emissions || {};
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

  const smogRisk = getSmogRisk(emissions);
  const cleanCityScore = getCleanCityScore(emissions);
  const ecoPolicyCount = getActiveEcoPolicyCount(gameState);
  const airQuality = emissions.airQuality ?? 100;
  const netEmission = emissions.net || 0;
  const greenCoverage = emissions.greenCoverage?.coverage ?? 100;
  const topEmitter = emissions.topEmitter;

  if (smogRisk >= 3 && pop > 80) {
    const penalty = clampPenalty(
      1400 +
      smogRisk * 850 +
      Math.max(0, 60 - airQuality) * 95 +
      Math.floor(pop / 4),
      22000
    );

    candidates.push(makeEvent({
      t: '☠️ Alarm smogowy',
      m: `Jakość powietrza spadła do ${airQuality}%. Mieszkańcy skarżą się na smog i ograniczają aktywność w mieście.`,
      b: penalty,
      tp: 'err',
      chance: Math.min(0.38, 0.08 + smogRisk * 0.055),
      cooldown: 5,
      priority: 10,
    }));
  }

  if (smogRisk >= 4 && pop > 140) {
    const penalty = clampPenalty(
      1800 +
      smogRisk * 900 +
      Math.floor(pop / 3),
      26000
    );

    candidates.push(makeEvent({
      t: '🏥 Wzrost zachorowań przez smog',
      m: 'Szpitale odnotowały więcej przypadków problemów z oddychaniem. Miasto ponosi koszty interwencji zdrowotnej.',
      b: penalty,
      tp: 'err',
      chance: Math.min(0.3, 0.07 + smogRisk * 0.045),
      cooldown: 6,
      priority: 9,
    }));
  }

  if (netEmission > 120 && ecoPolicyCount === 0) {
    const penalty = clampPenalty(
      1600 +
      netEmission * 32 +
      Math.floor(pop / 5),
      24000
    );

    candidates.push(makeEvent({
      t: '🏭 Kara za przekroczenie emisji',
      m: `Inspektorat środowiska ukarał miasto za wysoką emisję CO₂. Największy problem: ${topEmitter ? `${topEmitter.icon} ${topEmitter.name}` : 'brak danych'}.`,
      b: penalty,
      tp: 'err',
      chance: Math.min(0.28, 0.06 + netEmission / 900),
      cooldown: 6,
      priority: 8,
    }));
  }

  if (netEmission > 90 && ecoPolicyCount > 0) {
    const penalty = clampPenalty(
      900 +
      netEmission * 18 +
      Math.floor(pop / 8),
      14000
    );

    candidates.push(makeEvent({
      t: '📋 Koszt dostosowania do norm emisji',
      m: 'Aktywne polityki ekologiczne ograniczyły karę, ale miasto nadal musi finansować działania naprawcze.',
      b: penalty,
      tp: 'err',
      chance: Math.min(0.18, 0.04 + netEmission / 1200),
      cooldown: 5,
      priority: 5,
    }));
  }

  if (
    weather.id === 'sunny' &&
    smogRisk >= 2 &&
    greenCoverage < 55
  ) {
    const penalty = clampPenalty(
      900 +
      Math.max(0, 55 - greenCoverage) * 80 +
      smogRisk * 500,
      12000
    );

    candidates.push(makeEvent({
      t: '🌡️ Miejska wyspa ciepła',
      m: 'Brak zieleni i wysoka emisja podbiły temperaturę w mieście. Mieszkańcy domagają się parków i zielonych dachów.',
      b: penalty,
      tp: 'err',
      chance: Math.min(0.24, 0.05 + smogRisk * 0.04),
      cooldown: 5,
      priority: 6,
    }));
  }

  if (
    (weather.id === 'cloudy' || weather.id === 'sunny') &&
    smogRisk <= 1 &&
    cleanCityScore >= 4 &&
    pop > 120
  ) {
    const bonus = clampBonus(
      1500 +
      cleanCityScore * 700 +
      Math.floor(pop / 5),
      14000
    );

    candidates.push(makeEvent({
      t: '🌿 Dotacja ekologiczna',
      m: `Miasto dostało dotację za czyste powietrze i zieloną infrastrukturę. Jakość powietrza: ${airQuality}%.`,
      b: bonus,
      tp: 'ok',
      chance: Math.min(0.16, 0.04 + cleanCityScore * 0.018),
      cooldown: 6,
      priority: 3,
    }));
  }

  if (
    weather.id === 'storm' &&
    smogRisk >= 1 &&
    netEmission < 130
  ) {
    const bonus = clampBonus(
      600 +
      Math.max(0, 100 - airQuality) * 18 +
      Math.floor(pop / 12),
      7000
    );

    candidates.push(makeEvent({
      t: '🌬️ Silny wiatr przewietrzył miasto',
      m: 'Burza i silny wiatr tymczasowo poprawiły jakość powietrza. Miasto uniknęło części kosztów smogu.',
      b: bonus,
      tp: 'ok',
      chance: 0.08,
      cooldown: 4,
      priority: 2,
    }));
  }

  if (
    hasPolicy(gameState, 'cleanAir') &&
    airQuality >= 75 &&
    pop > 160
  ) {
    const bonus = clampBonus(
      1000 +
      Math.floor(pop / 6) +
      (hasPolicy(gameState, 'industryRules') ? 900 : 0) +
      (hasPolicy(gameState, 'lowEmissionZone') ? 700 : 0),
      10000
    );

    candidates.push(makeEvent({
      t: '🌬️ Premia za program czystego powietrza',
      m: 'Program czystego powietrza przyniósł mierzalne efekty. Miasto dostało dodatkowe środki.',
      b: bonus,
      tp: 'ok',
      chance: 0.075,
      cooldown: 6,
      priority: 2,
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