// ARCHIVO PREPARADO PARA MIGRACIÓN A BACKEND (Netlify Functions, Vercel Functions, Cloudflare Workers, Express, etc.)
// Actualmente, como requerimos evitar la exposición de API Keys y evitar errores de CORS con FRED,
// los clientes frontend deberían utilizar este tipo de proxy para recolectar sus datos.

// Cliente frontend para llamar al backend/proxy.
// En Render usa rutas relativas (/api/...).
// En Google AI Studio puede usar VITE_BACKEND_API_BASE_URL para apuntar al backend externo de Render.
// No contiene API keys privadas.

const API_BASE_URL = ((import.meta as any).env?.VITE_BACKEND_API_BASE_URL || "").replace(/\/$/, "");

function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/**
 * FRED - indicador macroeconómico
 */
export async function fetchFredSeriesViaProxy(seriesId: string) {
  try {
    const url = buildApiUrl(`/api/fred?seriesId=${encodeURIComponent(seriesId)}`);
    const response = await fetch(url);

    const data = await safeJson(response);

    if (!response.ok || data?.ok === false) {
      return {
        ok: false,
        reason: data.reason || data.message || `Error del proxy FRED: ${response.statusText}`,
        data
      };
    }

    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      reason: "No se pudo conectar con el proxy backend de FRED"
    };
  }
}

/**
 * FRED - diagnóstico
 */
export async function fetchFredDiagnosticViaProxy(seriesId: string = "FEDFUNDS") {
  try {
    const url = buildApiUrl(`/api/fred/diagnostic?seriesId=${encodeURIComponent(seriesId)}`);
    const response = await fetch(url);

    const data = await safeJson(response);

    if (!response.ok || data?.ok === false) {
      return {
        ok: false,
        reason: data.reason || data.message || `Error del diagnóstico FRED: ${response.statusText}`,
        data
      };
    }

    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      reason: "No se pudo conectar con el diagnóstico backend de FRED"
    };
  }
}

/**
 * Mercado - quote actual vía Yahoo Finance proxy
 */
export async function fetchMarketQuoteViaProxy(symbol: string) {
  try {
    const url = buildApiUrl(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`);
    const response = await fetch(url);

    const data = await safeJson(response);

    if (!response.ok || data?.ok === false) {
      return {
        ok: false,
        reason: data.reason || data.message || `Error del proxy de mercado: ${response.statusText}`,
        data
      };
    }

    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      reason: "No se pudo conectar con el proxy backend de mercado"
    };
  }
}

/**
 * Mercado - histórico vía Yahoo Finance proxy
 */
export async function fetchMarketHistoricalViaProxy(symbol: string) {
  try {
    const url = buildApiUrl(`/api/market/historical?symbol=${encodeURIComponent(symbol)}`);
    const response = await fetch(url);

    const data = await safeJson(response);

    if (!response.ok || data?.ok === false) {
      return {
        ok: false,
        reason: data.reason || data.message || `Error del proxy histórico de mercado: ${response.statusText}`,
        data
      };
    }

    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      reason: "No se pudo conectar con el proxy backend histórico de mercado"
    };
  }
}

/**
 * Mercado - diagnóstico vía Yahoo Finance proxy
 */
export async function fetchMarketDiagnosticViaProxy(symbol: string = "MSFT") {
  try {
    const url = buildApiUrl(`/api/market/diagnostic?symbol=${encodeURIComponent(symbol)}`);
    const response = await fetch(url);

    const data = await safeJson(response);

    if (!response.ok || data?.ok === false) {
      return {
        ok: false,
        reason: data.reason || data.message || `Error del diagnóstico de mercado: ${response.statusText}`,
        data
      };
    }

    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      reason: "No se pudo conectar con el diagnóstico backend de mercado"
    };
  }
}
