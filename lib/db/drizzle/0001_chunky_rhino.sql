CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"balance" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"account_number" text NOT NULL,
	"plaid_account_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_account_number_unique" UNIQUE("account_number"),
	CONSTRAINT "accounts_plaid_account_id_unique" UNIQUE("plaid_account_id")
);
--> statement-breakpoint
CREATE TABLE "plaid_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"access_token" text NOT NULL,
	"item_id" text NOT NULL,
	"sync_cursor" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plaid_items_item_id_unique" UNIQUE("item_id")
);
--> statement-breakpoint
CREATE TABLE "sentinel_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"audit_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"merchant_id" text DEFAULT 'MER-89420' NOT NULL,
	"actor" text DEFAULT 'SENTINEL_AI_ENGINE' NOT NULL,
	"action" text NOT NULL,
	"risk_score" integer NOT NULL,
	"risk_level" text NOT NULL,
	"decision" text NOT NULL,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"model_version" text DEFAULT 'sentinel-fraud-v1' NOT NULL,
	"policy_version" text DEFAULT 'v2.0-policy' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sentinel_audit_logs_audit_id_unique" UNIQUE("audit_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"category" text,
	"plaid_transaction_id" text,
	"pending" boolean DEFAULT false,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_plaid_transaction_id_unique" UNIQUE("plaid_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plaid_items" ADD CONSTRAINT "plaid_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "plaid_items_user_id_idx" ON "plaid_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sentinel_audit_id_idx" ON "sentinel_audit_logs" USING btree ("audit_id");--> statement-breakpoint
CREATE INDEX "sentinel_txn_id_idx" ON "sentinel_audit_logs" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "account_id_idx" ON "transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "timestamp_idx" ON "transactions" USING btree ("timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "user_preferences_user_id_unique" ON "user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_idx" ON "users" USING btree ("email");