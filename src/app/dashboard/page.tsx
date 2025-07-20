import Link from "next/link";

import CreateCanvasForm from "~/components/create-canvas-form";
import DeleteCanvasButton from "~/components/delete-canvas-button";
import LogoutButton from "~/components/logout-button";
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
    <div className="bg-muted min-h-screen p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className={`
              text-foreground font-heal-the-web-b text-4xl font-bold
            `}
            >
              Dashboard
            </h1>
            <p className={`
              text-muted-foreground font-heal-the-web-a mt-1 text-lg
            `}
            >
              Manage your canvases and projects
            </p>
          </div>
          <div className="flex flex-row gap-4">
            <CreateCanvasForm />
            <LogoutButton />
          </div>
        </div>

        {canvases.length === 0
          ? (
              <div className={`
                border-muted-foreground border border-dashed py-12 text-center
              `}
              >
                <h2 className={`
                  text-foreground font-heal-the-web-a mb-2 text-2xl
                  font-semibold
                `}
                >
                  No canvases yet
                </h2>
                <p className="mb-4 text-gray-500">Create your first canvas to get started</p>
                <CreateCanvasForm />
              </div>
            )
          : (
              <div className="space-y-8">
                {mostRecentCanvas && (
                  <div
                    className={`
                      border-muted-foreground bg-background border border-dashed
                      p-6
                    `}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <h2 className={`
                        text-foreground font-heal-the-web-a text-lg
                        font-semibold
                      `}
                      >
                        Continue Working
                      </h2>
                    </div>
                    <div
                      className="p-4"
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

                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <h2 className={`
                      text-foreground font-heal-the-web-a text-lg font-semibold
                    `}
                    >
                      All Canvases
                    </h2>
                    <span className="text-muted-foreground text-sm">
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
                          border-muted-foreground bg-background border
                          border-dashed p-4 transition-shadow
                          hover:shadow-md
                        `}
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`
                              text-foreground truncate font-semibold
                            `}
                            >
                              {canvas.name}
                            </h3>
                            {canvas.description && (
                              <p className={`
                                text-muted-foreground mt-1 line-clamp-2 text-sm
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
                            text-muted-foreground flex items-center
                            justify-between text-sm
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
                          <div className="text-muted-foreground text-xs">
                            Created
                            {" "}
                            {formatDate(canvas.createdAt)}
                          </div>
                          {canvas.updatedAt !== canvas.createdAt && (
                            <div className="text-muted-foreground text-xs">
                              Updated
                              {" "}
                              {formatDate(canvas.updatedAt)}
                            </div>
                          )}
                        </div>

                        <Link href={`/dashboard/canvas/${canvas.id}`}>
                          <Button
                            size="lg"
                            variant="secondary"
                            className="w-full"
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
