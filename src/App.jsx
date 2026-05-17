import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ROAD_COST, BT, BL, MS, GS, BD, LIM, TR, EVTS, WEATHERS, TSTEPS } from './data.js';
import { calcStats, genInbox, fa, fm, getPolicyMonthlyCost } from './gameLogic.js';
import {
  createInitialGameState,
  loadGame,
  saveGame,
  clearSavedGame,
} from './state/initialState.js';
import {
  SOLAR_UPGRADE_COST,
  canInstallSolar,
  canInstallFilter,
  applySolarUpgrade,
  applyFilterUpgrade,
  getNextEcoUpgrade,
} from './game/buildingUpgrades.js';
import {
  POWERLINE_COST,
  canBuildPowerLine,
} from './game/resources/powerLines.js';
import {
  WATERPIPE_COST,
  canBuildWaterPipe,
} from './game/resources/waterPipes.js';
import { rollCityServiceEvent } from './game/cityEvents.js';
import { SMOG_MONITORING_COST } from './game/environment/smogResearch.js';
import {
  shouldShowTutorial,
  startTutorialAction,
  maybeAdvanceBuildingTutorial,
} from './game/tutorialProgress.js';

import { useNotifications } from './hooks/useNotifications.js';
import { useMapCamera, resetAllScroll } from './hooks/useMapCamera.js';

import Map from './components/Map.jsx';
import TopBar from './components/TopBar.jsx';
import BottomNav from './components/BottomNav.jsx';
import SelPanel from './components/SelPanel.jsx';
import Tutorial from './components/Tutorial.jsx';
import BuildTab from './components/tabs/BuildTab.jsx';
import TownhallTab from './components/tabs/TownhallTab.jsx';
import InboxTab from './components/tabs/InboxTab.jsx';
import StatsTab from './components/tabs/StatsTab.jsx';

import NotificationStack from './components/NotificationStack.jsx';
import EventPopup from './components/EventPopup.jsx';
import LoanModal from './components/modals/LoanModal.jsx';
import AuditModal from './components/modals/AuditModal.jsx';

