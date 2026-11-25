<script setup>
import {computed, ref} from "vue";
import CharacterClass from "./CharacterClass.vue";
import CharacterRace from "./CharacterRace.vue";
import CharacterGender from "./CharacterGender.vue";
import CharacterPortrait from "./CharacterPortrait.vue";
import CharacterProfile from "./CharacterProfile.vue";
import CharacterStatsDialog from "./CharacterStatsDialog.vue";
import {characterStats} from "./customizationStats";
import {exportPortraitWithPaper} from "./portraitExport";

// A component that allows the user to customize their character by selecting a class, race, gender,
// and drawing a portrait. It also displays a preview of the character's profile.

const paperUrl = new URL("../assets/img/old-paper.jpg", import.meta.url).href;
const props = defineProps({
  catalog: {type: Object, required: true},
  sending: {type: Boolean, default: false},
  connected: {type: Boolean, default: false},
  playerName: {type: String, default: ""},
});
const emit = defineEmits(["submit"]);
const className = ref("");
const raceName = ref("");
const gender = ref("");
const pronouns = ref("");
const portrait = ref("");
const preparingPortrait = ref(false);
const portraitError = ref("");
const portraitComponent = ref(null);
const showStatsInfo = ref(false);

const selectedClass = computed(() => props.catalog.classes.find(option => option.name === className.value));
const selectedRace = computed(() => props.catalog.races.find(option => option.name === raceName.value));
const stats = computed(() => characterStats(selectedClass.value, selectedRace.value, props.catalog));

// Submit the character customization form by preparing the portrait and emitting the submit event
async function submitPortrait(png) {
  if (preparingPortrait.value || props.sending || !props.connected) {
    return;
  }
  const character = {
    className: className.value, raceName: raceName.value, gender: gender.value,
    pronouns: pronouns.value,
  };
  preparingPortrait.value = true;
  portraitError.value = "";
  try {
    character.portrait = await exportPortraitWithPaper(png, paperUrl);
    emit("submit", character);
  } catch (error) {
    console.error("Could not prepare portrait:", error);
    portraitError.value = "Your portrait could not be prepared. Please try again.";
  } finally {
    preparingPortrait.value = false;
  }
}
</script>

<template>
  <form class="customization" @submit.prevent="portraitComponent?.submitDrawing()">
    <div class="book gradient-panel">
      <button class="info-button" type="button" aria-label="About character stats"
              @click="showStatsInfo = true">?</button>
      <CharacterClass v-model="className" :options="catalog.classes"/>
      <CharacterRace v-model="raceName" :options="catalog.races"/>
      <CharacterGender v-model="gender" v-model:pronouns="pronouns" :options="catalog.genders"/>
      <CharacterPortrait ref="portraitComponent" @change="portrait = $event" @submit="submitPortrait"/>
    </div>
    <CharacterProfile :player-name="playerName" :class-name="className" :race-name="raceName"
                      :gender="gender" :pronouns="pronouns" :portrait="portrait" :stats="stats"
                      :portrait-error="portraitError" :sending="sending || preparingPortrait"
                      :connected="connected"/>
    <CharacterStatsDialog v-if="showStatsInfo" :stats="stats" @close="showStatsInfo = false"/>
  </form>
</template>

<style scoped>
.customization {
  display: grid;
  grid-template-columns: minmax(0, 660px) minmax(200px, 250px);
  align-items: start;
  gap: 16px;
  width: min(100%, 930px);
  flex: none;
  margin: 0 auto;
}

.book {
  position: relative;
  width: 100%;
  padding: 52px 18px 18px;
}

.info-button {
  position: absolute;
  top: 10px;
  right: 10px;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 2px solid #d5a448;
  border-radius: 50%;
  color: #fff;
  background: #291507;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.55);
  font: bold 1.5rem "Playfair", serif;
  cursor: pointer;
}

.info-button:hover {
  filter: brightness(1.35);
}

.info-button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

@media (max-width: 650px) {
  .customization {
    display: flex;
    flex-direction: column;
  }

  .book {
    padding: 48px 10px 14px;
  }
}
</style>
