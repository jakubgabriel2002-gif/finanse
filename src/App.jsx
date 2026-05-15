import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TILE, ROAD_COST, BT, BL, MS, GS, BD, LIM, TR, EVTS, WEATHERS, TSTEPS, CX, CY } from './data.js';
import { calcStats, genInbox, nR, nT, fa, fm, ft, buildStarterRoads } from './gameLogic.js';
import Map from './components/Map.jsx';
import TopBar from './components/TopBar.jsx';
import BottomNav from './components/BottomNav.jsx';
import SelPanel from './components/SelPanel.jsx';
import Tutorial from './components/Tutorial.jsx';
import BuildTab from './components/tabs/BuildTab.jsx';
import TownhallTab from './components/tabs/TownhallTab.jsx';
import InboxTab from './components/tabs/InboxTab.jsx';
import StatsTab from './components/tabs/StatsTab.jsx';

let _uid = 1;
const mk = (type,x,y) => ({uid:_uid++,type,x,y,lv:1,building:false,buildEnd:0,solar:false,co2f:false});

// Budżet startowy: 90 000 zł
// Koszt tutorialu: ratusz(3k) + 2x blok(10k) + dom(2k) + fabryka(8k) + szpital(12k) + drogi(~2k) = ~37k
// Zostaje: ~50 000 zł po ukończeniu samouczka
const INIT_STATE = {
  budget: 90000,
  buildings: [],
  grid: {},
  roads: new Set(),
  thLv: 1, month: 1, year: 1, speed: 1, paused: false,
  stats: null,
  log: [{id:0,label:"🏙️ NeoCity — nowa gra!",amount:0}],
  taxRate: 12,
  policies: {green:false,work:false,night:false,trans:false},
  fees: {rent:0,water:0,power:0,transit:0,sewage:0},
  loan: null, elTmr: 48, riotOn: false, riotTmr: 0,
  inbox: [], events: [], news: [],
  nextUID: 100,
  buildMode: null,
  selUID: null, tab: "map",
  weather: WEATHERS[0],
  tutDone: false, tutStep: 0, auditCD: 0,
};

function loadGame() {
  try {
    const raw = localStorage.getItem('neocity_v7');
    if(!raw) return null;
    const save = JSON.parse(raw);
    save.roads = new Set(save.roads);
    save.weather = save.weather || WEATHERS[0];
    save.buildMode = null; // zawsze null po odświeżeniu
    save.fees = {rent:0,water:0,power:0,transit:0,sewage:0, ...(save.fees||{})};
    return save;
  } catch(e) { return null; }
}

