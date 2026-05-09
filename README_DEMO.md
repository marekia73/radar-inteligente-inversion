# Radar Inteligente de Inversión - Versión Demo

¡Bienvenido al Radar Inteligente de Inversión! Esta es una aplicación interactiva diseñada para observar y aprender sobre los mercados financieros de forma segura.

## ⚠️ Aviso Legal Importante
**Esta herramienta tiene un propósito ESTRICTAMENTE EDUCATIVO y DE PRUEBA.**
- NO es una herramienta de asesoramiento financiero.
- NO ofrece recomendaciones reales de inversión, ni consejo sobre qué "comprar" o "vender".
- Toda información mostrada y cualquier mención a "interesante", "vigilar" u "observar" se ofrece solo para ilustrar cómo funcionan los modelos de evaluación y análisis financiero.

## ¿Qué es esta aplicación?
Es un "radar" que categoriza instrumentos financieros (Acciones, ETFs, Criptomonedas) en función de diversas métricas objetivas y opiniones adaptadas de conocimientos teóricos de expertos. La aplicación combina datos del mercado puro con el contexto macroeconómico.

## Estados de los Datos
Para brindar un servicio estable ante limitaciones de servicios externos, la plataforma etiqueta los datos con sus "estados":
- **Real:** Obtenidos directamente de las APIs financieras en este mismo instante.
- **Caché (Real en Caché):** Datos procedentes de fuentes reales que han sido obtenidos recientemente y se guardan temporalmente para no saturar la red (ahorro de llamadas).
- **Parcial:** Sucede si dentro de una bolsa de información, parte utiliza datos de API y otra parte recurre a simulados por saturación (Rate Limits).
- **Simulado:** Son datos puramente educativos y orientativos, generados por la aplicación cuando no se ha podido conectar al proveedor real o este no ofrece el activo seleccionado. Previenen que la aplicación se "rompa".

## ¿Qué son los datos Macro?
Mostramos indicadores globales, como la inflación estadounidense (IPC) o la Tasa de Desempleo (UNRATE). Observar estos datos ayuda a perfilar el entorno macroeconómico (ej. ¿Estamos ante presiones inflacionistas?).

## Rankings y Perfiles Educativos Mentores
La app aplica lógica cruzando conocimientos inspirados -a modo educativo- en perfiles de divulgación populares, ayudando a ver una oportunidad desde perspectivas contrarias:
- **Andrea Redondo:** Basado en conceptos de inversión a largo plazo, gestión indexada al mundo (aburrida y efectiva), sencillez y alta aversión a tratar de adivinar el mercado.
- **Pablo Gil:** Basado en el rigor por la historia macroeconómica, el análisis técnico detallado, atención minuciosa al contexto geopolítico y estrategias de volatilidad táctica.

## Limitaciones Técnicas y Modo PROXY-READY
- Se nutre de APIs gratuitas (Alpha Vantage y FRED), las cuales poseen límites muy estrictos de acceso (Rate Limits).
- Funciona en modo **PROXY-READY**: Las solicitudes se encaminan por un puente intermedio (Proxy/Server en Express) ocultando las credenciales de acceso, protegiendo las llaves privadas (API Keys) y saltándose potenciales bloqueos de seguridad del navegador (CORS).
- En este modo, las claves (`ALPHA_VANTAGE_API_KEY`, `FRED_API_KEY`) no deben exponerse al frontend (evitando el prefijo VITE_ que se usaría solo en prototipos o el modo frontend-demo antiguo). Las claves residen de forma privada en el backend.
