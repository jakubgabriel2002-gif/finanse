const ASSET_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg'];

function sources(basePath) {
  return ASSET_EXTENSIONS.map(ext => `${basePath}.${ext}`);
}

/*
  TEREN

  Na ten moment masz tylko grass.png, więc tylko trawa ma grafikę.
  Reszta terenu zostaje na starych kolorach/fallbackach z Map.jsx:
  - woda dalej będzie renderowana starym gradientem
  - las dalej może mieć emoji 🌲
  - piach/ciemna trawa zostają kolorami z data.js
*/
export const TERRAIN_ASSETS = {
  0: '/assets/tiles/grass.png',
};

/*
  BUDYNKI

  Tu możesz wrzucać pliki jako:
  public/assets/buildings/house.png
  public/assets/buildings/house.webp
  public/assets/buildings/house.jpg
  public/assets/buildings/house.jpeg

  Kod sam sprawdzi formaty po kolei.
*/
export const BUILDING_ASSETS = {
  townhall: {
    base: '/assets/buildings/townhall',
    scale: 1.55,
    yOffset: -0.26,
  },
  house: {
    base: '/assets/buildings/house',
    scale: 1.28,
    yOffset: -0.14,
  },
  apartment: {
    base: '/assets/buildings/apartment',
    scale: 1.58,
    yOffset: -0.28,
  },
  factory: {
    base: '/assets/buildings/factory',
    scale: 1.55,
    yOffset: -0.24,
  },
  shop: {
    base: '/assets/buildings/shop',
    scale: 1.33,
    yOffset: -0.16,
  },
  office: {
    base: '/assets/buildings/office',
    scale: 1.58,
    yOffset: -0.28,
  },
  bank: {
    base: '/assets/buildings/bank',
    scale: 1.48,
    yOffset: -0.22,
  },
  hospital: {
    base: '/assets/buildings/hospital',
    scale: 1.58,
    yOffset: -0.26,
  },
  school: {
    base: '/assets/buildings/school',
    scale: 1.52,
    yOffset: -0.24,
  },
  police: {
    base: '/assets/buildings/police',
    scale: 1.35,
    yOffset: -0.16,
  },
  fire: {
    base: '/assets/buildings/fire',
    scale: 1.38,
    yOffset: -0.16,
  },
  waterplant: {
    base: '/assets/buildings/waterplant',
    scale: 1.62,
    yOffset: -0.28,
  },
  sewage: {
    base: '/assets/buildings/sewage',
    scale: 1.68,
    yOffset: -0.3,
  },

  /*
    Te zostają przygotowane na później.
    Jeśli nie masz jeszcze grafik, gra użyje fallbacku emoji.
  */
  park: {
    base: '/assets/buildings/park',
    scale: 1.2,
    yOffset: -0.08,
  },
  solar: {
    base: '/assets/buildings/solar',
    scale: 1.3,
    yOffset: -0.12,
  },
  windmill: {
    base: '/assets/buildings/windmill',
    scale: 1.45,
    yOffset: -0.2,
  },
  powerplant: {
    base: '/assets/buildings/powerplant',
    scale: 1.62,
    yOffset: -0.28,
  },
  bus: {
    base: '/assets/buildings/bus',
    scale: 1.18,
    yOffset: -0.06,
  },
  tram: {
    base: '/assets/buildings/tram',
    scale: 1.22,
    yOffset: -0.08,
  },
  metro: {
    base: '/assets/buildings/metro',
    scale: 1.28,
    yOffset: -0.1,
  },
};

/*
  DROGI

  Masz aktualnie:
  - road-straight
  - road-curve
  - road-intersection
  - road-t
  - road-culdesac

  Nie masz klasycznego road-deadend, więc deadend używa road-culdesac.
*/
export const ROAD_ASSETS = {
  straight: {
    base: '/assets/roads/road-straight',
  },
  curve: {
    base: '/assets/roads/road-curve',
  },
  intersection: {
    base: '/assets/roads/road-intersection',
  },
  t: {
    base: '/assets/roads/road-t',
  },
  deadend: {
    base: '/assets/roads/road-culdesac',
  },
  culdesac: {
    base: '/assets/roads/road-culdesac',
  },
};

export function getTerrainAssetPath(terrainType) {
  return TERRAIN_ASSETS[terrainType] || null;
}

export function getBuildingAssetConfig(type) {
  const config = BUILDING_ASSETS[type];
  if (!config) return null;

  return {
    ...config,
    sources: sources(config.base),
  };
}

export function getRoadAssetSources(kind) {
  const config = ROAD_ASSETS[kind];
  if (!config) return [];

  return sources(config.base);
}

export function getRoadVisualType({ north, south, west, east }) {
  const count = [north, south, west, east].filter(Boolean).length;

  if (count >= 4) {
    return {
      kind: 'intersection',
      rotation: 0,
    };
  }

  if (count === 3) {
    if (!north) return { kind: 't', rotation: 0 };
    if (!east) return { kind: 't', rotation: 90 };
    if (!south) return { kind: 't', rotation: 180 };
    if (!west) return { kind: 't', rotation: 270 };
  }

  if (count === 2) {
    if (west && east) return { kind: 'straight', rotation: 0 };
    if (north && south) return { kind: 'straight', rotation: 90 };

    if (south && east) return { kind: 'curve', rotation: 0 };
    if (south && west) return { kind: 'curve', rotation: 90 };
    if (north && west) return { kind: 'curve', rotation: 180 };
    if (north && east) return { kind: 'curve', rotation: 270 };
  }

  if (count === 1) {
    if (south) return { kind: 'deadend', rotation: 0 };
    if (west) return { kind: 'deadend', rotation: 90 };
    if (north) return { kind: 'deadend', rotation: 180 };
    if (east) return { kind: 'deadend', rotation: 270 };
  }

  return {
    kind: 'deadend',
    rotation: 0,
  };
}