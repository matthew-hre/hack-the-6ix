import VellumChatBox from "~/components/VellumChatBox";
import MattInitBanner from "~/components/matt-init-banner";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "~/lib/auth";
import { db } from "~/lib/db";
import { user } from "~/lib/db/schema";

async function signOut() {
  "use server";

  const headersList = await headers();

  await auth.api.signOut({
    headers: headersList,
  });

  redirect("/");
}

export default async function DashboardPage() {
  const headersList = await headers();

  const session = (await auth.api.getSession({
    headers: headersList,
  }))!;

  const userCount = await db.$count(user);

  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-start px-6 py-12 space-y-10">
      <MattInitBanner />

      <p className="font-sans text-lg">
        Hey <span className="font-bold">{session.user.name}</span>! This is a
        protected route, meaning authentication is working!
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <p className="bg-foreground text-background flex h-10 items-center justify-center gap-2 rounded-full border border-solid border-transparent px-4 text-sm font-medium transition-colors sm:h-12 sm:w-auto sm:px-5 sm:text-base">
          There are currently{" "}
          <span className="font-bold">{userCount}</span> users in the database.
        </p>

        <button
          type="button"
          onClick={signOut}
          className="flex h-10 w-full cursor-pointer items-center justify-center rounded-full border border-solid border-black/[.08] px-4 text-sm font-medium transition-colors hover:border-transparent hover:bg-[#f2f2f2] sm:h-12 sm:w-auto sm:px-5 sm:text-base md:w-[172px] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        >
          Sign Out
        </button>
      </div>

      {/* 🧠 VellumChatBox section */}
      <div className="w-full max-w-2xl mt-6">
        <h2 className="text-xl font-semibold mb-4 text-center">Ask the AI Assistant</h2>
        <VellumChatBox />
      </div>
    </div>
  );
}
