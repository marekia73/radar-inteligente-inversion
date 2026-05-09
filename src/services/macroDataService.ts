import { MacroIndicator } from '../types';
import { DATA_PROVIDER_MODE, USE_PROXY_FOR_MACRO_DATA } from './dataProviderConfig';
import { fetchFredSeriesViaProxy } from './backendProxyClient';

// IMPORTANTE: En Vite, las variables VITE_* pueden quedar expuestas en el navegador. 
// Esta integración directa con APIs externas es válida para prototipo/demo. 
// Para producción debe moverse a un backend o función serverless que oculte las claves, aplique rate limits y cachee respuestas.
const FRED_API_KEY = (import.meta as any).env?.VITE_FRED_API_KEY;

const MACRO_CACHE_KEY = 'macro_data_cache';
const MACRO_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface MacroCacheEntry {
  data: MacroIndicator[];
  timestamp: number;
}

const MOCK_MACRO_INDICATORS: MacroIndicator[] = [
  {
    id: "FEDFUNDS",
    name: "Tasa de Interés (EE.UU.)",
    value: 5.33,
    unit: "%",
    region: "US",
    lastUpdated: new Date().toISOString(),
    source: "mock",
    status: "simulated",
    providerMode: DATA_PROVIDER_MODE
  },
  {
    id: "CPIAUCSL",
    name: "Inflación IPC (EE.UU.)",
    value: 3.1,
    unit: "% interanual",
    region: "US",
    lastUpdated: new Date().toISOString(),
    source: "mock",
    status: "simulated",
    providerMode: DATA_PROVIDER_MODE
  },
  {
    id: "UNRATE",
    name: "Desempleo (EE.UU.)",
    value: 3.7,
    unit: "%",
    region: "US",
    lastUpdated: new Date().toISOString(),
    source: "mock",
    status: "simulated",
    providerMode: DATA_PROVIDER_MODE
  },
  {
    id: "GS10",
    name: "Bono del Tesoro a 10 años (EE.UU.)",
    value: 4.15,
    unit: "%",
    region: "US",
    lastUpdated: new Date().toISOString(),
    source: "mock",
    status: "simulated",
    providerMode: DATA_PROVIDER_MODE
  },
  {
    id: "ECB_RATE",
    name: "Tipo Facilidad Depósito (Eurozona)",
    value: 4.0,
    unit: "%",
    region: "EU",
    lastUpdated: new Date().toISOString(),
    source: "mock",
    status: "simulated",
    providerMode: DATA_PROVIDER_MODE
  }
];

function getMacroCache(forceRefresh: boolean = false): MacroIndicator[] | null {
  if (forceRefresh) return null;
  try {
    const rawCache = localStorage.getItem(MACRO_CACHE_KEY);
    if (rawCache) {
      const entry = JSON.parse(rawCache) as MacroCacheEntry;
      if (Date.now() - entry.timestamp < MACRO_CACHE_DURATION) {
        return entry.data.map(d => ({ ...d, fromCache: true }));
      }
    }
  } catch (e) {
    console.error("Error reading macro cache", e);
  }
  return null;
}

