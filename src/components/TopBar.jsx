import React from 'react';
import { fa, fm } from '../gameLogic.js';

export default function TopBar({ G }) {
  if(!G.stats) return null;
  const s = G.stats;
  const avgH = Math.round(Object.values(s.sat).reduce((a,b)=>a+b,0)/5);

  return (
    <div id="topbar">
      <div className="logo">
        <div className="logodot"/>
        <span className="logotext">NEO<span style={{color:"#00ffcc"}}>CITY</span></span>
      </div>
      <div className="chip"><span className="ci">💰</span><span className="cv" style={{color:G.budget>5000?'#ffd700':'#ff3d5a'}}>{fa(G.budget)}zł</span></div>
      <div className="chip"><span className="ci">📈</span><span className="cv" style={{color:s.net>=0?'#00e87a':'#ff3d5a'}}>{fm(s.net)}/m</span></div>
      <div className="chip"><span className="ci">👥</span><span className="cv" style={{color:"#00b4ff"}}>{fa(s.pop)}</span></div>
      <div className="chip"><span className="ci">💼</span><span className="cv" style={{color:s.er>70?'#00e87a':s.er>40?'#ffd700':'#ff3d5a'}}>{fa(s.workers)}/{fa(s.jobs)}</span></div>
      <div className="chip"><span className="ci">😊</span><span className="cv" style={{color:avgH>60?'#00e87a':avgH>35?'#ffd700':'#ff3d5a'}}>{avgH}%</span></div>
      <div className="chip"><span className="ci">⚡</span><span className="cv" style={{color:s.pwOk?'#00e87a':'#ff3d5a'}}>{s.pwOk?'OK':'!'+fa(s.pw)}</span></div>
      <div className="chip"><span className="ci">💧</span><span className="cv" style={{color:s.wtOk?'#00e87a':'#ff3d5a'}}>{s.wtOk?'OK':'!'+fa(s.wt)}</span></div>
      <span className="weather-icon">{G.weather?.icon||'☀️'}</span>
      <div className="clk">
        <div className="clktime">{String(G.month).padStart(2,'0')}.{2025+G.year-1}</div>
        <div>🗳️{G.elTmr}m</div>
      </div>
    </div>
  );
}
