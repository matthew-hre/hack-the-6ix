"use client";

import { Eye, EyeOff, Mic, MicOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { toast } from "sonner";

import type { Note } from "~/lib/db/schema";

import { Button } from "~/components/ui/button";

type SpeechControlsProps = {
  canvasId: string;
  currentNotes?: Note[];
};

type SpeechLine = {
  id: string;
  text: string;
  timestamp: number;
};

const SPEECH_TIMEOUT_MS = 1500; // 1.5 seconds

export function SpeechControls({ canvasId, currentNotes }: SpeechControlsProps) {
  const [speechLines, setSpeechLines] = useState<SpeechLine[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const lastTranscriptRef = useRef("");
  const logTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTranscriptRef = useRef<HTMLDivElement>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const logSpeechToServer = useCallback(async (text: string) => {
    try {
      const response = await fetch(`/api/canvas/${canvasId}/speech-log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to log speech:", error);
        toast.error("Failed to log speech to server");
      }
    }
    catch (error) {
      console.error("Error logging speech:", error);
      toast.error("Failed to log speech to server");
    }
  }, [canvasId]);

  const processTranscriptsToNotes = useCallback(async (transcripts: SpeechLine[]) => {
    if (transcripts.length === 0) {
      return;
    }

    try {
      const response = await fetch(`/api/canvas/${canvasId}/process-transcripts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcripts,
          currentNotes: currentNotes || [],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.createdNotes && result.createdNotes.length > 0) {
          toast.success(`Created ${result.createdNotes.length} notes from speech`);
        }
      }
      else {
        const error = await response.json();
        console.error("Failed to process transcripts:", error);
      }
    }
    catch (error) {
      console.error("Failed to process transcripts:", error);
    }
  }, [canvasId, currentNotes]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // this is bad. need it to dodge hydration mismatch
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setIsMounted(true);
    }
  }, []);

  const addSpeechLine = useCallback((text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    setSpeechLines((prev) => {
      // check if this text is already in the recent speech lines to prevent duplicates.
      // this is *not* the best way to do this, but it works for now
      const isDuplicate = prev.some(line =>
        line.text.toLowerCase() === trimmedText.toLowerCase()
        && Date.now() - line.timestamp < 3000,
      );

      if (isDuplicate) {
        return prev;
      }

      const newLine: SpeechLine = {
        id: `${Date.now()}-${Math.random()}`,
        text: trimmedText,
        timestamp: Date.now(),
      };

      const newLines = [...prev, newLine];

      setTimeout(() => {
        processTranscriptsToNotes(newLines);
      }, 100);

      return newLines;
    });

    logSpeechToServer(trimmedText);
  }, [logSpeechToServer, processTranscriptsToNotes]);

  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;

      if (logTimeoutRef.current) {
        clearTimeout(logTimeoutRef.current);
      }

      logTimeoutRef.current = setTimeout(() => {
        if (transcript.trim()) {
          addSpeechLine(transcript);
          resetTranscript();
        }
      }, SPEECH_TIMEOUT_MS);
    }
  }, [transcript, addSpeechLine, resetTranscript]);

  useEffect(() => {
    return () => {
      if (logTimeoutRef.current) {
        clearTimeout(logTimeoutRef.current);
      }
    };
  }, []);

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();

      if (transcript.trim()) {
        addSpeechLine(transcript);
        resetTranscript();
      }
    }
    else {
      SpeechRecognition.startListening({
        continuous: true,
        language: "en-US",
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // don't render anything until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="absolute right-4 bottom-4 z-50">
        <div className="flex gap-2">
          <div className={`
            bg-background/50 h-12 w-12 rounded-full backdrop-blur-md
          `}
          />
          <div className={`
            bg-background/50 h-12 w-12 rounded-full backdrop-blur-md
          `}
          />
        </div>
      </div>
    );
  }

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="absolute right-4 bottom-4 z-50">
        <div className={`
          rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-sm
          text-red-700
        `}
        >
          Speech recognition not supported in this browser
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-4 bottom-4 z-50">
      {speechLines.length > 0 && !isMuted && (
        <div className="absolute right-0 bottom-20 mb-4 w-96 max-w-none">
          <div className="space-y-1">
            {speechLines.map((line, index) => {
              const distanceFromBottom = speechLines.length - 1 - index;
              const currentTranscriptHeight = listening && transcript && currentTranscriptRef.current
                ? currentTranscriptRef.current.offsetHeight + 8
                : 0;
              const baseSpacing = 16;
              const pushUpOffset = currentTranscriptHeight + (distanceFromBottom * baseSpacing);

              const opacities = [100, 50, 25];
              const opacity = opacities[distanceFromBottom] ?? 10;
              const backgroundOpacityClassname = `bg-background/${opacity}`;
              const foregroundOpacityClassname = `text-foreground/${opacity}`;

              return (
                <div
                  key={line.id}
                  className={`
                    ${backgroundOpacityClassname}
                    ${foregroundOpacityClassname}
                    border-border rounded-lg border p-3 text-sm leading-relaxed
                    shadow-lg backdrop-blur-md transition-all duration-300
                    ease-out
                  `}
                  style={{
                    transform: `translateY(-${pushUpOffset}px)`,
                  }}
                >
                  {line.text}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {listening && transcript && !isMuted && (
        <div className="absolute right-0 bottom-20 mb-2 w-96 max-w-none">
          <div
            ref={currentTranscriptRef}
            className={`
              rounded-lg border border-blue-300 bg-blue-100/95 p-3 shadow-lg
              backdrop-blur-md transition-all duration-300 ease-out
            `}
          >
            <div className="text-sm leading-relaxed text-blue-900">
              <span className="mb-1 block text-xs font-medium text-blue-600">Listening...</span>
              {transcript}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={toggleMute}
          className={`
            h-12 w-12 rounded-full backdrop-blur-md transition-all
            ${isMuted
      ? `
        bg-gray-500/50
        hover:bg-gray-500/70
      `
      : `
        bg-background/50
        hover:bg-background/70
      `
    }
          `}
          title={isMuted ? "Show speech text" : "Hide speech text"}
        >
          {isMuted
            ? (
                <EyeOff className="h-5 w-5" />
              )
            : (
                <Eye className="h-5 w-5" />
              )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={toggleListening}
          className={`
            h-12 w-12 rounded-full backdrop-blur-md transition-all
            ${listening
      ? `
        border-red-500 bg-red-500/70 text-white
        hover:bg-red-500/80
      `
      : `
        bg-background/50
        hover:bg-background/70
      `
    }
          `}
          title={listening ? "Stop listening" : "Start listening"}
        >
          {listening
            ? (
                <Mic className="h-5 w-5" />
              )
            : (
                <MicOff className="h-5 w-5" />
              )}
        </Button>
      </div>
    </div>
  );
}
