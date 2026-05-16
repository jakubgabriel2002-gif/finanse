export const POWERLINE_COST = 100;
export const POWERLINE_RANGE = 3;

export const POWER_SOURCE_TYPES = [
  'powerplant',
  'solar',
  'windmill',
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

export function isPowerSourceBuilding(building) {
  return POWER_SOURCE_TYPES.includes(building?.type) && !building.building;
}

export function isNearPowerSource(x, y, buildings) {
  return buildings
    .filter(isPowerSourceBuilding)
    .some(building => distance({ x, y }, building) <= 1);
}

export function isNearPowerLine(x, y, powerLines) {
  return [...powerLines].some(lineKey => {
    const line = parseKey(lineKey);
    return distance({ x, y }, line) <= 1;
  });
}

export function isInPowerLineRange(x, y, powerLines) {
  return [...powerLines].some(lineKey => {
    const line = parseKey(lineKey);
    return distance({ x, y }, line) <= POWERLINE_RANGE;
  });
}

export function canBuildPowerLine({ x, y, terrain, powerLines, buildings }) {
  const key = keyOf(x, y);

  if (terrain === 2) {
    return {
      ok: false,
      reason: '⚠️ Nie można ciągnąć linii przez wodę.',
    };
  }

  if (powerLines.has(key)) {
    return {
      ok: false,
      reason: '⚠️ Tu już jest linia energetyczna.',
    };
  }

  if (isNearPowerSource(x, y, buildings)) {
    return {
      ok: true,
      reason: '',
    };
  }

  if (isNearPowerLine(x, y, powerLines)) {
    return {
      ok: true,
      reason: '',
    };
  }

  return {
    ok: false,
    reason: '⚠️ Linię trzeba ciągnąć od elektrowni/farmy/wiatraka albo od istniejącej linii.',
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

export function getSourceConnectedPowerLines(powerLines, buildings) {
  const allLines = new Set(powerLines || []);
  const activeSources = buildings.filter(isPowerSourceBuilding);

  if (!allLines.size || !activeSources.length) {
    return new Set();
  }

  const queue = [];
  const connected = new Set();

  allLines.forEach(lineKey => {
    const line = parseKey(lineKey);

    const nearSource = activeSources.some(source => distance(line, source) <= 1);

    if (nearSource) {
      connected.add(lineKey);
      queue.push(lineKey);
    }
  });

  while (queue.length) {
    const currentKey = queue.shift();
    const current = parseKey(currentKey);

    getNeighborKeys(current.x, current.y).forEach(nextKey => {
      if (!allLines.has(nextKey)) return;
      if (connected.has(nextKey)) return;

      connected.add(nextKey);
      queue.push(nextKey);
    });
  }

  return connected;
}

export function isInConnectedPowerLineRange(x, y, powerLines, buildings) {
  const connectedLines = getSourceConnectedPowerLines(powerLines, buildings);
  return isInPowerLineRange(x, y, connectedLines);
}