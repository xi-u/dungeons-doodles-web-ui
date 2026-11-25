<script setup>

// A dialog that shows the player what each character stat does in gameplay. It is opened from CharacterCustomization.vue.

const props = defineProps({
  stats: {type: Array, required: true},
});

const emit = defineEmits(["close"]);

const statDescriptions = {
  Strength: "Improves physical choices such as fighting, breaking, pushing, lifting and throwing.",
  Agility: "Adds a chance to completely avoid incoming damage. Each point adds 2%, up to a maximum of 60%.",
  Vitality: "Adds maximum HP and reduces incoming damage. Each point reduces damage by 1%, up to a maximum of 50%.",
  Spirit: "A random party member's Spirit influences how hopeful or dangerous encounters are.",
  Intelligence: "Improves choices that rely on knowledge, memory, and problem-solving.",
};
</script>

<template>
  <div class="dialog-backdrop" role="presentation" @click.self="emit('close')">
    <section class="stats-dialog gradient-panel" role="dialog" aria-modal="true"
             aria-labelledby="stats-dialog-title" @keydown.esc.stop.prevent="emit('close')">
      <button class="close-button" type="button" aria-label="Close character stats information"
              autofocus @click="emit('close')">×</button>
      <h2 id="stats-dialog-title">Character Stats</h2>
      <p class="intro">Each stat has one clear role in gameplay:</p>
      <dl class="stat-list">
        <div v-for="stat in props.stats" :key="stat.name" class="stat-entry">
          <dt>
            <span>{{ stat.name }}</span>
            <img v-if="stat.icon" :src="stat.icon" alt=""/>
          </dt>
          <dd>{{ statDescriptions[stat.name] || `${stat.name} affects your character's gameplay options.` }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.58);
}

.stats-dialog {
  position: relative;
  width: min(88vw, 360px);
  max-height: 90vh;
  overflow-y: auto;
  padding: 18px 14px;
  color: #e2d6bc;
  text-align: left;
  font-family: "Playfair", serif;
  scrollbar-color: #9c6a29 #281507;
}

.stats-dialog h2 {
  margin: 0 36px 8px 0;
  color: #fff;
  font: italic 1.2rem "Playfair SemiBoldItalic", serif;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000,
  -1px 1px 0 #000, 1px 1px 0 #000;
}

.intro {
  margin: 0 0 8px;
  color: #e2d6bc;
  font: 0.82rem "Playfair", serif;
  text-shadow: none;
}

.stat-list {
  margin: 0;
}

.stat-entry {
  padding: 7px 0 8px;
  border-top: 1px solid rgba(226, 214, 188, 0.35);
}

.stat-entry dt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 5px;
  font-weight: bold;
  font-size: 0.82rem;
}

.stat-entry img {
  width: 19px;
  height: 19px;
  object-fit: contain;
}

.stat-entry dd {
  margin: 0;
  color: #fff;
  font: 0.78rem/1.3 "Playfair", serif;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000,
  -1px 1px 0 #000, 1px 1px 0 #000;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #d5a448;
  border-radius: 50%;
  color: #fff;
  background: #291507;
  font: 1.35rem/1 "Playfair", serif;
  cursor: pointer;
}

.close-button:hover {
  filter: brightness(1.35);
}

.close-button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
</style>
