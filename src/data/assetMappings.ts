export interface AssetMapping {
  internalTicker: string;
  providerSymbol: string;
  provider: "alpha_vantage" | "ecb" | "fred";
  notes?: string;
  enabledForRealMarketData: boolean;
}

export const assetMappings: Record<string, AssetMapping> = {
  // Acciones habilitadas
  "MSFT": { internalTicker: "MSFT", providerSymbol: "MSFT", provider: "alpha_vantage", enabledForRealMarketData: true },
  "AAPL": { internalTicker: "AAPL", providerSymbol: "AAPL", provider: "alpha_vantage", enabledForRealMarketData: true },
  "NVDA": { internalTicker: "NVDA", providerSymbol: "NVDA", provider: "alpha_vantage", enabledForRealMarketData: true },
  "GOOGL": { internalTicker: "GOOGL", providerSymbol: "GOOGL", provider: "alpha_vantage", enabledForRealMarketData: true },
  "AMZN": { internalTicker: "AMZN", providerSymbol: "AMZN", provider: "alpha_vantage", enabledForRealMarketData: true },
  "TSLA": { internalTicker: "TSLA", providerSymbol: "TSLA", provider: "alpha_vantage", enabledForRealMarketData: true },
  "V": { internalTicker: "V", providerSymbol: "V", provider: "alpha_vantage", enabledForRealMarketData: true },
  "ASML": { internalTicker: "ASML", providerSymbol: "ASML", provider: "alpha_vantage", enabledForRealMarketData: true },
  "NOVO-B": { internalTicker: "NOVO-B", providerSymbol: "NVO", provider: "alpha_vantage", enabledForRealMarketData: true, notes: "Usando el ADR en EEUU (NVO) al no estar claro el soporte internacional" },
  "BRK.A": { internalTicker: "BRK.A", providerSymbol: "BRK-B", provider: "alpha_vantage", enabledForRealMarketData: true, notes: "Se usa BRK-B para evitar valores anómalos o falta de datos en BRK.A" },
  
  // ETFs y otros no habilitados todavía
  "VWCE": { internalTicker: "VWCE", providerSymbol: "VWCE.DEX", provider: "alpha_vantage", enabledForRealMarketData: false, notes: "Pendiente de proveedor compatible para ETFs europeos o activo sintético" },
  "IWDA": { internalTicker: "IWDA", providerSymbol: "IWDA.LON", provider: "alpha_vantage", enabledForRealMarketData: false, notes: "Pendiente de proveedor compatible para ETFs europeos o activo sintético" },
  "CSPX": { internalTicker: "CSPX", providerSymbol: "CSPX.LON", provider: "alpha_vantage", enabledForRealMarketData: false, notes: "Pendiente de proveedor compatible para ETFs europeos o activo sintético" },
  "EIMI": { internalTicker: "EIMI", providerSymbol: "EIMI.LON", provider: "alpha_vantage", enabledForRealMarketData: false, notes: "Pendiente de proveedor compatible para ETFs europeos o activo sintético" },
  "AGGG": { internalTicker: "AGGG", providerSymbol: "AGGG.LON", provider: "alpha_vantage", enabledForRealMarketData: false, notes: "Pendiente de proveedor compatible para ETFs europeos o activo sintético" },
  "XEON": { internalTicker: "XEON", providerSymbol: "XEON.DEX", provider: "alpha_vantage", enabledForRealMarketData: false, notes: "Pendiente de proveedor compatible para ETFs europeos o activo sintético" },
  
  "MONEY/EUR": { internalTicker: "MONEY/EUR", providerSymbol: "XEON.DEX", provider: "alpha_vantage", enabledForRealMarketData: false, notes: "Pendiente de proveedor compatible para ETFs europeos o activo sintético" },
  "GOVT/ST": { internalTicker: "GOVT/ST", providerSymbol: "GOVT", provider: "alpha_vantage", enabledForRealMarketData: false, notes: "Pendiente de proveedor compatible para ETFs europeos o activo sintético" },
  "IA/SEC": { internalTicker: "IA/SEC", providerSymbol: "BOTZ", provider: "alpha_vantage", enabledForRealMarketData: false, notes: "Pendiente de proveedor compatible para ETFs europeos o activo sintético" },
  "SEMI/SEC": { internalTicker: "SEMI/SEC", providerSymbol: "SMH", provider: "alpha_vantage", enabledForRealMarketData: false, notes: "Pendiente de proveedor compatible para ETFs europeos o activo sintético" },
  "CYBER/SEC": { internalTicker: "CYBER/SEC", providerSymbol: "CIBR", provider: "alpha_vantage", enabledForRealMarketData: false, notes: "Pendiente de proveedor compatible para ETFs europeos o activo sintético" }
};
