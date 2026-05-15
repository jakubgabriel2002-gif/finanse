import { BD, CX, CY } from './data.js';

export const nR = (x,y,r) => r.has(`${x},${y}`)||r.has(`${x-1},${y}`)||r.has(`${x+1},${y}`)||r.has(`${x},${y-1}`)||r.has(`${x},${y+1}`);
export const nT = (x,y,bs) => bs.some(b=>(b.type==="bus"||b.type==="tram"||b.type==="metro")&&!b.building&&Math.abs(b.x-x)<=3&&Math.abs(b.y-y)<=3);

export const fa = n => Math.abs(Math.round(n)).toLocaleString('pl');
export const fm = n => (n>=0?'+':'-')+fa(n);
export function ft(s){if(s<=0)return'✓';if(s<60)return`${s}s`;if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`;}

export function buildStarterRoads(cx, cy) {
  const r = new Set();
  const a = (x,y) => r.add(`${x},${y}`);
  for(let y=0;y<=cy-3;y++) a(cx,y);
  for(let x=9;x<=15;x++) { a(x,cy-2); a(x,cy+2); }
  for(let y=cy-2;y<=cy+2;y++) { a(9,y); a(15,y); }
  for(let x=5;x<=8;x++) a(x,cy);
  for(let x=16;x<=18;x++) a(x,cy);
  for(let y=cy+3;y<=cy+5;y++) a(cx,y);
  a(9,cy-1);
  for(let x=5;x<=8;x++) a(x,cy+3);
  return r;
}

export function calcStats(blds, roads, loan, fees, weather) {
  let inc=0, exp=0, pop=0, co2=0, jobs=0, pw=0, wt=0;
  const h = {housing:0, jobs:0, edu:0, env:0, services:0};
  const wm = weather?.sm || 1; // solar multiplier from weather
  const act = blds.filter(b => !b.building);

  act.forEach(b => {
    const d = BD[b.type]; if(!d) return;
    const ok = d.nr || nR(b.x,b.y,roads) || nT(b.x,b.y,act);
    const m = ok ? 1 : 0.05;

    exp += d.exp * b.lv;
    // FIX: pop nie spada podczas rozbudowy — liczymy tylko gotowe budynki (już filtrowane przez act)
    pop += d.pop * b.lv * m;
    // CO2: filtry redukują 40%, każdy level dodaje tyle co lv1 (nie mnoży)
    co2 += d.co2 * b.lv * (b.co2f ? 0.6 : 1);

    // Energia: solar zależy od pogody (wm), panele solarne na budynkach -50%
    let bpw;
    if(b.type === 'solar') {
      // solar = base * weather_multiplier, panele na farmie solarne nie mają sensu
      bpw = d.pw * b.lv * wm;
    } else {
      // inne budynki: solar panel instalacja -50% zużycia
      bpw = d.pw * b.lv * (b.solar ? 0.5 : 1);
    }
    pw += bpw;
    wt += d.wt * b.lv;

    if(d.jobs > 0) jobs += d.jobs * b.lv;
    Object.entries(d.hap).forEach(([k,v]) => { h[k] = (h[k]||0) + v; });
  });

  // Pogoda wpływa na nastroje
  if(weather?.id === 'rainy') h.env = (h.env||0) - 5;
  if(weather?.id === 'storm') { h.env = (h.env||0) - 10; h.housing = (h.housing||0) - 5; }

  const workers = Math.floor(pop * 0.6);
  const er = jobs > 0 ? Math.min(workers, jobs) / jobs : 1;

  // Przychody — job-sensitive buildings skalują wg zatrudnienia
  act.forEach(b => {
    const d = BD[b.type]; if(!d) return;
    const ok = d.nr || nR(b.x,b.y,roads) || nT(b.x,b.y,act);
    const m = ok ? 1 : 0.05;
    const jm = ['factory','office','shop','bank'].includes(b.type) ? er : 1;
    inc += d.inc * b.lv * m * jm;
  });

  // Opłaty mieszkańców
  const ri = Math.floor(pop * (fees?.rent  || 0) / 10);
  const wi = Math.floor(pop * (fees?.water || 0) / 10);
  const pi = Math.floor(pop * (fees?.power || 0) / 10);
  // Opłata za transport (nowe) — za każdy przystanek/tramwaj
  const transitCount = act.filter(b => ['bus','tram','metro'].includes(b.type)).length;
  const ti = Math.floor(pop * (fees?.transit || 0) / 10) * Math.min(transitCount, 5);
  // Opłata za oczyszczalnię
  const si = Math.floor(pop * (fees?.sewage || 0) / 10);
  inc += ri + wi + pi + ti + si;

  // Zadowolenie spada gdy opłaty za wysokie
  if((fees?.rent    || 0) > 5) h.housing  = (h.housing||0)  - Math.floor((fees.rent  - 5) / 2);
  if((fees?.water   || 0) > 5) h.services = (h.services||0) - Math.floor((fees.water - 5) / 3);
  if((fees?.power   || 0) > 5) h.services = (h.services||0) - Math.floor((fees.power - 5) / 3);
  if((fees?.transit || 0) > 5) h.services = (h.services||0) - Math.floor((fees.transit-5) / 4);
  if((fees?.sewage  || 0) > 5) h.services = (h.services||0) - Math.floor((fees.sewage - 5) / 4);

  // Deficyty obniżają zadowolenie z mieszkań
  if(pw > 0) h.housing = (h.housing||0) - Math.floor(pw / 5);
  if(wt > 0) h.housing = (h.housing||0) - Math.floor(wt / 5);

  // Rata pożyczki
  exp += loan ? Math.floor(loan.amt * loan.rate / 12) : 0;

  return {
    inc: Math.floor(inc), exp: Math.floor(exp), pop: Math.floor(pop),
    co2: Math.floor(co2), net: Math.floor(inc - exp),
    jobs, workers, er: Math.round(er * 100),
    pw: Math.floor(pw), wt: Math.floor(wt),
    pwOk: pw <= 0, wtOk: wt <= 0,
    ri, wi, pi, ti, si,
    feeInc: ri + wi + pi + ti + si,
    sat: {
      housing:  Math.max(0, Math.min(100, 50 + (h.housing||0))),
      jobs:     Math.max(0, Math.min(100, 30 + (h.jobs||0))),
      edu:      Math.max(0, Math.min(100, 20 + (h.edu||0))),
      env:      Math.max(0, Math.min(100, 60 + (h.env||0))),
      services: Math.max(0, Math.min(100, 10 + (h.services||0))),
    }
  };
}

export function genInbox(G) {
  const s = G.stats, msgs = [];
  if(!s) return msgs;
  const polc = G.buildings.filter(b=>b.type==="police"&&!b.building).length;
  const firc = G.buildings.filter(b=>b.type==="fire"&&!b.building).length;
  const avgH = Math.round(Object.values(s.sat).reduce((a,b)=>a+b,0)/5);

  if(!s.pwOk && s.pw > 10)
    msgs.push({id:"pw",icon:"⚡",from:"Mieszkańcy",sub:"Brak prądu!",body:`Deficyt energii: ${s.pw} j. Zbuduj elektrownię, farmę solarną lub wiatrak!`,pri:"high",read:false});
  if(!s.wtOk && s.wt > 10)
    msgs.push({id:"wt",icon:"💧",from:"Mieszkańcy",sub:"Brak wody!",body:`Deficyt wody: ${s.wt} j. Zbuduj wodociągi lub oczyszczalnię!`,pri:"high",read:false});
  if(s.er < 50 && s.jobs > 20)
    msgs.push({id:"emp",icon:"💼",from:"Pracodawcy",sub:"Brak pracowników",body:`Firmy na ${s.er}% wydajności. Buduj więcej mieszkań!`,pri:"med",read:false});
  if(s.co2 > 60)
    msgs.push({id:"co2",icon:"🏭",from:"Ekolodzy",sub:"Alarmujące CO₂!",body:`Emisja ${s.co2} j. Zainstaluj filtry CO₂, buduj parki, wiatraki, oczyszczalnię!`,pri:"high",read:false});
  if(s.sat.housing < 35)
    msgs.push({id:"hs",icon:"🏠",from:"Mieszkańcy",sub:"Kryzys mieszkaniowy",body:"Dramatyczny brak mieszkań! Buduj bloki i domy.",pri:"high",read:false});
  if(polc === 0 && s.pop > 100)
    msgs.push({id:"pol",icon:"🚔",from:"Rada",sub:"Brak policji!",body:"Przestępczość rośnie. Zbuduj komisariat!",pri:"high",read:false});
  if(firc === 0 && G.buildings.length > 10)
    msgs.push({id:"fir",icon:"🚒",from:"Rada",sub:"Brak straży pożarnej",body:"Ryzyko pożarów bardzo wysokie!",pri:"med",read:false});
  if(avgH < 40)
    msgs.push({id:"hap",icon:"😤",from:"Mieszkańcy",sub:"Niezadowolenie rośnie",body:`Zadowolenie ${avgH}%. Grożą zamieszki!`,pri:"high",read:false});
  if(G.taxRate > 22)
    msgs.push({id:"tax",icon:"💰",from:"Podatnicy",sub:"Podatki za wysokie!",body:`Stawka ${G.taxRate}% odpędza firmy!`,pri:"med",read:false});
  if(G.loan)
    msgs.push({id:"bank",icon:"🏦",from:"Bank",sub:"Pożyczka aktywna",body:`Saldo: ${fa(G.loan.amt)} zł · Rata: ${fa(Math.floor(G.loan.amt*G.loan.rate/12))} zł/mie · Pozostało: ${G.loan.months} mies.`,pri:"low",read:false});
  if(((G.fees?.rent||0)>8)||((G.fees?.water||0)>8)||((G.fees?.power||0)>8)||((G.fees?.transit||0)>8))
    msgs.push({id:"fees",icon:"💸",from:"Mieszkańcy",sub:"Wysokie opłaty!",body:"Opłaty są za wysokie. Mieszkańcy rozważają wyprowadzkę!",pri:"med",read:false});

  if(msgs.length === 0)
    msgs.push({id:"ok",icon:"✅",from:"Rada Miasta",sub:"Miasto funkcjonuje prawidłowo",body:"Wszystkie wskaźniki w normie. Tak trzymaj, burmistrzu!",pri:"low",read:false});
  return msgs;
}
