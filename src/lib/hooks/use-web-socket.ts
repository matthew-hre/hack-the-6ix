/* eslint-disable ts/no-use-before-define */
/* eslint-disable no-console */
import { useCallback, useEffect, useRef, useState } from "react";

import type { Note } from "~/lib/db/schema";

import env from "~/lib/env.client";

export type WebSocketMessage = {
  type: "notes_update" | "note_added" | "note_deleted" | "ping" | "pong" | "join_canvas" | "leave_canvas";
  canvasId?: string;
  notes?: Note[];
  note?: Note;
  noteId?: number;
  clientId?: string;
  timestamp?: number;
};

type UseWebSocketOptions = {
  canvasId: string;
  onNotesUpdate?: (notes: Note[]) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
};

export function useWebSocket({
  canvasId,
  onNotesUpdate,
  onConnected,
  onDisconnected,
  onError,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelayRef = useRef(1000);
  const isConnectingRef = useRef(false);

  // stable callback refs to prevent unnecessary reconnections
  const onNotesUpdateRef = useRef(onNotesUpdate);
  const onConnectedRef = useRef(onConnected);
  const onDisconnectedRef = useRef(onDisconnected);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onNotesUpdateRef.current = onNotesUpdate;
    onConnectedRef.current = onConnected;
    onDisconnectedRef.current = onDisconnected;
    onErrorRef.current = onError;
  }, [onNotesUpdate, onConnected, onDisconnected, onError]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnectingRef.current) {
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      isConnectingRef.current = true;
      setConnectionState("connecting");

      const wsUrl = env.NODE_ENV === "production"
        ? `wss://${window.location.host}/ws`
        : `ws://localhost:8080`;

      console.log("Attempting to connect to WebSocket:", wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        isConnectingRef.current = false;
        setIsConnected(true);
        setConnectionState("connected");
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = 1000;

        ws.send(JSON.stringify({
          type: "join_canvas",
          canvasId,
          timestamp: Date.now(),
        }));

        onConnectedRef.current?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case "notes_update":
              if (message.notes && message.canvasId === canvasId) {
                onNotesUpdateRef.current?.(message.notes);
              }
              break;

            case "ping":
              ws.send(JSON.stringify({
                type: "pong",
                timestamp: Date.now(),
              }));
              break;

            default:
              console.log("Received unknown message type:", message.type);
          }
        }
        catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason, event.wasClean);
        isConnectingRef.current = false;
        setIsConnected(false);
        setConnectionState("disconnected");
        onDisconnectedRef.current?.();

        // Only reconnect for unexpected closures (not manual disconnects)
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          console.log("Unexpected WebSocket closure, scheduling reconnect...");
          scheduleReconnect();
        }
        else if (event.code !== 1000) {
          console.log("Max reconnection attempts reached or manual disconnect");
        }
      };

      ws.onerror = (error) => {
        const errorMessage = error instanceof ErrorEvent
          ? error.message
          : error.type || "Unknown WebSocket error";
        console.error("WebSocket error:", errorMessage, error);
        isConnectingRef.current = false;
        setConnectionState("error");
        onErrorRef.current?.(error);
      };
    }
    catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      isConnectingRef.current = false;
      setConnectionState("error");
      scheduleReconnect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasId]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log("Max reconnection attempts reached");
      return;
    }

    reconnectAttemptsRef.current += 1;
    const delay = Math.min(reconnectDelayRef.current * reconnectAttemptsRef.current, 30000);

    console.log(`Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    isConnectingRef.current = false;

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "leave_canvas",
          canvasId,
          timestamp: Date.now(),
        }));
      }

      wsRef.current.close(1000, "Manual disconnect");
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionState("disconnected");
  }, [canvasId]);

  const sendNotesUpdate = useCallback((notes: Note[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "notes_update",
        canvasId,
        notes,
        timestamp: Date.now(),
      }));
    }
  }, [canvasId]);

  useEffect(() => {
    // Add a small delay to ensure component is fully mounted before connecting
    const connectTimer = setTimeout(() => {
      connect();
    }, 100);

    return () => {
      clearTimeout(connectTimer);
      disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasId]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    connectionState,
    connect,
    disconnect,
    sendNotesUpdate,
  };
}
