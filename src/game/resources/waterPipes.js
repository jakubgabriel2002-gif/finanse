import {
  WATERPIPE_RANGE,
  WATER_SOURCE_TYPES,
  WATER_SUPPLY_SOURCE_TYPES,
  SEWAGE_SOURCE_TYPES,
} from './serviceConfig.js';

export {
  WATERPIPE_COST,
  WATERPIPE_RANGE,
  WATER_SOURCE_TYPES,
  WATER_SUPPLY_SOURCE_TYPES,
  SEWAGE_SOURCE_TYPES,
} from './serviceConfig.js';

export function keyOf(x, y) {
  return `${x},${y}`;
}

export function parseKey(key) {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

export function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function isWaterSourceBuilding(building) {
  return WATER_SOURCE_TYPES.includes(building?.type) && !building.building;
}

export function isWaterSupplySourceBuilding(building) {
  return WATER_SUPPLY_SOURCE_TYPES.includes(building?.type) && !building.building;
}

export function isSewageSourceBuilding(building) {
  return SEWAGE_SOURCE_TYPES.includes(building?.type) && !building.building;
}

export function isNearWaterSource(x, y, buildings) {
  return buildings
    .filter(isWaterSourceBuilding)
    .some(building => distance({ x, y }, building) <= 1);
}

export function isNearWaterPipe(x, y, waterPipes) {
  return [...waterPipes].some(pipeKey => {
    const pipe = parseKey(pipeKey);
    return distance({ x, y }, pipe) <= 1;
  });
}

export function isInWaterPipeRange(x, y, waterPipes) {
  return [...waterPipes].some(pipeKey => {
    const pipe = parseKey(pipeKey);
    return distance({ x, y }, pipe) <= WATERPIPE_RANGE;
  });
}

export function canBuildWaterPipe({ x, y, terrain, waterPipes, buildings, roads }) {
  const key = keyOf(x, y);

  if (terrain === 2) {
    return {
      ok: false,
      reason: '⚠️ Nie można prowadzić rur przez wodę.',
    };
  }

  if (waterPipes.has(key)) {
    return {
      ok: false,
      reason: '⚠️ Tu już jest rura wod-kan.',
    };
  }

  // Droga działa jako legalny korytarz infrastruktury.
  // Rura na drodze może być martwa, dopóki nie połączysz jej ze źródłem.
  if (roads?.has(key)) {
    return {
      ok: true,
      reason: '',
    };
  }

  if (isNearWaterSource(x, y, buildings)) {
    return {
      ok: true,
      reason: '',
    };
  }

  if (isNearWaterPipe(x, y, waterPipes)) {
    return {
      ok: true,
      reason: '',
    };
  }

  return {
    ok: false,
    reason: '⚠️ Rury trzeba ciągnąć od wodociągów, oczyszczalni, drogi albo od istniejącej rury.',
  };
}

function getNeighborKeys(x, y) {
  return [
    keyOf(x + 1, y),
    keyOf(x - 1, y),
    keyOf(x, y + 1),
    keyOf(x, y - 1),
  ];
}

export function getConnectedWaterPipesBySourceTypes(waterPipes, buildings, sourceTypes) {
  const allPipes = new Set(waterPipes || []);
  const activeSources = buildings.filter(building =>
    sourceTypes.includes(building?.type) && !building.building
  );

  if (!allPipes.size || !activeSources.length) {
    return new Set();
  }

  const queue = [];
  const connected = new Set();

  allPipes.forEach(pipeKey => {
    const pipe = parseKey(pipeKey);
    const nearSource = activeSources.some(source => distance(pipe, source) <= 1);

    if (nearSource) {
      connected.add(pipeKey);
      queue.push(pipeKey);
    }
  });

  while (queue.length) {
    const currentKey = queue.shift();
    const current = parseKey(currentKey);

    getNeighborKeys(current.x, current.y).forEach(nextKey => {
      if (!allPipes.has(nextKey)) return;
      if (connected.has(nextKey)) return;

      connected.add(nextKey);
      queue.push(nextKey);
    });
  }

  return connected;
}

// Używane przez mapę/UX — rura jest aktywna, jeśli jest podłączona
// do wodociągów albo oczyszczalni.
export function getSourceConnectedWaterPipes(waterPipes, buildings) {
  return getConnectedWaterPipesBySourceTypes(waterPipes, buildings, WATER_SOURCE_TYPES);
}

export function getWaterSupplyConnectedPipes(waterPipes, buildings) {
  return getConnectedWaterPipesBySourceTypes(waterPipes, buildings, WATER_SUPPLY_SOURCE_TYPES);
}

export function getSewageConnectedPipes(waterPipes, buildings) {
  return getConnectedWaterPipesBySourceTypes(waterPipes, buildings, SEWAGE_SOURCE_TYPES);
}

export function isInConnectedWaterPipeRange(x, y, waterPipes, buildings) {
  const connectedPipes = getSourceConnectedWaterPipes(waterPipes, buildings);
  return isInWaterPipeRange(x, y, connectedPipes);
}