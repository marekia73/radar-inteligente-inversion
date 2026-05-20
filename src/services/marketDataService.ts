import { MarketData } from '../types';
import { assetMappings } from '../data/assetMappings';
import { DATA_PROVIDER_MODE, USE_PROXY_FOR_MARKET_DATA } from './dataProviderConfig';
import { fetchMarketQuoteViaProxy, fetchMarketHistoricalViaProxy } from './backendProxyClient';

const MARKET_CACHE_KEY = 'market_data_cache';
const MARKET_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

interface CacheEntry {
  data: MarketData;
  timestamp: number;
}

// Simple in-memory cache to avoid rate limits during hot reloads
const marketDataCache: Record<string, MarketData> = {};
const inFlightRequests = new Map<string, Promise<MarketData>>();

const warnedKeys = new Set<string>();
function deduplicatedWarn(key: string, message: string) {
  if (!warnedKeys.has(key)) {
    console.warn(message);
    warnedKeys.add(key);
  }
}

function getCache(ticker: string, forceRefresh: boolean = false): MarketData | null {
  if (forceRefresh) return null;
  
  if (marketDataCache[ticker]) {
    return { ...marketDataCache[ticker], fromCache: true };
  }

  try {
    const rawCache = localStorage.getItem(MARKET_CACHE_KEY);
    if (rawCache) {
      const parsed = JSON.parse(rawCache) as Record<string, CacheEntry>;
      const entry = parsed[ticker];
      if (entry && (Date.now() - entry.timestamp < MARKET_CACHE_DURATION)) {
         marketDataCache[ticker] = entry.data;
         return { ...entry.data, fromCache: true };
      }
    }
  } catch(e) {
    console.error("Error reading market cache:", e);
  }
  return null;
}

function getStaleCache(ticker: string): MarketData | null {
  if (marketDataCache[ticker]) return { ...marketDataCache[ticker], fromCache: true };
  try {
    const rawCache = localStorage.getItem(MARKET_CACHE_KEY);
    if (rawCache) {
      const parsed = JSON.parse(rawCache) as Record<string, CacheEntry>;
      const entry = parsed[ticker];
      if (entry) {
         return { ...entry.data, fromCache: true };
      }
    }
  } catch(e) {
    // Ignore
  }
  return null;
}

function saveCache(ticker: string, data: MarketData) {
  marketDataCache[ticker] = data;
  try {
    const rawCache = localStorage.getItem(MARKET_CACHE_KEY);
    const parsed = rawCache ? JSON.parse(rawCache) : {};
    
    // We only want to save data that didn't come from cache
    const dataToSave = { ...data };
    delete dataToSave.fromCache;
    
    parsed[ticker] = { data: dataToSave, timestamp: Date.now() };
    localStorage.setItem(MARKET_CACHE_KEY, JSON.stringify(parsed));
  } catch(e) {
    console.error("Error saving market cache:", e);
  }
}

function createMockMarketData(symbol: string): MarketData {
  return {
    symbol,
    price: null,
    currency: "USD",
    changePercent1D: null,
    changePercent1M: null,
    changePercent6M: null,
    changePercent1Y: null,
    high52Week: null,
    low52Week: null,
    lastUpdated: new Date().toISOString(),
    source: "datos simulados",
    status: "simulated",
    providerMode: DATA_PROVIDER_MODE
  };
}

export function clearMarketCache() {
  for (const key in marketDataCache) {
    delete marketDataCache[key];
  }
  try {
    localStorage.removeItem(MARKET_CACHE_KEY);
  } catch(e) {}
}

