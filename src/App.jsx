import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BD } from './data.js';
import { calcStats, genInbox } from './gameLogic.js';
import {
  loadGame,
  saveGame,
} from './state/initialState.js';
import { POWERLINE_COST } from './game/resources/powerLines.js';
import { WATERPIPE_COST } from './game/resources/waterPipes.js';

import { useNotifications } from './hooks/useNotifications.js';
import { useMapCamera, resetAllScroll } from './hooks/useMapCamera.js';
import { useGameActions } from './hooks/useGameActions.js';
import { useNowTick } from './hooks/useNowTick.js';
import { useConstructionTimer } from './hooks/useConstructionTimer.js';
import { useMonthTick } from './hooks/useMonthTick.js';
import { useTutorialFlow } from './hooks/useTutorialFlow.js';

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
  const [evPopup, setEvPopup] = useState(null);
  const [loanModal, setLoanModal] = useState(null);
  const [auditModal, setAuditModal] = useState(false);
  const [showTut, setShowTut] = useState(false);

  const logIdRef = useRef(100);
  const nowTick = useNowTick();

  const { notifs, notif } = useNotifications();

  const recalc = useCallback((gameState) => {
    const stats = calcStats(
      gameState.buildings,
      gameState.roads,
      gameState.loan,
      gameState.fees,
      gameState.weather,
      gameState.powerLines,
      gameState.waterPipes,
      gameState.policies
    );

    const inbox = genInbox({
      ...gameState,
      stats,
    });

    return {
      ...gameState,
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

  useEffect(() => {
    if (!G) return;

    saveGame(G);
  }, [G]);

  useEffect(() => {
    if (!G) return;

    resetAllScroll();
  }, [G?.tab]);

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
  } = useMapCamera({
    G: G || {},
    setG,
  });

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

  useConstructionTimer({
    enabled: Boolean(G),
    setG,
    notif,
    recalc,
  });

  useMonthTick({
    G,
    setG,
    notif,
    recalc,
    logIdRef,
    setEvPopup,
  });

  const {
    tutAction,
    tutSkip,
  } = useTutorialFlow({
    G,
    setG,
    setShowTut,
    notif,
    recalc,
    requestMapReset,
    logIdRef,
  });

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