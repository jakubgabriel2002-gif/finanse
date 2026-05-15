import React from 'react';
import { TSTEPS } from '../data.js';

export default function Tutorial({ step, onAction, onSkip }) {
  const s = TSTEPS[step];
  if(!s) return null;

  return (
    <div id="tutorial">
      <div id="tut-box">
        <div className="tut-step">KROK {step + 1}/{TSTEPS.length}</div>
        <div className="tut-title">{s.title}</div>
        <div className="tut-body">{s.body}</div>
        <div style={{display:"flex",gap:8}}>
          <button
            onPointerDown={(e) => { e.stopPropagation(); onSkip(); }}
            style={{padding:"8px 14px",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,background:"transparent",color:"#6a90b8",fontSize:12}}>
            Pomiń
          </button>
          {s.btn ? (
            <button
              onPointerDown={(e) => { e.stopPropagation(); onAction(s); }}
              style={{flex:1,padding:10,border:"1px solid rgba(0,180,255,0.4)",borderRadius:8,background:"rgba(0,180,255,0.12)",color:"#00b4ff",fontSize:13,fontWeight:700}}>
              {s.btn}
            </button>
          ) : (
            <div style={{flex:1,padding:10,textAlign:"center",color:"#3a5f82",fontSize:12,fontStyle:"italic",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8}}>
              Wykonaj akcję na mapie...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
