import React from 'react';
import { BD, BT, BL } from '../data.js';
import { nR, nT, fa, ft } from '../gameLogic.js';

export default function SelPanel({ G, onClose, onUpgrade, onDemolish, onSolar, onFilter }) {
  const b = G.selUID!=null ? G.buildings.find(x=>x.uid===G.selUID) : null;
  if(!b) return null;
  const d = BD[b.type];
  if(!d) return null;
  const now = Date.now()/1000;
  const act = G.buildings.filter(x=>!x.building);
  const hasR = d.nr || nR(b.x,b.y,G.roads) || nT(b.x,b.y,act);
  const upgCost = Math.floor(d.cost*b.lv*1.5);
  const canSolar = !b.solar && d.pw>0 && !['solar','windmill','powerplant'].includes(b.type);
  const canFilter = !b.co2f && d.co2>0 && ['factory','powerplant','office','hospital'].includes(b.type);

  return (
    <div id="sel-panel">
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <span style={{fontSize:24}}>{d.e}{b.solar?'☀️':''}{b.co2f?'🌿':''}</span>
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
            <div><div style={{fontSize:7,color:"#3a5f82",fontFamily:"monospace"}}>PRZYCHÓD</div><div style={{fontSize:11,fontWeight:700,color:"#00e87a",fontFamily:"monospace"}}>+{fa(d.inc*b.lv)}/m</div></div>
            <div><div style={{fontSize:7,color:"#3a5f82",fontFamily:"monospace"}}>KOSZT</div><div style={{fontSize:11,fontWeight:700,color:"#ff3d5a",fontFamily:"monospace"}}>-{fa(d.exp*b.lv)}/m</div></div>
            <div><div style={{fontSize:7,color:"#3a5f82",fontFamily:"monospace"}}>POP</div><div style={{fontSize:11,fontWeight:700,color:"#00b4ff",fontFamily:"monospace"}}>+{d.pop*b.lv}</div></div>
            <div><div style={{fontSize:7,color:"#3a5f82",fontFamily:"monospace"}}>PRACA</div><div style={{fontSize:11,fontWeight:700,color:"#a259ff",fontFamily:"monospace"}}>+{d.jobs*b.lv}</div></div>
            <div><div style={{fontSize:7,color:"#3a5f82",fontFamily:"monospace"}}>CO₂</div><div style={{fontSize:11,fontWeight:700,color:d.co2<0?'#00e87a':'#ff9944',fontFamily:"monospace"}}>{d.co2*b.lv>0?'+':''}{Math.floor(d.co2*b.lv*(b.co2f?0.6:1))}</div></div>
          </div>
          {b.solar && <div style={{fontSize:10,color:"#00e87a",marginBottom:4}}>☀️ Panele słoneczne — -50% zużycia energii</div>}
          {b.co2f && <div style={{fontSize:10,color:"#00e87a",marginBottom:4}}>🌿 Filtr CO₂ — -40% emisji</div>}
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
          <div style={{flex:1,padding:8,border:"1px solid rgba(255,215,0,0.3)",borderRadius:8,background:"rgba(255,215,0,0.06)",color:"#ffd700",fontSize:11,textAlign:"center"}}>⭐ Max</div>
        )}
        {b.type!=="townhall" && (
          <button onPointerDown={(e)=>{e.stopPropagation();e.preventDefault();onDemolish();}}
            style={{padding:"8px 12px",border:"1px solid rgba(255,61,90,0.4)",borderRadius:8,background:"rgba(255,61,90,0.08)",color:"#ff3d5a",fontSize:13}}>💥</button>
        )}
      </div>

      {canSolar && !b.building && (
        <button onPointerDown={(e)=>{e.stopPropagation();e.preventDefault();onSolar();}}
          style={{marginTop:6,width:"100%",padding:8,border:"1px solid rgba(255,200,0,0.4)",borderRadius:8,background:"rgba(255,200,0,0.06)",color:"#ffd700",fontSize:11}}>
          ☀️ Zainstaluj panele słoneczne (3000 zł)
        </button>
      )}
      {canFilter && !b.building && (
        <button onPointerDown={(e)=>{e.stopPropagation();e.preventDefault();onFilter();}}
          style={{marginTop:5,width:"100%",padding:8,border:"1px solid rgba(0,232,122,0.4)",borderRadius:8,background:"rgba(0,232,122,0.06)",color:"#00e87a",fontSize:11}}>
          🌿 Zainstaluj filtr CO₂ (2000 zł)
        </button>
      )}
    </div>
  );
}
