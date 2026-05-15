import React from 'react';

export default function InboxTab({ G }) {
  return (
    <div className="inner">
      <div className="tab-title">📬 Skrzynka Odbiorcza</div>
      {G.inbox.map((m,i) => (
        <div key={`${m.id}-${i}`} className="imsg"
          style={{border:`1px solid ${m.pri==='high'?'rgba(255,61,90,0.35)':m.pri==='med'?'rgba(255,215,0,0.25)':'rgba(0,180,255,0.2)'}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
            <span style={{fontSize:18}}>{m.icon}</span>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:m.pri==='high'?'#ff3d5a':m.pri==='med'?'#ffd700':'#c8dff5'}}>{m.sub}</div>
              <div style={{fontSize:10,color:"#3a5f82"}}>{m.from}</div>
            </div>
          </div>
          <div style={{fontSize:11,color:"#6a90b8",lineHeight:1.5}}>{m.body}</div>
        </div>
      ))}

      {G.news.length > 0 && (
        <div style={{marginTop:16}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:8,color:"#ffd700"}}>📰 Gazeta Miejska</div>
          {G.news.map((n,i) => (
            <div key={i} className="nitem">
              <div style={{fontSize:12,fontWeight:700,color:n.tp==='ok'?'#00e87a':'#ff3d5a',marginBottom:2}}>{n.t}</div>
              <div style={{fontSize:10,color:"#6a90b8"}}>{n.m}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
