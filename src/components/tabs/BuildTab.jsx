import React from 'react';
import { BD, LIM, BL } from '../../data.js';
import { fa } from '../../gameLogic.js';
import { POWERLINE_COST, POWERLINE_RANGE } from '../../game/resources/powerLines.js';
import { WATERPIPE_COST, WATERPIPE_RANGE } from '../../game/resources/waterPipes.js';

export default function BuildTab({ G, onPick }) {
  const cats = [...new Set(Object.values(BD).map(d => d.c))];

  return (
    <div className="inner">
      <div className="tab-title">🏗️ Buduj</div>

      <div style={{fontSize:10,color:"#3a5f82",marginBottom:6,fontFamily:"monospace"}}>INFRASTRUKTURA</div>

      <div className={`bcard ${G.buildMode==='road'?'act':''}`}
        style={{borderColor:"rgba(255,215,0,0.3)",marginBottom:6}}
        onClick={() => onPick('road')}>
        <span style={{fontSize:22}}>🛣️</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600}}>Droga (wąska)</div>
          <div style={{display:"flex",gap:5,marginTop:3}}>
            <span className="tag" style={{background:"rgba(255,215,0,0.15)",color:"#ffd700"}}>200 zł/kafelek</span>
            <span className="tag" style={{background:"rgba(0,232,122,0.1)",color:"#00e87a"}}>natychmiast</span>
          </div>
        </div>
        <span style={{fontSize:18,color:"#ffd700"}}>→</span>
      </div>

      <div className={`bcard ${G.buildMode==='powerline'?'act':''}`}
        style={{borderColor:"rgba(255,180,0,0.35)",marginBottom:6}}
        onClick={() => onPick('powerline')}>
        <span style={{fontSize:22}}>🔌</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600}}>Linia energetyczna</div>
          <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>
            <span className="tag" style={{background:"rgba(255,215,0,0.15)",color:"#ffd700"}}>{POWERLINE_COST} zł/kafelek</span>
            <span className="tag" style={{background:"rgba(255,180,0,0.13)",color:"#ffb400"}}>zasięg {POWERLINE_RANGE} kratki</span>
            <span className="tag" style={{background:"rgba(0,232,122,0.1)",color:"#00e87a"}}>nie blokuje miejsca</span>
          </div>
        </div>
        <span style={{fontSize:18,color:"#ffd700"}}>→</span>
      </div>

      <div className={`bcard ${G.buildMode==='waterpipe'?'act':''}`}
        style={{borderColor:"rgba(0,150,255,0.35)",marginBottom:12}}
        onClick={() => onPick('waterpipe')}>
        <span style={{fontSize:22}}>💧</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600}}>Rury wod-kan</div>
          <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>
            <span className="tag" style={{background:"rgba(255,215,0,0.15)",color:"#ffd700"}}>{WATERPIPE_COST} zł/kafelek</span>
            <span className="tag" style={{background:"rgba(0,150,255,0.13)",color:"#60b4ff"}}>zasięg {WATERPIPE_RANGE} kratki</span>
            <span className="tag" style={{background:"rgba(0,232,122,0.1)",color:"#00e87a"}}>nie blokuje miejsca</span>
          </div>
        </div>
        <span style={{fontSize:18,color:"#60b4ff"}}>→</span>
      </div>

      {cats.map(cat => {
        const items = Object.entries(BD).filter(([,d]) => d.c === cat);
        return (
          <div key={cat}>
            <div style={{fontSize:10,color:"#3a5f82",letterSpacing:2,margin:"10px 0 6px",fontFamily:"monospace"}}>
              {cat.toUpperCase()}
            </div>
            {items.map(([key, d]) => {
              const lim = LIM[G.thLv]?.[key] ?? 99;
              const cnt = G.buildings.filter(b => b.type === key).length;
              const full = cnt >= lim;
              return (
                <div key={key}
                  className={`bcard ${G.buildMode===key?'act':''} ${full?'atl':''}`}
                  onClick={() => { if(!full) onPick(key); }}>
                  <span style={{fontSize:20}}>{d.e}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600}}>{d.n}{key==='townhall'?' (tylko 1)':''}</div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:3}}>
                      {d.cost>0 && <span className="tag" style={{background:"rgba(255,215,0,0.14)",color:"#ffd700"}}>{fa(d.cost)}zł</span>}
                      {d.inc>0 && <span className="tag" style={{background:"rgba(0,232,122,0.14)",color:"#00e87a"}}>+{d.inc}/lv</span>}
                      {d.jobs>0 && <span className="tag" style={{background:"rgba(162,89,255,0.14)",color:"#a259ff"}}>{d.jobs}pr/lv</span>}
                      {d.pw<0 && <span className="tag" style={{background:"rgba(0,232,122,0.1)",color:"#00e87a"}}>⚡{d.pw}/lv</span>}
                      {d.wt<0 && <span className="tag" style={{background:"rgba(0,150,255,0.1)",color:"#60b4ff"}}>💧{d.wt}/lv</span>}
                      <span className="tag" style={{background:"rgba(255,180,0,0.14)",color:"#ffb400"}}>⏱{BL[0]}</span>
                      <span className="tag" style={{background:full?"rgba(255,61,90,0.15)":"rgba(255,255,255,0.05)",color:full?"#ff3d5a":"#6a90b8"}}>{cnt}/{lim}</span>
                    </div>
                  </div>
                  <span style={{fontSize:14,color:full?'#ff3d5a':G.buildMode===key?'#00ffcc':'#3a5f82'}}>
                    {full?'🔒':'→'}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}