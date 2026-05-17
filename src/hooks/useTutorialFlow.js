import { useCallback, useEffect } from 'react';
import { TSTEPS } from '../data.js';
import {
  shouldShowTutorial,
  startTutorialAction,
} from '../game/tutorialProgress.js';

export function useTutorialFlow({
  G,
  setG,
  setShowTut,
  notif,
  recalc,
  requestMapReset,
  logIdRef,
}) {
  useEffect(() => {
    if (!G) return;

    setShowTut(shouldShowTutorial(G));
  }, [G?.tutDone, G?.tutStep, G?.buildMode, G?.roads?.size, G, setShowTut]);

  const tutAction = useCallback((step) => {
    if (step.action === 'finish') {
      setG(g => startTutorialAction(g, step));
      setShowTut(false);
      notif('🏙️ Powodzenia, burmistrzu!', 'ok');
      return;
    }

    setG(g => {
      const next = startTutorialAction(g, step);

      if (next.tab === 'map') {
        requestMapReset(next);
      }

      return next;
    });
  }, [setG, setShowTut, notif, requestMapReset]);

  const tutSkip = useCallback(() => {
    setG(prev => {
      const next = recalc({
        ...prev,
        budget: 80000,
        buildings: [],
        grid: {},
        roads: new Set(),
        powerLines: new Set(),
        waterPipes: new Set(),
        tutDone: true,
        tutStep: TSTEPS.length,
        buildMode: null,
        nextUID: 200,
        log: [
          {
            id: logIdRef.current++,
            label: '🏙️ Pominięto samouczek',
            amount: 0,
          },
        ],
      });

      requestMapReset(next);

      return next;
    });

    setShowTut(false);
    notif('🏙️ Pusta mapa, 80 000 zł. Powodzenia!', 'ok');
  }, [setG, setShowTut, notif, recalc, requestMapReset, logIdRef]);

  return {
    tutAction,
    tutSkip,
  };
}