import { 
  RawAsset, 
  ProcessedAsset, 
  MentorProfile, 
  RiskLevel, 
  ValuationLabel, 
  PrudentLabel, 
  AssetType
} from "../types";
import { calculateMentorScores } from "./mentorEngine";

// IMPORTANTE: Datos macro e históricos se muestran solo como información educativa.
// En esta fase no modifican el scoring ni los rankings.

export function processAssets(rawAssets: RawAsset[], mentors: MentorProfile[]): ProcessedAsset[] {
  return rawAssets.map(asset => {
    const mentorScores = calculateMentorScores(asset, mentors);
    
    // Calculate aggregate scores
    const opportunityScore = calculateOpportunityScore(asset);
    const shortTermScore = calculateShortTermScore(asset);
    const mediumTermScore = calculateMediumTermScore(asset);
    const longTermScore = calculateLongTermScore(asset);
    
    return {
      ...asset,
      opportunityScore,
      shortTermScore,
      mediumTermScore,
      longTermScore,
      riskLevel: calculateRiskLevel(asset),
      valuationLabel: calculateValuationLabel(asset),
      prudentLabel: calculatePrudentLabel(asset, opportunityScore),
      beginnerFitLabel: calculateBeginnerFitLabel(asset),
      mentorScores,
      andreaScore: mentorScores.find(ms => ms.mentorId === "andrea_redondo")?.score || 0,
      pabloScore: mentorScores.find(ms => ms.mentorId === "pablo_gil")?.score || 0,
    };
  });
}

function calculateOpportunityScore(asset: RawAsset): number {
  const { potential, risk, trust, valuation } = asset.scores;
  const valuationAdvantage = 100 - valuation; 
  
  // Weights adjusted to prioritize trust and separation
  const score = (potential * 0.35) + (trust * 0.4) + (valuationAdvantage * 0.15) + ((100 - risk) * 0.1);
  
  // Specific adjustments for separation
  let finalScore = score;
  if (asset.type === AssetType.ETF && trust > 95) finalScore += 5;
  if (risk > 75) finalScore -= 10;
  
  return Math.round(Math.max(1, Math.min(100, finalScore)));
}

function calculateShortTermScore(asset: RawAsset): number {
  const { shortTermFit, risk, trust } = asset.scores;
  // Short term is highly sensitive to risk
  const score = (shortTermFit * 0.6) + (trust * 0.2) + ((100 - risk) * 0.2);
  return Math.round(score);
}

function calculateMediumTermScore(asset: RawAsset): number {
  const { mediumTermFit, risk, potential } = asset.scores;
  const score = (mediumTermFit * 0.5) + (potential * 0.3) + ((100 - risk) * 0.2);
  return Math.round(score);
}

function calculateLongTermScore(asset: RawAsset): number {
  const { longTermFit, trust, beginnerFriendly } = asset.scores;
  // Long term values trust and simplicity
  const score = (longTermFit * 0.5) + (trust * 0.3) + (beginnerFriendly * 0.2);
  return Math.round(score);
}

function calculateRiskLevel(asset: RawAsset): RiskLevel {
  const risk = asset.scores.risk;
  if (risk > 85) return RiskLevel.Extremo;
  if (risk > 65) return RiskLevel.Alto;
  if (risk >= 35) return RiskLevel.Medio;
  return RiskLevel.Bajo;
}

function calculateValuationLabel(asset: RawAsset): ValuationLabel {
  const val = asset.scores.valuation;
  if (val > 85) return ValuationLabel.Cara;
  if (val > 70) return ValuationLabel.Exigente;
  if (val > 45) return ValuationLabel.Razonable;
  return ValuationLabel.Barata;
}

function calculateBeginnerFitLabel(asset: RawAsset): string {
  const bf = asset.scores.beginnerFriendly;
  if (bf > 90) return "Ideal para iniciarse";
  if (bf > 70) return "Adecuada tras estudio previo";
  if (bf > 50) return "Exige comprensión de mercados";
  return "Complejidad no apta para principiantes";
}

function calculatePrudentLabel(asset: RawAsset, opportunityScore: number): PrudentLabel {
  const risk = asset.scores.risk;
  const val = asset.scores.valuation;
  const bf = asset.scores.beginnerFriendly;

  if (risk > 85) return PrudentLabel.AltoPotencialRiesgo;
  if (bf < 40) return PrudentLabel.NoAdecuadaPrincipiantes;
  if (val > 88) return PrudentLabel.InteresanteCara;
  if (asset.type === AssetType.Defensivo && risk < 10) return PrudentLabel.BasePrudente;
  if (opportunityScore > 85 && risk < 35) return PrudentLabel.InteresanteEstudiar;
  if (opportunityScore > 75) return PrudentLabel.InteresanteCautela;
  if (asset.type === AssetType.Defensivo) return PrudentLabel.Neutral;
  if (risk > 70 || val > 80) return PrudentLabel.Evitar;
  
  return PrudentLabel.Vigilar;
}
