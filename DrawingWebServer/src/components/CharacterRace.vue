<script setup>
import CharacterOptionSelector from "./CharacterOptionSelector.vue";

// A component that displays a set of character races and allows the user to select one.

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
