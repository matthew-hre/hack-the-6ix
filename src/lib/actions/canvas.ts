"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Note } from "~/lib/db/schema";

import { auth } from "~/lib/auth";
import { db } from "~/lib/db";
import { canvas } from "~/lib/db/schema";
import { wsClient } from "~/lib/websocket/client";

export async function getCanvases() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then(m => m.headers()),
  });

  if (!session?.user) {
    redirect("/");
  }

  try {
    const canvases = await db
      .select()
      .from(canvas)
      .where(eq(canvas.userId, session.user.id))
      .orderBy(desc(canvas.updatedAt));

    return canvases;
  }
  catch (error) {
    console.error("Error fetching canvases:", error);
    throw new Error("Failed to fetch canvases");
  }
}

export async function getCanvas(id: string) {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then(m => m.headers()),
  });

  if (!session?.user) {
    redirect("/");
  }

  try {
    const canvasData = await db
      .select()
      .from(canvas)
      .where(and(eq(canvas.id, id), eq(canvas.userId, session.user.id)))
      .limit(1);

    if (canvasData.length === 0) {
      throw new Error("Canvas not found");
    }

    return canvasData[0];
  }
  catch (error) {
    console.error("Error fetching canvas:", error);
    throw new Error("Failed to fetch canvas");
  }
}

export async function createCanvas(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then(m => m.headers()),
  });

  if (!session?.user) {
    redirect("/");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const width = Number.parseInt(formData.get("width") as string) || 3000;
  const height = Number.parseInt(formData.get("height") as string) || 3000;

  if (!name?.trim()) {
    throw new Error("Canvas name is required");
  }

  try {
    const defaultNotes: Note[] = [
      {
        id: 1,
        content: "# Welcome to your canvas!\n\nDouble click to edit this note.",
        position: { x: 65, y: 65 }, // Center of 150x150 grid (3000px/20px grid size)
        size: { width: 20, height: 20 },
        zIndex: 1,
      },
    ];

    const newCanvas = await db
      .insert(canvas)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        width,
        height,
        notes: defaultNotes,
        userId: session.user.id,
      })
      .returning();

    revalidatePath("/dashboard");

    return newCanvas[0];
  }
  catch (error) {
    console.error("Error creating canvas:", error);
    throw new Error("Failed to create canvas");
  }
}

export async function deleteCanvas(id: string) {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then(m => m.headers()),
  });

  if (!session?.user) {
    redirect("/");
  }

  try {
    const deletedCanvas = await db
      .delete(canvas)
      .where(and(eq(canvas.id, id), eq(canvas.userId, session.user.id)))
      .returning();

    if (deletedCanvas.length === 0) {
      throw new Error("Canvas not found");
    }

    revalidatePath("/dashboard");

    return { success: true };
  }
  catch (error) {
    console.error("Error deleting canvas:", error);
    throw new Error("Failed to delete canvas");
  }
}

export async function updateCanvas(
  id: string,
  updates: {
    name?: string;
    description?: string;
    width?: number;
    height?: number;
    notes?: Note[];
  },
) {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then(m => m.headers()),
  });

  if (!session?.user) {
    redirect("/");
  }

  try {
    const updateData: Partial<typeof canvas.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (updates.name !== undefined)
      updateData.name = updates.name;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.width !== undefined)
      updateData.width = updates.width;
    if (updates.height !== undefined)
      updateData.height = updates.height;
    if (updates.notes !== undefined)
      updateData.notes = updates.notes;

    const updatedCanvas = await db
      .update(canvas)
      .set(updateData)
      .where(and(eq(canvas.id, id), eq(canvas.userId, session.user.id)))
      .returning();

    if (updatedCanvas.length === 0) {
      throw new Error("Canvas not found");
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/canvas/${id}`);

    return updatedCanvas[0];
  }
  catch (error) {
    console.error("Error updating canvas:", error);
    throw new Error("Failed to update canvas");
  }
}

export async function updateCanvasNotes(id: string, notes: Note[], clientId?: string) {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then(m => m.headers()),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    const updatedCanvas = await db
      .update(canvas)
      .set({
        notes,
        updatedAt: new Date(),
      })
      .where(and(eq(canvas.id, id), eq(canvas.userId, session.user.id)))
      .returning();

    if (updatedCanvas.length === 0) {
      throw new Error("Canvas not found");
    }

    // Broadcast the update to all connected clients except the sender
    try {
      await wsClient.broadcastNotesUpdate(id, notes, clientId);
    }
    catch (wsError) {
      console.warn("Failed to broadcast WebSocket update:", wsError);
      // Don't fail the database update if WebSocket broadcast fails
    }

    // Don't revalidate the current canvas page to avoid interrupting user experience
    revalidatePath("/dashboard");

    return updatedCanvas[0];
  }
  catch (error) {
    console.error("Error updating canvas notes:", error);
    throw new Error("Failed to update canvas notes");
  }
}
