<script setup>
// A component that displays a character's profile, including their name, class, race, gender, pronouns, portrait, and stats.

defineProps({
  playerName: {type: String, default: ""},
  className: {type: String, default: ""},
  raceName: {type: String, default: ""},
  gender: {type: String, default: ""},
  pronouns: {type: String, default: ""},
  portrait: {type: String, default: ""},
  stats: {type: Array, required: true},
  portraitError: {type: String, default: ""},
  sending: {type: Boolean, default: false},
  connected: {type: Boolean, default: false},
});
</script>

<template>
  <aside class="profile gradient-panel" aria-label="Your character">
    <h2>{{ playerName || "Your character" }}</h2>
    <div class="profile-top">
      <div class="profile-portrait">
        <img v-if="portrait" :src="portrait" alt="Your portrait"/>
      </div>
      <dl>
        <dt>Class</dt>
        <dd>{{ className || "No class" }}</dd>
        <dt>Race</dt>
        <dd>{{ raceName || "No race" }}</dd>
      </dl>
    </div>
    <p class="profile-gender">Gender <span>{{ gender || "Unknown" }}<template v-if="pronouns"> ({{
        pronouns
      }})</template></span></p>
    <dl class="profile-stats">
      <div v-for="stat in stats" :key="stat.name">
        <dt><img v-if="stat.icon" :src="stat.icon" alt=""/>{{ stat.name }}</dt>
        <dd>{{ stat.value }}</dd>
      </div>
    </dl>
    <p v-if="stats.length === 0" class="stats-unavailable">Stats unavailable. Update the Unity client.</p>
    <p v-if="portraitError" class="portrait-error" role="alert">{{ portraitError }}</p>
    <button class="game-button" type="submit" :disabled="sending || !connected">
      {{ sending ? "SAVING..." : "SAVE AND READY" }}
    </button>
  </aside>
</template>

<style scoped>
.profile {
  position: sticky;
  top: 0;
  padding: 14px;
  color: #E2D6BC;
  font-family: "Playfair", serif;

}

.profile h2 {
  margin: 0 0 12px;
  font-size: 1.2rem;
  text-align: left;
  font-family: "Playfair SemiBoldItalic", serif;
}

.profile-top {
  display: flex;
  gap: 10px;
  align-items: start;
}

.profile-portrait {
  flex: 1;
  max-width: 175px;
  aspect-ratio: 1;
  background: url("../assets/img/old-paper.jpg") center/cover;
  border: 6px solid transparent;
  border-image: url("../assets/img/border.png") 60;
  border-radius: 5px;
}

.profile-portrait img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

dl {
  margin: 0;
}

dt {
  font-weight: bold;
  text-transform: uppercase;
  font-size: .8rem;
  text-align: left;
}

dd {
  margin: 0 0 7px;
  overflow-wrap: anywhere;
  font-family: "InkFree";
  text-align: left;
}

.profile-gender {
  margin: 12px 0;
  font: bold .8rem "Playfair", serif;
  text-transform: uppercase;
  text-shadow: none;
  text-align: left;
}

.profile-gender span {
  font: 1rem "InkFree";
  text-transform: none;
  margin: 0 8px;
}

.profile-stats > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.profile-stats dt {
  display: inline-flex;
  align-items: center;
}

.profile-stats img {
  width: 20px;
  height: 20px;
  margin-right: 5px;
  object-fit: contain;
}

.profile-stats dd {
  margin: 0;
  font-family: "Playfair", serif;
  font-size: 1.1rem;
}

.profile .game-button {
  margin-top: 24px;
}

@media (max-width: 650px) {
  .profile {
    position: static;
    width: 100%;
  }

  .profile-portrait {
    max-width: 100px;
  }
}
</style>
