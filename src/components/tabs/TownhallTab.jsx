import React from 'react';
import { POLICIES, GS } from '../../data.js';
import { fa, fm, getPolicyMonthlyCost } from '../../gameLogic.js';
import { SMOG_MONITORING_COST } from '../../game/environment/smogResearch.js';

function percentColor(value) {
  if (value >= 90) return '#00e87a';
  if (value >= 60) return '#ffd700';
  return '#ff3d5a';
}

function signedValue(value) {
  if (value > 0) return `+${fa(value)}`;
  if (value < 0) return `-${fa(value)}`;
  return '0';
}

function getPowerData(s) {
  return s.power || {
    ok: s.pwOk,
    supply: Math.max(0, -(s.pw || 0)),
    totalDemand: Math.max(0, s.pw || 0),
    balance: -(s.pw || 0),
    deficit: Math.max(0, s.pw || 0),
    surplus: Math.max(0, -(s.pw || 0)),
    serviceEfficiency: s.pwOk ? 100 : 35,
    networkCoverage: 100,
    disconnectedCount: 0,
    inactivePowerLineCount: 0,
    powerLineCount: 0,
    activePowerLineCount: 0,
    feeEfficiency: s.pwOk ? 100 : 0,
  };
}

function getWaterData(s) {
  return s.water || {
    ok: s.wtOk,
    supply: Math.max(0, -(s.wt || 0)),
    totalDemand: Math.max(0, s.wt || 0),
    balance: -(s.wt || 0),
    deficit: Math.max(0, s.wt || 0),
    surplus: Math.max(0, -(s.wt || 0)),
    serviceEfficiency: s.wtOk ? 100 : 35,
    networkCoverage: 100,
    disconnectedCount: 0,
    inactiveWaterPipeCount: 0,
    waterPipeCount: 0,
    activeWaterPipeCount: 0,
    feeEfficiency: s.wtOk ? 100 : 0,
  };
}

function getSewageData(s) {
  return s.sewage || {
    ok: s.swOk ?? true,
    treatmentCapacity: 0,
    totalLoad: Math.max(0, s.sw || 0),
    balance: -(s.sw || 0),
    deficit: Math.max(0, s.sw || 0),
    surplus: 0,
    serviceEfficiency: s.swOk ? 100 : 35,
    networkCoverage: 100,
    disconnectedCount: 0,
    inactiveSewagePipeCount: 0,
    sewagePipeCount: 0,
    activeSewagePipeCount: 0,
    feeEfficiency: s.swOk ? 100 : 0,
  };
}

function getEmissionData(s) {
  return s.emissions || {
    net: s.co2 || 0,
    airQuality: s.co2 <= 0 ? 100 : Math.max(0, 100 - s.co2),
    level: {
      icon: s.co2 <= 30 ? '✅' : s.co2 <= 70 ? '⚠️' : '🏭',
      label: s.co2 <= 30 ? 'Dobre' : s.co2 <= 70 ? 'Średnie' : 'Złe',
      color: s.co2 <= 30 ? '#00e87a' : s.co2 <= 70 ? '#ffd700' : '#ff3d5a',
    },
    gross: Math.max(0, s.co2 || 0),
    totalReduction: 0,
    greenCoverage: {
      coverage: 100,
      coveredCount: 0,
      targetCount: 0,
      sourceCount: 0,
    },
    topEmitter: null,
  };
}

