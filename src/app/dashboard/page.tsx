import { Calendar, Clock } from "lucide-react";
import Link from "next/link";

import CreateCanvasForm from "~/components/create-canvas-form";
import DeleteCanvasButton from "~/components/delete-canvas-button";
import { Button } from "~/components/ui/button";
import { getCanvases } from "~/lib/actions/canvas";

export default async function Dashboard() {
  const canvases = await getCanvases();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const mostRecentCanvas = canvases[0];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-gray-600">Manage your canvases and projects</p>
          </div>
          <CreateCanvasForm />
        </div>

        {canvases.length === 0
          ? (
              <div className="py-12 text-center">
                <h2 className="mb-2 text-xl font-semibold text-gray-700">No canvases yet</h2>
                <p className="mb-4 text-gray-500">Create your first canvas to get started</p>
                <CreateCanvasForm />
              </div>
            )
          : (
              <div className="space-y-8">
                {/* Quick Access to Most Recent Canvas */}
                {mostRecentCanvas && (
                  <div
                    className={`
                      border-muted-foreground rounded-md border border-dashed
                      bg-white p-6
                    `}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-black" />
                      <h2 className="text-lg font-semibold text-black">Continue Working</h2>
                    </div>
                    <div
                      className="rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{mostRecentCanvas.name}</h3>
                          {mostRecentCanvas.description && (
                            <p className="mt-1 text-sm text-gray-600">{mostRecentCanvas.description}</p>
                          )}
                          <div
                            className={`
                              mt-2 flex items-center gap-4 text-sm text-gray-500
                            `}
                          >
                            <span>
                              {mostRecentCanvas.width}
                              ×
                              {mostRecentCanvas.height}
                              px
                            </span>
                            <span>
                              {mostRecentCanvas.notes.length}
                              {" "}
                              notes
                            </span>
                            <span>
                              Updated
                              {" "}
                              {formatDate(mostRecentCanvas.updatedAt)}
                            </span>
                          </div>
                        </div>
                        <Link href={`/dashboard/canvas/${mostRecentCanvas.id}`}>
                          <Button
                            className={`
                              bg-black text-white
                              hover:bg-gray-900
                            `}
                          >
                            Open Canvas
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* All Canvases */}
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">All Canvases</h2>
                    <span className="text-sm text-gray-500">
                      (
                      {canvases.length}
                      )
                    </span>
                  </div>

                  <div className={`
                    grid gap-4
                    md:grid-cols-2
                    lg:grid-cols-3
                  `}
                  >
                    {canvases.map(canvas => (
                      <div
                        key={canvas.id}
                        className={`
                          rounded-lg border border-gray-200 bg-white p-4
                          transition-shadow
                          hover:shadow-md
                        `}
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`
                              truncate font-semibold text-gray-900
                            `}
                            >
                              {canvas.name}
                            </h3>
                            {canvas.description && (
                              <p className={`
                                mt-1 line-clamp-2 text-sm text-gray-600
                              `}
                              >
                                {canvas.description}
                              </p>
                            )}
                          </div>
                          <DeleteCanvasButton canvasId={canvas.id} canvasName={canvas.name} />
                        </div>

                        <div className="mb-4 space-y-2">
                          <div className={`
                            flex items-center justify-between text-sm
                            text-gray-500
                          `}
                          >
                            <span>
                              Size:
                              {canvas.width}
                              ×
                              {canvas.height}
                              px
                            </span>
                            <span>
                              {canvas.notes.length}
                              {" "}
                              notes
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            Created
                            {" "}
                            {formatDate(canvas.createdAt)}
                          </div>
                          {canvas.updatedAt !== canvas.createdAt && (
                            <div className="text-xs text-gray-400">
                              Updated
                              {" "}
                              {formatDate(canvas.updatedAt)}
                            </div>
                          )}
                        </div>

                        <Link href={`/dashboard/canvas/${canvas.id}`}>
                          <Button className={`
                            w-full bg-gray-100 text-gray-700
                            hover:bg-gray-200
                          `}
                          >
                            Open Canvas
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
      </div>
    </div>
  );
}