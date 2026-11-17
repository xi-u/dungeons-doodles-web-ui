<script setup>
import CharacterOptionSelector from "./CharacterOptionSelector.vue";

// A component that displays a set of character classes and allows the user to select one.

defineProps({
  modelValue: {type: String, default: ""},
  options: {type: Array, required: true},
});
defineEmits(["update:modelValue"]);
</script>

<template>
  <CharacterOptionSelector :model-value="modelValue" :options="options" name="class"
                           title="What class would you like to be?" subtitle="Classes provide base stats."
                           @update:model-value="$emit('update:modelValue', $event)"/>
</template>
