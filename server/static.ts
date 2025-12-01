import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // SPA fallback - serve index.html for client-side routing
  // Explicitly exclude /api and /uploads routes from the catch-all
  app.use("*", (req, res) => {
    const originalUrl = req.originalUrl;
    
    // Don't intercept API routes or uploads - let them 404 properly
    if (originalUrl.startsWith('/api') || originalUrl.startsWith('/uploads')) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    // For all other routes, serve the SPA
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
