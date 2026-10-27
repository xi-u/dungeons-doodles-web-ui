const socket = io();

const canvas = document.getElementById("drawingCanvas");
const context = canvas.getContext("2d");
const status = document.getElementById("status");
const sendButton = document.getElementById("sendButton");

context.lineWidth = 4;
context.lineCap = "round";

let drawing = false;

socket.on("connect", () => {
    status.textContent = "Connected to server";
});

socket.on("disconnect", () => {
    status.textContent = "Disconnected from server";
});

canvas.addEventListener("pointerdown", (event) => {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);

    context.beginPath();
    context.moveTo(event.offsetX, event.offsetY);
});

canvas.addEventListener("pointermove", (event) => {
    if (!drawing) return;

    context.lineTo(event.offsetX, event.offsetY);
    context.stroke();
});

canvas.addEventListener("pointerup", () => {
    drawing = false;
});

canvas.addEventListener("pointercancel", () => {
    drawing = false;
});

sendButton.addEventListener("click", () => {
    const pngData = canvas.toDataURL("image/png");

    socket.emit("submit-drawing", {
        image: pngData
    });
}