function getStaleMacroCacheItem(id: string): MacroIndicator | null {
  try {
    const rawCache = localStorage.getItem(MACRO_CACHE_KEY);
    if (rawCache) {
      const entry = JSON.parse(rawCache) as MacroCacheEntry;
      const cachedItem = entry.data.find(d => d.id === id);
      if (cachedItem) {
        return { ...cachedItem, fromCache: true };
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function saveMacroCache(data: MacroIndicator[]) {
  try {
    // Remove fromCache flag before saving
    const dataToSave = data.map(d => {
      const copy = { ...d };
      delete copy.fromCache;
      return copy;
    });
    const entry: MacroCacheEntry = {
      data: dataToSave,
      timestamp: Date.now()
    };
    localStorage.setItem(MACRO_CACHE_KEY, JSON.stringify(entry));
  } catch (e) {
    console.error("Error saving macro cache", e);
  }
}

export async function fetchMacroIndicators(forceRefresh: boolean = false): Promise<MacroIndicator[]> {
  const cachedData = getMacroCache(forceRefresh);
  if (cachedData) {
    return cachedData.map(d => ({...d, provider: d.provider || 'FRED', providerMode: DATA_PROVIDER_MODE}));
  }

  const seriesToFetch = [
    { id: 'FEDFUNDS', name: 'Tasa de Interés (EE.UU.)', unit: '%', extraParams: '' },
    { id: 'CPIAUCSL', name: 'Inflación IPC (EE.UU.)', unit: 'Índice CPI', extraParams: '' },
    { id: 'UNRATE', name: 'Desempleo (EE.UU.)', unit: '%', extraParams: '' },
    { id: 'GS10', name: 'Bono del Tesoro a 10 años (EE.UU.)', unit: '%', extraParams: '' }
  ];

  const results: MacroIndicator[] = [];
  let fetchedAnyReal = false;

  for (const item of seriesToFetch) {
    if (!USE_PROXY_FOR_MACRO_DATA && !FRED_API_KEY) {
       const mockItem = MOCK_MACRO_INDICATORS.find(m => m.id === item.id);
       if (mockItem) {
          results.push({ 
             ...mockItem, 
             source: "datos simulados", 
             status: "simulated",
             requestedSymbol: item.id,
             provider: 'FRED',
             fallbackReason: 'API key no configurada',
             providerMode: DATA_PROVIDER_MODE
          });
       }
       continue;
    }

    try {
      let data: any = null;

      if (USE_PROXY_FOR_MACRO_DATA) {
        const proxyRes = await fetchFredSeriesViaProxy(item.id);
        if (!proxyRes.ok) {
           throw new Error(proxyRes.reason);
        }
        
        const proxyData = proxyRes.data;
        results.push({
          id: item.id,
          requestedSymbol: item.id,
          providerSymbol: item.id,
          provider: 'FRED',
          name: item.name,
          value: isNaN(proxyData.value) ? null : proxyData.value,
          unit: item.unit,
          region: "US",
          lastUpdated: proxyData.date ? new Date(proxyData.date).toISOString() : new Date().toISOString(),
          source: "FRED (Proxy)",
          status: "real",
          fromCache: false,
          providerMode: DATA_PROVIDER_MODE
        });
        fetchedAnyReal = true;
        continue;
      } else {
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${item.id}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=1${item.extraParams}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        data = await response.json();
      }

      if (data && data.observations && data.observations.length > 0) {
        const obs = data.observations[0];
        
        let value = parseFloat(obs.value);

        results.push({
          id: item.id,
          requestedSymbol: item.id,
          providerSymbol: item.id,
          provider: 'FRED',
          name: item.name,
          value: isNaN(value) ? null : value,
          unit: item.unit,
          region: "US",
          lastUpdated: obs.date ? new Date(obs.date).toISOString() : new Date().toISOString(),
          source: "FRED",
          status: "real",
          fromCache: false,
          providerMode: DATA_PROVIDER_MODE
        });
        fetchedAnyReal = true;
      } else {
        throw new Error("Respuesta vacía o sin observaciones");
      }
    } catch (error) {
      let errorReasonStr = error instanceof Error ? error.message : String(error);
      if (!USE_PROXY_FOR_MACRO_DATA && (errorReasonStr.includes("Failed to fetch") || errorReasonStr.includes("NetworkError"))) {
         errorReasonStr = "Frontend bloqueado por CORS o red. Disponible solo mediante backend/proxy.";
      }
      
      const staleItem = getStaleMacroCacheItem(item.id);
      if (staleItem) {
        results.push({
           ...staleItem,
           status: 'partial',
           source: 'FRED cache',
           stale: true,
           errorReason: errorReasonStr,
           fallbackReason: 'FRED no disponible; usando última caché conocida',
           providerMode: DATA_PROVIDER_MODE
        });
      } else {
        const mockItem = MOCK_MACRO_INDICATORS.find(m => m.id === item.id);
        if (mockItem) {
          results.push({ 
            ...mockItem, 
            source: "Simulación interna", 
            status: "simulated",
            requestedSymbol: item.id,
            provider: "FRED",
            errorReason: errorReasonStr,
            fallbackReason: "Usando simulación educativa",
            providerMode: DATA_PROVIDER_MODE
          });
        }
      }
    }
  }

  // Add EU mock indicators for now
  const euMock = MOCK_MACRO_INDICATORS.find(m => m.id === "ECB_RATE");
  if (euMock) {
    results.push({
       ...euMock,
       source: "datos simulados",
       status: "simulated",
       requestedSymbol: "ECB_RATE",
       provider: "ECB",
       fallbackReason: "Pendiente integración BCE/ECB",
       providerMode: DATA_PROVIDER_MODE
    });
  }

  if (fetchedAnyReal) {
    saveMacroCache(results);
  }

  return results;
}

export async function testFredConnection(): Promise<{ success: boolean; reason: string }> {
  if (USE_PROXY_FOR_MACRO_DATA) {
    const res = await fetchFredSeriesViaProxy('FEDFUNDS');
    if (res.ok) {
       return { success: true, reason: 'FRED respondió correctamente a través del proxy backend.' };
    }
    return { success: false, reason: `Proxy devolvió error: ${res.reason}` };
  }

  if (!FRED_API_KEY) {
    return { success: false, reason: 'No hay API key configurada' };
  }
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 403) return { success: false, reason: 'FRED devolvió error HTTP 403 (posible API key inválida o bloqueada)' };
      if (response.status === 400) return { success: false, reason: 'FRED devolvió error HTTP 400 (Bad Request)' };
      return { success: false, reason: `FRED devolvió error HTTP ${response.status}` };
    }
    const data = await response.json();
    if (data && data.observations && data.observations.length > 0) {
      if (!isNaN(parseFloat(data.observations[0].value))) {
          return { success: true, reason: 'FRED respondió correctamente.' };
      }
    }
    return { success: false, reason: 'FRED devolvió respuesta sin observaciones válidas.' };
  } catch (err) {
    let errStr = err instanceof Error ? err.message : String(err);
    if (errStr.includes("Failed to fetch") || errStr.includes("NetworkError")) {
       return { success: false, reason: 'Frontend bloqueado por CORS. Disponible solo mediante backend/proxy.' };
    }
    return { success: false, reason: 'No se pudo conectar con FRED desde el navegador (posible error de red).' };
  }
}
