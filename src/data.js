export const TILE = 54;
export const ROAD_COST = 200;
export const BT = [15, 60, 300, 1800, 21600, 86400];
export const BL = ["15s", "1m", "5m", "30m", "6h", "24h"];
export const MS = ["STY","LUT","MAR","KWI","MAJ","CZE","LIP","SIE","WRZ","PAŹ","LIS","GRU"];
export const GS = lv => 20 + lv * 4;
export const CX = 12;
export const CY = 11;

export const TC = {0:"#2a5218",1:"#1c3a10",2:"#163450",3:"#7a6a48",6:"#142e0e"};
export const TB = {0:"#346422",1:"#223e14",2:"#1a3e60",3:"#8a7a58",6:"#182e10"};

function buildTerrain(n) {
  const t = Array(n).fill(null).map(() => Array(n).fill(0));
  for(let y=0;y<4;y++) for(let x=0;x<6;x++) t[y][x]=2;
  for(let y=0;y<2;y++) for(let x=0;x<9;x++) t[y][x]=2;
  [[4,0],[4,1],[4,2],[3,5],[3,6],[4,5],[4,6]].forEach(([y,x])=>{if(y<n&&x<n)t[y][x]=3;});
  const fr = Math.floor(n*0.72);
  for(let y=fr;y<n;y++) for(let x=fr;x<n;x++) t[y][x]=6;
  for(let y=Math.floor(n*0.56);y<Math.floor(n*0.74);y++) for(let x=0;x<5;x++) t[y][x]=1;
  return t;
}
export const TR = {24:buildTerrain(24),28:buildTerrain(28),32:buildTerrain(32)};

export const LIM = {
  1:{apartment:4,house:6,factory:2,shop:4,office:1,hospital:1,school:1,park:3,solar:2,windmill:2,powerplant:1,waterplant:1,police:1,fire:1,bus:2,metro:0,bank:0,townhall:1,sewage:1,tram:0},
  2:{apartment:10,house:14,factory:5,shop:8,office:3,hospital:2,school:3,park:6,solar:5,windmill:4,powerplant:2,waterplant:2,police:2,fire:2,bus:4,metro:1,bank:1,townhall:1,sewage:2,tram:2},
  3:{apartment:30,house:40,factory:15,shop:20,office:10,hospital:5,school:8,park:12,solar:12,windmill:8,powerplant:4,waterplant:4,police:5,fire:5,bus:8,metro:3,bank:3,townhall:1,sewage:4,tram:5},
};

