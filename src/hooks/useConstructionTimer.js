import { useEffect } from 'react';
import { BD } from '../data.js';

export function useConstructionTimer({
  enabled,
  setG,
  notif,
  recalc,
}) {
  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(() => {
      setG(prev => {
        if (!prev) return prev;

        const now = Date.now() / 1000;
        let changed = false;
        let newThLv = prev.thLv;

        const buildings = prev.buildings.map(b => {
          if (b.building && b.buildEnd <= now) {
            changed = true;

            if (b.type === 'townhall') {
              newThLv = b.lv;
            }

            notif(`✅ ${BD[b.type]?.e} ${BD[b.type]?.n} Lv${b.lv} gotowy!`, 'ok');

            return {
              ...b,
              building: false,
              buildEnd: 0,
            };
          }

          return b;
        });

        if (!changed) return prev;

        return recalc({
          ...prev,
          buildings,
          thLv: newThLv,
        });
      });
    }, 1000);

    return () => clearInterval(id);
  }, [enabled, setG, notif, recalc]);
}