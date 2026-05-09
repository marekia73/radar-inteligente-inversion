import { MarketData } from '../types';
import { assetMappings } from '../data/assetMappings';
import { DATA_PROVIDER_MODE, USE_PROXY_FOR_MARKET_DATA } from './dataProviderConfig';
import { fetchAlphaQuoteViaProxy, fetchAlphaHistoricalViaProxy } from './backendProxyClient';

// IMPORTANTE: En Vite, las variables VITE_* pueden quedar expuestas en el navegador. 
// Esta integración directa con APIs externas es válida para prototipo/demo. 
// Para producción debe moverse a un backend o función serverless que oculte las claves, aplique rate limits y cachee respuestas.
const ALPHA_VANTAGE_API_KEY = (import.meta as any).env?.VITE_ALPHA_VANTAGE_API_KEY;

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

export async function fetchMarketData(ticker: string, preventRealApiCall: boolean = false, forceRefresh: boolean = false): Promise<MarketData> {
  const reqKey = `${ticker}-${preventRealApiCall}-${forceRefresh}`;
  if (inFlightRequests.has(reqKey)) {
    return inFlightRequests.get(reqKey)!;
  }

  const promise = (async () => {
    const mapping = assetMappings[ticker];
    
    if (!ALPHA_VANTAGE_API_KEY || !mapping || !mapping.enabledForRealMarketData || mapping.provider !== "alpha_vantage" || preventRealApiCall) {
      const mock = createMockMarketData(ticker);
      mock.fallbackReason = !mapping?.enabledForRealMarketData ? 'Activo no habilitado para proveedor real' : 
                            (!ALPHA_VANTAGE_API_KEY ? 'API key no configurada' : 'Límite de llamadas alcanzado (preventCall)');
      mock.provider = 'Alpha Vantage';
      return mock;
    }

    const cachedData = getCache(ticker, forceRefresh);
    if (cachedData) {
      return cachedData;
    }

    try {
      const symbol = mapping.providerSymbol;
      let data: any = null;

      if (USE_PROXY_FOR_MARKET_DATA) {
        const proxyRes = await fetchAlphaQuoteViaProxy(symbol);
        if (!proxyRes.ok) {
           throw new Error(proxyRes.reason);
        }
        // For proxy, we directly construct the MarketData
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
          source: "Alpha Vantage",
          provider: "Alpha Vantage",
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
      } else {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        data = await response.json();
      }

      // Check for rate limit or errors
      if (data.Note || data.Information || data["Error Message"]) {
        deduplicatedWarn(`limit-${ticker}`, `Alpha Vantage warning/error for ${ticker}: ${JSON.stringify(data)}`);
        const stale = getStaleCache(ticker);
        if (stale) {
          stale.stale = true;
          stale.status = "partial";
          stale.errorReason = "Límite de API alcanzado o error";
          return stale;
        }

        const fallback = createMockMarketData(ticker);
        fallback.source = "datos simulados";
        fallback.status = "simulated";
        fallback.errorReason = "Límite de API alcanzado o error";
        fallback.provider = "Alpha Vantage";
        return fallback;
      }

      const quote = data["Global Quote"];
      if (quote && quote["05. price"]) {
        const price = parseFloat(quote["05. price"]);
        const changeStr = quote["10. change percent"] || "0%";
        const changePct = parseFloat(changeStr.replace("%", ""));

        const stale = getStaleCache(ticker);
        
        const marketData: MarketData = {
          symbol: ticker, // keep original ticker to match within the app
          price: isNaN(price) ? null : price,
          currency: "USD",
          changePercent1D: isNaN(changePct) ? null : changePct,
          changePercent1M: null,
          changePercent6M: null,
          changePercent1Y: null,
          high52Week: null,
          low52Week: null,
          lastUpdated: new Date().toISOString(),
          source: "Alpha Vantage",
          provider: "Alpha Vantage",
          providerSymbol: symbol,
          status: "real",
          providerMode: DATA_PROVIDER_MODE,
          
          // Preserve historical data if available
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
      }

      // Empty or unexpected format
      const stale = getStaleCache(ticker);
      if (stale) {
        stale.stale = true;
        stale.status = "partial";
        stale.errorReason = "Respuesta vacía o formato inesperado";
        return stale;
      }

      const fallback = createMockMarketData(ticker);
      fallback.source = "datos simulados";
      fallback.status = "simulated";
      fallback.errorReason = "Respuesta vacía o formato inesperado";
      fallback.provider = "Alpha Vantage";
      return fallback;
    } catch (error) {
      deduplicatedWarn(`fetch-fail-${ticker}`, `Aviso: Fallo al obtener mercado para ${ticker} (Rate limit o red)`);
      
      const stale = getStaleCache(ticker);
      if (stale) {
        stale.stale = true;
        stale.status = "partial";
        stale.errorReason = "Error de conexión o red";
        return stale;
      }

      const fallback = createMockMarketData(ticker);
      fallback.source = "datos simulados";
      fallback.status = "simulated";
      fallback.errorReason = "Error de conexión o red";
      fallback.provider = "Alpha Vantage";
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

// Sequential fetching to help with rate limits
export async function fetchManyMarketData(tickers: string[], forceRefresh: boolean = false): Promise<Record<string, MarketData>> {
  const result: Record<string, MarketData> = {};
  
  // Limitar llamadas reales a un máximo de 10 activos habilitados para protección anti-abuso
  let realApiCallsCount = 0;
  const MAX_REAL_CALLS = 10;
  let globalRateLimitHit = false;
  
  if (forceRefresh) {
    // Optionally clear in-memory cache
    for (const t of tickers) {
      delete marketDataCache[t];
    }
  }

  for (const ticker of tickers) {
    const mapping = assetMappings[ticker];
    const canDoRealCall = ALPHA_VANTAGE_API_KEY && mapping && mapping.enabledForRealMarketData && mapping.provider === "alpha_vantage";
    
    let preventCall = false;
    const isCached = !!getCache(ticker, forceRefresh);

    if (canDoRealCall && !isCached) {
      if (realApiCallsCount >= MAX_REAL_CALLS || globalRateLimitHit) {
        // Prevent real api call if we hit the limit, fallback to mock directly
        preventCall = true;
      } else {
        // Only increment the limit counter if the cache misses and we actually hit the API
        realApiCallsCount++;
      }
    }

    const fetchedData = await fetchMarketData(ticker, preventCall, forceRefresh);
    result[ticker] = fetchedData;
    
    if (fetchedData.errorReason?.includes("Límite") || fetchedData.fallbackReason?.includes("Límite")) {
       globalRateLimitHit = true;
    }
    
    // Simple delay for Alpha Vantage basic rate limiting, only delay if we actually made a request
    if (canDoRealCall && !preventCall && !isCached && !globalRateLimitHit) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return result;
}

export async function fetchAlphaVantageHistorical(ticker: string, preventRealApiCall: boolean = false, forceRefresh: boolean = false): Promise<Partial<MarketData>> {
  const mapping = assetMappings[ticker];
  if (!mapping) {
    return { historicalStatus: 'not_available', historicalReason: 'Activo no mapeado' };
  }
  if (!mapping.enabledForRealMarketData || mapping.provider !== "alpha_vantage") {
    return { historicalStatus: 'not_available', historicalReason: 'Proveedor no habilitado para este activo' };
  }
  if (!ALPHA_VANTAGE_API_KEY) {
     return { historicalStatus: 'error', historicalReason: 'No hay API key configurada' };
  }
  if (preventRealApiCall) {
    return { historicalStatus: 'simulated', historicalReason: 'Límite local alcanzado' };
  }

  // Check cache (we can store historical data inside standard market cache, or just use it if it's there)
  const cached = getCache(ticker);
  if (!forceRefresh && cached && (cached.historicalStatus === 'real' || cached.historicalStatus === 'cache') && !preventRealApiCall) {
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
    let data: any = null;

    if (USE_PROXY_FOR_MARKET_DATA) {
       const proxyRes = await fetchAlphaHistoricalViaProxy(symbol);
       if (!proxyRes.ok) {
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
         historicalReason: `Dato real de Alpha Vantage vía Proxy [Puntos: ${proxyData.historicalPoints}]`,
         historicalLastUpdated: proxyData.lastUpdated
       };

       const existingCache = getStaleCache(ticker) || await fetchMarketData(ticker, true, true);
       if (existingCache) {
         saveCache(ticker, { ...existingCache, ...histData });
       }
       return histData;
    } else {
       // Note: outputsize=full can consume large amounts of bandwidth. Time Series Weekly is safer for 1Y/52W ranges.
       const url = `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
       
       const response = await fetch(url);
       if (!response.ok) {
          return { historicalStatus: 'error', historicalReason: `Error HTTP: ${response.status}` };
       }
       data = await response.json();
    }

    if (data.Note) {
       return { historicalStatus: 'error', historicalReason: 'Límite de Alpha Vantage alcanzado.' };
    }
    if (data.Information) {
       return { historicalStatus: 'error', historicalReason: 'Límite o mensaje informativo de la API.' };
    }
    if (data["Error Message"]) {
       return { historicalStatus: 'error', historicalReason: 'Símbolo no encontrado o error en Alpha Vantage.' };
    }

    const timeSeries = data["Weekly Time Series"];
    if (!timeSeries) {
       return { historicalStatus: 'error', historicalReason: 'Estructura inesperada (sin Weekly Time Series).' };
    }

    const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    if (dates.length < 4) {
       return { historicalStatus: 'not_available', historicalReason: 'Histórico insuficiente.' };
    }

    const latestDate = dates[0];
    const latestPrice = parseFloat(timeSeries[latestDate]["4. close"]);

    const getPriceNDecadesAgo = (weeks: number) => {
      if (dates.length > weeks) return parseFloat(timeSeries[dates[weeks]]["4. close"]);
      return null;
    };

    const price1M = getPriceNDecadesAgo(4); // approx 1 month (4 weeks)
    const price3M = getPriceNDecadesAgo(13); // approx 3 months (13 weeks)
    const price1Y = getPriceNDecadesAgo(52); // approx 1 year (52 weeks)

    const calcChange = (oldPrice: number | null) => oldPrice ? ((latestPrice - oldPrice) / oldPrice) * 100 : null;

    let high52 = -Infinity;
    let low52 = Infinity;
    
    if (dates.length >= 52) {
      for (let i = 0; i < 52; i++) {
        const high = parseFloat(timeSeries[dates[i]]["2. high"]);
        const low = parseFloat(timeSeries[dates[i]]["3. low"]);
        if (high > high52) high52 = high;
        if (low < low52) low52 = low;
      }
    } else {
      high52 = NaN;
      low52 = NaN;
    }

    const histData: Partial<MarketData> = {
      oneMonthChangePercent: calcChange(price1M),
      threeMonthChangePercent: calcChange(price3M),
      oneYearChangePercent: calcChange(price1Y),
      fiftyTwoWeekHigh: isNaN(high52) ? null : high52,
      fiftyTwoWeekLow: isNaN(low52) ? null : low52,
      lastTradingDay: latestDate,
      historicalStatus: 'real',
      historicalReason: `Dato real de Alpha Vantage (Semanal) [Puntos: ${dates.length}]`,
      historicalLastUpdated: latestDate
    };

    // Update main cache entry merging historical data
    const existingCache = getStaleCache(ticker) || await fetchMarketData(ticker, true, true);
    if (existingCache) {
      saveCache(ticker, { ...existingCache, ...histData });
    }

    return histData;
  } catch (err) {
    console.warn(`Aviso: Histórico limitado/fallido para ${ticker} (Rate limit o red)`);
    return { historicalStatus: 'error', historicalReason: 'Límite o error de red.' };
  }
}
