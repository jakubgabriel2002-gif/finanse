export const WATERPIPE_COST = 120;
export const WATERPIPE_RANGE = 3;

export const WATER_SOURCE_TYPES = [
  'waterplant',
  'sewage',
];

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

export function getSourceConnectedWaterPipes(waterPipes, buildings) {
  const allPipes = new Set(waterPipes || []);
  const activeSources = buildings.filter(isWaterSourceBuilding);

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

export function isInConnectedWaterPipeRange(x, y, waterPipes, buildings) {
  const connectedPipes = getSourceConnectedWaterPipes(waterPipes, buildings);
  return isInWaterPipeRange(x, y, connectedPipes);
}