function ResourcePanel({
  title,
  icon,
  ok,
  color,
  problemColor = '#ff3d5a',
  rows,
  efficiency,
  warning,
}) {
  const activeColor = ok ? color : problemColor;

  return (
    <div className="panel" style={{border:`1px solid ${activeColor}44`}}>
      <div className="ptitle" style={{color:activeColor}}>
        {icon} {title}
      </div>

      <div style={{
        background:`${activeColor}10`,
        border:`1px solid ${activeColor}30`,
        borderRadius:9,
        padding:9,
        marginBottom:10,
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:12,fontWeight:800,color:activeColor}}>
            {ok ? '✅ Stabilny' : '🚨 Problem'}
          </span>
          <span style={{fontSize:12,fontFamily:"monospace",fontWeight:900,color:activeColor}}>
            {efficiency}%
          </span>
        </div>

        <div style={{height:7,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden"}}>
          <div style={{
            width:`${Math.max(0, Math.min(100, efficiency))}%`,
            height:"100%",
            background:ok
              ? `linear-gradient(90deg,${color},#00ffcc)`
              : "linear-gradient(90deg,#ffd700,#ff3d5a)",
          }}/>
        </div>
      </div>

      {rows.map(row => (
        <div key={row.label} className="row">
          <span className="rl">{row.label}</span>
          <span className="rv" style={{color:row.color || '#c8dff5'}}>
            {row.value}
          </span>
        </div>
      ))}

      {warning && (
        <div style={{
          marginTop:10,
          fontSize:10,
          color:activeColor,
          lineHeight:1.45,
          background:`${activeColor}10`,
          border:`1px solid ${activeColor}30`,
          borderRadius:8,
          padding:8,
        }}>
          {warning}
        </div>
      )}
    </div>
  );
}

function SliderRow({ label, value, min = 0, max = 30, onChange, suffix = '%' }) {
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
        <span style={{fontSize:11,color:"#6a90b8"}}>{label}</span>
        <span style={{fontSize:12,fontFamily:"monospace",fontWeight:800,color:"#ffd700"}}>
          {value}{suffix}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{width:"100%"}}
      />
    </div>
  );
}

