/* eslint-disable react-dom/no-dangerously-set-innerhtml */
"use client";

import { DoorOpen, GripHorizontal, Menu, Plus, Server, Settings, Trash2, X, ZoomIn, ZoomOut } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { toast } from "sonner";

import type { Note } from "~/lib/db/schema";

import { SpeechControls } from "~/components/speech-controls";
import { Button } from "~/components/ui/button";
import { updateCanvasNotes } from "~/lib/actions/canvas";

const GRID_SIZE = 20;
const CANVAS_SIZE = 3000;

function ZoomControls({ transformRef }: { transformRef: any }) {
  return (
    <div className="absolute top-4 left-4 z-50 flex gap-2">
      <Button
        type="button"
        variant="outline"
        className="bg-background/50 h-10 rounded-full backdrop-blur-md"
        onClick={() => transformRef.current?.zoomIn()}
        title="Zoom in"
      >
        <ZoomIn className="h-5 w-5" />
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => transformRef.current?.zoomOut()}
        className="bg-background/50 h-10 rounded-full backdrop-blur-md"
        title="Zoom out"
      >
        <ZoomOut className="h-5 w-5" />
      </Button>
      <Button
        type="button"
        onClick={() => transformRef.current?.resetTransform()}
        variant="outline"
        className="bg-background/50 h-10 rounded-full backdrop-blur-md"
        title="Reset zoom"
      >
        <span className="text-sm tracking-tight">1:1</span>
      </Button>
    </div>
  );
}

