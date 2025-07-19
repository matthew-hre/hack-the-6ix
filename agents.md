# Agent Instructions

## Build/Lint/Test Commands

- Build: `pnpm build`
- Lint: `pnpm lint` (fix: `pnpm lint:fix`)
- Dev: `pnpm dev` (runs db + Next.js with turbopack)
- No test framework configured

## Database Commands

- Start DB: `pnpm run dev:db`
- Generate migrations: `pnpm run db:generate`
- Push schema: `pnpm run db:push`
- DB Studio: `pnpm run db:studio`

## Code Style (ESLint Config)

- Use TypeScript with strict mode
- 2-space indentation, semicolons, double quotes
- Kebab-case filenames (except README.md)
- Type definitions over interfaces (`type` preferred)
- Sort imports with perfectionist
- No console logs (warn level)
- No process.env access (use env.ts)
- Tailwind classes validated

## Project Structure

- Path alias: `~/*` maps to `./src/*`
- UI components ignored by linting: `**/components/ui/**/*`
- Use Better Auth for authentication
- Drizzle ORM with PostgreSQL
