# ARACHNID

Weave mindmaps with nothing but your voice.

> Created in 36 hours for Hack the 6ix 2025.

## Overview

ARACHNID is a voice-powered mindmapping application that allows users to create visual knowledge maps through speech. Users can speak their ideas and watch as they're transformed into interactive notes on a collaborative canvas.

## Features

### Voice-Powered Interface

- **Real-time speech recognition** using Web Speech API
- **Live transcription** with automatic speech logging
- **Voice-to-note conversion** powered by AI
- **Continuous listening** with smart pause detection

### Interactive Canvas

- **Infinite zoomable canvas** with smooth zoom controls
- **Draggable and resizable notes** with automatic positioning
- **Real-time collaboration** via WebSockets
- **Grid-based layout** for organized visual structure

### AI-Powered Processing

- **OpenAI GPT integration** for intelligent note creation and updates
- **Smart note merging** - updates existing notes with new information
- **Automatic content analysis** and note generation

### Authentication & Data

- **GitHub OAuth integration** via Better Auth
- **PostgreSQL database** with Drizzle ORM
- **User session management** and secure API routes
- **Canvas and speech log persistence**

## Tech Stack

This project was originally scaffolded with [matt-init](https://github.com/matthew-hre/matt-init).

### Frontend

- **Next.js 15** with React 19 and TypeScript
- **Tailwind CSS** with custom design system
- **Shadcn/ui** components with Radix UI primitives
- **React Zoom Pan Pinch** for canvas interactions
- **React Speech Recognition** for voice input
- **Custom fonts** (HealTheWeb typeface)

### Backend

- **Next.js App Router** with Server Actions
- **PostgreSQL** database with Docker Compose
- **Drizzle ORM** for type-safe database operations
- **Better Auth** for authentication
- **WebSocket server** for real-time collaboration

### AI & External Services

- **OpenAI GPT** for natural language processing
- **Web Speech API** for browser-native speech recognition

### Development Tools

- **TypeScript** for type safety
- **ESLint** with Antfu config
- **Husky + lint-staged** for pre-commit hooks
- **pnpm** for package management
- **Docker Compose** for database management

## Architecture

### Database Schema

```typescript
// Canvas table stores mindmap sessions
canvas: {
  id: uuid (primary key)
  name: string
  description?: string
  width: number (default: 3000)
  height: number (default: 3000)
  notes: Note[] (JSON array)
  createdAt: timestamp
  updatedAt: timestamp
  userId: uuid (foreign key)
}

// Speech logs track all voice interactions
speechLog: {
  id: uuid (primary key)
  text: string
  timestamp: timestamp
  canvasId: uuid (foreign key)
  userId: uuid (foreign key)
}

// Notes structure within canvas
Note: {
  id: number
  content: string
  position: { x: number, y: number }
  size: { width: number, height: number }
  zIndex: number
}
```

### WebSocket Architecture

- **Standalone WebSocket Server**: Runs on port 8080 (configurable via `WS_PORT`)
- **HTTP Communication**: Next.js server actions communicate with the WebSocket server via HTTP
- **Real-time Updates**: Changes are instantly broadcasted to all connected clients
- **Connection Status**: Visual indicators show connection state and collaboration status

## Development

### Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/matthew-hre/hack-the-6ix.git
   ```

2. Install dependencies:

   ```bash
    cd hack-the-6ix
    nix develop
    pnpm i
   ```

3. Set up environment variables:

````bash
    cp .env.example .env
    ```

4. Start the development server:
    ```bash
    pnpm dev
    ```

5. Run an initial DB migration:
    ```bash
    pnpm db:push
    ```
````
