import { BD } from '../../data.js';

export const FILTER_REDUCTION = 0.5;

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
  if (!building.co2f) return baseEmission;

  return baseEmission * FILTER_REDUCTION;
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

function sortByValueDesc(items) {
  return [...items].sort((a, b) => b.value - a.value);
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

    const baseEmission = getBaseEmission(building);

    if (baseEmission > 0) {
      const finalEmission = getFilteredEmission(building, baseEmission);
      const reduction = Math.max(0, baseEmission - finalEmission);

      gross += finalEmission;
      filteredReduction += reduction;

      emitters.push({
        uid: building.uid,
        type: building.type,
        icon: data.e,
        name: data.n,
        level: building.lv,
        value: finalEmission,
        baseValue: baseEmission,
        reduction,
        hasFilter: !!building.co2f,
      });

      if (reduction > 0) {
        reducers.push({
          uid: building.uid,
          type: building.type,
          icon: data.e,
          name: data.n,
          level: building.lv,
          value: reduction,
          source: 'filter',
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
      });
    }
  });

  const infrastructurePenalty = Math.max(0, extraEmission || 0);
  const totalGross = gross + infrastructurePenalty;
  const totalReduction = filteredReduction + absorption;
  const net = totalGross - absorption;
  const airQuality = Math.round(getAirQuality(net));
  const level = getAirLevel(airQuality);
  const penalty = getPollutionPenalty(net, airQuality);

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

    ok: airQuality >= 70,
    warning: airQuality < 70 && airQuality >= 45,
    critical: airQuality < 45,

    emitters: sortByValueDesc(emitters).map(item => ({
      ...item,
      value: Math.floor(item.value),
      baseValue: Math.floor(item.baseValue),
      reduction: Math.floor(item.reduction),
    })),

    reducers: sortByValueDesc(reducers).map(item => ({
      ...item,
      value: Math.floor(item.value),
    })),

    topEmitter: sortByValueDesc(emitters)[0] || null,
    topReducer: sortByValueDesc(reducers)[0] || null,
  };
}