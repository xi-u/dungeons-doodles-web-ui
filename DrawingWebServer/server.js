// Libraries
const express = require("express");
const http = require("node:http");
const crypto = require("node:crypto");
const {Server} = require("socket.io");

// Initialize the Express app, HTTP server, and Socket.IO server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {maxHttpBufferSize: 1e6});

// Serve static files from the "public" directory
app.use(express.static("public"));

// Define the port and public base URL
const PORT = 3000
const PUBLIC_BASE_URL = `http://localhost:${PORT}`; // TODO: change this to online URL when deploying

// A session store to keep track of active sessions.
// sessionId -> {
//  gameSocketId, -> Socket.IO socket ID of the Unity game
//  gameHash, -> SHA-256 hash of the game token
//  webHash, -> SHA-256 hash of the web token
//  expiresAt, -> Timestamp when the session expires
//  phoneSocketId -> Socket.IO socket ID of the connected phone
// }
const sessions = new Map();
const hash = value => crypto.createHash("sha256").update(value).digest("hex"); // SHA-256 hash function
const token = () => crypto.randomBytes(32).toString("base64url");// Generate a random token
const sessionId = () => crypto.randomBytes(9).toString("base64url");// Generate a random session ID
// Timing-safe comparison function to prevent timing attacks. used to compare the web token hashes.
const timingSafeEqual = (a, b) => {
    const x = Buffer.from(a || "");
    const y = Buffer.from(b || "");
    return x.length === y.length && crypto.timingSafeEqual(x, y);
};


//
// Socket.IO event handlers for managing sessions and drawing submissions
//

/**
 * Handle a new Socket.IO connection.
 */
io.on("connection", socket => {
    console.log("Socket.IO client connected:", socket.id);
});

/**
 * Handle a new Socket.IO connection.
 * This function sets up event listeners for the "game:register", "phone:join", and "drawing:submit" events.
 * It also handles disconnections and cleans up expired sessions.
 */
io.on("connection", socket => {
    // Listens for the "game:register" event from the Unity game client
    socket.on("game:register", (data, ack = () => {
    }) => {
        if (!data || typeof data.gameToken !== "string" || data.gameToken.length < 32) {
            return ack({ok: false, error: "Invalid game token"});
        }

        // Generate a new session ID and web token, and store the session data
        const id = sessionId();
        const webToken = token();
        sessions.set(id, {
            gameSocketId: socket.id,
            gameHash: hash(data.gameToken),
            webHash: hash(webToken),
            expiresAt: Date.now() + 30 * 60 * 1000,
            phoneSocketId: null
        });

        socket.data.gameSessionId = id;

        // SEnd the session ID, web token, and URL to the Unity game client
        ack({
            ok: true,
            sessionId: id,
            webToken,
            url: `${PUBLIC_BASE_URL}/?s=${encodeURIComponent(id)}&t=${encodeURIComponent(webToken)}`
        });
    });

    // Listens for the "phone:join" event from the phone client
    socket.on("phone:join", (data, ack = () => {
    }) => {
        // Find the session data for the given session ID and
        const s = data && sessions.get(data.sessionId);

        // Validate the session and web token
        if (!s || s.expiresAt < Date.now() || !timingSafeEqual(s.webHash, hash(data.webToken))) {
            return ack({ok: false, error: "This QR code has expired. Scan a new code."});
        }

        // If there is already a phone connected to this session, disconnect it
        if (s.phoneSocketId && s.phoneSocketId !== socket.id) {
            io.sockets.sockets.get(s.phoneSocketId)?.disconnect(true);
        }

        // Update the session data with the new phone socket ID and store the session ID in the socket data
        s.phoneSocketId = socket.id;
        socket.data.phoneSessionId = data.sessionId;

        // Acknowledge the successful connection to the phone client
        ack({ok: true});
    });

    // Listens for the "drawing:submit" event from the phone client
    socket.on("drawing:submit", (data, ack = () => {
    }) => {
        // Validate the session and phone socket ID
        const id = socket.data.phoneSessionId;
        const s = id && sessions.get(id);

        // If the session is invalid or the phone socket ID does not match, return an error
        if (!s || s.phoneSocketId !== socket.id) {
            return ack({ok: false, error: "Not connected"});
        }

        // Validate the PNG image data
        if (!data || typeof data.png !== "string" || !data.png.startsWith("data:image/png;base64,")) {
            return ack({ok: false, error: "Expected a PNG image"});
        }

        // Find the Unity game socket
        const game = io.sockets.sockets.get(s.gameSocketId);
        if (!game) {
            sessions.delete(id);
            return ack({ok: false, error: "Unity game is offline"});
        }

        // Emit the "drawing:received" event to the Unity game with the PNG data and dimensions
        game.emit("drawing:received", {pngBase64: b64, width: 200, height: 200});

        // Acknowledge the successful submission to the phone client
        ack({ok: true});
    });

    socket.on("disconnect", () => {
        // Clean up the session data when a socket disconnects
        const id = socket.data.gameSessionId;
        if (id) {
            sessions.delete(id);
        }

        // Clean up the phone socket ID if the disconnected socket was a phone
        const phoneId = socket.data.phoneSessionId;
        if (phoneId && sessions.get(phoneId)?.phoneSocketId === socket.id) {
            sessions.get(phoneId).phoneSocketId = null;
        }
    });
});

// Periodically clean up expired sessions every 60 seconds
setInterval(() => {
    for (const [id, s] of sessions) if (s.expiresAt < Date.now()) sessions.delete(id);
}, 60_000).unref();
server.listen(PORT, "0.0.0.0", () => console.log(`Drawing bridge listening on ${PORT}`));