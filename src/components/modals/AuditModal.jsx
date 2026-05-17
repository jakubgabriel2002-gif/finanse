import React from 'react';

export default function AuditModal({ open, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="modal-bg">
      <div className="mbox">
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
          🔍 Kontrola Skarbowa
        </div>

        <div style={{ fontSize: 12, color: '#6a90b8', marginBottom: 12 }}>
          Koszt: 500 zł. Szansa na wykrycie firm unikających podatków.
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
              border: '1px solid rgba(255,180,0,0.4)',
              borderRadius: 8,
              background: 'rgba(255,180,0,0.1)',
              color: '#ffb400',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            🔍 Przeprowadź (-500 zł)
          </button>

          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            style={{
              padding: '10px 14px',
              border: '1px solid rgba(255,61,90,0.3)',
              borderRadius: 8,
              background: 'rgba(255,61,90,0.06)',
              color: '#ff3d5a',
              fontSize: 13,
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}