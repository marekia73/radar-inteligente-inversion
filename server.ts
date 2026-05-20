import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

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

  // Endpoint Yahoo Finance Quote
  app.get("/api/market/quote", async (req, res) => {
    const symbol = req.query.symbol as string;

    if (!symbol) return res.status(400).json({ ok: false, provider: "Yahoo Finance", reason: "symbol es obligatorio" });

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ ok: false, provider: "Yahoo Finance", symbol, reason: `Error Yahoo Finance: ${response.statusText}` });
      }
      const data = await response.json();
      const result = data.chart?.result?.[0];
      if (!result) {
         return res.status(404).json({ ok: false, provider: "Yahoo Finance", symbol, reason: "Símbolo no encontrado." });
      }
      
      const meta = result.meta;
      const price = meta.regularMarketPrice;
      const previousClose = meta.chartPreviousClose || meta.previousClose;
      let changePercent = 0;
      if (price && previousClose) {
         changePercent = ((price - previousClose) / previousClose) * 100;
      }
      
      return res.json({
        ok: true,
        provider: "Yahoo Finance",
        symbol,
        price,
        changePercent,
        currency: meta.currency || "USD",
        lastUpdated: new Date().toISOString(),
        rawStatus: "real"
      });
    } catch (error) {
       return res.status(500).json({ ok: false, provider: "Yahoo Finance", symbol, reason: "Error de conexión interna Yahoo Finance" });
    }
  });

  // Endpoint Yahoo Finance Historical
  app.get("/api/market/historical", async (req, res) => {
    const symbol = req.query.symbol as string;

    if (!symbol) return res.status(400).json({ ok: false, provider: "Yahoo Finance", reason: "symbol es obligatorio" });

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ ok: false, provider: "Yahoo Finance", symbol, reason: `Error Yahoo Finance: ${response.statusText}` });
      }
      const data = await response.json();
      const result = data.chart?.result?.[0];
      if (!result) {
         return res.status(404).json({ ok: false, provider: "Yahoo Finance", symbol, reason: "Símbolo no encontrado." });
      }

      const timestamps = result.timestamp || [];
      const quote = result.indicators?.quote?.[0] || {};
      const closePrices = quote.close || [];
      const highs = quote.high || [];
      const lows = quote.low || [];

      // Remove nulls mapping arrays with indexes
      const validIndexes = closePrices.map((c: any, i: number) => c !== null ? i : -1).filter((i: number) => i !== -1);
      
      if (validIndexes.length < 5) {
         return res.status(400).json({ ok: false, provider: "Yahoo Finance", symbol, reason: "Histórico insuficiente" });
      }

      const getValidPrice = (targetIndexFromEnd: number) => {
          let idx = validIndexes.length - 1 - targetIndexFromEnd;
          if (idx < 0) idx = 0;
          return closePrices[validIndexes[idx]];
      }

      const currentPrice = getValidPrice(0);
      const oneMonthAgoPrice = getValidPrice(21); // aprox 21 trading days in month
      const threeMonthAgoPrice = getValidPrice(63); // aprox 63 trading days
      const oneYearAgoPrice = getValidPrice(validIndexes.length - 1);

      let high52 = -Infinity;
      let low52 = Infinity;
      for (const idx of validIndexes) {
         const h = highs[idx];
         const l = lows[idx];
         if (h !== null && h > high52) high52 = h;
         if (l !== null && l < low52) low52 = l;
      }
      if (high52 === -Infinity) high52 = 0;
      if (low52 === Infinity) low52 = 0;

      const calcChange = (current: number, past: number) => past !== 0 ? ((current - past) / past) * 100 : 0;

      return res.json({
        ok: true,
        provider: "Yahoo Finance",
        symbol,
        oneMonthChangePercent: calcChange(currentPrice, oneMonthAgoPrice),
        threeMonthChangePercent: calcChange(currentPrice, threeMonthAgoPrice),
        oneYearChangePercent: calcChange(currentPrice, oneYearAgoPrice),
        fiftyTwoWeekHigh: high52,
        fiftyTwoWeekLow: low52,
        historicalPoints: validIndexes.length,
        lastUpdated: new Date().toISOString(),
        rawStatus: "real"
      });
    } catch (error) {
       return res.status(500).json({ ok: false, provider: "Yahoo Finance", symbol, reason: "Error de conexión interna Yahoo Finance" });
    }
  });

  // Endpoint Yahoo Finance Diagnostic
  app.get("/api/market/diagnostic", async (req, res) => {
    const symbol = req.query.symbol as string || "MSFT";
    
    const result = {
      ok: false,
      provider: "Yahoo Finance",
      symbol: symbol,
      detectedIssue: "none",
      message: "Operación completada.",
      rawKeysReceived: [] as string[]
    };

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
      const response = await fetch(url);
      
      if (!response.ok) {
        result.detectedIssue = "provider_error";
        result.message = `Fallo HTTP desde Yahoo Finance (Status: ${response.status})`;
        return res.json(result);
      }
      
      const data = await response.json();
      result.rawKeysReceived = Object.keys(data);
      
      const chartResult = data.chart?.result?.[0];
      if (chartResult) {
        result.ok = true;
        result.message = "Conexión exitosa, quote obtenido.";
      } else if (data.chart?.error) {
        result.detectedIssue = "missing_symbol";
        result.message = `Símbolo no disponible: ${data.chart.error?.description || 'Error desconocido'}`;
      } else {
        result.detectedIssue = "unexpected_payload";
        result.message = "Respuesta inesperada de Yahoo Finance.";
      }
      
      return res.json(result);
    } catch (error: any) {
      result.detectedIssue = "network_error";
      result.message = `Error de red al intentar contactar a Yahoo Finance: ${error.message}`;
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