export const BD = {
  townhall: {n:"Ratusz",       e:"🏛️",c:"Zarządzanie",    cost:3000, inc:0,   exp:200, pop:0,  jobs:5,  co2:2,  pw:2,   wt:2,    hap:{services:20,housing:5},  ml:3,nr:true, cl:["#7a5a10","#9a7218","#ba8a20"]},
  apartment:{n:"Blok",         e:"🏢",c:"Mieszkalne",      cost:5000, inc:280, exp:80,  pop:80, jobs:0,  co2:4,  pw:8,   wt:10,   hap:{housing:8},              ml:6,nr:false,cl:["#1e3a6e","#264880","#2e5892","#3668a4","#3e78b6","#4688c8"]},
  house:    {n:"Dom",          e:"🏠",c:"Mieszkalne",      cost:2000, inc:100, exp:30,  pop:25, jobs:0,  co2:2,  pw:3,   wt:4,    hap:{housing:12,env:-2},      ml:5,nr:false,cl:["#5a2a10","#6a3414","#7a3e18","#8a481c","#9a5220"]},
  factory:  {n:"Fabryka",      e:"🏭",c:"Przemysł",        cost:8000, inc:800, exp:250, pop:0,  jobs:40, co2:18, pw:12,  wt:8,    hap:{env:-12,jobs:20},        ml:6,nr:false,cl:["#3a2010","#4a2c14","#5a3818","#6a441c","#7a5020","#8a5c24"]},
  shop:     {n:"Sklep",        e:"🏪",c:"Komercyjne",      cost:3500, inc:220, exp:70,  pop:0,  jobs:15, co2:3,  pw:5,   wt:3,    hap:{jobs:10,services:8},     ml:5,nr:false,cl:["#6a1a10","#7a2414","#8a2e18","#9a381c","#aa4220"]},
  office:   {n:"Biurowiec",    e:"🏙️",c:"Komercyjne",      cost:15000,inc:1100,exp:400, pop:0,  jobs:60, co2:10, pw:12,  wt:6,    hap:{jobs:25,edu:5},          ml:6,nr:false,cl:["#0a2a3a","#0e3448","#123e56","#164864","#1a5272","#1e5c80"]},
  hospital: {n:"Szpital",      e:"🏥",c:"Usługi",          cost:12000,inc:0,   exp:600, pop:0,  jobs:30, co2:6,  pw:10,  wt:15,   hap:{services:35,housing:10}, ml:4,nr:false,cl:["#1a1a3e","#222248","#2a2a52","#32325c"]},
  school:   {n:"Szkoła",       e:"🏫",c:"Edukacja",        cost:6000, inc:0,   exp:280, pop:0,  jobs:20, co2:3,  pw:4,   wt:3,    hap:{edu:30,jobs:5},          ml:5,nr:false,cl:["#3a3a10","#4a4a14","#5a5a18","#6a6a1c","#7a7a20"]},
  park:     {n:"Park",         e:"🌳",c:"Zieleń",          cost:1000, inc:0,   exp:50,  pop:0,  jobs:3,  co2:-15,pw:0,   wt:2,    hap:{env:20,housing:5,services:5},ml:4,nr:true,cl:["#0a2e0a","#0e380e","#124212","#164c16"]},

  solar:    {n:"Farma solarna",e:"☀️",c:"Energia",         cost:10500,inc:220, exp:45,  pop:0,  jobs:5,  co2:-32,pw:-40, wt:0,    hap:{env:20},                 ml:5,nr:false,cl:["#1a1a0a","#22220e","#2a2a12","#323216","#3a3a1a"]},
  windmill: {n:"Wiatrak",      e:"💨",c:"Energia",         cost:9000, inc:170, exp:40,  pop:0,  jobs:3,  co2:-24,pw:-30, wt:0,    hap:{env:15},                 ml:4,nr:false,cl:["#1a2a3a","#223040","#2a3848","#324050"]},
  powerplant:{n:"Elektrownia", e:"⚡",c:"Energia",         cost:26000,inc:650, exp:850, pop:0,  jobs:30, co2:45, pw:-180,wt:25,   hap:{env:-12},                ml:3,nr:false,cl:["#2a1a0a","#3a2414","#4a2e1e"]},

  waterplant:{n:"Wodociągi",   e:"💧",c:"Infrastruktura",  cost:22000,inc:0,   exp:650, pop:0,  jobs:18, co2:4,  pw:8,   wt:-240, hap:{services:18,housing:6}, ml:3,nr:false,cl:["#0a1a3a","#102040","#182848"]},
  sewage:   {n:"Oczyszczalnia",e:"🏗️",c:"Infrastruktura", cost:23000,inc:0,   exp:700, pop:0,  jobs:22, co2:-18,pw:10,  wt:-210, hap:{env:18,services:10,housing:5},ml:3,nr:false,cl:["#1a2a1a","#1e3020","#223826"]},

  police:   {n:"Policja",      e:"🚔",c:"Usługi",          cost:5000, inc:0,   exp:380, pop:0,  jobs:20, co2:4,  pw:3,   wt:2,    hap:{services:15,housing:8}, ml:4,nr:false,cl:["#0a0a2a","#121232","#1a1a3a","#222242"]},
  fire:     {n:"Straż",        e:"🚒",c:"Usługi",          cost:6000, inc:0,   exp:420, pop:0,  jobs:18, co2:3,  pw:3,   wt:5,    hap:{services:12,housing:6}, ml:4,nr:false,cl:["#3a0a0a","#4a1010","#5a1818","#6a2020"]},
  bus:      {n:"Przystanek",   e:"🚌",c:"Transport",       cost:3000, inc:100, exp:150, pop:0,  jobs:8,  co2:5,  pw:1,   wt:0,    hap:{services:10,jobs:8},    ml:4,nr:false,cl:["#1a2a1a","#223022","#2a382a","#324430"]},
  tram:     {n:"Tramwaj",      e:"🚃",c:"Transport",       cost:12000,inc:250, exp:350, pop:0,  jobs:12, co2:-3, pw:6,   wt:0,    hap:{services:18,jobs:12},   ml:3,nr:false,cl:["#1a1a2a","#222238","#2a2a46"]},
  metro:    {n:"Metro",        e:"🚇",c:"Transport",       cost:25000,inc:300, exp:800, pop:0,  jobs:20, co2:-5, pw:8,   wt:0,    hap:{services:20,jobs:15},   ml:2,nr:false,cl:["#0a1a2a","#122030"]},
  bank:     {n:"Bank",         e:"🏦",c:"Finanse",         cost:18000,inc:800, exp:300, pop:0,  jobs:30, co2:3,  pw:4,   wt:2,    hap:{services:10,jobs:10},   ml:3,nr:false,cl:["#1a1a10","#222218","#2a2a20"]},
};

export const WEATHERS = [
  {id:"sunny", icon:"☀️",  name:"Słonecznie", sm:1.5},
  {id:"cloudy",icon:"⛅", name:"Pochmurnie", sm:0.7},
  {id:"rainy", icon:"🌧️", name:"Deszcz",     sm:0.4},
  {id:"storm", icon:"⛈️", name:"Burza",      sm:0.1},
];

