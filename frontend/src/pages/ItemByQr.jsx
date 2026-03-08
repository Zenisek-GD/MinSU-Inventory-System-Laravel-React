import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function ItemByQrPage() {
  const { qr } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [item, setItem] = useState(null);

  useEffect(() => {
    let abort = false;
    async function run() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/v1/items/qr/${encodeURIComponent(qr)}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!abort) setItem(data);
      } catch (e) {
        if (!abort) setError(e.message || String(e));
      } finally {
        if (!abort) setLoading(false);
      }
    }
    if (qr) run();
    return () => { abort = true; };
  }, [qr]);

  return (
    <div style={{ padding: 16 }}>
      <h2>Item by QR</h2>
      <p>QR: {qr}</p>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {item && (
        <div>
          <p>Name: {item?.name ?? item?.item_name ?? '—'}</p>
          <p>Category: {item?.category?.name ?? item?.category_name ?? '—'}</p>
          <p>Office: {item?.office?.name ?? item?.office_name ?? '—'}</p>
          <p>Status: {item?.status ?? '—'}</p>
        </div>
      )}
    </div>
  );
}
