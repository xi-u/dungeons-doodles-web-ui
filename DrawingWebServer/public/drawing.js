// Get the session ID and web token from the URL parameters
const params = new URLSearchParams(location.search);
const sessionId = params.get("s");
const webToken = params.get("t");

// Get the UI elements and set up the canvas for drawing
const canvas = document.querySelector("#canvas");
const drawingContext = canvas.getContext("2d", {alpha: false});
const statusEl = document.querySelector("#status");

// Set up the canvas for drawing
drawingContext.fillStyle = "#ffffff";
drawingContext.fillRect(0, 0, 200, 200);
drawingContext.strokeStyle = "#000000";
drawingContext.lineWidth = 6;
drawingContext.lineCap = "round";
drawingContext.lineJoin = "round";
let drawing = false;


//
// Handle pointer events for drawing
//
function point(e) {
    const r = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - r.left) * 200 / r.width, y: (e.clientY - r.top) * 200 / r.height
    };
}

canvas.addEventListener("pointerdown", e => {
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
    const p = point(e);
    drawingContext.beginPath();
    drawingContext.moveTo(p.x, p.y);
    drawingContext.lineTo(p.x + .01, p.y + .01);
    drawingContext.stroke();
});

canvas.addEventListener("pointermove", e => {
    if (!drawing) return;
    const p = point(e);
    drawingContext.lineTo(p.x, p.y);
    drawingContext.stroke();
});

canvas.addEventListener("pointerup", () => drawing = false);
canvas.addEventListener("pointercancel", () => drawing = false);
document.querySelector("#clear").onclick = () => {
    drawingContext.fillStyle = "#fff";
    drawingContext.fillRect(0, 0, 200, 200);
    drawingContext.strokeStyle = "#000000";
};


//
// Socket.IO client code to connect to the server and handle drawing submission
//
const socket = io({transports: ["websocket", "polling"]});

socket.on("connect", () => {
    if (!sessionId || !webToken) {
        statusEl.textContent = "QR code is invalid. Scan again.";
        return;
    }

    socket.emit("phone:join", {sessionId, webToken}, result => {
        statusEl.textContent = result.ok ? "Connected to your game" : result.error;
    });
});

socket.on("disconnect", () => statusEl.textContent = "Connection lost. Reconnecting…");

document.querySelector("#send").onclick = () => {
    const png = canvas.toDataURL("image/png");
    statusEl.textContent = "Sending…";

    socket.emit("drawing:submit", {png}, result => {
        statusEl.textContent = result.ok ? "Sent to the game" : result.error;
    });
};