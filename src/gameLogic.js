import { BD } from './data.js';
import { calcPower } from './game/resources/power.js';
import { calcWater } from './game/resources/water.js';

export const nR = (x,y,r) => r.has(`${x},${y}`)||r.has(`${x-1},${y}`)||r.has(`${x+1},${y}`)||r.has(`${x},${y-1}`)||r.has(`${x},${y+1}`);
export const nT = (x,y,bs) => bs.some(b=>(b.type==="bus"||b.type==="tram"||b.type==="metro")&&!b.building&&Math.abs(b.x-x)<=3&&Math.abs(b.y-y)<=3);

export const fa = n => Math.abs(Math.round(n)).toLocaleString('pl');
export const fm = n => (n>=0?'+':'-')+fa(n);
export function ft(s){if(s<=0)return'✓';if(s<60)return`${s}s`;if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/86400)}d`;return`${Math.floor(s/86400)}d`;}

const POWER_DEPENDENT_TYPES = [
  'factory',
  'shop',
  'office',
  'bank',
  'hospital',
  'school',
  'waterplant',
  'sewage',
  'police',
  'fire',
  'bus',
  'tram',
  'metro',
];

const WATER_DEPENDENT_TYPES = [
  'apartment',
  'house',
  'factory',
  'shop',
  'office',
  'bank',
  'hospital',
  'school',
  'police',
  'fire',
  'bus',
  'tram',
  'metro',
];

function getPowerMultiplier(power) {
  if (!power || power.totalDemand <= 0) return 1;
  if (power.ok) return 1;

  return Math.max(0.25, (power.serviceEfficiency || 0) / 100);
}

function getPowerFeeMultiplier(power) {
  if (!power || power.totalDemand <= 0) return 1;
  if (power.ok) return 1;

  return Math.max(0, Math.min(1, (power.serviceEfficiency || 0) / 100));
}

function getWaterMultiplier(water) {
  if (!water || water.totalDemand <= 0) return 1;
  if (water.ok) return 1;

  return Math.max(0.3, (water.serviceEfficiency || 0) / 100);
}

function getWaterFeeMultiplier(water) {
  if (!water || water.totalDemand <= 0) return 1;
  if (water.ok) return 1;

  return Math.max(0, Math.min(1, (water.serviceEfficiency || 0) / 100));
}

function isPowerDependent(type) {
  return POWER_DEPENDENT_TYPES.includes(type);
}

function isWaterDependent(type) {
  return WATER_DEPENDENT_TYPES.includes(type);
}

function getBuildingEnergyMultiplier(building, power, globalPowerMultiplier) {
  if (!isPowerDependent(building.type)) return 1;

  if (power?.disconnectedUIDs?.includes(building.uid)) {
    return 0.2;
  }

  return globalPowerMultiplier;
}

function getBuildingWaterMultiplier(building, water, globalWaterMultiplier) {
  if (!isWaterDependent(building.type)) return 1;

  if (water?.disconnectedUIDs?.includes(building.uid)) {
    return 0.35;
  }

  return globalWaterMultiplier;
}

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

export function calcStats(blds, roads, loan, fees, weather, powerLines = new Set(), waterPipes = new Set()) {
  let inc=0, exp=0, pop=0, co2=0, jobs=0;
  const h = {housing:0, jobs:0, edu:0, env:0, services:0};
  const act = blds.filter(b => !b.building);

  const rawPower = calcPower(act, weather, powerLines);
  const powerMultiplier = getPowerMultiplier(rawPower);
  const powerFeeMultiplier = getPowerFeeMultiplier(rawPower);

  const power = {
    ...rawPower,
    multiplier: powerMultiplier,
    efficiency: Math.round(powerMultiplier * 100),
    feeMultiplier: powerFeeMultiplier,
    feeEfficiency: Math.round(powerFeeMultiplier * 100),
  };

  const rawWater = calcWater(act, waterPipes);
  const waterMultiplier = getWaterMultiplier(rawWater);
  const waterFeeMultiplier = getWaterFeeMultiplier(rawWater);

  const water = {
    ...rawWater,
    multiplier: waterMultiplier,
    efficiency: Math.round(waterMultiplier * 100),
    feeMultiplier: waterFeeMultiplier,
    feeEfficiency: Math.round(waterFeeMultiplier * 100),
  };

  act.forEach(b => {
    const d = BD[b.type]; if(!d) return;
    const ok = d.nr || nR(b.x,b.y,roads) || nT(b.x,b.y,act);
    const roadMultiplier = ok ? 1 : 0.05;
    const waterPopMultiplier = water?.disconnectedUIDs?.includes(b.uid) ? 0.35 : 1;

    exp += d.exp * b.lv;

    pop += d.pop * b.lv * roadMultiplier * waterPopMultiplier;
    co2 += d.co2 * b.lv * (b.co2f ? 0.6 : 1);

    if(d.jobs > 0) jobs += d.jobs * b.lv;

    Object.entries(d.hap).forEach(([k,v]) => { h[k] = (h[k]||0) + v; });
  });

  if(weather?.id === 'rainy') h.env = (h.env||0) - 5;
  if(weather?.id === 'storm') { h.env = (h.env||0) - 10; h.housing = (h.housing||0) - 5; }

  const workers = Math.floor(pop * 0.6);
  const er = jobs > 0 ? Math.min(workers, jobs) / jobs : 1;

  act.forEach(b => {
    const d = BD[b.type]; if(!d) return;
    const ok = d.nr || nR(b.x,b.y,roads) || nT(b.x,b.y,act);
    const roadMultiplier = ok ? 1 : 0.05;
    const jobMultiplier = ['factory','office','shop','bank'].includes(b.type) ? er : 1;
    const energyMultiplier = getBuildingEnergyMultiplier(b, power, powerMultiplier);
    const buildingWaterMultiplier = getBuildingWaterMultiplier(b, water, waterMultiplier);

    inc += d.inc * b.lv * roadMultiplier * jobMultiplier * energyMultiplier * buildingWaterMultiplier;
  });

  const ri = Math.floor(pop * (fees?.rent  || 0) / 10);

  const wiBase = Math.floor(pop * (fees?.water || 0) / 10);
  const wi = Math.floor(wiBase * waterFeeMultiplier);

  const piBase = Math.floor(pop * (fees?.power || 0) / 10);
  const pi = Math.floor(piBase * powerFeeMultiplier);

  const transitCount = act.filter(b => ['bus','tram','metro'].includes(b.type)).length;
  const ti = Math.floor(pop * (fees?.transit || 0) / 10) * Math.min(transitCount, 5);

  const si = Math.floor(pop * (fees?.sewage || 0) / 10);

  inc += ri + wi + pi + ti + si;

  if((fees?.rent    || 0) > 5) h.housing  = (h.housing||0)  - Math.floor((fees.rent  - 5) / 2);
  if((fees?.water   || 0) > 5) h.services = (h.services||0) - Math.floor((fees.water - 5) / 3);
  if((fees?.power   || 0) > 5) h.services = (h.services||0) - Math.floor((fees.power - 5) / 3);
  if((fees?.transit || 0) > 5) h.services = (h.services||0) - Math.floor((fees.transit-5) / 4);
  if((fees?.sewage  || 0) > 5) h.services = (h.services||0) - Math.floor((fees.sewage - 5) / 4);

  if(power.deficit > 0 && (fees?.power || 0) > 0) {
    const missingPowerFeePercent = 100 - power.feeEfficiency;
    const unfairPowerFeePenalty = Math.ceil(((fees.power || 0) * missingPowerFeePercent) / 25);

    h.services = (h.services||0) - unfairPowerFeePenalty;
    h.housing = (h.housing||0) - Math.ceil(unfairPowerFeePenalty / 2);
  }

  if(water.deficit > 0 && (fees?.water || 0) > 0) {
    const missingWaterFeePercent = 100 - water.feeEfficiency;
    const unfairWaterFeePenalty = Math.ceil(((fees.water || 0) * missingWaterFeePercent) / 20);

    h.services = (h.services||0) - unfairWaterFeePenalty;
    h.housing = (h.housing||0) - Math.ceil(unfairWaterFeePenalty / 2);
  }

  if(power.gridDeficit > 0) {
    h.housing = (h.housing||0) - Math.floor(power.gridDeficit / 5);
    h.services = (h.services||0) - Math.floor(power.gridDeficit / 8);
    h.jobs = (h.jobs||0) - Math.floor(power.gridDeficit / 10);
  }

  if(power.disconnectedCount > 0) {
    h.services = (h.services||0) - power.disconnectedCount * 3;
    h.housing = (h.housing||0) - Math.ceil(power.disconnectedCount / 2);
    h.jobs = (h.jobs||0) - Math.ceil(power.disconnectedCount / 2);
  }

  if(power.inactivePowerLineCount > 0) {
    h.services = (h.services||0) - Math.ceil(power.inactivePowerLineCount / 4);
  }

  if(water.gridDeficit > 0) {
    h.housing = (h.housing||0) - Math.floor(water.gridDeficit / 4);
    h.services = (h.services||0) - Math.floor(water.gridDeficit / 7);
    h.env = (h.env||0) - Math.floor(water.gridDeficit / 12);
  }

  if(water.disconnectedCount > 0) {
    h.services = (h.services||0) - water.disconnectedCount * 4;
    h.housing = (h.housing||0) - water.disconnectedCount * 2;
    h.env = (h.env||0) - Math.ceil(water.disconnectedCount / 2);
  }

  if(water.inactiveWaterPipeCount > 0) {
    h.services = (h.services||0) - Math.ceil(water.inactiveWaterPipeCount / 4);
  }

  const wt = water.legacyWt;

  if(wt > 0) h.housing = (h.housing||0) - Math.floor(wt / 5);

  exp += loan ? Math.floor(loan.amt * loan.rate / 12) : 0;

  return {
    inc: Math.floor(inc), exp: Math.floor(exp), pop: Math.floor(pop),
    co2: Math.floor(co2), net: Math.floor(inc - exp),
    jobs, workers, er: Math.round(er * 100),

    power,
    water,

    pw: power.legacyPw,
    pwOk: power.ok,

    wt: Math.floor(wt),
    wtOk: water.ok,

    ri, wi, pi, ti, si,
    wiBase,
    piBase,

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

  if(s.power?.inactivePowerLineCount > 0)
    msgs.push({
      id:"pwinactive",
      icon:"🔌",
      from:"Operator sieci",
      sub:"Nieaktywne linie energetyczne",
      body:`Masz ${s.power.inactivePowerLineCount} kaf. linii, które nie są połączone ze źródłem energii. Połącz je z elektrownią, farmą solarną albo wiatrakiem.`,
      pri:"med",
      read:false
    });

  if(s.power?.disconnectedCount > 0)
    msgs.push({
      id:"pwnet",
      icon:"🔌",
      from:"Operator sieci",
      sub:"Budynki poza siecią prądu",
      body:`Odcięte budynki: ${s.power.disconnectedCount}. Przeciągnij linie energetyczne bliżej tych budynków. Zasięg linii: ${s.power.powerLineRange || 3} kratki.`,
      pri:"high",
      read:false
    });

  if(!s.pwOk && s.pw > 10)
    msgs.push({
      id:"pw",
      icon:"⚡",
      from:"Mieszkańcy",
      sub:"Brak prądu!",
      body:`Problem energii: ${s.pw} j. Wydajność systemu: ${s.power?.efficiency || 35}%. Zbuduj źródła energii albo przeciągnij linie energetyczne.`,
      pri:"high",
      read:false
    });

  if(!s.pwOk && s.power?.efficiency < 80)
    msgs.push({
      id:"pweff",
      icon:"🏭",
      from:"Przedsiębiorcy",
      sub:"Produkcja spada przez energię",
      body:`Firmy i usługi zależne od prądu pracują tylko na ${s.power.efficiency}%. Dochody są obniżone przez braki energii lub brak podłączenia do sieci.`,
      pri:"high",
      read:false
    });

  if(!s.pwOk && (G.fees?.power || 0) > 0)
    msgs.push({
      id:"pwrfee",
      icon:"💸",
      from:"Mieszkańcy",
      sub:"Płacimy za niestabilny prąd",
      body:`Opłata za prąd działa tylko na ${s.power?.feeEfficiency || 0}%. Realny dochód: ${fa(s.pi)} zł zamiast ${fa(s.piBase || 0)} zł/mie.`,
      pri:"med",
      read:false
    });

  if(s.water?.inactiveWaterPipeCount > 0)
    msgs.push({
      id:"wtinactive",
      icon:"💧",
      from:"Wodociągi miejskie",
      sub:"Nieaktywne rury wod-kan",
      body:`Masz ${s.water.inactiveWaterPipeCount} kaf. rur, które nie są połączone z wodociągami albo oczyszczalnią. Martwe rury nie obsługują budynków.`,
      pri:"med",
      read:false
    });

  if(s.water?.disconnectedCount > 0)
    msgs.push({
      id:"wtnet",
      icon:"🚱",
      from:"Wodociągi miejskie",
      sub:"Budynki bez dostępu do wody",
      body:`Bez wody: ${s.water.disconnectedCount} bud. Przeciągnij rury wod-kan bliżej tych budynków. Zasięg rur: ${s.water.waterPipeRange || 3} kratki.`,
      pri:"high",
      read:false
    });

  if(!s.wtOk && s.wt > 10)
    msgs.push({
      id:"wt",
      icon:"💧",
      from:"Mieszkańcy",
      sub:"Problem z wodą!",
      body:`Problem wody: ${s.wt} j. Wydajność systemu: ${s.water?.efficiency || 35}%. Zbuduj wodociągi, oczyszczalnię albo przeciągnij rury wod-kan.`,
      pri:"high",
      read:false
    });

  if(!s.wtOk && (G.fees?.water || 0) > 0)
    msgs.push({
      id:"wtfee",
      icon:"💸",
      from:"Mieszkańcy",
      sub:"Płacimy za słabą wodę",
      body:`Opłata za wodę działa tylko na ${s.water?.feeEfficiency || 0}%. Realny dochód: ${fa(s.wi)} zł zamiast ${fa(s.wiBase || 0)} zł/mie.`,
      pri:"med",
      read:false
    });

  if(s.er < 50 && s.jobs > 20)
    msgs.push({
      id:"emp",
      icon:"💼",
      from:"Pracodawcy",
      sub:"Brak pracowników",
      body:`Firmy na ${s.er}% wydajności. Buduj więcej mieszkań!`,
      pri:"med",
      read:false
    });

  if(s.co2 > 60)
    msgs.push({
      id:"co2",
      icon:"🏭",
      from:"Ekolodzy",
      sub:"Alarmujące CO₂!",
      body:`Emisja ${s.co2} j. Zainstaluj filtry CO₂, buduj parki, wiatraki, oczyszczalnię!`,
      pri:"high",
      read:false
    });

  if(s.sat.housing < 35)
    msgs.push({
      id:"hs",
      icon:"🏠",
      from:"Mieszkańcy",
      sub:"Kryzys mieszkaniowy",
      body:"Dramatyczny brak mieszkań! Buduj bloki i domy.",
      pri:"high",
      read:false
    });

  if(polc === 0 && s.pop > 100)
    msgs.push({
      id:"pol",
      icon:"🚔",
      from:"Rada",
      sub:"Brak policji!",
      body:"Przestępczość rośnie. Zbuduj komisariat!",
      pri:"high",
      read:false
    });

  if(firc === 0 && G.buildings.length > 10)
    msgs.push({
      id:"fir",
      icon:"🚒",
      from:"Rada",
      sub:"Brak straży pożarnej",
      body:"Ryzyko pożarów bardzo wysokie!",
      pri:"med",
      read:false
    });

  if(avgH < 40)
    msgs.push({
      id:"hap",
      icon:"😤",
      from:"Mieszkańcy",
      sub:"Niezadowolenie rośnie",
      body:`Zadowolenie ${avgH}%. Grożą zamieszki!`,
      pri:"high",
      read:false
    });

  if(G.taxRate > 22)
    msgs.push({
      id:"tax",
      icon:"💰",
      from:"Podatnicy",
      sub:"Podatki za wysokie!",
      body:`Stawka ${G.taxRate}% odpędza firmy!`,
      pri:"med",
      read:false
    });

  if(G.loan)
    msgs.push({
      id:"bank",
      icon:"🏦",
      from:"Bank",
      sub:"Pożyczka aktywna",
      body:`Saldo: ${fa(G.loan.amt)} zł · Rata: ${fa(Math.floor(G.loan.amt*G.loan.rate/12))} zł/mie · Pozostało: ${G.loan.months} mies.`,
      pri:"low",
      read:false
    });

  if(((G.fees?.rent||0)>8)||((G.fees?.water||0)>8)||((G.fees?.power||0)>8)||((G.fees?.transit||0)>8))
    msgs.push({
      id:"fees",
      icon:"💸",
      from:"Mieszkańcy",
      sub:"Wysokie opłaty!",
      body:"Opłaty są za wysokie. Mieszkańcy rozważają wyprowadzkę!",
      pri:"med",
      read:false
    });

  if(msgs.length === 0)
    msgs.push({
      id:"ok",
      icon:"✅",
      from:"Rada Miasta",
      sub:"Miasto funkcjonuje prawidłowo",
      body:"Wszystkie wskaźniki w normie. Tak trzymaj, burmistrzu!",
      pri:"low",
      read:false
    });

  return msgs;
}