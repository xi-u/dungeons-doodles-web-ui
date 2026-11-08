import http from "node:http";
import { Server } from "socket.io";

/**
 * This is the main entry point for the DrawingWebServer application. It sets up an Express server, integrates Socket.IO
 * for real-time communication, and manages game and phone sessions.
 *
 * Server components are stored in /server, and the frontend is stored in /src
 *
 */

// Import the configuration and server modules
import { createApp } from "./server/app.js";
import { PORT } from "./server/config.js";
import { SessionStore } from "./server/sessionStore.js";
import { registerSocketHandlers } from "./server/socketHandlers.js";

// Create an Express app using the createApp function
const app = createApp();

// Create an HTTP server using the Express app
const server = http.createServer(app);

// Create a Socket.IO server and attach it to the HTTP server
const io = new Server(server, { maxHttpBufferSize: 1e6 });

// Create a session store to manage game and phone sessions
const sessionStore = new SessionStore(io);

// Register the socket handlers for managing game and phone connections
registerSocketHandlers(io, sessionStore);

// Start the HTTP server and listen on the specified port
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Drawing bridge listening on ${PORT}: http://localhost:${PORT}`);
});