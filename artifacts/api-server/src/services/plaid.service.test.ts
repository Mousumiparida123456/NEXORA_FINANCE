import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { Transaction as PlaidTransaction } from "plaid";
import { resolveFinanceDataMode } from "./finance-data-source";
import {
  applyPlaidTransactionChanges,
  decryptAccessToken,
  encryptAccessToken,
  exchangePlaidTokenAndSync,
  getPlaidDataSource,
  getPlaidEnvironment,
  mapPlaidApiError,
  PlaidService,
  type PlaidTransactionStore,
} from "./plaid.service";

const savedEnv = {
  clientId: process.env.PLAID_CLIENT_ID,
  secret: process.env.PLAID_SECRET,
  environment: process.env.PLAID_ENV,
  encryptionKey: process.env.PLAID_TOKEN_ENCRYPTION_KEY,
};

afterEach(() => {
  if (savedEnv.clientId === undefined) delete process.env.PLAID_CLIENT_ID;
  else process.env.PLAID_CLIENT_ID = savedEnv.clientId;
  if (savedEnv.secret === undefined) delete process.env.PLAID_SECRET;
  else process.env.PLAID_SECRET = savedEnv.secret;
  if (savedEnv.environment === undefined) delete process.env.PLAID_ENV;
  else process.env.PLAID_ENV = savedEnv.environment;
  if (savedEnv.encryptionKey === undefined) delete process.env.PLAID_TOKEN_ENCRYPTION_KEY;
  else process.env.PLAID_TOKEN_ENCRYPTION_KEY = savedEnv.encryptionKey;
});

function plaidTransaction(overrides: Record<string, unknown> = {}) {
  return {
    account_id: "account-1",
    transaction_id: "transaction-1",
    amount: 12.5,
    date: "2026-10-03",
    datetime: null,
    name: "Coffee Shop",
    merchant_name: "Coffee Shop",
    category: ["Food and Drink"],
    personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_COFFEE" },
    pending: false,
    ...overrides,
  } as PlaidTransaction;
}

function fakeStore() {
  const rows = new Map<string, { localId: number; values: Record<string, unknown> }>();
  let nextId = 1;
  const store: PlaidTransactionStore = {
    async promotePending(pendingId, accountId, values) {
      const pending = rows.get(pendingId);
      if (!pending || pending.values.accountId !== accountId) return false;
      rows.delete(pendingId);
      rows.set(values.plaidTransactionId, { localId: pending.localId, values });
      return true;
    },
    async upsert(values) {
      const id = values.plaidTransactionId;
      const existing = rows.get(id);
      rows.set(id, { localId: existing?.localId ?? nextId++, values });
    },
    async remove(id) {
      rows.delete(id);
    },
  };
  return { rows, store };
}

