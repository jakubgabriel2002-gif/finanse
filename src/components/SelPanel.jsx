import React from 'react';
import { BD, BT, BL } from '../data.js';
import { nR, nT, fa, ft } from '../gameLogic.js';
import {
  SOLAR_UPGRADE_COST,
  canInstallSolar,
  canInstallFilter,
  getFilterLevel,
  getFilterReductionPercent,
  getNextEcoUpgrade,
  hasGreenRoof,
  getGreenRoofAbsorption,
} from '../game/buildingUpgrades.js';
import { getBuildingEmissionPreview } from '../game/environment/emissions.js';

export default function SelPanel({ G, onClose, onUpgrade, onDemolish, onSolar, onFilter }) {
  const b = G.selUID!=null ? G.buildings.find(x=>x.uid===G.selUID) : null;
  if(!b) return null;

  const d = BD[b.type];
  if(!d) return null;

  const now = Date.now()/1000;
  const act = G.buildings.filter(x=>!x.building);
  const hasR = d.nr || nR(b.x,b.y,G.roads) || nT(b.x,b.y,act);
  const upgCost = Math.floor(d.cost*b.lv*1.5);

  const solarCheck = canInstallSolar(b);
  const ecoCheck = canInstallFilter(b);
  const nextEcoUpgrade = getNextEcoUpgrade(b);
  const emissionPreview = getBuildingEmissionPreview(b);

  const canSolar = solarCheck.ok;
  const canEco = ecoCheck.ok;

  const filterLevel = getFilterLevel(b);
  const currentFilterReduction = getFilterReductionPercent(b);
  const roofOn = hasGreenRoof(b);
  const roofAbsorption = getGreenRoofAbsorption(b);

  const co2Color = emissionPreview.finalEmission <= 0
    ? '#00e87a'
    : emissionPreview.finalEmission < 30
      ? '#ffd700'
      : '#ff9944';

  return (
    <div id="sel-panel">
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <span style={{fontSize:24}}>
          {d.e}{b.solar?'☀️':''}{filterLevel>0?'🌿':''}{roofOn?'🌱':''}
        </span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700}}>{d.n}</div>
          <div style={{fontSize:10,color:"#3a5f82"}}>Lv {b.lv}/{d.ml} · {d.c}</div>
          {!d.nr && !hasR && <div style={{fontSize:9,color:"#ff9944",marginTop:1}}>⚠️ Brak drogi — przychód 5%!</div>}
        </div>
        <button onPointerDown={(e)=>{e.stopPropagation();e.preventDefault();onClose();}}
          style={{background:"none",border:"none",color:"#6a90b8",fontSize:18,padding:"2px 8px"}}>✕</button>
      </div>

      {b.building ? (
        <div style={{marginBottom:8}}>
          <div style={{fontSize:11,color:"#ffb400",marginBottom:4}}>⏱️ W budowie — {ft(Math.max(0,Math.ceil(b.buildEnd-now)))} pozostało</div>
          <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:4,overflow:"hidden"}}>
            <div style={{width:`${Math.max(0,Math.min(1,1-(b.buildEnd-now)/BT[b.lv-1]))*100}%`,height:"100%",background:"linear-gradient(90deg,#ffb400,#ffe080)"}}/>
          </div>
        </div>
      ) : (
        <>
          <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:7,color:"#3a5f82",fontFamily:"monospace"}}>PRZYCHÓD</div>
              <div style={{fontSize:11,fontWeight:700,color:"#00e87a",fontFamily:"monospace"}}>+{fa(d.inc*b.lv)}/m</div>
            </div>

            <div>
              <div style={{fontSize:7,color:"#3a5f82",fontFamily:"monospace"}}>KOSZT</div>
              <div style={{fontSize:11,fontWeight:700,color:"#ff3d5a",fontFamily:"monospace"}}>-{fa(d.exp*b.lv)}/m</div>
            </div>

            <div>
              <div style={{fontSize:7,color:"#3a5f82",fontFamily:"monospace"}}>POP</div>
              <div style={{fontSize:11,fontWeight:700,color:"#00b4ff",fontFamily:"monospace"}}>+{d.pop*b.lv}</div>
            </div>

            <div>
              <div style={{fontSize:7,color:"#3a5f82",fontFamily:"monospace"}}>PRACA</div>
              <div style={{fontSize:11,fontWeight:700,color:"#a259ff",fontFamily:"monospace"}}>+{d.jobs*b.lv}</div>
            </div>

            <div>
              <div style={{fontSize:7,color:"#3a5f82",fontFamily:"monospace"}}>CO₂</div>
              <div style={{fontSize:11,fontWeight:700,color:co2Color,fontFamily:"monospace"}}>
                {emissionPreview.finalEmission>0?'+':''}{fa(emissionPreview.finalEmission)}
              </div>
            </div>
          </div>

          {b.solar && (
            <div style={{fontSize:10,color:"#00e87a",marginBottom:4}}>
              ☀️ Panele słoneczne — -50% zużycia energii
            </div>
          )}

          {filterLevel > 0 && (
            <div style={{fontSize:10,color:"#00e87a",marginBottom:4}}>
              🌿 Filtr CO₂ Lv{filterLevel} — -{currentFilterReduction}% emisji
              {emissionPreview.filterReduction > 0 ? ` · redukcja ${fa(emissionPreview.filterReduction)} j.` : ''}
            </div>
          )}

          {roofOn && (
            <div style={{fontSize:10,color:"#00e87a",marginBottom:4}}>
              🌱 Zielony dach — pochłania {fa(roofAbsorption)} j. CO₂
            </div>
          )}
        </>
      )}

      <div style={{display:"flex",gap:8}}>
        {b.lv<d.ml && !b.building && (
          <button onPointerDown={(e)=>{e.stopPropagation();e.preventDefault();onUpgrade();}}
            style={{flex:1,padding:"8px 0",border:"1px solid rgba(0,180,255,0.4)",borderRadius:8,background:"rgba(0,180,255,0.1)",color:"#00b4ff",fontSize:11,fontFamily:"monospace"}}>
            ⬆️ Lv{b.lv+1} · {fa(upgCost)}zł · {BL[b.lv]}
          </button>
        )}

        {b.lv>=d.ml && !b.building && (
          <div style={{flex:1,padding:8,border:"1px solid rgba(255,215,0,0.3)",borderRadius:8,background:"rgba(255,215,0,0.06)",color:"#ffd700",fontSize:11,textAlign:"center"}}>
            ⭐ Max
          </div>
        )}

        {b.type!=="townhall" && (
          <button onPointerDown={(e)=>{e.stopPropagation();e.preventDefault();onDemolish();}}
            style={{padding:"8px 12px",border:"1px solid rgba(255,61,90,0.4)",borderRadius:8,background:"rgba(255,61,90,0.08)",color:"#ff3d5a",fontSize:13}}>
            💥
          </button>
        )}
      </div>

      {canSolar && !b.building && (
        <button onPointerDown={(e)=>{e.stopPropagation();e.preventDefault();onSolar();}}
          style={{marginTop:6,width:"100%",padding:8,border:"1px solid rgba(255,200,0,0.4)",borderRadius:8,background:"rgba(255,200,0,0.06)",color:"#ffd700",fontSize:11}}>
          ☀️ Zainstaluj panele słoneczne ({fa(SOLAR_UPGRADE_COST)} zł)
        </button>
      )}

      {canEco && !b.building && nextEcoUpgrade.kind === 'filter' && (
        <button onPointerDown={(e)=>{e.stopPropagation();e.preventDefault();onFilter();}}
          style={{marginTop:5,width:"100%",padding:8,border:"1px solid rgba(0,232,122,0.4)",borderRadius:8,background:"rgba(0,232,122,0.06)",color:"#00e87a",fontSize:11}}>
          {filterLevel > 0
            ? `🌿 Ulepsz filtr CO₂ do Lv${nextEcoUpgrade.nextLevel} (-${nextEcoUpgrade.reductionPercent}%) · ${fa(nextEcoUpgrade.cost)} zł`
            : `🌿 Zainstaluj filtr CO₂ Lv1 (-${nextEcoUpgrade.reductionPercent}%) · ${fa(nextEcoUpgrade.cost)} zł`}
        </button>
      )}

      {canEco && !b.building && nextEcoUpgrade.kind === 'greenRoof' && (
        <button onPointerDown={(e)=>{e.stopPropagation();e.preventDefault();onFilter();}}
          style={{marginTop:5,width:"100%",padding:8,border:"1px solid rgba(0,232,122,0.4)",borderRadius:8,background:"rgba(0,232,122,0.06)",color:"#00e87a",fontSize:11}}>
          🌱 Zainstaluj zielony dach (-{fa(nextEcoUpgrade.absorption)} CO₂) · {fa(nextEcoUpgrade.cost)} zł
        </button>
      )}

      {!canEco && (filterLevel > 0 || roofOn) && !b.building && (
        <div style={{
          marginTop:5,
          padding:8,
          border:"1px solid rgba(0,232,122,0.18)",
          borderRadius:8,
          background:"rgba(0,232,122,0.04)",
          color:"#00e87a",
          fontSize:11,
          textAlign:"center",
        }}>
          🌿 Ekologiczne modernizacje zakończone
        </div>
      )}
    </div>
  );
}