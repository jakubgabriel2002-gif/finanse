import React from 'react';
import { TILE, TC, TB, BD, BT, GS, TR } from '../data.js';
import { nR, nT, ft } from '../gameLogic.js';

function getMapViewportSize() {
  const mapView = document.getElementById('map-view');

  return {
    width: mapView?.clientWidth || window.innerWidth,
    height: mapView?.clientHeight || window.innerHeight,
  };
}

function RoadTile({ gx, gy, tpx, roads }) {
  const h = (dx,dy) => roads.has(`${gx+dx},${gy+dy}`);
  const N=h(0,-1), S=h(0,1), W=h(-1,0), E=h(1,0);
  const c = tpx/2, rw = Math.max(4, tpx*0.25);

  return (
    <svg className="road-svg" style={{left:gx*tpx,top:gy*tpx,width:tpx,height:tpx}} viewBox={`0 0 ${tpx} ${tpx}`}>
      <rect x={c-rw/2} y={c-rw/2} width={rw} height={rw} fill="#282828"/>
      {N && <rect x={c-rw/2} y={0} width={rw} height={c-rw/2+1} fill="#282828"/>}
      {S && <rect x={c-rw/2} y={c+rw/2-1} width={rw} height={tpx-c-rw/2+1} fill="#282828"/>}
      {W && <rect x={0} y={c-rw/2} width={c-rw/2+1} height={rw} fill="#282828"/>}
      {E && <rect x={c+rw/2-1} y={c-rw/2} width={tpx-c-rw/2+1} height={rw} fill="#282828"/>}
      {N&&S&&!W&&!E && <line x1={c} y1={0} x2={c} y2={tpx} stroke="#555" strokeWidth={0.8} strokeDasharray="5,4"/>}
      {W&&E&&!N&&!S && <line x1={0} y1={c} x2={tpx} y2={c} stroke="#555" strokeWidth={0.8} strokeDasharray="5,4"/>}
    </svg>
  );
}

