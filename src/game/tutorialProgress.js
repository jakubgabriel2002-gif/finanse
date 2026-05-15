import { TSTEPS } from '../data.js';

export function getTutorialStep(tutStep) {
  return TSTEPS[tutStep] || null;
}

export function shouldShowTutorial(gameState) {
  if (!gameState || gameState.tutDone) return false;

  const step = getTutorialStep(gameState.tutStep);
  if (!step) return false;

  // Jeżeli aktywnie budujemy w tutorialu, nie pokazujemy overlayu,
  // bo overlay blokuje mapę.
  if (gameState.buildMode) return false;

  // Pokazujemy tylko kroki z przyciskiem.
  // Kroki typu "czekam aż zbudujesz 3 drogi" nie mogą blokować mapy.
  return Boolean(step.btn);
}

export function startTutorialAction(gameState, step) {
  if (!step) return gameState;

  if (step.action === 'finish') {
    return {
      ...gameState,
      tutDone: true,
      tutStep: TSTEPS.length,
      buildMode: null,
      tab: 'map',
    };
  }

  if (!step.action) return gameState;

  // Jeśli krok nie ma req, to znaczy, że jest to akcja startowa,
  // np. "Buduj drogę". Wtedy od razu przechodzimy na kolejny krok,
  // który czeka na wykonanie zadania.
  const shouldAdvanceImmediately = !step.req;
  const nextStep = shouldAdvanceImmediately
    ? Math.min(gameState.tutStep + 1, TSTEPS.length - 1)
    : gameState.tutStep;

  return {
    ...gameState,
    buildMode: step.action,
    tutStep: nextStep,
    tab: 'map',
  };
}

export function maybeAdvanceRoadTutorial(gameState) {
  if (!gameState || gameState.tutDone) {
    return { gameState, advanced: false };
  }

  const step = getTutorialStep(gameState.tutStep);

  if (!step?.waitForRoads) {
    return { gameState, advanced: false };
  }

  if (gameState.roads.size < step.waitForRoads) {
    return { gameState, advanced: false };
  }

  return {
    gameState: {
      ...gameState,
      tutStep: Math.min(gameState.tutStep + 1, TSTEPS.length - 1),
      buildMode: null,
    },
    advanced: true,
  };
}

export function maybeAdvanceBuildingTutorial(gameState, builtType) {
  if (!gameState || gameState.tutDone) {
    return { gameState, advanced: false };
  }

  const step = getTutorialStep(gameState.tutStep);

  if (!step?.req || step.req.type !== builtType) {
    return { gameState, advanced: false };
  }

  const count = gameState.buildings.filter(building => building.type === step.req.type).length;

  if (count < step.req.n) {
    return { gameState, advanced: false };
  }

  return {
    gameState: {
      ...gameState,
      tutStep: Math.min(gameState.tutStep + 1, TSTEPS.length - 1),
      buildMode: null,
    },
    advanced: true,
  };
}