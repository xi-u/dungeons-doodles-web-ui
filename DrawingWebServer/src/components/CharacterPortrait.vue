<script setup>
import {ref} from "vue";
import BrushToolbar from "./BrushToolbar.vue";
import ClearCanvasDialog from "./ClearCanvasDialog.vue";
import DrawingCanvas from "./DrawingCanvas.vue";
import {useDrawingTools} from "../composables/useDrawingTools";

defineEmits(["change", "submit"]);
const canvas = ref(null);
const {tool, brushSize, showClearDialog, updateTool, openClearDialog, closeClearDialog} = useDrawingTools();

function submitDrawing() {
  canvas.value?.submitDrawing();
}

defineExpose({submitDrawing});
</script>

<template>
  <section class="portrait-section">
    <h2>Draw your portrait</h2>
    <BrushToolbar :tool="tool" :brush-size="brushSize" @tool-change="updateTool"
                  @brush-size-change="brushSize = $event" @clear="openClearDialog"/>
    <DrawingCanvas ref="canvas" :tool="tool" :brush-size="brushSize"
                   @change="$emit('change', $event)" @submit="$emit('submit', $event)"/>
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

.portrait-section :deep(.brush-controls) {
  width: min(100%, 370px);
}

.portrait-section :deep(#canvas) {
  width: min(65vw, 240px);
  height: min(65vw, 240px);
}

@media (max-width: 650px) {
  .portrait-section h2 {
    font-size: 1.35rem;
  }
}
</style>
