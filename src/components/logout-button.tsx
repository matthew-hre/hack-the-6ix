import { headers } from "next/headers";

import { Button } from "~/components/ui/button";
import { auth } from "~/lib/auth";

async function logoutAction() {
  "use server";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  await auth.api.signOut({
    headers: await headers(),
  });
}

export default async function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline" size="lg">
        Logout
      </Button>
    </form>
  );
}

