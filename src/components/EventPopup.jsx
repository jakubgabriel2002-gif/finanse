import React from 'react';
import { fm } from '../gameLogic.js';

export default function EventPopup({ event }) {
  if (!event) return null;

  return (
    <div
      id="ev-popup"
      style={{
        background: event.tp === 'ok'
          ? 'rgba(0,30,15,0.97)'
          : 'rgba(30,0,0,0.97)',
        border: `1px solid ${
          event.tp === 'ok'
            ? 'rgba(0,232,122,0.5)'
            : 'rgba(255,61,90,0.5)'
        }`,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
        {event.t}
      </div>

      <div style={{ fontSize: 10, color: '#9ab', marginBottom: 6 }}>
        {event.m}
      </div>

      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: event.b >= 0 ? '#00e87a' : '#ff3d5a',
        }}
      >
        {fm(event.b)} zł
      </div>
    </div>
  );
}