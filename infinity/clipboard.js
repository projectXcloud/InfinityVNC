/*
 * noVNC Audio
 * Copyright (C) 2024 ProjectX
 */

import UI from "../app/ui.js";

// This function writes the client clipboard
// this is called in the ui.js inside clipboardReceive(e)
export function textAreaToClientClipboard(text) {
  if (typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error("Failed to write clipboard contents: ", err);
    });
  } else {
    console.warn("Clipboard Write API not available");
  }
}

function startClipboardInterval() {
  setInterval(() => {
    if (UI) {
      UI.clipboardSend();
    }
  }, 1000);
}

function onUserInteraction() {
  // Remove event listener after first interaction
  document.removeEventListener("focus", onUserInteraction);

  // Start the clipboard interval
  startClipboardInterval();
}

// Add event listener to detect first user interaction
document.addEventListener("focus", onUserInteraction);
