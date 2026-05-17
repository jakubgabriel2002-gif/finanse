import { useCallback } from 'react';
import { ROAD_COST, BT, BL, GS, BD, LIM, TR } from '../data.js';
import { fa } from '../gameLogic.js';
import {
  createInitialGameState,
  clearSavedGame,
} from '../state/initialState.js';
import {
  SOLAR_UPGRADE_COST,
  canInstallSolar,
  canInstallFilter,
  applySolarUpgrade,
  applyFilterUpgrade,
  getNextEcoUpgrade,
} from '../game/buildingUpgrades.js';
import {
  POWERLINE_COST,
  canBuildPowerLine,
} from '../game/resources/powerLines.js';
import {
  WATERPIPE_COST,
  canBuildWaterPipe,
} from '../game/resources/waterPipes.js';
import { SMOG_MONITORING_COST } from '../game/environment/smogResearch.js';
import { maybeAdvanceBuildingTutorial } from '../game/tutorialProgress.js';
import { resetAllScroll } from './useMapCamera.js';

export function useGameActions({
  G,
  setG,
  loanModal,
  setLoanModal,
  setAuditModal,
  setShowTut,
  notif,
  recalc,
  logIdRef,
  openMap,
  requestMapReset,
}) {
  const tileClick = useCallback((gx, gy) => {
    setG(prev => {
      const sz = GS(prev.thLv);

      if (gx < 0 || gy < 0 || gx >= sz || gy >= sz) return prev;

      const key = `${gx},${gy}`;
      const ter = TR[sz] || TR[24];
      const terrain = ter[gy]?.[gx] ?? 0;

      if (prev.buildMode === 'smog') {
        return prev;
      }

      if (prev.buildMode === 'powerline') {
        const powerLines = new Set(prev.powerLines || []);

        const check = canBuildPowerLine({
          x: gx,
          y: gy,
          terrain,
          powerLines,
          buildings: prev.buildings,
        });

        if (!check.ok) {
          notif(check.reason, 'warn');
          return prev;
        }

        if (prev.budget < POWERLINE_COST) {
          notif(`❌ Za mało środków! (${fa(POWERLINE_COST)} zł)`, 'err');
          return prev;
        }

        powerLines.add(key);

        const newLog = [
          {
            id: logIdRef.current++,
            label: '🔌 Linia energetyczna',
            amount: -POWERLINE_COST,
          },
          ...prev.log.slice(0, 19),
        ];

        return recalc({
          ...prev,
          powerLines,
          budget: prev.budget - POWERLINE_COST,
          log: newLog,
        });
      }

      if (prev.buildMode === 'waterpipe') {
        const waterPipes = new Set(prev.waterPipes || []);

        const check = canBuildWaterPipe({
          x: gx,
          y: gy,
          terrain,
          waterPipes,
          buildings: prev.buildings,
          roads: prev.roads,
        });

        if (!check.ok) {
          notif(check.reason, 'warn');
          return prev;
        }

        if (prev.budget < WATERPIPE_COST) {
          notif(`❌ Za mało środków! (${fa(WATERPIPE_COST)} zł)`, 'err');
          return prev;
        }

        waterPipes.add(key);

        const newLog = [
          {
            id: logIdRef.current++,
            label: '💧 Rura wod-kan',
            amount: -WATERPIPE_COST,
          },
          ...prev.log.slice(0, 19),
        ];

        return recalc({
          ...prev,
          waterPipes,
          budget: prev.budget - WATERPIPE_COST,
          log: newLog,
        });
      }

      if (prev.buildMode === 'road') {
        if (prev.roads.has(key)) {
          notif('⚠️ Tu już jest droga!', 'warn');
          return prev;
        }

        if (prev.grid[key]) {
          notif('⚠️ Blokuje budynek!', 'warn');
          return prev;
        }

        if (terrain === 2) {
          notif('⚠️ Nie na wodzie!', 'warn');
          return prev;
        }

        if (prev.budget < ROAD_COST) {
          notif('❌ Za mało środków!', 'err');
          return prev;
        }

        const roads = new Set(prev.roads);
        roads.add(key);

        const newLog = [
          {
            id: logIdRef.current++,
            label: '🛣️ Droga',
            amount: -ROAD_COST,
          },
          ...prev.log.slice(0, 19),
        ];

        return recalc({
          ...prev,
          roads,
          budget: prev.budget - ROAD_COST,
          log: newLog,
        });
      }

      if (prev.buildMode) {
        if (prev.roads.has(key)) {
          notif('⚠️ Tu jest droga!', 'warn');
          return prev;
        }

        if (prev.grid[key]) {
          notif('⚠️ Zajęte!', 'warn');
          return prev;
        }

        if (terrain === 2) {
          notif('⚠️ Nie na wodzie!', 'warn');
          return prev;
        }

        const d = BD[prev.buildMode];
        if (!d) return prev;

        if (prev.buildMode === 'townhall' && prev.buildings.some(b => b.type === 'townhall')) {
          notif('⚠️ Ratusz może być tylko jeden!', 'warn');
          return prev;
        }

        if (prev.budget < d.cost) {
          notif(`❌ Za mało! (${fa(d.cost)} zł)`, 'err');
          return prev;
        }

        const lim = LIM[prev.thLv]?.[prev.buildMode] ?? 99;

        if (prev.buildings.filter(b => b.type === prev.buildMode).length >= lim) {
          notif(`⚠️ Limit ${lim} — rozbuduj Ratusz!`, 'warn');
          return prev;
        }

        const now = Date.now() / 1000;
        const builtType = prev.buildMode;

        const nb = {
          uid: prev.nextUID,
          type: builtType,
          x: gx,
          y: gy,
          lv: 1,
          building: true,
          buildEnd: now + BT[0],
          solar: false,
          co2f: false,
          co2fLv: 0,
          greenRoof: false,
        };

        const buildings = [...prev.buildings, nb];

        const grid = {
          ...prev.grid,
          [key]: nb,
        };

        const newLog = [
          {
            id: logIdRef.current++,
            label: `🏗️ ${d.n}`,
            amount: -d.cost,
          },
          ...prev.log.slice(0, 19),
        ];

        notif(`🏗️ ${d.e} ${d.n} · ${BL[0]}`, 'ok');

        let next = recalc({
          ...prev,
          buildings,
          grid,
          budget: prev.budget - d.cost,
          nextUID: prev.nextUID + 1,
          log: newLog,
        });

        const progress = maybeAdvanceBuildingTutorial(next, builtType);
        next = progress.gameState;

        return next;
      }

      const existing = prev.grid[key];

      return {
        ...prev,
        selUID: existing ? existing.uid : null,
      };
    });
  }, [setG, notif, recalc, logIdRef]);

  const bldClick = useCallback((uid) => {
    setG(prev => prev.buildMode ? prev : { ...prev, selUID: uid });
  }, [setG]);

  const closeSelection = useCallback(() => {
    setG(prev => ({
      ...prev,
      selUID: null,
    }));
  }, [setG]);

  const upgradeBuilding = useCallback(() => {
    setG(prev => {
      const b = prev.buildings.find(x => x.uid === prev.selUID);
      if (!b) return prev;

      const d = BD[b.type];

      if (b.lv >= d.ml) {
        notif('⚠️ Max poziom!', 'warn');
        return prev;
      }

      if (b.building) {
        notif('⚠️ Trwa budowa!', 'warn');
        return prev;
      }

      const cost = Math.floor(d.cost * b.lv * 1.5);

      if (prev.budget < cost) {
        notif(`❌ Za mało! (${fa(cost)} zł)`, 'err');
        return prev;
      }

      const now = Date.now() / 1000;
      const nl = b.lv + 1;

      const buildings = prev.buildings.map(x =>
        x.uid === b.uid
          ? {
              ...x,
              lv: nl,
              building: true,
              buildEnd: now + BT[nl - 1],
            }
          : x
      );

      const upd = buildings.find(x => x.uid === b.uid);

      const grid = {
        ...prev.grid,
        [`${b.x},${b.y}`]: upd,
      };

      notif(`⬆️ ${d.e} ${d.n} → Lv${nl} (${BL[nl - 1]})`, 'ok');

      const newLog = [
        {
          id: logIdRef.current++,
          label: `⬆️ ${d.n} → Lv${nl}`,
          amount: -cost,
        },
        ...prev.log.slice(0, 19),
      ];

      return recalc({
        ...prev,
        buildings,
        grid,
        budget: prev.budget - cost,
        log: newLog,
      });
    });
  }, [setG, notif, recalc, logIdRef]);

  const demolishBuilding = useCallback(() => {
    setG(prev => {
      const b = prev.buildings.find(x => x.uid === prev.selUID);
      if (!b) return prev;

      if (b.type === 'townhall') {
        notif('⚠️ Ratusza nie można wyburzyć!', 'warn');
        return prev;
      }

      const d = BD[b.type];
      const refund = Math.floor(d.cost * b.lv * 0.35);
      const buildings = prev.buildings.filter(x => x.uid !== b.uid);
      const grid = { ...prev.grid };

      delete grid[`${b.x},${b.y}`];

      notif(`💥 ${d.n} · +${fa(refund)} zł`, 'warn');

      const newLog = [
        {
          id: logIdRef.current++,
          label: `💥 ${d.n}`,
          amount: refund,
        },
        ...prev.log.slice(0, 19),
      ];

      return recalc({
        ...prev,
        buildings,
        grid,
        budget: prev.budget + refund,
        selUID: null,
        log: newLog,
      });
    });
  }, [setG, notif, recalc, logIdRef]);

  const installSolar = useCallback(() => {
    setG(prev => {
      const b = prev.buildings.find(x => x.uid === prev.selUID);
      if (!b) return prev;

      const check = canInstallSolar(b);

      if (!check.ok) {
        notif(check.reason, 'warn');
        return prev;
      }

      if (prev.budget < SOLAR_UPGRADE_COST) {
        notif(`❌ Za mało! (${fa(SOLAR_UPGRADE_COST)} zł)`, 'err');
        return prev;
      }

      const buildings = prev.buildings.map(x =>
        x.uid === b.uid ? applySolarUpgrade(x) : x
      );

      const upd = buildings.find(x => x.uid === b.uid);

      const grid = {
        ...prev.grid,
        [`${b.x},${b.y}`]: upd,
      };

      notif('☀️ Panele solarne zainstalowane!', 'ok');

      const newLog = [
        {
          id: logIdRef.current++,
          label: `☀️ Panele — ${BD[b.type].n}`,
          amount: -SOLAR_UPGRADE_COST,
        },
        ...prev.log.slice(0, 19),
      ];

      return recalc({
        ...prev,
        buildings,
        grid,
        budget: prev.budget - SOLAR_UPGRADE_COST,
        log: newLog,
      });
    });
  }, [setG, notif, recalc, logIdRef]);

  const installFilter = useCallback(() => {
    setG(prev => {
      const b = prev.buildings.find(x => x.uid === prev.selUID);
      if (!b) return prev;

      const check = canInstallFilter(b);
      const nextEcoUpgrade = getNextEcoUpgrade(b);
      const cost = nextEcoUpgrade.cost || 0;

      if (!check.ok || !nextEcoUpgrade.ok) {
        notif(
          check.reason || nextEcoUpgrade.reason || '⚠️ Nie można wykonać modernizacji ekologicznej.',
          'warn'
        );
        return prev;
      }

      if (prev.budget < cost) {
        notif(`❌ Za mało! (${fa(cost)} zł)`, 'err');
        return prev;
      }

      const buildings = prev.buildings.map(x =>
        x.uid === b.uid ? applyFilterUpgrade(x) : x
      );

      const upd = buildings.find(x => x.uid === b.uid);

      const grid = {
        ...prev.grid,
        [`${b.x},${b.y}`]: upd,
      };

      notif(`🌿 ${nextEcoUpgrade.label} wykonano!`, 'ok');

      const newLog = [
        {
          id: logIdRef.current++,
          label: `🌿 ${nextEcoUpgrade.label} — ${BD[b.type].n}`,
          amount: -cost,
        },
        ...prev.log.slice(0, 19),
      ];

      return recalc({
        ...prev,
        buildings,
        grid,
        budget: prev.budget - cost,
        log: newLog,
      });
    });
  }, [setG, notif, recalc, logIdRef]);

  const takeLoan = useCallback(() => {
    setG(prev => {
      if (prev.loan) {
        notif('⚠️ Masz już pożyczkę!', 'warn');
        setLoanModal(null);
        return prev;
      }

      const loan = {
        amt: loanModal,
        rate: 0.08,
        months: 24,
      };

      notif(`🏦 Pożyczka ${fa(loanModal)} zł`, 'ok');

      const newLog = [
        {
          id: logIdRef.current++,
          label: '🏦 Pożyczka',
          amount: loanModal,
        },
        ...prev.log.slice(0, 19),
      ];

      setLoanModal(null);

      return recalc({
        ...prev,
        loan,
        budget: prev.budget + loanModal,
        log: newLog,
      });
    });
  }, [setG, loanModal, setLoanModal, notif, recalc, logIdRef]);

  const runAudit = useCallback(() => {
    setG(prev => {
      if (prev.budget < 500) {
        notif('❌ Za mało! (500 zł)', 'err');
        setAuditModal(false);
        return prev;
      }

      const fs = prev.buildings.filter(b =>
        ['factory', 'shop', 'office', 'bank'].includes(b.type) && !b.building
      );

      let extra = 0;
      let msg = '🔍 Kontrola: wszystko w porządku.';

      let newLog = [
        {
          id: logIdRef.current++,
          label: '🔍 Kontrola skarbowa',
          amount: -500,
        },
        ...prev.log.slice(0, 19),
      ];

      if (fs.length > 0 && Math.random() < 0.65) {
        const caught = fs[Math.floor(Math.random() * fs.length)];
        const fine = Math.floor(BD[caught.type].inc * caught.lv * 0.8 + Math.random() * 1500);

        extra = fine;
        msg = `🔍 ${BD[caught.type].n} ukarana! +${fa(fine)} zł`;

        newLog.unshift({
          id: logIdRef.current++,
          label: `💰 Kara — ${BD[caught.type].n}`,
          amount: fine,
        });
      }

      notif(msg, 'ok');
      setAuditModal(false);

      return recalc({
        ...prev,
        budget: prev.budget - 500 + extra,
        auditCD: 4,
        log: newLog,
      });
    });
  }, [setG, setAuditModal, notif, recalc, logIdRef]);

  const buySmogMonitoring = useCallback(() => {
    setG(prev => {
      if (prev.smogScanUnlocked) {
        notif('🌫️ Monitoring smogu jest już odblokowany.', 'warn');
        return prev;
      }

      if (prev.budget < SMOG_MONITORING_COST) {
        notif(`❌ Za mało środków! (${fa(SMOG_MONITORING_COST)} zł)`, 'err');
        return prev;
      }

      const newLog = [
        {
          id: logIdRef.current++,
          label: '🌫️ System monitoringu smogu',
          amount: -SMOG_MONITORING_COST,
        },
        ...prev.log.slice(0, 19),
      ];

      notif('🌫️ System monitoringu smogu odblokowany!', 'ok');

      return recalc({
        ...prev,
        smogScanUnlocked: true,
        budget: prev.budget - SMOG_MONITORING_COST,
        log: newLog,
      });
    });
  }, [setG, notif, recalc, logIdRef]);

  const resetGame = useCallback(() => {
    if (!window.confirm('Na pewno chcesz zresetować grę? Wszystkie postępy zostaną utracone.')) {
      return;
    }

    clearSavedGame();

    const fresh = createInitialGameState();
    const next = recalc(fresh);

    setG(next);
    requestMapReset(next);
    setShowTut(true);
    notif('🔄 Gra zresetowana!', 'warn');
  }, [setG, setShowTut, notif, recalc, requestMapReset]);

  const markRead = useCallback((idx) => {
    setG(prev => {
      if (idx === 'all') {
        return {
          ...prev,
          inbox: prev.inbox.map(m => ({
            ...m,
            read: true,
          })),
        };
      }

      return {
        ...prev,
        inbox: prev.inbox.map((m, i) =>
          i === idx
            ? {
                ...m,
                read: true,
              }
            : m
        ),
      };
    });
  }, [setG]);

  const cycleSpeed = useCallback(() => {
    setG(g => ({
      ...g,
      speed: (g.speed + 1) % 4,
    }));
  }, [setG]);

  const setTab = useCallback((tab) => {
    if (tab === 'map') {
      openMap();
      return;
    }

    resetAllScroll();

    setG(g => ({
      ...g,
      tab,
    }));
  }, [setG, openMap]);

  const pickBuildMode = useCallback((type) => {
    if (type === 'smog' && !G.smogScanUnlocked) {
      setG(g => ({
        ...g,
        tab: 'townhall',
      }));

      notif('🌫️ Najpierw kup monitoring smogu w Ratuszu.', 'warn');
      return;
    }

    openMap({
      buildMode: type,
    });
  }, [G.smogScanUnlocked, setG, notif, openMap]);

  const togglePolicy = useCallback((id) => {
    setG(g =>
      recalc({
        ...g,
        policies: {
          ...g.policies,
          [id]: !g.policies[id],
        },
      })
    );
  }, [setG, recalc]);

  const setFee = useCallback((id, value) => {
    setG(g =>
      recalc({
        ...g,
        fees: {
          ...g.fees,
          [id]: value,
        },
      })
    );
  }, [setG, recalc]);

  const setTaxRate = useCallback((value) => {
    setG(g =>
      recalc({
        ...g,
        taxRate: value,
      })
    );
  }, [setG, recalc]);

  return {
    tileClick,
    bldClick,
    closeSelection,
    upgradeBuilding,
    demolishBuilding,
    installSolar,
    installFilter,
    takeLoan,
    runAudit,
    buySmogMonitoring,
    resetGame,
    markRead,
    cycleSpeed,
    setTab,
    pickBuildMode,
    togglePolicy,
    setFee,
    setTaxRate,
  };
}