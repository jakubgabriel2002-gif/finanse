import React from 'react';
import { TILE, TC, TB, BD, BT, GS, TR } from '../data.js';
import { nR, nT, ft } from '../gameLogic.js';
import {
  isInPowerLineRange,
  isNearPowerLine,
  isNearPowerSource,
  getSourceConnectedPowerLines,
} from '../game/resources/powerLines.js';
import {
  isInWaterPipeRange,
  isNearWaterPipe,
  isNearWaterSource,
  getWaterSupplyConnectedPipes,
  getSewageConnectedPipes,
} from '../game/resources/waterPipes.js';

const SEWAGE_LOAD_MULTIPLIER = {
  apartment: 0.9,
  house: 0.9,
  factory: 1.1,
  shop: 0.7,
  office: 0.7,
  bank: 0.5,
  hospital: 1.2,
  school: 0.8,
  police: 0.4,
  fire: 0.4,
  bus: 0.2,
  tram: 0.2,
  metro: 0.3,
};

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

function PowerLineTile({ gx, gy, tpx, powerLines, activePowerLines }) {
  const h = (dx,dy) => powerLines.has(`${gx+dx},${gy+dy}`);
  const N=h(0,-1), S=h(0,1), W=h(-1,0), E=h(1,0);
  const key = `${gx},${gy}`;
  const active = activePowerLines.has(key);
  const c = tpx / 2;
  const w = Math.max(3, tpx * 0.12);

  const mainColor = active ? 'rgba(255,180,0,0.95)' : 'rgba(255,61,90,0.55)';
  const strokeColor = active ? 'rgba(255,255,255,0.5)' : 'rgba(255,61,90,0.5)';
  const textColor = active ? '#1a1000' : '#220006';

  return (
    <svg
      style={{
        position:"absolute",
        left:gx*tpx,
        top:gy*tpx,
        width:tpx,
        height:tpx,
        pointerEvents:"none",
        zIndex:5,
        filter: active ? 'drop-shadow(0 0 4px rgba(255,180,0,0.35))' : 'grayscale(0.5)',
      }}
      viewBox={`0 0 ${tpx} ${tpx}`}
    >
      <circle cx={c} cy={c} r={Math.max(4, tpx*0.16)} fill={mainColor} stroke={strokeColor} strokeWidth="1"/>
      {N && <rect x={c-w/2} y={0} width={w} height={c} fill={mainColor}/>}
      {S && <rect x={c-w/2} y={c} width={w} height={c} fill={mainColor}/>}
      {W && <rect x={0} y={c-w/2} width={c} height={w} fill={mainColor}/>}
      {E && <rect x={c} y={c-w/2} width={c} height={w} fill={mainColor}/>}
      <text x={c} y={c+3} textAnchor="middle" fontSize={Math.max(7, tpx*0.23)} fill={textColor}>
        {active ? '⚡' : '×'}
      </text>
    </svg>
  );
}

function WaterPipeTile({ gx, gy, tpx, waterPipes, waterSupplyPipes, sewagePipes }) {
  const h = (dx,dy) => waterPipes.has(`${gx+dx},${gy+dy}`);
  const N=h(0,-1), S=h(0,1), W=h(-1,0), E=h(1,0);
  const key = `${gx},${gy}`;

  const hasWater = waterSupplyPipes.has(key);
  const hasSewage = sewagePipes.has(key);
  const active = hasWater || hasSewage;
  const both = hasWater && hasSewage;

  const c = tpx / 2;
  const w = Math.max(4, tpx * 0.14);

  const mainColor = both
    ? 'rgba(85,185,255,0.95)'
    : hasWater
      ? 'rgba(0,160,255,0.9)'
      : hasSewage
        ? 'rgba(199,125,255,0.9)'
        : 'rgba(255,61,90,0.55)';

  const strokeColor = both
    ? 'rgba(230,245,255,0.7)'
    : hasWater
      ? 'rgba(180,230,255,0.55)'
      : hasSewage
        ? 'rgba(230,190,255,0.55)'
        : 'rgba(255,61,90,0.5)';

  const textColor = active ? '#001722' : '#220006';

  const label = both ? '✅' : hasWater ? '💧' : hasSewage ? '🧪' : '×';

  return (
    <svg
      style={{
        position:"absolute",
        left:gx*tpx,
        top:gy*tpx,
        width:tpx,
        height:tpx,
        pointerEvents:"none",
        zIndex:5,
        filter: active ? 'drop-shadow(0 0 4px rgba(0,160,255,0.35))' : 'grayscale(0.5)',
      }}
      viewBox={`0 0 ${tpx} ${tpx}`}
    >
      <circle cx={c} cy={c} r={Math.max(4, tpx*0.16)} fill={mainColor} stroke={strokeColor} strokeWidth="1"/>
      {N && <rect x={c-w/2} y={0} width={w} height={c} fill={mainColor}/>}
      {S && <rect x={c-w/2} y={c} width={w} height={c} fill={mainColor}/>}
      {W && <rect x={0} y={c-w/2} width={c} height={w} fill={mainColor}/>}
      {E && <rect x={c} y={c-w/2} width={c} height={w} fill={mainColor}/>}
      <text x={c} y={c+3} textAnchor="middle" fontSize={Math.max(7, tpx*0.22)} fill={textColor}>
        {label}
      </text>
    </svg>
  );
}

