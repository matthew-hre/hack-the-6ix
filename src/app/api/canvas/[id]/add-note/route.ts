import { NextResponse } from "next/server";

import type { Note } from "~/lib/db/schema";

import { getCanvas, updateCanvasNotes } from "~/lib/actions/canvas";
import { findOptimalNotePosition, getNextNoteId } from "~/lib/utils/note-placement";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const currentCanvas = await getCanvas(id);

    const newId = getNextNoteId(currentCanvas.notes);
    const position = findOptimalNotePosition(currentCanvas.notes);

    const randomSize = () => Math.floor(Math.random() * 6) + 15; // 15-20 inclusive

    const serverNote: Note = {
      id: newId,
      content: `# Server Note ${newId}\n\nThis note was created from the server at ${new Date().toLocaleTimeString()}!\n\n**This demonstrates server-side updates.**`,
      position,
      size: { width: randomSize(), height: randomSize() },
      zIndex: Math.max(...currentCanvas.notes.map(n => n.zIndex), 0) + 1,
    };

    const updatedNotes = [...currentCanvas.notes, serverNote];

    await updateCanvasNotes(id, updatedNotes);

    return NextResponse.json({
      success: true,
      note: serverNote,
      message: "Server note added successfully",
    });
  }
  catch (error) {
    console.error("Error adding server note:", error);
    return NextResponse.json(
      { error: "Failed to add server note" },
      { status: 500 },
    );
  }
}
