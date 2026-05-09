import React, { useState } from 'react';
import { BookOpen, Filter, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { allKnowledgeRules, andreaKnowledgeRules, pabloKnowledgeRules } from '../../data/knowledgeRules';
import { KnowledgeMentorId } from '../../types';

export function KnowledgeRulesPanel() {
  const [activeFilter, setActiveFilter] = useState<'all' | KnowledgeMentorId>('all');
  const [expandedMentor, setExpandedMentor] = useState<Record<string, boolean>>({});

  const toggleExpand = (mentorId: string) => {
    setExpandedMentor(prev => ({ ...prev, [mentorId]: !prev[mentorId] }));
  };

  const getRulesToDisplay = () => {
    if (activeFilter === 'andrea') return andreaKnowledgeRules;
    if (activeFilter === 'pablo') return pabloKnowledgeRules;
    return allKnowledgeRules;
  };

  const rules = getRulesToDisplay();
  
  // Group rules by mentor for display purposes when viewing 'all'
  const rulesByMentor = {
    andrea: rules.filter(r => r.mentorId === 'andrea'),
    pablo: rules.filter(r => r.mentorId === 'pablo'),
  };

  const renderRuleCard = (rule: any) => (
    <div key={rule.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-purple-500/30 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-400/10 px-2 py-1 rounded">
          {rule.category}
        </span>
        <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
          rule.weight === 'alto' ? 'bg-red-400/10 text-red-400' :
          rule.weight === 'medio' ? 'bg-yellow-400/10 text-yellow-400' :
          'bg-green-400/10 text-green-400'
        }`}>
          Peso: {rule.weight}
        </span>
      </div>
      
      <h4 className="text-slate-200 font-medium mb-1">{rule.rule}</h4>
      <p className="text-slate-400 text-sm mb-3">
        {rule.explanation}
      </p>
      
      <div className="bg-slate-900/50 rounded-md p-3 mt-2 border border-slate-700/30">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">
          Impacto en Scoring
        </div>
        <p className="text-sm text-cyan-400/90">
          {rule.scoringEffect}
        </p>
      </div>
    </div>
  );

  const renderMentorSection = (mentorId: string, mentorName: string, mentorRules: any[]) => {
    if (mentorRules.length === 0) return null;
    
    const isExpanded = expandedMentor[mentorId];
    const visibleRules = isExpanded ? mentorRules : mentorRules.slice(0, 5);
    
    return (
      <div key={mentorId} className="mb-8 last:mb-0">
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            mentorId === 'andrea' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {mentorId === 'andrea' ? 'AR' : 'PG'}
          </div>
          <h3 className="text-lg font-semibold text-slate-200">{mentorName}</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleRules.map(renderRuleCard)}
        </div>
        
        {mentorRules.length > 5 && (
          <button 
            onClick={() => toggleExpand(mentorId)}
            className="mt-4 flex items-center justify-center w-full py-2 bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-300 text-sm font-medium transition-colors"
          >
            {isExpanded ? (
              <>Ocultar reglas <ChevronUp className="w-4 h-4 ml-1" /></>
            ) : (
              <>Ver {mentorRules.length - 5} reglas más <ChevronDown className="w-4 h-4 ml-1" /></>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-8 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            Reglas extraídas de NotebookLM
          </h2>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Base educativa pendiente de validación. No constituye asesoramiento financiero.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 self-start md:self-auto">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeFilter === 'all' 
                ? 'bg-purple-500/20 text-purple-400' 
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setActiveFilter('andrea')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeFilter === 'andrea' 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            Andrea R.
          </button>
          <button
            onClick={() => setActiveFilter('pablo')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeFilter === 'pablo' 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            Pablo G.
          </button>
        </div>
      </div>
      
      <div className="space-y-8">
        {(activeFilter === 'all' || activeFilter === 'andrea') && 
          renderMentorSection('andrea', 'Andrea Redondo / Club de Inversión', rulesByMentor.andrea)
        }
        
        {(activeFilter === 'all' || activeFilter === 'pablo') && 
          renderMentorSection('pablo', 'Pablo Gil', rulesByMentor.pablo)
        }
      </div>
    </div>
  );
}
