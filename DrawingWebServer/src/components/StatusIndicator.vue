<script setup>

// This is the status indicator component. It displays the current connection status (connected or disconnected) and a status message.

// Props are used to pass the current connection status and status message from the parent component (DrawingView) to this component (StatusIndicator)
const props = defineProps({
  connected: {
    type: Boolean,
    default: false,
  },
  statusText: {
    type: String,
    default: "Connecting…",
  },
});

// Set the URLs for the icons used in the status indicator
const connectedIcon = new URL("../assets/svg/connected.svg", import.meta.url).href;
const disconnectedIcon = new URL("../assets/svg/disconnected.svg", import.meta.url).href;
</script>

<template>
  <p id="status" class="status-indicator">
    <span id="status-text">{{ props.statusText }}</span>
    <img
      id="status-icon"
      class="status-icon"
      :src="props.connected ? connectedIcon : disconnectedIcon"
      :alt="props.connected ? 'Connected' : 'Disconnected'"/>
  </p>
</template>

<style scoped>
.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: absolute;
  bottom: 10px;
  left: 10px;
}

.status-icon {
  width: 18px;
  height: 18px;
  display: inline-block;
  flex-shrink: 0;
  color: white;
}
</style>
