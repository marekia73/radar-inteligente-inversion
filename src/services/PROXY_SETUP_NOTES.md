# Documentación para Backend Proxy (Radar Inteligente de Inversión)

## Contexto Arquitectónico
En modo `frontend-demo`, la aplicación utiliza variables de entorno inyectadas a través de Vite (`VITE_ALPHA_VANTAGE_API_KEY`, `VITE_FRED_API_KEY`) y se conecta de forma directa a las APIs externas. Esto presenta dos grandes problemas que impiden una puesta en producción:
1. **Exposición de credenciales:** Las claves insertadas en el frontend pueden ser extraídas y mal utilizadas.
2. **Políticas CORS:** Algunas APIs (especialmente FRED) no soportan respuestas o configuraciones CORS adecuadas cuando son llamadas desde un cliente de navegador en producción. 

Para solventar estos inconvenientes, se introduce el modo `proxy-ready`.

## Configuración y Variables de Entorno
El backend necesita tener acceso a las claves de API como variables puras de entorno (sin exponerlas al frontend).
```env
ALPHA_VANTAGE_API_KEY=tu_clave_de_alpha_vantage
FRED_API_KEY=tu_clave_de_fred
```
Ninguna variable debería comenzar con prefijos (como `VITE_` o `REACT_APP_`) si no queremos exponerlas en el código del cliente.

## Endpoints Requeridos (Contratos)

Para completar la migración de `backendProxyClient.ts`, el backend (Node.js/Express, Serverless, o Edge function) deberá exponer las siguientes rutas respondiendo en formato JSON.

### 1. Macro: FRED
Ruta sugerida:
`GET /api/fred?seriesId={SERIES_ID}`

El backend deberá solicitar los datos a:
`https://api.stlouisfed.org/fred/series/observations?series_id={SERIES_ID}&api_key={FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`
(Y agregar limitadores adiciones si corresponde, por ejemplo `&units=pc1` para CPIAUCSL). Pasa la información y datos filtrados directamente.

### 2. Mercado: Cotización Alpha Vantage
Ruta sugerida:
`GET /api/alpha/quote?symbol={SYMBOL}`

El backend deberá solicitar los datos a:
`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={SYMBOL}&apikey={ALPHA_VANTAGE_API_KEY}`

### 3. Mercado: Histórico Alpha Vantage
Ruta sugerida:
`GET /api/alpha/historical?symbol={SYMBOL}`

El backend deberá solicitar los datos a:
`https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol={SYMBOL}&apikey={ALPHA_VANTAGE_API_KEY}`

## Buenas Prácticas Backend Adicionales
1. **Sistema de Caché Estricto:** Implementa Redis o cachés en memoria para minimizar las llamadas reales, dado que ambas fuentes tienen límites estrictos en su capa libre o de usuario estándar.
2. **Rate Limiting:** Asegúrate de que usuarios malintencionados en el cliente no agoten las llamadas permitidas.
3. **Manejo de Errores Propagado:** En caso de que el proveedor falle o se agote la cuota, el backend debe proporcionar códigos claros (429 Too Many Requests, error en el JSON) y dejarlos fluir al cliente para que los fallbacks visuales puedan seguir actuando.
