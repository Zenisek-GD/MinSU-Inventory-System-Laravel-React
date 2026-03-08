export function parseQr(value) {
  if (!value || typeof value !== 'string') return { type: 'unknown', raw: value };
  try {
    const url = new URL(value);
    // Support scheme like https://host/items/qr/<qr>
    const parts = url.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex(p => p === 'items' && parts[parts.indexOf(p)+1] === 'qr');
    if (idx >= 0) {
      const qr = parts[idx+2];
      return { type: 'item', qr, raw: value };
    }
  } catch (_) {
    // not a URL, fall through
  }
  // Prefix-based format: minsu:item:<QR>
  if (value.startsWith('minsu:item:')) {
    const qr = value.substring('minsu:item:'.length);
    return { type: 'item', qr, raw: value };
  }
  // Raw QR string
  return { type: 'item', qr: value, raw: value };
}

export function buildWebItemUrl(baseWeb, qr) {
  const safe = encodeURIComponent(qr);
  return `${baseWeb.replace(/\/$/, '')}/items/qr/${safe}`;
}
