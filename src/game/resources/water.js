import { BD } from '../../data.js';
import {
  getSourceConnectedWaterPipes,
  isInWaterPipeRange,
  WATERPIPE_RANGE,
} from './waterPipes.js';

/**
 * System wody — Etap 8B.
 *
 * Na tym etapie:
 * - rury wod-kan zaczynają realnie wpływać na miasto,
 * - budynki z dodatnim `wt` potrzebują wody,
 * - wodociągi i oczyszczalnia nadal działają jako infrastruktura wod-kan,
 * - budynek bez aktywnej rury jest liczony jako odcięty od wody.
 *
 * W następnym etapie rozdzielimy czystą wodę i ścieki.
 */

function getBuildingWaterValue(building) {
  const data = BD[building.type];
  if (!data) return 0;

  return (data.wt || 0) * building.lv;
}

function isProducerWaterValue(value) {
  return value < 0;
}

function isConsumerWaterValue(value) {
  return value > 0;
}

function isBuildingConnectedToWater(building, waterValue, activeWaterPipes) {
  if (isProducerWaterValue(waterValue)) return true;
  if (!isConsumerWaterValue(waterValue)) return true;

  return isInWaterPipeRange(building.x, building.y, activeWaterPipes);
}

export function calcWater(activeBuildings, waterPipes = new Set()) {
  const activeWaterPipes = getSourceConnectedWaterPipes(waterPipes, activeBuildings);

  const entries = activeBuildings
    .map(building => {
      const data = BD[building.type];
      if (!data) return null;

      return {
        building,
        uid: building.uid,
        type: building.type,
        data,
        waterValue: getBuildingWaterValue(building),
      };
    })
    .filter(Boolean);

  let connectedDemand = 0;
  let disconnectedDemand = 0;
  let supply = 0;

  const consumers = [];
  const producers = [];
  const disconnectedConsumers = [];

  entries.forEach(entry => {
    const building = entry.building;
    const value = entry.waterValue;
    const connected = isBuildingConnectedToWater(building, value, activeWaterPipes);

    if (isConsumerWaterValue(value)) {
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
        connectedDemand += value;
      } else {
        disconnectedDemand += value;
        disconnectedConsumers.push(consumer);
      }
    }

    if (isProducerWaterValue(value)) {
      const produced = Math.abs(value);

      supply += produced;

      producers.push({
        uid: building.uid,
        type: building.type,
        name: entry.data.n,
        icon: entry.data.e,
        level: building.lv,
        value: produced,
        connected: true,
      });
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