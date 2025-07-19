import { getCanvas } from "~/lib/actions/canvas";

import Canvas from "./canvas";

export default async function CanvasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const canvasData = await getCanvas(id);

  return (
    <Canvas
      canvasId={id}
      initialNotes={canvasData.notes}
      canvasName={canvasData.name}
    />
  );
}
