import env from "~/lib/env.server";

type BroadcastRequest = {
  type: "notes_update";
  canvasId: string;
  notes: any[];
  excludeClientId?: string;
};

export class WebSocketClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `http://localhost:${env.WS_PORT || 8080}`;
  }

  async broadcastNotesUpdate(canvasId: string, notes: any[], excludeClientId?: string) {
    try {
      const response = await fetch(`${this.baseUrl}/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "notes_update",
          canvasId,
          notes,
          excludeClientId,
        } as BroadcastRequest),
      });

      if (!response.ok) {
        console.warn("Failed to broadcast WebSocket update:", response.statusText);
      }
    }
    catch (error) {
      console.warn("WebSocket server not available for broadcasting:", error);
    }
  }

  async getStats() {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      if (response.ok) {
        return await response.json();
      }
    }
    catch (error) {
      console.warn("Failed to get WebSocket stats:", error);
    }
    return null;
  }
}

export const wsClient = new WebSocketClient();