export default function App() {
  const [G, setG] = useState(() => loadGame() || {...INIT_STATE, roads: new Set()});
  const [cam, setCam] = useState({x:0,y:0,zoom:1.0});
  const [evPopup, setEvPopup] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [loanModal, setLoanModal] = useState(null);
  const [auditModal, setAuditModal] = useState(false);
  const [showTut, setShowTut] = useState(false);
  const mapViewRef = useRef(null);
  const pinchRef = useRef(null);
  const touchRef = useRef(null);
  const logIdRef = useRef(100);
  const notifIdRef = useRef(0);

  // Init camera
  useEffect(() => {
    const sz = GS(G.thLv);
    const W = window.innerWidth;
    const H = window.innerHeight - 52 - 70;
    setCam({x:W/2-(sz*TILE)/2, y:H/2-(sz*TILE)/2, zoom:1.0});
  }, []);

  // Initial recalc
  useEffect(() => {
    setG(g => {
      const stats = calcStats(g.buildings, g.roads, g.loan, g.fees, g.weather);
      const inbox = genInbox({...g, stats});
      return {...g, stats, inbox};
    });
  }, []);

  // Show tutorial on first load if not done
  useEffect(() => {
    if(!G.tutDone) setShowTut(true);
  }, []);

  // Save (only when tutorial done, never save buildMode)
  useEffect(() => {
    if(!G.tutDone) return;
    try {
      const save = {...G, roads: [...G.roads], buildMode: null};
      localStorage.setItem('neocity_v7', JSON.stringify(save));
    } catch(e) {}
  }, [G]);

  // FIX: reset scroll pozycji tab-content przy zmianie zakładki
  useEffect(() => {
    const tc = document.getElementById('tab-content');
    if(tc) tc.scrollTop = 0;
  }, [G.tab]);

  const notif = useCallback((msg, type="ok") => {
    const id = ++notifIdRef.current;
    setNotifs(ns => [...ns, {id, msg, type}]);
    setTimeout(() => setNotifs(ns => ns.filter(n => n.id !== id)), 3500);
  }, []);

  const recalc = useCallback((g) => {
    const stats = calcStats(g.buildings, g.roads, g.loan, g.fees, g.weather);
    const inbox = genInbox({...g, stats});
    return {...g, stats, inbox};
  }, []);

  // Build completions (1s tick)
  useEffect(() => {
    const id = setInterval(() => {
      setG(prev => {
        const now = Date.now()/1000;
        let changed = false, newThLv = prev.thLv;
        const buildings = prev.buildings.map(b => {
          if(b.building && b.buildEnd <= now) {
            changed = true;
            if(b.type === 'townhall') newThLv = b.lv;
            notif(`✅ ${BD[b.type]?.e} ${BD[b.type]?.n} Lv${b.lv} gotowy!`, "ok");
            return {...b, building: false, buildEnd: 0};
          }
          return b;
        });
        if(!changed) return prev;
        return recalc({...prev, buildings, thLv: newThLv});
      });
    }, 1000);
    return () => clearInterval(id);
  }, [notif, recalc]);

  // Month tick
  useEffect(() => {
    if(G.paused || G.speed === 0 || !G.tutDone) return;
    const iv = 12000 / G.speed;
    const id = setInterval(() => {
      setG(prev => {
        if(!prev.stats) return prev;
        const s = prev.stats;
        const tax = 0.8 + prev.taxRate/100;
        const pc = (prev.policies.green?500:0)+(prev.policies.work?800:0)+(prev.policies.night?300:0)+(prev.policies.trans?600:0);
        const net = Math.floor(s.net * tax * (0.9+Math.random()*0.2)) - pc;
        let budget = prev.budget + net;
        let month = prev.month + 1, year = prev.year;
        if(month > 12) { month = 1; year++; }
        let elTmr = prev.elTmr - 1;
        let auditCD = Math.max(0, prev.auditCD - 1);
        const newLog = [{id:logIdRef.current++,label:`📅 ${MS[prev.month-1]} Rok ${prev.year}`,amount:net}, ...prev.log.slice(0,19)];

        if(elTmr <= 0) {
          elTmr = 48;
          const avg = Math.round(Object.values(s.sat).reduce((a,b)=>a+b,0)/5);
          if(avg >= 45) { budget += 2000; notif("🗳️ Wygrałeś wybory! +2000 zł", "ok"); }
          else { budget -= 5000; notif("🗳️ Przegrałeś wybory! -5000 zł", "err"); }
        }

        let weather = prev.weather;
        if(month % 3 === 0) {
          const r = Math.random();
          weather = r<0.5?WEATHERS[0]:r<0.75?WEATHERS[1]:r<0.9?WEATHERS[2]:WEATHERS[3];
          if(weather.id !== 'sunny') notif(`${weather.icon} Pogoda: ${weather.name}`, "warn");
        }

        let events = prev.events, news = prev.news;
        if(Math.random() < 0.1) {
          const ev = EVTS[Math.floor(Math.random()*EVTS.length)];
          budget += ev.b;
          events = [{id:logIdRef.current++,t:ev.t,tp:ev.tp,mo:month,yr:year}, ...events.slice(0,9)];
          news = [{id:logIdRef.current++,t:ev.t,m:ev.m,tp:ev.tp}, ...news.slice(0,4)];
          newLog.unshift({id:logIdRef.current++,label:ev.t,amount:ev.b});
          setEvPopup(ev);
          setTimeout(() => setEvPopup(null), 5000);
        }

        let riotOn = prev.riotOn, riotTmr = prev.riotTmr;
        const avg2 = Math.round(Object.values(s.sat).reduce((a,b)=>a+b,0)/5);
        const hasPol = prev.buildings.some(b => b.type==="police"&&!b.building);
        if(!riotOn && avg2<35 && !hasPol && Math.random()<0.05) {
          riotOn=true; riotTmr=3; budget-=2000;
          notif("🚨 ZAMIESZKI! -2000 zł","err");
          newLog.unshift({id:logIdRef.current++,label:"🚨 Zamieszki",amount:-2000});
        }
        if(riotOn){riotTmr--;if(riotTmr<=0)riotOn=false;}

        let loan = prev.loan;
        if(loan){loan={...loan,months:loan.months-1};if(loan.months<=0){loan=null;notif("✅ Pożyczka spłacona!","ok");}}

        return recalc({...prev,budget,log:newLog,month,year,elTmr,auditCD,weather,events,news,riotOn,riotTmr,loan});
      });
    }, iv);
    return () => clearInterval(id);
  }, [G.paused, G.speed, G.tutDone, notif, recalc]);

  // ─── ACTIONS ──────────────────────────────────────────
  const tileClick = useCallback((gx, gy) => {
    setG(prev => {
      const sz = GS(prev.thLv);
      if(gx<0||gy<0||gx>=sz||gy>=sz) return prev;
      const key = `${gx},${gy}`;
      const ter = TR[sz]||TR[24];

      if(prev.buildMode==='road') {
        if(prev.roads.has(key)){notif("⚠️ Tu już jest droga!","warn");return prev;}
        if(prev.grid[key]){notif("⚠️ Blokuje budynek!","warn");return prev;}
        if(ter[gy]?.[gx]===2){notif("⚠️ Nie na wodzie!","warn");return prev;}
        if(prev.budget<ROAD_COST){notif("❌ Za mało środków!","err");return prev;}
        const nr=new Set(prev.roads);nr.add(key);
        const newLog=[{id:logIdRef.current++,label:"🛣️ Droga",amount:-ROAD_COST},...prev.log.slice(0,19)];
        return recalc({...prev,roads:nr,budget:prev.budget-ROAD_COST,log:newLog});
      }

      if(prev.buildMode) {
        if(prev.roads.has(key)){notif("⚠️ Tu jest droga!","warn");return prev;}
        if(prev.grid[key]){notif("⚠️ Zajęte!","warn");return prev;}
        if(ter[gy]?.[gx]===2){notif("⚠️ Nie na wodzie!","warn");return prev;}
        const d=BD[prev.buildMode];if(!d)return prev;
        if(prev.buildMode==='townhall'&&prev.buildings.some(b=>b.type==='townhall')){
          notif("⚠️ Ratusz może być tylko jeden!","warn");return prev;
        }
        if(prev.budget<d.cost){notif(`❌ Za mało! (${fa(d.cost)} zł)`,"err");return prev;}
        const lim=LIM[prev.thLv]?.[prev.buildMode]??99;
        if(prev.buildings.filter(b=>b.type===prev.buildMode).length>=lim){
          notif(`⚠️ Limit ${lim} — rozbuduj Ratusz!`,"warn");return prev;
        }
        const now=Date.now()/1000;
        const nb={uid:prev.nextUID,type:prev.buildMode,x:gx,y:gy,lv:1,building:true,buildEnd:now+BT[0],solar:false,co2f:false};
        const buildings=[...prev.buildings,nb];
        const grid={...prev.grid,[key]:nb};
        const newLog=[{id:logIdRef.current++,label:`🏗️ ${d.n}`,amount:-d.cost},...prev.log.slice(0,19)];
        notif(`🏗️ ${d.e} ${d.n} · ${BL[0]}`,"ok");
        let next=recalc({...prev,buildings,grid,budget:prev.budget-d.cost,nextUID:prev.nextUID+1,log:newLog});

        // Tutorial advancement
        if(!next.tutDone) {
          const step=TSTEPS[next.tutStep];
          if(step?.req&&step.req.type===prev.buildMode) {
            const cnt=buildings.filter(b=>b.type===prev.buildMode).length;
            if(cnt>=step.req.n) {
              next.buildMode=null;
              next.tutStep=next.tutStep+1;
              setTimeout(()=>setShowTut(true),400);
            }
          }
        }
        return next;
      }

      const existing=prev.grid[key];
      return {...prev,selUID:existing?existing.uid:null};
    });
  }, [notif, recalc]);

  // Tutorial: wait for roads (step 1)
  useEffect(() => {
    if(G.tutDone||G.tutStep!==1) return;
    if(G.roads.size>=3) {
      setTimeout(()=>{
        setG(g=>({...g,tutStep:2,buildMode:null}));
        setShowTut(true);
      },500);
    }
  }, [G.tutDone, G.tutStep, G.roads.size]);

  const bldClick = useCallback((uid) => {
    setG(prev => prev.buildMode ? prev : {...prev,selUID:uid});
  }, []);

  const upgradeBuilding = useCallback(() => {
    setG(prev => {
      const b=prev.buildings.find(x=>x.uid===prev.selUID);if(!b)return prev;
      const d=BD[b.type];
      if(b.lv>=d.ml){notif("⚠️ Max poziom!","warn");return prev;}
      if(b.building){notif("⚠️ Trwa budowa!","warn");return prev;}
      const cost=Math.floor(d.cost*b.lv*1.5);
      if(prev.budget<cost){notif(`❌ Za mało! (${fa(cost)} zł)`,"err");return prev;}
      const now=Date.now()/1000,nl=b.lv+1;
      const buildings=prev.buildings.map(x=>x.uid===b.uid?{...x,lv:nl,building:true,buildEnd:now+BT[nl-1]}:x);
      const upd=buildings.find(x=>x.uid===b.uid);
      const grid={...prev.grid,[`${b.x},${b.y}`]:upd};
      notif(`⬆️ ${d.e} ${d.n} → Lv${nl} (${BL[nl-1]})`,"ok");
      const newLog=[{id:logIdRef.current++,label:`⬆️ ${d.n} → Lv${nl}`,amount:-cost},...prev.log.slice(0,19)];
      return recalc({...prev,buildings,grid,budget:prev.budget-cost,log:newLog});
    });
  }, [notif, recalc]);

  const demolishBuilding = useCallback(() => {
    setG(prev => {
      const b=prev.buildings.find(x=>x.uid===prev.selUID);if(!b)return prev;
      if(b.type==='townhall'){notif("⚠️ Ratusza nie można wyburzyć!","warn");return prev;}
      const d=BD[b.type],refund=Math.floor(d.cost*b.lv*0.35);
      const buildings=prev.buildings.filter(x=>x.uid!==b.uid);
      const grid={...prev.grid};delete grid[`${b.x},${b.y}`];
      notif(`💥 ${d.n} · +${fa(refund)} zł`,"warn");
      const newLog=[{id:logIdRef.current++,label:`💥 ${d.n}`,amount:refund},...prev.log.slice(0,19)];
      return recalc({...prev,buildings,grid,budget:prev.budget+refund,selUID:null,log:newLog});
    });
  }, [notif, recalc]);

  const installSolar = useCallback(() => {
    setG(prev => {
      const b=prev.buildings.find(x=>x.uid===prev.selUID);if(!b)return prev;
      if(prev.budget<3000){notif("❌ Za mało! (3000 zł)","err");return prev;}
      const buildings=prev.buildings.map(x=>x.uid===b.uid?{...x,solar:true}:x);
      notif(`☀️ Panele solarne zainstalowane!`,"ok");
      const newLog=[{id:logIdRef.current++,label:`☀️ Panele — ${BD[b.type].n}`,amount:-3000},...prev.log.slice(0,19)];
      return recalc({...prev,buildings,budget:prev.budget-3000,log:newLog});
    });
  }, [notif, recalc]);

  const installFilter = useCallback(() => {
    setG(prev => {
      const b=prev.buildings.find(x=>x.uid===prev.selUID);if(!b)return prev;
      if(prev.budget<2000){notif("❌ Za mało! (2000 zł)","err");return prev;}
      const buildings=prev.buildings.map(x=>x.uid===b.uid?{...x,co2f:true}:x);
      notif(`🌿 Filtr CO₂ zainstalowany!`,"ok");
      const newLog=[{id:logIdRef.current++,label:`🌿 Filtr — ${BD[b.type].n}`,amount:-2000},...prev.log.slice(0,19)];
      return recalc({...prev,buildings,budget:prev.budget-2000,log:newLog});
    });
  }, [notif, recalc]);

  const takeLoan = useCallback(() => {
    setG(prev => {
      if(prev.loan){notif("⚠️ Masz już pożyczkę!","warn");setLoanModal(null);return prev;}
      const loan={amt:loanModal,rate:0.08,months:24};
      notif(`🏦 Pożyczka ${fa(loanModal)} zł`,"ok");
      const newLog=[{id:logIdRef.current++,label:"🏦 Pożyczka",amount:loanModal},...prev.log.slice(0,19)];
      setLoanModal(null);
      return recalc({...prev,loan,budget:prev.budget+loanModal,log:newLog});
    });
  }, [loanModal, notif, recalc]);

  const runAudit = useCallback(() => {
    setG(prev => {
      if(prev.budget<500){notif("❌ Za mało! (500 zł)","err");setAuditModal(false);return prev;}
      const fs=prev.buildings.filter(b=>['factory','shop','office','bank'].includes(b.type)&&!b.building);
      let extra=0,msg="🔍 Kontrola: wszystko w porządku.";
      let newLog=[{id:logIdRef.current++,label:"🔍 Kontrola skarbowa",amount:-500},...prev.log.slice(0,19)];
      if(fs.length>0&&Math.random()<0.65){
        const caught=fs[Math.floor(Math.random()*fs.length)];
        const fine=Math.floor(BD[caught.type].inc*caught.lv*0.8+Math.random()*1500);
        extra=fine;msg=`🔍 ${BD[caught.type].n} ukarana! +${fa(fine)} zł`;
        newLog.unshift({id:logIdRef.current++,label:`💰 Kara — ${BD[caught.type].n}`,amount:fine});
      }
      notif(msg,"ok");
      setAuditModal(false);
      return recalc({...prev,budget:prev.budget-500+extra,auditCD:4,log:newLog});
    });
  }, [notif, recalc]);

  const resetGame = useCallback(() => {
    if(!window.confirm("Na pewno chcesz zresetować grę? Wszystkie postępy zostaną utracone.")) return;
    localStorage.removeItem('neocity_v7');
    _uid=1;
    const fresh={...INIT_STATE,roads:new Set(),buildings:[],grid:{},log:[{id:0,label:"🏙️ NeoCity — nowa gra!",amount:0}]};
    const stats=calcStats([],new Set(),null,fresh.fees,fresh.weather);
    setG({...fresh,stats,inbox:genInbox({...fresh,stats})});
    const W=window.innerWidth,H=window.innerHeight-52-70;
    setCam({x:W/2-(GS(1)*TILE)/2,y:H/2-(GS(1)*TILE)/2,zoom:1.0});
    setShowTut(true);
    notif("🔄 Gra zresetowana!","warn");
  }, [notif]);

  const markRead = useCallback((idx) => {
    setG(prev => {
      if(idx==='all') return {...prev,inbox:prev.inbox.map(m=>({...m,read:true}))};
      return {...prev,inbox:prev.inbox.map((m,i)=>i===idx?{...m,read:true}:m)};
    });
  }, []);

  const cycleSpeed = useCallback(() => {
    setG(g=>({...g,speed:(g.speed+1)%4}));
  }, []);

  const setTab = useCallback((tab) => {
    setG(g=>({...g,tab}));
  }, []);

  // Tutorial
  const tutAction = useCallback((step) => {
    if(step.action==='finish') {
      setG(g=>({...g,tutDone:true}));
      setShowTut(false);
      notif("🏙️ Powodzenia, burmistrzu!","ok");
      return;
    }
    setG(g=>({...g,buildMode:step.action}));
    setShowTut(false);
  }, [notif]);

  const tutSkip = useCallback(() => {
    setG(prev=>recalc({...prev,budget:80000,buildings:[],grid:{},roads:new Set(),tutDone:true,tutStep:TSTEPS.length,buildMode:null,nextUID:200,log:[{id:logIdRef.current++,label:"🏙️ Pominięto samouczek",amount:0}]}));
    setShowTut(false);
    notif("🏙️ Pusta mapa, 80 000 zł. Powodzenia!","ok");
  }, [notif, recalc]);

  // Touch & Mouse
  const onTouchStart = useCallback((e) => {
    if(e.touches.length===2) {
      const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
      pinchRef.current={dist:Math.sqrt(dx*dx+dy*dy)||1,zoom:cam.zoom};
      touchRef.current=null;return;
    }
    pinchRef.current=null;
    touchRef.current={sx:e.touches[0].clientX,sy:e.touches[0].clientY,cx:cam.x,cy:cam.y,moved:false,t:Date.now()};
  }, [cam]);

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    if(e.touches.length===2) {
      const p=pinchRef.current;if(!p)return;
      const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
      const d=Math.sqrt(dx*dx+dy*dy)||1;
      setCam(c=>({...c,zoom:Math.max(0.3,Math.min(2.5,p.zoom*(d/p.dist)))}));return;
    }
    const t=touchRef.current;if(!t)return;
    const dx=e.touches[0].clientX-t.sx,dy=e.touches[0].clientY-t.sy;
    if(Math.abs(dx)>5||Math.abs(dy)>5)t.moved=true;
    setCam(c=>({...c,x:t.cx+dx,y:t.cy+dy}));
  }, []);

  const onTouchEnd = useCallback(()=>{pinchRef.current=null;touchRef.current=null;},[]);
  const onWheel = useCallback((e)=>{e.preventDefault();setCam(c=>({...c,zoom:Math.max(0.3,Math.min(2.5,c.zoom-e.deltaY*0.001))}));},[]);
  const zoom = useCallback((dz)=>{setCam(c=>({...c,zoom:Math.max(0.3,Math.min(2.5,c.zoom+dz))}));},[]);
  const resetCam = useCallback(()=>{const sz=GS(G.thLv),W=window.innerWidth,H=window.innerHeight-52-70;setCam({x:W/2-(sz*TILE)/2,y:H/2-(sz*TILE)/2,zoom:1.0});},[G.thLv]);

  const unread = G.inbox?.filter(m=>!m.read).length || 0;

  return (
    <div id="app">
      <TopBar G={G}/>
      <div id="main">
        {G.tab==='map' ? (
          <div id="map-view" ref={mapViewRef}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onWheel={onWheel}>
            <Map G={G} cam={cam} onTileClick={tileClick} onBldClick={bldClick}/>
            {G.buildMode && (
              <div id="build-banner" style={{background:G.buildMode==='road'?'rgba(180,120,0,0.97)':'rgba(0,100,180,0.97)'}}>
                <span>{G.buildMode==='road'?'🛣️ Kliknij kafelek (200zł)':`${BD[G.buildMode]?.e} ${BD[G.buildMode]?.n}`}</span>
                <button onPointerDown={(e)=>{e.stopPropagation();e.preventDefault();setG(g=>({...g,buildMode:null}));}}
                  style={{background:"rgba(255,255,255,0.25)",border:"1px solid rgba(255,255,255,0.4)",borderRadius:6,color:"#fff",fontSize:13,padding:"2px 10px",fontWeight:700}}>
                  ✕ Anuluj
                </button>
              </div>
            )}
            {evPopup && (
              <div id="ev-popup" style={{background:evPopup.tp==='ok'?'rgba(0,30,15,0.97)':'rgba(30,0,0,0.97)',border:`1px solid ${evPopup.tp==='ok'?'rgba(0,232,122,0.5)':'rgba(255,61,90,0.5)'}`}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{evPopup.t}</div>
                <div style={{fontSize:10,color:"#9ab",marginBottom:6}}>{evPopup.m}</div>
                <div style={{fontSize:12,fontWeight:700,color:evPopup.b>=0?'#00e87a':'#ff3d5a'}}>{fm(evPopup.b)} zł</div>
              </div>
            )}
            {G.selUID!=null&&!G.buildMode && (
              <SelPanel G={G} onClose={()=>setG(g=>({...g,selUID:null}))}
                onUpgrade={upgradeBuilding} onDemolish={demolishBuilding}
                onSolar={installSolar} onFilter={installFilter}/>
            )}
            {G.riotOn && <div id="riot-overlay">🚨</div>}
            <div id="zoom-btns">
              <button className="zoom-btn" onPointerDown={(e)=>{e.stopPropagation();e.preventDefault();zoom(0.2);}}>＋</button>
              <button className="zoom-btn" onPointerDown={(e)=>{e.stopPropagation();e.preventDefault();zoom(-0.2);}}>－</button>
              <button className="zoom-btn" style={{color:"#6a90b8",fontSize:14}} onPointerDown={(e)=>{e.stopPropagation();e.preventDefault();resetCam();}}>⌂</button>
            </div>
          </div>
        ) : (
          <div id="tab-content">
            {G.tab==='build'    && <BuildTab G={G} onPick={(t)=>setG(g=>({...g,buildMode:t,tab:'map'}))}/>}
            {G.tab==='townhall' && <TownhallTab G={G} setG={setG}
              onOpenLoan={(amt)=>setLoanModal(amt)} onOpenAudit={()=>setAuditModal(true)}
              onPolicy={(id)=>setG(g=>recalc({...g,policies:{...g.policies,[id]:!g.policies[id]}}))}
              onFee={(id,v)=>setG(g=>recalc({...g,fees:{...g.fees,[id]:v}}))}
              onTax={(v)=>setG(g=>recalc({...g,taxRate:v}))}
              onReset={resetGame}/>}
            {G.tab==='inbox'    && <InboxTab G={G} onMarkRead={markRead}/>}
            {G.tab==='stats'    && <StatsTab G={G}/>}
          </div>
        )}
      </div>

      <BottomNav tab={G.tab} setTab={setTab} speed={G.speed} cycleSpeed={cycleSpeed} unread={unread}/>

      <div id="notifs">
        {notifs.map(n=>(
          <div key={n.id} className="notif"
            style={{border:`1px solid ${n.type==='ok'?'rgba(0,232,122,0.5)':n.type==='err'?'rgba(255,61,90,0.5)':'rgba(255,215,0,0.5)'}`}}>
            {n.msg}
          </div>
        ))}
      </div>

      {showTut&&!G.tutDone&&<Tutorial step={G.tutStep} onAction={tutAction} onSkip={tutSkip}/>}

      {loanModal&&(
        <div className="modal-bg">
          <div className="mbox">
            <div style={{fontSize:15,fontWeight:700,marginBottom:10}}>🏦 Pożyczka Bankowa</div>
            <div style={{fontSize:12,color:"#6a90b8",marginBottom:5}}>Kwota: <strong style={{color:"#ffd700"}}>{fa(loanModal)} zł</strong></div>
            <div style={{fontSize:11,color:"#ff9944",marginBottom:12}}>Rata: -{fa(Math.floor(loanModal*0.08/12))} zł/mie · 24 miesiące</div>
            <div style={{display:"flex",gap:8}}>
              <button onPointerDown={(e)=>{e.stopPropagation();takeLoan();}} style={{flex:1,padding:"10px 0",border:"1px solid rgba(255,215,0,0.4)",borderRadius:8,background:"rgba(255,215,0,0.1)",color:"#ffd700",fontSize:13,fontWeight:700}}>✅ Zaciągnij</button>
              <button onPointerDown={(e)=>{e.stopPropagation();setLoanModal(null);}} style={{flex:1,padding:"10px 0",border:"1px solid rgba(255,61,90,0.3)",borderRadius:8,background:"rgba(255,61,90,0.06)",color:"#ff3d5a",fontSize:13}}>Anuluj</button>
            </div>
          </div>
        </div>
      )}

      {auditModal&&(
        <div className="modal-bg">
          <div className="mbox">
            <div style={{fontSize:15,fontWeight:700,marginBottom:10}}>🔍 Kontrola Skarbowa</div>
            <div style={{fontSize:12,color:"#6a90b8",marginBottom:12}}>Koszt: 500 zł. Szansa na wykrycie firm unikających podatków.</div>
            <div style={{display:"flex",gap:8}}>
              <button onPointerDown={(e)=>{e.stopPropagation();runAudit();}} style={{flex:1,padding:"10px 0",border:"1px solid rgba(255,180,0,0.4)",borderRadius:8,background:"rgba(255,180,0,0.1)",color:"#ffb400",fontSize:13,fontWeight:700}}>🔍 Przeprowadź (-500 zł)</button>
              <button onPointerDown={(e)=>{e.stopPropagation();setAuditModal(false);}} style={{padding:"10px 14px",border:"1px solid rgba(255,61,90,0.3)",borderRadius:8,background:"rgba(255,61,90,0.06)",color:"#ff3d5a",fontSize:13}}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
