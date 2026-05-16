import { BD } from '../../data.js';
import {
  getFilterLevel,
  getFilterEmissionMultiplier,
  getFilterReductionPercent,
  getGreenRoofAbsorption,
  hasGreenRoof,
} from '../buildingUpgrades.js';

const CO2_TYPE_MULTIPLIER = {
  factory: 1.15,
  powerplant: 1.2,
  office: 1,
  hospital: 1,
  shop: 0.9,
  apartment: 0.85,
  house: 0.75,
  police: 0.8,
  fire: 0.9,
  bus: 1,
  tram: 0.45,
  metro: 0.35,
  waterplant: 0.8,
  sewage: 0.75,
};

const GREEN_TARGET_TYPES = [
  'apartment',
  'house',
  'shop',
  'office',
  'bank',
  'hospital',
  'school',
  'police',
  'fire',
  'townhall',
];

function getDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getBuildingEmissionMultiplier(type) {
  return CO2_TYPE_MULTIPLIER[type] ?? 1;
}

function getBaseEmission(building) {
  const data = BD[building.type];
  if (!data) return 0;

  const base = (data.co2 || 0) * building.lv;
  const multiplier = getBuildingEmissionMultiplier(building.type);

  return base * multiplier;
}

function getFilteredEmission(building, baseEmission) {
  if (baseEmission <= 0) return baseEmission;

  return baseEmission * getFilterEmissionMultiplier(building);
}

function getAbsorption(building, baseEmission) {
  if (baseEmission >= 0) return 0;
  return Math.abs(baseEmission);
}

function getAirQuality(netEmission) {
  if (netEmission <= 0) return 100;
  if (netEmission <= 30) return Math.max(82, 100 - netEmission * 0.6);
  if (netEmission <= 80) return Math.max(55, 82 - (netEmission - 30) * 0.54);
  if (netEmission <= 160) return Math.max(25, 55 - (netEmission - 80) * 0.38);

  return Math.max(0, 25 - (netEmission - 160) * 0.18);
}

function getAirLevel(airQuality) {
  if (airQuality >= 90) {
    return {
      id: 'excellent',
      label: 'Doskonałe',
      icon: '🌿',
      color: '#00e87a',
    };
  }

  if (airQuality >= 70) {
    return {
      id: 'good',
      label: 'Dobre',
      icon: '✅',
      color: '#00b4ff',
    };
  }

  if (airQuality >= 45) {
    return {
      id: 'medium',
      label: 'Średnie',
      icon: '⚠️',
      color: '#ffd700',
    };
  }

  if (airQuality >= 20) {
    return {
      id: 'bad',
      label: 'Złe',
      icon: '🏭',
      color: '#ff9944',
    };
  }

  return {
    id: 'critical',
    label: 'Krytyczne',
    icon: '☠️',
    color: '#ff3d5a',
  };
}

function getPollutionPenalty(netEmission, airQuality) {
  if (netEmission <= 0) {
    return {
      env: 8,
      housing: 3,
      services: 2,
    };
  }

  if (airQuality >= 90) {
    return {
      env: 5,
      housing: 2,
      services: 1,
    };
  }

  if (airQuality >= 70) {
    return {
      env: 0,
      housing: 0,
      services: 0,
    };
  }

  if (airQuality >= 45) {
    return {
      env: -Math.ceil((70 - airQuality) / 4),
      housing: -Math.ceil((70 - airQuality) / 12),
      services: -Math.ceil((70 - airQuality) / 15),
    };
  }

  if (airQuality >= 20) {
    return {
      env: -Math.ceil((70 - airQuality) / 2.5),
      housing: -Math.ceil((70 - airQuality) / 8),
      services: -Math.ceil((70 - airQuality) / 10),
    };
  }

  return {
    env: -28,
    housing: -9,
    services: -7,
  };
}

function getGreenCoverageBonus(coverage) {
  if (coverage >= 90) {
    return {
      env: 8,
      housing: 5,
      services: 4,
    };
  }

  if (coverage >= 70) {
    return {
      env: 6,
      housing: 4,
      services: 3,
    };
  }

  if (coverage >= 45) {
    return {
      env: 4,
      housing: 2,
      services: 2,
    };
  }

  if (coverage >= 20) {
    return {
      env: 2,
      housing: 1,
      services: 1,
    };
  }

  return {
    env: 0,
    housing: 0,
    services: 0,
  };
}

function sortByValueDesc(items) {
  return [...items].sort((a, b) => b.value - a.value);
}

