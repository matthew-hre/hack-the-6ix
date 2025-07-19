// src/app/vellum/page.tsx
import VellumChatBox from "~/components/VellumChatBox";

// (optional) keep this route fully dynamic so you always hit your API
export const dynamic = "force-dynamic";

export default function VellumPlaygroundPage() {
  return (
    <main className="flex flex-col items-center gap-6 py-12 px-4">
      <h1 className="text-3xl font-bold">Vellum Workflow Playground</h1>

      <p className="text-gray-600 max-w-xl text-center">
        Type a prompt below, hit <strong>Send</strong>, and watch the response come
        back from your deployed Vellum workflow.
      </p>

      <div className="w-full max-w-2xl">
        <VellumChatBox />
      </div>
    </main>
  );
}
