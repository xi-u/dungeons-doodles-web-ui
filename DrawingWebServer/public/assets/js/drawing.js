// Get the session ID and web token from the URL parameters
const params = new URLSearchParams(location.search);
const sessionId = params.get("s");
const webToken = params.get("t");

// Get the UI elements and set up the canvas for drawing
const canvas = document.querySelector("#canvas");
const drawingContext = canvas.getContext("2d", {alpha: true});
const statusEl = document.querySelector("#status");
const brushSizeInput = document.querySelector("#brush-size");
const brushSizeValue = document.querySelector("#brush-size-value");
const drawToolButton = document.querySelector("#draw-tool");
const eraseToolButton = document.querySelector("#erase-tool");

function setTool(tool) {
    const currentTool = tool === "erase" ? "erase" : "draw";
    drawingContext.globalCompositeOperation = currentTool === "erase" ? "destination-out" : "source-over";
    drawingContext.strokeStyle = currentTool === "erase" ? "rgba(0,0,0,1)" : "#000000";
    drawToolButton.classList.toggle("active", currentTool === "draw");
    eraseToolButton.classList.toggle("active", currentTool === "erase");
}

function resetCanvas() {
    drawingContext.save();
    drawingContext.setTransform(1, 0, 0, 1, 0, 0);
    drawingContext.clearRect(0, 0, canvas.width, canvas.height);
    drawingContext.restore();
    drawingContext.globalCompositeOperation = "source-over";
    drawingContext.strokeStyle = "#000000";
}

// Set up the canvas for drawing
resetCanvas();
drawingContext.lineWidth = Number(brushSizeInput.value);
drawingContext.lineCap = "round";
drawingContext.lineJoin = "round";
let drawing = false;
let currentTool = "draw";

function updateBrushSize() {
    drawingContext.lineWidth = Number(brushSizeInput.value);
    brushSizeValue.textContent = brushSizeInput.value;
}

brushSizeInput.addEventListener("input", updateBrushSize);
drawToolButton.addEventListener("click", () => {
    currentTool = "draw";
    setTool(currentTool);
});

eraseToolButton.addEventListener("click", () => {
    currentTool = "erase";
    setTool(currentTool);
});
setTool(currentTool);


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
    setTool(currentTool);
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
    resetCanvas();
    setTool(currentTool);
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