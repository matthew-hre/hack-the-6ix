import { headers } from "next/headers";
import Link from "next/link";

import GithubSigninButton from "~/components/github-signin-button";
import { auth } from "~/lib/auth";

export default async function Home() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  return (
    <div className={`
      grid min-h-screen grid-rows-[20px_1fr_20px] items-center
      justify-items-center gap-16 p-8 pb-20 font-sans
      sm:p-20
    `}
    >
      <main className={`
        row-start-2 flex flex-col items-center gap-[32px]
        sm:items-start
      `}
      >
        <GithubSigninButton />
        {session && (
          <Link
            href="/dashboard"
            className={`
              hover:text-muted-foreground
              font-medium underline transition-colors
            `}
          >
            /dashboard
          </Link>
        )}
      </main>
    </div>
  );
}
