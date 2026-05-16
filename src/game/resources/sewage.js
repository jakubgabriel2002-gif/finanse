import { BD } from '../../data.js';
import {
  getSewageConnectedPipes,
  isInWaterPipeRange,
  WATERPIPE_RANGE,
} from './waterPipes.js';

/**
 * System kanalizacji — Etap 8C.
 *
 * Budynki generują ścieki.
 * Oczyszczalnia odbiera i oczyszcza ścieki.
 * Ta sama sieć rur wod-kan jest używana do kanalizacji,
 * ale tylko rury połączone z oczyszczalnią obsługują ścieki.
 */

const SEWAGE_LOAD_MULTIPLIER = {
  apartment: 0.9,
  house: 0.9,
  factory: 1.1,
  shop: 0.7,
  office: 0.7,
  bank: 0.5,
  hospital: 1.2,
  school: 0.8,
  police: 0.4,
  fire: 0.4,
  bus: 0.2,
  tram: 0.2,
  metro: 0.3,
};

function getBuildingSewageLoad(building) {
  const data = BD[building.type];
  if (!data) return 0;

  if (building.type === 'sewage') return 0;
  if (building.type === 'waterplant') return 0;

  const baseWaterUse = Math.max(0, data.wt || 0);
  const multiplier = SEWAGE_LOAD_MULTIPLIER[building.type] ?? 0;

  return baseWaterUse * building.lv * multiplier;
}

function getBuildingSewageCapacity(building) {
  const data = BD[building.type];
  if (!data) return 0;

  if (building.type !== 'sewage') return 0;

  // Obecnie oczyszczalnia ma wt:-40 w data.js.
  // Używamy tego jako bazowej pojemności oczyszczania.
  return Math.abs(data.wt || 0) * building.lv;
}

function isBuildingConnectedToSewage(building, load, activeSewagePipes) {
  if (load <= 0) return true;

  return isInWaterPipeRange(building.x, building.y, activeSewagePipes);
}

export function calcSewage(activeBuildings, waterPipes = new Set()) {
  const activeSewagePipes = getSewageConnectedPipes(waterPipes, activeBuildings);

  let connectedLoad = 0;
  let disconnectedLoad = 0;
  let treatmentCapacity = 0;

  const consumers = [];
  const treatmentPlants = [];
  const disconnectedConsumers = [];

  activeBuildings.forEach(building => {
    const data = BD[building.type];
    if (!data) return;

    const load = getBuildingSewageLoad(building);
    const capacity = getBuildingSewageCapacity(building);

    if (capacity > 0) {
      treatmentCapacity += capacity;

      treatmentPlants.push({
        uid: building.uid,
        type: building.type,
        name: data.n,
        icon: data.e,
        level: building.lv,
        value: capacity,
        connected: true,
      });
    }

    if (load > 0) {
      const connected = isBuildingConnectedToSewage(building, load, activeSewagePipes);

      const consumer = {
        uid: building.uid,
        type: building.type,
        name: data.n,
        icon: data.e,
        level: building.lv,
        value: load,
        connected,
      };

      consumers.push(consumer);

      if (connected) {
        connectedLoad += load;
      } else {
        disconnectedLoad += load;
        disconnectedConsumers.push(consumer);
      }
    }
  });

  const totalLoad = connectedLoad + disconnectedLoad;
  const treatmentDeficit = Math.max(0, connectedLoad - treatmentCapacity);
  const deficit = treatmentDeficit + disconnectedLoad;
  const surplus = treatmentDeficit > 0 ? 0 : Math.max(0, treatmentCapacity - connectedLoad);
  const balance = treatmentCapacity - connectedLoad;
  const ok = deficit <= 0;

  const networkCoverage = totalLoad > 0
    ? Math.round((connectedLoad / totalLoad) * 100)
    : 100;

  const treatmentCoverage = connectedLoad > 0
    ? Math.min(100, Math.round((treatmentCapacity / connectedLoad) * 100))
    : 100;

  const serviceEfficiency = totalLoad > 0
    ? Math.min(100, Math.round((Math.min(treatmentCapacity, connectedLoad) / totalLoad) * 100))
    : 100;

  return {
    load: Math.floor(connectedLoad),
    connectedLoad: Math.floor(connectedLoad),
    disconnectedLoad: Math.floor(disconnectedLoad),
    totalLoad: Math.floor(totalLoad),

    treatmentCapacity: Math.floor(treatmentCapacity),
    balance: Math.floor(balance),
    treatmentDeficit: Math.floor(treatmentDeficit),
    deficit: Math.floor(deficit),
    surplus: Math.floor(surplus),
    ok,

    networkCoverage,
    treatmentCoverage,
    serviceEfficiency,

    sewagePipeRange: WATERPIPE_RANGE,
    sewagePipeCount: waterPipes?.size || 0,
    activeSewagePipeCount: activeSewagePipes.size,
    inactiveSewagePipeCount: Math.max(0, (waterPipes?.size || 0) - activeSewagePipes.size),

    legacySewage: deficit > 0
      ? Math.floor(deficit)
      : Math.floor(connectedLoad - treatmentCapacity),

    consumers,
    treatmentPlants,
    nodes: treatmentPlants.map(plant => ({
      uid: plant.uid,
      type: plant.type,
      name: plant.name,
      icon: plant.icon,
      level: plant.level,
      range: WATERPIPE_RANGE,
    })),
    disconnectedConsumers,
    disconnectedUIDs: disconnectedConsumers.map(item => item.uid),
    disconnectedCount: disconnectedConsumers.length,
  };
}