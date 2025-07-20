"use client";

import { redirect } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { createCanvas } from "~/lib/actions/canvas";

type CreateCanvasFormProps = {
  onCanvasCreated?: () => void;
};

async function createCanvasAction(
  prevState: { error?: string } | null,
  formData: FormData,
) {
  try {
    const canvas = await createCanvas(formData);
    return { success: true, canvas };
  }
  catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create canvas",
    };
  }
}

export default function CreateCanvasFormClient({ onCanvasCreated }: CreateCanvasFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createCanvasAction, null);
  const processedStateRef = useRef<{ success?: boolean; error?: string } | null>(null);

  // Handle successful canvas creation and errors with useEffect
  useEffect(() => {
    // Avoid processing the same state multiple times
    if (state === processedStateRef.current)
      return;

    if (state?.success && "canvas" in state) {
      const canvas = state.canvas;
      processedStateRef.current = state;
      setIsOpen(false);
      toast.success(`Canvas "${canvas.name}" created successfully!`);
      onCanvasCreated?.();
      redirect(`/dashboard/canvas/${canvas.id}`);
    }

    if (state?.error) {
      processedStateRef.current = state;
      toast.error(state.error);
    }
  }, [state, onCanvasCreated]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create New Canvas</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Canvas</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Canvas Name *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="My Canvas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                name="width"
                type="number"
                defaultValue={3000}
                min="1000"
                max="10000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (px)</Label>
              <Input
                id="height"
                name="height"
                type="number"
                defaultValue={3000}
                min="1000"
                max="10000"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending}
            >
              {isPending ? "Creating..." : "Create Canvas"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
