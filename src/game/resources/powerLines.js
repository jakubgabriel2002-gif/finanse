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