import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { auth } from "~/lib/auth";
import { db } from "~/lib/db";
import { speechLog } from "~/lib/db/schema";

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
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 },
      );
    }

    const newSpeechLog = await db
      .insert(speechLog)
      .values({
        text: text.trim(),
        canvasId,
        userId: session.user.id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      log: newSpeechLog[0],
    });
  }
  catch (error) {
    console.error("Error logging speech:", error);
    return NextResponse.json(
      { error: "Failed to log speech" },
      { status: 500 },
    );
  }
}