export async function fetchMarketData(ticker: string, preventRealApiCall: boolean = false, forceRefresh: boolean = false): Promise<MarketData> {
  const reqKey = `${ticker}-${preventRealApiCall}-${forceRefresh}`;
  if (inFlightRequests.has(reqKey)) {
    return inFlightRequests.get(reqKey)!;
  }

  const promise = (async () => {
    const mapping = assetMappings[ticker];
    
    if (!mapping || !mapping.enabledForRealMarketData || preventRealApiCall) {
      const mock = createMockMarketData(ticker);
      mock.fallbackReason = !mapping?.enabledForRealMarketData ? 'Activo no habilitado para proveedor real' : 'Límite de llamadas alcanzado (preventCall)';
      mock.provider = 'Yahoo Finance vía proxy';
      return mock;
    }

    const cachedData = getCache(ticker, forceRefresh);
    if (cachedData) {
      return cachedData;
    }

    try {
      const symbol = mapping.providerSymbol;

      const proxyRes = await fetchMarketQuoteViaProxy(symbol);
      if (!proxyRes.ok) {
         throw new Error(proxyRes.reason);
      }
      
      const proxyData = proxyRes.data;
      const stale = getStaleCache(ticker);
      
      const marketData: MarketData = {
        symbol: ticker,
        price: proxyData.price,
        currency: proxyData.currency,
        changePercent1D: proxyData.changePercent,
        changePercent1M: null,
        changePercent6M: null,
        changePercent1Y: null,
        high52Week: null,
        low52Week: null,
        lastUpdated: new Date().toISOString(),
        source: "Proveedor externo",
        provider: "Yahoo Finance vía proxy",
        providerSymbol: symbol,
        status: "real",
        providerMode: DATA_PROVIDER_MODE,
        
        historicalStatus: stale?.historicalStatus,
        historicalReason: stale?.historicalReason,
        historicalLastUpdated: stale?.historicalLastUpdated,
        oneMonthChangePercent: stale?.oneMonthChangePercent,
        threeMonthChangePercent: stale?.threeMonthChangePercent,
        oneYearChangePercent: stale?.oneYearChangePercent,
        fiftyTwoWeekHigh: stale?.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: stale?.fiftyTwoWeekLow,
        lastTradingDay: stale?.lastTradingDay
      };
      
      saveCache(ticker, marketData);
      return marketData;
    } catch (error: any) {
      deduplicatedWarn(`fetch-fail-${ticker}`, `Aviso: Fallo al obtener mercado para ${ticker}: ${error.message}`);
      
      const stale = getStaleCache(ticker);
      if (stale) {
        stale.stale = true;
        stale.status = "partial";
        stale.errorReason = error.message || "Error de conexión o red";
        return stale;
      }

      const fallback = createMockMarketData(ticker);
      fallback.source = "datos simulados";
      fallback.status = "simulated";
      fallback.errorReason = error.message || "Error de conexión o red";
      fallback.provider = "Yahoo Finance vía proxy";
      return fallback;
    }
  })();
  
  inFlightRequests.set(reqKey, promise);
  try {
    return await promise;
  } finally {
    inFlightRequests.delete(reqKey);
  }
}

let sessionRateLimitHit = false;

