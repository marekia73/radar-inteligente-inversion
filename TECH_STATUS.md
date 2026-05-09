# Estado Técnico (TECH_STATUS)

## Arquitectura Actual
- **Frontend:** React 18+ sobre Vite. Interfaz modular, con tipado estricto en TS y uso de Tailwind CSS + Componentes visuales minimalistas e indicadores interactivos.
- **Backend / Proxy:** Nodo Express ligero. En desarrollo actúa como "middleware mode" en Vite, y en producción sirve los ficheros distribuidos como Backend/Serverless.
- **Modo de Operación Datos:** `proxy-ready` (Arquitectura dividida Frontend/Backend con variables ocultadas del lado del cliente).

## Endpoints Disponibles en Backend Integrado
El frontend ataca internamente a:
- `/api/fred` : Recuperación de series macroeconómicas de St. Louis Fed.
- `/api/alpha/quote` : Obtención de precio directo del activo (Global Quote) vía Alpha Vantage.
- `/api/alpha/historical` : Obtiene series temporales para resolver medias, rangos de 52 semanas y cambio porcentual a 1/3/12 meses de Alpha Vantage.

## Variables de Entorno Necesarias
Para que las APIs funcionen en produccion se debe inyectar de manera segura en el server:
- `ALPHA_VANTAGE_API_KEY`
- `FRED_API_KEY`

**Nota:** En modo proxy-ready las claves API no deben exponerse en el frontend. Deben residir exclusivamente en variables de entorno del backend/servidor. Las variables VITE_* pertenecían al modo frontend-demo y no deben usarse para producción.

## Estado Actual de Proveedores
- **Estabilidad FRED:** Flujo muy estable a través del endpoint Proxy. Susceptible de responder siempre `real` o `cache` gracias a márgenes generosos de uso. ECB_RATE no tiene endpoint público en FRED, por lo que actúa en fallback controlado.
- **Estabilidad Alpha Vantage:** Operando en límites estrictos (<25 llamadas al día para tier gratuito). Usa mecánicas agresivas defensivas, por lo que el estado pasará a `cache` pronto tras interactuar, o arrojara avisos controlados en consola devolviendo los fallos como `simulated` si el quota de 25 llamadas expira.

## Mecánicas de Estabilización (Caché & Fallback)
La app nunca se bloquea en "pantalla blanca" frente a rate limits o fallos CORS de terceros, gracias a:
- Caché Temporal persistente por activo / indicador.
- Regreso inmediato a datos Simulados/Educativos si no ha existido conexión con la API proveedora, informando explícitamente mediante componentes UI al usuario final (Ej: Iconos naranjas, mensajes "Dato Educativo: Sin Histórico").

## Archivos CRÍTICOS - Intocables sin revisión
Los "cerebros" matemáticos y de ponderación. Modificarlos cambia la naturaleza entera del programa:
- `src/logic/scoringEngine.ts` (Lógica central del Radar).
- `src/logic/mentorEngine.ts` (Juicios en base al cruce de indicadores para el Mentor Andrea/Pablo).
- `src/logic/knowledgeMatcher.ts` (Empate de etiquetas con la BB.DD. de conocimiento y recomendaciones a dar).
- Las reglas JSON en `src/data/knowledgeRules.ts` y las entidades base en `src/data/mockData.ts`.
