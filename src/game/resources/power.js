import { BD } from '../../data.js';

/**
 * System energii / prądu.
 *
 * Etap 7:
 * - dodaliśmy sieć energetyczną,
 * - Ratusz, elektrownie, farmy solarne, wiatraki i podstacje są punktami sieci,
 * - budynki poza zasięgiem sieci są odcięte,
 * - odcięte budynki nie są liczone jako normalnie zasilane.
 */

const NETWORK_RANGE = {
  townhall: 6,
  substation: 7,
  powerplant: 8,
  solar: 5,
  windmill: 5,
};

function getWeatherSolarMultiplier(weather) {
  return weather?.sm || 1;
}

function getBuildingPowerValue(building, weather) {
  const data = BD[building.type];
  if (!data) return 0;

  const basePower = data.pw || 0;

  if (building.type === 'solar') {
    return basePower * building.lv * getWeatherSolarMultiplier(weather);
  }

  if (basePower > 0) {
    return basePower * building.lv * (building.solar ? 0.5 : 1);
  }

  return basePower * building.lv;
}

function getNetworkRange(building) {
  const baseRange = NETWORK_RANGE[building.type] || 0;

  if (!baseRange) return 0;

  // Upgrade budynku lekko zwiększa zasięg sieci.
  return baseRange + Math.max(0, building.lv - 1);
}

function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function isNetworkNode(entry) {
  if (!entry?.building) return false;

  if (entry.type === 'townhall') return true;
  if (entry.type === 'substation') return true;

  return entry.powerValue < 0;
}

function isConnectedToNetwork(entry, nodes) {
  if (!entry?.building) return false;

  // Same punkty sieci są zawsze częścią sieci.
  if (isNetworkNode(entry)) return true;

  if (!nodes.length) return false;

  return nodes.some(node => distance(entry.building, node.building) <= node.range);
}

export function calcPower(activeBuildings, weather) {
  const entries = activeBuildings
    .map(building => {
      const data = BD[building.type];
      if (!data) return null;

      return {
        building,
        uid: building.uid,
        type: building.type,
        data,
        powerValue: getBuildingPowerValue(building, weather),
      };
    })
    .filter(Boolean);

  const nodes = entries
    .filter(isNetworkNode)
    .map(entry => ({
      uid: entry.uid,
      type: entry.type,
      name: entry.data.n,
      icon: entry.data.e,
      x: entry.building.x,
      y: entry.building.y,
      level: entry.building.lv,
      range: getNetworkRange(entry.building),
      building: entry.building,
    }));

  let demand = 0;
  let supply = 0;
  let disconnectedDemand = 0;

  const consumers = [];
  const producers = [];
  const disconnectedConsumers = [];

  entries.forEach(entry => {
    const building = entry.building;
    const value = entry.powerValue;
    const connected = isConnectedToNetwork(entry, nodes);

    if (value > 0) {
      const consumer = {
        uid: building.uid,
        type: building.type,
        name: entry.data.n,
        icon: entry.data.e,
        level: building.lv,
        value,
        connected,
      };

      consumers.push(consumer);

      if (connected) {
        demand += value;
      } else {
        disconnectedDemand += value;
        disconnectedConsumers.push(consumer);
      }
    }

    if (value < 0) {
      const produced = Math.abs(value);

      supply += produced;

      producers.push({
        uid: building.uid,
        type: building.type,
        name: entry.data.n,
        icon: entry.data.e,
        level: building.lv,
        value: produced,
        connected,
      });
    }
  });

  const totalDemand = demand + disconnectedDemand;
  const gridDeficit = Math.max(0, demand - supply);
  const deficit = gridDeficit + disconnectedDemand;
  const surplus = gridDeficit > 0 ? 0 : Math.max(0, supply - demand);
  const balance = supply - demand;
  const ok = deficit <= 0;

  const networkCoverage = totalDemand > 0
    ? Math.round((demand / totalDemand) * 100)
    : 100;

  const supplyCoverage = demand > 0
    ? Math.min(100, Math.round((supply / demand) * 100))
    : 100;

  const serviceEfficiency = totalDemand > 0
    ? Math.min(100, Math.round((Math.min(supply, demand) / totalDemand) * 100))
    : 100;

  return {
    demand: Math.floor(demand),
    connectedDemand: Math.floor(demand),
    disconnectedDemand: Math.floor(disconnectedDemand),
    totalDemand: Math.floor(totalDemand),

    supply: Math.floor(supply),
    balance: Math.floor(balance),
    gridDeficit: Math.floor(gridDeficit),
    deficit: Math.floor(deficit),
    surplus: Math.floor(surplus),
    ok,

    networkCoverage,
    supplyCoverage,
    serviceEfficiency,

    legacyPw: deficit > 0
      ? Math.floor(deficit)
      : Math.floor(demand - supply),

    consumers,
    producers,
    nodes: nodes.map(({ building, ...node }) => node),
    disconnectedConsumers,
    disconnectedUIDs: disconnectedConsumers.map(item => item.uid),
    disconnectedCount: disconnectedConsumers.length,
  };
}