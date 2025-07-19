import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userMessage } = await req.json();

  const response = await fetch("https://api.vellum.ai/v1/workflow-executions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VELLUM_API_KEY!}`,
    },
    body: JSON.stringify({
      deploymentId: process.env.VELLUM_DEPLOYMENT!,
      inputs: {
        input_text: userMessage,
      },
    }),
  });

  const result = await response.json();

  return NextResponse.json({
    message: result.outputs?.["final-output"],
  });
}