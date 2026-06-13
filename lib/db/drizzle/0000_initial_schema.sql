CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "password" text,
  "refresh_token" text,
  "failed_attempts" integer DEFAULT 0,
  "lock_until" timestamp,
  "reset_token" text,
  "reset_token_expires" timestamp,
  "first_name" text,
  "last_name" text,
  "monthly_income" numeric(15, 2) DEFAULT '0.00',
  "profile_image_url" text,
  "financial_goals" text,
  "risk_level" text DEFAULT 'medium',
  "savings_goal" integer DEFAULT 15000,
  "invest_style" text DEFAULT 'balanced',
  "two_factor_enabled" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" USING btree ("email");
CREATE INDEX IF NOT EXISTS "email_idx" ON "users" USING btree ("email");

CREATE TABLE IF NOT EXISTS "accounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "type" text NOT NULL,
  "balance" numeric(15, 2) DEFAULT '0.00' NOT NULL,
  "account_number" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "accounts_account_number_unique" ON "accounts" USING btree ("account_number");
CREATE INDEX IF NOT EXISTS "user_id_idx" ON "accounts" USING btree ("user_id");

CREATE TABLE IF NOT EXISTS "user_preferences" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_preferences_user_id_unique" ON "user_preferences" USING btree ("user_id");

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "account_id" integer NOT NULL,
  "amount" numeric(15, 2) NOT NULL,
  "type" text NOT NULL,
  "description" text,
  "category" text,
  "timestamp" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "account_id_idx" ON "transactions" USING btree ("account_id");
CREATE INDEX IF NOT EXISTS "timestamp_idx" ON "transactions" USING btree ("timestamp");

DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk"
 FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk"
 FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk"
 FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