export default function App() {
  const [G, setG] = useState(() => loadGame() || createInitialGameState());
  const [nowTick, setNowTick] = useState(() => Date.now() / 1000);
  const [evPopup, setEvPopup] = useState(null);
  const [loanModal, setLoanModal] = useState(null);
  const [auditModal, setAuditModal] = useState(false);
  const [showTut, setShowTut] = useState(false);

  const logIdRef = useRef(100);

  const { notifs, notif } = useNotifications();

  const {
    cam,
    mapKey,
    mapViewRef,
    requestMapReset,
    openMap,
    cancelBuildMode,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onWheel,
    zoom,
    resetCam,
  } = useMapCamera({ G, setG });

  useEffect(() => {
    const id = setInterval(() => {
      setNowTick(Date.now() / 1000);
    }, 1000);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setG(g => {
      const stats = calcStats(
        g.buildings,
        g.roads,
        g.loan,
        g.fees,
        g.weather,
        g.powerLines,
        g.waterPipes,
        g.policies
      );

      const inbox = genInbox({ ...g, stats });
      return { ...g, stats, inbox };
    });
  }, []);

  useEffect(() => {
    setShowTut(shouldShowTutorial(G));
  }, [G.tutDone, G.tutStep, G.buildMode, G.roads.size]);

  useEffect(() => {
    saveGame(G);
  }, [G]);

  useEffect(() => {
    resetAllScroll();
  }, [G.tab]);

  const recalc = useCallback((g) => {
    const stats = calcStats(
      g.buildings,
      g.roads,
      g.loan,
      g.fees,
      g.weather,
      g.powerLines,
      g.waterPipes,
      g.policies
    );

    const inbox = genInbox({ ...g, stats });
    return { ...g, stats, inbox };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setG(prev => {
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
  }, [notif, recalc]);

  useEffect(() => {
    if (G.paused || G.speed === 0 || !G.tutDone) return;

    const iv = 12000 / G.speed;

    const id = setInterval(() => {
      setG(prev => {
        if (!prev.stats) return prev;

        const s = prev.stats;
        const tax = 0.8 + prev.taxRate / 100;
        const policyCost = getPolicyMonthlyCost(prev.policies);
        const net = Math.floor(s.net * tax * (0.9 + Math.random() * 0.2)) - policyCost;

        let budget = prev.budget + net;
        let month = prev.month + 1;
        let year = prev.year;

        if (month > 12) {
          month = 1;
          year++;
        }

        let elTmr = prev.elTmr - 1;
        let auditCD = Math.max(0, prev.auditCD - 1);
        let serviceEventCD = Math.max(0, (prev.serviceEventCD || 0) - 1);

        const newLog = [
          {
            id: logIdRef.current++,
            label: `📅 ${MS[prev.month - 1]} Rok ${prev.year}`,
            amount: net,
          },
          ...prev.log.slice(0, 19),
        ];

        if (policyCost > 0) {
          newLog.unshift({
            id: logIdRef.current++,
            label: '📋 Koszty polityk miejskich',
            amount: -policyCost,
          });
        }

        if (elTmr <= 0) {
          elTmr = 48;

          const avg = Math.round(Object.values(s.sat).reduce((a, b) => a + b, 0) / 5);

          if (avg >= 45) {
            budget += 2000;
            notif('🗳️ Wygrałeś wybory! +2000 zł', 'ok');
          } else {
            budget -= 5000;
            notif('🗳️ Przegrałeś wybory! -5000 zł', 'err');
          }
        }

        let weather = prev.weather;

        if (month % 3 === 0) {
          const r = Math.random();
          weather = r < 0.5
            ? WEATHERS[0]
            : r < 0.75
              ? WEATHERS[1]
              : r < 0.9
                ? WEATHERS[2]
                : WEATHERS[3];

          if (weather.id !== 'sunny') {
            notif(`${weather.icon} Pogoda: ${weather.name}`, 'warn');
          }
        }

        let events = prev.events;
        let news = prev.news;

        if (Math.random() < 0.1) {
          const ev = EVTS[Math.floor(Math.random() * EVTS.length)];

          budget += ev.b;
          events = [
            {
              id: logIdRef.current++,
              t: ev.t,
              tp: ev.tp,
              mo: month,
              yr: year,
            },
            ...events.slice(0, 9),
          ];
          news = [
            {
              id: logIdRef.current++,
              t: ev.t,
              m: ev.m,
              tp: ev.tp,
            },
            ...news.slice(0, 4),
          ];

          newLog.unshift({
            id: logIdRef.current++,
            label: ev.t,
            amount: ev.b,
          });

          setEvPopup(ev);
          setTimeout(() => setEvPopup(null), 5000);
        }

        const serviceEvent = rollCityServiceEvent(
          {
            ...prev,
            month,
            year,
            weather,
            serviceEventCD,
          },
          s
        );

        if (serviceEvent) {
          budget += serviceEvent.b;
          serviceEventCD = serviceEvent.cooldown || 4;

          events = [
            {
              id: logIdRef.current++,
              t: serviceEvent.t,
              tp: serviceEvent.tp,
              mo: month,
              yr: year,
            },
            ...events.slice(0, 9),
          ];

          news = [
            {
              id: logIdRef.current++,
              t: serviceEvent.t,
              m: serviceEvent.m,
              tp: serviceEvent.tp,
            },
            ...news.slice(0, 4),
          ];

          newLog.unshift({
            id: logIdRef.current++,
            label: serviceEvent.t,
            amount: serviceEvent.b,
          });

          notif(
            `${serviceEvent.t} ${fm(serviceEvent.b)} zł`,
            serviceEvent.tp === 'ok' ? 'ok' : 'err'
          );

          setEvPopup(serviceEvent);
          setTimeout(() => setEvPopup(null), 5000);
        }

        let riotOn = prev.riotOn;
        let riotTmr = prev.riotTmr;

        const avg2 = Math.round(Object.values(s.sat).reduce((a, b) => a + b, 0) / 5);
        const hasPol = prev.buildings.some(b => b.type === 'police' && !b.building);

        if (!riotOn && avg2 < 35 && !hasPol && Math.random() < 0.05) {
          riotOn = true;
          riotTmr = 3;
          budget -= 2000;

          notif('🚨 ZAMIESZKI! -2000 zł', 'err');

          newLog.unshift({
            id: logIdRef.current++,
            label: '🚨 Zamieszki',
            amount: -2000,
          });
        }

        if (riotOn) {
          riotTmr--;

          if (riotTmr <= 0) {
            riotOn = false;
          }
        }

        let loan = prev.loan;

        if (loan) {
          loan = {
            ...loan,
            months: loan.months - 1,
          };

          if (loan.months <= 0) {
            loan = null;
            notif('✅ Pożyczka spłacona!', 'ok');
          }
        }

        return recalc({
          ...prev,
          budget,
          log: newLog,
          month,
          year,
          elTmr,
          auditCD,
          serviceEventCD,
          weather,
          events,
          news,
          riotOn,
          riotTmr,
          loan,
        });
      });
    }, iv);

    return () => clearInterval(id);
  }, [G.paused, G.speed, G.tutDone, notif, recalc]);

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
  }, [notif, recalc]);

  const bldClick = useCallback((uid) => {
    setG(prev => prev.buildMode ? prev : { ...prev, selUID: uid });
  }, []);

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
  }, [notif, recalc]);

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
  }, [notif, recalc]);

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
  }, [notif, recalc]);

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
  }, [notif, recalc]);

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
  }, [loanModal, notif, recalc]);

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
  }, [notif, recalc]);

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
  }, [notif, recalc]);

  const resetGame = useCallback(() => {
    if (!window.confirm('Na pewno chcesz zresetować grę? Wszystkie postępy zostaną utracone.')) {
      return;
    }

    clearSavedGame();

    const fresh = createInitialGameState();

    const stats = calcStats(
      fresh.buildings,
      fresh.roads,
      fresh.loan,
      fresh.fees,
      fresh.weather,
      fresh.powerLines,
      fresh.waterPipes,
      fresh.policies
    );

    const next = {
      ...fresh,
      stats,
      inbox: genInbox({
        ...fresh,
        stats,
      }),
    };

    setG(next);
    requestMapReset(next);
    setShowTut(true);
    notif('🔄 Gra zresetowana!', 'warn');
  }, [notif, requestMapReset]);

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
  }, []);

  const cycleSpeed = useCallback(() => {
    setG(g => ({
      ...g,
      speed: (g.speed + 1) % 4,
    }));
  }, []);

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
  }, [openMap]);

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
  }, [notif, requestMapReset]);

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
  }, [notif, recalc, requestMapReset]);

  const unread = G.inbox?.filter(m => !m.read).length || 0;

  return (
    <div id="app">
      <TopBar G={G} />

      <div id="main">
        {G.tab === 'map' ? (
          <div
            key={`map-view-${mapKey}`}
            id="map-view"
            ref={mapViewRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onWheel={onWheel}
          >
            <Map
              G={G}
              cam={cam}
              now={nowTick}
              onTileClick={tileClick}
              onBldClick={bldClick}
            />

            {G.buildMode && (
              <div
                id="build-banner"
                style={{
                  background:
                    G.buildMode === 'road'
                      ? 'rgba(180,120,0,0.97)'
                      : G.buildMode === 'powerline'
                        ? 'rgba(255,160,0,0.97)'
                        : G.buildMode === 'waterpipe'
                          ? 'rgba(0,120,200,0.97)'
                          : G.buildMode === 'smog'
                            ? 'rgba(80,20,20,0.97)'
                            : 'rgba(0,100,180,0.97)',
                }}
              >
                <span>
                  {G.buildMode === 'road'
                    ? '🛣️ Kliknij kafelek (200zł)'
                    : G.buildMode === 'powerline'
                      ? `🔌 Ciągnij linię energetyczną (${POWERLINE_COST}zł)`
                      : G.buildMode === 'waterpipe'
                        ? `💧 Ciągnij rury wod-kan (${WATERPIPE_COST}zł)`
                        : G.buildMode === 'smog'
                          ? '🌫️ Tryb smogu — podgląd emisji CO₂'
                          : `${BD[G.buildMode]?.e} ${BD[G.buildMode]?.n}`}
                </span>

                <button
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    cancelBuildMode();
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.25)',
                    border: '1px solid rgba(255,255,255,0.4)',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 13,
                    padding: '2px 10px',
                    fontWeight: 700,
                  }}
                >
                  ✕ Anuluj
                </button>
              </div>
            )}

            <EventPopup event={evPopup} />

            {G.selUID != null && !G.buildMode && (
              <SelPanel
                G={G}
                onClose={() => setG(g => ({ ...g, selUID: null }))}
                onUpgrade={upgradeBuilding}
                onDemolish={demolishBuilding}
                onSolar={installSolar}
                onFilter={installFilter}
              />
            )}

            {G.riotOn && <div id="riot-overlay">🚨</div>}

            <div id="zoom-btns">
              <button
                className="zoom-btn"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  zoom(0.2);
                }}
              >
                ＋
              </button>

              <button
                className="zoom-btn"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  zoom(-0.2);
                }}
              >
                －
              </button>

              <button
                className="zoom-btn"
                style={{
                  color: '#6a90b8',
                  fontSize: 14,
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  resetCam();
                }}
              >
                ⌂
              </button>
            </div>
          </div>
        ) : (
          <div id="tab-content">
            {G.tab === 'build' && (
              <BuildTab
                G={G}
                onPick={(t) => {
                  if (t === 'smog' && !G.smogScanUnlocked) {
                    setG(g => ({
                      ...g,
                      tab: 'townhall',
                    }));

                    notif('🌫️ Najpierw kup monitoring smogu w Ratuszu.', 'warn');
                    return;
                  }

                  openMap({
                    buildMode: t,
                  });
                }}
              />
            )}

            {G.tab === 'townhall' && (
              <TownhallTab
                G={G}
                setG={setG}
                onBuySmogMonitoring={buySmogMonitoring}
                onOpenLoan={(amt) => setLoanModal(amt)}
                onOpenAudit={() => setAuditModal(true)}
                onPolicy={(id) =>
                  setG(g =>
                    recalc({
                      ...g,
                      policies: {
                        ...g.policies,
                        [id]: !g.policies[id],
                      },
                    })
                  )
                }
                onFee={(id, v) =>
                  setG(g =>
                    recalc({
                      ...g,
                      fees: {
                        ...g.fees,
                        [id]: v,
                      },
                    })
                  )
                }
                onTax={(v) =>
                  setG(g =>
                    recalc({
                      ...g,
                      taxRate: v,
                    })
                  )
                }
                onReset={resetGame}
              />
            )}

            {G.tab === 'inbox' && (
              <InboxTab
                G={G}
                onMarkRead={markRead}
              />
            )}

            {G.tab === 'stats' && (
              <StatsTab G={G} />
            )}
          </div>
        )}
      </div>

      <BottomNav
        tab={G.tab}
        setTab={setTab}
        speed={G.speed}
        cycleSpeed={cycleSpeed}
        unread={unread}
      />

      <NotificationStack notifs={notifs} />

      {showTut && !G.tutDone && (
        <Tutorial
          step={G.tutStep}
          gameState={G}
          onAction={tutAction}
          onSkip={tutSkip}
        />
      )}

      <LoanModal
        amount={loanModal}
        onConfirm={takeLoan}
        onCancel={() => setLoanModal(null)}
      />

      <AuditModal
        open={auditModal}
        onConfirm={runAudit}
        onCancel={() => setAuditModal(false)}
      />
    </div>
  );
}