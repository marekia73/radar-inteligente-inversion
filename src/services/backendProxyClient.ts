// ARCHIVO PREPARADO PARA MIGRACIÓN A BACKEND (Netlify Functions, Vercel Functions, Cloudflare Workers, Express, etc.)
// Actualmente, como requerimos evitar la exposición de API Keys y evitar errores de CORS con FRED,
// los clientes frontend deberían utilizar este tipo de proxy para recolectar sus datos.

export async function fetchFredSeriesViaProxy(seriesId: string) {
  try {
    const response = await fetch(`/api/fred?seriesId=${seriesId}`);
    if (!response.ok) {
      if (response.status === 404) return { ok: false, reason: 'Proxy no implementado todavía' };
      const err = await response.json().catch(() => ({}));
      return { ok: false, reason: err.reason || err.error || `Error del proxy: ${response.statusText}` };
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, reason: 'No se pudo conectar con el proxy backend de FRED' };
  }
}

export async function fetchAlphaQuoteViaProxy(symbol: string) {
  try {
    const response = await fetch(`/api/alpha/quote?symbol=${symbol}`);
    if (!response.ok) {
      if (response.status === 404) return { ok: false, reason: 'Proxy no implementado todavía' };
      const err = await response.json().catch(() => ({}));
      return { ok: false, reason: err.reason || err.error || `Error del proxy: ${response.statusText}` };
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, reason: 'No se pudo conectar con el proxy backend de Alpha Vantage' };
  }
}

export async function fetchAlphaHistoricalViaProxy(symbol: string) {
  try {
    const response = await fetch(`/api/alpha/historical?symbol=${symbol}`);
    if (!response.ok) {
      if (response.status === 404) return { ok: false, reason: 'Proxy no implementado todavía' };
      const err = await response.json().catch(() => ({}));
      return { ok: false, reason: err.reason || err.error || `Error del proxy: ${response.statusText}` };
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, reason: 'No se pudo conectar con el proxy backend histórico de Alpha Vantage' };
  }
}
