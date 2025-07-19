/* eslint-disable no-console */
/* eslint-disable node/no-process-env */

import http from "node:http";
import { v4 as uuidv4 } from "uuid";
import { WebSocketServer } from "ws";

class SimpleWebSocketManager {
  constructor() {
    this.clients = new Map();
    this.canvasClients = new Map();
    this.wss = null;
    this.httpServer = null;
    this.pingInterval = null;
  }

  initialize() {
    if (this.wss) {
      return this.wss;
    }

    const port = process.env.WS_PORT ? Number.parseInt(process.env.WS_PORT) : 8080;

    this.httpServer = http.createServer((req, res) => {
      this.handleHttpRequest(req, res);
    });

    this.wss = new WebSocketServer({ server: this.httpServer });

    this.wss.on("connection", (ws) => {
      this.handleConnection(ws);
    });

    this.httpServer.listen(port, () => {
      console.log(`WebSocket server running on port ${port}`);
    });

    this.startPingInterval();
    return this.wss;
  }

  handleHttpRequest(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    if (pathname === "/broadcast" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (data.type === "notes_update" && data.canvasId && data.notes) {
            this.broadcastToCanvas(data.canvasId, {
              type: "notes_update",
              canvasId: data.canvasId,
              notes: data.notes,
              timestamp: Date.now(),
            }, data.excludeClientId);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
          }
          else {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid broadcast data" }));
          }
        }
        catch (error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON" }));
          console.error("Error parsing broadcast data:", error);
        }
      });
    }
    else if (pathname === "/stats" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(this.getStats()));
    }
    else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  }

  handleConnection(ws) {
    const clientId = uuidv4();
    const client = {
      id: clientId,
      ws,
      lastPing: Date.now(),
    };

    this.clients.set(clientId, client);
    console.log(`Client ${clientId} connected. Total clients: ${this.clients.size}`);

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(clientId, message);
      }
      catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });

    ws.on("close", () => {
      this.handleDisconnection(clientId);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      this.handleDisconnection(clientId);
    });

    this.sendToClient(clientId, {
      type: "ping",
      clientId,
      timestamp: Date.now(),
    });
  }

  handleMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client)
      return;

    switch (message.type) {
      case "join_canvas":
        if (message.canvasId) {
          this.joinCanvas(clientId, message.canvasId);
        }
        break;

      case "leave_canvas":
        if (client.canvasId) {
          this.leaveCanvas(clientId, client.canvasId);
        }
        break;

      case "notes_update":
        if (client.canvasId && message.notes) {
          this.broadcastToCanvas(client.canvasId, {
            type: "notes_update",
            canvasId: client.canvasId,
            notes: message.notes,
            timestamp: Date.now(),
          }, clientId);
        }
        break;

      case "pong":
        client.lastPing = Date.now();
        break;

      default:
        console.log("Unknown message type:", message.type);
    }
  }

  handleDisconnection(clientId) {
    const client = this.clients.get(clientId);
    if (!client)
      return;

    console.log(`Client ${clientId} disconnected. Total clients: ${this.clients.size - 1}`);

    if (client.canvasId) {
      this.leaveCanvas(clientId, client.canvasId);
    }

    this.clients.delete(clientId);
  }

  joinCanvas(clientId, canvasId) {
    const client = this.clients.get(clientId);
    if (!client)
      return;

    if (client.canvasId) {
      this.leaveCanvas(clientId, client.canvasId);
    }

    client.canvasId = canvasId;

    if (!this.canvasClients.has(canvasId)) {
      this.canvasClients.set(canvasId, new Set());
    }

    this.canvasClients.get(canvasId).add(clientId);
    console.log(`Client ${clientId} joined canvas ${canvasId}`);
  }

  leaveCanvas(clientId, canvasId) {
    const client = this.clients.get(clientId);
    if (client) {
      client.canvasId = undefined;
    }

    const canvasClientSet = this.canvasClients.get(canvasId);
    if (canvasClientSet) {
      canvasClientSet.delete(clientId);
      if (canvasClientSet.size === 0) {
        this.canvasClients.delete(canvasId);
      }
    }

    console.log(`Client ${clientId} left canvas ${canvasId}`);
  }

  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== 1)
      return; // 1 = OPEN

    try {
      client.ws.send(JSON.stringify(message));
    }
    catch (error) {
      console.error("Error sending message to client:", error);
      this.handleDisconnection(clientId);
    }
  }

  broadcastToCanvas(canvasId, message, excludeClientId) {
    const canvasClientSet = this.canvasClients.get(canvasId);
    if (!canvasClientSet)
      return;

    let broadcastCount = 0;
    canvasClientSet.forEach((clientId) => {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
        broadcastCount++;
      }
    });

    console.log(`Broadcasted message to ${broadcastCount} clients in canvas ${canvasId}`);
  }

  startPingInterval() {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      this.clients.forEach((client, clientId) => {
        if (now - (client.lastPing || 0) > 60000) {
          console.log(`Client ${clientId} timed out`);
          this.handleDisconnection(clientId);
          return;
        }

        if (client.ws.readyState === 1) { // 1 = OPEN
          this.sendToClient(clientId, {
            type: "ping",
            timestamp: now,
          });
        }
      });
    }, 30000);
  }

  getStats() {
    return {
      totalClients: this.clients.size,
      activeCanvases: this.canvasClients.size,
      canvasClients: Object.fromEntries(
        Array.from(this.canvasClients.entries()).map(([canvasId, clients]) => [
          canvasId,
          clients.size,
        ]),
      ),
    };
  }

  shutdown() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    this.clients.forEach((client) => {
      if (client.ws.readyState === 1) {
        client.ws.close();
      }
    });

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = null;
    }

    this.clients.clear();
    this.canvasClients.clear();
  }
}

const manager = new SimpleWebSocketManager();
manager.initialize();

process.on("SIGINT", () => {
  console.log("\nShutting down WebSocket server...");
  manager.shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down WebSocket server...");
  manager.shutdown();
  process.exit(0);
});

console.log("WebSocket server is running. Press Ctrl+C to stop the server");

export { manager };
