import React from 'react';
import { TSTEPS } from '../data.js';

export default function Tutorial({ step, gameState, onAction, onSkip }) {
  const s = TSTEPS[step];
  if(!s) return null;

  if (s.waitForRoads) {
    const current = gameState?.roads?.size || 0;
    const required = s.waitForRoads;
    const done = current >= required;
    const missing = Math.max(0, required - current);
    const progress = Math.min(100, Math.round((current / required) * 100));

    return (
      <div style={{
        position:"fixed",
        left:10,
        right:10,
        bottom:82,
        zIndex:420,
        pointerEvents:"none",
        display:"flex",
        justifyContent:"center",
      }}>
        <div style={{
          width:"min(380px, calc(100vw - 20px))",
          background:"rgba(8,18,35,0.97)",
          border:"1px solid rgba(0,180,255,0.45)",
          borderRadius:14,
          padding:14,
          boxShadow:"0 8px 32px rgba(0,0,0,0.65)",
          pointerEvents:"auto",
        }}>
          <div style={{fontSize:10,color:"#3a5f82",fontFamily:"monospace",marginBottom:5}}>
            KROK {step + 1}/{TSTEPS.length}
          </div>

          <div style={{fontSize:15,fontWeight:800,color:"#00ffcc",marginBottom:6}}>
            {s.title}
          </div>

          <div style={{fontSize:11,color:"#6a90b8",lineHeight:1.45,whiteSpace:"pre-line",marginBottom:10}}>
            {s.body}
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:11,color:"#6a90b8"}}>Drogi</span>
            <span style={{fontSize:12,fontWeight:800,fontFamily:"monospace",color:done?"#00e87a":"#ffd700"}}>
              {current}/{required}
            </span>
          </div>

          <div style={{height:7,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden",marginBottom:10}}>
            <div style={{
              width:`${progress}%`,
              height:"100%",
              background:done
                ? "linear-gradient(90deg,#00e87a,#00ffcc)"
                : "linear-gradient(90deg,#ffd700,#ff9944)",
              transition:"width 0.25s ease",
            }}/>
          </div>

          <div style={{display:"flex",gap:8}}>
            <button
              onPointerDown={(e) => { e.stopPropagation(); onSkip(); }}
              style={{
                padding:"8px 12px",
                border:"1px solid rgba(255,255,255,0.16)",
                borderRadius:8,
                background:"transparent",
                color:"#6a90b8",
                fontSize:11,
              }}>
              Pomiń
            </button>

            <button
              onPointerDown={(e) => { e.stopPropagation(); onAction(s); }}
              style={{
                flex:1,
                padding:"9px 10px",
                border:`1px solid ${done ? "rgba(0,232,122,0.45)" : "rgba(255,215,0,0.35)"}`,
                borderRadius:8,
                background:done ? "rgba(0,232,122,0.1)" : "rgba(255,215,0,0.08)",
                color:done ? "#00e87a" : "#ffd700",
                fontSize:12,
                fontWeight:800,
              }}>
              {done ? s.btn : `Buduj dalej — brakuje ${missing}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

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