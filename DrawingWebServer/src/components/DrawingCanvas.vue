<script setup>
import { onMounted, ref, watch } from "vue";

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
const emit = defineEmits(["submit"]);

// Define refs for the canvas element, its 2D rendering context, and a flag to track whether the user is currently drawing
const canvasRef = ref(null);
const contextRef = ref(null);
const drawing = ref(false);

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
  drawing.value = false;
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
  const context = canvas.getContext("2d", { alpha: true });

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
  padding: 8px;
  border-radius: 10px;
  background: url("../assets/img/border.png") center/cover no-repeat;
}

#canvas {
  display: block;
  width: min(88vw, 360px);
  height: min(88vw, 360px);
  border-radius: 8px;
  background: url("../assets/img/old-paper.jpg") center/cover no-repeat;
  touch-action: none;
}
</style>
