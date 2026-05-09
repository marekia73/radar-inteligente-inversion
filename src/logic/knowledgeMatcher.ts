import { ProcessedAsset, KnowledgeRule, AssetType, RiskLevel, ValuationLabel, Horizon, MatchedKnowledgeRule } from "../types";

export function getRelevantKnowledgeRules(asset: ProcessedAsset, allKnowledgeRules: KnowledgeRule[]): MatchedKnowledgeRule[] {
  const ruleScores: Record<string, number> = {};
  const ruleReasons: Record<string, string[]> = {};

  allKnowledgeRules.forEach(r => {
    ruleScores[r.id] = 0;
    ruleReasons[r.id] = [];
  });

  const addScore = (ids: string[], points: number, reason: string) => {
    ids.forEach(id => {
      if (ruleScores[id] !== undefined) {
        ruleScores[id] += points;
        if (!ruleReasons[id].includes(reason)) {
          ruleReasons[id].push(reason);
        }
      }
    });
  };

  // 1. Asset Type Matching
  if (asset.type === AssetType.ETF) {
    addScore(['andrea-3', 'andrea-5', 'andrea-9', 'andrea-10', 'andrea-1', 'andrea-7'], 10, "Aparece porque el activo es un ETF.");
    addScore(['pablo-4', 'pablo-1', 'pablo-2', 'pablo-17'], 10, "Aparece porque el activo es un ETF o índice.");
  } else if (asset.type === AssetType.Accion) {
    addScore(['andrea-6', 'andrea-13', 'andrea-2', 'andrea-8'], 10, "Aparece porque el activo es una acción individual.");
    addScore(['pablo-5', 'pablo-2', 'pablo-8', 'pablo-10'], 10, "Aparece porque el activo es una acción individual.");
  } else if (asset.type === AssetType.Sector) {
    addScore(['andrea-9', 'andrea-8', 'andrea-11', 'andrea-2'], 10, "Aparece porque el activo pertenece a un sector temático.");
    addScore(['pablo-12', 'pablo-14', 'pablo-7', 'pablo-4'], 10, "Aparece porque el activo pertenece a un sector temático.");
  } else if (asset.type === AssetType.Defensivo) {
    addScore(['andrea-11', 'andrea-2', 'andrea-8'], 10, "Aparece porque el activo es defensivo y encaja con preservación de capital.");
    addScore(['pablo-11', 'pablo-1', 'pablo-9', 'pablo-8'], 10, "Aparece porque el activo es defensivo y encaja con preservación de capital.");
  }

  // 2. Risk Matching
  if (asset.riskLevel === RiskLevel.Alto || asset.riskLevel === RiskLevel.Extremo) {
    addScore(['andrea-11', 'andrea-13', 'andrea-4', 'andrea-8', 'andrea-2'], 8, "Aparece porque el activo tiene riesgo alto o extremo.");
    addScore(['pablo-15', 'pablo-16', 'pablo-5', 'pablo-12'], 8, "Aparece porque el activo tiene riesgo alto o extremo.");
  }

  // 3. Valuation Matching
  if (asset.valuationLabel === ValuationLabel.Cara || asset.valuationLabel === ValuationLabel.Exigente) {
    addScore(['andrea-13', 'andrea-11', 'andrea-8'], 8, "Aparece porque el activo tiene una valoración exigente.");
    addScore(['pablo-5', 'pablo-12', 'pablo-15'], 8, "Aparece porque el activo tiene una valoración exigente.");
  }

  // 4. Horizon Matching
  if (asset.recommendedHorizon === Horizon.Largo) {
    addScore(['andrea-1', 'andrea-7', 'andrea-10', 'andrea-9'], 5, "Aparece porque el activo encaja con una inversión a largo plazo.");
    addScore(['pablo-10', 'pablo-2'], 5, "Aparece porque el activo encaja con una inversión a largo plazo.");
  } else if (asset.recommendedHorizon === Horizon.Corto || asset.recommendedHorizon === Horizon.Vigilancia) {
    addScore(['andrea-8', 'andrea-11', 'andrea-2'], 5, "Aparece porque el activo es para corto plazo o vigilancia extrema.");
    addScore(['pablo-1', 'pablo-11', 'pablo-16'], 5, "Aparece porque el activo es para corto plazo o vigilancia extrema.");
  }

  const getWeightValue = (weight: string) => {
    if (weight === 'alto') return 3;
    if (weight === 'medio') return 2;
    return 1;
  };

  const getRuleIndex = (id: string, rules: KnowledgeRule[]) => {
    return rules.findIndex(r => r.id === id);
  };

  const compareRules = (a: MatchedKnowledgeRule, b: MatchedKnowledgeRule) => {
    // 1. Mayor puntuación de matching
    if (a.matchScore !== b.matchScore) return b.matchScore - a.matchScore;
    
    // 2. Mayor peso de la regla
    const aW = getWeightValue(a.rule.weight);
    const bW = getWeightValue(b.rule.weight);
    if (aW !== bW) return bW - aW;

    // 3. Orden original
    const aIdx = getRuleIndex(a.rule.id, allKnowledgeRules);
    const bIdx = getRuleIndex(b.rule.id, allKnowledgeRules);
    if (aIdx !== bIdx) return aIdx - bIdx;

    // 4. id de la regla como último desempate
    return a.rule.id.localeCompare(b.rule.id);
  };

  const mapToMatched = (rule: KnowledgeRule): MatchedKnowledgeRule => {
    return {
      rule,
      matchScore: ruleScores[rule.id],
      matchReason: ruleReasons[rule.id].join(" ") || "Relacionado con la configuración de la cartera."
    };
  };

  const andreaMatchedRules = allKnowledgeRules
    .filter(r => r.mentorId === 'andrea' && ruleScores[r.id] > 0)
    .map(mapToMatched)
    .sort(compareRules);

  const pabloMatchedRules = allKnowledgeRules
    .filter(r => r.mentorId === 'pablo' && ruleScores[r.id] > 0)
    .map(mapToMatched)
    .sort(compareRules);

  // Take top 3 of Andrea, top 3 of Pablo
  const topAndrea = andreaMatchedRules.slice(0, 3);
  const topPablo = pabloMatchedRules.slice(0, 3);

  // If we need to fill to 6 and one of them has fewer, we could take more of the other, 
  // but prompt says "mínimo 2 de Andrea y 2 de Pablo si existen" and "máximo 6 reglas en total".
  // Top 3 each guarantees maximum of 6 and balance.
  return [...topAndrea, ...topPablo];
}
