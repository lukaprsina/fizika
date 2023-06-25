import { z } from "zod";

// [origin]/api/auth/callback/[provider]
export const serverScheme = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_ID_GITHUB: z.string(),
  CLIENT_SECRET_GITHUB: z.string(),
  CLIENT_ID_DISCORD: z.string(),
  CLIENT_SECRET_DISCORD: z.string(),
  CLIENT_ID_GOOGLE: z.string(),
  CLIENT_SECRET_GOOGLE: z.string(),
  CLIENT_ID_MICROSOFT: z.string(),
  CLIENT_SECRET_MICROSOFT: z.string(),
  AUTH_SECRET: z.string(),
  AUTH_TRUST_HOST: z.string().optional(),
  AUTH_URL: z.string().optional(),
  DATABASE_URL: z.string(),
});

export const clientScheme = z.object({
  MODE: z.enum(['development', 'production', 'test']).default('development'),
});
