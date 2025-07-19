import type { NextRequest } from "next/server";
import type { Vellum } from "vellum-ai";

import { NextResponse } from "next/server";
import { VellumClient } from "vellum-ai";

import env from "~/lib/env.server";

export async function POST(req: NextRequest) {
  try {
    const { userMessage } = await req.json();

    const vellum = new VellumClient({
      apiKey: env.VELLUM_API_KEY!,
    });

    const request: Vellum.ExecuteWorkflowRequest = {
      workflowDeploymentName: "test",
      releaseTag: "LATEST",
      inputs: [
        {
          type: "STRING",
          name: "input_text", // ✅ Match your workflow input node
          value: userMessage,
        },
      ],
    };

    const result = await vellum.executeWorkflow(request); // ✅ Correct call
    console.log("📦 Vellum raw result:", JSON.stringify(result, null, 2));

    if (result.data.state === "REJECTED") {
      throw new Error(result.data.error?.message ?? "Workflow rejected");
    }

    const final = (result.data.outputs.find(
      o => o.name === "final-output",
    ) as { value: any })?.value;
    const output = final;
    return NextResponse.json({ message: output ?? "No output" });
  }
  catch (err) {
    console.error("💥 /api/vellum error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(err) },
      { status: 500 },
    );
  }
}
