import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { getCanvas } from "~/lib/actions/canvas";

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
