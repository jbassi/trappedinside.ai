const server = Bun.serve({
  port: process.env.PORT ? Number(process.env.PORT) : 3001,
  fetch(req, server) {
    if (server.upgrade(req)) {
      return; // WebSocket upgrade handled
    }
    return new Response("Hello World!");
  },
  websocket: {
    open(ws) {
      console.log("WebSocket connection opened");
    },
    message(ws, message) {
      console.log("Received:", message);
      ws.send(message); // Echo back
    },
    close(ws) {
      console.log("WebSocket connection closed");
    },
  },
});

console.log(`Listening on port ${server.port} (HTTP & WebSocket)...`);