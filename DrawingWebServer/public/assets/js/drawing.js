// Get the session ID and web token from the URL parameters
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("s");
const webToken = params.get("t");

// Get the UI elements and set up the canvas for drawing
const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d", {alpha: true});
const statusTextEl = document.querySelector("#status-text");
const statusIconEl = document.querySelector("#status-icon");
const brushSizeInput = document.querySelector("#brush-size");
const drawToolButton = document.querySelector("#draw-tool");
const eraseToolButton = document.querySelector("#erase-tool");
const clearButton = document.querySelector("#clear");
const clearDialog = document.querySelector("#clear-dialog");
const clearCancelButton = document.querySelector("#clear-cancel");
const clearConfirmButton = document.querySelector("#clear-confirm");
const sendButton = document.querySelector("#send");

// Define the initial state of the drawing application
const state = {
    drawing: false,
    tool: "draw",
};

// Set the status message in the UI
function setStatus(message) {
    statusTextEl.textContent = message;
}

// Update the connection icon in the UI based on the connection status
function setConnectionIcon(isConnected) {
    statusIconEl.src = isConnected ? "/assets/svg/connected.svg" : "/assets/svg/disconnected.svg";
    statusIconEl.alt = isConnected ? "Connected" : "Disconnected";
}

// Set the current drawing tool (draw or erase) and update the canvas context and UI accordingly
function setTool(tool) {
    const currentTool = tool === "erase" ? "erase" : "draw";
    state.tool = currentTool;

    ctx.globalCompositeOperation = currentTool === "erase" ? "destination-out" : "source-over";
    ctx.strokeStyle = currentTool === "erase" ? "rgba(0, 0, 0, 1)" : "#000000";

    drawToolButton.classList.toggle("active", currentTool === "draw");
    eraseToolButton.classList.toggle("active", currentTool === "erase");
}

// Reset the canvas to its initial state
function resetCanvas() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "#000000";
}

// Update the brush size based on the input value and update the UI accordingly
function updateBrushSize() {
    const size = Number(brushSizeInput.value);
    ctx.lineWidth = size;
}

// Get the canvas coordinates of a pointer event, scaled to the canvas size
function getCanvasPoint(event) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: ((event.clientX - rect.left) * 200) / rect.width,
        y: ((event.clientY - rect.top) * 200) / rect.height,
    };
}

// Set up the canvas for drawing, including resetting it, setting the line cap and join styles, updating the brush size,
// and setting the initial tool
function setupCanvas() {
    resetCanvas();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    updateBrushSize();
    setTool(state.tool);
}

/**
 * Event listeners for the drawing application, including brush size changes, tool selection, canvas interactions,
 * and sending the drawing to the server.
 */
brushSizeInput.addEventListener("input", updateBrushSize);
drawToolButton.addEventListener("click", () => setTool("draw"));
eraseToolButton.addEventListener("click", () => setTool("erase"));

// Functions to open and close the clear canvas confirmation dialog
function openClearDialog() {
    clearDialog.classList.remove("hidden");
}
function closeClearDialog() {
    clearDialog.classList.add("hidden");
}

// Event listeners for the clear canvas button and confirmation dialog
clearButton.addEventListener("click", openClearDialog);
clearCancelButton.addEventListener("click", closeClearDialog);
clearConfirmButton.addEventListener("click", () => {
    resetCanvas();
    setTool(state.tool);
    closeClearDialog();
});

// Close the clear canvas dialog if the user clicks outside of it
clearDialog.addEventListener("click", event => {
    if (event.target === clearDialog) {
        closeClearDialog();
    }
});

// Event listeners for pointer events on the canvas to handle drawing and erasing
canvas.addEventListener("pointerdown", event => {
    state.drawing = true;
    canvas.setPointerCapture(event.pointerId);
    setTool(state.tool);

    const point = getCanvasPoint(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x + 0.01, point.y + 0.01);
    ctx.stroke();
});

canvas.addEventListener("pointermove", event => {
    if (!state.drawing) {
        return;
    }

    const point = getCanvasPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
});

canvas.addEventListener("pointerup", () => {
    state.drawing = false;
});

canvas.addEventListener("pointercancel", () => {
    state.drawing = false;
});

// Initialize the canvas when the page loads
setupCanvas();

/**
 * Socket.IO client code to connect to the server and handle events for joining a session and submitting drawings.
 */
const socket = io({transports: ["websocket", "polling"]});

socket.on("connect", () => {
    setConnectionIcon(true);

    if (!sessionId || !webToken) {
        setStatus("QR code is invalid. Scan again.");
        setConnectionIcon(false);
        return;
    }

    socket.emit("phone:join", {sessionId, webToken}, result => {
        setStatus(result.ok ? "Connected" : result.error);
        setConnectionIcon(Boolean(result.ok));
    });
});

socket.on("disconnect", () => {
    setConnectionIcon(false);
    setStatus("Connection lost");
});

sendButton.addEventListener("click", () => {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;

    const exportCtx = exportCanvas.getContext("2d");
    const pageBackground = getComputedStyle(document.body).backgroundColor;
    const fillColor = pageBackground && pageBackground !== "rgba(0, 0, 0, 0)" ? pageBackground : "#ffffff";

    exportCtx.fillStyle = fillColor;
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvas, 0, 0);

    const png = exportCanvas.toDataURL("image/png");
    setStatus("Sending…");

    socket.emit("drawing:submit", {png}, result => {
        setStatus(result.ok ? "Sent" : result.error);
    });
});