function BldTile({ b, tpx, isSel, hasRoad, now }) {
  const d = BD[b.type];
  const clr = d.cl[Math.min(b.lv-1, d.cl.length-1)];
  const sc = Math.min(0.5 + b.lv*0.08, 0.9);
  const sz = tpx*sc;
  const off = (tpx-sz)/2;
  const noR = !d.nr && !hasRoad;
  const prog = b.building ? Math.max(0, Math.min(1, 1-(b.buildEnd-now)/BT[b.lv-1])) : 1;
  const tl = b.building ? Math.max(0, Math.ceil(b.buildEnd-now)) : 0;

  return (
    <>
      {b.building && tpx > 26 && <div className="bld-timer">⏱ {ft(tl)}</div>}
      <div style={{position:"absolute",left:off,top:off,width:sz,height:sz}}>
        <div className={`bld-inner ${isSel?'sel':''} ${noR?'noroad':''} ${b.building?'constructing':''}`}
             style={{background:b.building?'rgba(255,180,0,0.1)':clr}}>
          {b.lv > 1 && <div className="bld-lv">Lv{b.lv}</div>}
          {(b.solar||b.co2f) && <div className="bld-badge">{b.solar?'☀️':''}{b.co2f?'🌿':''}</div>}
          <span style={{fontSize:Math.max(9,sz*0.36),lineHeight:1}}>{d.e}</span>
          {noR && sz > 32 && <span style={{fontSize:6,color:"#888",marginTop:1}}>brak dr.</span>}
          {b.building && (
            <div className="bld-prog">
              <div className="bld-progfill" style={{width:`${prog*100}%`}}/>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Map({ G, cam, onTileClick, onBldClick, mapRef }) {
  const tpx = TILE * cam.zoom;
  const sz = GS(G.thLv);
  const ter = TR[sz] || TR[24];
  const viewport = getMapViewportSize();
  const vW = viewport.width;
  const vH = viewport.height;
  const now = Date.now() / 1000;

  const buffer = 4;

  const vx0 = Math.max(0, Math.floor(-cam.x / tpx) - buffer);
  const vy0 = Math.max(0, Math.floor(-cam.y / tpx) - buffer);
  const vx1 = Math.min(sz, Math.ceil((-cam.x + vW) / tpx) + buffer);
  const vy1 = Math.min(sz, Math.ceil((-cam.y + vH) / tpx) + buffer);

  const act = G.buildings.filter(b => !b.building);

  const tiles = [];
  for(let gy=vy0; gy<vy1; gy++) {
    for(let gx=vx0; gx<vx1; gx++) {
      const t = ter[gy]?.[gx] ?? 0;
      const isRd = G.roads.has(`${gx},${gy}`);
      const bg = isRd ? '#1a1a1a' : (TC[t]||TC[0]);
      const bo = isRd ? '#222' : (TB[t]||TB[0]);

      tiles.push(
        <div key={`t${gx},${gy}`} className="tile"
          style={{left:gx*tpx,top:gy*tpx,width:tpx,height:tpx,background:bg,borderColor:bo}}
          onClick={(e)=>{e.stopPropagation();onTileClick(gx,gy);}}>
          {t === 2 && <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#163450,#1a3a5c)",opacity:0.8}}/>}
          {t === 6 && cam.zoom > 0.6 && (gx+gy)%2 === 0 && (
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:tpx*0.38,pointerEvents:"none"}}>🌲</div>
          )}
          {(G.weather?.id==='rainy'||G.weather?.id==='storm') && !isRd && (
            <div style={{position:"absolute",inset:0,background:"rgba(0,40,80,0.1)",pointerEvents:"none"}}/>
          )}
        </div>
      );
    }
  }

  const roadEls = [];
  G.roads.forEach(key => {
    const [rx,ry] = key.split(',').map(Number);
    if(rx<vx0||rx>=vx1||ry<vy0||ry>=vy1) return;
    roadEls.push(<RoadTile key={`r${key}`} gx={rx} gy={ry} tpx={tpx} roads={G.roads}/>);
  });

  const previews = [];
  if(G.buildMode) {
    for(let gy=vy0; gy<vy1; gy++) {
      for(let gx=vx0; gx<vx1; gx++) {
        const key = `${gx},${gy}`;
        const t = ter[gy]?.[gx] ?? 0;

        if(t === 2) continue;

        if(G.buildMode === 'road') {
          if(!G.roads.has(key) && !G.grid[key]) {
            previews.push(
              <div key={`pv${key}`} className="pv-tile"
                style={{
                  left:gx*tpx,
                  top:gy*tpx,
                  width:tpx,
                  height:tpx,
                  background:"rgba(255,200,0,0.12)",
                  border:"1px dashed rgba(255,200,0,0.4)",
                }}
              />
            );
          }
        } else {
          if(!G.grid[key] && !G.roads.has(key)) {
            previews.push(
              <div key={`pv${key}`} className="pv-tile"
                style={{
                  left:gx*tpx,
                  top:gy*tpx,
                  width:tpx,
                  height:tpx,
                  background:"rgba(0,255,150,0.08)",
                  border:"1px dashed rgba(0,255,150,0.3)",
                }}
              />
            );
          }
        }
      }
    }
  }

  const bldEls = G.buildings
    .filter(b => b.x>=vx0 && b.x<vx1 && b.y>=vy0 && b.y<vy1)
    .map(b => {
      const d = BD[b.type];
      if(!d) return null;

      const hasR = d.nr || nR(b.x,b.y,G.roads) || nT(b.x,b.y,act);
      const isSel = G.selUID === b.uid;

      return (
        <div key={b.uid} className="bld"
          style={{left:b.x*tpx,top:b.y*tpx,width:tpx,height:tpx,zIndex:isSel?20:b.building?8:6}}
          onClick={(e)=>{e.stopPropagation();onBldClick(b.uid);}}>
          <BldTile b={b} tpx={tpx} isSel={isSel} hasRoad={hasR} now={now}/>
        </div>
      );
    });

  return (
    <div id="map-container" ref={mapRef}
      style={{left:cam.x,top:cam.y,width:sz*tpx,height:sz*tpx}}>
      {tiles}
      {roadEls}
      {previews}
      {bldEls}
    </div>
  );
}