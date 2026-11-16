<script setup>
import CharacterOptionSelector from "./CharacterOptionSelector.vue";

defineProps({
  modelValue: {type: String, default: ""},
  options: {type: Array, required: true},
});
defineEmits(["update:modelValue"]);
</script>

<template>
  <CharacterOptionSelector :model-value="modelValue" :options="options" name="race" bonus
                           title="What race would you like to be?" subtitle="Races gain stat bonuses."
                           @update:model-value="$emit('update:modelValue', $event)"/>
</template>
