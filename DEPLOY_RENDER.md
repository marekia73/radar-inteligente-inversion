# Despliegue en Render (Guía Paso a Paso)

El "Radar Inteligente de Inversión" está preparado para un despliegue optimizado en [Render](https://render.com), funcionando como un servicio web completo (Frontend empaquetado y servido por un backend Node/Express).

## Requisitos Previos
1. Una cuenta en [Render](https://render.com).
2. Repositorio subido a GitHub, GitLab o Bitbucket.
3. Tus claves API: `ALPHA_VANTAGE_API_KEY` y `FRED_API_KEY`.

## Pasos para Desplegar

1. **Inicia sesión en Render** y ve a tu Dashboard.
2. Haz clic en **"New +"** y selecciona **"Web Service"**.
3. Selecciona la opción **"Build and deploy from a Git repository"** y vincula la URL del proyecto.
4. Rellena la configuración básica del entorno:
   - **Name:** *Ej. radar-inversion*
   - **Region:** Elige la que tengas más cerca de ti.
   - **Branch:** `main` (o la rama que uses).
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build` *(Esto instala dependencias y compila la interfaz Vite)*.
   - **Start Command:** `npm start` *(Hará uso de tsx para levantar el backend integrado)*.

5. **Variables de Entorno (Environment Variables):**
   Añade las siguientes claves privadas en la pestaña de variables o sección inferior:
   - `ALPHA_VANTAGE_API_KEY` : (Tu API de Alpha Vantage)
   - `FRED_API_KEY` : (Tu API de St. Louis Fed)
   - `NODE_ENV` : `production`

   *(Opcional: Render asume un puerto y lo inyectará dinámicamente como `PORT`, no hace falta que lo declares explícitamente).*

6. Selecciona el **Plan (Free o Pagado)** y presiona en **"Create Web Service"**.

7. Espera unos minutos y revisa los logs. Verás a npm instalando dependencias, compilando Vite, y luego levantando `server.ts` de forma productiva.

8. ¡Listo! Accede a tu nueva **Dashboard Financiero** a través de la URL que provee Render en la cabecera (algo como `radar-inversion.onrender.com`).

## Validar y Probar Despliegue
Carga la web principal y prueba:
 - Abre el activo MSFT y verifica que no aparezcan alertas de conexión.
 - Abre el panel diagnóstico y verifica que tu "Modo API" indique los métodos reales u ocultos `proxy-ready`.
 - Chequea que el entorno cargó los macros FRED con éxito.
