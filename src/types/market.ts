export interface MarketData {
  symbol: string;
  price: number | null;
  currency: string;
  changePercent1D: number | null;
  changePercent1M: number | null;
  changePercent6M: number | null;
  changePercent1Y: number | null;
  high52Week: number | null;
  low52Week: number | null;
  lastUpdated: string;
  source: string;
  status: "real" | "simulated" | "partial" | "error";
  fromCache?: boolean;
  stale?: boolean;
  provider?: string;
  providerSymbol?: string;
  fallbackReason?: string;
  errorReason?: string;
  requestedSymbol?: string;
  oneMonthChangePercent?: number | null;
  threeMonthChangePercent?: number | null;
  oneYearChangePercent?: number | null;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
  lastTradingDay?: string | null;
  providerMode?: 'frontend-demo' | 'backend-proxy' | 'proxy-ready';
  historicalStatus?: 'real' | 'cache' | 'stale' | 'simulated' | 'error' | 'not_available';
  historicalReason?: string | null;
  historicalLastUpdated?: string | null;
}

export interface MacroIndicator {
  id: string;
  name: string;
  value: number | null;
  unit: string;
  region: "US" | "EU" | "Global";
  lastUpdated: string;
  source: string;
  status: "real" | "simulated" | "partial" | "error";
  fromCache?: boolean;
  stale?: boolean;
  provider?: string;
  providerSymbol?: string;
  fallbackReason?: string;
  errorReason?: string;
  requestedSymbol?: string;
  providerMode?: 'frontend-demo' | 'backend-proxy' | 'proxy-ready';
}

export interface DataQuality {
  marketDataStatus: "real" | "partial" | "simulated" | "error";
  macroDataStatus: "real" | "partial" | "simulated" | "error";
  message: string;
  isUsingCache?: boolean;
}