export const EVTS = [
  {t:"🎉 Festiwal Miejski",   m:"Tysiące turystów! Wzrost dochodów.",  b:3000, tp:"ok"},
  {t:"📈 Boom Inwestycyjny",  m:"Korporacja otwiera biuro!",           b:5000, tp:"ok"},
  {t:"🌿 Grant Ekologiczny",  m:"Rząd nagradza niskie emisje.",        b:2500, tp:"ok"},
  {t:"🏆 Nagroda Miasta",     m:"NeoCity – najlepsze miasto regionu!", b:4000, tp:"ok"},
  {t:"💝 Darowizna Sponsora", m:"Lokalny biznesmen wspiera miasto.",   b:6000, tp:"ok"},
  {t:"🌊 Powódź",             m:"Opady uszkodziły infrastrukturę.",    b:-2000,tp:"err"},
  {t:"💻 Cyberatak",          m:"Hakerzy zaatakowali systemy.",        b:-1500,tp:"err"},
  {t:"⚡ Strajk",             m:"Fabryki wstrzymały produkcję.",       b:-1000,tp:"err"},
  {t:"🦠 Epidemia Grypy",     m:"Epidemia ogranicza aktywność.",       b:-500, tp:"err"},
  {t:"🔥 Pożar w dzielnicy",  m:"Straty w infrastrukturze.",          b:-1200,tp:"err"},
];

export const TSTEPS = [
  {
    title:"Witaj w NeoCity! 🏙️",
    body:"Jesteś burmistrzem pustego terenu.\nZbuduj miasto od zera!\n\nZacznijmy od dróg — bez nich budynki zarabiają tylko 5%.",
    btn:"Buduj drogi →",
    action:"road",
  },
  {
    title:"🛣️ Zbuduj sieć dróg",
    body:"Postaw 20 kafelków drogi.\n\nNie musisz robić idealnego układu — ważne, żeby miasto miało bazową sieć połączeń.\n\nGdy licznik dobije do 20/20, kliknij przycisk i przejdziesz dalej.",
    btn:"Gotowe — przejdź dalej →",
    action:"finish_roads",
    waitForRoads:20,
  },
  {
    title:"🏛️ Czas na Ratusz!",
    body:"Ratusz to centrum zarządzania miastem.\n\n⚠️ Możesz go postawić TYLKO JEDEN raz!\nWybierz miejsce blisko drogi.",
    btn:"Buduj Ratusz →",
    action:"townhall",
    req:{type:"townhall",n:1},
  },
  {
    title:"🏢 Dodaj mieszkańców",
    body:"Postaw 2 bloki mieszkalne obok drogi.\nMieszkańcy = siła robocza + podatki!",
    btn:"Buduj bloki →",
    action:"apartment",
    req:{type:"apartment",n:2},
  },
  {
    title:"🏠 Dom jednorodzinny",
    body:"Postaw 1 dom.\nDaje mniej mieszkańców ale wyższe zadowolenie.",
    btn:"Buduj dom →",
    action:"house",
    req:{type:"house",n:1},
  },
  {
    title:"🏭 Przemysł",
    body:"Postaw 1 fabrykę — główne źródło dochodu.\nMożesz później zainstalować filtry CO₂!",
    btn:"Buduj fabrykę →",
    action:"factory",
    req:{type:"factory",n:1},
  },
  {
    title:"🏥 Opieka zdrowotna",
    body:"Szpital mocno podnosi zadowolenie mieszkańców.\nBez niego będą niezadowoleni!",
    btn:"Buduj szpital →",
    action:"hospital",
    req:{type:"hospital",n:1},
  },
  {
    title:"🎉 Gotowe!",
    body:"Twoje miasto jest gotowe!\n\n✅ Drogi = pełny dochód z budynków\n✅ Ratusz = podatki, polityki, kontrole\n✅ Prąd = źródła energii + linie energetyczne\n✅ Woda = wodociągi + rury wod-kan\n✅ Kanalizacja = oczyszczalnia + rury wod-kan\n✅ Klikaj budynki = panele/filtry\n\nPowodzenia, burmistrzu!",
    btn:"Zaczynam grę! 🚀",
    action:"finish",
  },
];

export const POLICIES = [
  {id:"green", icon:"🌿",name:"Bonus ekologiczny",   desc:"Dotacje dla zielonych inwestycji",      cost:500},
  {id:"work",  icon:"💼",name:"Program zatrudnienia", desc:"Subsydia dla pracodawców",              cost:800},
  {id:"night", icon:"🌙",name:"Życie nocne",          desc:"+20% dochodu ze sklepów",              cost:300},
  {id:"trans", icon:"🚌",name:"Darmowy transport",    desc:"Bezpłatna komunikacja dla wszystkich", cost:600},
];