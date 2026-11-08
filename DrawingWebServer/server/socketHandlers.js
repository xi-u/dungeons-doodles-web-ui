import { DRAWING_SIZE, PUBLIC_BASE_URL } from "./config.js";
import { timingSafeEqual, hash } from "./sessionStore.js";

/**
 * This module registers socket handlers for managing game and phone connections in the DrawingWebServer application.
 * It handles events for registering Unity games, joining phones, submitting drawings, and managing session lifecycles.
 * @param io - The Socket.IO server instance used for managing socket connections.
 * @param sessionStore - The SessionStore instance used for managing game and phone sessions.
 */
export function registerSocketHandlers(io, sessionStore) {
    /**
     * Handle a new Socket.IO connection. This function sets up event listeners for game registration, phone joining,
     * drawing submission, and socket disconnection. It also manages session validation and communication between the
     * Unity game and the phone client.
     */
    io.on("connection", socket => {
        console.log("Socket.IO client connected:", socket.id);

        /**
         * Handle the "game:register" event from a Unity game client. This event registers the game with a provided game token,
         * creates a new session, and returns the session ID, web token, and a URL for the phone client to connect.
         */
        socket.on("game:register", (data, ack = () => {}) => {
            if (!data || typeof data.gameToken !== "string" || data.gameToken.length < 32) {
                return ack({ ok: false, error: "Invalid game token" });
            }

            console.log("Registering Unity game with token:", data.gameToken);

            const { sessionId, webToken, session } = sessionStore.createSession(socket.id, data.gameToken);
            socket.data.gameSessionId = sessionId;

            ack({
                ok: true,
                sessionId,
                webToken,
                url: `${PUBLIC_BASE_URL}/?s=${encodeURIComponent(sessionId)}&t=${encodeURIComponent(webToken)}`
            });

            console.log("Unity game registered with session ID:", sessionId);
        });

        /**
         * Handle the "phone:join" event from a phone client. This event allows a phone to join an existing session by providing
         * the session ID and web token. The server validates the session and associates the phone socket with the session.
         */
        socket.on("phone:join", (data, ack = () => {}) => {
            const session = sessionStore.getSession(data && data.sessionId);

            if (!session || !timingSafeEqual(session.webHash, hash(data?.webToken ?? ""))) {
                return ack({ ok: false, error: "This QR code has expired. Scan a new code." });
            }

            sessionStore.clearSessionPhone(session);
            session.phoneSocketId = socket.id;
            socket.data.phoneSessionId = data.sessionId;

            ack({ ok: true });
        });

        /**
         * Handle the "drawing:submit" event from a phone client. This event allows the phone to submit a drawing
         * (in PNG format) to the Unity game.
         */
        socket.on("drawing:submit", (data, ack = () => {}) => {
            const id = socket.data.phoneSessionId;
            const session = sessionStore.getSession(id);

            if (!session || session.phoneSocketId !== socket.id) {
                return ack({ ok: false, error: "Not connected" });
            }

            if (!data || typeof data.png !== "string" || !data.png.startsWith("data:image/png;base64,")) {
                return ack({ ok: false, error: "Expected a PNG image" });
            }

            const game = io.sockets.sockets.get(session.gameSocketId);
            if (!game) {
                sessionStore.deleteSession(id);
                return ack({ ok: false, error: "Unity game is offline" });
            }

            const pngBase64 = data.png.slice("data:image/png;base64,".length);
            game.emit("drawing:received", { pngBase64, width: DRAWING_SIZE.width, height: DRAWING_SIZE.height });

            ack({ ok: true });
        });

        /**
         * Handle the "disconnect" event for a socket. This event is triggered when a socket disconnects, and it cleans
         * up any associated session data.
         */
        socket.on("disconnect", () => {
            const gameSessionId = socket.data.gameSessionId;
            if (gameSessionId) {
                const session = sessionStore.getSession(gameSessionId);
                if (session && session.gameSocketId === socket.id) {
                    sessionStore.deleteSession(gameSessionId);
                }
            }

            const phoneSessionId = socket.data.phoneSessionId;
            const phoneSession = phoneSessionId && sessionStore.getSession(phoneSessionId);
            if (phoneSession && phoneSession.phoneSocketId === socket.id) {
                phoneSession.phoneSocketId = null;
            }
        });
    });

    /**
     * Set up a periodic task to prune expired sessions from the session store. This task runs every 60 seconds and
     * removes any sessions that have passed their expiration timestamp.
     */
    setInterval(() => {
        sessionStore.pruneExpired();
    }, 60_000).unref();
}
