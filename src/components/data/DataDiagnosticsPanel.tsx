import React, { useState } from 'react';
import { MarketData, MacroIndicator } from '../../types';
import { ChevronDown, ChevronUp, Database, RefreshCw, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { assetMappings } from '../../data/assetMappings';
import { testFredConnection } from '../../services/macroDataService';
import { DATA_PROVIDER_MODE } from '../../services/dataProviderConfig';

function safeText(value: unknown, fallback = "-"): string {
  if (value === undefined || value === null || value === "" || value === "undefined" || value === "null") {
    return fallback;
  }
  return String(value);
}

interface DataDiagnosticsPanelProps {
  marketDataMap: Record<string, MarketData>;
  macroIndicators: MacroIndicator[];
}

export const DataDiagnosticsPanel: React.FC<DataDiagnosticsPanelProps> = ({ marketDataMap, macroIndicators }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [testingFred, setTestingFred] = useState(false);
  const [fredTestResult, setFredTestResult] = useState<{ success: boolean; reason: string } | null>(null);

  const marketVals: MarketData[] = Object.values(marketDataMap);
  const enabledMarketVals = marketVals.filter(m => assetMappings[m.symbol]?.enabledForRealMarketData);
  
  const getStatusColor = (status: string, fromCache?: boolean, stale?: boolean) => {
    if (status === 'real' && !fromCache) return "text-emerald-400";
    if (status === 'real' && fromCache) return "text-sky-400";
    if (stale || status === 'partial') return "text-amber-400";
    if (status === 'error') return "text-red-400";
    return "text-orange-400";
  }

  const getStatusText = (status: string, fromCache?: boolean, stale?: boolean, reason?: string) => {
    const r = (reason || "").toLowerCase();
    if (r.includes("límite") || r.includes("limit")) return "Límite de proveedor";
    if (r.includes("proxy no") || r.includes("proxy fallback")) return "Proxy no disponible";
    if (r.includes("error proveedor") || status === 'error') return "Error proveedor";
    
    if (status === 'real' && !fromCache) return "Real vía backend";
    if (status === 'real' && fromCache) return "Real en caché";
    if (status === 'cache' || stale || status === 'partial') return "Caché";
    return "Simulado";
  }

  const handleTestFred = async () => {
    setTestingFred(true);
    setFredTestResult(null);
    const result = await testFredConnection();
    setFredTestResult(result);
    setTestingFred(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-lg overflow-hidden mt-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 hover:bg-slate-800/80 transition-colors text-sm font-medium text-slate-300"
      >
        <div className="flex items-center gap-2">
          <Database size={16} className="text-slate-400" />
          Ver diagnóstico de datos
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
             <ShieldCheck size={12} className={DATA_PROVIDER_MODE === 'proxy-ready' ? "text-emerald-500" : "text-amber-500"}/>
             MODO: {DATA_PROVIDER_MODE}
          </span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 grid grid-cols-1 gap-6 text-sm text-slate-300">
          
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded text-indigo-300 text-xs">
             <strong className="block text-sm text-indigo-400 mb-1">Nota Arquitectónica</strong>
             Modo <strong>proxy-ready</strong> activo: las llamadas a proveedores externos se realizan mediante backend/proxy para proteger claves API y reducir problemas de CORS. Si un proveedor limita la cuota, la app usa caché o simulación educativa de seguridad.
          </div>
          
          {/* Market Data Table */}
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
              <h4 className="font-bold text-white">Mercado (Activos con proveedor asignado)</h4>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const statusCache = marketVals.map(m => m.symbol);
                    if (statusCache.includes("MSFT")) {
                       setTestingFred(true); // Reusing testing state or create new
                       const { fetchAlphaVantageHistorical } = await import('../../services/marketDataService');
                       const res = await fetchAlphaVantageHistorical("MSFT", false, true);
                       setFredTestResult({ success: res.historicalStatus === 'real' || res.historicalStatus === 'cache', reason: `MSFT Hist: ${res.historicalReason}. Status: ${res.historicalStatus}` });
                       setTestingFred(false);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors"
                >
                  Probar Histórico MSFT
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="font-medium p-2">Activo interno</th>
                    <th className="font-medium p-2">Símbolo Prov.</th>
                    <th className="font-medium p-2">Estado Precio</th>
                    <th className="font-medium p-2">Prov. Precio</th>
                    <th className="font-medium p-2">Estado Histórico</th>
                    <th className="font-medium p-2">Prov. Histórico</th>
                    <th className="font-medium p-2 w-full">Detalles (Actualización / Motivo)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {enabledMarketVals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-500">
                        No hay datos de mercado disponibles para diagnosticar
                      </td>
                    </tr>
                  ) : (
                    enabledMarketVals.map(m => (
                      <tr key={m.symbol} className="hover:bg-white/5">
                        <td className="p-2 font-mono text-slate-200">{m.symbol}</td>
                        <td className="p-2 font-mono text-slate-400">
                          {safeText(m.providerSymbol, m.symbol)}
                        </td>
                        <td className={`p-2 font-bold ${getStatusColor(m.status, m.fromCache, m.stale)}`}>
                          {getStatusText(m.status, m.fromCache, m.stale, m.fallbackReason)}
                        </td>
                        <td className="p-2 text-slate-400">
                          {safeText(m.provider, "Simulado")}
                        </td>
                        <td className={`p-2 font-bold ${getStatusColor(m.historicalStatus || 'not_available', m.historicalStatus === 'cache')}`}>
                          {getStatusText(m.historicalStatus || 'not_available', m.historicalStatus === 'cache', false, m.historicalReason)}
                        </td>
                        <td className="p-2 text-slate-400">
                           {safeText(m.provider, "Simulado")}
                        </td>
                        <td className="p-2 text-slate-400 text-[10px]">
                          <div className="grid grid-cols-2 gap-2">
                             <div>
                               <span className="text-slate-500">Últ. Precio:</span> {m.lastUpdated ? new Date(m.lastUpdated).toLocaleDateString() : 'N/A'}<br/>
                               <span className="text-slate-500">Últ. Histórico:</span> {m.historicalLastUpdated ? new Date(m.historicalLastUpdated).toLocaleDateString() : 'N/A'}
                             </div>
                             <div>
                               <span className="text-slate-500">Puntos Hist:</span> {m.historicalReason?.includes('[Puntos:') ? m.historicalReason.split('[Puntos: ')[1]?.replace(']', '') : (m.historicalStatus === 'real' || m.historicalStatus === 'cache' ? 'Suficientes' : 'N/A')}<br/>
                               <span className="text-amber-500/80 truncate block max-w-[200px]" title={safeText(m.fallbackReason)}>{safeText(m.fallbackReason)}</span>
                             </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Macro Data Table */}
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
                <h4 className="font-bold text-white">Macroeconomía</h4>
                <button
                   onClick={handleTestFred}
                   disabled={testingFred}
                   className="flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors disabled:opacity-50"
                >
                   <RefreshCw size={12} className={testingFred ? 'animate-spin' : ''} />
                   {testingFred ? 'Probando...' : 'Probar conexión FRED'}
                </button>
            </div>

            {fredTestResult && (
               <div className={`mb-4 p-3 rounded-md text-xs flex gap-2 items-start ${fredTestResult.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
                  {fredTestResult.success ? <CheckCircle size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
                  <span>{fredTestResult.reason}</span>
               </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="font-medium p-2">Indicador</th>
                    <th className="font-medium p-2">Estado</th>
                    <th className="font-medium p-2">Vía</th>
                    <th className="font-medium p-2">Proveedor</th>
                    <th className="font-medium p-2">Último valor</th>
                    <th className="font-medium p-2">Fecha</th>
                    <th className="font-medium p-2 w-full">Motivo / Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {macroIndicators.map(m => (
                    <tr key={m.id} className="hover:bg-white/5">
                      <td className="p-2 font-mono text-slate-200">{m.id}</td>
                      <td className={`p-2 font-bold ${getStatusColor(m.status, m.fromCache, m.stale)}`}>
                        {m.fallbackReason?.includes("CORS") ? "Bloqueado CORS" : getStatusText(m.status, m.fromCache, m.stale, m.fallbackReason || m.errorReason)}
                      </td>
                      <td className={`p-2 font-bold ${m.source?.includes('Proxy') ? "text-emerald-400" : (m.status === 'simulated' ? "text-slate-400" : "text-amber-500")}`}>
                        {m.source?.includes('Proxy') ? "Backend Proxy" : "Simulación / Fetch directo"}
                      </td>
                      <td className="p-2 text-slate-400">{safeText(m.provider, "Simulación interna")}</td>
                      <td className="p-2 font-mono text-slate-300">
                        {m.value !== null && m.value !== undefined ? m.value : "N/A"}
                      </td>
                      <td className="p-2 text-slate-500">
                        {m.lastUpdated ? new Date(m.lastUpdated).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-2 text-slate-400 text-[10px]">
                        <div className="truncate max-w-[200px]" title={safeText(m.fallbackReason) !== "-" ? safeText(m.fallbackReason) : safeText(m.errorReason, "")}>
                          {safeText(m.fallbackReason) !== "-" ? safeText(m.fallbackReason) : safeText(m.errorReason, "N/A")}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded text-xs">
            <strong>Nota de seguridad:</strong> En modo proxy-ready las claves API deben residir exclusivamente en el backend mediante variables de entorno del servidor. El frontend no debe recibir ni exponer claves.
          </div>
        </div>
      )}
    </div>
  );
};
