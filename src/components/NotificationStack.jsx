import React from 'react';

export default function NotificationStack({ notifs }) {
  return (
    <div id="notifs">
      {notifs.map(n => (
        <div
          key={n.id}
          className="notif"
          style={{
            border: `1px solid ${
              n.type === 'ok'
                ? 'rgba(0,232,122,0.5)'
                : n.type === 'err'
                  ? 'rgba(255,61,90,0.5)'
                  : 'rgba(255,215,0,0.5)'
            }`,
          }}
        >
          {n.msg}
        </div>
      ))}
    </div>
  );
}