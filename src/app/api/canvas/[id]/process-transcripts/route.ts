import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import type { Note } from "~/lib/db/schema";

import { getCanvas, updateCanvasNotes } from "~/lib/actions/canvas";
import { auth } from "~/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: canvasId } = await params;
    const { transcripts } = await request.json();

    if (!transcripts || !Array.isArray(transcripts)) {
      return NextResponse.json(
        { error: "Transcripts array is required" },
        { status: 400 },
      );
    }

    // Get current canvas data
    const currentCanvas = await getCanvas(canvasId);
    const updatedNotes = [...currentCanvas.notes];
    let maxZIndex = Math.max(...currentCanvas.notes.map(n => n.zIndex), 0);
    let maxId = Math.max(...currentCanvas.notes.map(n => n.id), 0);

    const newNotes: Note[] = [];

    // Process each transcript
    for (const transcript of transcripts) {
      if (!transcript.text || typeof transcript.text !== "string") {
        continue;
      }

      const trimmedText = transcript.text.trim();
      if (!trimmedText) {
        continue;
      }

      // Check if a note with this content already exists
      const existingNote = updatedNotes.find(note =>
        note.content.toLowerCase().includes(trimmedText.toLowerCase())
        || trimmedText.toLowerCase().includes(note.content.toLowerCase().replace(/^# /, "").split("\n")[0].toLowerCase()),
      );

      if (existingNote) {
        continue; // Skip if note already exists
      }

      // Create a new note from the transcript
      maxId += 1;
      maxZIndex += 1;

      const randomSize = () => Math.floor(Math.random() * 6) + 15; // 15-20 inclusive

      const newNote: Note = {
        id: maxId,
        content: `# ${trimmedText}\n\nCreated from speech at ${new Date().toLocaleTimeString()}`,
        position: {
          x: Math.floor(Math.random() * 80) + 20, // Random position with some padding
          y: Math.floor(Math.random() * 80) + 20,
        },
        size: { width: randomSize(), height: randomSize() },
        zIndex: maxZIndex,
      };

      updatedNotes.push(newNote);
      newNotes.push(newNote);
    }

    // Only update if we created new notes
    if (newNotes.length > 0) {
      await updateCanvasNotes(canvasId, updatedNotes);
    }

    return NextResponse.json({
      success: true,
      createdNotes: newNotes,
      message: `Created ${newNotes.length} new notes from transcripts`,
    });
  }
  catch (error) {
    console.error("Error processing transcripts:", error);
    return NextResponse.json(
      { error: "Failed to process transcripts" },
      { status: 500 },
    );
  }
}
