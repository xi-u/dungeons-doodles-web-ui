import express from "express";
import fs from "node:fs";
import path from "node:path";

import { DIST_DIR, PUBLIC_DIR, SRC_DIR } from "./config.js";

/**
 * Creates and configures an Express application for the DrawingWebServer.
 * The application serves static files from the DIST_DIR, PUBLIC_DIR, and SRC_DIR directories.
 *
 * @returns {app}
 */
export function createApp() {
    const app = express();

    // Serve static files from the DIST_DIR, PUBLIC_DIR, and SRC_DIR directories
    app.use(express.static(DIST_DIR));
    app.use(express.static(PUBLIC_DIR));
    app.use(express.static(SRC_DIR));

    // Helper function to resolve the index.html file from the available directories
    const resolveIndexFile = () => {
        const candidates = [
            path.join(DIST_DIR, "index.html"),
            path.join(SRC_DIR, "index.html"),
            path.join(PUBLIC_DIR, "index.html")
        ];

        return candidates.find(candidate => fs.existsSync(candidate)) ?? null;
    };

    // Route to serve the index.html file for the root path and /index.html
    app.get(["/", "/index.html"], (_req, res) => {
        const indexFile = resolveIndexFile();
        if (indexFile) {
            return res.sendFile(indexFile);
        }

        return res.status(404).send("index.html not found");
    });

    // Middleware to handle requests that do not match any static files or routes
    app.use((req, res, next) => {
        if (req.path.startsWith("/socket.io")) {
            return next();
        }

        const indexFile = resolveIndexFile();
        if (indexFile) {
            return res.sendFile(indexFile);
        }

        return next();
    });

    return app;
}