describe("Plaid environment and token exchange", () => {
  it("keeps Demo and Connected data paths explicitly separate", () => {
    assert.equal(resolveFinanceDataMode("DEMO"), "DEMO");
    assert.equal(resolveFinanceDataMode(undefined), "CONNECTED");
  });

  it("defaults safely to Sandbox and reports the distinct supported environments", () => {
    delete process.env.PLAID_ENV;
    assert.equal(getPlaidEnvironment(undefined), "sandbox");
    assert.equal(getPlaidEnvironment("development"), "development");
    assert.equal(getPlaidEnvironment("production"), "production");
    assert.equal(getPlaidDataSource("sandbox"), "PLAID_SANDBOX");
    assert.equal(getPlaidDataSource("development"), "PLAID_DEVELOPMENT");
    assert.equal(getPlaidDataSource("production"), "PLAID_PRODUCTION");
  });

  it("returns a clear error when Plaid credentials are missing", async () => {
    delete process.env.PLAID_CLIENT_ID;
    delete process.env.PLAID_SECRET;
    await assert.rejects(
      PlaidService.createLinkToken(7),
      /Bank connection unavailable\. Demo Mode can be used for testing\./,
    );
  });

  it("maps invalid access tokens and upstream failures to useful messages", () => {
    assert.match(
      mapPlaidApiError({ response: { data: { error_code: "ITEM_LOGIN_REQUIRED" } } }).message,
      /needs attention/,
    );
    assert.match(
      mapPlaidApiError(new Error("opaque upstream details")).message,
      /Plaid is temporarily unavailable/,
    );
  });

  it("encrypts access tokens at rest and rejects malformed encryption keys", () => {
    process.env.PLAID_TOKEN_ENCRYPTION_KEY = "a".repeat(64);
    const encrypted = encryptAccessToken("sandbox-access-secret");
    assert.match(encrypted, /^enc:v1:/);
    assert.equal(encrypted.includes("sandbox-access-secret"), false);
    assert.equal(decryptAccessToken(encrypted), "sandbox-access-secret");
    process.env.PLAID_TOKEN_ENCRYPTION_KEY = "not-a-key";
    assert.throws(encryptAccessToken.bind(null, "sandbox-access-secret"), /64-character hex/);
  });

  it("exchanges the public token, persists the access token privately, and syncs", async () => {
    const calls: string[] = [];
    const result = await exchangePlaidTokenAndSync(
      "public-sandbox-token",
      7,
      async (token) => {
        assert.equal(token, "public-sandbox-token");
        calls.push("exchange");
        return { accessToken: "private-access-token", itemId: "item-7" };
      },
      async ({ accessToken, itemId, userId }) => {
        assert.equal(accessToken, "private-access-token");
        assert.equal(itemId, "item-7");
        assert.equal(userId, 7);
        calls.push("persist");
      },
      async (itemId, userId) => {
        assert.equal(itemId, "item-7");
        assert.equal(userId, 7);
        calls.push("sync");
        return { added: 2 };
      },
    );
    assert.deepEqual(calls, ["exchange", "persist", "sync"]);
    assert.deepEqual(result, { itemId: "item-7", sync: { added: 2 } });
    assert.equal(JSON.stringify(result).includes("private-access-token"), false);
  });

  it("does not persist or sync when Plaid token exchange fails", async () => {
    let saved = false;
    let synced = false;
    await assert.rejects(
      exchangePlaidTokenAndSync(
        "invalid-public-token",
        7,
        async () => { throw new Error("Plaid API failure"); },
        async () => { saved = true; },
        async () => { synced = true; },
      ),
      /Plaid API failure/,
    );
    assert.equal(saved, false);
    assert.equal(synced, false);
  });
});

describe("Plaid transaction synchronization", () => {
  it("upserts repeated transactions instead of creating duplicates", async () => {
    const { rows, store } = fakeStore();
    const added = [plaidTransaction()];
    await applyPlaidTransactionChanges(
      added, [], [], new Map([["account-1", 19]]), new Map([["account-1", "USD"]]),
      "PLAID_SANDBOX", new Date(), store,
    );
    await applyPlaidTransactionChanges(
      added, [], [], new Map([["account-1", 19]]), new Map([["account-1", "USD"]]),
      "PLAID_SANDBOX", new Date(), store,
    );
    assert.equal(rows.size, 1);
    assert.equal(rows.has("transaction-1"), true);
    assert.deepEqual(
      {
        amount: rows.get("transaction-1")?.values.amount,
        type: rows.get("transaction-1")?.values.type,
        dataSource: rows.get("transaction-1")?.values.dataSource,
        currency: rows.get("transaction-1")?.values.currency,
      },
      {
        amount: "12.50",
        type: "expense",
        dataSource: "PLAID_SANDBOX",
        currency: "USD",
      },
    );
  });

  it("promotes pending transactions to posted while preserving their local ID", async () => {
    const { rows, store } = fakeStore();
    await applyPlaidTransactionChanges(
      [plaidTransaction({ transaction_id: "pending-id", pending: true })],
      [],
      [],
      new Map([["account-1", 19]]),
      new Map([["account-1", "USD"]]),
      "PLAID_SANDBOX",
      new Date(),
      store,
    );
    const originalId = rows.get("pending-id")?.localId;
    await applyPlaidTransactionChanges(
      [plaidTransaction({
        transaction_id: "posted-id",
        pending: false,
        pending_transaction_id: "pending-id",
      })],
      [],
      [{ transaction_id: "pending-id" }],
      new Map([["account-1", 19]]),
      new Map([["account-1", "USD"]]),
      "PLAID_SANDBOX",
      new Date(),
      store,
    );
    assert.equal(rows.size, 1);
    assert.equal(rows.has("pending-id"), false);
    assert.equal(rows.get("posted-id")?.localId, originalId);
    assert.equal(rows.get("posted-id")?.values.pending, false);
  });

  it("handles an empty Plaid response without inserting synthetic data", async () => {
    const { rows, store } = fakeStore();
    const result = await applyPlaidTransactionChanges(
      [], [], [], new Map(), new Map(), "PLAID_SANDBOX", new Date(), store,
    );
    assert.deepEqual(result, { added: 0, modified: 0, removed: 0, empty: true });
    assert.equal(rows.size, 0);
  });
});
