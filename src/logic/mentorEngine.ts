import { RawAsset, MentorProfile, MentorScore, AssetType, RiskLevel, ValuationLabel, Horizon } from "../types";

export function calculateMentorScores(asset: RawAsset, mentors: MentorProfile[]): MentorScore[] {
  return mentors.map(mentor => {
    let score = 50; // Neutral starting point
    const warnings: string[] = [];

    // --- ANDREA REDONDO LOGIC ---
    if (mentor.id === "andrea_redondo") {
      score = 0; // Absolute zero basis for exact tuning

      // Ponderación exacta para Andrea
      score += asset.scores.beginnerFriendly * 0.25;
      score += asset.scores.longTermFit * 0.25;
      score += (100 - asset.scores.risk) * 0.20;
      score += asset.scores.trust * 0.15;
      score += (100 - asset.scores.valuation) * 0.15;

      // Premios y penalizaciones por tipo
      if (asset.type === AssetType.ETF) {
        score += asset.sector.includes("Global") ? 12 : 7;
      } else if (asset.type === AssetType.Accion) {
        score -= 4;
        warnings.push("Priorizo la inversión pasiva en índices sobre la selección de empresas individuales.");
      } else if (asset.type === AssetType.Sector) {
        score -= 6;
        warnings.push("La inversión temática suele ser demasiado volátil y compleja para una base sólida.");
      } else if (asset.type === AssetType.Defensivo) {
        score += 6;
      }

      // Penalizaciones adicionales severas
      if (asset.scores.risk > 70) {
        score -= 8;
        warnings.push("Volatilidad excesiva; no apto para quien busca tranquilidad.");
      }
      if (asset.scores.valuation > 75) {
        score -= 6;
        warnings.push("Valoración exigente, lo que puede afectar la rentabilidad a largo plazo.");
      }
      if (asset.scores.beginnerFriendly < 50) {
        warnings.push("Producto con una curva de aprendizaje no apta para recién llegados.");
      }
      if (asset.recommendedHorizon === Horizon.Vigilancia) {
        score -= 10;
        warnings.push("Activo en vigilancia; riesgo estructural complejo de asumir de forma periódica.");
      }

      // Soft cap para evitar saturar el top
      if (score > 90) {
        score = 90 + (score - 90) * 0.5;
      }
    }

    // --- PABLO GIL LOGIC ---
    if (mentor.id === "pablo_gil") {
      score = 0; // Absolute zero basis

      // Ponderación exacta para Pablo
      score += (100 - asset.scores.valuation) * 0.20; 
      score += (100 - asset.scores.risk) * 0.20;      
      score += asset.scores.trust * 0.20;
      score += asset.scores.potential * 0.20;
      score += asset.scores.mediumTermFit * 0.20;

      // Ajustes por tipo
      if (asset.type === AssetType.Accion) {
        score += 5; // Pablo busca acciones de calidad a buen precio
      } else if (asset.type === AssetType.Defensivo || asset.sector === "Monetario") {
        score += 5; // Refugio en estrategias macro
      }

      // Ratio Potencial/Riesgo
      const ratio = asset.scores.potential / (asset.scores.risk || 1);
      if (ratio > 1.5 && asset.scores.potential > 40) {
        score += 8;
      } else if (ratio < 0.8) {
        score -= 15;
        warnings.push("La relación potencial/riesgo es muy desfavorable técnicamente.");
      }

      // Valuation & Hype Penalties
      if (asset.scores.valuation > 80) {
        score -= 10;
        warnings.push("Valoración extrema frente al momento de mercado.");
      }
      if (asset.scores.risk > 80) {
        score -= 10;
        warnings.push("Riesgo elevado en el momento actual.");
      }
      if (asset.sector?.includes("IA") || asset.sector?.includes("Tecnología")) {
        if (asset.scores.valuation > 75) {
          score -= 5;
          warnings.push("Exceso de narrativa (hype) en este sector; cuidado con los excesos.");
        }
      }

      // Soft cap
      if (score > 83) {
        score = 83 + (score - 83) * 0.5;
      }
    }

    // Cap values to keep them strictly between realistic bounds
    score = Math.max(10, Math.min(95, Math.round(score)));

    return {
      mentorId: mentor.id,
      score: Math.round(score),
      label: getMentorLabel(score),
      explanation: getMentorExplanation(mentor.id, score, asset),
      warnings
    };
  });
}

function getMentorLabel(score: number): string {
  if (score >= 85) return "Muy Recomendado";
  if (score >= 70) return "Interesante";
  if (score >= 50) return "Neutral / Observar";
  if (score >= 30) return "Poco Atractivo";
  return "Evitar / Riesgo";
}

function getMentorExplanation(mentorId: string, score: number, asset: RawAsset): string {
  if (mentorId === "andrea_redondo") {
    if (score > 80) return `Excelente opción para el largo plazo. Encaja con la filosofía de interés compuesto y sencillez.`;
    if (score > 60) return `Activo sólido pero requiere vigilancia en la valoración o el riesgo.`;
    return `No encaja bien con un perfil de inversión pasiva y tranquila.`;
  }
  
  if (mentorId === "pablo_gil") {
    if (score > 80) return `Relación riesgo/beneficio muy atractiva bajo el prisma macro actual.`;
    if (score > 60) return `Interesante tácticamente si se gestiona bien el stop y el tamaño de posición.`;
    return `Riesgos estructurales o de valoración que hacen aconsejable mantenerse al margen.`;
  }

  return "Análisis pendiente de revisión.";
}
