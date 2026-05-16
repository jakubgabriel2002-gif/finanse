import { BD } from '../../data.js';
import {
  getSourceConnectedPowerLines,
  isInPowerLineRange,
  POWERLINE_RANGE,
} from './powerLines.js';

/**
 * System energii.
 *
 * Etap 7B:
 * - źródła energii produkują prąd,
 * - linie energetyczne muszą być połączone ze źródłem,
 * - budynki mają prąd tylko w zasięgu aktywnej linii,
 * - linie niepołączone ze źródłem nie zasilają miasta.
 */

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

function isProducerPowerValue(value) {
  return value < 0;
}

function isConsumerPowerValue(value) {
  return value > 0;
}

function isBuildingConnectedToPower(building, powerValue, activePowerLines) {
  // Źródła energii same są częścią systemu.
  if (isProducerPowerValue(powerValue)) return true;

  // Budynek bez zapotrzebowania na prąd nie psuje sieci.
  if (!isConsumerPowerValue(powerValue)) return true;

  return isInPowerLineRange(building.x, building.y, activePowerLines);
}

export function calcPower(activeBuildings, weather, powerLines = new Set()) {
  const activePowerLines = getSourceConnectedPowerLines(powerLines, activeBuildings);

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

  let connectedDemand = 0;
  let disconnectedDemand = 0;
  let supply = 0;

  const consumers = [];
  const producers = [];
  const disconnectedConsumers = [];

  entries.forEach(entry => {
    const building = entry.building;
    const value = entry.powerValue;
    const connected = isBuildingConnectedToPower(building, value, activePowerLines);

    if (isConsumerPowerValue(value)) {
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

    if (isProducerPowerValue(value)) {
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
    : supply > 0 ? 100 : 100;

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

    powerLineRange: POWERLINE_RANGE,
    powerLineCount: powerLines?.size || 0,
    activePowerLineCount: activePowerLines.size,
    inactivePowerLineCount: Math.max(0, (powerLines?.size || 0) - activePowerLines.size),

    legacyPw: deficit > 0
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
      range: POWERLINE_RANGE,
    })),
    disconnectedConsumers,
    disconnectedUIDs: disconnectedConsumers.map(item => item.uid),
    disconnectedCount: disconnectedConsumers.length,
  };
}