function sortByCoveredDesc(items) {
  return [...items].sort((a, b) => b.coveredTargets - a.coveredTargets);
}

function getGreenSourceForBuilding(building) {
  const data = BD[building.type];
  if (!data) return null;

  if (building.type === 'park') {
    return {
      uid: building.uid,
      type: building.type,
      icon: data.e,
      name: data.n,
      level: building.lv,
      x: building.x,
      y: building.y,
      range: 3 + Math.min(3, building.lv || 1),
      value: 12 * Math.max(1, building.lv || 1),
      source: 'park',
      label: 'park',
    };
  }

  if (hasGreenRoof(building)) {
    return {
      uid: building.uid,
      type: building.type,
      icon: data.e,
      name: data.n,
      level: building.lv,
      x: building.x,
      y: building.y,
      range: 2,
      value: getGreenRoofAbsorption(building),
      source: 'greenRoof',
      label: 'zielony dach',
    };
  }

  return null;
}

function isGreenTarget(building) {
  return GREEN_TARGET_TYPES.includes(building.type);
}

function calcGreenCoverage(activeBuildings) {
  const targets = activeBuildings
    .filter(isGreenTarget)
    .map(building => {
      const data = BD[building.type];

      return {
        uid: building.uid,
        type: building.type,
        icon: data?.e || '🏢',
        name: data?.n || building.type,
        level: building.lv,
        x: building.x,
        y: building.y,
      };
    });

  const sources = activeBuildings
    .map(getGreenSourceForBuilding)
    .filter(Boolean);

  if (!targets.length) {
    return {
      coverage: 100,
      coveredCount: 0,
      targetCount: 0,
      uncoveredCount: 0,
      sourceCount: sources.length,
      bonus: getGreenCoverageBonus(100),
      targets: [],
      sources: sources.map(source => ({
        ...source,
        coveredTargets: 0,
      })),
      topSources: [],
      uncoveredTargets: [],
    };
  }

  const sourceCoverage = new Map(
    sources.map(source => [source.uid, 0])
  );

  const evaluatedTargets = targets.map(target => {
    const coveringSources = sources.filter(source =>
      getDistance(target, source) <= source.range
    );

    coveringSources.forEach(source => {
      sourceCoverage.set(source.uid, (sourceCoverage.get(source.uid) || 0) + 1);
    });

    return {
      ...target,
      covered: coveringSources.length > 0,
      coveringSources: coveringSources.map(source => ({
        uid: source.uid,
        type: source.type,
        icon: source.icon,
        name: source.name,
        source: source.source,
        range: source.range,
      })),
    };
  });

  const coveredCount = evaluatedTargets.filter(target => target.covered).length;
  const targetCount = evaluatedTargets.length;
  const coverage = Math.round((coveredCount / targetCount) * 100);

  const sourcesWithCoverage = sources.map(source => ({
    ...source,
    coveredTargets: sourceCoverage.get(source.uid) || 0,
  }));

  return {
    coverage,
    coveredCount,
    targetCount,
    uncoveredCount: targetCount - coveredCount,
    sourceCount: sources.length,
    bonus: getGreenCoverageBonus(coverage),
    targets: evaluatedTargets,
    sources: sourcesWithCoverage,
    topSources: sortByCoveredDesc(sourcesWithCoverage).filter(source => source.coveredTargets > 0),
    uncoveredTargets: evaluatedTargets.filter(target => !target.covered),
  };
}

export function getBuildingEmissionPreview(building) {
  const data = BD[building?.type];
  if (!building || !data) {
    return {
      baseEmission: 0,
      filteredEmission: 0,
      finalEmission: 0,
      filterReduction: 0,
      greenRoofAbsorption: 0,
      reduction: 0,
      filterLevel: 0,
      filterReductionPercent: 0,
      hasGreenRoof: false,
    };
  }

  const baseEmission = getBaseEmission(building);
  const filteredEmission = getFilteredEmission(building, baseEmission);
  const filterReduction = Math.max(0, baseEmission - filteredEmission);
  const greenRoofAbsorption = getGreenRoofAbsorption(building);
  const finalEmission = filteredEmission - greenRoofAbsorption;
  const filterLevel = getFilterLevel(building);

  return {
    baseEmission: Math.floor(baseEmission),
    filteredEmission: Math.floor(filteredEmission),
    finalEmission: Math.floor(finalEmission),
    filterReduction: Math.floor(filterReduction),
    greenRoofAbsorption: Math.floor(greenRoofAbsorption),
    reduction: Math.floor(filterReduction + greenRoofAbsorption),
    filterLevel,
    filterReductionPercent: getFilterReductionPercent(filterLevel),
    hasGreenRoof: hasGreenRoof(building),
  };
}

