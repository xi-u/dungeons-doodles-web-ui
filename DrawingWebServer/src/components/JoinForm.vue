<script setup>
import { ref } from "vue";

// The first screen for a player: pick a name. The server checks the name again; this check only helps the player
const emit = defineEmits(["join"]);
const name = ref("");
const logo = new URL("../assets/img/logo.png", import.meta.url).href;

function submit() {
  const trimmed = name.value.trim();
  if (trimmed) {
    emit("join", trimmed);
  }
}
</script>

<template>
  <img class="logo" :src="logo" alt="Dungeons & Doodles" />

  <form class="paper-panel" @submit.prevent="submit">
    <h2>Join the adventure</h2>
    <p><label for="player-name">What's your name?</label></p>
    <input id="player-name" v-model="name" maxlength="20" autocomplete="nickname" required />
    <button class="game-button" type="submit">JOIN</button>
  </form>
</template>

<style scoped>
.logo {
  width: min(70vw, 280px);
}

input {
  width: 100%;
  margin: 12px 0 18px;
  padding: 12px;
  font: 1.3rem "InkFree";
  color: #3b2113;
  background: #f3e3c3;
  border: 2px solid #8b5a2b;
  border-radius: 8px;
}
</style>