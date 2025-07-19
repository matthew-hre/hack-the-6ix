"use client";

import { Trash2 } from "lucide-react";
import { useActionState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { deleteCanvas } from "~/lib/actions/canvas";

type DeleteCanvasButtonProps = {
  canvasId: string;
  canvasName: string;
};

async function deleteCanvasAction(
  prevState: { error?: string } | null,
  formData: FormData,
) {
  try {
    const canvasId = formData.get("canvasId") as string;
    await deleteCanvas(canvasId);
    return { success: true };
  }
  catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete canvas",
    };
  }
}

export default function DeleteCanvasButton({ canvasId, canvasName }: DeleteCanvasButtonProps) {
  const [state, formAction, isPending] = useActionState(deleteCanvasAction, null);

  // Handle successful deletion
  if (state?.success) {
    toast.success("Canvas deleted successfully");
  }

  // Handle error
  if (state?.error) {
    toast.error(state.error);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className={`
            rounded p-1 text-red-500 transition-colors
            hover:bg-red-50 hover:text-red-700
          `}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Canvas</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "
            {canvasName}
            "? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <form action={formAction} style={{ display: "inline" }}>
            <input type="hidden" name="canvasId" value={canvasId} />
            <AlertDialogAction
              type="submit"
              className={`
                bg-red-600
                hover:bg-red-700
              `}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
