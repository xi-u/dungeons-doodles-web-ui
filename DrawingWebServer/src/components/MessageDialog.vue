<script setup>
// A pop-up with one message and an OK button, for errors the player has to notice (game full, already started…).
// Same look as the clear-canvas dialog: parchment with the wooden border over a dark backdrop
const props = defineProps({
  message: { type: String, required: true },
});

const emit = defineEmits(["close"]);
</script>

<template>
  <div class="dialog-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="message-dialog-title"
       aria-describedby="message-dialog-text">
    <div class="paper-panel">
      <h2 id="message-dialog-title">Oops</h2>
      <p id="message-dialog-text">{{ props.message }}</p>
      <button type="button" class="game-button" autofocus @click="emit('close')">OK</button>
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
  background: rgba(0, 0, 0, 0.5);
  z-index: 20;
}

.paper-panel p {
  margin: 0 0 18px;
  font-size: 1.1rem;
  line-height: 1.5;
}
</style>
