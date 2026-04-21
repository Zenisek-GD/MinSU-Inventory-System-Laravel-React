const _memoryCache = new Map();
const _inflight = new Map();

function stableStringify(value) {
  if (!value) return '';
  const keys = Object.keys(value).sort();
  const obj = {};
  for (const key of keys) obj[key] = value[key];
  return JSON.stringify(obj);
}

function makeCacheKey(url, params) {
  const qs = stableStringify(params);
  return qs ? `${url}?${qs}` : url;
}

export function invalidateRequestCache(match) {
  const matcher =
    typeof match === 'function'
      ? match
      : (key) => (typeof match === 'string' ? key.startsWith(match) : false);

  for (const key of _memoryCache.keys()) {
    if (matcher(key)) _memoryCache.delete(key);
  }
  for (const key of _inflight.keys()) {
    if (matcher(key)) _inflight.delete(key);
  }
}

export async function cachedGet(client, url, { params, ttlMs = 2 * 60 * 1000, cacheKey, transform } = {}) {
  const key = cacheKey ?? makeCacheKey(url, params);
  const now = Date.now();

  const cached = _memoryCache.get(key);
  if (cached && cached.expiresAt > now) return cached.data;

  const inflight = _inflight.get(key);
  if (inflight) return inflight;

  const promise = client
    .get(url, { params })
    .then((res) => {
      const data = transform ? transform(res.data) : res.data;
      _memoryCache.set(key, { expiresAt: now + ttlMs, data });
      return data;
    })
    .finally(() => {
      _inflight.delete(key);
    });

  _inflight.set(key, promise);
  return promise;
}
