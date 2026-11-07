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