// Sequential fetching to help with rate limits
export async function fetchManyMarketData(tickers: string[], forceRefresh: boolean = false): Promise<Record<string, MarketData>> {
  const result: Record<string, MarketData> = {};
  
  // Limitar llamadas reales a un máximo de 50 activos habilitados para protección anti-abuso
  let realApiCallsCount = 0;
  const MAX_REAL_CALLS = 50;
  
  if (forceRefresh) {
    for (const t of tickers) {
      delete marketDataCache[t];
    }
    sessionRateLimitHit = false;
  }

  for (const ticker of tickers) {
    const mapping = assetMappings[ticker];
    const canDoRealCall = mapping && mapping.enabledForRealMarketData;
    
    let preventCall = false;
    const isCached = !!getCache(ticker, forceRefresh);

    if (canDoRealCall && !isCached) {
      if (realApiCallsCount >= MAX_REAL_CALLS || sessionRateLimitHit) {
        preventCall = true;
      } else {
        realApiCallsCount++;
      }
    }

    const fetchedData = await fetchMarketData(ticker, preventCall, forceRefresh);
    result[ticker] = fetchedData;
    
    if (fetchedData.errorReason?.includes("Límite") || fetchedData.fallbackReason?.includes("Límite") || fetchedData.errorReason?.includes("limit") || fetchedData.fallbackReason?.includes("limit")) {
       sessionRateLimitHit = true;
    }
    
    if (canDoRealCall && !preventCall && !isCached && !sessionRateLimitHit) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  return result;
}

export async function fetchAlphaVantageHistorical(ticker: string, preventRealApiCall: boolean = false, forceRefresh: boolean = false): Promise<Partial<MarketData>> {
  const mapping = assetMappings[ticker];
  if (!mapping) {
    return { historicalStatus: 'not_available', historicalReason: 'Activo no mapeado' };
  }
  if (!mapping.enabledForRealMarketData) {
    return { historicalStatus: 'not_available', historicalReason: 'Proveedor no habilitado para este activo' };
  }
  
  if (preventRealApiCall || sessionRateLimitHit) {
    return { historicalStatus: 'simulated', historicalReason: sessionRateLimitHit ? 'Límite local alcanzado en la sesión' : 'Límite local alcanzado' };
  }

  const cached = getCache(ticker);
  if (!forceRefresh && cached && (cached.historicalStatus === 'real' || cached.historicalStatus === 'cache') && !preventRealApiCall && !sessionRateLimitHit) {
    return {
      oneMonthChangePercent: cached.oneMonthChangePercent,
      threeMonthChangePercent: cached.threeMonthChangePercent,
      oneYearChangePercent: cached.oneYearChangePercent,
      fiftyTwoWeekHigh: cached.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: cached.fiftyTwoWeekLow,
      lastTradingDay: cached.lastTradingDay,
      historicalStatus: 'cache',
      historicalReason: 'Dato obtenido de caché válida',
      historicalLastUpdated: cached.historicalLastUpdated
    };
  }

  try {
    const symbol = mapping.providerSymbol;
    const proxyRes = await fetchMarketHistoricalViaProxy(symbol);
    if (!proxyRes.ok) {
        if (proxyRes.reason?.includes("limit") || proxyRes.reason?.includes("Límite")) {
            sessionRateLimitHit = true;
        }
        return { historicalStatus: 'error', historicalReason: proxyRes.reason };
    }
    
    const proxyData = proxyRes.data;
    const histData: Partial<MarketData> = {
      oneMonthChangePercent: proxyData.oneMonthChangePercent,
      threeMonthChangePercent: proxyData.threeMonthChangePercent,
      oneYearChangePercent: proxyData.oneYearChangePercent,
      fiftyTwoWeekHigh: proxyData.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: proxyData.fiftyTwoWeekLow,
      lastTradingDay: proxyData.lastUpdated,
      historicalStatus: 'real',
      historicalReason: `Dato real de Proveedor Externo [Puntos: ${proxyData.historicalPoints}]`,
      historicalLastUpdated: proxyData.lastUpdated
    };

    const existingCache = getStaleCache(ticker) || await fetchMarketData(ticker, true, true);
    if (existingCache) {
      saveCache(ticker, { ...existingCache, ...histData });
    }
    return histData;
  } catch (err: any) {
    console.warn(`Aviso: Histórico limitado/fallido para ${ticker}: ${err.message}`);
    const cached = getStaleCache(ticker);
    if (cached && (cached.historicalStatus === 'real' || cached.historicalStatus === 'cache')) {
      return {
        oneMonthChangePercent: cached.oneMonthChangePercent,
        threeMonthChangePercent: cached.threeMonthChangePercent,
        oneYearChangePercent: cached.oneYearChangePercent,
        fiftyTwoWeekHigh: cached.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: cached.fiftyTwoWeekLow,
        lastTradingDay: cached.lastTradingDay,
        historicalStatus: 'cache',
        historicalReason: 'Dato de caché (Proveedor falló: ' + (err.message || 'Error de red') + ')',
        historicalLastUpdated: cached.historicalLastUpdated
      };
    }
    return { historicalStatus: 'error', historicalReason: err.message || 'Límite o error de red.' };
  }
}
