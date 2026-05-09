import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Endpoint FRED
  app.get("/api/fred", async (req, res) => {
    const seriesId = req.query.seriesId as string;
    const apiKey = process.env.FRED_API_KEY || process.env.VITE_FRED_API_KEY;

    if (!seriesId) return res.status(400).json({ ok: false, provider: "FRED", reason: "seriesId es obligatorio" });
    if (!apiKey) return res.status(500).json({ ok: false, provider: "FRED", reason: "FRED_API_KEY no configurada en el servidor" });

    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ ok: false, provider: "FRED", seriesId, reason: `Error de FRED: ${response.statusText}` });
      }
      const data = await response.json();
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
      return res.status(500).json({ ok: false, provider: "FRED", seriesId, reason: "Error de red al conectar con FRED backend" });
    }
  });

  // Endpoint Alpha Vantage Quote
  app.get("/api/alpha/quote", async (req, res) => {
    const symbol = req.query.symbol as string;
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY || process.env.VITE_ALPHA_VANTAGE_API_KEY;

    if (!symbol) return res.status(400).json({ ok: false, provider: "Alpha Vantage", reason: "symbol es obligatorio" });
    if (!apiKey) return res.status(500).json({ ok: false, provider: "Alpha Vantage", reason: "ALPHA_VANTAGE_API_KEY no configurada" });

    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ ok: false, provider: "Alpha Vantage", symbol, reason: `Error Alpha Vantage: ${response.statusText}` });
      }
      const data = await response.json();
      if (data.Note || data.Information || data["Error Message"]) {
         return res.status(429).json({ ok: false, provider: "Alpha Vantage", symbol, reason: "Límite de proveedor alcanzado o símbolo no disponible" });
      }
      const quote = data["Global Quote"];
      if (!quote || !quote["05. price"]) {
        return res.status(404).json({ ok: false, provider: "Alpha Vantage", symbol, reason: "Datos de quote no disponibles" });
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
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY || process.env.VITE_ALPHA_VANTAGE_API_KEY;

    if (!symbol) return res.status(400).json({ ok: false, provider: "Alpha Vantage", reason: "symbol es obligatorio" });
    if (!apiKey) return res.status(500).json({ ok: false, provider: "Alpha Vantage", reason: "ALPHA_VANTAGE_API_KEY no configurada" });

    try {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${symbol}&apikey=${apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ ok: false, provider: "Alpha Vantage", symbol, reason: `Error Alpha Vantage: ${response.statusText}` });
      }
      const data = await response.json();
      if (data.Note || data.Information || data["Error Message"]) {
         return res.status(429).json({ ok: false, provider: "Alpha Vantage", symbol, reason: "Límite de proveedor alcanzado o símbolo no disponible" });
      }

      const timeSeries = data["Weekly Time Series"];
      if (!timeSeries) {
         return res.status(404).json({ ok: false, provider: "Alpha Vantage", symbol, reason: "Histórico insuficiente" });
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
