import React, { useState, useEffect } from "react";
import { ProcessedAsset, MentorProfile, MarketData } from "../../types";
import { 
  X, 
  Info, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  TrendingDown, 
  Newspaper,
  BookOpen,
  MapPin,
  Users,
  Lightbulb,
  Clock,
  ShieldAlert
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { ScorePill } from "../ui/ScorePill";
import { MentorScoreCard } from "../knowledge/MentorScoreCard";
import { motion, AnimatePresence } from "motion/react";
import { allKnowledgeRules } from "../../data/knowledgeRules";
import { getRelevantKnowledgeRules } from "../../logic/knowledgeMatcher";
import { assetMappings } from "../../data/assetMappings";
import { fetchAlphaVantageHistorical } from "../../services/marketDataService";

interface AssetDetailModalProps {
  asset: ProcessedAsset | null;
  onClose: () => void;
  mentors: MentorProfile[];
  id?: string;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ asset, onClose, mentors, id }) => {
  const [historicalData, setHistoricalData] = useState<Partial<MarketData> | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (asset) {
      setHistoricalData(null);
      const mapping = assetMappings[asset.ticker];
      if (mapping?.enabledForRealMarketData) {
        setIsLoadingHistory(true);
        fetchAlphaVantageHistorical(asset.ticker).then(data => {
          setHistoricalData(data);
          setIsLoadingHistory(false);
        }).catch(() => {
          setIsLoadingHistory(false);
        });
      }
    }
  }, [asset]);

  if (!asset) return null;

  const relevantRules = getRelevantKnowledgeRules(asset, allKnowledgeRules);
  const mData = { ...asset.marketData, ...historicalData };

  return (
    <AnimatePresence>
      <div id={id} className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-white/5 flex items-start justify-between bg-gradient-to-r from-slate-900 to-slate-800">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-2xl">
                {asset.ticker.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold text-white">{asset.name}</h2>
                  <Badge variant="neutral" className="font-mono">{asset.ticker}</Badge>
                  <Badge variant="info">{asset.type}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-slate-400 text-sm">
                  <span className="flex items-center gap-1"><BookOpen size={14} /> {asset.sector}</span>
                  <span className="flex items-center gap-1 text-sky-400"><MapPin size={14} /> {asset.recommendedHorizon}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Stats */}
              <div className="space-y-8">
                <div className="bg-slate-800/40 rounded-2xl p-6 border border-white/5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-2">PUNTUACIONES RADAR</h3>
                  <div className="grid grid-cols-2 gap-y-8">
                    <ScorePill score={asset.opportunityScore} label="Oportunidad" />
                    <ScorePill score={asset.scores.risk} label="Riesgo" />
                    <ScorePill score={asset.shortTermScore} label="Corto Plazo" />
                    <ScorePill score={asset.longTermScore} label="Largo Plazo" />
                  </div>
                  <div className="mt-8 space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Nivel de Riesgo:</span>
                      <span className="text-white font-semibold">{asset.riskLevel}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Valoración:</span>
                      <span className="text-white font-semibold">{asset.valuationLabel}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Para Principiantes:</span>
                      <span className="text-emerald-400 font-semibold">{asset.beginnerFitLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-500/5 rounded-2xl p-6 border border-emerald-500/10">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-4 italic">
                    <Info size={16} /> Veredicto Prudente
                  </h3>
                  <p className="text-white font-medium">{asset.prudentLabel}</p>
                </div>
              </div>

              {/* Middle Column: Analysis */}
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <h3 className="text-xl font-bold text-white mb-3">¿Por qué está en el radar?</h3>
                  <p className="text-slate-300 leading-relaxed">{asset.summary}</p>
                  <div className="mt-4 p-4 bg-slate-800/30 rounded-xl border-l-4 border-sky-500 text-sm italic text-slate-300">
                    "{asset.radarReason}"
                  </div>
                </section>

                <section className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" /> Datos de mercado
                      {isLoadingHistory && <span className="ml-2 py-0.5 px-2 bg-slate-800 text-[9px] rounded-full text-slate-400 animate-pulse flex items-center gap-1"><Clock size={10}/> Cargando histórico...</span>}
                    </h3>
                    <div className="flex items-center gap-2">
                      {mData?.historicalStatus && (
                        <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                          mData.historicalStatus === 'real' ? 'bg-emerald-500/20 text-emerald-400' :
                          mData.historicalStatus === 'cache' ? 'bg-sky-500/20 text-sky-400' :
                          mData.historicalStatus === 'error' ? 'bg-red-500/20 text-red-400' :
                          mData.historicalStatus === 'not_available' ? 'bg-slate-500/20 text-slate-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {mData.historicalStatus === 'real' ? 'Histórico real' :
                           mData.historicalStatus === 'cache' ? 'Histórico en caché' :
                           mData.historicalStatus === 'simulated' ? 'Histórico simulado' :
                           mData.historicalStatus === 'error' ? 'Error histórico' : 'Histórico no disponible'}
                        </span>
                      )}
                      
                      <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                          mData?.status === 'real' && !mData.fromCache ? 'bg-emerald-500/20 text-emerald-400' : 
                          mData?.status === 'real' && mData.fromCache ? 'bg-sky-500/20 text-sky-400' :
                          mData?.stale ? 'bg-amber-500/20 text-amber-400' :
                          mData?.status === 'error' ? 'bg-red-500/20 text-red-400' :
                          'bg-orange-500/20 text-orange-400'
                      }`}>
                        {mData?.status === 'real' && !mData?.fromCache ? 'Datos reales' :
                         mData?.status === 'real' && mData?.fromCache ? 'Datos en caché' :
                         mData?.stale ? 'Caché antigua' :
                         mData?.status === 'error' ? 'Error' : 'Datos simulados'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Precio</p>
                      <p className="font-mono text-lg text-white">
                        {mData?.price !== null && mData?.price !== undefined && !Number.isNaN(mData.price)
                          ? `${mData.price.toFixed(2)} ${mData.currency || 'USD'}`
                          : ((mData?.errorReason?.includes("limit") || mData?.errorReason?.includes("Límite") || mData?.fallbackReason?.includes("Límite")) 
                             ? "Dato no disponible por límite del proveedor externo"
                             : "Dato simulado/No cotizado")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Var. 1D</p>
                      {mData?.changePercent1D !== null && mData?.changePercent1D !== undefined && !Number.isNaN(mData.changePercent1D) ? (
                        <p className={`font-mono text-lg ${mData.changePercent1D >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {mData.changePercent1D > 0 ? '+' : ''}{mData.changePercent1D.toFixed(2)}%
                        </p>
                      ) : (
                        <p className="font-mono text-lg text-slate-400">Sin dato</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">Var. 1M {mData?.historicalStatus === 'cache' && <Clock size={10} className="text-sky-500" title="Dato guardado en caché"/>}{mData?.historicalStatus === 'simulated' && <Info size={10} className="text-orange-500" title="Dato simulado"/>}</p>
                      <p className={`font-mono text-lg ${mData?.oneMonthChangePercent !== null && mData?.oneMonthChangePercent !== undefined && !Number.isNaN(mData.oneMonthChangePercent) ? (mData.oneMonthChangePercent >= 0 ? 'text-emerald-400/80' : 'text-red-400/80') : 'text-slate-400'}`}>
                        {mData?.oneMonthChangePercent !== null && mData?.oneMonthChangePercent !== undefined && !Number.isNaN(mData.oneMonthChangePercent)
                          ? `${mData.oneMonthChangePercent > 0 ? '+' : ''}${mData.oneMonthChangePercent.toFixed(2)}%`
                          : "Sin histórico"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">Var. 3M {mData?.historicalStatus === 'cache' && <Clock size={10} className="text-sky-500" title="Dato guardado en caché"/>}{mData?.historicalStatus === 'simulated' && <Info size={10} className="text-orange-500" title="Dato simulado"/>}</p>
                      <p className={`font-mono text-lg ${mData?.threeMonthChangePercent !== null && mData?.threeMonthChangePercent !== undefined && !Number.isNaN(mData.threeMonthChangePercent) ? (mData.threeMonthChangePercent >= 0 ? 'text-emerald-400/80' : 'text-red-400/80') : 'text-slate-400'}`}>
                        {mData?.threeMonthChangePercent !== null && mData?.threeMonthChangePercent !== undefined && !Number.isNaN(mData.threeMonthChangePercent)
                          ? `${mData.threeMonthChangePercent > 0 ? '+' : ''}${mData.threeMonthChangePercent.toFixed(2)}%`
                          : "Sin histórico"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">Var. 1A {mData?.historicalStatus === 'cache' && <Clock size={10} className="text-sky-500" title="Dato guardado en caché"/>}{mData?.historicalStatus === 'simulated' && <Info size={10} className="text-orange-500" title="Dato simulado"/>}</p>
                      <p className={`font-mono text-lg ${mData?.oneYearChangePercent !== null && mData?.oneYearChangePercent !== undefined && !Number.isNaN(mData.oneYearChangePercent) ? (mData.oneYearChangePercent >= 0 ? 'text-emerald-400/80' : 'text-red-400/80') : 'text-slate-400'}`}>
                        {mData?.oneYearChangePercent !== null && mData?.oneYearChangePercent !== undefined && !Number.isNaN(mData.oneYearChangePercent)
                          ? `${mData.oneYearChangePercent > 0 ? '+' : ''}${mData.oneYearChangePercent.toFixed(2)}%`
                          : "Sin histórico"}
                      </p>
                    </div>
                    <div className="xl:col-span-2">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">Rango 52S (Máx - Mín) {mData?.historicalStatus === 'cache' && <Clock size={10} className="text-sky-500" title="Dato guardado en caché"/>}</p>
                      <p className="font-mono text-sm text-slate-400 mt-1">
                        {mData?.fiftyTwoWeekHigh !== null && mData?.fiftyTwoWeekHigh !== undefined && !Number.isNaN(mData.fiftyTwoWeekHigh) && mData?.fiftyTwoWeekLow !== null && mData?.fiftyTwoWeekLow !== undefined && !Number.isNaN(mData.fiftyTwoWeekLow)
                          ? `${mData.fiftyTwoWeekHigh.toFixed(2)} - ${mData.fiftyTwoWeekLow.toFixed(2)}`
                          : "Sin histórico"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mt-4">
                    <p className="text-xs text-indigo-300 flex items-start gap-2">
                      <Info size={14} className="mt-0.5 shrink-0" />
                      Los históricos se muestran con finalidad informativa. En esta fase no alteran el scoring.
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3 pt-4 border-t border-white/5 mt-4">
                    {mData?.status === 'simulated' && (
                       <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-1">
                         <p className="text-xs text-amber-300 flex items-start gap-2">
                           <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                           {(mData?.errorReason?.includes("limit") || mData?.errorReason?.includes("Límite") || mData?.fallbackReason?.includes("Límite") || mData?.errorReason?.includes('Rate limit'))
                             ? "El activo sí cotiza, pero el proveedor gratuito ha limitado la consulta."
                             : "Dato educativo/simulado: este activo no tiene proveedor de mercado conectado de forma real."}
                         </p>
                       </div>
                    )}
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mb-2">Estado Actual</p>
                      <p className="text-[9px] text-slate-400 flex justify-between">
                         <span>Proveedor: <strong className="text-slate-300">{mData?.provider && mData.provider !== "undefined" ? mData.provider : 'Simulación interna'} {mData?.providerSymbol && mData.providerSymbol !== "undefined" && `(${mData.providerSymbol})`}</strong></span>
                         <span>Actualizado: {mData?.lastUpdated ? new Date(mData.lastUpdated).toLocaleString() : 'N/A'}</span>
                      </p>
                      {mData?.fallbackReason && mData.fallbackReason !== "undefined" && (
                        <p className="text-[9px] text-orange-400/80 mt-1">Motivo: {mData.fallbackReason}</p>
                      )}
                      {!mData?.fallbackReason && mData?.errorReason && mData.errorReason !== "undefined" && (
                        <p className="text-[9px] text-red-400/80 mt-1">Error: {mData.errorReason}</p>
                      )}
                    </div>
                    
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-sky-400 mb-2">Estado Histórico</p>
                      <p className="text-[9px] text-slate-400 flex justify-between">
                         <span>Proveedor histórico: <strong className="text-slate-300">{mData?.provider && mData.provider !== "undefined" ? mData.provider : 'Simulación interna'}</strong></span>
                         <span>Actualizado: {mData?.historicalLastUpdated ? new Date(mData.historicalLastUpdated).toLocaleString() : (mData?.lastUpdated ? new Date(mData.lastUpdated).toLocaleString() : 'N/A')}</span>
                      </p>
                      {mData?.historicalReason && (
                        <p className="text-[9px] text-sky-400/80 mt-1">
                           Motivo: {mData.historicalReason}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                       <CheckCircle2 size={16} /> Puntos a Favor
                    </h4>
                    <ul className="space-y-2">
                      {asset.pros.map((pro, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-emerald-500 mt-1">•</span> {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
                       <XCircle size={16} /> Riesgos / Contras
                    </h4>
                    <ul className="space-y-2">
                      {asset.cons.map((con, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-rose-500 mt-1">•</span> {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <section className="bg-slate-800/20 p-6 rounded-2xl border border-white/5 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Escenarios de Vigilancia</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-emerald-500/5 rounded-xl">
                      <h5 className="text-[10px] font-bold text-emerald-400 uppercase mb-2 flex items-center gap-1">
                        <TrendingUp size={12} /> Para salir de vigilancia y mejorar
                      </h5>
                      <ul className="text-xs text-slate-400 space-y-1">
                        {asset.improvementConditions.map((c, i) => <li key={i}>• {c}</li>)}
                      </ul>
                    </div>
                    <div className="p-4 bg-rose-500/5 rounded-xl">
                      <h5 className="text-[10px] font-bold text-rose-400 uppercase mb-2 flex items-center gap-1">
                        <TrendingDown size={12} /> Motivos para evitar o salir
                      </h5>
                      <ul className="text-xs text-slate-400 space-y-1">
                        {asset.worseningConditions.map((c, i) => <li key={i}>• {c}</li>)}
                      </ul>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Mentor Analysis Section */}
            <div className="mt-12 space-y-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <Users className="text-violet-400" /> Opinión de los Mentores
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {asset.mentorScores.map(score => {
                  const mentor = mentors.find(m => m.id === score.mentorId)!;
                  return <MentorScoreCard key={score.mentorId} mentorScore={score} mentor={mentor} />;
                })}
              </div>
            </div>

            {/* Simulated Knowledge Rules Section */}
            <div className="mt-12 space-y-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <Lightbulb className="text-amber-400" /> Reglas de conocimiento relacionadas
              </h3>
              <p className="text-slate-400 text-sm">Reglas educativas generales relacionadas con este activo. No son recomendación de compra.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Agrupar por mentor */}
                {['andrea', 'pablo'].map(mentorId => {
                  const mentorRules = relevantRules.filter(r => r.rule.mentorId === mentorId);
                  if (mentorRules.length === 0) return null;
                  return (
                    <div key={mentorId} className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2 mb-3">
                         {mentorId === 'andrea' ? 'Andrea Redondo / Club Inversión' : 'Pablo Gil'}
                      </h4>
                      <div className="space-y-4">
                        {mentorRules.map(matchedRule => (
                          <div key={matchedRule.rule.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:border-purple-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-400/10 px-2 py-1 rounded">
                                {matchedRule.rule.category}
                              </span>
                            </div>
                            <h5 className="font-medium text-slate-200 text-sm mb-1">{matchedRule.rule.rule}</h5>
                            <p className="text-xs text-slate-400 mb-2 line-clamp-3">{matchedRule.rule.explanation}</p>
                            <div className="pt-2 border-t border-slate-700/50">
                              <p className="text-[10px] text-slate-500 italic">
                                Motivo: {matchedRule.matchReason}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulated News Section */}
            {asset.news.length > 0 && (
              <div className="mt-12 space-y-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Newspaper className="text-sky-400" /> Noticias de Seguimiento (Simuladas)
                </h3>
                <div className="space-y-4">
                  {asset.news.map((n, i) => (
                    <div key={i} className="p-5 bg-slate-800/40 rounded-2xl border border-white/5 flex gap-4">
                      <div className={`w-1 h-12 rounded-full flex-shrink-0 ${n.impact === 'positivo' ? 'bg-emerald-500' : n.impact === 'negativo' ? 'bg-rose-500' : 'bg-slate-500'}`} />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-slate-500 font-mono uppercase">{n.date}</span>
                          <Badge variant="neutral" className="text-[9px]">{n.source}</Badge>
                        </div>
                        <h4 className="font-bold text-white text-md">{n.title}</h4>
                        <p className="text-sm text-slate-400 mt-1">{n.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer / Footer Disclaimer */}
            <div className="mt-12 pt-8 border-t border-white/5 text-center px-12">
              <p className="text-xs text-slate-500 leading-relaxed italic">
                Esta es una herramienta educativa y visual. Los datos mostrados son simulaciones y no constituyen asesoramiento financiero real. 
                Utiliza este radar para orientar tu estudio personal y nunca como una señal de compra directa. Invertir conlleva riesgo de pérdida de capital.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

