import React from 'react';
import { POLICIES, MS, GS } from '../../data.js';
import { fa, fm } from '../../gameLogic.js';

function getPowerData(s) {
  return s.power || {
    demand: Math.max(0, s.pw || 0),
    supply: Math.max(0, -(s.pw || 0)),
    balance: -(s.pw || 0),
    deficit: Math.max(0, s.pw || 0),
    surplus: Math.max(0, -(s.pw || 0)),
    ok: s.pwOk,
    efficiency: s.pwOk ? 100 : 35,
    feeEfficiency: s.pwOk ? 100 : 0,
    consumers: [],
    producers: [],
  };
}

function topByValue(items = []) {
  if (!items.length) return null;
  return [...items].sort((a, b) => b.value - a.value)[0];
}

function signedValue(value) {
  if (value > 0) return `+${fa(value)}`;
  if (value < 0) return `-${fa(value)}`;
  return '0';
}

export default function TownhallTab({ G, onOpenLoan, onOpenAudit, onPolicy, onFee, onTax, onReset }) {
  const s = G.stats;
  if(!s) return null;

  const pc = (G.policies.green?500:0)+(G.policies.work?800:0)+(G.policies.night?300:0)+(G.policies.trans?600:0);
  const power = getPowerData(s);
  const topProducer = topByValue(power.producers);
  const topConsumer = topByValue(power.consumers);
  const powerBalanceColor = power.balance >= 0 ? '#00e87a' : '#ff3d5a';

  return (
    <div className="inner">
      <div className="tab-title" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        🏛️ Ratusz
        <span style={{fontSize:10,color:"#3a5f82",fontFamily:"monospace"}}>Lv{G.thLv}·{GS(G.thLv)}×{GS(G.thLv)}·🗳️{G.elTmr}m</span>
      </div>

      {/* ALERTS */}
      {(!s.pwOk||!s.wtOk||s.er<50) && (
        <div style={{background:"rgba(255,61,90,0.08)",border:"1px solid rgba(255,61,90,0.3)",borderRadius:10,padding:10,marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:"#ff3d5a",marginBottom:6}}>🚨 PILNE PROBLEMY</div>
          {!s.pwOk && <div style={{fontSize:11,color:"#ff9944",marginBottom:3}}>⚡ Deficyt energii {fa(power.deficit)} j. — zbuduj elektrownię, farmę solarną albo wiatrak!</div>}
          {!s.wtOk && <div style={{fontSize:11,color:"#60b4ff",marginBottom:3}}>💧 Deficyt wody {s.wt} — zbuduj wodociągi lub oczyszczalnię!</div>}
          {s.er<50 && <div style={{fontSize:11,color:"#ffd700"}}>💼 Zatrudnienie {s.er}% — za mało mieszkańców!</div>}
        </div>
      )}

      {/* BILANS */}
      <div className="panel">
        <div className="ptitle">📊 BILANS MIESIĘCZNY</div>
        <div className="row"><span className="rl">Przychód z budynków</span><span className="rv" style={{color:"#00e87a"}}>+{fa(s.inc - s.feeInc)} zł</span></div>
        <div className="row"><span className="rl">Opłaty od mieszkańców</span><span className="rv" style={{color:"#00e87a"}}>+{fa(s.feeInc)} zł</span></div>
        <div className="row"><span className="rl">Koszty budynków</span><span className="rv" style={{color:"#ff3d5a"}}>-{fa(s.exp)} zł</span></div>
        <div className="row"><span className="rl">Koszty polityk</span><span className="rv" style={{color:"#ff9944"}}>-{fa(pc)} zł</span></div>
        <div className="row"><span className="rl">Rata pożyczki</span><span className="rv" style={{color:G.loan?'#ff3d5a':'#3a5f82'}}>{G.loan?`-${fa(Math.floor(G.loan.amt*G.loan.rate/12))} zł`:'brak'}</span></div>
        <div className="row"><span className="rl">Bilans netto</span><span className="rv" style={{color:s.net>=0?'#00e87a':'#ff3d5a'}}>{fm(s.net)} zł</span></div>
      </div>

      {/* MIASTO */}
      <div className="panel">
        <div className="ptitle">🏙️ MIASTO</div>
        <div className="row"><span className="rl">Populacja</span><span className="rv" style={{color:"#00b4ff"}}>{fa(s.pop)} os.</span></div>
        <div className="row"><span className="rl">Siła robocza</span><span className="rv" style={{color:"#a259ff"}}>{fa(s.workers)} os.</span></div>
        <div className="row"><span className="rl">Miejsca pracy</span><span className="rv" style={{color:"#ffd700"}}>{fa(s.jobs)}</span></div>
        <div className="row"><span className="rl">Zatrudnienie</span><span className="rv" style={{color:s.er>70?'#00e87a':s.er>40?'#ffd700':'#ff3d5a'}}>{s.er}%</span></div>
        <div className="row"><span className="rl">Energia</span><span className="rv" style={{color:powerBalanceColor}}>{power.ok?'OK':'DEFICYT'}</span></div>
        <div className="row"><span className="rl">Woda (saldo)</span><span className="rv" style={{color:s.wt<=0?'#00e87a':'#ff3d5a'}}>{s.wt>0?'+':''}{s.wt}</span></div>
        <div className="row"><span className="rl">Emisja CO₂</span><span className="rv" style={{color:s.co2<0?'#00e87a':s.co2<30?'#ffd700':'#ff3d5a'}}>{s.co2>0?'+':''}{s.co2}</span></div>
        <div className="row"><span className="rl">Pogoda</span><span className="rv">{G.weather?.icon} {G.weather?.name}</span></div>
      </div>

      {/* ENERGIA */}
      <div className="panel" style={{border: `1px solid ${power.ok ? 'rgba(0,232,122,0.25)' : 'rgba(255,61,90,0.35)'}`}}>
        <div className="ptitle" style={{color: power.ok ? '#00e87a' : '#ff9944'}}>⚡ SYSTEM ENERGII</div>

        <div style={{
          background: power.ok ? 'rgba(0,232,122,0.06)' : 'rgba(255,61,90,0.08)',
          border: `1px solid ${power.ok ? 'rgba(0,232,122,0.18)' : 'rgba(255,61,90,0.25)'}`,
          borderRadius: 9,
          padding: 9,
          marginBottom: 10,
        }}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
            <span style={{fontSize:12,fontWeight:700,color:power.ok?'#00e87a':'#ff3d5a'}}>
              {power.ok ? '✅ Energia stabilna' : '🚨 Deficyt energii'}
            </span>
            <span style={{fontSize:12,fontFamily:"monospace",fontWeight:800,color:powerBalanceColor}}>
              {signedValue(power.balance)} j.
            </span>
          </div>

          <div style={{height:7,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden"}}>
            <div style={{
              width:`${Math.min(100, power.demand > 0 ? Math.round((power.supply / power.demand) * 100) : 100)}%`,
              height:"100%",
              background:power.ok
                ? "linear-gradient(90deg,#00e87a,#00ffcc)"
                : "linear-gradient(90deg,#ffd700,#ff3d5a)",
              transition:"width 0.3s ease",
            }}/>
          </div>
        </div>

        <div className="row"><span className="rl">Produkcja</span><span className="rv" style={{color:"#00e87a"}}>{fa(power.supply)} j.</span></div>
        <div className="row"><span className="rl">Zużycie</span><span className="rv" style={{color:"#ff9944"}}>{fa(power.demand)} j.</span></div>
        <div className="row"><span className="rl">Bilans</span><span className="rv" style={{color:powerBalanceColor}}>{signedValue(power.balance)} j.</span></div>
        <div className="row"><span className="rl">Nadwyżka</span><span className="rv" style={{color:power.surplus>0?'#00e87a':'#3a5f82'}}>{fa(power.surplus)} j.</span></div>
        <div className="row"><span className="rl">Deficyt</span><span className="rv" style={{color:power.deficit>0?'#ff3d5a':'#3a5f82'}}>{fa(power.deficit)} j.</span></div>
        <div className="row"><span className="rl">Wydajność budynków zależnych od prądu</span><span className="rv" style={{color:power.efficiency>=90?'#00e87a':power.efficiency>=60?'#ffd700':'#ff3d5a'}}>{power.efficiency || 100}%</span></div>
        <div className="row"><span className="rl">Skuteczność opłaty za prąd</span><span className="rv" style={{color:(power.feeEfficiency ?? 100)>=90?'#00e87a':(power.feeEfficiency ?? 100)>=60?'#ffd700':'#ff3d5a'}}>{power.feeEfficiency ?? 100}%</span></div>

        <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{background:"rgba(0,232,122,0.06)",border:"1px solid rgba(0,232,122,0.18)",borderRadius:9,padding:8}}>
            <div style={{fontSize:9,color:"#00e87a",fontWeight:800,marginBottom:4}}>TOP PRODUCENT</div>
            {topProducer ? (
              <>
                <div style={{fontSize:12,fontWeight:700,color:"#c8dff5",marginBottom:2}}>{topProducer.icon} {topProducer.name}</div>
                <div style={{fontSize:11,fontFamily:"monospace",color:"#00e87a"}}>+{fa(topProducer.value)} j.</div>
              </>
            ) : (
              <div style={{fontSize:11,color:"#3a5f82"}}>Brak produkcji</div>
            )}
          </div>

          <div style={{background:"rgba(255,153,68,0.06)",border:"1px solid rgba(255,153,68,0.18)",borderRadius:9,padding:8}}>
            <div style={{fontSize:9,color:"#ff9944",fontWeight:800,marginBottom:4}}>TOP KONSUMENT</div>
            {topConsumer ? (
              <>
                <div style={{fontSize:12,fontWeight:700,color:"#c8dff5",marginBottom:2}}>{topConsumer.icon} {topConsumer.name}</div>
                <div style={{fontSize:11,fontFamily:"monospace",color:"#ff9944"}}>-{fa(topConsumer.value)} j.</div>
              </>
            ) : (
              <div style={{fontSize:11,color:"#3a5f82"}}>Brak zużycia</div>
            )}
          </div>
        </div>

        {!power.ok && (
          <div style={{
            marginTop:10,
            fontSize:10,
            color:"#ff9944",
            lineHeight:1.45,
            background:"rgba(255,153,68,0.06)",
            border:"1px solid rgba(255,153,68,0.18)",
            borderRadius:8,
            padding:8,
          }}>
            ⚠️ Brak energii obniża dochody budynków zależnych od prądu i zmniejsza realny dochód z opłaty za prąd.
          </div>
        )}
      </div>

      {/* PODATKI */}
      <div className="panel">
        <div className="ptitle">💰 PODATKI</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
          <span style={{fontSize:12,flex:1}}>Stawka</span>
          <input type="range" min={5} max={30} value={G.taxRate}
            onChange={e => onTax(+e.target.value)} style={{flex:2,width:'auto'}}/>
          <span style={{fontFamily:"monospace",fontSize:14,color:"#ffd700",width:36,textAlign:"right"}}>{G.taxRate}%</span>
        </div>
        <div style={{fontSize:10,color:"#6a90b8"}}>
          {G.taxRate<10?'⚠️ Bardzo niskie':G.taxRate<15?'✅ Optymalne':G.taxRate<22?'⚡ Wysokie':'🚨 Krytyczne!'}
        </div>
      </div>

      {/* OPŁATY MIESZKAŃCÓW */}
      <div className="panel">
        <div className="ptitle">💸 OPŁATY MIESZKAŃCÓW</div>
        <div style={{fontSize:10,color:"#6a90b8",marginBottom:10}}>
          Generują dochód — zbyt wysokie, szczególnie przy deficytach, obniżają zadowolenie.
        </div>
        {[
          {id:"rent",    label:"🏠 Czynsz",             v:G.fees.rent,    inc:s.ri},
          {id:"water",   label:"💧 Opłata za wodę",     v:G.fees.water,   inc:s.wi},
          {id:"power",   label:"⚡ Opłata za prąd",     v:G.fees.power,   inc:s.pi},
          {id:"transit", label:"🚌 Opłata za transport",v:G.fees.transit||0,inc:s.ti},
          {id:"sewage",  label:"🏗️ Opłata oczyszczalnia",v:G.fees.sewage||0,inc:s.si},
        ].map(f => (
          <div key={f.id} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:11,color:"#6a90b8"}}>{f.label}</span>
              <span style={{fontSize:11,fontFamily:"monospace",color:f.v>5?'#ff9944':'#ffd700'}}>
                {f.v} zł/os. → +{fa(f.inc)} zł/m
              </span>
            </div>
            <input type="range" min={0} max={15} value={f.v}
              onChange={e => onFee(f.id, +e.target.value)}/>
          </div>
        ))}
        <div style={{fontSize:10,color:"#00e87a",marginTop:4}}>
          Łącznie z opłat: +{fa(s.feeInc)} zł/mie
        </div>
      </div>

      {/* POLITYKI */}
      <div className="panel">
        <div className="ptitle">📋 POLITYKI</div>
        {POLICIES.map(p => (
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid rgba(0,180,255,0.06)"}}>
            <span style={{fontSize:18}}>{p.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600}}>{p.name}</div>
              <div style={{fontSize:10,color:"#6a90b8"}}>{p.desc} · <span style={{color:"#ff9944"}}>-{p.cost} zł/m</span></div>
            </div>
            <div className="tog" style={{background:G.policies[p.id]?'#00b4ff':'rgba(255,255,255,0.1)'}}
              onClick={() => onPolicy(p.id)}>
              <div className="tog-k" style={{left:G.policies[p.id]?'21px':'2px'}}/>
            </div>
          </div>
        ))}
      </div>

      {/* KONTROLA SKARBOWA */}
      <div className="panel">
        <div className="ptitle">🔍 KONTROLA SKARBOWA</div>
        <div style={{fontSize:11,color:"#6a90b8",marginBottom:8}}>
          {G.auditCD > 0
            ? `Następna kontrola za ${G.auditCD} mies.`
            : 'Wykryj firmy unikające podatków — szansa na karę finansową.'}
        </div>
        <button onPointerDown={(e) => { e.stopPropagation(); if(G.auditCD <= 0) onOpenAudit(); }}
          disabled={G.auditCD > 0}
          style={{width:"100%",padding:8,border:"1px solid rgba(255,180,0,0.4)",borderRadius:8,background:"rgba(255,180,0,0.06)",color:G.auditCD>0?'#3a5f82':'#ffb400',fontSize:12,fontWeight:700}}>
          🔍 Przeprowadź kontrolę (-500 zł)
        </button>
      </div>

      {/* BANK */}
      <div className="panel">
        <div className="ptitle">🏦 BANK MIEJSKI</div>
        {G.loan ? (
          <>
            <div style={{fontSize:11,color:"#ffd700",marginBottom:3}}>
              Pożyczka: {fa(G.loan.amt)} zł · Rata: -{fa(Math.floor(G.loan.amt*G.loan.rate/12))} zł/m
            </div>
            <div style={{fontSize:11,color:"#6a90b8",marginBottom:6}}>Pozostało: {G.loan.months} mies.</div>
            <div style={{height:4,background:"rgba(255,255,255,0.08)",borderRadius:4,overflow:"hidden"}}>
              <div style={{width:`${(1-G.loan.months/24)*100}%`,height:"100%",background:"linear-gradient(90deg,#ffd700,#ff9944)"}}/>
            </div>
          </>
        ) : (
          <>
            <div style={{fontSize:11,color:"#6a90b8",marginBottom:8}}>Zaciągnij pożyczkę na inwestycje (8%/rok, 24 mies.)</div>
            <div style={{display:"flex",gap:6}}>
              {[5000,10000,25000,50000].map(amt => (
                <button key={amt} onPointerDown={(e) => { e.stopPropagation(); onOpenLoan(amt); }}
                  style={{flex:1,padding:"6px 0",border:"1px solid rgba(255,215,0,0.3)",borderRadius:7,background:"rgba(255,215,0,0.06)",color:"#ffd700",fontSize:10,fontFamily:"monospace"}}>
                  {fa(amt)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* OSTATNIE WYDARZENIA */}
      {G.events.length > 0 && (
        <div className="panel">
          <div className="ptitle">📰 OSTATNIE WYDARZENIA</div>
          {G.events.map(e => (
            <div key={e.id} style={{display:"flex",gap:8,padding:"4px 0",borderBottom:"1px solid rgba(0,180,255,0.05)",fontSize:11}}>
              <span style={{color:e.tp==='ok'?'#00e87a':'#ff3d5a'}}>{e.tp==='ok'?'✅':'❌'}</span>
              <span style={{color:"#6a90b8",flex:1}}>{e.t}</span>
              <span style={{color:"#3a5f82",fontSize:9,fontFamily:"monospace"}}>{MS[e.mo-1]} R{e.yr}</span>
            </div>
          ))}
        </div>
      )}

      {/* RESET GRY — tymczasowy, do usunięcia przed release */}
      <div className="panel" style={{border:"1px solid rgba(255,61,90,0.3)",background:"rgba(255,61,90,0.04)"}}>
        <div className="ptitle" style={{color:"#ff3d5a"}}>⚠️ RESET GRY (tymczasowe)</div>
        <div style={{fontSize:11,color:"#6a90b8",marginBottom:8}}>
          Usuwa wszystkie postępy i zaczyna grę od nowa z samouczkiem.
        </div>
        <button onPointerDown={(e) => { e.stopPropagation(); onReset(); }}
          style={{width:"100%",padding:8,border:"1px solid rgba(255,61,90,0.4)",borderRadius:8,background:"rgba(255,61,90,0.1)",color:"#ff3d5a",fontSize:12,fontWeight:700}}>
          🗑️ Resetuj grę
        </button>
      </div>
    </div>
  );
}