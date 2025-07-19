import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { getCanvas, updateCanvasNotes } from "~/lib/actions/canvas";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const canvasData = await getCanvas(id);

    return NextResponse.json(canvasData);
  }
  catch (error) {
    console.error("Error fetching canvas:", error);
    return NextResponse.json(
      { error: "Failed to fetch canvas" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { notes, clientId } = await request.json();

    if (!notes || !Array.isArray(notes)) {
      return NextResponse.json(
        { error: "Invalid notes data" },
        { status: 400 },
      );
    }

    const updatedCanvas = await updateCanvasNotes(id, notes, clientId);

    return NextResponse.json(updatedCanvas);
  }
  catch (error) {
    console.error("Error updating canvas notes:", error);
    return NextResponse.json(
      { error: "Failed to update canvas notes" },
      { status: 500 },
    );
  }
}
