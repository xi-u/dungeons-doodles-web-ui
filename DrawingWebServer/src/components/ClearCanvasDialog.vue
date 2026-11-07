<script setup>
// This is the clear canvas dialog component. It displays a confirmation dialog when the user clicks the clear button in the brush toolbar.

// The parent component (DrawingView) can listen to the confirm and cancel events emitted by this component to either
// clear the canvas or close the dialog without clearing the canvas.
const emit = defineEmits(["confirm", "cancel"]);
</script>

<template>
  <div id="clear-dialog" class="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="clear-dialog-title"
       @click="(event) => { if (event.target === event.currentTarget) emit('cancel'); }">
    <div class="confirmation-dialog">
      <h2 id="clear-dialog-title">Clear canvas?</h2>
      <p>Are you sure you want to clear the entire canvas?</p>
      <div class="dialog-actions">
        <button type="button" class="dialog-button cancel" id="clear-cancel" @click="emit('cancel')">Cancel</button>
        <button type="button" class="dialog-button confirm" id="clear-confirm" @click="emit('confirm')">Clear</button>
      </div>
    </div>
  </div>
</template>