function MenuControls({
  addNewNote,
  addServerNote,
}: {
  addNewNote: () => void;
  addServerNote: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="absolute top-4 right-4 z-50" ref={menuRef}>
      <div className="relative">
        <Button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          variant="outline"
          className="bg-background/50 h-10 rounded-full backdrop-blur-md"
          title="Menu"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {isMenuOpen && (
          <div
            className="text-primary absolute top-12 right-0"
          >
            <div className="flex flex-col space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addServerNote();
                  setIsMenuOpen(false);
                }}
                className="bg-background/50 h-10 rounded-full backdrop-blur-md"
              >
                <Server className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addNewNote();
                  setIsMenuOpen(false);
                }}
                className="bg-background/50 h-10 rounded-full backdrop-blur-md"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addNewNote();
                  setIsMenuOpen(false);
                }}
                className="bg-background/50 h-10 rounded-full backdrop-blur-md"
                asChild
              >
                <Link
                  href="/dashboard"
                  className={`
                    bg-background/50 h-10 rounded-full backdrop-blur-md
                  `}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <DoorOpen />
                </Link>
              </Button>

              <Button
                type="button"
                disabled
                variant="outline"
                className={`
                  bg-background/50 h-10 cursor-not-allowed rounded-full
                  backdrop-blur-md
                `}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function parseMarkdown(markdown: string) {
  const htmlString = markdown
    .replace(/^# (.*$)/gm, "<h1 class=\"text-2xl font-bold mb-2\">$1</h1>")
    .replace(/^## (.*$)/gm, "<h2 class=\"text-xl font-bold mb-2\">$1</h2>")
    .replace(/\*\*(.*)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*)\*/g, "<em>$1</em>")
    .split("\n\n")
    .map((paragraph) => {
      if (paragraph.startsWith("<li")) {
        return `<ul class="list-disc">${paragraph}</ul>`;
      }
      if (!paragraph.startsWith("<h") && !paragraph.startsWith("<ul")) {
        return `<p class="">${paragraph}</p>`;
      }
      return paragraph;
    })
    .join("");

  return { __html: htmlString };
}

export default function Canvas({
  canvasId,
  initialNotes,
  canvasName: _canvasName,
}: {
  canvasId: string;
  initialNotes: Note[];
  canvasName: string;
}) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [maxZIndex, setMaxZIndex] = useState(
    Math.max(...initialNotes.map(n => n.zIndex), 0),
  );
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [currentScale, setCurrentScale] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isPolling, _setIsPolling] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transformRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedNotesRef = useRef<Note[]>(initialNotes);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSave = useCallback(async (notesToSave: Note[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      // only save if notes have actually changed
      if (JSON.stringify(notesToSave) === JSON.stringify(lastSavedNotesRef.current)) {
        return;
      }

      setIsSaving(true);
      try {
        await updateCanvasNotes(canvasId, notesToSave);
        lastSavedNotesRef.current = notesToSave;
        toast.success("Changes saved");
      }
      catch (error) {
        console.error("Failed to save changes:", error);
        toast.error("Failed to save changes. Please try again.");
      }
      finally {
        setIsSaving(false);
      }
    }, 1000); // TODO: Clean this up
  }, [canvasId]);

  useEffect(() => {
    if (notes.length > 0) {
      debouncedSave(notes);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [notes, debouncedSave]);

  const getNextNoteId = () => {
    return Math.max(...notes.map(n => n.id), 0) + 1;
  };

  const startEditing = (id: number) => {
    setEditingNoteId(id);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }, 0);
  };

  const addNewNote = () => {
    const newId = getNextNoteId();
    const newZIndex = maxZIndex + 1;
    setMaxZIndex(newZIndex);

    const newNote: Note = {
      id: newId,
      content: "# New Note\n\nClick to edit...",
      position: {
        x: CANVAS_SIZE / (2 * GRID_SIZE) - 10,
        y: CANVAS_SIZE / (2 * GRID_SIZE) - 10,
      },
      size: { width: 15, height: 10 },
      zIndex: newZIndex,
    };

    setNotes(prev => [...prev, newNote]);
    setTimeout(() => startEditing(newId), 100);
  };

  const deleteNote = (id: number) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    if (editingNoteId === id) {
      setEditingNoteId(null);
    }
  };

  const bringToFront = (id: number) => {
    const newZIndex = maxZIndex + 1;
    setMaxZIndex(newZIndex);
    setNotes(prev => prev.map(note =>
      note.id === id
        ? { ...note, zIndex: newZIndex }
        : note,
    ));
  };

  const handleMouseDown = (e: React.MouseEvent, id: number | null = null) => {
    if (id !== null) {
      e.stopPropagation();
      e.preventDefault();
      const note = notes.find(n => n.id === id);
      if (note) {
        setIsDragging(id);
        setDragOffset({
          x: e.clientX - note.position.x * GRID_SIZE,
          y: e.clientY - note.position.y * GRID_SIZE,
        });
        bringToFront(id);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging !== null) {
      e.stopPropagation();
      e.preventDefault();
      const newX = Math.round((e.clientX - dragOffset.x) / GRID_SIZE);
      const newY = Math.round((e.clientY - dragOffset.y) / GRID_SIZE);
      setNotes(prev => prev.map(note =>
        note.id === isDragging
          ? { ...note, position: { x: newX, y: newY } }
          : note,
      ));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging !== null) {
      e.stopPropagation();
      e.preventDefault();
      setIsDragging(null);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>, id: number) => {
    setNotes(prev => prev.map(note =>
      note.id === id ? { ...note, content: e.target.value } : note,
    ));
  };

  const stopEditing = () => {
    setEditingNoteId(null);
  };

  const checkForUpdates = useCallback(async () => {
    try {
      const response = await fetch(`/api/canvas/${canvasId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const canvasData = await response.json();
        const serverNotes = canvasData.notes;

        if (
          JSON.stringify(serverNotes) !== JSON.stringify(lastSavedNotesRef.current)
          && editingNoteId === null
          && !isSaving
        ) {
          setNotes(serverNotes);
          setMaxZIndex(Math.max(...serverNotes.map((n: Note) => n.zIndex), 0));
          lastSavedNotesRef.current = serverNotes;
          toast.info("Notes updated from server");
        }
      }
    }
    catch (error) {
      console.error("Failed to check for updates:", error);
    }
  }, [canvasId, editingNoteId, isSaving]);

  useEffect(() => {
    if (!isPolling)
      return;

    const startPolling = () => {
      pollingTimeoutRef.current = setTimeout(() => {
        checkForUpdates();
        startPolling();
      }, 1000);
    };

    startPolling();

    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, [checkForUpdates, isPolling]);

  const addServerNote = async () => {
    try {
      const response = await fetch(`/api/canvas/${canvasId}/add-note`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);

        const canvasResponse = await fetch(`/api/canvas/${canvasId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (canvasResponse.ok) {
          const canvasData = await canvasResponse.json();
          const serverNotes = canvasData.notes;
          setNotes(serverNotes);
          setMaxZIndex(Math.max(...serverNotes.map((n: Note) => n.zIndex), 0));
          lastSavedNotesRef.current = serverNotes;
          toast.info("Server note added and canvas updated!");
        }
      }
      else {
        const error = await response.json();
        toast.error(error.error || "Failed to add server note");
      }
    }
    catch (error) {
      console.error("Failed to add server note:", error);
      toast.error("Failed to add server note");
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-100">
      {/* Zoom Controls */}
      <ZoomControls transformRef={transformRef} />

      {/* Menu Controls */}
      <MenuControls
        addNewNote={addNewNote}
        addServerNote={addServerNote}
      />

      {/* Save Status Indicator */}
      {isSaving && (
        <div className="absolute top-4 right-16 z-40">
          <div
            className={`
              flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2
              text-white shadow-lg
            `}
          >
            <div
              className={`
                h-3 w-3 animate-spin rounded-full border-2 border-white
                border-t-transparent
              `}
            />
            <span className="text-sm">Saving...</span>
          </div>
        </div>
      )}

      {/* Speech Recognition Controls */}
      <SpeechControls canvasId={canvasId} />

      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.1}
        maxScale={3}
        centerOnInit={true}
        limitToBounds={true}
        wheel={{ step: 0.5 }}
        pinch={{ step: 50 }}
        doubleClick={{ disabled: true }}
        panning={{
          disabled: isDragging !== null,
          velocityDisabled: true,
        }}
        onTransformed={(ref, state) => {
          setCurrentScale(state.scale);
        }}
      >
        <TransformComponent
          wrapperClass="!w-full !h-full"
          contentClass=""
        >
          <div
            className={`
              relative cursor-grab bg-white select-none
              active:cursor-grabbing
            `}
            style={{
              width: `${CANVAS_SIZE}px`,
              height: `${CANVAS_SIZE}px`,
              backgroundImage: `radial-gradient(circle at ${1 / currentScale}px ${1 / currentScale}px, #ddd ${1 / currentScale}px, transparent ${1 / currentScale}px)`,
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                stopEditing();
              }
            }}
          >
            {notes.map(note => (
              <div
                key={note.id}
                className={`
                  group absolute overflow-hidden border border-zinc-200 bg-white
                  font-mono text-zinc-900 shadow-sm
                  hover:shadow-md
                `}
                style={{
                  left: `${note.position.x * GRID_SIZE}px`,
                  top: `${note.position.y * GRID_SIZE}px`,
                  width: `${note.size.width * GRID_SIZE}px`,
                  height: `${note.size.height * GRID_SIZE}px`,
                  zIndex: note.zIndex,
                }}
                onClick={e => e.stopPropagation()}
              >
                <div
                  className={`
                    flex h-6 items-center justify-between border-b
                    border-zinc-100 bg-gray-50 px-2
                  `}
                >
                  <div
                    className="flex-1 cursor-move"
                    onMouseDown={e => handleMouseDown(e, note.id)}
                    onPointerDown={e => e.stopPropagation()}
                  >
                    <GripHorizontal className="h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteNote(note.id)}
                    className={`
                      opacity-0 transition-opacity
                      group-hover:opacity-100
                      hover:text-red-600
                    `}
                    title="Delete note"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="h-[calc(100%-1.5rem)] p-2">
                  {editingNoteId === note.id
                    ? (
                        <textarea
                          ref={textareaRef}
                          autoFocus
                          className={`
                            h-full w-full resize-none bg-white font-mono text-sm
                            text-zinc-900 outline-none
                          `}
                          value={note.content}
                          onChange={e => handleContentChange(e, note.id)}
                          onBlur={stopEditing}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              stopEditing();
                            }
                          }}
                        />
                      )
                    : (
                        <div
                          className={`
                            markdown-content h-full cursor-text overflow-auto
                            text-sm whitespace-pre-wrap
                          `}
                          onClick={() => startEditing(note.id)}
                          dangerouslySetInnerHTML={parseMarkdown(note.content)}
                        />
                      )}
                </div>
              </div>
            ))}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
