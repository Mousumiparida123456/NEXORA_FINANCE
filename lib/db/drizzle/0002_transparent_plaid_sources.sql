ALTER TABLE "accounts" ADD COLUMN "data_source" text NOT NULL DEFAULT 'DEMO';
ALTER TABLE "accounts" ADD COLUMN "currency" text NOT NULL DEFAULT 'USD';
ALTER TABLE "plaid_items" ADD COLUMN "environment" text NOT NULL DEFAULT 'sandbox';
ALTER TABLE "transactions" ADD COLUMN "data_source" text NOT NULL DEFAULT 'DEMO';
ALTER TABLE "transactions" ADD COLUMN "currency" text NOT NULL DEFAULT 'USD';
ALTER TABLE "transactions" ADD COLUMN "synced_at" timestamp;

UPDATE "accounts"
SET "data_source" = CASE WHEN "plaid_account_id" IS NULL THEN 'DEMO' ELSE 'PLAID_DEVELOPMENT' END;

UPDATE "transactions" AS tx
SET "data_source" = CASE WHEN tx."plaid_transaction_id" IS NULL THEN 'DEMO' ELSE 'PLAID_DEVELOPMENT' END,
    "synced_at" = CASE WHEN tx."plaid_transaction_id" IS NULL THEN NULL ELSE now() END;

UPDATE "transactions" AS tx
SET "currency" = COALESCE(accounts."currency", 'USD')
FROM "accounts"
WHERE accounts."id" = tx."account_id";

UPDATE "plaid_items" SET "environment" = 'development';

-- Existing access tokens were stored in plaintext and cannot be encrypted without the
-- owner's configured encryption key. Require those connections to be linked again.
UPDATE "plaid_items"
SET "access_token" = 'RELINK_REQUIRED'
WHERE "access_token" NOT LIKE 'enc:v1:%';
