import { DRAWING_SIZE, MAX_NAME_LENGTH, MAX_PHONES_PER_SESSION, PUBLIC_BASE_URL } from "./config.js";
import { hash, playerId as newPlayerId, timingSafeEqual, token } from "./sessionStore.js";

// Socket.IO room that holds every phone that joined a session as a player
const playersRoom = sessionId => `players:${sessionId}`;

/**
 * Registers the socket handlers that connect the Unity game, the phones, and the voting.
 */
export function registerSocketHandlers(io, sessionStore) {
    // the session of this game socket, or null if this socket isn't the registered game
    const gameSessionOf = socket => {
        const session = sessionStore.getSession(socket.data.gameSessionId);
        return session && session.gameSocketId === socket.id ? session : null;
    };

    // The session of this phone socket, or null if the phone isn't joined (anymore)
    const phoneSessionOf = socket => {
        const session = sessionStore.getSession(socket.data.phoneSessionId);
        return session && session.phoneSocketIds.has(socket.id) ? session : null;
    };

    // Sends a phone that comes back the round everyone else is in, and then its own part in it (drew, voted).
    // A drawing round gets only the time that's left
    const replayTo = (socket, session, player) => {
        for (const { event, data, endsAt } of [...session.replay, ...player.replay]) {
            if (event === "drawing:open") {
                socket.emit(event, { seconds: Math.max(0, Math.round((endsAt - Date.now()) / 1000)) });
            } else {
                socket.emit(event, data);
            }
        }
    };

    // A new round, or the vote ended: what each player did before no longer matters to a phone that comes back
    const forgetPlayerReplays = session => {
        for (const player of session.players.values()) {
            player.replay = [];
        }
    };

    io.on("connection", socket => {
        console.log("Socket.IO client connected:", socket.id);

        // Unity registers; only the host says it accepts phone players
        socket.on("game:register", (data, ack = () => {}) => {
            if (!data || typeof data.gameToken !== "string" || data.gameToken.length < 32) {
                return ack({ ok: false, error: "Invalid game token" });
            }

            const { sessionId, webToken } = sessionStore.createSession(socket.id, data.gameToken, data.acceptsPlayers === true);
            socket.data.gameSessionId = sessionId;

            ack({
                ok: true,
                sessionId,
                webToken,
                url: `${PUBLIC_BASE_URL}/?s=${encodeURIComponent(sessionId)}&t=${encodeURIComponent(webToken)}`
            });

            console.log("Unity game registered with session ID:", sessionId);
        });

        // A phone logs in to a session with the token from the QR code
        socket.on("phone:join", (data, ack = () => {}) => {
            const session = sessionStore.getSession(data && data.sessionId);

            if (!session || !timingSafeEqual(session.webHash, hash(data?.webToken ?? ""))) {
                return ack({ ok: false, error: "This QR code has expired. Scan a new code." });
            }

            if (session.phoneSocketIds.size >= MAX_PHONES_PER_SESSION) {
                return ack({ ok: false, error: "This game is full." });
            }

            session.phoneSocketIds.add(socket.id);
            socket.data.phoneSessionId = data.sessionId;

            ack({ ok: true, acceptsPlayers: session.acceptsPlayers });
        });

        // A player who lost the connection (refresh, locked screen) comes back as the same player
        socket.on("player:rejoin", (data, ack = () => {}) => {
            const session = phoneSessionOf(socket);
            const player = session?.players.get(data?.playerId);

            // Same check as the web token: compare hashes in constant time. A connection that's already a player can't switch
            if (!player || socket.data.playerId || typeof data.rejoinToken !== "string" ||
                !timingSafeEqual(player.rejoinHash, hash(data.rejoinToken))) {
                return ack({ ok: false, error: "Join as a new player" });
            }

            // The newest connection wins: the same player still open in an old tab gets closed
            const oldSocketId = player.socketId;
            player.socketId = socket.id;
            io.sockets.sockets.get(oldSocketId)?.disconnect(true);

            socket.data.playerId = data.playerId;
            socket.data.rejoinToken = data.rejoinToken;
            socket.join(playersRoom(socket.data.phoneSessionId));
            io.to(session.gameSocketId).emit("player:back", { playerId: data.playerId });

            ack({ ok: true });
            replayTo(socket, session, player);
        });

        // A logged-in phone becomes a player; the server makes the ID and a rejoin token
        socket.on("player:join", (data, ack = () => {}) => {
            const session = phoneSessionOf(socket);
            if (!session) {
                return ack({ ok: false, error: "Not connected" });
            }

            if (!session.acceptsPlayers) {
                return ack({ ok: false, error: "This game doesn't accept phone players" });
            }

            const name = typeof data?.name === "string" ? data.name.trim() : "";
            if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
                return ack({ ok: false, error: `Name must be 1-${MAX_NAME_LENGTH} characters` });
            }

            // Joining twice from the same connection keeps the same player
            if (!socket.data.playerId) {
                // The host says how many players still fit: 0 when the lobby is full or the game has started
                if (session.slotsLeft <= 0) {
                    return ack({ ok: false, error: "This game is full or has already started." });
                }

                // Count down right away, so phones joining at the same moment can't all slip in before the host answers
                session.slotsLeft--;
                socket.data.playerId = newPlayerId();
                // The phone keeps this token to come back as itself; the session stores only its hash, like the web token
                socket.data.rejoinToken = token();
                session.players.set(socket.data.playerId, { socketId: socket.id, rejoinHash: hash(socket.data.rejoinToken), replay: [] });
                socket.join(playersRoom(socket.data.phoneSessionId));
                io.to(session.gameSocketId).emit("player:joined", { playerId: socket.data.playerId, name });
            }

            ack({ ok: true, playerId: socket.data.playerId, rejoinToken: socket.data.rejoinToken });
        });

        // Unchanged, except that every joined phone may now send a drawing
        socket.on("drawing:submit", (data, ack = () => {}) => {
            const session = phoneSessionOf(socket);
            if (!session) {
                return ack({ ok: false, error: "Not connected" });
            }

            if (!data || typeof data.png !== "string" || !data.png.startsWith("data:image/png;base64,")) {
                return ack({ ok: false, error: "Expected a PNG image" });
            }

            const game = io.sockets.sockets.get(session.gameSocketId);
            if (!game) {
                sessionStore.deleteSession(socket.data.phoneSessionId);
                return ack({ ok: false, error: "Unity game is offline" });
            }

            const pngBase64 = data.png.slice("data:image/png;base64,".length);

            if (socket.data.playerId) {
                // A player's drawing is their submission. Like a vote, the player ID comes from this connection
                game.emit("drawing:submitted", { playerId: socket.data.playerId, pngBase64 });
            } else {
                // A phone that isn't a player is still a sketchpad for its Unity instance, like before
                game.emit("drawing:received", { pngBase64, width: DRAWING_SIZE.width, height: DRAWING_SIZE.height });
            }

            ack({ ok: true });
        });

        // A player votes; the server adds who it is
        socket.on("vote:submit", (data, ack = () => {}) => {
            const session = phoneSessionOf(socket);
            if (!session || !socket.data.playerId) {
                return ack({ ok: false, error: "Join as a player first" });
            }

            if (!Number.isInteger(data?.slot)) {
                return ack({ ok: false, error: "Expected a slot number" });
            }

            // The player ID comes from this connection, never from the message, so a phone can't vote as someone else
            io.to(session.gameSocketId).emit("vote:received", { playerId: socket.data.playerId, slot: data.slot });
            ack({ ok: true });
        });

        // The host opens a vote; tell every player of this session
        socket.on("vote:open", data => {
            const session = gameSessionOf(socket);
            if (!session || !Array.isArray(data?.options)) {
                return;
            }

            const message = {
                options: data.options,
                // Fase 2: the drawing in each slot as base64 PNG, or null for a text option
                images: Array.isArray(data.images) ? data.images : []
            };
            // A new round: a phone that comes back gets this vote
            session.replay = [{ event: "vote:open", data: message }];
            forgetPlayerReplays(session);
            io.to(playersRoom(socket.data.gameSessionId)).emit("vote:open", message);
        });

        // The host says whether one player's vote counted; tell only that phone
        socket.on("vote:result", data => {
            const player = gameSessionOf(socket)?.players.get(data?.playerId);
            if (!player) {
                return;
            }

            const message = { accepted: data.accepted === true, slot: data.slot };
            // Remembered, so after a refresh this player sees their vote instead of a fresh choice
            if (message.accepted) {
                player.replay = [{ event: "vote:result", data: message }];
            }

            if (player.socketId) {
                io.to(player.socketId).emit("vote:result", message);
            }
        });

        // The host picked a winner; tell every player of this session
        socket.on("vote:winner", data => {
            const session = gameSessionOf(socket);
            if (!session) {
                return;
            }

            const message = { slot: data?.slot };
            // Added after the vote, so a phone that comes back also gets the options and drawings to show the winner
            session.replay.push({ event: "vote:winner", data: message });
            // The result screen shows the winner; "vote counted" after it would only overwrite the status
            forgetPlayerReplays(session);
            io.to(playersRoom(socket.data.gameSessionId)).emit("vote:winner", message);
        });

        // The host says how many new players still fit
        socket.on("lobby:state", data => {
            const session = gameSessionOf(socket);
            if (!session || !Number.isInteger(data?.slotsLeft)) {
                return;
            }

            session.slotsLeft = data.slotsLeft;
        });

        // The host started a drawing round, tell every player how long they have
        socket.on("drawing:open", data => {
            const session = gameSessionOf(socket);
            if (!session) {
                return;
            }

            const seconds = Number(data?.seconds) || 0;
            // A phone that comes back during this round gets only the time that's left
            session.replay = [{ event: "drawing:open", endsAt: Date.now() + seconds * 1000 }];
            forgetPlayerReplays(session);
            io.to(playersRoom(socket.data.gameSessionId)).emit("drawing:open", { seconds });
        });

        // The host says whether one player's drawing counted; tell only that phone
        socket.on("drawing:result", data => {
            const player = gameSessionOf(socket)?.players.get(data?.playerId);
            if (!player) {
                return;
            }

            const message = { accepted: data.accepted === true };
            // Remembered, so after a refresh this player sees "your drawing is in" instead of an empty canvas
            if (message.accepted) {
                player.replay = [{ event: "drawing:result", data: message }];
            }

            if (player.socketId) {
                io.to(player.socketId).emit("drawing:result", message);
            }
        });

        // Clean up when a game or a phone disconnects
        socket.on("disconnect", () => {
            if (gameSessionOf(socket)) {
                sessionStore.deleteSession(socket.data.gameSessionId);
            }

            const session = phoneSessionOf(socket);
            session?.phoneSocketIds.delete(socket.id);

            // Tell the host, unless a newer connection of this player already took over (another tab, or a rejoin)
            const player = session?.players.get(socket.data.playerId);
            if (player?.socketId === socket.id) {
                player.socketId = null;
                io.to(session.gameSocketId).emit("player:left", { playerId: socket.data.playerId });
            }
        });
    });

    // Remove expired sessions every 60 seconds
    setInterval(() => {
        sessionStore.pruneExpired();
    }, 60_000).unref();
}