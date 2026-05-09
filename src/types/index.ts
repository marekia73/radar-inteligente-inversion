/**
 * Radar Inteligente de Inversión - Modelos de Datos
 */

import { MarketData, DataQuality } from './market';

export * from './market';

export enum AssetType {
  Accion = "Accion",
  ETF = "ETF",
  Sector = "Sector",
  Defensivo = "Defensivo"
}

export enum Horizon {
  Corto = "Corto",
  Medio = "Medio",
  Largo = "Largo",
  Vigilancia = "Solo vigilancia"
}

export enum RiskLevel {
  Bajo = "Bajo",
  Medio = "Medio",
  Alto = "Alto",
  Extremo = "Extremo"
}

export enum ValuationLabel {
  Barata = "Barata",
  Razonable = "Razonable",
  Exigente = "Exigente",
  Cara = "Cara"
}

export enum PrudentLabel {
  InteresanteEstudiar = "Muy interesante para estudiar",
  BasePrudente = "Base prudente",
  InteresanteCautela = "Interesante con cautela",
  InteresanteCara = "Interesante, pero valorada",
  AltoPotencialRiesgo = "Alto potencial / alto riesgo",
  Vigilar = "Vigilar evolución",
  NoAdecuadaPrincipiantes = "No adecuada para principiantes",
  Evitar = "Evitar por ahora / Vigilancia extrema",
  Neutral = "Preservación / Neutral"
}

export interface AssetScores {
  potential: number; // 0-100
  risk: number;      // 0-100
  trust: number;     // 0-100
  valuation: number; // 0-100
  beginnerFriendly: number; // 0-100
  shortTermFit: number;      // 0-100
  mediumTermFit: number;     // 0-100
  longTermFit: number;       // 0-100
}

export interface NewsItem {
  title: string;
  source: string;
  date: string;
  impact: "positivo" | "negativo" | "neutral";
  importance: "alta" | "media" | "baja";
  summary: string;
  isSimulated: boolean;
}

export interface RawAsset {
  id: string;
  name: string;
  ticker: string;
  type: AssetType;
  sector: string;
  recommendedHorizon: Horizon;
  summary: string;
  radarReason: string;
  scores: AssetScores;
  pros: string[];
  cons: string[];
  improvementConditions: string[];
  worseningConditions: string[];
  news: NewsItem[];
  sources: string[];
  isMockData: boolean;
}

export interface MentorScore {
  mentorId: string;
  score: number;
  label: string;
  explanation: string;
  warnings: string[];
}

export interface ProcessedAsset extends RawAsset {
  opportunityScore: number;
  shortTermScore: number;
  mediumTermScore: number;
  longTermScore: number;
  riskLevel: RiskLevel;
  valuationLabel: ValuationLabel;
  prudentLabel: PrudentLabel;
  beginnerFitLabel: string;
  mentorScores: MentorScore[];
  andreaScore: number;
  pabloScore: number;
  marketData?: MarketData;
  dataStatus?: "real" | "simulated" | "error" | "partial";
}

export interface MentorProfile {
  id: string;
  name: string;
  description: string;
  style: string;
  principles: string[];
  redFlags: string[];
  preferredAssets: AssetType[];
  avoidedAssets: AssetType[];
  scoringWeights: {
    risk: number;
    potential: number;
    valuation: number;
    simplicity: number;
    trust: number;
  };
}

export type KnowledgeMentorId = "andrea" | "pablo";

export type KnowledgeWeight = "bajo" | "medio" | "alto";

export interface KnowledgeRule {
  id: string;
  mentorId: KnowledgeMentorId;
  mentorName: string;
  category: string;
  rule: string;
  explanation: string;
  scoringEffect: string;
  weight: KnowledgeWeight;
  source: string;
  sourceStatus: string;
  isVerified: boolean;
}

export interface MatchedKnowledgeRule {
  rule: KnowledgeRule;
  matchScore: number;
  matchReason: string;
}
