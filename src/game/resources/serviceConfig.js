export const WATERPIPE_COST = 120;
export const WATERPIPE_RANGE = 3;

export const WATER_SUPPLY_SOURCE_TYPES = [
  'waterplant',
];

export const SEWAGE_SOURCE_TYPES = [
  'sewage',
];

export const WATER_SOURCE_TYPES = [
  ...WATER_SUPPLY_SOURCE_TYPES,
  ...SEWAGE_SOURCE_TYPES,
];

export const SEWAGE_LOAD_MULTIPLIER = {
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

export function isWaterSupplySourceType(type) {
  return WATER_SUPPLY_SOURCE_TYPES.includes(type);
}

export function isSewageSourceType(type) {
  return SEWAGE_SOURCE_TYPES.includes(type);
}

export function isWaterSourceType(type) {
  return WATER_SOURCE_TYPES.includes(type);
}