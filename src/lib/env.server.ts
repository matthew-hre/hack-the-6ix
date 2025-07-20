import { z } from "zod";

import { tryParseEnv } from "./try-parse-env";

const ServerEnvSchema = z.object({
  NODE_ENV: z.string(),
  DATABASE_URL: z.string(),
  POSTGRES_DB: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_PORT: z.string(),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.string(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  WS_PORT: z.string(),
  WS_HOST: z.string(),
  VELLUM_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string(),
});

export type ServerEnvSchema = z.infer<typeof ServerEnvSchema>;

tryParseEnv(ServerEnvSchema);

// eslint-disable-next-line node/no-process-env
export default ServerEnvSchema.parse(process.env);
