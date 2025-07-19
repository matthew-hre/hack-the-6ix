import { Github } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "~/lib/auth";

import { Button } from "./ui/button";

async function signInWithGithubAction() {
  "use server";

  const { url } = await auth.api.signInSocial({
    headers: await headers(),
    body: {
      provider: "github",
      callbackURL: "/dashboard",
    },
  });

  if (!url) {
    redirect("/signup?error=Failed to sign in with GitHub");
  }

  redirect(url);
}

export default function GithubSigninButton() {
  return (
    <form action={signInWithGithubAction}>
      <Button
        type="submit"
        variant="outline"
      >
        <Github className="mr-2 h-5 w-5" />
        Sign In with Github
      </Button>
    </form>
  );
}
