<script setup>
import { computed, ref } from "vue";
import BrushToolbar from "../components/BrushToolbar.vue";
import ClearCanvasDialog from "../components/ClearCanvasDialog.vue";
import DrawingCanvas from "../components/DrawingCanvas.vue";
import { useDrawingTools } from "../composables/useDrawingTools";

// The drawing screen. It doesn't talk to the server: it hands the finished drawing up to GameView.
// As a sketchpad (secondsLeft is null) it shows no countdown.
const props = defineProps({
  secondsLeft: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(["submit"]);

// Define a ref for the DrawingCanvas component to access its methods
const drawingCanvasRef = ref(null);

const { tool, brushSize, showClearDialog, updateTool, openClearDialog, closeClearDialog } = useDrawingTools();

const headerText = computed(() => {
  if (props.secondsLeft === null) return "Let your creativity flow! Draw and send it to the game!";
  return props.secondsLeft > 0 ? `Draw! ${props.secondsLeft} seconds left` : "Time's up! Send your drawing now";
});

// Handle tool change event from the BrushToolbar component
function handleToolChange(value) {
  updateTool(value);
}

// Handle brush size change event from the BrushToolbar component
function handleBrushSizeChange(value) {
  brushSize.value = value;
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
  <section class="drawing">
    <p class="header">{{ headerText }}</p>

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
      @submit="(png) => emit('submit', png)"/>

    <div class="buttons">
      <button class="button" id="send" type="button" @click="drawingCanvasRef?.submitDrawing()">SEND TO GAME</button>
    </div>

    <ClearCanvasDialog
      v-if="showClearDialog"
      @confirm="handleClearDialogConfirm"
      @cancel="closeClearDialog()"/>
  </section>
</template>

<style scoped>
.drawing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
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
