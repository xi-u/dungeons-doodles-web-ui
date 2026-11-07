<script setup>
import { onMounted, ref } from "vue";
import { io } from "socket.io-client";

const params = new URLSearchParams(window.location.search);
const sessionId = ref(params.get("s"));
const webToken = ref(params.get("t"));

const canvasRef = ref(null);
const contextRef = ref(null);
const brushSize = ref(6);
const tool = ref("draw");
const connected = ref(false);
const drawing = ref(false);
const showClearDialog = ref(false);
const statusText = ref("Connecting…");
const socket = ref(null);

function setStatus(message) {
  statusText.value = message;
}

function setTool(nextTool) {
  const currentTool = nextTool === "erase" ? "erase" : "draw";
  tool.value = currentTool;

  if (!contextRef.value) {
    return;
  }

  contextRef.value.globalCompositeOperation = currentTool === "erase" ? "destination-out" : "source-over";
  contextRef.value.strokeStyle = currentTool === "erase" ? "rgba(0, 0, 0, 1)" : "#000000";
}

function resetCanvas() {
  const context = contextRef.value;
  const canvas = canvasRef.value;

  if (!context || !canvas) {
    return;
  }

  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.restore();

  context.globalCompositeOperation = "source-over";
  context.strokeStyle = "#000000";
}

function updateBrushSize() {
  if (!contextRef.value) {
    return;
  }

  contextRef.value.lineWidth = Number(brushSize.value);
}

function getCanvasPoint(event) {
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();

  return {
    x: ((event.clientX - rect.left) * canvas.width) / rect.width,
    y: ((event.clientY - rect.top) * canvas.height) / rect.height,
  };
}

function setupCanvas() {
  const canvas = canvasRef.value;
  const context = canvas.getContext("2d", { alpha: true });

  contextRef.value = context;
  resetCanvas();
  context.lineCap = "round";
  context.lineJoin = "round";
  updateBrushSize();
  setTool(tool.value);
}

function openClearDialog() {
  showClearDialog.value = true;
}

function closeClearDialog() {
  showClearDialog.value = false;
}

function handlePointerDown(event) {
  drawing.value = true;
  const canvas = canvasRef.value;

  if (canvas && typeof canvas.setPointerCapture === "function") {
    canvas.setPointerCapture(event.pointerId);
  }

  const context = contextRef.value;
  const point = getCanvasPoint(event);

  setTool(tool.value);
  context.beginPath();
  context.moveTo(point.x, point.y);
  context.lineTo(point.x + 0.01, point.y + 0.01);
  context.stroke();
}

function handlePointerMove(event) {
  if (!drawing.value) {
    return;
  }

  const context = contextRef.value;
  const point = getCanvasPoint(event);
  context.lineTo(point.x, point.y);
  context.stroke();
}

function handlePointerUp() {
  drawing.value = false;
}

function handleSend() {
  const canvas = canvasRef.value;
  if (!canvas || !socket.value) {
    return;
  }

  const png = canvas.toDataURL("image/png");
  setStatus("Sending…");

  socket.value.emit("drawing:submit", { png }, (result) => {
    setStatus(result.ok ? "Sent" : result.error);
  });
}

function initializeSocket() {
  socket.value = io({ transports: ["websocket", "polling"] });

  socket.value.on("connect", () => {
    connected.value = true;

    if (!sessionId.value || !webToken.value) {
      setStatus("QR code is invalid. Scan again.");
      connected.value = false;
      return;
    }

    socket.value.emit("phone:join", { sessionId: sessionId.value, webToken: webToken.value }, (result) => {
      setStatus(result.ok ? "Connected" : result.error);
      connected.value = Boolean(result.ok);
    });
  });

  socket.value.on("disconnect", () => {
    connected.value = false;
    setStatus("Connection lost");
  });
}

onMounted(() => {
  setupCanvas();
  initializeSocket();
});

function confirmClear() {
  resetCanvas();
  setTool(tool.value);
  closeClearDialog();
}

function onBrushSizeInput(event) {
  if (event && event.target) {
    brushSize.value = Number(event.target.value);
  }
  updateBrushSize();
}
</script>

<template>
  <main>
    <p class="header">Let your creativity flow! Draw and send it to the game!</p>

    <div class="brush-controls">
      <button class="tool" :class="{ active: tool === 'draw' }" type="button" @click="setTool('draw')">
        <img src="./assets/svg/brush.svg" alt="Brush" class="icon" />
      </button>
      <button class="tool" :class="{ active: tool === 'erase' }" type="button" @click="setTool('erase')">
        <img src="./assets/svg/eraser.svg" alt="Eraser" class="icon" />
      </button>
      <div>
        <p>Brush Size</p>
        <input id="brush-size" v-model.number="brushSize" type="range" min="2" max="30" step="1" value="6" @input="onBrushSizeInput" />
      </div>
      <button class="tool" id="clear" type="button" title="Clear Canvas" @click="openClearDialog">
        <img src="./assets/svg/bin.svg" alt="Clear" class="icon" />
      </button>
    </div>

    <div class="canvas-border">
      <canvas
        id="canvas"
        ref="canvasRef"
        width="200"
        height="200"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerUp"
      ></canvas>
    </div>

    <div class="buttons">
      <button class="button" id="send" type="button" @click="handleSend">SEND TO GAME</button>
    </div>

    <p id="status" class="status-indicator">
      <span id="status-text">{{ statusText }}</span>
      <img
        id="status-icon"
        class="status-icon"
        :src="connected ? '/assets/svg/connected.svg' : '/assets/svg/disconnected.svg'"
        :alt="connected ? 'Connected' : 'Disconnected'"
      />
    </p>
  </main>

  <div v-if="showClearDialog" id="clear-dialog" class="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="clear-dialog-title" @click="(event) => { if (event.target === event.currentTarget) closeClearDialog(); }">
    <div class="confirmation-dialog">
      <h2 id="clear-dialog-title">Clear canvas?</h2>
      <p>Are you sure you want to clear the entire canvas?</p>
      <div class="dialog-actions">
        <button type="button" class="dialog-button cancel" id="clear-cancel" @click="closeClearDialog">Cancel</button>
        <button type="button" class="dialog-button confirm" id="clear-confirm" @click="confirmClear">Clear</button>
      </div>
    </div>
  </div>
</template>
