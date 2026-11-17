<script setup>
// A component that displays a set of character options (class, race, gender) and allows the user to select one.

defineProps({
  modelValue: {type: String, default: ""},
  options: {type: Array, required: true},
  name: {type: String, required: true},
  title: {type: String, required: true},
  subtitle: {type: String, required: true},
  bonus: {type: Boolean, default: false},
});
defineEmits(["update:modelValue"]);
</script>

<template>
  <fieldset>
    <legend>{{ title }}</legend>
    <p class="subtitle">{{ subtitle }}</p>
    <div class="options">
      <label v-for="option in options" :key="option.name" class="option"
             :class="{ selected: modelValue === option.name, dimmed: modelValue && modelValue !== option.name }">
        <input type="radio" :name="name" :value="option.name" :checked="modelValue === option.name"
               required @change="$emit('update:modelValue', option.name)"/>
        <span class="option-name">{{ option.name }}</span>
        <span class="option-image">
          <img v-if="option.icon" :src="option.icon" alt=""/>
          <span v-else class="missing-icon">?</span>
        </span>
        <span class="option-stats">
          <span v-for="stat in option.stats" :key="stat.name" :title="stat.name"
                :aria-label="`${stat.name}: ${stat.value}`">
            <img v-if="stat.icon" :src="stat.icon" alt=""/>
            <span v-else>{{ stat.name.slice(0, 3) }}</span>
            {{ bonus && stat.value > 0 ? `+${stat.value}` : stat.value }}
          </span>
        </span>
      </label>
    </div>
    <p v-if="options.find(option => option.name === modelValue)?.description" class="description">
      {{ options.find(option => option.name === modelValue).description }}
    </p>
  </fieldset>
</template>

<style scoped>
fieldset {
  min-width: 0;
  border: 0;
  margin: 0 0 22px;
  padding: 0;
}

legend {
  width: 100%;
  color: #E2D6BC;
  font: 1.65rem "Playfair", serif;
  text-shadow: none;
}

.subtitle, .description {
  color: #E2D6BC;
  text-shadow: none;
  font-weight: normal;
}

.subtitle {
  margin: 2px 0 10px;
}

.description {
  margin-top: 8px;
  font-size: .9rem;
}

.options {
  display: grid;
  grid-auto-columns: minmax(112px, 1fr);
  grid-auto-flow: column;
  gap: 8px;
  overflow-x: auto;
  padding: 3px 5px 10px;
}

.option {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  cursor: pointer;
  transition: transform 0.2s ease-in-out, opacity 0.2s ease-in-out;
}

.option.dimmed {
  opacity: 0.5;
}

.option input {
  position: absolute;
  opacity: 0;
}

.option-name {
  color: #E2D6BC;
  font: 1rem "Playfair SemiBoldItalic", serif;
}

.option-image {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border: 6px solid transparent;
  border-image: url("../assets/img/border.png") 60 stretch;
}

.option-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.option.selected {
  transform: scale(1.05);
}

.option:hover {
  transform: scale(1.05);
}

.missing-icon {
  color: #624421;
  font-size: 2rem;
}

.option-stats {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 2px 4px;
  color: #E2D6BC;
  font-size: 0.8rem;
  font-weight: bold;
  font-family: "Playfair";
  margin-top: 5px;
}

.option-stats > span {
  display: inline-flex;
  align-items: center;
}

.option-stats img {
  height: 20px;
  object-fit: contain;
}

@media (max-width: 650px) {
  legend {
    font-size: 1.35rem;
  }
  .option-stats {
    font-size: 0.7rem;
  }
  .option-stats img {
    height: 14px;
  }
}
</style>
