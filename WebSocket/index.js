const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

app.get("/", (req, res) => {
  res.send("WebSocket server is running");
});

const wss = new WebSocket.Server({ server });
const clients = new Map();

wss.on("connection", (ws) => {
  const clientId = generateUUID();
  clients.set(clientId, ws);

  console.log(`Server: Client ${clientId} connected.`);

  ws.on("message", (message) => {
    console.log(`Server: Received message ${message}`);
  });

  ws.on("close", () => {
    clients.delete(clientId);
    console.log(`Server: Client ${clientId} disconnected.`);
  });
});

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const wsUrl =
  process.env.NODE_ENV === "production"
    ? "wss://your-heroku-app-name.herokuapp.com"
    : "ws://localhost:8080";

setTimeout(() => {
  const ws = new WebSocket(wsUrl);

  ws.on("open", () => {
    console.log("Client: Connected to the signaling server");
    ws.send(JSON.stringify({ type: "test", payload: "Hello from the client" }));
  });

  ws.on("message", (data) => {
    console.log(`Client: Received message from the server: ${data.toString()}`);
  });

  ws.on("error", (error) => {
    console.error("Client: WebSocket error:", error);
  });

  ws.on("close", () => {
    console.log("Client: Disconnected from the signaling server");
  });
}, 1000);
