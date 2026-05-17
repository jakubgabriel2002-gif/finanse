import { useCallback, useEffect, useRef, useState } from 'react';
import { TILE, GS } from '../data.js';

export function resetAllScroll() {
  try {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const tabContent = document.getElementById('tab-content');
    if (tabContent) tabContent.scrollTop = 0;

    const app = document.getElementById('app');
    if (app) app.scrollTop = 0;

    const main = document.getElementById('main');
    if (main) main.scrollTop = 0;
  } catch (e) {}
}

function clampCamera(camera, gameState, mapEl) {
  const size = GS(gameState.thLv);
  const zoom = camera.zoom;
  const mapW = size * TILE * zoom;
  const mapH = size * TILE * zoom;
  const viewW = mapEl?.clientWidth || window.innerWidth;
  const viewH = mapEl?.clientHeight || Math.max(1, window.innerHeight - 140);
  const margin = 14;

  let x = camera.x;
  let y = camera.y;

  if (mapW <= viewW) {
    x = (viewW - mapW) / 2;
  } else {
    x = Math.min(margin, Math.max(viewW - mapW - margin, x));
  }

  if (mapH <= viewH) {
    y = (viewH - mapH) / 2;
  } else {
    y = Math.min(margin, Math.max(viewH - mapH - margin, y));
  }

  return { x, y, zoom };
}

function getCenteredCamera(gameState, mapEl) {
  const size = GS(gameState.thLv);
  const width = mapEl?.clientWidth || window.innerWidth;
  const height = mapEl?.clientHeight || Math.max(1, window.innerHeight - 140);
  const zoom = 1;

  const townhall = gameState.buildings?.find(b => b.type === 'townhall');
  const targetX = townhall ? townhall.x + 0.5 : size / 2;
  const targetY = townhall ? townhall.y + 0.5 : size / 2;

  const rawCamera = {
    x: width / 2 - targetX * TILE * zoom,
    y: height / 2 - targetY * TILE * zoom + 24,
    zoom,
  };

  return clampCamera(rawCamera, gameState, mapEl);
}

export function useMapCamera({ G, setG }) {
  const [cam, setCam] = useState({ x: 0, y: 0, zoom: 1.0 });
  const [mapKey, setMapKey] = useState(0);
  const [mapResetNonce, setMapResetNonce] = useState(0);

  const mapViewRef = useRef(null);
  const pendingMapStateRef = useRef(null);
  const latestGameStateRef = useRef(G);
  const pinchRef = useRef(null);
  const touchRef = useRef(null);

  useEffect(() => {
    latestGameStateRef.current = G;
  }, [G]);

  const hardResetMapView = useCallback((gameState) => {
    resetAllScroll();
    setMapKey(k => k + 1);

    const applyCamera = () => {
      resetAllScroll();

      const mapEl = mapViewRef.current || document.getElementById('map-view');
      setCam(getCenteredCamera(gameState, mapEl));
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(applyCamera);
    });

    setTimeout(applyCamera, 80);
    setTimeout(applyCamera, 220);
  }, []);

  const requestMapReset = useCallback((gameState) => {
    pendingMapStateRef.current = gameState;
    setMapResetNonce(n => n + 1);
  }, []);

  const openMap = useCallback((patch = {}) => {
    setG(prev => {
      const next = {
        ...prev,
        ...patch,
        tab: 'map',
      };

      pendingMapStateRef.current = next;
      return next;
    });

    setMapResetNonce(n => n + 1);
  }, [setG]);

  const cancelBuildMode = useCallback(() => {
    setG(prev => {
      const next = {
        ...prev,
        buildMode: null,
      };

      pendingMapStateRef.current = next;
      return next;
    });

    setMapResetNonce(n => n + 1);
  }, [setG]);

  useEffect(() => {
    if (G.tab !== 'map') return;

    const stateForReset = pendingMapStateRef.current || latestGameStateRef.current;
    pendingMapStateRef.current = null;

    hardResetMapView(stateForReset);
  }, [G.tab, mapResetNonce, hardResetMapView]);

  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;

      pinchRef.current = {
        dist: Math.sqrt(dx * dx + dy * dy) || 1,
        zoom: cam.zoom,
      };

      touchRef.current = null;
      return;
    }

    pinchRef.current = null;

    touchRef.current = {
      sx: e.touches[0].clientX,
      sy: e.touches[0].clientY,
      cx: cam.x,
      cy: cam.y,
      moved: false,
      t: Date.now(),
    };
  }, [cam]);

  const onTouchMove = useCallback((e) => {
    e.preventDefault();

    if (e.touches.length === 2) {
      const p = pinchRef.current;
      if (!p) return;

      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;

      setCam(c => ({
        ...c,
        zoom: Math.max(0.3, Math.min(2.5, p.zoom * (d / p.dist))),
      }));

      return;
    }

    const t = touchRef.current;
    if (!t) return;

    const dx = e.touches[0].clientX - t.sx;
    const dy = e.touches[0].clientY - t.sy;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      t.moved = true;
    }

    setCam(c => ({
      ...c,
      x: t.cx + dx,
      y: t.cy + dy,
    }));
  }, []);

  const onTouchEnd = useCallback(() => {
    pinchRef.current = null;
    touchRef.current = null;
  }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();

    setCam(c => ({
      ...c,
      zoom: Math.max(0.3, Math.min(2.5, c.zoom - e.deltaY * 0.001)),
    }));
  }, []);

  const zoom = useCallback((dz) => {
    setCam(c => ({
      ...c,
      zoom: Math.max(0.3, Math.min(2.5, c.zoom + dz)),
    }));
  }, []);

  const resetCam = useCallback(() => {
    hardResetMapView(latestGameStateRef.current);
  }, [hardResetMapView]);

  return {
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
  };
}