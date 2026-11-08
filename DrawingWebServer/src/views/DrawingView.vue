<script setup>
import { ref } from "vue";
import BrushToolbar from "../components/BrushToolbar.vue";
import ClearCanvasDialog from "../components/ClearCanvasDialog.vue";
import DrawingCanvas from "../components/DrawingCanvas.vue";
import StatusIndicator from "../components/StatusIndicator.vue";
import { useDrawingSession } from "../composables/useDrawingSession";

// This is the main view for the drawing page. It contains the brush toolbar, the drawing canvas
// It also handles the logic for clearing the canvas and submitting the drawing to the game.

// Define a ref for the DrawingCanvas component to access its methods
const drawingCanvasRef = ref(null);

// Use the useDrawingSession composable to manage the drawing session state and actions
const {
  connected,
  tool,
  brushSize,
  showClearDialog,
  statusText,
  updateTool,
  openClearDialog,
  closeClearDialog,
  submitDrawing,
} = useDrawingSession();

// Handle tool change event from the BrushToolbar component
function handleToolChange(value) {
  updateTool(value);
}

// Handle brush size change event from the BrushToolbar component
function handleBrushSizeChange(value) {
  brushSize.value = value;
}

// Handle submit event from the DrawingCanvas component
function handleSubmit(png) {
  submitDrawing(png);
}

// Handle confirm event from the ClearCanvasDialog component
function handleClearDialogConfirm() {
  if (drawingCanvasRef.value) {
    drawingCanvasRef.value.resetCanvas();
  }

  closeClearDialog();
}
</script>

<template>
  <main>
    <p class="header">Let your creativity flow! Draw and send it to the game!</p>

    <BrushToolbar
      :tool="tool"
      :brush-size="brushSize"
      @tool-change="handleToolChange"
      @clear="openClearDialog()"
      @brush-size-change="handleBrushSizeChange"/>

    <DrawingCanvas
      ref="drawingCanvasRef"
      :tool="tool"
      :brush-size="brushSize"
      @submit="handleSubmit"/>

    <div class="buttons">
      <button class="button" id="send" type="button" @click="drawingCanvasRef?.submitDrawing()">SEND TO GAME</button>
    </div>

    <StatusIndicator :connected="connected" :status-text="statusText" />

    <ClearCanvasDialog
      v-if="showClearDialog"
      @confirm="handleClearDialogConfirm"
      @cancel="closeClearDialog()"/>
  </main>
</template>

<style scoped>
main {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  gap: 10px;
  z-index: 1;
}

.header {
  font-size: 1.2rem;
  text-align: center;
  margin-bottom: 26px;
}

.buttons {
  display: flex;
  gap: 10px;
  width: min(88vw, 360px);
  flex-wrap: wrap;
}

button {
  flex: 1;
  border-radius: 8px;
  border: none;
  padding: 22px 12px;
  font-size: 1.1rem;
  font-family: "Playfair", serif;
  color: white;
  background-image: url("../assets/img/button-long.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-color: transparent;
  transition: all 0.2s ease-in-out;
}

#send {
  width: 50%;
  height: 110px;
  font-size: 1.2rem;
}

button:hover {
  cursor: pointer;
  filter: brightness(1.5);
  transform: scale(1.05);
}
</style>
