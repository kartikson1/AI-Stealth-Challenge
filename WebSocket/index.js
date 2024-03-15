const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 }, () => {
  console.log(`Server started on port ${wss.options.port}`);
});

wss.on("connection", function connection(ws) {
  ws.on("message", function message(data) {
    console.log("received: %s", data);
  });

  ws.send("something");
});