export default function TownhallTab({
  G,
  onOpenLoan,
  onOpenAudit,
  onPolicy,
  onFee,
  onTax,
  onReset,
  onBuySmogMonitoring,
}) {
  const s = G.stats;
  if(!s) return null;

  const power = getPowerData(s);
  const water = getWaterData(s);
  const sewage = getSewageData(s);
  const emissions = getEmissionData(s);

  const policyCost = getPolicyMonthlyCost(G.policies);
  const taxMultiplier = 0.8 + G.taxRate / 100;
  const estimatedMonthlyNet = Math.floor((s.net || 0) * taxMultiplier) - policyCost;
  const activePolicies = POLICIES.filter(policy => G.policies?.[policy.id]);

  const hasUrgentProblems =
    !power.ok ||
    !water.ok ||
    sewage.ok === false ||
    power.disconnectedCount > 0 ||
    water.disconnectedCount > 0 ||
    sewage.disconnectedCount > 0 ||
    s.er < 50 ||
    emissions.airQuality < 45;

  return (
    <div className="inner">
      <div className="tab-title" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        🏛️ Ratusz
        <span style={{fontSize:10,color:"#3a5f82",fontFamily:"monospace"}}>
          Lv{G.thLv} · {GS(G.thLv)}×{GS(G.thLv)} · 🗳️ {G.elTmr}m
        </span>
      </div>

      {hasUrgentProblems && (
        <div style={{
          background:"rgba(255,61,90,0.08)",
          border:"1px solid rgba(255,61,90,0.3)",
          borderRadius:10,
          padding:10,
          marginBottom:10,
        }}>
          <div style={{fontSize:11,fontWeight:800,color:"#ff3d5a",marginBottom:6}}>
            🚨 PILNE PROBLEMY
          </div>

          {!power.ok && (
            <div style={{fontSize:11,color:"#ff9944",marginBottom:3}}>
              ⚡ Problem energii: {fa(power.deficit)} j. — dobuduj źródło albo linie.
            </div>
          )}

          {power.disconnectedCount > 0 && (
            <div style={{fontSize:11,color:"#ffd700",marginBottom:3}}>
              🔌 {power.disconnectedCount} bud. poza siecią prądu.
            </div>
          )}

          {!water.ok && (
            <div style={{fontSize:11,color:"#60b4ff",marginBottom:3}}>
              💧 Problem wody: {fa(water.deficit)} j. — dobuduj wodociągi albo rury.
            </div>
          )}

          {water.disconnectedCount > 0 && (
            <div style={{fontSize:11,color:"#60b4ff",marginBottom:3}}>
              🚱 {water.disconnectedCount} bud. bez dostępu do wody.
            </div>
          )}

          {sewage.ok === false && (
            <div style={{fontSize:11,color:"#c77dff",marginBottom:3}}>
              🏗️ Problem kanalizacji: {fa(sewage.deficit)} j. — dobuduj oczyszczalnię albo połącz rury.
            </div>
          )}

          {sewage.disconnectedCount > 0 && (
            <div style={{fontSize:11,color:"#c77dff",marginBottom:3}}>
              🧪 {sewage.disconnectedCount} bud. bez kanalizacji.
            </div>
          )}

          {emissions.airQuality < 45 && (
            <div style={{fontSize:11,color:"#ff7d7d",marginBottom:3}}>
              ☠️ Krytyczne powietrze: {emissions.airQuality}% — filtry, parki, zielone dachy i polityki ekologiczne.
            </div>
          )}

          {s.er < 50 && (
            <div style={{fontSize:11,color:"#ffd700"}}>
              💼 Zatrudnienie {s.er}% — za mało mieszkańców względem miejsc pracy.
            </div>
          )}
        </div>
      )}

      <div className="panel">
        <div className="ptitle">📊 BILANS MIESIĘCZNY</div>

        <div className="row">
          <span className="rl">Przychód z budynków</span>
          <span className="rv" style={{color:"#00e87a"}}>
            +{fa((s.inc || 0) - (s.feeInc || 0))} zł
          </span>
        </div>

        <div className="row">
          <span className="rl">Opłaty od mieszkańców</span>
          <span className="rv" style={{color:"#00e87a"}}>
            +{fa(s.feeInc || 0)} zł
          </span>
        </div>

        <div className="row">
          <span className="rl">Koszty budynków</span>
          <span className="rv" style={{color:"#ff3d5a"}}>
            -{fa(s.exp || 0)} zł
          </span>
        </div>

        <div className="row">
          <span className="rl">Koszty polityk</span>
          <span className="rv" style={{color:policyCost > 0 ? "#ff9944" : "#3a5f82"}}>
            -{fa(policyCost)} zł
          </span>
        </div>

        <div className="row">
          <span className="rl">Podatek</span>
          <span className="rv" style={{color:"#ffd700"}}>
            {G.taxRate}%
          </span>
        </div>

        <div className="row">
          <span className="rl">Bilans bazowy</span>
          <span className="rv" style={{color:s.net >= 0 ? "#00e87a" : "#ff3d5a"}}>
            {fm(s.net || 0)} zł
          </span>
        </div>

        <div className="row">
          <span className="rl">Szacowany wynik po podatkach i politykach</span>
          <span className="rv" style={{color:estimatedMonthlyNet >= 0 ? "#00e87a" : "#ff3d5a"}}>
            {fm(estimatedMonthlyNet)} zł
          </span>
        </div>

        <div className="row">
          <span className="rl">Rata pożyczki</span>
          <span className="rv" style={{color:G.loan ? "#ff3d5a" : "#3a5f82"}}>
            {G.loan ? `-${fa(Math.floor(G.loan.amt * G.loan.rate / 12))} zł` : 'brak'}
          </span>
        </div>

        {activePolicies.length > 0 && (
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
            📋 Aktywne polityki: {activePolicies.map(p => `${p.icon} ${p.name}`).join(', ')}.
          </div>
        )}
      </div>

      <div className="panel">
        <div className="ptitle">🏙️ MIASTO</div>

        <div className="row">
          <span className="rl">Populacja</span>
          <span className="rv" style={{color:"#00b4ff"}}>{fa(s.pop || 0)} os.</span>
        </div>

        <div className="row">
          <span className="rl">Siła robocza</span>
          <span className="rv" style={{color:"#a259ff"}}>{fa(s.workers || 0)} os.</span>
        </div>

        <div className="row">
          <span className="rl">Miejsca pracy</span>
          <span className="rv" style={{color:"#ffd700"}}>{fa(s.jobs || 0)}</span>
        </div>

        <div className="row">
          <span className="rl">Zatrudnienie</span>
          <span className="rv" style={{color:s.er > 70 ? "#00e87a" : s.er > 40 ? "#ffd700" : "#ff3d5a"}}>
            {s.er}%
          </span>
        </div>

        <div className="row">
          <span className="rl">Pogoda</span>
          <span className="rv">{G.weather?.icon} {G.weather?.name}</span>
        </div>
      </div>

      <div className="panel" style={{
        border: G.smogScanUnlocked
          ? "1px solid rgba(0,232,122,0.25)"
          : "1px solid rgba(255,153,68,0.3)",
        background: G.smogScanUnlocked
          ? "rgba(0,232,122,0.04)"
          : "rgba(255,153,68,0.04)",
      }}>
        <div className="ptitle" style={{color:G.smogScanUnlocked ? "#00e87a" : "#ff9944"}}>
          🌫️ MONITORING SMOGU
        </div>

        {G.smogScanUnlocked ? (
          <>
            <div style={{fontSize:11,color:"#6a90b8",lineHeight:1.45,marginBottom:8}}>
              System monitoringu smogu jest aktywny. Tryb podglądu emisji CO₂ jest dostępny w zakładce Buduj.
            </div>

            <div className="row">
              <span className="rl">Status</span>
              <span className="rv" style={{color:"#00e87a"}}>AKTYWNY</span>
            </div>

            <div className="row">
              <span className="rl">Tryb mapy</span>
              <span className="rv" style={{color:"#ffd700"}}>🌫️ Odblokowany</span>
            </div>
          </>
        ) : (
          <>
            <div style={{fontSize:11,color:"#6a90b8",lineHeight:1.45,marginBottom:8}}>
              Odblokowuje specjalny tryb mapy pokazujący największych emitentów CO₂, redukcje i budynki wymagające filtrów.
            </div>

            <div className="row">
              <span className="rl">Koszt</span>
              <span className="rv" style={{color:"#ffd700"}}>{fa(SMOG_MONITORING_COST)} zł</span>
            </div>

            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onBuySmogMonitoring();
              }}
              style={{
                width:"100%",
                marginTop:8,
                padding:9,
                border:"1px solid rgba(255,153,68,0.4)",
                borderRadius:8,
                background:"rgba(255,153,68,0.08)",
                color:"#ff9944",
                fontSize:12,
                fontWeight:800,
              }}
            >
              🌫️ Wykup monitoring smogu ({fa(SMOG_MONITORING_COST)} zł)
            </button>
          </>
        )}
      </div>

      <div className="panel" style={{border:`1px solid ${emissions.level.color}44`}}>
        <div className="ptitle" style={{color:emissions.level.color}}>
          🌫️ POWIETRZE
        </div>

        <div className="row">
          <span className="rl">Jakość powietrza</span>
          <span className="rv" style={{color:emissions.level.color}}>
            {emissions.level.icon} {emissions.airQuality}% · {emissions.level.label}
          </span>
        </div>

        <div className="row">
          <span className="rl">Emisja netto</span>
          <span className="rv" style={{color:emissions.net <= 0 ? "#00e87a" : emissions.net < 70 ? "#ffd700" : "#ff3d5a"}}>
            {emissions.net > 0 ? '+' : ''}{fa(emissions.net)} j.
          </span>
        </div>

        <div className="row">
          <span className="rl">Emisja brutto</span>
          <span className="rv" style={{color:"#ff9944"}}>
            {fa(emissions.gross || 0)} j.
          </span>
        </div>

        <div className="row">
          <span className="rl">Redukcja łącznie</span>
          <span className="rv" style={{color:(emissions.totalReduction || 0) > 0 ? "#00e87a" : "#3a5f82"}}>
            -{fa(emissions.totalReduction || 0)} j.
          </span>
        </div>

        <div className="row">
          <span className="rl">Zasięg zieleni</span>
          <span className="rv" style={{color:percentColor(emissions.greenCoverage?.coverage ?? 100)}}>
            {emissions.greenCoverage?.coverage ?? 100}%
          </span>
        </div>

        {emissions.topEmitter && (
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
            🏭 Największy emitent: {emissions.topEmitter.icon} {emissions.topEmitter.name} · +{fa(emissions.topEmitter.value)} j.
          </div>
        )}
      </div>

      <ResourcePanel
        title="SYSTEM ENERGII"
        icon="⚡"
        ok={power.ok}
        color="#ffb400"
        efficiency={power.serviceEfficiency ?? 100}
        rows={[
          {label:'Produkcja', value:`${fa(power.supply || 0)} j.`, color:'#00e87a'},
          {label:'Zapotrzebowanie', value:`${fa(power.totalDemand || 0)} j.`, color:'#ffd700'},
          {label:'Bilans', value:`${signedValue(power.balance || 0)} j.`, color:power.ok ? '#00e87a' : '#ff3d5a'},
          {label:'Deficyt', value:`${fa(power.deficit || 0)} j.`, color:(power.deficit || 0) > 0 ? '#ff3d5a' : '#3a5f82'},
          {label:'Nadwyżka', value:`${fa(power.surplus || 0)} j.`, color:(power.surplus || 0) > 0 ? '#00e87a' : '#3a5f82'},
          {label:'Linie aktywne', value:`${power.activePowerLineCount || 0}/${power.powerLineCount || 0}`, color:'#ffd700'},
          {label:'Budynki poza siecią', value:power.disconnectedCount || 0, color:(power.disconnectedCount || 0) > 0 ? '#ff3d5a' : '#00e87a'},
          {label:'Skuteczność opłaty', value:`${power.feeEfficiency ?? 100}%`, color:percentColor(power.feeEfficiency ?? 100)},
        ]}
        warning={(power.disconnectedCount || 0) > 0 ? '🔌 Część budynków nie jest podłączona do sieci. Dociągnij linie energetyczne bliżej zabudowy.' : null}
      />

      <ResourcePanel
        title="SYSTEM WODY"
        icon="💧"
        ok={water.ok}
        color="#60b4ff"
        efficiency={water.serviceEfficiency ?? 100}
        rows={[
          {label:'Produkcja wody', value:`${fa(water.supply || 0)} j.`, color:'#60b4ff'},
          {label:'Zapotrzebowanie', value:`${fa(water.totalDemand || 0)} j.`, color:'#ffd700'},
          {label:'Bilans', value:`${signedValue(water.balance || 0)} j.`, color:water.ok ? '#60b4ff' : '#ff3d5a'},
          {label:'Deficyt', value:`${fa(water.deficit || 0)} j.`, color:(water.deficit || 0) > 0 ? '#ff3d5a' : '#3a5f82'},
          {label:'Nadwyżka', value:`${fa(water.surplus || 0)} j.`, color:(water.surplus || 0) > 0 ? '#60b4ff' : '#3a5f82'},
          {label:'Rury aktywne', value:`${water.activeWaterPipeCount || 0}/${water.waterPipeCount || 0}`, color:'#60b4ff'},
          {label:'Budynki bez wody', value:water.disconnectedCount || 0, color:(water.disconnectedCount || 0) > 0 ? '#ff3d5a' : '#00e87a'},
          {label:'Skuteczność opłaty', value:`${water.feeEfficiency ?? 100}%`, color:percentColor(water.feeEfficiency ?? 100)},
        ]}
        warning={(water.disconnectedCount || 0) > 0 ? '🚱 Część budynków nie ma dostępu do wody. Połącz dzielnice rurami z wodociągami.' : null}
      />

      <ResourcePanel
        title="KANALIZACJA"
        icon="🏗️"
        ok={sewage.ok}
        color="#c77dff"
        efficiency={sewage.serviceEfficiency ?? 100}
        rows={[
          {label:'Pojemność oczyszczania', value:`${fa(sewage.treatmentCapacity || 0)} j.`, color:'#c77dff'},
          {label:'Ładunek ścieków', value:`${fa(sewage.totalLoad || 0)} j.`, color:'#ffd700'},
          {label:'Bilans', value:`${signedValue(sewage.balance || 0)} j.`, color:sewage.ok ? '#c77dff' : '#ff3d5a'},
          {label:'Deficyt', value:`${fa(sewage.deficit || 0)} j.`, color:(sewage.deficit || 0) > 0 ? '#ff3d5a' : '#3a5f82'},
          {label:'Nadwyżka', value:`${fa(sewage.surplus || 0)} j.`, color:(sewage.surplus || 0) > 0 ? '#c77dff' : '#3a5f82'},
          {label:'Rury aktywne', value:`${sewage.activeSewagePipeCount || 0}/${sewage.sewagePipeCount || 0}`, color:'#c77dff'},
          {label:'Budynki bez kanalizacji', value:sewage.disconnectedCount || 0, color:(sewage.disconnectedCount || 0) > 0 ? '#ff3d5a' : '#00e87a'},
          {label:'Skuteczność opłaty', value:`${sewage.feeEfficiency ?? 100}%`, color:percentColor(sewage.feeEfficiency ?? 100)},
        ]}
        warning={(sewage.disconnectedCount || 0) > 0 ? '🧪 Część budynków nie ma kanalizacji. Połącz rury z oczyszczalnią.' : null}
      />

      <div className="panel">
        <div className="ptitle">📋 POLITYKI MIEJSKIE</div>

        {POLICIES.map(policy => {
          const active = !!G.policies?.[policy.id];

          return (
            <div
              key={policy.id}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onPolicy(policy.id);
              }}
              style={{
                display:"flex",
                gap:10,
                alignItems:"center",
                padding:"9px 0",
                borderBottom:"1px solid rgba(255,255,255,0.05)",
                cursor:"pointer",
              }}
            >
              <div style={{fontSize:20,width:28,textAlign:"center"}}>
                {policy.icon}
              </div>

              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:800,color:active ? "#00e87a" : "#c8dff5"}}>
                  {policy.name}
                </div>
                <div style={{fontSize:10,color:"#6a90b8",lineHeight:1.35}}>
                  {policy.desc}
                </div>
              </div>

              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:11,fontFamily:"monospace",fontWeight:800,color:active ? "#ff9944" : "#3a5f82"}}>
                  -{fa(policy.cost)} zł/m
                </div>
                <div style={{fontSize:10,color:active ? "#00e87a" : "#3a5f82"}}>
                  {active ? 'ON' : 'OFF'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel">
        <div className="ptitle">💰 PODATKI I OPŁATY</div>

        <SliderRow
          label="Podatek miejski"
          value={G.taxRate}
          min={0}
          max={30}
          suffix="%"
          onChange={onTax}
        />

        <SliderRow
          label="Czynsz miejski"
          value={G.fees?.rent || 0}
          min={0}
          max={15}
          suffix=""
          onChange={(value) => onFee('rent', value)}
        />

        <SliderRow
          label="Opłata za wodę"
          value={G.fees?.water || 0}
          min={0}
          max={15}
          suffix=""
          onChange={(value) => onFee('water', value)}
        />

        <SliderRow
          label="Opłata za prąd"
          value={G.fees?.power || 0}
          min={0}
          max={15}
          suffix=""
          onChange={(value) => onFee('power', value)}
        />

        <SliderRow
          label="Opłata za transport"
          value={G.fees?.transit || 0}
          min={0}
          max={15}
          suffix=""
          onChange={(value) => onFee('transit', value)}
        />

        <SliderRow
          label="Opłata za kanalizację"
          value={G.fees?.sewage || 0}
          min={0}
          max={15}
          suffix=""
          onChange={(value) => onFee('sewage', value)}
        />
      </div>

      <div className="panel">
        <div className="ptitle">🏦 FINANSE I ADMINISTRACJA</div>

        {G.loan ? (
          <div style={{
            background:"rgba(255,153,68,0.06)",
            border:"1px solid rgba(255,153,68,0.18)",
            borderRadius:9,
            padding:9,
            marginBottom:10,
          }}>
            <div style={{fontSize:12,fontWeight:800,color:"#ff9944",marginBottom:4}}>
              🏦 Aktywna pożyczka
            </div>
            <div style={{fontSize:11,color:"#6a90b8",lineHeight:1.45}}>
              Kwota: {fa(G.loan.amt)} zł · Rata: {fa(Math.floor(G.loan.amt * G.loan.rate / 12))} zł/m · Pozostało: {G.loan.months} mies.
            </div>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            {[10000, 25000, 50000, 100000].map(amount => (
              <button
                key={amount}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onOpenLoan(amount);
                }}
                style={{
                  padding:9,
                  border:"1px solid rgba(255,215,0,0.35)",
                  borderRadius:8,
                  background:"rgba(255,215,0,0.08)",
                  color:"#ffd700",
                  fontSize:11,
                  fontWeight:800,
                }}
              >
                🏦 {fa(amount)} zł
              </button>
            ))}
          </div>
        )}

        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onOpenAudit();
          }}
          style={{
            width:"100%",
            padding:9,
            border:"1px solid rgba(255,180,0,0.35)",
            borderRadius:8,
            background:"rgba(255,180,0,0.08)",
            color:"#ffb400",
            fontSize:12,
            fontWeight:800,
            marginBottom:8,
          }}
        >
          🔍 Kontrola skarbowa (-500 zł)
        </button>

        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onReset();
          }}
          style={{
            width:"100%",
            padding:9,
            border:"1px solid rgba(255,61,90,0.35)",
            borderRadius:8,
            background:"rgba(255,61,90,0.08)",
            color:"#ff3d5a",
            fontSize:12,
            fontWeight:800,
          }}
        >
          🔄 Reset gry
        </button>
      </div>
    </div>
  );
}