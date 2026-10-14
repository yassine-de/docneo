import "server-only";

import { z } from "zod";
import { TOKEN_ENCRYPTION_KEY_PATTERN } from "./crypto-core";

const schema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(10),
  GOOGLE_CLIENT_SECRET: z.string().min(10),
  GOOGLE_DRIVE_REDIRECT_URI: z.string().url(),
  TOKEN_ENCRYPTION_KEY: z.string().regex(TOKEN_ENCRYPTION_KEY_PATTERN),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
});

export function getDriveConfig() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) return null;
  return parsed.data;
}

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
