// Fake phones for testing without UI.
// Usage: node scripts/fake-phones.js "<QR url>" [count] [--cheat]
import { io } from "socket.io-client";

// A 5x5 red dot: a real, tiny PNG, so the host can decode it like a drawing
const TEST_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";
const args = process.argv.slice(2);
const qrUrl = args[0];
const count = Number(args[1] ?? 3);
const cheat = args.includes("--cheat");

if (!qrUrl) {
    console.error('Usage: node scripts/fake-phones.js "<QR url>" [count] [--cheat]');
    process.exit(1);
}

// The QR url holds everything a phone needs: where the server is, and the session + token
const url = new URL(qrUrl);
const sessionId = url.searchParams.get("s");
const webToken = url.searchParams.get("t");

for (let i = 1; i <= count; i++) {
    startPhone(`Test ${i}`);
}

function startPhone(name) {
    const socket = io(url.origin, { transports: ["websocket"] });
    const log = (...parts) => console.log(`[${name}]`, ...parts);
    let sentAt = 0;

    const vote = slot => {
        sentAt = performance.now();
        socket.emit("vote:submit", { slot }, ack => {
            if (!ack?.ok) log("vote:submit failed:", ack?.error);
        });
    };

    const draw = png => {
        sentAt = performance.now();
        socket.emit("drawing:submit", { png }, ack => {
            if (!ack?.ok) log("drawing:submit failed:", ack?.error);
        });
    };

    socket.on("connect", () => {
        socket.emit("phone:join", { sessionId, webToken }, joined => {
            if (!joined.ok) return log("phone:join failed:", joined.error);
            log("phone:join ok");
            socket.emit("player:join", { name }, player => log("player:join", player));
        });
    });

    socket.on("connect_error", error => log("connect failed:", error.message));

    socket.on("drawing:open", ({ seconds }) => {
        log(`drawing open (${seconds} s) -> sending a drawing`);
        draw(TEST_PNG);

        // Try to break the rules: send a second drawing, and one that isn't a real PNG
        if (cheat) {
            draw(TEST_PNG);
            draw("data:image/png;base64,AAAA");
        }
    });

    socket.on("drawing:result", ({ accepted }) => {
        log(`drawing ${accepted ? "COUNTED" : "REJECTED"} (${Math.round(performance.now() - sentAt)} ms round trip)`);
    });

    socket.on("vote:open", ({ options, images = [] }) => {
        const slot = Math.floor(Math.random() * options.length);
        const drawings = images.filter(Boolean).length;
        log(`voting open: ${options.join(" | ")}${drawings ? ` (${drawings} drawings)` : ""} -> voting ${slot}`);
        vote(slot);

        // Try to break the rules: vote twice, and vote for a slot that doesn't exist
        if (cheat) {
            vote(slot);
            vote(99);
        }
    });

    socket.on("vote:result", ({ accepted, slot }) => {
        log(`vote ${slot} ${accepted ? "COUNTED" : "REJECTED"} (${Math.round(performance.now() - sentAt)} ms round trip)`);
    });

    socket.on("vote:winner", ({ slot }) => {
        log("winner:", slot);
        // Voting is closed now, so this one must be rejected
        if (cheat) vote(0);
    });

    socket.on("disconnect", reason => log("disconnected:", reason));
}