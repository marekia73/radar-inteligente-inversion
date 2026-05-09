/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { mockAssets } from './data/mockAssets';
import { mockMentors, KNOWLEDGE_DISCLAIMER } from './data/mockKnowledge';
import { processAssets } from './logic/scoringEngine';
import { ProcessedAsset, AssetType, Horizon, RiskLevel, MarketData, MacroIndicator, DataQuality } from './types';
import { fetchManyMarketData } from './services/marketDataService';
import { fetchMacroIndicators } from './services/macroDataService';
import { enrichAssetsWithMarketData } from './logic/enrichAssets';
import { assetMappings } from './data/assetMappings';

// UI Components
import { WarningBanner } from './components/ui/WarningBanner';
import { SectionCard } from './components/ui/SectionCard';
import { DataStatusBanner } from './components/data/DataStatusBanner';
import { DataDiagnosticsPanel } from './components/data/DataDiagnosticsPanel';

// Dashboard Components
import { SummaryCards } from './components/dashboard/SummaryCards';
import { AssetFilters } from './components/dashboard/AssetFilters';
import { AssetTable } from './components/dashboard/AssetTable';
import { AssetDetailModal } from './components/dashboard/AssetDetailModal';
import { MiniRanking } from './components/dashboard/MiniRanking';
import { MacroDashboard } from './components/data/MacroDashboard';

// Charts
import { RiskPotentialMap } from './components/charts/RiskPotentialMap';
import { OpportunityBarChart } from './components/charts/OpportunityBarChart';
import { DistributionCharts } from './components/charts/DistributionCharts';

// Knowledge
import { MentorPanel } from './components/knowledge/MentorPanel';
import { KnowledgeRulesPanel } from './components/knowledge/KnowledgeRulesPanel';

