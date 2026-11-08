<script setup>

// This is the brush toolbar component. It allows the user to select the drawing tool (brush or eraser),
// adjust the brush size, and clear the canvas.
//
// THis components emits the following events:
// - tool-change: emitted when the user selects a different drawing tool (brush or eraser)
// - brush-size-change: emitted when the user adjusts the brush size
// - clear: emitted when the user clicks the clear button to clear the canvas
//
// The parent component (DrawingView) can listen to these events and update the drawing canvas accordingly

// Props are used to pass the current tool and brush size from the parent component (DrawingView) to this component (BrushToolbar)
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
const emit = defineEmits(["tool-change", "clear", "brush-size-change"]);

// Set the URLs for the icons used in the toolbar
const brushIcon = new URL("../assets/svg/brush.svg", import.meta.url).href;
const eraserIcon = new URL("../assets/svg/eraser.svg", import.meta.url).href;
const binIcon = new URL("../assets/svg/bin.svg", import.meta.url).href;

// Emit the tool-change event when the user selects a different drawing tool (brush or eraser)
function onToolChange(value) {
  emit("tool-change", value);
}

// Emit the brush-size-change event when the user adjusts the brush size
function onBrushSizeChange(event) {
  emit("brush-size-change", Number(event.target.value));
}
</script>

<template>
  <div class="brush-controls">
    <button class="tool" :class="{ active: props.tool === 'draw' }" type="button" @click="onToolChange('draw')">
      <img :src="brushIcon" alt="Brush" class="icon" />
    </button>
    <button class="tool" :class="{ active: props.tool === 'erase' }" type="button" @click="onToolChange('erase')">
      <img :src="eraserIcon" alt="Eraser" class="icon" />
    </button>
    <div>
      <p>Brush Size</p>
      <input
        id="brush-size"
        :value="props.brushSize"
        type="range"
        min="2"
        max="30"
        step="1"
        @input="onBrushSizeChange"/>
    </div>
    <button class="tool" id="clear" type="button" title="Clear Canvas" @click="emit('clear')">
      <img :src="binIcon" alt="Clear" class="icon" />
    </button>
  </div>
</template>

<style scoped>
.brush-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 8px;
  width: min(88vw, 370px);
  color: white;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000,
  -1px 1px 0 #000, 1px 1px 0 #000;
  font-weight: 700;
}

.icon {
  width: 40px;
  height: 40px;
}

.tool {
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url("../assets/img/button-square.png");
  background-size: cover;
  background-color: transparent;
  width: 70px;
  height: 70px;
  border-radius: 8px;
  border: none;
  transition: all 0.2s ease-in-out;
}

.tool.active {
  box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.8),
  0 0 0 2px rgba(0, 0, 0, 0.5);
  filter: brightness(1.2);
}

#brush-size {
  width: 100%;
  height: 8px;
  margin: 12px 0;
  appearance: none;
  -webkit-appearance: none;
  background: #3b2113;
  border: 1px solid #8b5a2b;
  border-radius: 10px;
  outline: none;
  cursor: pointer;
}

#brush-size::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(145deg, #ffe18a, #e5a52e 60%, #a96316);
  border: 2px solid #704015;
  box-shadow: 0 2px 5px #0006;
  cursor: grab;
}

#brush-size::-webkit-slider-thumb:active {
  cursor: grabbing;
  box-shadow: 0 0 8px #f5bd4f99;
}

#brush-size::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(145deg, #ffe18a, #e5a52e 60%, #a96316);
  border: 2px solid #704015;
  box-shadow: 0 2px 5px #0006;
  cursor: grab;
}

#brush-size:focus-visible {
  outline: 2px solid #ffd66b;
  outline-offset: 5px;
}

button:hover {
  cursor: pointer;
  filter: brightness(1.5);
  transform: scale(1.05);
}
</style>