function getStatusShadow({ showPowerStatus, powerStatus, showWaterStatus, waterStatus, showSewageStatus, sewageStatus }) {
  const shadows = [];

  if (showPowerStatus && powerStatus === 'disconnected') {
    shadows.push('0 0 0 2px rgba(255,61,90,0.75)');
  } else if (showPowerStatus && powerStatus === 'connected') {
    shadows.push('0 0 0 2px rgba(255,180,0,0.75)');
  }

  if (showWaterStatus && waterStatus === 'disconnected') {
    shadows.push('0 0 0 3px rgba(255,61,90,0.75)');
  } else if (showWaterStatus && waterStatus === 'connected') {
    shadows.push('0 0 0 2px rgba(0,160,255,0.75)');
  }

  if (showSewageStatus && sewageStatus === 'disconnected') {
    shadows.push('0 0 0 4px rgba(255,61,90,0.55)');
  } else if (showSewageStatus && sewageStatus === 'connected') {
    shadows.push('0 0 0 3px rgba(199,125,255,0.65)');
  }

  return shadows.length ? shadows.join(', ') : undefined;
}

function BldTile({
  b,
  tpx,
  isSel,
  hasRoad,
  now,
  powerStatus,
  showPowerStatus,
  waterStatus,
  showWaterStatus,
  sewageStatus,
  showSewageStatus,
}) {
  const d = BD[b.type];
  if(!d) return null;

  const clr = d.cl[Math.min(b.lv-1, d.cl.length-1)];
  const sc = Math.min(0.5 + b.lv*0.08, 0.9);
  const sz = tpx*sc;
  const off = (tpx-sz)/2;
  const noR = !d.nr && !hasRoad;
  const prog = b.building ? Math.max(0, Math.min(1, 1-(b.buildEnd-now)/BT[b.lv-1])) : 1;
  const tl = b.building ? Math.max(0, Math.ceil(b.buildEnd-now)) : 0;

  const statusShadow = getStatusShadow({
    showPowerStatus,
    powerStatus,
    showWaterStatus,
    waterStatus,
    showSewageStatus,
    sewageStatus,
  });

  return (
    <>
      {b.building && tpx > 26 && <div className="bld-timer">⏱ {ft(tl)}</div>}
      <div style={{position:"absolute",left:off,top:off,width:sz,height:sz}}>
        <div
          className={`bld-inner ${isSel?'sel':''} ${noR?'noroad':''} ${b.building?'constructing':''}`}
          style={{
            background:b.building?'rgba(255,180,0,0.1)':clr,
            boxShadow: statusShadow,
          }}
        >
          {b.lv > 1 && <div className="bld-lv">Lv{b.lv}</div>}

          {(b.solar||b.co2f||showPowerStatus||showWaterStatus||showSewageStatus) && (
            <div className="bld-badge">
              {b.solar?'☀️':''}
              {b.co2f?'🌿':''}
              {showPowerStatus && powerStatus === 'connected' ? '⚡' : ''}
              {showPowerStatus && powerStatus === 'disconnected' ? '🔌' : ''}
              {showWaterStatus && waterStatus === 'connected' ? '💧' : ''}
              {showWaterStatus && waterStatus === 'disconnected' ? '🚱' : ''}
              {showSewageStatus && sewageStatus === 'connected' ? '🏗️' : ''}
              {showSewageStatus && sewageStatus === 'disconnected' ? '🧪' : ''}
            </div>
          )}

          <span style={{fontSize:Math.max(9,sz*0.36),lineHeight:1}}>{d.e}</span>

          {noR && sz > 32 && <span style={{fontSize:6,color:"#888",marginTop:1}}>brak dr.</span>}

          {showPowerStatus && powerStatus === 'disconnected' && sz > 34 && (
            <span style={{fontSize:6,color:"#ff7d7d",marginTop:1}}>brak pr.</span>
          )}

          {showWaterStatus && waterStatus === 'disconnected' && sz > 34 && (
            <span style={{fontSize:6,color:"#7dcfff",marginTop:1}}>brak w.</span>
          )}

          {showSewageStatus && sewageStatus === 'disconnected' && sz > 34 && (
            <span style={{fontSize:6,color:"#d7a1ff",marginTop:1}}>brak k.</span>
          )}

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

function getPowerStatusForBuilding(building, activePowerLines) {
  const data = BD[building.type];
  if (!data) return 'none';

  const powerValue = (data.pw || 0) * building.lv;

  if (powerValue < 0) return 'source';
  if (powerValue === 0) return 'none';

  return isInPowerLineRange(building.x, building.y, activePowerLines)
    ? 'connected'
    : 'disconnected';
}

function getWaterDemandForBuilding(building) {
  const data = BD[building.type];
  if (!data) return 0;

  if (building.type === 'waterplant') return 0;
  if (building.type === 'sewage') return 0;

  return Math.max(0, (data.wt || 0) * building.lv);
}

function getWaterStatusForBuilding(building, waterSupplyPipes) {
  if (building.type === 'waterplant') return 'source';

  const demand = getWaterDemandForBuilding(building);

  if (demand <= 0) return 'none';

  return isInWaterPipeRange(building.x, building.y, waterSupplyPipes)
    ? 'connected'
    : 'disconnected';
}

function getSewageLoadForBuilding(building) {
  const data = BD[building.type];
  if (!data) return 0;

  if (building.type === 'sewage') return 0;
  if (building.type === 'waterplant') return 0;

  const baseWaterUse = Math.max(0, data.wt || 0);
  const multiplier = SEWAGE_LOAD_MULTIPLIER[building.type] ?? 0;

  return baseWaterUse * building.lv * multiplier;
}

function getSewageStatusForBuilding(building, sewagePipes) {
  if (building.type === 'sewage') return 'source';

  const load = getSewageLoadForBuilding(building);

  if (load <= 0) return 'none';

  return isInWaterPipeRange(building.x, building.y, sewagePipes)
    ? 'connected'
    : 'disconnected';
}

export default function Map({ G, cam, now, onTileClick, onBldClick, mapRef }) {
  const tpx = TILE * cam.zoom;
  const sz = GS(G.thLv);
  const ter = TR[sz] || TR[24];
  const currentTime = Number.isFinite(now) ? now : Date.now() / 1000;
  const act = G.buildings.filter(b => !b.building);

  const powerLines = G.powerLines || new Set();
  const activePowerLines = getSourceConnectedPowerLines(powerLines, act);
  const showPowerLines = G.buildMode === 'powerline';

  const waterPipes = G.waterPipes || new Set();
  const waterSupplyPipes = getWaterSupplyConnectedPipes(waterPipes, act);
  const sewagePipes = getSewageConnectedPipes(waterPipes, act);
  const showWaterPipes = G.buildMode === 'waterpipe';

  const tiles = [];

  for(let gy=0; gy<sz; gy++) {
    for(let gx=0; gx<sz; gx++) {
      const key = `${gx},${gy}`;
      const t = ter[gy]?.[gx] ?? 0;
      const isRd = G.roads.has(key);
      const bg = isRd ? '#1a1a1a' : (TC[t]||TC[0]);
      const bo = isRd ? '#222' : (TB[t]||TB[0]);

      const inActivePowerRange = showPowerLines && isInPowerLineRange(gx, gy, activePowerLines);
      const inWaterRange = showWaterPipes && isInWaterPipeRange(gx, gy, waterSupplyPipes);
      const inSewageRange = showWaterPipes && isInWaterPipeRange(gx, gy, sewagePipes);

      tiles.push(
        <div
          key={`t${key}`}
          className="tile"
          style={{
            left:gx*tpx,
            top:gy*tpx,
            width:tpx,
            height:tpx,
            background:bg,
            borderColor:bo,
          }}
          onClick={(e)=>{e.stopPropagation();onTileClick(gx,gy);}}
        >
          {t === 2 && (
            <div style={{
              position:"absolute",
              inset:0,
              background:"linear-gradient(135deg,#163450,#1a3a5c)",
              opacity:0.8,
            }}/>
          )}

          {t === 6 && cam.zoom > 0.6 && (gx+gy)%2 === 0 && (
            <div style={{
              position:"absolute",
              inset:0,
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              fontSize:tpx*0.38,
              pointerEvents:"none",
            }}>
              🌲
            </div>
          )}

          {(G.weather?.id==='rainy'||G.weather?.id==='storm') && !isRd && (
            <div style={{
              position:"absolute",
              inset:0,
              background:"rgba(0,40,80,0.1)",
              pointerEvents:"none",
            }}/>
          )}

          {inActivePowerRange && (
            <div style={{
              position:"absolute",
              inset:0,
              background:"rgba(255,180,0,0.13)",
              border:"1px solid rgba(255,180,0,0.28)",
              pointerEvents:"none",
            }}/>
          )}

          {showWaterPipes && (inWaterRange || inSewageRange) && (
            <div style={{
              position:"absolute",
              inset:0,
              background:
                inWaterRange && inSewageRange
                  ? "linear-gradient(135deg,rgba(0,160,255,0.13),rgba(199,125,255,0.13))"
                  : inWaterRange
                    ? "rgba(0,160,255,0.13)"
                    : "rgba(199,125,255,0.12)",
              border:
                inWaterRange && inSewageRange
                  ? "1px solid rgba(180,220,255,0.28)"
                  : inWaterRange
                    ? "1px solid rgba(0,160,255,0.28)"
                    : "1px solid rgba(199,125,255,0.25)",
              pointerEvents:"none",
            }}/>
          )}
        </div>
      );
    }
  }

  const roadEls = [];
  G.roads.forEach(key => {
    const [rx,ry] = key.split(',').map(Number);

    if(
      Number.isNaN(rx) ||
      Number.isNaN(ry) ||
      rx < 0 ||
      ry < 0 ||
      rx >= sz ||
      ry >= sz
    ) return;

    roadEls.push(
      <RoadTile
        key={`r${key}`}
        gx={rx}
        gy={ry}
        tpx={tpx}
        roads={G.roads}
      />
    );
  });

  const powerLineEls = [];
  if(showPowerLines) {
    powerLines.forEach(key => {
      const [px, py] = key.split(',').map(Number);

      if(
        Number.isNaN(px) ||
        Number.isNaN(py) ||
        px < 0 ||
        py < 0 ||
        px >= sz ||
        py >= sz
      ) return;

      powerLineEls.push(
        <PowerLineTile
          key={`pl${key}`}
          gx={px}
          gy={py}
          tpx={tpx}
          powerLines={powerLines}
          activePowerLines={activePowerLines}
        />
      );
    });
  }

  const waterPipeEls = [];
  if(showWaterPipes) {
    waterPipes.forEach(key => {
      const [wx, wy] = key.split(',').map(Number);

      if(
        Number.isNaN(wx) ||
        Number.isNaN(wy) ||
        wx < 0 ||
        wy < 0 ||
        wx >= sz ||
        wy >= sz
      ) return;

      waterPipeEls.push(
        <WaterPipeTile
          key={`wp${key}`}
          gx={wx}
          gy={wy}
          tpx={tpx}
          waterPipes={waterPipes}
          waterSupplyPipes={waterSupplyPipes}
          sewagePipes={sewagePipes}
        />
      );
    });
  }

  const previews = [];

  if(G.buildMode) {
    for(let gy=0; gy<sz; gy++) {
      for(let gx=0; gx<sz; gx++) {
        const key = `${gx},${gy}`;
        const t = ter[gy]?.[gx] ?? 0;

        if(t === 2) continue;

        if(G.buildMode === 'road') {
          if(!G.roads.has(key) && !G.grid[key]) {
            previews.push(
              <div
                key={`pv${key}`}
                className="pv-tile"
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
        } else if(G.buildMode === 'powerline') {
          const isValidStart = isNearPowerSource(gx, gy, G.buildings) || isNearPowerLine(gx, gy, powerLines);
          const alreadyHasLine = powerLines.has(key);

          if(!alreadyHasLine) {
            previews.push(
              <div
                key={`pvl${key}`}
                className="pv-tile"
                style={{
                  left:gx*tpx,
                  top:gy*tpx,
                  width:tpx,
                  height:tpx,
                  background:isValidStart ? "rgba(255,180,0,0.12)" : "rgba(255,61,90,0.045)",
                  border:isValidStart ? "1px dashed rgba(255,180,0,0.45)" : "1px dashed rgba(255,61,90,0.16)",
                }}
              />
            );
          }
        } else if(G.buildMode === 'waterpipe') {
          const isRoad = G.roads.has(key);
          const isValidStart = isRoad || isNearWaterSource(gx, gy, G.buildings) || isNearWaterPipe(gx, gy, waterPipes);
          const alreadyHasPipe = waterPipes.has(key);

          if(!alreadyHasPipe) {
            previews.push(
              <div
                key={`pvw${key}`}
                className="pv-tile"
                style={{
                  left:gx*tpx,
                  top:gy*tpx,
                  width:tpx,
                  height:tpx,
                  background:isValidStart ? "rgba(0,160,255,0.12)" : "rgba(255,61,90,0.045)",
                  border:isValidStart ? "1px dashed rgba(0,160,255,0.45)" : "1px dashed rgba(255,61,90,0.16)",
                }}
              />
            );
          }
        } else {
          if(!G.grid[key] && !G.roads.has(key)) {
            previews.push(
              <div
                key={`pv${key}`}
                className="pv-tile"
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

  const bldEls = G.buildings.map(b => {
    const d = BD[b.type];
    if(!d) return null;

    const hasR = d.nr || nR(b.x,b.y,G.roads) || nT(b.x,b.y,act);
    const isSel = G.selUID === b.uid;

    const powerStatus = getPowerStatusForBuilding(b, activePowerLines);
    const showPowerStatus = showPowerLines && ['connected','disconnected'].includes(powerStatus);

    const waterStatus = getWaterStatusForBuilding(b, waterSupplyPipes);
    const showWaterStatus = showWaterPipes && ['connected','disconnected'].includes(waterStatus);

    const sewageStatus = getSewageStatusForBuilding(b, sewagePipes);
    const showSewageStatus = showWaterPipes && ['connected','disconnected'].includes(sewageStatus);

    return (
      <div
        key={b.uid}
        className="bld"
        style={{
          left:b.x*tpx,
          top:b.y*tpx,
          width:tpx,
          height:tpx,
          zIndex:isSel?20:b.building?8:6,
        }}
        onClick={(e)=>{e.stopPropagation();onBldClick(b.uid);}}
      >
        <BldTile
          b={b}
          tpx={tpx}
          isSel={isSel}
          hasRoad={hasR}
          now={currentTime}
          powerStatus={powerStatus}
          showPowerStatus={showPowerStatus}
          waterStatus={waterStatus}
          showWaterStatus={showWaterStatus}
          sewageStatus={sewageStatus}
          showSewageStatus={showSewageStatus}
        />
      </div>
    );
  });

  return (
    <div
      id="map-container"
      ref={mapRef}
      style={{
        left:cam.x,
        top:cam.y,
        width:sz*tpx,
        height:sz*tpx,
      }}
    >
      {tiles}
      {roadEls}
      {powerLineEls}
      {waterPipeEls}
      {previews}
      {bldEls}
    </div>
  );
}