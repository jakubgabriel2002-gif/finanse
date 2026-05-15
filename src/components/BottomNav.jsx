import React from 'react';

const SPD_ICONS = {0:"⏸",1:"▶️",2:"⏩",3:"⚡"};
const SPD_LABELS = {0:"PAUZA",1:"1x",2:"2x",3:"3x"};

export default function BottomNav({ tab, setTab, speed, cycleSpeed, unread }) {
  const tabs = [
    {id:"map",icon:"🗺️",label:"MAPA"},
    {id:"build",icon:"🏗️",label:"BUDUJ"},
    {id:"townhall",icon:"🏛️",label:"RATUSZ"},
    {id:"inbox",icon:"📬",label:"SKRZYNKA",badge:unread},
    {id:"stats",icon:"📊",label:"STATS"},
  ];

  return (
    <div id="bottomnav">
      {tabs.map(t => (
        <button key={t.id} className={`nbtn ${tab===t.id?'act':''}`}
          onPointerDown={(e)=>{e.stopPropagation();setTab(t.id);}}>
          <span className="ni">{t.icon}</span>
          <span className="nl">{t.label}</span>
          {t.badge > 0 && <span className="bdg">{t.badge}</span>}
        </button>
      ))}
      <button className="nbtn" onPointerDown={(e)=>{e.stopPropagation();cycleSpeed();}}>
        <span className="ni">{SPD_ICONS[speed]}</span>
        <span className="nl">{SPD_LABELS[speed]}</span>
      </button>
    </div>
  );
}
