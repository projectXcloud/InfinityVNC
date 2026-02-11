/*
 * Dynamic Resizing of X Server based on Client Size
 * Copyright (C) 2025 ProjectX
 */

let protocol = window.location.protocol;
let hostname = window.location.hostname;
let port = window.location.port;
let path = window.location.href;
let baseUrl = `${protocol}//${hostname}`;
let secure = protocol === "https:";

// if port == 80 (or 443) then it won't be present and should be set manually
if (!port) {
  port = secure ? 443 : 80;
} else {
  baseUrl += `:${port}`;
}

// If the path ends exactly after the hostname or the port (like http://localhost/ or http://localhost:8080/)
if (path === baseUrl || path === `${baseUrl}/`) {
  path = "";
} else {
  path = path.substring(baseUrl.length, path.lastIndexOf("/"));
}

let wsProtocol = secure ? "wss" : "ws";
const wsUrl = `${wsProtocol}://${hostname}:${port}/${path}/resize`;

let ws = null;
let reconnectTimer = null;
let pendingResize = null;

function connect() {
  ws = new WebSocket(wsUrl);
  ws.onopen = () => {
    if (pendingResize) {
      ws.send(JSON.stringify(pendingResize));
      pendingResize = null;
    }
  };
  ws.onclose = () => {
    scheduleReconnect();
  };
  ws.onerror = () => {
    // onclose fires after onerror, reconnect handled there
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 2000);
}

connect();

export function pxResize(width, height) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    pendingResize = { width, height };
    if (!ws || ws.readyState === WebSocket.CLOSED) {
      scheduleReconnect();
    }
    return;
  }
  ws.send(JSON.stringify({ width, height }));
}
