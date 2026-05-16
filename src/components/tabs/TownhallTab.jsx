import React from 'react';
import { POLICIES, MS, GS } from '../../data.js';
import { fa, fm } from '../../gameLogic.js';

function getPowerData(s) {
  return s.power || {
    demand: Math.max(0, s.pw || 0),
    connectedDemand: Math.max(0, s.pw || 0),
    disconnectedDemand: 0,
    totalDemand: Math.max(0, s.pw || 0),
    supply: Math.max(0, -(s.pw || 0)),
    balance: -(s.pw || 0),
    gridDeficit: Math.max(0, s.pw || 0),
    deficit: Math.max(0, s.pw || 0),
    surplus: Math.max(0, -(s.pw || 0)),
    ok: s.pwOk,
    efficiency: s.pwOk ? 100 : 35,
    feeEfficiency: s.pwOk ? 100 : 0,
    networkCoverage: 100,
    supplyCoverage: s.pwOk ? 100 : 0,
    serviceEfficiency: s.pwOk ? 100 : 35,
    powerLineRange: 3,
    powerLineCount: 0,
    activePowerLineCount: 0,
    inactivePowerLineCount: 0,
    disconnectedCount: 0,
    consumers: [],
    producers: [],
    nodes: [],
    disconnectedConsumers: [],
  };
}

function getWaterData(s) {
  return s.water || {
    demand: Math.max(0, s.wt || 0),
    connectedDemand: Math.max(0, s.wt || 0),
    disconnectedDemand: 0,
    totalDemand: Math.max(0, s.wt || 0),
    supply: Math.max(0, -(s.wt || 0)),
    balance: -(s.wt || 0),
    gridDeficit: Math.max(0, s.wt || 0),
    deficit: Math.max(0, s.wt || 0),
    surplus: Math.max(0, -(s.wt || 0)),
    ok: s.wtOk,
    efficiency: s.wtOk ? 100 : 35,
    feeEfficiency: s.wtOk ? 100 : 0,
    networkCoverage: 100,
    supplyCoverage: s.wtOk ? 100 : 0,
    serviceEfficiency: s.wtOk ? 100 : 35,
    waterPipeRange: 3,
    waterPipeCount: 0,
    activeWaterPipeCount: 0,
    inactiveWaterPipeCount: 0,
    disconnectedCount: 0,
    consumers: [],
    producers: [],
    nodes: [],
    disconnectedConsumers: [],
  };
}

