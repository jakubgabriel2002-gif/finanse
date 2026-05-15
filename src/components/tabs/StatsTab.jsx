import React from 'react';
import { fm } from '../../gameLogic.js';

export default function StatsTab({ G }) {
  const s = G.stats;
  if(!s) return null;
  const rows = [
    {l:"🏠 Mieszkania",v:s.sat.housing,g:"linear-gradient(90deg,#00b4ff,#00ffcc)"},
    {l:"💼 Praca",v:s.sat.jobs,g:"linear-gradient(90deg,#a259ff,#00b4ff)"},
    {l:"🎓 Edukacja",v:s.sat.edu,g:"linear-gradient(90deg,#ffd700,#ff6b35)"},
    {l:"🌳 Środowisko",v:s.sat.env,g:"linear-gradient(90deg,#00e87a,#00b4ff)"},
    {l:"🏛️ Usługi",v:s.sat.services,g:"linear-gradient(90deg,#ff6b35,#a259ff)"},
  ];

  return (
    <div className="inner">
      <div className="tab-title">📊 Statystyki</div>
      <div className="panel">
        <div className="ptitle">😊 ZADOWOLENIE</div>
        {rows.map(r => (
          <div key={r.l} className="satbar">
            <span className="sl">{r.l}</span>
            <div className="st"><div className="sf" style={{width:`${r.v}%`,background:r.g}}/></div>
            <span className="sv" style={{color:r.v>60?'#00e87a':r.v>35?'#ffd700':'#ff3d5a'}}>{Math.round(r.v)}%</span>
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="ptitle">// DZIENNIK FINANSOWY</div>
        {G.log.map(e => (
          <div key={e.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid rgba(0,180,255,0.05)",fontSize:11}}>
            <span style={{color:"#6a90b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:230}}>{e.label}</span>
            <span style={{fontFamily:"monospace",flexShrink:0,color:e.amount>0?'#00e87a':e.amount<0?'#ff3d5a':'#6a90b8'}}>{e.amount!==0?fm(e.amount):'—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
