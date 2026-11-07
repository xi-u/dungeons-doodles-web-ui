import { computed, onMounted, ref } from "vue";
import { io } from "socket.io-client";

// Default variables
const DEFAULT_BRUSH_SIZE = 6;

// This composable manages the state and behavior of a drawing session. It handles the connection to the server via
// Socket.IO, manages the drawing tool and brush size, and provides methods for submitting drawings and updating the UI.
export function useDrawingSession() {
  // Extract session ID and web token from the URL query parameters
  const params = new URLSearchParams(window.location.search);
  const sessionId = computed(() => params.get("s"));
  const webToken = computed(() => params.get("t"));

  // Reactive state variables
  const connected = ref(false);
  const tool = ref("draw");
  const brushSize = ref(DEFAULT_BRUSH_SIZE);
  const showClearDialog = ref(false);
  const statusText = ref("Connecting…");

  // Socket.IO socket instance
  const socket = ref(null);

  // Update the status text displayed to the user
  function setStatus(message) {
    statusText.value = message;
  }

  // Update the current drawing tool (either "draw" or "erase")
  function updateTool(nextTool) {
    tool.value = nextTool === "erase" ? "erase" : "draw";
  }

  // Open the clear canvas confirmation dialog
  function openClearDialog() {
    showClearDialog.value = true;
  }

  // Close the clear canvas confirmation dialog
  function closeClearDialog() {
    showClearDialog.value = false;
  }

  // Set up the Socket.IO connection and event listeners
  function setupSocket() {
    socket.value = io({ transports: ["websocket", "polling"] });

    // Handle the connection event
    socket.value.on("connect", () => {
      connected.value = true;

      if (!sessionId.value || !webToken.value) {
        setStatus("QR code is invalid. Scan again.");
        connected.value = false;
        return;
      }

      socket.value.emit("phone:join", { sessionId: sessionId.value, webToken: webToken.value }, (result) => {
        setStatus(result.ok ? "Connected" : result.error);
        connected.value = Boolean(result.ok);
      });
    });

    // Handle the disconnect event
    socket.value.on("disconnect", () => {
      connected.value = false;
      setStatus("Connection lost");
    });
  }

  // Submit the drawing to the server
  function submitDrawing(pngData) {
    if (!socket.value) {
      return;
    }

    setStatus("Sending…");
    socket.value.emit("drawing:submit", { png: pngData }, (result) => {
      setStatus(result.ok ? "Sent" : result.error);
    });
  }

  // When the component is mounted, set up the Socket.IO connection
  onMounted(() => {
    setupSocket();
  });

  // Return the reactive state and methods for use in the component
  return {
    connected,
    tool,
    brushSize,
    showClearDialog,
    statusText,
    socket,
    setStatus,
    updateTool,
    openClearDialog,
    closeClearDialog,
    submitDrawing,
  };
}
