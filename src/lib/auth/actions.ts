// lib/auth/actions.ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./config";

export async function signOutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect("/");
}
