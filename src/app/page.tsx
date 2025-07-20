import { headers } from "next/headers";
import Link from "next/link";

import GithubSigninButton from "~/components/github-signin-button";
import { Button } from "~/components/ui/button";
import { auth } from "~/lib/auth";

export default async function Home() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  return (
    <div className="bg-background relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g stroke="#131313" strokeWidth="1" opacity="0.6">
            <line x1="400" y1="300" x2="400" y2="0" />
            <line x1="400" y1="300" x2="700" y2="100" />
            <line x1="400" y1="300" x2="800" y2="300" />
            <line x1="400" y1="300" x2="700" y2="500" />
            <line x1="400" y1="300" x2="400" y2="600" />
            <line x1="400" y1="300" x2="100" y2="500" />
            <line x1="400" y1="300" x2="0" y2="300" />
            <line x1="400" y1="300" x2="100" y2="100" />
          </g>

          <g stroke="#131313" strokeWidth="0.8" fill="none" opacity="0.4">
            <circle cx="400" cy="300" r="80" />
            <circle cx="400" cy="300" r="140" />
            <circle cx="400" cy="300" r="200" />
            <circle cx="400" cy="300" r="260" />
          </g>

          <g stroke="#131313" strokeWidth="0.6" opacity="0.3">
            <path d="M 400 220 Q 450 240 480 220 Q 500 200 520 180" />
            <path d="M 480 220 Q 520 250 540 280 Q 560 300 580 320" />
            <path d="M 540 280 Q 520 330 500 360 Q 480 380 460 400" />
            <path d="M 500 360 Q 450 380 420 380 Q 400 380 380 380" />
            <path d="M 420 380 Q 380 360 340 340 Q 320 320 300 300" />
            <path d="M 340 340 Q 320 290 320 260 Q 320 240 320 220" />
            <path d="M 320 260 Q 350 230 380 220 Q 390 215 400 220" />
          </g>

          <g stroke="#131313" strokeWidth="0.4" opacity="0.2">
            <polygon points="380,280 420,280 410,320 390,320" />
            <polygon points="360,260 380,240 400,260 380,280" />
            <polygon points="420,260 440,240 460,260 440,280" />
            <polygon points="380,320 400,340 420,320 400,300" />
          </g>
        </svg>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <main className="flex flex-1 items-center justify-center">
          <div className="container mx-auto max-w-2xl px-6 text-center">
            <h1 className={`
              font-heal-the-web-b mt-24 text-6xl font-bold tracking-tight
              md:text-8xl
            `}
            >
              ARACHNID
            </h1>
            <p className={`
              text-muted-foreground font-heal-the-web-a mb-4 text-lg
            `}
            >
              Weave mindmaps with nothing but your voice.
            </p>
            {session
              ? (
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                  >
                    <Link href="/dashboard" className="btn btn-primary">
                      Go to Dashboard
                    </Link>
                  </Button>
                )
              : (
                  <GithubSigninButton />
                )}
          </div>
        </main>

        <footer className="pb-8">
          <div className="container mx-auto px-6 text-center">
            <div className="bg-foreground mx-auto mb-4 h-0.5 w-16 opacity-40"></div>
            <p className="text-muted-foreground font-mono text-sm">Created in 36 hours for Hack the 6ix 2025.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
