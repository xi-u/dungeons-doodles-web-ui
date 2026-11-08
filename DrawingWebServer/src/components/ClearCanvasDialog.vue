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

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  z-index: 20;
}

.dialog-backdrop.hidden {
  display: none;
}

.confirmation-dialog {
  width: min(90vw, 360px);
  padding: 24px 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  text-align: center;
  background-image: url("../assets/img/old-paper.jpg");
  background-size: cover;
  border: 10px solid transparent;
  border-image: url("../assets/img/border.png") 50 round;
  border-radius: 16px;
  overflow: hidden;
}

.confirmation-dialog h2 {
  margin: 0 0 12px;
  color: white;
  font-size: 1.7rem;
  font-family: "Playfair", serif;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000,
  -1px 1px 0 #000, 1px 1px 0 #000;
}

.confirmation-dialog p {
  margin: 0 0 18px;
  font-size: 1rem;
  line-height: 1.5;
}

.dialog-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.dialog-button {
  flex: 1;
  min-width: 120px;
  padding: 14px 18px;
  border-radius: 10px;
  border: none;
  font: 1rem "Playfair", serif;
  color: white;
  cursor: pointer;
  transition: transform 0.2s ease, filter 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url("../assets/img/button-long.png");
  background-size: cover;
}

.dialog-button.confirm {
  filter: hue-rotate(-30deg) saturate(150%) contrast(120%);
}

button:hover,
.dialog-button:hover {
  cursor: pointer;
  filter: brightness(1.5);
  transform: scale(1.05);
}

.dialog-button.confirm:hover {
  filter: hue-rotate(-30deg) saturate(150%) contrast(120%) brightness(1.5);
}
</style>
