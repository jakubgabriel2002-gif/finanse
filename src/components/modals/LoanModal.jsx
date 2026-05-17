import React from 'react';
import { fa } from '../../gameLogic.js';

export default function LoanModal({ amount, onConfirm, onCancel }) {
  if (!amount) return null;

  return (
    <div className="modal-bg">
      <div className="mbox">
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
          🏦 Pożyczka Bankowa
        </div>

        <div style={{ fontSize: 12, color: '#6a90b8', marginBottom: 5 }}>
          Kwota: <strong style={{ color: '#ffd700' }}>{fa(amount)} zł</strong>
        </div>

        <div style={{ fontSize: 11, color: '#ff9944', marginBottom: 12 }}>
          Rata: -{fa(Math.floor(amount * 0.08 / 12))} zł/mie · 24 miesiące
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              border: '1px solid rgba(255,215,0,0.4)',
              borderRadius: 8,
              background: 'rgba(255,215,0,0.1)',
              color: '#ffd700',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            ✅ Zaciągnij
          </button>

          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              border: '1px solid rgba(255,61,90,0.3)',
              borderRadius: 8,
              background: 'rgba(255,61,90,0.06)',
              color: '#ff3d5a',
              fontSize: 13,
            }}
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  );
}