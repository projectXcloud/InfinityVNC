/*
 * Bi-directional Clipboard Management
 * Copyright (C) 2024 ProjectX
 *
 * Syncs host clipboard to remote VNC session on user interaction.
 * readText() requires user activation (click/keypress) — plain
 * setInterval polling is denied by the browser without it.
 */

import UI from "../app/ui.js";

let lastSentText = null;

// Write text to the host system clipboard (remote → local direction)
export function textAreaToClientClipboard(text) {
  if (typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error("Failed to write clipboard contents: ", err);
    });
  } else {
    console.warn("Clipboard Write API not available");
  }
}

// Called from ui.js clipboardReceive() to prevent echo-back
export function updateLastSentText(text) {
  lastSentText = text;
}

// Read host clipboard and send to remote if changed
function syncClipboard() {
  if (!UI) return;
  if (typeof navigator.clipboard.readText !== "function") return;

  navigator.clipboard.readText().then((text) => {
    if (text !== lastSentText) {
      lastSentText = text;
      document.getElementById('noVNC_clipboard_text').value = text;
      if (UI.rfb) {
        UI.rfb.clipboardPasteFrom(text);
      }
    }
  }).catch(() => {
    // Clipboard API denied or no activation — silently ignore
  });
}

// User interactions provide the activation context that readText() requires
document.addEventListener("click", syncClipboard);
document.addEventListener("keydown", syncClipboard);
