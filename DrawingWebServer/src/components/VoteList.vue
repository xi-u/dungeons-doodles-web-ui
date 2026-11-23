<script setup>
import { computed } from "vue";

// Voting: one button per slot. A drawing vote shows the drawings. A text vote shows a coloured, numbered tile per
// option; the host's screen shows the option text with the same number and colour.
// The host checks every vote again; disabling buttons only helps the player
const props = defineProps({
  options: { type: Array, default: () => [] },
  images: { type: Array, default: () => [] },
  picked: { type: Number, default: -1 },
  ownSlot: { type: Number, default: -1 },
  secondsLeft: { type: Number, default: 0 },
});

const emit = defineEmits(["vote"]);

// Same colours, in the same order, as the vote buttons in Unity's Vote.uss
const SLOT_COLORS = ["#B3261E", "#1F5FA8", "#A67C00", "#2E7D32"];

const isDrawingVote = computed(() => props.images.some(Boolean));

const headerText = computed(() => {
  if (props.picked !== -1) {
    return "Tap another option to change your vote";
  }
  return isDrawingVote.value ? "Pick your favourite!" : "Pick a number from the big screen!";
});
</script>

<template>
  <section class="vote-list">
    <p class="timer" aria-live="polite">Time left: {{ props.secondsLeft }}</p>
    <p class="header">{{ headerText }}</p>

    <div class="options">
      <button
          v-for="(option, slot) in props.options"
          :key="slot"
          type="button"
          :class="[isDrawingVote ? 'drawing-option' : 'number-option', { picked: slot === props.picked }]"
          :style="isDrawingVote ? null : { '--slot-color': SLOT_COLORS[slot % SLOT_COLORS.length] }"
          :aria-label="isDrawingVote ? null : `${slot + 1}: ${option}`"
          :disabled="slot === props.ownSlot"
          @click="emit('vote', slot)">
        <template v-if="isDrawingVote">
          <img v-if="props.images[slot]" :src="`data:image/png;base64,${props.images[slot]}`" :alt="option" />
          <span>{{ slot === props.ownSlot ? "Your drawing" : option }}</span>
        </template>
        <span v-else>{{ slot + 1 }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.vote-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: min(88vw, 360px);
}

.header {
  font-size: 1.2rem;
  text-align: center;
}

.timer {
  margin: 0;
  font-variant-numeric: tabular-nums;
  font-size: 1.5rem;
}

.options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}

/* Both kinds of option are a parchment card with the wooden border */
.number-option,
.drawing-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  font: 0.9rem "InkFree";
  color: #3b2113;
  background: url("../assets/img/old-paper.jpg") center/cover;
  border: 6px solid transparent;
  border-image: url("../assets/img/border.png") 50 round;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.number-option:disabled,
.drawing-option:disabled {
  filter: grayscale(0.6) brightness(0.8);
  cursor: default;
}

/* A square card with only the number; the text is on the host's screen.
   The parchment is dyed in the colour of the number on the host's screen: multiply keeps the paper's texture */
.number-option {
  aspect-ratio: 1;
  font: 4rem "Playfair", serif;
  color: white;
  /* A soft shadow instead of an outline, which looked blocky on big digits */
  text-shadow: 0 3px 4px rgba(0, 0, 0, 0.5);
  background: var(--slot-color) url("../assets/img/old-paper.jpg") center/cover;
  background-blend-mode: multiply;
}

/* Centres the digit itself, not the font's line box: that has more room above a digit than below */
.number-option span {
  line-height: 1;
  font-variant-numeric: lining-nums;
  text-box: trim-both cap alphabetic;
}

.drawing-option img {
  width: 100%;
  aspect-ratio: 1;
}

/* Your choice stays bright while the other options are greyed out */
.picked,
.picked:disabled {
  filter: brightness(1.2);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.8), 0 0 12px #f5bd4f;
}
</style>