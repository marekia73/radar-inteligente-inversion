export type DataProviderMode = 'frontend-demo' | 'proxy-ready';

// Por defecto usamos proxy-ready para modo producción.
export const DATA_PROVIDER_MODE: DataProviderMode = 'proxy-ready';

// Banderas para activar/desactivar proxy
export const USE_PROXY_FOR_MARKET_DATA = DATA_PROVIDER_MODE === 'proxy-ready';
export const USE_PROXY_FOR_MACRO_DATA = DATA_PROVIDER_MODE === 'proxy-ready';

export const DATA_PROVIDER_NOTES = {
  'frontend-demo': 'Modo prototipo: usa claves VITE en navegador, solo para pruebas locales. Posibles problemas de CORS (FRED) y límites de APIs.',
  'proxy-ready': 'Modo producción recomendado: las llamadas usan endpoints /api/... para proteger claves y evitar CORS.'
};
