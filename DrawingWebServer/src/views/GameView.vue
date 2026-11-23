<script setup>
import StatusIndicator from "../components/StatusIndicator.vue";
import { useGameSession } from "../composables/useGameSession";
import JoinForm from "../components/JoinForm.vue";
import DrawingView from "./DrawingView.vue";
import VoteList from "../components/VoteList.vue";
import MessageDialog from "../components/MessageDialog.vue";
import CharacterCustomization from "../components/CharacterCustomization.vue";

// The page a phone opens after scanning the QR code. It shows one screen at a time; useGameSession decides which
const {
  screen,
  connected,
  statusText,
  secondsLeft,
  options,
  images,
  picked,
  winner,
  ownSlot,
  alertText,
  customizationCatalog,
  customizationSending,
  playerName,
  join,
  submitCustomization,
  submitDrawing,
  vote,
  dismissAlert,
} = useGameSession();
</script>

<template>
  <main class="game">
    <JoinForm v-if="screen === 'join'" @join="join" />
    <CharacterCustomization
        v-if="screen === 'customization'"
        :catalog="customizationCatalog"
        :sending="customizationSending"
        :connected="connected"
        :player-name="playerName"
        @submit="submitCustomization"/>
    <DrawingView
        v-if="screen === 'drawing' || screen === 'sketchpad'"
        :seconds-left="screen === 'drawing' ? secondsLeft : null"
        @submit="submitDrawing"/>
    <VoteList
        v-if="screen === 'voting'"
        :options="options"
        :images="images"
        :picked="picked"
        :own-slot="ownSlot"
        :seconds-left="secondsLeft"
        @vote="vote"/>
    <section v-if="screen === 'result'" class="paper-panel">
      <h2>The winner!</h2>
      <img
          v-if="images[winner]"
          class="winner-drawing"
          :src="`data:image/png;base64,${images[winner]}`"
          :alt="options[winner]"/>
      <p>{{ options[winner] }}</p>
      <p v-if="winner === ownSlot">That's yours!</p>
    </section>

    <section v-if="screen === 'connecting' || screen === 'waiting'" class="paper-panel">
      <h2>{{ screen === "connecting" ? "Connecting…" : "Get ready!" }}</h2>
      <p>Look at the big screen</p>
    </section>

    <section v-if="screen === 'error'" class="paper-panel">
      <h2>Oops</h2>
      <p>{{ statusText }}</p>
    </section>

    <StatusIndicator :connected="connected" :status-text="statusText" />

    <MessageDialog v-if="alertText" :message="alertText" @close="dismissAlert" />
  </main>
</template>

<style scoped>
.game {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* dvh is the height you actually see, also while the address bar shows. vh is the height without it, so the page was too tall */
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  /* viewport-fit=cover puts the page under the notch and the home bar; keep the content clear of them */
  padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
  gap: 10px;
  z-index: 1;
}
.game:has(.customization) {
  justify-content: flex-start;
  overflow-y: auto;
}
.game:has(.customization) :deep(.status-indicator) {
  position: static;
  flex: none;
}
.winner-drawing {
  width: 100%;
  max-width: 240px;
  aspect-ratio: 1;
}
</style>