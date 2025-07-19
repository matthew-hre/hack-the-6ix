import { z } from "zod";

const ClientEnvSchema = z.object({
  NODE_ENV: z.string(),
  WS_PORT: z.string(),
  WS_HOST: z.string(),
});

export type ClientEnvSchema = z.infer<typeof ClientEnvSchema>;

// For client-side, get values from NEXT_PUBLIC_ prefixed env vars or use defaults
/* eslint-disable node/no-process-env */
const clientEnv = {
  NODE_ENV: process.env.NODE_ENV || "development",
  WS_PORT: process.env.NEXT_PUBLIC_WS_PORT || "8080",
  WS_HOST: process.env.NEXT_PUBLIC_WS_HOST || "localhost",
};
/* eslint-enable node/no-process-env */

export default ClientEnvSchema.parse(clientEnv);
