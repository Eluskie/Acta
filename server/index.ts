import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, uploadDir } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { clerkMiddleware } from "./middleware/auth";

const app = express();
const httpServer = createServer(app);

// Clerk authentication middleware - must be before routes
// This makes auth available on all requests via req.auth
app.use(clerkMiddleware());

// Use the same uploads directory as routes.ts (configured via UPLOADS_DIR env var or defaults to cwd/uploads)
const uploadsDir = uploadDir;

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// Log the uploads directory on startup for debugging
console.log(`[uploads] Serving uploads from: ${uploadsDir}`);

// Serve uploaded files statically with absolute path
// This must be registered before the SPA catch-all in production
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(uploadsDir, req.path);
  
  // Log upload requests in production for debugging
  if (process.env.NODE_ENV === 'production') {
    console.log(`[uploads] Request for: ${req.path}`);
    console.log(`[uploads] Full path: ${filePath}`);
    console.log(`[uploads] File exists: ${fs.existsSync(filePath)}`);
  }
  
  next();
}, express.static(uploadsDir, {
  // Set proper headers for audio files
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.webm')) {
      res.setHeader('Content-Type', 'audio/webm');
    } else if (filePath.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
    } else if (filePath.endsWith('.wav')) {
      res.setHeader('Content-Type', 'audio/wav');
    } else if (filePath.endsWith('.m4a')) {
      res.setHeader('Content-Type', 'audio/mp4');
    }
    // Allow audio to be played from any origin
    res.setHeader('Accept-Ranges', 'bytes');
  }
}));

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
