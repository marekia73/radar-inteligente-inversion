import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(cors({ origin: true }));
  const PORT = 3000;

  // Endpoint FRED
  app.get("/api/fred", async (req, res) => {
    const seriesId = req.query.seriesId as string;
    const apiKey = process.env.FRED_API_KEY;

    if (!seriesId) return res.status(400).json({ ok: false, provider: "FRED", reason: "seriesId es obligatorio" });
    if (!apiKey) {
      return res.status(500).json({ ok: false, provider: "FRED", seriesId, detectedIssue: "missing_key", reason: "FRED_API_KEY no configurada en el servidor" });
    }
    if (apiKey.length < 10) {
      return res.status(500).json({ ok: false, provider: "FRED", seriesId, detectedIssue: "invalid_key", reason: "FRED_API_KEY parece ser inválida" });
    }

    try {
      const encodedSeriesId = encodeURIComponent(seriesId);
      const encodedApiKey = encodeURIComponent(apiKey);
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${encodedSeriesId}&api_key=${encodedApiKey}&file_type=json&sort_order=desc&limit=1`;
      const response = await fetch(url);
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        return res.status(response.status >= 400 ? response.status : 500).json({ 
          ok: false, 
          provider: "FRED", 
          seriesId, 
          detectedIssue: "unexpected_payload",
          status: response.status,
          statusText: response.statusText,
          bodyPreview: text.substring(0, 300),
          reason: `FRED devolvió un formato no válido: ${response.statusText}` 
        });
      }

      if (!response.ok) {
        return res.status(response.status).json({ 
          ok: false, 
          provider: "FRED", 
          seriesId, 
          detectedIssue: "fred_http_error",
          reason: data.error_message || `Error de FRED: ${response.statusText}` 
        });
      }

      if (data.observations && data.observations.length > 0) {
        return res.json({
          ok: true,
          provider: "FRED",
          seriesId,
          value: parseFloat(data.observations[0].value),
          date: data.observations[0].date,
          rawStatus: "real"
        });
      }
      return res.status(404).json({ ok: false, provider: "FRED", seriesId, reason: "No se encontraron observaciones" });
    } catch (error) {
      return res.status(500).json({ ok: false, provider: "FRED", seriesId, detectedIssue: "network_error", reason: "Error de red al conectar con FRED backend" });
    }
  });

  // Endpoint FRED Diagnostic
  app.get("/api/fred/diagnostic", async (req, res) => {
    const seriesId = req.query.seriesId as string || "FEDFUNDS";
    const apiKey = process.env.FRED_API_KEY;
    
    const result = {
      ok: false,
      provider: "FRED",
      seriesId,
      apiKeyPresent: !!apiKey,
      apiKeyLooksValid: !!apiKey && apiKey.length >= 10,
      detectedIssue: "none",
      httpStatus: null as number | null,
      message: "Diagnostic init",
      rawKeysReceived: [] as string[]
    };

    if (!result.apiKeyPresent) {
      result.detectedIssue = "missing_key";
      result.message = "La clave FRED_API_KEY no está configurada en process.env.";
      return res.json(result);
    }
    
    if (!result.apiKeyLooksValid) {
      result.detectedIssue = "invalid_key";
      result.message = "La clave FRED_API_KEY parece demasiado corta para ser válida.";
      return res.json(result);
    }

    try {
      const encodedSeriesId = encodeURIComponent(seriesId);
      const encodedApiKey = encodeURIComponent(apiKey as string);
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${encodedSeriesId}&api_key=${encodedApiKey}&file_type=json&sort_order=desc&limit=1`;
      
      const response = await fetch(url);
      result.httpStatus = response.status;
      const text = await response.text();
      
      let data;
      try {
        data = JSON.parse(text);
        result.rawKeysReceived = Object.keys(data);
      } catch (e) {
        result.detectedIssue = "unexpected_payload";
        result.message = "FRED devolvió contenido que no es JSON.";
        (result as any).bodyPreview = text.substring(0, 300);
        return res.json(result);
      }

      if (!response.ok) {
        result.detectedIssue = "provider_error";
        result.message = data.error_message || `FRED respondió con estado HTTP ${response.status} ${response.statusText}`;
        return res.json(result);
      }

      if (data.observations) {
        result.ok = true;
        result.detectedIssue = "real";
        result.message = "La conexión con FRED funciona correctamente y ha devuelto observaciones.";
      } else {
        result.detectedIssue = "unexpected_payload";
        result.message = "FRED devolvió JSON válido pero sin la propiedad 'observations'.";
      }
      
      return res.json(result);

    } catch (error: any) {
      result.detectedIssue = "network_error";
      result.message = `Error de red contactando a FRED: ${error.message}`;
      return res.json(result);
    }
  });

  // Endpoint Alpha Vantage Quote
  app.get("/api/alpha/quote", async (req, res) => {
    const symbol = req.query.symbol as string;
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (!symbol) return res.status(400).json({ ok: false, provider: "Alpha Vantage", reason: "symbol es obligatorio" });
    if (!apiKey) return res.status(500).json({ ok: false, provider: "Alpha Vantage", reason: "La variable ALPHA_VANTAGE_API_KEY no está configurada en el backend." });
    if (apiKey && apiKey.length < 5) return res.status(500).json({ ok: false, provider: "Alpha Vantage", reason: "La clave de Alpha Vantage parece inválida." });

    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ ok: false, provider: "Alpha Vantage", symbol, reason: `Error Alpha Vantage: ${response.statusText}` });
      }
      const data = await response.json();
      if (data.Note || data.Information) {
         return res.status(429).json({ ok: false, provider: "Alpha Vantage", symbol, reason: "Alpha Vantage ha limitado temporalmente las llamadas de la cuenta gratuita." });
      }
      if (data["Error Message"]) {
         return res.status(404).json({ ok: false, provider: "Alpha Vantage", symbol, reason: "Símbolo no disponible en Alpha Vantage." });
      }
      const quote = data["Global Quote"];
      if (!quote || !quote["05. price"]) {
        return res.status(404).json({ ok: false, provider: "Alpha Vantage", symbol, reason: "Respuesta inesperada de Alpha Vantage." });
      }
      return res.json({
        ok: true,
        provider: "Alpha Vantage",
        symbol,
        price: parseFloat(quote["05. price"]),
        changePercent: parseFloat(quote["10. change percent"].replace('%', '')),
        currency: "USD", // Alpha Vantage suele devolver USD por defecto en acciones de EEUU.
        lastUpdated: quote["07. latest trading day"],
        rawStatus: "real"
      });
    } catch (error) {
       return res.status(500).json({ ok: false, provider: "Alpha Vantage", symbol, reason: "Error de conexión interna Alpha Vantage" });
    }
  });

  // Endpoint Alpha Vantage Historical
  app.get("/api/alpha/historical", async (req, res) => {
    const symbol = req.query.symbol as string;
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (!symbol) return res.status(400).json({ ok: false, provider: "Alpha Vantage", reason: "symbol es obligatorio" });
    if (!apiKey) return res.status(500).json({ ok: false, provider: "Alpha Vantage", reason: "La variable ALPHA_VANTAGE_API_KEY no está configurada en el backend." });
    if (apiKey && apiKey.length < 5) return res.status(500).json({ ok: false, provider: "Alpha Vantage", reason: "La clave de Alpha Vantage parece inválida." });

    try {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${symbol}&apikey=${apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ ok: false, provider: "Alpha Vantage", symbol, reason: `Error Alpha Vantage: ${response.statusText}` });
      }
      const data = await response.json();
      if (data.Note || data.Information) {
         return res.status(429).json({ ok: false, provider: "Alpha Vantage", symbol, reason: "Alpha Vantage ha limitado temporalmente las llamadas de la cuenta gratuita." });
      }
      if (data["Error Message"]) {
         return res.status(404).json({ ok: false, provider: "Alpha Vantage", symbol, reason: "Símbolo no disponible en Alpha Vantage." });
      }

      const timeSeries = data["Weekly Time Series"];
      if (!timeSeries) {
         return res.status(404).json({ ok: false, provider: "Alpha Vantage", symbol, reason: "Respuesta inesperada de Alpha Vantage." });
      }

      const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      if (dates.length < 52) {
         return res.status(400).json({ ok: false, provider: "Alpha Vantage", symbol, reason: "Histórico insuficiente" });
      }

      const currentPrice = parseFloat(timeSeries[dates[0]]["4. close"]);
      const oneMonthAgoPrice = parseFloat(timeSeries[dates[4]]["4. close"]);
      const threeMonthAgoPrice = parseFloat(timeSeries[dates[13]]["4. close"]);
      const oneYearAgoPrice = parseFloat(timeSeries[dates[51]]["4. close"]);

      let high52 = -Infinity;
      let low52 = Infinity;
      for (let i = 0; i < 52; i++) {
         const d = timeSeries[dates[i]];
         const h = parseFloat(d["2. high"]);
         const l = parseFloat(d["3. low"]);
         if (h > high52) high52 = h;
         if (l < low52) low52 = l;
      }

      const calcChange = (current: number, past: number) => ((current - past) / past) * 100;

      return res.json({
        ok: true,
        provider: "Alpha Vantage",
        symbol,
        oneMonthChangePercent: calcChange(currentPrice, oneMonthAgoPrice),
        threeMonthChangePercent: calcChange(currentPrice, threeMonthAgoPrice),
        oneYearChangePercent: calcChange(currentPrice, oneYearAgoPrice),
        fiftyTwoWeekHigh: high52,
        fiftyTwoWeekLow: low52,
        historicalPoints: dates.length,
        lastUpdated: dates[0],
        rawStatus: "real"
      });
    } catch (error) {
       return res.status(500).json({ ok: false, provider: "Alpha Vantage", symbol, reason: "Error de conexión interna Alpha Vantage" });
    }
  });

  // Endpoint Alpha Vantage Diagnostic
  app.get("/api/alpha/diagnostic", async (req, res) => {
    const symbol = req.query.symbol as string;
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    const result = {
      ok: false,
      provider: "Alpha Vantage",
      symbol: symbol || "NONE",
      apiKeyPresent: !!apiKey,
      apiKeyLooksValid: !!(apiKey && apiKey.length > 5 && apiKey !== "DEMO"),
      detectedIssue: "none",
      message: "Operación completada.",
      rawKeysReceived: [] as string[]
    };

    if (!symbol) {
      result.detectedIssue = "symbol_not_available";
      result.message = "symbol es obligatorio";
      return res.json(result);
    }
    
    if (!apiKey) {
      result.detectedIssue = "missing_key";
      result.message = "La variable ALPHA_VANTAGE_API_KEY no está configurada en el backend.";
      return res.json(result);
    }
    
    if (!result.apiKeyLooksValid) {
      result.detectedIssue = "invalid_key";
      result.message = "La clave de Alpha Vantage parece inválida.";
      return res.json(result);
    }

    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        result.detectedIssue = "provider_error";
        result.message = `Fallo HTTP desde Alpha Vantage (Status: ${response.status})`;
        return res.json(result);
      }
      
      const data = await response.json();
      result.rawKeysReceived = Object.keys(data);
      
      if (data.Note) {
        result.detectedIssue = "rate_limit";
        result.message = "Alpha Vantage ha limitado temporalmente las llamadas de la cuenta gratuita.";
      } else if (data.Information) {
        result.detectedIssue = "rate_limit";
        result.message = "Alpha Vantage ha limitado temporalmente las llamadas de la cuenta gratuita.";
      } else if (data["Error Message"]) {
        result.detectedIssue = "symbol_not_available";
        result.message = "Símbolo no disponible en Alpha Vantage o error en la petición.";
      } else if (data["Global Quote"]) {
        result.ok = true;
        result.message = "Conexión exitosa, quote obtenido.";
      } else {
        result.detectedIssue = "unexpected_payload";
        result.message = "Respuesta inesperada de Alpha Vantage.";
      }
      
      return res.json(result);
    } catch (error) {
      result.detectedIssue = "network_error";
      result.message = "Error de red al intentar contactar a Alpha Vantage.";
      return res.json(result);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get(/^\/(?!api).*/, (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
