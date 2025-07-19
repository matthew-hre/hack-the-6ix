import { NextResponse } from "next/server";

import type { Note } from "~/lib/db/schema";

import { getCanvas, updateCanvasNotes } from "~/lib/actions/canvas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const currentCanvas = await getCanvas(id);

    const existingIds = currentCanvas.notes.map(note => note.id);
    const newId = Math.max(...existingIds, 0) + 1;

    const serverNote: Note = {
      id: newId,
      content: `# Server Note ${newId}\n\nThis note was created from the server at ${new Date().toLocaleTimeString()}!\n\n**This demonstrates server-side updates.**`,
      position: {
        x: Math.floor(Math.random() * 100) + 50,
        y: Math.floor(Math.random() * 100) + 50,
      },
      size: { width: 20, height: 15 },
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
