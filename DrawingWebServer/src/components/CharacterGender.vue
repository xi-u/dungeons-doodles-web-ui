<script setup>
defineProps({
  modelValue: {type: String, default: ""},
  pronouns: {type: String, default: ""},
  options: {type: Array, required: true},
});
defineEmits(["update:modelValue", "update:pronouns"]);
</script>

<template>
  <fieldset class="gender">
    <legend>What gender are you?</legend>
    <div class="gender-options">
      <label v-for="option in options" :key="option.name">
        <input type="radio" name="gender" :value="option.name" :checked="modelValue === option.name"
               required @change="$emit('update:modelValue', option.name)"/>
        {{ option.name }}
      </label>
    </div>
    <label class="pronouns" for="character-pronouns">My pronouns are...
      <input id="character-pronouns" :value="pronouns" maxlength="40"
             @input="$emit('update:pronouns', $event.target.value)"/>
    </label>
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

.gender-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  color: #E2D6BC;
}

.pronouns {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  color: #E2D6BC;
}

.pronouns input {
  min-width: 0;
  width: 100px;
  padding: 8px;
  border: none;
  border-radius: 5px;
  background: #f3e3c3;
  font: 1rem "InkFree";
  background-image: url("../assets/img/border-rect.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-size: 100px 36px;
}

@media (max-width: 650px) {
  legend {
    font-size: 1.35rem;
  }
}
</style>
