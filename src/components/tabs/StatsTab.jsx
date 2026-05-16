import React from 'react';
import { fa, fm } from '../../gameLogic.js';

function getEmissionData(stats) {
  return stats.emissions || {
    gross: Math.max(0, stats.co2 || 0),
    buildingGross: Math.max(0, stats.co2 || 0),
    infrastructurePenalty: 0,
    absorption: 0,
    filteredReduction: 0,
    totalReduction: 0,
    net: stats.co2 || 0,
    airQuality: stats.co2 <= 0 ? 100 : Math.max(0, 100 - stats.co2),
    level: {
      icon: stats.co2 <= 30 ? '✅' : stats.co2 <= 70 ? '⚠️' : '🏭',
      label: stats.co2 <= 30 ? 'Dobre' : stats.co2 <= 70 ? 'Średnie' : 'Złe',
      color: stats.co2 <= 30 ? '#00e87a' : stats.co2 <= 70 ? '#ffd700' : '#ff3d5a',
    },
    emitters: [],
    reducers: [],
    topEmitter: null,
    topReducer: null,
  };
}

export default function StatsTab({ G }) {
  const s = G.stats;
  if(!s) return null;

  const emissions = getEmissionData(s);

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
            <div className="st">
              <div className="sf" style={{width:`${r.v}%`,background:r.g}}/>
            </div>
            <span className="sv" style={{color:r.v>60?'#00e87a':r.v>35?'#ffd700':'#ff3d5a'}}>
              {Math.round(r.v)}%
            </span>
          </div>
        ))}
      </div>

      <div className="panel" style={{border:`1px solid ${emissions.level.color}44`}}>
        <div className="ptitle" style={{color:emissions.level.color}}>🌫️ POWIETRZE I CO₂</div>

        <div style={{
          background:`${emissions.level.color}10`,
          border:`1px solid ${emissions.level.color}33`,
          borderRadius:9,
          padding:9,
          marginBottom:10,
        }}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:12,fontWeight:800,color:emissions.level.color}}>
              {emissions.level.icon} {emissions.level.label}
            </span>
            <span style={{fontSize:13,fontFamily:"monospace",fontWeight:900,color:emissions.level.color}}>
              {emissions.airQuality}%
            </span>
          </div>

          <div style={{height:8,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden"}}>
            <div style={{
              width:`${Math.max(0, Math.min(100, emissions.airQuality))}%`,
              height:"100%",
              background:emissions.airQuality >= 80
                ? "linear-gradient(90deg,#00e87a,#00ffcc)"
                : emissions.airQuality >= 55
                  ? "linear-gradient(90deg,#ffd700,#ff9944)"
                  : "linear-gradient(90deg,#ff9944,#ff3d5a)",
            }}/>
          </div>
        </div>

        <div className="row">
          <span className="rl">Emisja z budynków</span>
          <span className="rv" style={{color:"#ff9944"}}>{fa(emissions.buildingGross)} j.</span>
        </div>

        <div className="row">
          <span className="rl">Kary infrastruktury</span>
          <span className="rv" style={{color:emissions.infrastructurePenalty>0?'#ff3d5a':'#3a5f82'}}>
            {fa(emissions.infrastructurePenalty)} j.
          </span>
        </div>

        <div className="row">
          <span className="rl">Emisja brutto</span>
          <span className="rv" style={{color:"#ff9944"}}>{fa(emissions.gross)} j.</span>
        </div>

        <div className="row">
          <span className="rl">Redukcja filtrów</span>
          <span className="rv" style={{color:emissions.filteredReduction>0?'#00e87a':'#3a5f82'}}>
            -{fa(emissions.filteredReduction)} j.
          </span>
        </div>

        <div className="row">
          <span className="rl">Pochłanianie zieleni</span>
          <span className="rv" style={{color:emissions.absorption>0?'#00e87a':'#3a5f82'}}>
            -{fa(emissions.absorption)} j.
          </span>
        </div>

        <div className="row">
          <span className="rl">Redukcja łącznie</span>
          <span className="rv" style={{color:emissions.totalReduction>0?'#00e87a':'#3a5f82'}}>
            -{fa(emissions.totalReduction)} j.
          </span>
        </div>

        <div className="row">
          <span className="rl">Emisja netto</span>
          <span className="rv" style={{color:emissions.net<=0?'#00e87a':emissions.net<70?'#ffd700':'#ff3d5a'}}>
            {emissions.net>0?'+':''}{fa(emissions.net)} j.
          </span>
        </div>

        <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{background:"rgba(255,153,68,0.06)",border:"1px solid rgba(255,153,68,0.18)",borderRadius:9,padding:8}}>
            <div style={{fontSize:9,color:"#ff9944",fontWeight:800,marginBottom:4}}>TOP EMITENT</div>
            {emissions.topEmitter ? (
              <>
                <div style={{fontSize:12,fontWeight:700,color:"#c8dff5",marginBottom:2}}>
                  {emissions.topEmitter.icon} {emissions.topEmitter.name}
                </div>
                <div style={{fontSize:11,fontFamily:"monospace",color:"#ff9944"}}>
                  +{fa(emissions.topEmitter.value)} j.
                </div>
              </>
            ) : (
              <div style={{fontSize:11,color:"#3a5f82"}}>Brak emisji</div>
            )}
          </div>

          <div style={{background:"rgba(0,232,122,0.06)",border:"1px solid rgba(0,232,122,0.18)",borderRadius:9,padding:8}}>
            <div style={{fontSize:9,color:"#00e87a",fontWeight:800,marginBottom:4}}>TOP REDUKCJA</div>
            {emissions.topReducer ? (
              <>
                <div style={{fontSize:12,fontWeight:700,color:"#c8dff5",marginBottom:2}}>
                  {emissions.topReducer.icon} {emissions.topReducer.name}
                </div>
                <div style={{fontSize:11,fontFamily:"monospace",color:"#00e87a"}}>
                  -{fa(emissions.topReducer.value)} j.
                </div>
              </>
            ) : (
              <div style={{fontSize:11,color:"#3a5f82"}}>Brak redukcji</div>
            )}
          </div>
        </div>

        {emissions.emitters?.length > 0 && (
          <div style={{marginTop:10}}>
            <div style={{fontSize:10,color:"#6a90b8",fontWeight:800,marginBottom:5}}>
              NAJWIĘKSI EMITENCI
            </div>

            {emissions.emitters.slice(0,5).map(item => (
              <div
                key={`${item.uid}-${item.type}`}
                style={{
                  display:"flex",
                  justifyContent:"space-between",
                  fontSize:11,
                  padding:"4px 0",
                  borderBottom:"1px solid rgba(255,255,255,0.05)",
                }}
              >
                <span style={{color:"#c8dff5"}}>
                  {item.icon} {item.name} Lv{item.level}{item.hasFilter ? ' · filtr' : ''}
                </span>
                <span style={{fontFamily:"monospace",color:item.hasFilter?'#ffd700':'#ff9944'}}>
                  +{fa(item.value)} j.
                </span>
              </div>
            ))}
          </div>
        )}

        {emissions.airQuality < 70 && (
          <div style={{
            marginTop:10,
            fontSize:10,
            color:emissions.level.color,
            lineHeight:1.45,
            background:`${emissions.level.color}10`,
            border:`1px solid ${emissions.level.color}33`,
            borderRadius:8,
            padding:8,
          }}>
            🏭 Słabe powietrze obniża środowisko, mieszkalnictwo i usługi. Najszybciej pomoże filtr CO₂ na największych emitentach, więcej parków i mniej ciężkiej energetyki.
          </div>
        )}
      </div>

      <div className="panel">
        <div className="ptitle">// DZIENNIK FINANSOWY</div>
        {G.log.map(e => (
          <div
            key={e.id}
            style={{
              display:"flex",
              justifyContent:"space-between",
              padding:"4px 0",
              borderBottom:"1px solid rgba(0,180,255,0.05)",
              fontSize:11,
            }}
          >
            <span style={{
              color:"#6a90b8",
              overflow:"hidden",
              textOverflow:"ellipsis",
              whiteSpace:"nowrap",
              maxWidth:230,
            }}>
              {e.label}
            </span>
            <span style={{
              fontFamily:"monospace",
              flexShrink:0,
              color:e.amount>0?'#00e87a':e.amount<0?'#ff3d5a':'#6a90b8',
            }}>
              {e.amount!==0?fm(e.amount):'—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}