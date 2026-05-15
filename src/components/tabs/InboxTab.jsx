import React from 'react';

export default function InboxTab({ G, onMarkRead }) {
  return (
    <div className="inner">
      <div className="tab-title" style={{display:"flex",alignItems:"center",gap:8}}>
        📬 Skrzynka Odbiorcza
        {G.inbox.some(m => !m.read) && (
          <button
            onPointerDown={() => onMarkRead('all')}
            style={{fontSize:10,padding:"3px 8px",border:"1px solid rgba(0,180,255,0.3)",borderRadius:6,background:"rgba(0,180,255,0.08)",color:"#00b4ff",cursor:"pointer"}}>
            Oznacz wszystkie jako przeczytane
          </button>
        )}
      </div>

      {G.inbox.length === 0 && (
        <div style={{textAlign:"center",color:"#3a5f82",fontSize:13,marginTop:40}}>Brak wiadomości</div>
      )}

      {G.inbox.map((m,i) => (
        <div key={`${m.id}-${i}`}
          className="imsg"
          style={{
            border:`1px solid ${m.pri==='high'?'rgba(255,61,90,0.35)':m.pri==='med'?'rgba(255,215,0,0.25)':'rgba(0,180,255,0.2)'}`,
            opacity: m.read ? 0.65 : 1,
            cursor: 'pointer',
          }}
          onPointerDown={() => onMarkRead(i)}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
            <span style={{fontSize:18}}>{m.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:m.pri==='high'?'#ff3d5a':m.pri==='med'?'#ffd700':'#c8dff5',display:"flex",alignItems:"center",gap:6}}>
                {m.sub}
                {!m.read && <span style={{width:7,height:7,borderRadius:"50%",background:"#00b4ff",display:"inline-block",flexShrink:0}}/>}
              </div>
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