// Icons
import { 
  Radar, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Map as MapIcon, 
  Info,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [filters, setFilters] = useState({
    type: "",
    horizon: "",
    risk: "",
    search: ""
  });

  const [selectedAsset, setSelectedAsset] = useState<ProcessedAsset | null>(null);
  const [macroIndicators, setMacroIndicators] = useState<MacroIndicator[]>([]);
  const [marketDataMap, setMarketDataMap] = useState<Record<string, MarketData>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataQuality, setDataQuality] = useState<DataQuality>({
    marketDataStatus: "simulated",
    macroDataStatus: "simulated",
    message: "Los datos reales, si están disponibles, se usan solo con finalidad educativa. Los datos pueden tener retrasos, errores o estar incompletos.",
    isUsingCache: false
  });

  // Process data once
  const baseProcessedAssets = useMemo(() => processAssets(mockAssets, mockMentors), []);
  
  const allProcessedAssets = useMemo(() => {
    return enrichAssetsWithMarketData(baseProcessedAssets, marketDataMap);
  }, [baseProcessedAssets, marketDataMap]);

  const loadData = useCallback(async (forceRefresh = false) => {
    setIsRefreshing(true);
    try {
      const macro = await fetchMacroIndicators(forceRefresh);
      setMacroIndicators(macro);
      
      const tickers = mockAssets.map(a => a.ticker);
      const market = await fetchManyMarketData(tickers, forceRefresh);
      setMarketDataMap(market);

      const enabledMarketVals = Object.values(market).filter(m => assetMappings[m.symbol]?.enabledForRealMarketData);
      let marketStatus: string = "simulated";
      if (enabledMarketVals.length > 0) {
        const allMarketReal = enabledMarketVals.every(m => m.status === 'real' && !m.fromCache);
        const allMarketCache = enabledMarketVals.every(m => m.status === 'real' && m.fromCache);
        const anyMarketRealOrPartial = enabledMarketVals.some(m => m.status === 'real' || m.status === 'partial');
        const allMarketError = enabledMarketVals.every(m => m.status === 'error'); // only pure errors

        if (allMarketReal) marketStatus = "real";
        // To be safe with types, if DataQuality is somewhat restrictive
        else if (allMarketCache) marketStatus = "cache";
        else if (anyMarketRealOrPartial) marketStatus = "partial";
        else if (allMarketError) marketStatus = "error";
        else marketStatus = "simulated";
      }

      let macroStatus: string = "simulated";
      const fredIndicators = macro.filter(m => m.id !== 'ECB_RATE'); // Ignore ECB mock for global status
      
      if (fredIndicators.length > 0) {
        const allMacroReal = fredIndicators.every(m => m.status === 'real' && !m.fromCache);
        const allMacroCache = fredIndicators.every(m => m.status === 'real' && m.fromCache);
        const anyMacroRealOrPartial = fredIndicators.some(m => m.status === 'real' || m.status === 'partial');
        const allMacroError = fredIndicators.every(m => m.status === 'error');

        if (allMacroReal) macroStatus = "real";
        else if (allMacroCache) macroStatus = "cache";
        else if (anyMacroRealOrPartial) macroStatus = "partial";
        else if (allMacroError) macroStatus = "error";
        else macroStatus = "simulated";
      }

      const anyMarketCache = Object.values(market).some(m => m.fromCache);
      const anyMacroCache = macro.some(m => m.fromCache);
      const isUsingCache = anyMarketCache || anyMacroCache;

      setDataQuality(prev => ({
        ...prev,
        marketDataStatus: marketStatus as any,
        macroDataStatus: macroStatus as any,
        isUsingCache
      }));
    } catch (err) {
      console.warn("Aviso: Fallo al cargar datos enriquecidos (puede ser rate limit o red):", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter logic
  const filteredAssets = useMemo(() => {
    return allProcessedAssets.filter(asset => {
      const matchType = !filters.type || asset.type === filters.type;
      const matchHorizon = !filters.horizon || asset.recommendedHorizon === filters.horizon;
      const matchRisk = !filters.risk || asset.riskLevel === filters.risk;
      const matchSearch = !filters.search || 
        asset.name.toLowerCase().includes(filters.search.toLowerCase()) || 
        asset.ticker.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchType && matchHorizon && matchRisk && matchSearch;
    });
  }, [allProcessedAssets, filters]);

  // Derived rankings
  const andreaTopETFs = useMemo(() => {
    return [...allProcessedAssets]
      .filter(a => a.type === AssetType.ETF)
      .sort((a, b) => {
        const aS = a.mentorScores.find(m => m.mentorId === 'andrea_redondo')?.score || 0;
        const bS = b.mentorScores.find(m => m.mentorId === 'andrea_redondo')?.score || 0;
        return bS - aS;
      })
      .slice(0, 5);
  }, [allProcessedAssets]);

  const andreaTopGeneral = useMemo(() => {
    return [...allProcessedAssets]
      .sort((a, b) => {
        const aS = a.mentorScores.find(m => m.mentorId === 'andrea_redondo')?.score || 0;
        const bS = b.mentorScores.find(m => m.mentorId === 'andrea_redondo')?.score || 0;
        return bS - aS;
      })
      .slice(0, 5);
  }, [allProcessedAssets]);

  const pabloTop = useMemo(() => {
    return [...allProcessedAssets].sort((a, b) => {
      const aS = a.mentorScores.find(m => m.mentorId === 'pablo_gil')?.score || 0;
      const bS = b.mentorScores.find(m => m.mentorId === 'pablo_gil')?.score || 0;
      return bS - aS;
    });
  }, [allProcessedAssets]);

  const lastUpdateDate = useMemo(() => {
    let latest = new Date(0);
    let hasRealOrCache = false;
    
    Object.values(marketDataMap).forEach((m: MarketData) => {
      if ((m.status === 'real' || m.historicalStatus === 'real' || m.historicalStatus === 'cache') && m.lastUpdated) {
        hasRealOrCache = true;
        const d = new Date(m.lastUpdated);
        if (d > latest) latest = d;
      }
    });

    macroIndicators.forEach((m: MacroIndicator) => {
      if (m.status === 'real' && m.lastUpdated) {
        hasRealOrCache = true;
        const d = new Date(m.lastUpdated);
        if (d > latest) latest = d;
      }
    });
    
    if (!hasRealOrCache) return "datos educativos simulados";
    
    const mapStatus = (s: string) => {
      switch(s) {
        case 'real': return 'Real';
        case 'cache': return 'Caché';
        case 'partial': return 'Parcial';
        case 'error': return 'Error';
        default: return 'Simulado';
      }
    };
    
    return `${latest.toLocaleString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })} · Mercado: ${mapStatus(dataQuality.marketDataStatus)} / Macro: ${mapStatus(dataQuality.macroDataStatus)}`;
  }, [marketDataMap, macroIndicators, dataQuality]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-200 font-sans">
      
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                <Radar size={32} />
              </div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                RADAR <span className="text-emerald-400">INTELIGENTE</span> DE INVERSIÓN
              </h1>
            </div>
            <p className="text-slate-400 mt-2 font-medium">Oportunidades, riesgos y tendencias explicadas fácil para principiantes</p>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-900 border border-white/5 py-1 px-3 rounded-full">
              Actualizado: {lastUpdateDate}
            </span>
            <button 
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              {isRefreshing ? "Actualizando datos..." : "Actualizar datos"}
            </button>
          </div>
        </header>

        {/* Warning Banner */}
        <WarningBanner 
          type="warning"
          message="HERRAMIENTA EDUCATIVA: No constituye asesoramiento financiero. Estos son datos combinados con fines de entrenamiento y visualización. No tomes decisiones de inversión basadas únicamente en este radar. Los datos pueden proceder de API real, caché o simulación educativa de seguridad."
        />
        <DataStatusBanner quality={dataQuality} isRefreshing={isRefreshing} />
        
        <DataDiagnosticsPanel marketDataMap={marketDataMap} macroIndicators={macroIndicators} />

        {/* Top KPIs */}
        <div className="mt-8">
          <SummaryCards assets={allProcessedAssets} />
        </div>

        {/* Macro Dashboard */}
        <div className="mt-8">
          <MacroDashboard indicators={macroIndicators} />
        </div>

        {/* Mentor Knowledge Panel */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 text-emerald-400">
            <Info size={16} />
            <h2 className="text-sm font-bold uppercase tracking-widest">Base de Conocimiento</h2>
          </div>
          <MentorPanel mentors={mockMentors} />
          <div className="text-[10px] text-slate-500 italic mt-[-1rem] px-2 text-center">
            {KNOWLEDGE_DISCLAIMER}
          </div>
        </div>

        {/* NotebookLM Rules Panel */}
        <KnowledgeRulesPanel />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Sidebar Left Rankings */}
          <div className="xl:col-span-1 space-y-6">
            <MiniRanking 
              title="Top Corto Plazo" 
              assets={allProcessedAssets} 
              scoreKey="shortTermScore" 
              onSelect={setSelectedAsset} 
            />
            <MiniRanking 
              title="Top Largo Plazo (Paz)" 
              assets={allProcessedAssets} 
              scoreKey="longTermScore" 
              onSelect={setSelectedAsset} 
            />
            <MiniRanking 
              title="Top ETFs según Andrea" 
              assets={andreaTopETFs} 
              scoreKey="andreaScore" 
              onSelect={setSelectedAsset} 
            />
            <MiniRanking 
              title="Top Enfoque Andrea" 
              assets={andreaTopGeneral} 
              scoreKey="andreaScore" 
              onSelect={setSelectedAsset} 
            />
            <MiniRanking 
              title="Top Estrategia Pablo" 
              assets={pabloTop} 
              scoreKey="pabloScore" 
              onSelect={setSelectedAsset} 
            />
          </div>

          {/* Main Dashboard Area */}
          <div className="xl:col-span-3 space-y-8">
            
            {/* Filters */}
            <AssetFilters filters={filters} setFilters={setFilters} />

            {/* Main Table */}
            <SectionCard title="Ranking General del Radar" subtitle="Prioridad basada en relación oportunidad/riesgo">
              <AssetTable assets={filteredAssets} onSelect={setSelectedAsset} />
            </SectionCard>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SectionCard title="Mapa Riesgo vs Potencial" subtitle="Ubicación visual de activos" icon={<MapIcon size={18} />}>
                <RiskPotentialMap assets={filteredAssets} />
              </SectionCard>
              <SectionCard title="Top 10 Oportunidades" subtitle="Mayores puntajes actuales" icon={<BarChart3 size={18} />}>
                <OpportunityBarChart assets={filteredAssets} />
              </SectionCard>
            </div>

            {/* Distribution Charts */}
            <SectionCard title="Distribución de Análisis" subtitle="Composición del radar actual" icon={<PieChartIcon size={18} />}>
              <DistributionCharts assets={allProcessedAssets} />
            </SectionCard>

            {/* Footnote */}
            <footer className="pt-8 border-t border-white/5 text-center">
              <p className="text-slate-500 text-sm">© 2026 Radar Inteligente de Inversión • Diseñado para la educación financiera</p>
            </footer>
          </div>
        </div>
      </div>

      {/* Asset Detail Modal */}
      <AssetDetailModal 
        asset={selectedAsset} 
        onClose={() => setSelectedAsset(null)} 
        mentors={mockMentors}
      />
    </div>
  );
}
