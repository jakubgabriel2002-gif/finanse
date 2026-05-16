import { BD } from '../../data.js';
import {
  getWaterSupplyConnectedPipes,
  isInWaterPipeRange,
  WATERPIPE_RANGE,
} from './waterPipes.js';

/**
 * System czystej wody — Etap 8C.
 *
 * Wodociągi produkują wodę.
 * Oczyszczalnia NIE produkuje już wody — od teraz obsługuje ścieki.
 */

function getBuildingWaterDemand(building) {
  const data = BD[building.type];
  if (!data) return 0;

  if (building.type === 'waterplant') return 0;
  if (building.type === 'sewage') return 0;

  return Math.max(0, (data.wt || 0) * building.lv);
}

function getBuildingWaterSupply(building) {
  const data = BD[building.type];
  if (!data) return 0;

  if (building.type !== 'waterplant') return 0;

  return Math.abs((data.wt || 0) * building.lv);
}

function isBuildingConnectedToWater(building, demand, activeWaterPipes) {
  if (demand <= 0) return true;

  return isInWaterPipeRange(building.x, building.y, activeWaterPipes);
}

export function calcWater(activeBuildings, waterPipes = new Set()) {
  const activeWaterPipes = getWaterSupplyConnectedPipes(waterPipes, activeBuildings);

  let connectedDemand = 0;
  let disconnectedDemand = 0;
  let supply = 0;

  const consumers = [];
  const producers = [];
  const disconnectedConsumers = [];

  activeBuildings.forEach(building => {
    const data = BD[building.type];
    if (!data) return;

    const demand = getBuildingWaterDemand(building);
    const produced = getBuildingWaterSupply(building);

    if (produced > 0) {
      supply += produced;

      producers.push({
        uid: building.uid,
        type: building.type,
        name: data.n,
        icon: data.e,
        level: building.lv,
        value: produced,
        connected: true,
      });
    }

    if (demand > 0) {
      const connected = isBuildingConnectedToWater(building, demand, activeWaterPipes);

      const consumer = {
        uid: building.uid,
        type: building.type,
        name: data.n,
        icon: data.e,
        level: building.lv,
        value: demand,
        connected,
      };

      consumers.push(consumer);

      if (connected) {
        connectedDemand += demand;
      } else {
        disconnectedDemand += demand;
        disconnectedConsumers.push(consumer);
      }
    }
  });

  const totalDemand = connectedDemand + disconnectedDemand;
  const gridDeficit = Math.max(0, connectedDemand - supply);
  const deficit = gridDeficit + disconnectedDemand;
  const surplus = gridDeficit > 0 ? 0 : Math.max(0, supply - connectedDemand);
  const balance = supply - connectedDemand;
  const ok = deficit <= 0;

  const networkCoverage = totalDemand > 0
    ? Math.round((connectedDemand / totalDemand) * 100)
    : 100;

  const supplyCoverage = connectedDemand > 0
    ? Math.min(100, Math.round((supply / connectedDemand) * 100))
    : 100;

  const serviceEfficiency = totalDemand > 0
    ? Math.min(100, Math.round((Math.min(supply, connectedDemand) / totalDemand) * 100))
    : 100;

  return {
    demand: Math.floor(connectedDemand),
    connectedDemand: Math.floor(connectedDemand),
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

    waterPipeRange: WATERPIPE_RANGE,
    waterPipeCount: waterPipes?.size || 0,
    activeWaterPipeCount: activeWaterPipes.size,
    inactiveWaterPipeCount: Math.max(0, (waterPipes?.size || 0) - activeWaterPipes.size),

    legacyWt: deficit > 0
      ? Math.floor(deficit)
      : Math.floor(connectedDemand - supply),

    consumers,
    producers,
    nodes: producers.map(producer => ({
      uid: producer.uid,
      type: producer.type,
      name: producer.name,
      icon: producer.icon,
      level: producer.level,
      range: WATERPIPE_RANGE,
    })),
    disconnectedConsumers,
    disconnectedUIDs: disconnectedConsumers.map(item => item.uid),
    disconnectedCount: disconnectedConsumers.length,
  };
}