export function calcEmissions(activeBuildings, extraEmission = 0) {
  let gross = 0;
  let filteredReduction = 0;
  let absorption = 0;

  const emitters = [];
  const reducers = [];

  activeBuildings.forEach(building => {
    const data = BD[building.type];
    if (!data) return;

    const preview = getBuildingEmissionPreview(building);
    const baseEmission = preview.baseEmission;
    const filteredEmission = preview.filteredEmission;
    const filterReduction = preview.filterReduction;
    const greenRoofAbsorption = preview.greenRoofAbsorption;

    if (baseEmission > 0) {
      gross += Math.max(0, filteredEmission);
      filteredReduction += filterReduction;

      emitters.push({
        uid: building.uid,
        type: building.type,
        icon: data.e,
        name: data.n,
        level: building.lv,
        value: Math.max(0, preview.finalEmission),
        baseValue: baseEmission,
        filteredValue: filteredEmission,
        reduction: preview.reduction,
        filterReduction,
        greenRoofAbsorption,
        hasFilter: preview.filterLevel > 0,
        hasGreenRoof: preview.hasGreenRoof,
        filterLevel: preview.filterLevel,
        filterReductionPercent: preview.filterReductionPercent,
      });

      if (filterReduction > 0) {
        reducers.push({
          uid: building.uid,
          type: building.type,
          icon: data.e,
          name: data.n,
          level: building.lv,
          value: filterReduction,
          source: 'filter',
          filterLevel: preview.filterLevel,
          filterReductionPercent: preview.filterReductionPercent,
        });
      }

      if (greenRoofAbsorption > 0) {
        absorption += greenRoofAbsorption;

        reducers.push({
          uid: building.uid,
          type: building.type,
          icon: data.e,
          name: data.n,
          level: building.lv,
          value: greenRoofAbsorption,
          source: 'greenRoof',
          filterLevel: 0,
          filterReductionPercent: 0,
        });
      }
    }

    if (baseEmission < 0) {
      const absorbed = getAbsorption(building, baseEmission);

      absorption += absorbed;

      reducers.push({
        uid: building.uid,
        type: building.type,
        icon: data.e,
        name: data.n,
        level: building.lv,
        value: absorbed,
        source: 'building',
        filterLevel: 0,
        filterReductionPercent: 0,
      });
    }
  });

  const infrastructurePenalty = Math.max(0, extraEmission || 0);
  const totalGross = gross + infrastructurePenalty;
  const totalReduction = filteredReduction + absorption;
  const net = totalGross - absorption;
  const airQuality = Math.round(getAirQuality(net));
  const level = getAirLevel(airQuality);
  const pollutionPenalty = getPollutionPenalty(net, airQuality);
  const greenCoverage = calcGreenCoverage(activeBuildings);

  const penalty = {
    env: pollutionPenalty.env + greenCoverage.bonus.env,
    housing: pollutionPenalty.housing + greenCoverage.bonus.housing,
    services: pollutionPenalty.services + greenCoverage.bonus.services,
  };

  const sortedEmitters = sortByValueDesc(emitters).map(item => ({
    ...item,
    value: Math.floor(item.value),
    baseValue: Math.floor(item.baseValue),
    filteredValue: Math.floor(item.filteredValue),
    reduction: Math.floor(item.reduction),
    filterReduction: Math.floor(item.filterReduction),
    greenRoofAbsorption: Math.floor(item.greenRoofAbsorption),
  }));

  const sortedReducers = sortByValueDesc(reducers).map(item => ({
    ...item,
    value: Math.floor(item.value),
  }));

  return {
    gross: Math.floor(totalGross),
    buildingGross: Math.floor(gross),
    infrastructurePenalty: Math.floor(infrastructurePenalty),

    absorption: Math.floor(absorption),
    filteredReduction: Math.floor(filteredReduction),
    totalReduction: Math.floor(totalReduction),

    net: Math.floor(net),
    airQuality,
    level,
    penalty,
    pollutionPenalty,
    greenCoverage,

    ok: airQuality >= 70,
    warning: airQuality < 70 && airQuality >= 45,
    critical: airQuality < 45,

    emitters: sortedEmitters,
    reducers: sortedReducers,

    topEmitter: sortedEmitters[0] || null,
    topReducer: sortedReducers[0] || null,
  };
}