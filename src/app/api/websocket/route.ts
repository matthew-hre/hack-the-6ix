import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import env from "~/lib/env.server";
import { wsClient } from "~/lib/websocket/client";

export async function GET(_request: NextRequest) {
  try {
    // Get stats from the standalone WebSocket server
    const stats = await wsClient.getStats();

    // For development, we'll provide connection info
    const wsPort = env.WS_PORT || 8080;
    const wsHost = env.WS_HOST || "localhost";

    return NextResponse.json({
      status: stats ? "WebSocket server running" : "WebSocket server not available",
      connectionUrl: `ws://${wsHost}:${wsPort}`,
      stats: stats || { totalClients: 0, activeCanvases: 0, canvasClients: {} },
    });
  }
  catch (error) {
    console.error("WebSocket API error:", error);
    return NextResponse.json(
      { error: "Failed to get WebSocket info" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "stats":
      { const stats = await wsClient.getStats();
        return NextResponse.json({
          stats: stats || { totalClients: 0, activeCanvases: 0, canvasClients: {} },
        }); }

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 },
        );
    }
  }
  catch (error) {
    console.error("WebSocket API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
