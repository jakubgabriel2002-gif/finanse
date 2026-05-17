import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BT, MS, BD, EVTS, WEATHERS, TSTEPS } from './data.js';
import { calcStats, genInbox, fm, getPolicyMonthlyCost } from './gameLogic.js';
import {
  loadGame,
  saveGame,
} from './state/initialState.js';
import { POWERLINE_COST } from './game/resources/powerLines.js';
import { WATERPIPE_COST } from './game/resources/waterPipes.js';
import { rollCityServiceEvent } from './game/cityEvents.js';
import {
  shouldShowTutorial,
  startTutorialAction,
} from './game/tutorialProgress.js';

import { useNotifications } from './hooks/useNotifications.js';
import { useMapCamera, resetAllScroll } from './hooks/useMapCamera.js';
import { useGameActions } from './hooks/useGameActions.js';

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
  const [G, setG] = useState(() => loadGame() || null);
  const [nowTick, setNowTick] = useState(() => Date.now() / 1000);
  const [evPopup, setEvPopup] = useState(null);
  const [loanModal, setLoanModal] = useState(null);
  const [auditModal, setAuditModal] = useState(false);
  const [showTut, setShowTut] = useState(false);

  const logIdRef = useRef(100);

  const { notifs, notif } = useNotifications();

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

    return {
      ...g,
      stats,
      inbox,
    };
  }, []);

  useEffect(() => {
    if (G) return;

    import('./state/initialState.js').then(({ createInitialGameState }) => {
      setG(recalc(createInitialGameState()));
    });
  }, [G, recalc]);

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
  } = useMapCamera({ G: G || {}, setG });

  const {
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
  } = useGameActions({
    G: G || {},
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
  });

  useEffect(() => {
    const id = setInterval(() => {
      setNowTick(Date.now() / 1000);
    }, 1000);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!G) return;

    setShowTut(shouldShowTutorial(G));
  }, [G?.tutDone, G?.tutStep, G?.buildMode, G?.roads?.size]);

  useEffect(() => {
    if (!G) return;

    saveGame(G);
  }, [G]);

  useEffect(() => {
    if (!G) return;

    resetAllScroll();
  }, [G?.tab]);

  useEffect(() => {
    if (!G) return;

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
  }, [G, notif, recalc]);

  useEffect(() => {
    if (!G) return;
    if (G.paused || G.speed === 0 || !G.tutDone) return;

    const iv = 12000 / G.speed;

    const id = setInterval(() => {
      setG(prev => {
        if (!prev?.stats) return prev;

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
  }, [G?.paused, G?.speed, G?.tutDone, notif, recalc]);

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
  }, [setG, notif, requestMapReset]);

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
  }, [setG, notif, recalc, requestMapReset]);

  if (!G) {
    return (
      <div id="app">
        <div style={{ padding: 20, color: '#6a90b8', fontFamily: 'monospace' }}>
          Ładowanie NeoCity...
        </div>
      </div>
    );
  }

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
                onClose={closeSelection}
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
                onPick={pickBuildMode}
              />
            )}

            {G.tab === 'townhall' && (
              <TownhallTab
                G={G}
                setG={setG}
                onBuySmogMonitoring={buySmogMonitoring}
                onOpenLoan={(amt) => setLoanModal(amt)}
                onOpenAudit={() => setAuditModal(true)}
                onPolicy={togglePolicy}
                onFee={setFee}
                onTax={setTaxRate}
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