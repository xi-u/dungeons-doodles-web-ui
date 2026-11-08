import crypto from "node:crypto";

import { SESSION_TTL_MS } from "./config.js";

/**
 * This module provides utility functions and a SessionStore class for managing game and phone sessions in the
 * DrawingWebServer application.
 *
 * @param value
 * @returns {string}
 */

// Generates tokens and session IDs, hashes values, and provides timing-safe comparison for sensitive data.
export const hash = value => crypto.createHash("sha256").update(value).digest("hex");
export const token = () => crypto.randomBytes(32).toString("base64url");
export const sessionId = () => crypto.randomBytes(9).toString("base64url");

// Timing-safe comparison function to prevent timing attacks when comparing sensitive values like tokens
export const timingSafeEqual = (a, b) => {
    const x = Buffer.from(a || "");
    const y = Buffer.from(b || "");
    return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/**
 * SessionStore class manages game and phone sessions, including creation, retrieval, expiration, and deletion of sessions.
 * Each session is associated with a game socket ID, a hashed game token, a hashed web token, an expiration timestamp,
 * and an optional phone socket ID.
 *
 * The SessionStore class provides methods to create sessions, retrieve sessions by ID, clear phone connections,
 * delete sessions, and prune expired sessions.
 *
 * @class
 * @param {Server} io - The Socket.IO server instance used for managing socket connections.
 */
export class SessionStore {
    constructor(io) {
        this.io = io;
        this.sessions = new Map();
    }

    // Get a session by its ID
    getSession(id) {
        if (!id) {
            return null;
        }

        const session = this.sessions.get(id);
        if (!session) {
            return null;
        }

        if (session.expiresAt < Date.now()) {
            this.sessions.delete(id);
            return null;
        }

        return session;
    }

    // Create a new session with a game socket ID and game token, returning the session ID, web token, and session object
    createSession(gameSocketId, gameToken) {
        const id = sessionId();
        const webToken = token();
        const session = {
            gameSocketId,
            gameHash: hash(gameToken),
            webHash: hash(webToken),
            expiresAt: Date.now() + SESSION_TTL_MS,
            phoneSocketId: null
        };

        this.sessions.set(id, session);

        return {
            sessionId: id,
            webToken,
            session
        };
    }

    // Clear the phone connection for a given session, disconnecting the phone socket if it exists
    clearSessionPhone(session) {
        if (!session || !session.phoneSocketId) {
            return;
        }

        const phoneSocket = this.io?.sockets?.sockets?.get(session.phoneSocketId);
        if (phoneSocket) {
            phoneSocket.disconnect(true);
        }
    }

    // Delete a session by its ID, removing it from the session store
    deleteSession(id) {
        this.sessions.delete(id);
    }

    // Prune expired sessions from the session store, removing any sessions that have passed their expiration timestamp
    pruneExpired() {
        const now = Date.now();
        for (const [id, session] of this.sessions) {
            if (session.expiresAt < now) {
                this.sessions.delete(id);
            }
        }
    }
}
