import { ref } from "vue";

const DEFAULT_BRUSH_SIZE = 6;

// The drawing tools on this phone: brush or eraser, brush size, and the clear dialog. Only local screen state;
// the connection to the game lives in useGameSession
export function useDrawingTools() {
  const tool = ref("draw");
  const brushSize = ref(DEFAULT_BRUSH_SIZE);
  const showClearDialog = ref(false);

  function updateTool(nextTool) {
    tool.value = nextTool === "erase" ? "erase" : "draw";
  }

  function openClearDialog() {
    showClearDialog.value = true;
  }

  function closeClearDialog() {
    showClearDialog.value = false;
  }

  return { tool, brushSize, showClearDialog, updateTool, openClearDialog, closeClearDialog };
}
