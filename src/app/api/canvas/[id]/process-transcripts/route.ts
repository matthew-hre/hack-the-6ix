import type { NextRequest } from "next/server";

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import type { Note } from "~/lib/db/schema";

import { getCanvas, updateCanvasNotes } from "~/lib/actions/canvas";
import { auth } from "~/lib/auth";
import env from "~/lib/env.server";

const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const ClarificationSchema = z.object({
  updates: z.array(z.object({
    id: z.number(),
    content: z.string(),
  })).optional(),
  newNotes: z.array(z.object({
    content: z.string(),
  })).optional(),
});

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

    const prompt = `
    The following data is from "Arachnid", a platform that listens to brainstorming / ideation sessions, and creates a visual mind-map of the topics discussed during the session. This form factor is best described as a "wall of sticky notes". Primarily, this tool is used for software development brainstorming.

Your job is to transform transcripts of these ideation sessions into nicely formatted and structured notes for this mind-map. Additionally, you can update existing notes, only if the update introduces new information. Finally, you can break notes into multiple notes if they are too long or contain multiple ideas.

Your job is NOT to provide solutions or suggestions. You should only use content provided from the transcripts and existing notes to create or update notes. You are a note taker, not a problem solver.

For example, given the following input:

\`\`\`
{
  "transcripts":
[
  {
    "id": "19cb864c-7e72-4683-acf2-29eb9e2e3c5d",
    "text": "yeah I mean like that is a pretty pretty bad problem off the top of my head I think something cool for that would be like a GitHub action that would listen for",
    "timestamp": "2025-07-20 04:06:24.098"
  },
  {
    "id": "1ac31884-7fb9-4fb5-8d35-e8a4c6945974",
    "text": "yeah I mean I was working on this app recently and I was having this problem where everything looked good locally and it passed on my test cases and it deployed correctly on GitHub but then the problem was when I actually deployed on for sale for production it ended up having some issues with like the sharp Library wasn't instantiated correctly and so the problem there was that images were way too computationally expensive because the library wasn't an initialized but I had no idea that this error existed because it didn't show up in my GitHub like PR like normally does with a versatile deployment",
    "timestamp": "2025-07-20 04:06:06.799"
  },
  {
    "id": "e83b68b5-80f4-4d26-86b7-b509f1284b8f",
    "text": "you have any urgent issues that you want to talk about quick",
    "timestamp": "2025-07-20 04:05:13.458"
  },
  {
    "id": "c2303188-dcdd-40bc-ada0-aa7a60a45c0c",
    "text": "all right I think we're just going to spitball some ideas for the hackathon this weekend",
    "timestamp": "2025-07-20 04:05:08.882"
  }
],
  "canvasNotes": [
    {
      "content": "# Problem\n\nWhen deployed to production, the Sharp library wasn’t initialized properly, making image processing too computationally expensive and hiding the error in CI.\n\n\n# Solution\n\n(none yet)",
      "id": 1
    }
  ]
}
\`\`\`

There is a conversation regarding logs in production, and possible ways to mitigate / support this. There is also an existing canvasNote, documenting the problem, but with no solution yet. The desired output for the given example would be:

\`\`\`
{
  "updates":[
    {
      "id":1,
      "content":"# Problem\n\nWhen deployed to production, the Sharp library wasn’t initialized properly, making image processing too computationally expensive and hiding the error in CI.\n\n\n# Solution\n\nA Github Action to monitor logs in production"
    }
  ]
}
\`\`\`

In this case, "updates" contains a single object with both an id and content. If an existing note is to be updated, the object should include an id. If a new note is to be created, it should be included in a "newNotes" array, and no id should be provided.

Markdown is enabled, and headings are encouraged. Notes should be short, informative, and to the point. Avoid long paragraphs or excessive detail. Use headings to structure the content clearly.
`;

    // Send data to GPT-4o for clarification
    const clarification = await generateObject({
      model: openai("gpt-4o"),
      system: "clarify",
      prompt: `${prompt}

---

Transcripts: ${JSON.stringify(transcripts)}
Existing Notes: ${JSON.stringify(updatedNotes)}`,
      schema: ClarificationSchema,
    });

    // Process AI response - handle updates
    if (clarification.object.updates) {
      for (const update of clarification.object.updates) {
        const noteIndex = updatedNotes.findIndex(note => note.id === update.id);
        if (noteIndex !== -1) {
          updatedNotes[noteIndex].content = update.content;
        }
      }
    }

    // Process AI response - handle new notes
    if (clarification.object.newNotes) {
      for (const newNoteData of clarification.object.newNotes) {
        maxId += 1;
        maxZIndex += 1;

        const randomSize = () => Math.floor(Math.random() * 6) + 15; // 15-20 inclusive

        const newNote: Note = {
          id: maxId,
          content: newNoteData.content,
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
    }

    // Only update if we have changes (updates or new notes)
    if ((clarification.object.updates && clarification.object.updates.length > 0)
      || (clarification.object.newNotes && clarification.object.newNotes.length > 0)) {
      await updateCanvasNotes(canvasId, updatedNotes);
    }

    return NextResponse.json({
      success: true,
      createdNotes: newNotes,
      updatedNotes: clarification.object.updates || [],
      message: `Created ${newNotes.length} new notes and updated ${clarification.object.updates?.length || 0} existing notes from transcripts`,
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
