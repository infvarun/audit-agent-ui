import express from "express";
import { createServer } from "http";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { createServer as createViteServer, ViteDevServer } from "vite";
import { apiRouter } from "./routes.js";
import session from "express-session";
import { nanoid } from "nanoid";
import MemoryStore from "memorystore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Session store
const MemoryStoreSession = MemoryStore(session);

app.use(session({
  genid: () => nanoid(),
  secret: process.env.SESSION_SECRET || "dev-secret-key",
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000, // prune expired entries every 24h
  }),
  cookie: {
    secure: false, // set to true if using https
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
}));

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5173"],
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// API routes
app.use("/api", apiRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const server = createServer(app);

if (process.env.NODE_ENV === "development") {
  // Development mode - set up Vite dev server
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
    root: join(__dirname, "../client"),
    build: {
      outDir: join(__dirname, "../dist/public"),
    },
  });

  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);

  // Handle client-side routing
  app.get("*", async (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }

    try {
      const url = req.originalUrl;
      const template = await vite.transformIndexHtml(url, `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Audit Data Collection</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
        </html>
      `);
      
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
} else {
  // Production mode - serve static files
  app.use(express.static(join(__dirname, "../dist/public")));
  
  app.get("*", (req, res) => {
    res.sendFile(join(__dirname, "../dist/public/index.html"));
  });
}

const port = process.env.PORT || 5000;
server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});

export default app;