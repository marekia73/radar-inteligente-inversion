import { MentorProfile, AssetType } from "../types";

export const mockMentors: MentorProfile[] = [
  {
    id: "andrea_redondo",
    name: "Andrea Redondo / Club de Inversión",
    description: "Enfoque en libertad financiera mediante inversión pasiva, ETFs y visión a largo plazo.",
    style: "Conservador / Educativo / Largo Plazo",
    principles: [
      "Prioridad absoluta al largo plazo",
      "Preferir ETFs sobre acciones individuales",
      "Diversificación máxima",
      "Aportaciones periódicas (DCA)",
      "Psicología del inversor ante todo"
    ],
    redFlags: [
      "Market timing",
      "Productos financieros complejos",
      "Apalancamiento",
      "Sectores de moda sin fundamento",
      "Altas comisiones"
    ],
    preferredAssets: [AssetType.ETF, AssetType.Defensivo],
    avoidedAssets: [AssetType.Accion],
    scoringWeights: {
      risk: -0.4,
      potential: 0.2,
      valuation: 0.1,
      simplicity: 0.3,
      trust: 0.3
    }
  },
  {
    id: "pablo_gil",
    name: "Pablo Gil",
    description: "Analista macroeconómico experto en ciclos, liquidez y gestión de riesgos tácticos.",
    style: "Macro / Técnico / Prudente",
    principles: [
      "Entender el ciclo económico",
      "Vigilancia de la inflación y tipos de interés",
      "Gestión estricta del riesgo geopolítico",
      "Liquidez como activo estratégico",
      "Prudencia en momentos de euforia"
    ],
    redFlags: [
      "Burbujas especulativas",
      "Exceso de complacencia en el mercado",
      "Desconexión entre precio y macro",
      "Baja liquidez del activo",
      "Riesgo de crédito descontrolado"
    ],
    preferredAssets: [AssetType.Accion, AssetType.Sector, AssetType.Defensivo],
    avoidedAssets: [],
    scoringWeights: {
      risk: -0.3,
      potential: 0.3,
      valuation: 0.3,
      simplicity: 0.1,
      trust: 0.3
    }
  }
];

export const KNOWLEDGE_DISCLAIMER = "Perfil de conocimiento simulado basado en el estilo público de los mentores. Pendiente de conexión real con NotebookLM para análisis dinámico.";
