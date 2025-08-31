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

let ws = new WebSocket(`${wsProtocol}://${hostname}:${port}/${path}/resize`);

export function pxResize(width, height) {
  ws.send(
    JSON.stringify({ width, height })
  );
}