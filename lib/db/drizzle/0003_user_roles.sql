ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'PERSONAL_USER';
--> statement-breakpoint
ALTER TABLE "users"
  DROP CONSTRAINT IF EXISTS "users_email_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "users_email_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_role_unique_idx"
  ON "users" USING btree ("email", "role");
