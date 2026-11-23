import { computed, onUnmounted, ref } from "vue";
import { io } from "socket.io-client";

const PNG_PREFIX = "data:image/png;base64,";

/**
 * The connection to the game and everything this phone knows about it. The host decides what happens,
 * so the screen changes when a message from the host comes in: drawing:open, vote:open, vote:winner.
 */
export function useGameSession() {
    // The QR code put the session ID and the token in the URL
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("s");
    const webToken = params.get("t");
    // Who this tab is in this game, so a refresh or a locked screen doesn't make you a new player.
    // sessionStorage, not localStorage: every tab stays its own player, which keeps testing with tabs working
    const savedPlayerKey = `player:${sessionId}`;

    // Which screen to show: connecting, join, waiting, drawing, voting, result, sketchpad or error
    const screen = ref("connecting");
    const connected = ref(false);
    const statusText = ref("Connecting…");

    const secondsLeft = ref(0);
    const options = ref([]);
    const images = ref([]);
    const picked = ref(-1);
    const winner = ref(-1);
    // An error the server sent back (game full, name too long…). Shown as a pop-up until the player closes it
    const alertText = ref("");
    const customizationCatalog = ref(null);
    const customizationSending = ref(false);
    const playerName = ref("");
    // The base64 of the drawing this phone sent. The host sends the exact same text back in vote:open
    const ownDrawing = ref(null);
    const ownSlot = computed(() => (ownDrawing.value ? images.value.indexOf(ownDrawing.value) : -1));

    let countdown = null;

    const socket = io({ transports: ["websocket", "polling"] });

    function show(nextScreen, status) {
        screen.value = nextScreen;
        statusText.value = status;
    }

    // Storage can be blocked (private mode); then a refresh simply makes you a new player
    function loadSavedPlayer() {
        try {
            return JSON.parse(sessionStorage.getItem(savedPlayerKey));
        } catch {
            return null;
        }
    }

    function savePlayer(player) {
        try {
            if (player) sessionStorage.setItem(savedPlayerKey, JSON.stringify(player));
            else sessionStorage.removeItem(savedPlayerKey);
        } catch {
            // Without storage there's nothing to remember
        }
    }

    socket.on("connect", () => {
        connected.value = true;

        if (!sessionId || !webToken) {
            return show("error", "QR code is invalid. Scan again.");
        }

        socket.emit("phone:join", { sessionId, webToken }, result => {
            if (!result.ok) {
                return show("error", result.error);
            }

            if (!result.acceptsPlayers) {
                return show("sketchpad", "Connected");
            }

            rejoinOrShowJoin();
        });
    });

    // Back after a refresh or a lost connection: become the same player again. The server then sends the current round
    function rejoinOrShowJoin() {
        const saved = loadSavedPlayer();
        if (!saved) {
            return show("join", "Connected");
        }
        playerName.value = saved.name || "";

        socket.emit("player:rejoin", saved, result => {
            if (!result.ok) {
                // The game forgot this player (the server restarted, or it's a new game): start fresh
                savePlayer(null);
                return show("join", "Connected");
            }

            if (screen.value !== "customization") show("waiting", "Welcome back!");
        });
    }

    socket.on("disconnect", reason => {
        connected.value = false;
        customizationSending.value = false;

        // The server closed this connection because the same player opened the game in another tab. Don't reconnect
        if (reason === "io server disconnect") {
            return show("error", "You're playing in another tab now.");
        }

        // Socket.IO reconnects by itself, and the connect handler then rejoins
        statusText.value = "Connection lost, reconnecting…";
    });

    socket.on("customization:open", catalog => {
        customizationCatalog.value = catalog;
        customizationSending.value = false;
        show("customization", "Create your character");
    });

    socket.on("customization:result", ({ accepted, error }) => {
        customizationSending.value = false;
        if (!customizationCatalog.value) return;
        if (!accepted) {
            alertText.value = error || "Your character could not be saved. Please try again.";
            return;
        }
        show("waiting", "Character saved! Waiting for the others");
    });

    socket.on("customization:close", () => {
        customizationCatalog.value = null;
        customizationSending.value = false;
        if (screen.value === "customization") show("waiting", "Character customization has ended");
    });

    socket.on("drawing:open", ({ seconds }) => {
        ownDrawing.value = null;
        startCountdown(seconds);
        show("drawing", "Draw!");
    });

    socket.on("drawing:result", ({ accepted }) => {
        if (!accepted) {
            statusText.value = "Your drawing didn't count";
            return;
        }

        // After a refresh the server repeats this, so a player who already drew doesn't get an empty canvas again
        if (screen.value === "drawing") {
            return show("waiting", "Your drawing is in!");
        }

        statusText.value = "Your drawing is in!";
    });

    socket.on("vote:open", data => {
        options.value = data.options;
        images.value = data.images ?? [];
        picked.value = -1;
        startCountdown(Number(data.seconds) || 0);
        show("voting", "Pick your favourite");
    });

    socket.on("vote:result", ({ accepted, slot }) => {
        if (accepted) {
            // Also after a refresh, when the server repeats this: show which option this player already picked
            picked.value = slot;
            statusText.value = "Vote counted!";
            return;
        }

        // The host said no (too late, or your own drawing): let the player pick again
        if (picked.value === slot) picked.value = -1;
        statusText.value = "That vote didn't count";
    });

    socket.on("vote:winner", ({ slot }) => {
        winner.value = slot;
        show("result", "");
    });

    function join(name) {
        socket.emit("player:join", { name }, result => {
            if (!result.ok) {
                alertText.value = result.error;
                return;
            }

            playerName.value = name;
            savePlayer({ playerId: result.playerId, rejoinToken: result.rejoinToken, name });
            show("waiting", "You're in! Look at the big screen");
        });
    }

    function submitCustomization(character) {
        if (!connected.value || customizationSending.value) return;
        customizationSending.value = true;
        socket.timeout(15000).emit("customization:submit", character, (error, result) => {
            if (error || !result?.ok) {
                customizationSending.value = false;
                alertText.value = result?.error || "Connection timed out. Please try again.";
            }
        });
    }

    function submitDrawing(png) {
        statusText.value = "Sending…";
        socket.emit("drawing:submit", { png }, result => {
            if (!result.ok) {
                statusText.value = "";
                alertText.value = result.error;
                return;
            }

            // A sketchpad stays on its canvas, and so does a player whose round already moved on
            if (screen.value !== "drawing") {
                statusText.value = "Sent";
                return;
            }

            ownDrawing.value = png.slice(PNG_PREFIX.length);
            show("waiting", "Sent! Waiting for the others");
        });
    }

    function vote(slot) {
        if (picked.value === slot) {
            return;
        }

        const previousPicked = picked.value;
        picked.value = slot;
        socket.emit("vote:submit", { slot }, result => {
            if (!result.ok) {
                if (picked.value === slot) {
                    picked.value = previousPicked;
                }
                alertText.value = result.error;
            }
        });
    }

    function startCountdown(seconds) {
        clearInterval(countdown);
        const deadline = Date.now() + seconds * 1000;

        const tick = () => {
            secondsLeft.value = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            if (secondsLeft.value === 0) clearInterval(countdown);
        };

        tick();
        countdown = setInterval(tick, 250);
    }

    onUnmounted(() => {
        clearInterval(countdown);
        socket.disconnect();
    });

    function dismissAlert() {
        alertText.value = "";
    }

    return {
        screen, connected, statusText, secondsLeft, options, images, picked, winner, ownSlot, alertText,
        customizationCatalog, customizationSending, playerName, join, submitCustomization, submitDrawing, vote, dismissAlert,
    };
}