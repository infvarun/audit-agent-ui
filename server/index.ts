import express from "express";
import { createServer } from "http";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { exec } from "child_process";
import { createProxyMiddleware } from "http-proxy-middleware";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Start Python backend
console.log("Starting Python backend server on port 8000...");
const pythonProcess = exec("python3 start_python_backend.py", {
  cwd: join(__dirname, ".."),
  stdio: "pipe",
  env: { ...process.env, PORT: "8000" },
});

pythonProcess.stdout?.on("data", (data) => {
  console.log(`[Python] ${data.toString().trim()}`);
});

pythonProcess.stderr?.on("data", (data) => {
  console.error(`[Python Error] ${data.toString().trim()}`);
});

// Wait for Python server to start
await new Promise((resolve) => setTimeout(resolve, 3000));

// Health check for the Node.js proxy
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "nodejs-proxy" });
});

const server = createServer(app);

// Manual proxy handler for API routes
app.use("/api", async (req, res, next) => {
  console.log("API request received:", req.method, req.path);
  
  try {
    const response = await fetch(`http://localhost:8000${req.originalUrl}`, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...req.headers,
      },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });
    
    const data = await response.text();
    console.log("API response:", response.status, data.substring(0, 100));
    
    res.status(response.status);
    const contentType = response.headers.get("Content-Type") || "application/json";
    res.setHeader("Content-Type", contentType);
    console.log("Setting Content-Type:", contentType);
    res.send(data);
  } catch (error) {
    console.error("API proxy error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

if (process.env.NODE_ENV === "development") {
  // Development mode - serve built files directly
  app.use(express.static(join(__dirname, "../dist/public")));
  
  // Handle client-side routing - but NOT for API routes
  app.get("*", (req, res, next) => {
    // Skip API routes - they're handled by the proxy above
    if (req.path.startsWith("/api/")) {
      return next();
    }
    
    // Check if built files exist
    const indexPath = join(__dirname, "../dist/public/index.html");
    if (require("fs").existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Frontend not built. Please run 'npm run build' first.");
    }
  });
} else {
  // Production mode - serve static files
  app.use(express.static(join(__dirname, "../dist/public")));
  
  // Handle client-side routing - but NOT for API routes
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }
    res.sendFile(join(__dirname, "../dist/public/index.html"));
  });
}

const port = process.env.PORT || 5000;
server.listen(port, "0.0.0.0", () => {
  console.log(`Node.js proxy server running on port ${port}`);
  console.log(`Python backend running on port 8000`);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down servers...");
  pythonProcess.kill();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down servers...");
  pythonProcess.kill();
  process.exit(0);
});

export default app;