"use client";

import { useTransition } from "react";
import { Button } from "~/components/ui/button";
import { signOutAction } from "~/lib/auth/actions";

type SignOutButtonProps = {
  idleText?: string;
  pendingText?: string;
};

export default function SignOutButton({
  idleText = "Sign Out",
  pendingText = "Signing Out...",
}: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      onClick={() => startTransition(() => signOutAction())}
      disabled={isPending}
    >
      {isPending ? pendingText : idleText}
    </Button>
  );
}
