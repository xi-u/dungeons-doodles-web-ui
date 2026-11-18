<script setup>
import {onMounted, ref, watch} from "vue";

// This is the drawing canvas component. It allows the user to draw on a canvas using a brush or eraser tool.

// Props are used to pass the current tool and brush size from the parent component (DrawingView) to this component (DrawingCanvas)
const props = defineProps({
  tool: {
    type: String,
    default: "draw",
  },
  brushSize: {
    type: Number,
    default: 6,
  },
});

// Define the events that this component can emit to the parent component (DrawingView)
const emit = defineEmits(["submit", "change", "history-change"]);

// Define refs for the canvas element, its 2D rendering context, and a flag to track whether the user is currently drawing
const canvasRef = ref(null);
const contextRef = ref(null);
const drawing = ref(false);
const history = [];
let historyIndex = -1;
const maxHistoryLength = 50;

// Emit the current history state (canUndo and canRedo) to the parent component (DrawingView)
function emitHistoryState() {
  emit("history-change", {
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  });
}

// Save the current canvas state to the history array and update the history index
function saveHistorySnapshot() {
  const canvas = canvasRef.value;
  const context = contextRef.value;
  if (!canvas || !context) {
    return;
  }

  history.splice(historyIndex + 1);
  history.push(context.getImageData(0, 0, canvas.width, canvas.height));
  if (history.length > maxHistoryLength) {
    history.shift();
  }
  historyIndex = history.length - 1;
  emitHistoryState();
}

// Restore the canvas state from the history array based on the current history index
function restoreHistorySnapshot() {
  const context = contextRef.value;
  if (!context || historyIndex < 0) {
    return;
  }

  context.putImageData(history[historyIndex], 0, 0);
  emitHistoryState();
  if (canvasRef.value) emit("change", canvasRef.value.toDataURL("image/png"));
}

// Undo the last drawing action by restoring the previous canvas state from the history array
function undo() {
  if (historyIndex <= 0) {
    return;
  }

  historyIndex -= 1;
  restoreHistorySnapshot();
}

// Redo the last undone drawing action by restoring the next canvas state from the history array
function redo() {
  if (historyIndex >= history.length - 1) {
    return;
  }

  historyIndex += 1;
  restoreHistorySnapshot();
}

// Set the canvas style based on the current tool and brush size
function setCanvasStyle() {
  const context = contextRef.value;
  if (!context) {
    return;
  }

  const isErasing = props.tool === "erase";
  context.globalCompositeOperation = isErasing ? "destination-out" : "source-over";
  context.strokeStyle = isErasing ? "rgba(0, 0, 0, 1)" : "#000000";
  context.lineWidth = Number(props.brushSize);
}

// Reset the canvas by clearing its contents
function resetCanvas() {
  const canvas = canvasRef.value;
  const context = contextRef.value;

  if (!canvas || !context) {
    return;
  }

  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.restore();
  context.globalCompositeOperation = "source-over";
  context.strokeStyle = "#000000";
  saveHistorySnapshot();
  emit("change", canvas.toDataURL("image/png"));
}

// Get the canvas coordinates from a pointer event
function getCanvasPoint(event) {
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();

  return {
    x: ((event.clientX - rect.left) * canvas.width) / rect.width,
    y: ((event.clientY - rect.top) * canvas.height) / rect.height,
  };
}

// Handle the pointer down event
function handlePointerDown(event) {
  const canvas = canvasRef.value;
  const context = contextRef.value;

  if (!canvas || !context) {
    return;
  }

  drawing.value = true;
  if (typeof canvas.setPointerCapture === "function") {
    canvas.setPointerCapture(event.pointerId);
  }

  const point = getCanvasPoint(event);
  setCanvasStyle();
  context.beginPath();
  context.moveTo(point.x, point.y);
  context.lineTo(point.x + 0.01, point.y + 0.01);
  context.stroke();
}

// Handle the pointer move event
function handlePointerMove(event) {
  if (!drawing.value) {
    return;
  }

  const context = contextRef.value;
  if (!context) {
    return;
  }

  const point = getCanvasPoint(event);
  context.lineTo(point.x, point.y);
  context.stroke();
}

// Handle the pointer up event
function handlePointerUp() {
  const didDraw = drawing.value;
  drawing.value = false;
  if (didDraw && canvasRef.value) {
    saveHistorySnapshot();
    emit("change", canvasRef.value.toDataURL("image/png"));
  }
}

// Submit the drawing by emitting the submit event with the canvas data URL
function submitDrawing() {
  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }

  emit("submit", canvas.toDataURL("image/png"));
}

// Finally, when the component is mounted, set up the canvas and its context, and reset the canvas
onMounted(() => {
  const canvas = canvasRef.value;
  const context = canvas.getContext("2d", {alpha: true});

  contextRef.value = context;
  context.lineCap = "round";
  context.lineJoin = "round";
  resetCanvas();
  setCanvasStyle();
});

// Watch for changes in the tool and brush size props, and update the canvas style accordingly
watch(() => props.tool, () => setCanvasStyle());
watch(() => props.brushSize, () => setCanvasStyle());

// Expose the resetCanvas and submitDrawing methods to the parent component (DrawingView) so that it can call them directly
defineExpose({
  resetCanvas,
  submitDrawing,
  undo,
  redo,
});
</script>

<template>
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
</template>

<style scoped>
.canvas-border {
  display: inline-block;
  padding: 7px;
  border-radius: 9px;
  background: url("../assets/img/border.png") center/cover no-repeat;
}

#canvas {
  display: block;
  background: url("../assets/img/old-paper.jpg") center/cover no-repeat;
  touch-action: none;
}
</style>
