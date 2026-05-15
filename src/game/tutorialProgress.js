import { TSTEPS } from '../data.js';

export function getTutorialStep(tutStep) {
  return TSTEPS[tutStep] || null;
}

export function shouldShowTutorial(gameState) {
  if (!gameState || gameState.tutDone) return false;

  const step = getTutorialStep(gameState.tutStep);
  if (!step) return false;

  if (step.waitForRoads) return true;

  if (gameState.buildMode) return false;

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

  if (step.action === 'finish_roads') {
    const requiredRoads = step.waitForRoads || 0;

    if (gameState.roads.size < requiredRoads) {
      return {
        ...gameState,
        buildMode: 'road',
        tab: 'map',
      };
    }

    return {
      ...gameState,
      tutStep: Math.min(gameState.tutStep + 1, TSTEPS.length - 1),
      buildMode: null,
      tab: 'map',
    };
  }

  if (!step.action) return gameState;

  const shouldAdvanceImmediately = !step.req && !step.waitForRoads;
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