function getSewageData(s) {
  return s.sewage || {
    load: Math.max(0, s.sw || 0),
    connectedLoad: Math.max(0, s.sw || 0),
    disconnectedLoad: 0,
    totalLoad: Math.max(0, s.sw || 0),
    treatmentCapacity: 0,
    balance: -(s.sw || 0),
    treatmentDeficit: Math.max(0, s.sw || 0),
    deficit: Math.max(0, s.sw || 0),
    surplus: 0,
    ok: s.swOk ?? true,
    efficiency: s.swOk ? 100 : 35,
    feeEfficiency: s.swOk ? 100 : 0,
    networkCoverage: 100,
    treatmentCoverage: s.swOk ? 100 : 0,
    serviceEfficiency: s.swOk ? 100 : 35,
    sewagePipeRange: 3,
    sewagePipeCount: 0,
    activeSewagePipeCount: 0,
    inactiveSewagePipeCount: 0,
    disconnectedCount: 0,
    consumers: [],
    treatmentPlants: [],
    nodes: [],
    disconnectedConsumers: [],
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

function percentColor(value) {
  if (value >= 90) return '#00e87a';
  if (value >= 60) return '#ffd700';
  return '#ff3d5a';
}

export default function TownhallTab({ G, onOpenLoan, onOpenAudit, onPolicy, onFee, onTax, onReset }) {
  const s = G.stats;
  if(!s) return null;

  const pc = (G.policies.green?500:0)+(G.policies.work?800:0)+(G.policies.night?300:0)+(G.policies.trans?600:0);

  const power = getPowerData(s);
  const water = getWaterData(s);
  const sewage = getSewageData(s);

  const topProducer = topByValue(power.producers);
  const topConsumer = topByValue(power.consumers);

  const waterTopProducer = topByValue(water.producers);
  const waterTopConsumer = topByValue(water.consumers);

  const sewageTopPlant = topByValue(sewage.treatmentPlants);
  const sewageTopConsumer = topByValue(sewage.consumers);

  const powerBalanceColor = power.ok ? '#00e87a' : '#ff3d5a';
  const waterBalanceColor = water.ok ? '#00b4ff' : '#ff3d5a';
  const sewageBalanceColor = sewage.ok ? '#00e87a' : '#ff3d5a';

  const hasUrgentProblems =
    !s.pwOk ||
    !s.wtOk ||
    s.swOk === false ||
    power.disconnectedCount > 0 ||
    water.disconnectedCount > 0 ||
    sewage.disconnectedCount > 0 ||
    s.er < 50;

  return (
    <div className="inner">
      <div className="tab-title" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        🏛️ Ratusz
        <span style={{fontSize:10,color:"#3a5f82",fontFamily:"monospace"}}>Lv{G.thLv}·{GS(G.thLv)}×{GS(G.thLv)}·🗳️{G.elTmr}m</span>
      </div>

      {hasUrgentProblems && (
        <div style={{background:"rgba(255,61,90,0.08)",border:"1px solid rgba(255,61,90,0.3)",borderRadius:10,padding:10,marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:"#ff3d5a",marginBottom:6}}>🚨 PILNE PROBLEMY</div>

          {!s.pwOk && <div style={{fontSize:11,color:"#ff9944",marginBottom:3}}>⚡ Problem energii {fa(power.deficit)} j. — zbuduj źródło prądu albo przeciągnij linie.</div>}
          {power.disconnectedCount > 0 && <div style={{fontSize:11,color:"#ffd700",marginBottom:3}}>🔌 {power.disconnectedCount} bud. poza siecią prądu — dociągnij linię energetyczną.</div>}
          {power.inactivePowerLineCount > 0 && <div style={{fontSize:11,color:"#ff7d7d",marginBottom:3}}>✖ {power.inactivePowerLineCount} kaf. linii prądu nie jest połączonych ze źródłem.</div>}

          {!s.wtOk && <div style={{fontSize:11,color:"#60b4ff",marginBottom:3}}>💧 Problem wody {fa(water.deficit)} j. — zbuduj wodociągi albo przeciągnij rury.</div>}
          {water.disconnectedCount > 0 && <div style={{fontSize:11,color:"#60b4ff",marginBottom:3}}>🚱 {water.disconnectedCount} bud. bez wody — połącz dzielnicę z wodociągami.</div>}
          {water.inactiveWaterPipeCount > 0 && <div style={{fontSize:11,color:"#ff7d7d",marginBottom:3}}>✖ {water.inactiveWaterPipeCount} kaf. rur nie daje czystej wody.</div>}

          {s.swOk === false && <div style={{fontSize:11,color:"#c77dff",marginBottom:3}}>🏗️ Problem ścieków {fa(sewage.deficit)} j. — zbuduj oczyszczalnię albo połącz rury.</div>}
          {sewage.disconnectedCount > 0 && <div style={{fontSize:11,color:"#c77dff",marginBottom:3}}>🧪 {sewage.disconnectedCount} bud. bez kanalizacji — połącz dzielnicę z oczyszczalnią.</div>}

          {s.er<50 && <div style={{fontSize:11,color:"#ffd700"}}>💼 Zatrudnienie {s.er}% — za mało mieszkańców!</div>}
        </div>
      )}

      <div className="panel">
        <div className="ptitle">📊 BILANS MIESIĘCZNY</div>
        <div className="row"><span className="rl">Przychód z budynków</span><span className="rv" style={{color:"#00e87a"}}>+{fa(s.inc - s.feeInc)} zł</span></div>
        <div className="row"><span className="rl">Opłaty od mieszkańców</span><span className="rv" style={{color:"#00e87a"}}>+{fa(s.feeInc)} zł</span></div>
        <div className="row"><span className="rl">Koszty budynków</span><span className="rv" style={{color:"#ff3d5a"}}>-{fa(s.exp)} zł</span></div>
        <div className="row"><span className="rl">Koszty polityk</span><span className="rv" style={{color:"#ff9944"}}>-{fa(pc)} zł</span></div>
        <div className="row"><span className="rl">Rata pożyczki</span><span className="rv" style={{color:G.loan?'#ff3d5a':'#3a5f82'}}>{G.loan?`-${fa(Math.floor(G.loan.amt*G.loan.rate/12))} zł`:'brak'}</span></div>
        <div className="row"><span className="rl">Bilans netto</span><span className="rv" style={{color:s.net>=0?'#00e87a':'#ff3d5a'}}>{fm(s.net)} zł</span></div>
      </div>

      <div className="panel">
        <div className="ptitle">🏙️ MIASTO</div>
        <div className="row"><span className="rl">Populacja</span><span className="rv" style={{color:"#00b4ff"}}>{fa(s.pop)} os.</span></div>
        <div className="row"><span className="rl">Siła robocza</span><span className="rv" style={{color:"#a259ff"}}>{fa(s.workers)} os.</span></div>
        <div className="row"><span className="rl">Miejsca pracy</span><span className="rv" style={{color:"#ffd700"}}>{fa(s.jobs)}</span></div>
        <div className="row"><span className="rl">Zatrudnienie</span><span className="rv" style={{color:s.er>70?'#00e87a':s.er>40?'#ffd700':'#ff3d5a'}}>{s.er}%</span></div>
        <div className="row"><span className="rl">Energia</span><span className="rv" style={{color:powerBalanceColor}}>{power.ok?'OK':'PROBLEM'}</span></div>
        <div className="row"><span className="rl">Woda</span><span className="rv" style={{color:waterBalanceColor}}>{water.ok?'OK':'PROBLEM'}</span></div>
        <div className="row"><span className="rl">Kanalizacja</span><span className="rv" style={{color:sewageBalanceColor}}>{sewage.ok?'OK':'PROBLEM'}</span></div>
        <div className="row"><span className="rl">Emisja CO₂</span><span className="rv" style={{color:s.co2<0?'#00e87a':s.co2<30?'#ffd700':'#ff3d5a'}}>{s.co2>0?'+':''}{s.co2}</span></div>
        <div className="row"><span className="rl">Pogoda</span><span className="rv">{G.weather?.icon} {G.weather?.name}</span></div>
      </div>

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
              {power.ok ? '✅ Energia stabilna' : '🚨 Problem z energią'}
            </span>
            <span style={{fontSize:12,fontFamily:"monospace",fontWeight:800,color:powerBalanceColor}}>
              {signedValue(power.balance)} j.
            </span>
          </div>

          <div style={{height:7,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden"}}>
            <div style={{
              width:`${Math.min(100, power.serviceEfficiency ?? 100)}%`,
              height:"100%",
              background:power.ok
                ? "linear-gradient(90deg,#00e87a,#00ffcc)"
                : "linear-gradient(90deg,#ffd700,#ff3d5a)",
              transition:"width 0.3s ease",
            }}/>
          </div>
        </div>

        <div className="row"><span className="rl">Produkcja</span><span className="rv" style={{color:"#00e87a"}}>{fa(power.supply)} j.</span></div>
        <div className="row"><span className="rl">Zużycie podłączone</span><span className="rv" style={{color:"#ff9944"}}>{fa(power.connectedDemand)} j.</span></div>
        <div className="row"><span className="rl">Zużycie poza siecią</span><span className="rv" style={{color:power.disconnectedDemand>0?'#ff3d5a':'#3a5f82'}}>{fa(power.disconnectedDemand)} j.</span></div>
        <div className="row"><span className="rl">Zapotrzebowanie łączne</span><span className="rv" style={{color:"#ffd700"}}>{fa(power.totalDemand)} j.</span></div>
        <div className="row"><span className="rl">Bilans sieci</span><span className="rv" style={{color:powerBalanceColor}}>{signedValue(power.balance)} j.</span></div>
        <div className="row"><span className="rl">Deficyt produkcji</span><span className="rv" style={{color:power.gridDeficit>0?'#ff3d5a':'#3a5f82'}}>{fa(power.gridDeficit)} j.</span></div>
        <div className="row"><span className="rl">Deficyt całkowity</span><span className="rv" style={{color:power.deficit>0?'#ff3d5a':'#3a5f82'}}>{fa(power.deficit)} j.</span></div>
        <div className="row"><span className="rl">Nadwyżka</span><span className="rv" style={{color:power.surplus>0?'#00e87a':'#3a5f82'}}>{fa(power.surplus)} j.</span></div>

        <div className="row"><span className="rl">Zasięg sieci</span><span className="rv" style={{color:percentColor(power.networkCoverage ?? 100)}}>{power.networkCoverage ?? 100}%</span></div>
        <div className="row"><span className="rl">Pokrycie produkcji</span><span className="rv" style={{color:percentColor(power.supplyCoverage ?? 100)}}>{power.supplyCoverage ?? 100}%</span></div>
        <div className="row"><span className="rl">Wydajność systemu</span><span className="rv" style={{color:percentColor(power.serviceEfficiency ?? 100)}}>{power.serviceEfficiency ?? 100}%</span></div>

        <div className="row"><span className="rl">Linie łącznie</span><span className="rv" style={{color:"#00b4ff"}}>{power.powerLineCount || 0}</span></div>
        <div className="row"><span className="rl">Linie aktywne</span><span className="rv" style={{color:(power.activePowerLineCount || 0)>0?'#00e87a':'#3a5f82'}}>{power.activePowerLineCount || 0}</span></div>
        <div className="row"><span className="rl">Linie nieaktywne</span><span className="rv" style={{color:(power.inactivePowerLineCount || 0)>0?'#ff3d5a':'#3a5f82'}}>{power.inactivePowerLineCount || 0}</span></div>
        <div className="row"><span className="rl">Zasięg jednej linii</span><span className="rv" style={{color:"#ffd700"}}>{power.powerLineRange || 3} kratki</span></div>

        <div className="row"><span className="rl">Budynki poza siecią</span><span className="rv" style={{color:power.disconnectedCount>0?'#ff3d5a':'#00e87a'}}>{power.disconnectedCount || 0}</span></div>
        <div className="row"><span className="rl">Źródła energii</span><span className="rv" style={{color:"#00b4ff"}}>{power.nodes?.length || 0}</span></div>
        <div className="row"><span className="rl">Skuteczność opłaty za prąd</span><span className="rv" style={{color:percentColor(power.feeEfficiency ?? 100)}}>{power.feeEfficiency ?? 100}%</span></div>

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

        {power.disconnectedConsumers?.length > 0 && (
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
            🔌 Poza siecią: {power.disconnectedConsumers.slice(0,4).map(b => `${b.icon} ${b.name}`).join(', ')}
            {power.disconnectedConsumers.length > 4 ? ` +${power.disconnectedConsumers.length - 4} więcej` : ''}.
            Przeciągnij aktywną linię energetyczną bliżej tych budynków.
          </div>
        )}

        {power.inactivePowerLineCount > 0 && (
          <div style={{
            marginTop:10,
            fontSize:10,
            color:"#ff7d7d",
            lineHeight:1.45,
            background:"rgba(255,61,90,0.06)",
            border:"1px solid rgba(255,61,90,0.18)",
            borderRadius:8,
            padding:8,
          }}>
            ✖ Część linii jest martwa, bo nie ma ciągłego połączenia ze źródłem energii.
          </div>
        )}
      </div>

      <div className="panel" style={{border: `1px solid ${water.ok ? 'rgba(0,160,255,0.28)' : 'rgba(255,61,90,0.35)'}`}}>
        <div className="ptitle" style={{color: water.ok ? '#60b4ff' : '#ff9944'}}>💧 SYSTEM WODY</div>

        <div style={{
          background: water.ok ? 'rgba(0,160,255,0.06)' : 'rgba(255,61,90,0.08)',
          border: `1px solid ${water.ok ? 'rgba(0,160,255,0.18)' : 'rgba(255,61,90,0.25)'}`,
          borderRadius: 9,
          padding: 9,
          marginBottom: 10,
        }}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
            <span style={{fontSize:12,fontWeight:700,color:water.ok?'#60b4ff':'#ff3d5a'}}>
              {water.ok ? '✅ Woda stabilna' : '🚨 Problem z wodą'}
            </span>
            <span style={{fontSize:12,fontFamily:"monospace",fontWeight:800,color:waterBalanceColor}}>
              {signedValue(water.balance)} j.
            </span>
          </div>

          <div style={{height:7,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden"}}>
            <div style={{
              width:`${Math.min(100, water.serviceEfficiency ?? 100)}%`,
              height:"100%",
              background:water.ok
                ? "linear-gradient(90deg,#00b4ff,#60dfff)"
                : "linear-gradient(90deg,#60b4ff,#ff3d5a)",
              transition:"width 0.3s ease",
            }}/>
          </div>
        </div>

        <div className="row"><span className="rl">Produkcja wody</span><span className="rv" style={{color:"#60b4ff"}}>{fa(water.supply)} j.</span></div>
        <div className="row"><span className="rl">Zużycie podłączone</span><span className="rv" style={{color:"#ff9944"}}>{fa(water.connectedDemand)} j.</span></div>
        <div className="row"><span className="rl">Zużycie poza siecią</span><span className="rv" style={{color:water.disconnectedDemand>0?'#ff3d5a':'#3a5f82'}}>{fa(water.disconnectedDemand)} j.</span></div>
        <div className="row"><span className="rl">Zapotrzebowanie łączne</span><span className="rv" style={{color:"#ffd700"}}>{fa(water.totalDemand)} j.</span></div>
        <div className="row"><span className="rl">Bilans wody</span><span className="rv" style={{color:waterBalanceColor}}>{signedValue(water.balance)} j.</span></div>
        <div className="row"><span className="rl">Deficyt produkcji</span><span className="rv" style={{color:water.gridDeficit>0?'#ff3d5a':'#3a5f82'}}>{fa(water.gridDeficit)} j.</span></div>
        <div className="row"><span className="rl">Deficyt całkowity</span><span className="rv" style={{color:water.deficit>0?'#ff3d5a':'#3a5f82'}}>{fa(water.deficit)} j.</span></div>
        <div className="row"><span className="rl">Nadwyżka</span><span className="rv" style={{color:water.surplus>0?'#60b4ff':'#3a5f82'}}>{fa(water.surplus)} j.</span></div>

        <div className="row"><span className="rl">Zasięg sieci wodnej</span><span className="rv" style={{color:percentColor(water.networkCoverage ?? 100)}}>{water.networkCoverage ?? 100}%</span></div>
        <div className="row"><span className="rl">Pokrycie produkcji</span><span className="rv" style={{color:percentColor(water.supplyCoverage ?? 100)}}>{water.supplyCoverage ?? 100}%</span></div>
        <div className="row"><span className="rl">Wydajność systemu</span><span className="rv" style={{color:percentColor(water.serviceEfficiency ?? 100)}}>{water.serviceEfficiency ?? 100}%</span></div>

        <div className="row"><span className="rl">Rury łącznie</span><span className="rv" style={{color:"#00b4ff"}}>{water.waterPipeCount || 0}</span></div>
        <div className="row"><span className="rl">Rury wodne aktywne</span><span className="rv" style={{color:(water.activeWaterPipeCount || 0)>0?'#60b4ff':'#3a5f82'}}>{water.activeWaterPipeCount || 0}</span></div>
        <div className="row"><span className="rl">Rury bez wodociągów</span><span className="rv" style={{color:(water.inactiveWaterPipeCount || 0)>0?'#ff3d5a':'#3a5f82'}}>{water.inactiveWaterPipeCount || 0}</span></div>
        <div className="row"><span className="rl">Zasięg jednej rury</span><span className="rv" style={{color:"#60b4ff"}}>{water.waterPipeRange || 3} kratki</span></div>

        <div className="row"><span className="rl">Budynki bez wody</span><span className="rv" style={{color:water.disconnectedCount>0?'#ff3d5a':'#00e87a'}}>{water.disconnectedCount || 0}</span></div>
        <div className="row"><span className="rl">Wodociągi</span><span className="rv" style={{color:"#00b4ff"}}>{water.nodes?.length || 0}</span></div>
        <div className="row"><span className="rl">Skuteczność opłaty za wodę</span><span className="rv" style={{color:percentColor(water.feeEfficiency ?? 100)}}>{water.feeEfficiency ?? 100}%</span></div>

        <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{background:"rgba(0,160,255,0.06)",border:"1px solid rgba(0,160,255,0.18)",borderRadius:9,padding:8}}>
            <div style={{fontSize:9,color:"#60b4ff",fontWeight:800,marginBottom:4}}>TOP ŹRÓDŁO</div>
            {waterTopProducer ? (
              <>
                <div style={{fontSize:12,fontWeight:700,color:"#c8dff5",marginBottom:2}}>{waterTopProducer.icon} {waterTopProducer.name}</div>
                <div style={{fontSize:11,fontFamily:"monospace",color:"#60b4ff"}}>+{fa(waterTopProducer.value)} j.</div>
              </>
            ) : (
              <div style={{fontSize:11,color:"#3a5f82"}}>Brak wodociągów</div>
            )}
          </div>

          <div style={{background:"rgba(255,153,68,0.06)",border:"1px solid rgba(255,153,68,0.18)",borderRadius:9,padding:8}}>
            <div style={{fontSize:9,color:"#ff9944",fontWeight:800,marginBottom:4}}>TOP ZUŻYCIE</div>
            {waterTopConsumer ? (
              <>
                <div style={{fontSize:12,fontWeight:700,color:"#c8dff5",marginBottom:2}}>{waterTopConsumer.icon} {waterTopConsumer.name}</div>
                <div style={{fontSize:11,fontFamily:"monospace",color:"#ff9944"}}>-{fa(waterTopConsumer.value)} j.</div>
              </>
            ) : (
              <div style={{fontSize:11,color:"#3a5f82"}}>Brak zużycia</div>
            )}
          </div>
        </div>

        {water.disconnectedConsumers?.length > 0 && (
          <div style={{
            marginTop:10,
            fontSize:10,
            color:"#60b4ff",
            lineHeight:1.45,
            background:"rgba(0,160,255,0.06)",
            border:"1px solid rgba(0,160,255,0.18)",
            borderRadius:8,
            padding:8,
          }}>
            🚱 Bez wody: {water.disconnectedConsumers.slice(0,4).map(b => `${b.icon} ${b.name}`).join(', ')}
            {water.disconnectedConsumers.length > 4 ? ` +${water.disconnectedConsumers.length - 4} więcej` : ''}.
            Połącz aktywne rury z wodociągami i dociągnij je bliżej budynków.
          </div>
        )}

        {water.inactiveWaterPipeCount > 0 && (
          <div style={{
            marginTop:10,
            fontSize:10,
            color:"#ff7d7d",
            lineHeight:1.45,
            background:"rgba(255,61,90,0.06)",
            border:"1px solid rgba(255,61,90,0.18)",
            borderRadius:8,
            padding:8,
          }}>
            ✖ Część rur nie daje czystej wody, bo nie ma połączenia z wodociągami.
          </div>
        )}
      </div>

      <div className="panel" style={{border: `1px solid ${sewage.ok ? 'rgba(199,125,255,0.28)' : 'rgba(255,61,90,0.35)'}`}}>
        <div className="ptitle" style={{color: sewage.ok ? '#c77dff' : '#ff9944'}}>🏗️ SYSTEM KANALIZACJI</div>

        <div style={{
          background: sewage.ok ? 'rgba(199,125,255,0.06)' : 'rgba(255,61,90,0.08)',
          border: `1px solid ${sewage.ok ? 'rgba(199,125,255,0.18)' : 'rgba(255,61,90,0.25)'}`,
          borderRadius: 9,
          padding: 9,
          marginBottom: 10,
        }}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
            <span style={{fontSize:12,fontWeight:700,color:sewage.ok?'#c77dff':'#ff3d5a'}}>
              {sewage.ok ? '✅ Kanalizacja stabilna' : '🚨 Problem ze ściekami'}
            </span>
            <span style={{fontSize:12,fontFamily:"monospace",fontWeight:800,color:sewageBalanceColor}}>
              {signedValue(sewage.balance)} j.
            </span>
          </div>

          <div style={{height:7,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden"}}>
            <div style={{
              width:`${Math.min(100, sewage.serviceEfficiency ?? 100)}%`,
              height:"100%",
              background:sewage.ok
                ? "linear-gradient(90deg,#a259ff,#c77dff)"
                : "linear-gradient(90deg,#c77dff,#ff3d5a)",
              transition:"width 0.3s ease",
            }}/>
          </div>
        </div>

        <div className="row"><span className="rl">Oczyszczanie</span><span className="rv" style={{color:"#c77dff"}}>{fa(sewage.treatmentCapacity)} j.</span></div>
        <div className="row"><span className="rl">Ścieki podłączone</span><span className="rv" style={{color:"#ff9944"}}>{fa(sewage.connectedLoad)} j.</span></div>
        <div className="row"><span className="rl">Ścieki poza siecią</span><span className="rv" style={{color:sewage.disconnectedLoad>0?'#ff3d5a':'#3a5f82'}}>{fa(sewage.disconnectedLoad)} j.</span></div>
        <div className="row"><span className="rl">Ścieki łącznie</span><span className="rv" style={{color:"#ffd700"}}>{fa(sewage.totalLoad)} j.</span></div>
        <div className="row"><span className="rl">Bilans kanalizacji</span><span className="rv" style={{color:sewageBalanceColor}}>{signedValue(sewage.balance)} j.</span></div>
        <div className="row"><span className="rl">Deficyt oczyszczania</span><span className="rv" style={{color:sewage.treatmentDeficit>0?'#ff3d5a':'#3a5f82'}}>{fa(sewage.treatmentDeficit)} j.</span></div>
        <div className="row"><span className="rl">Deficyt całkowity</span><span className="rv" style={{color:sewage.deficit>0?'#ff3d5a':'#3a5f82'}}>{fa(sewage.deficit)} j.</span></div>
        <div className="row"><span className="rl">Rezerwa oczyszczalni</span><span className="rv" style={{color:sewage.surplus>0?'#c77dff':'#3a5f82'}}>{fa(sewage.surplus)} j.</span></div>

        <div className="row"><span className="rl">Zasięg kanalizacji</span><span className="rv" style={{color:percentColor(sewage.networkCoverage ?? 100)}}>{sewage.networkCoverage ?? 100}%</span></div>
        <div className="row"><span className="rl">Pokrycie oczyszczania</span><span className="rv" style={{color:percentColor(sewage.treatmentCoverage ?? 100)}}>{sewage.treatmentCoverage ?? 100}%</span></div>
        <div className="row"><span className="rl">Wydajność kanalizacji</span><span className="rv" style={{color:percentColor(sewage.serviceEfficiency ?? 100)}}>{sewage.serviceEfficiency ?? 100}%</span></div>

        <div className="row"><span className="rl">Rury łącznie</span><span className="rv" style={{color:"#00b4ff"}}>{sewage.sewagePipeCount || 0}</span></div>
        <div className="row"><span className="rl">Rury kanalizacji aktywne</span><span className="rv" style={{color:(sewage.activeSewagePipeCount || 0)>0?'#c77dff':'#3a5f82'}}>{sewage.activeSewagePipeCount || 0}</span></div>
        <div className="row"><span className="rl">Rury bez oczyszczalni</span><span className="rv" style={{color:(sewage.inactiveSewagePipeCount || 0)>0?'#ff3d5a':'#3a5f82'}}>{sewage.inactiveSewagePipeCount || 0}</span></div>
        <div className="row"><span className="rl">Zasięg jednej rury</span><span className="rv" style={{color:"#c77dff"}}>{sewage.sewagePipeRange || 3} kratki</span></div>

        <div className="row"><span className="rl">Budynki bez kanalizacji</span><span className="rv" style={{color:sewage.disconnectedCount>0?'#ff3d5a':'#00e87a'}}>{sewage.disconnectedCount || 0}</span></div>
        <div className="row"><span className="rl">Oczyszczalnie</span><span className="rv" style={{color:"#c77dff"}}>{sewage.nodes?.length || 0}</span></div>
        <div className="row"><span className="rl">Skuteczność opłaty za ścieki</span><span className="rv" style={{color:percentColor(sewage.feeEfficiency ?? 100)}}>{sewage.feeEfficiency ?? 100}%</span></div>

        <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{background:"rgba(199,125,255,0.06)",border:"1px solid rgba(199,125,255,0.18)",borderRadius:9,padding:8}}>
            <div style={{fontSize:9,color:"#c77dff",fontWeight:800,marginBottom:4}}>TOP OCZYSZCZANIE</div>
            {sewageTopPlant ? (
              <>
                <div style={{fontSize:12,fontWeight:700,color:"#c8dff5",marginBottom:2}}>{sewageTopPlant.icon} {sewageTopPlant.name}</div>
                <div style={{fontSize:11,fontFamily:"monospace",color:"#c77dff"}}>+{fa(sewageTopPlant.value)} j.</div>
              </>
            ) : (
              <div style={{fontSize:11,color:"#3a5f82"}}>Brak oczyszczalni</div>
            )}
          </div>

          <div style={{background:"rgba(255,153,68,0.06)",border:"1px solid rgba(255,153,68,0.18)",borderRadius:9,padding:8}}>
            <div style={{fontSize:9,color:"#ff9944",fontWeight:800,marginBottom:4}}>TOP ŚCIEKI</div>
            {sewageTopConsumer ? (
              <>
                <div style={{fontSize:12,fontWeight:700,color:"#c8dff5",marginBottom:2}}>{sewageTopConsumer.icon} {sewageTopConsumer.name}</div>
                <div style={{fontSize:11,fontFamily:"monospace",color:"#ff9944"}}>-{fa(sewageTopConsumer.value)} j.</div>
              </>
            ) : (
              <div style={{fontSize:11,color:"#3a5f82"}}>Brak ścieków</div>
            )}
          </div>
        </div>

        {sewage.disconnectedConsumers?.length > 0 && (
          <div style={{
            marginTop:10,
            fontSize:10,
            color:"#c77dff",
            lineHeight:1.45,
            background:"rgba(199,125,255,0.06)",
            border:"1px solid rgba(199,125,255,0.18)",
            borderRadius:8,
            padding:8,
          }}>
            🧪 Bez kanalizacji: {sewage.disconnectedConsumers.slice(0,4).map(b => `${b.icon} ${b.name}`).join(', ')}
            {sewage.disconnectedConsumers.length > 4 ? ` +${sewage.disconnectedConsumers.length - 4} więcej` : ''}.
            Połącz rury z oczyszczalnią i dociągnij je bliżej budynków.
          </div>
        )}

        {sewage.inactiveSewagePipeCount > 0 && (
          <div style={{
            marginTop:10,
            fontSize:10,
            color:"#ff7d7d",
            lineHeight:1.45,
            background:"rgba(255,61,90,0.06)",
            border:"1px solid rgba(255,61,90,0.18)",
            borderRadius:8,
            padding:8,
          }}>
            ✖ Część rur nie obsługuje kanalizacji, bo nie ma połączenia z oczyszczalnią.
          </div>
        )}

        {!sewage.ok && (
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
            ⚠️ Problemy ze ściekami obniżają środowisko, zadowolenie mieszkańców i skuteczność opłaty za kanalizację.
          </div>
        )}
      </div>

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

      <div className="panel">
        <div className="ptitle">💸 OPŁATY MIESZKAŃCÓW</div>
        <div style={{fontSize:10,color:"#6a90b8",marginBottom:10}}>
          Generują dochód — zbyt wysokie, szczególnie przy deficytach, obniżają zadowolenie.
        </div>
        {[
          {id:"rent",    label:"🏠 Czynsz",              v:G.fees.rent,    inc:s.ri},
          {id:"water",   label:"💧 Opłata za wodę",      v:G.fees.water,   inc:s.wi},
          {id:"power",   label:"⚡ Opłata za prąd",      v:G.fees.power,   inc:s.pi},
          {id:"transit", label:"🚌 Opłata za transport", v:G.fees.transit||0,inc:s.ti},
          {id:"sewage",  label:"🏗️ Opłata za kanalizację",v:G.fees.sewage||0,inc:s.si},
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