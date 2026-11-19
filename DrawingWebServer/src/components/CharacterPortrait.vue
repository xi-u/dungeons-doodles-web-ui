<script setup>
import {ref} from "vue";
import BrushToolbar from "./BrushToolbar.vue";
import ClearCanvasDialog from "./ClearCanvasDialog.vue";
import DrawingCanvas from "./DrawingCanvas.vue";
import {useDrawingTools} from "../composables/useDrawingTools";

// A component that allows the user to draw a character portrait. It includes a brush toolbar,
// a drawing canvas, and a clear canvas dialog.

defineEmits(["change", "submit"]);
const canvas = ref(null);
const canUndo = ref(false);
const canRedo = ref(false);
const {tool, brushSize, showClearDialog, updateTool, openClearDialog, closeClearDialog} = useDrawingTools();

// Submit the drawing by calling the submitDrawing method on the DrawingCanvas component
function submitDrawing() {
  canvas.value?.submitDrawing();
}

// Handle history change event from the DrawingCanvas component
function handleHistoryChange(state) {
  canUndo.value = state.canUndo;
  canRedo.value = state.canRedo;
}

defineExpose({submitDrawing});
</script>

<template>
  <section class="portrait-section">
    <h2>Draw your portrait</h2>
    <BrushToolbar :tool="tool" :brush-size="brushSize" :can-undo="canUndo" :can-redo="canRedo"
                  @tool-change="updateTool" @brush-size-change="brushSize = $event" @clear="openClearDialog"
                  @undo="canvas?.undo()" @redo="canvas?.redo()"/>
    <DrawingCanvas class="drawing-canvas" ref="canvas" :tool="tool" :brush-size="brushSize"
                   @change="$emit('change', $event)" @submit="$emit('submit', $event)"
                   @history-change="handleHistoryChange"/>
    <ClearCanvasDialog v-if="showClearDialog" @confirm="canvas?.resetCanvas(); closeClearDialog()"
                       @cancel="closeClearDialog"/>
  </section>
</template>

<style scoped>
.portrait-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.portrait-section h2 {
  width: 100%;
  margin: 0;
  color: #E2D6BC;
  font: 1.65rem "Playfair", serif;
  text-shadow: none;
}

.portrait-section :deep(#canvas) {
  width: min(80vw, 380px);
  height: min(80vw, 380px);
}

@media (max-width: 650px) {
  .portrait-section h2 {
    font-size: 1.35rem;
  }
}

@media (min-width: 900px) and (max-width: 1224px) {
  .portrait-section :deep(#canvas) {
    width: min(70vw, 580px);
    height: min(70vw, 580px);
  }
}
</style>
