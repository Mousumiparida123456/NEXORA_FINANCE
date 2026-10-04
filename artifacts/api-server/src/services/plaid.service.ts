import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
  type Transaction as PlaidTransaction,
} from "plaid";
import { and, db, eq, accounts, plaidItems, transactions } from "../db";

export type PlaidEnvironment = "sandbox" | "development" | "production";
export type TransactionDataSource =
  | "PLAID_SANDBOX"
  | "PLAID_DEVELOPMENT"
  | "PLAID_PRODUCTION";

const PLAID_UNAVAILABLE =
  "Bank connection unavailable. Demo Mode can be used for testing.";

export class PlaidServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 502,
  ) {
    super(message);
    this.name = "PlaidServiceError";
  }
}

export function getPlaidEnvironment(value = process.env.PLAID_ENV): PlaidEnvironment {
  const environment = (value || "sandbox").toLowerCase();
  if (
    environment !== "sandbox" &&
    environment !== "development" &&
    environment !== "production"
  ) {
    throw new PlaidServiceError(
      "PLAID_ENV must be sandbox, development, or production.",
      500,
    );
  }
  return environment;
}

export function getPlaidDataSource(environment: PlaidEnvironment): TransactionDataSource {
  if (environment === "production") return "PLAID_PRODUCTION";
  if (environment === "development") return "PLAID_DEVELOPMENT";
  return "PLAID_SANDBOX";
}

function getTokenEncryptionKey(): Buffer {
  const value = process.env.PLAID_TOKEN_ENCRYPTION_KEY;
  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new PlaidServiceError(
      "Bank connection unavailable. Configure a 64-character hex PLAID_TOKEN_ENCRYPTION_KEY. Demo Mode can be used for testing.",
      503,
    );
  }
  return Buffer.from(value, "hex");
}

export function encryptAccessToken(accessToken: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getTokenEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(accessToken, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptAccessToken(encryptedToken: string): string {
  if (!encryptedToken.startsWith("enc:v1:")) {
    throw new PlaidServiceError(
      "This bank connection must be linked again to protect its credentials.",
      409,
    );
  }
  const [, , ivHex, tagHex, ciphertextHex] = encryptedToken.split(":");
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getTokenEncryptionKey(),
      Buffer.from(ivHex, "hex"),
    );
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextHex, "hex")),
      decipher.final(),
    ]).toString("utf8");
  } catch (error) {
    if (error instanceof PlaidServiceError) throw error;
    throw new PlaidServiceError(
      "Unable to unlock the saved bank connection. Check PLAID_TOKEN_ENCRYPTION_KEY.",
      503,
    );
  }
}

export function mapPlaidApiError(error: unknown): PlaidServiceError {
  const plaidCode = (error as any)?.response?.data?.error_code;
  if (
    plaidCode === "ITEM_LOGIN_REQUIRED" ||
    plaidCode === "INVALID_ACCESS_TOKEN" ||
    plaidCode === "ITEM_NOT_FOUND"
  ) {
    return new PlaidServiceError(
      "Your bank connection needs attention. Reconnect your account to continue syncing.",
      409,
    );
  }
  if (plaidCode === "INVALID_PUBLIC_TOKEN") {
    return new PlaidServiceError(
      "Plaid could not verify the Link token. Reopen bank linking and try again.",
      400,
    );
  }
  if ((error as any)?.response?.status === 401) {
    return new PlaidServiceError(
      "Plaid rejected the configured credentials. Check PLAID_CLIENT_ID and PLAID_SECRET.",
      503,
    );
  }
  return new PlaidServiceError(
    "Plaid is temporarily unavailable. Please try again.",
    502,
  );
}

function getPlaidClient(
  configuredEnvironment?: PlaidEnvironment,
): { client: PlaidApi; environment: PlaidEnvironment } {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!clientId || !secret) {
    throw new PlaidServiceError(PLAID_UNAVAILABLE, 503);
  }

  const environment = configuredEnvironment || getPlaidEnvironment();
  const countries = (process.env.PLAID_COUNTRY_CODES || "US")
    .split(",")
    .map((country) => country.trim().toUpperCase())
    .filter(Boolean);
  const supportedCountries = new Set(Object.values(CountryCode));
  if (!countries.length || countries.some((country) => !supportedCountries.has(country as CountryCode))) {
    throw new PlaidServiceError(
      "PLAID_COUNTRY_CODES must contain valid comma-separated Plaid country codes.",
      500,
    );
  }

  return {
    environment,
    client: new PlaidApi(
      new Configuration({
        basePath: PlaidEnvironments[environment],
        baseOptions: {
          headers: {
            "PLAID-CLIENT-ID": clientId,
            "PLAID-SECRET": secret,
          },
        },
      }),
    ),
  };
}

function toTransactionValues(
  transaction: PlaidTransaction,
  accountId: number,
  dataSource: TransactionDataSource,
  syncedAt: Date,
  accountCurrency: string,
) {
  const expense = transaction.amount > 0;
  return {
    accountId,
    amount: Math.abs(transaction.amount).toFixed(2),
    type: expense ? "expense" : "income",
    description: transaction.merchant_name || transaction.name,
    category:
      transaction.personal_finance_category?.primary ||
      transaction.category?.[0] ||
      "Other",
    plaidTransactionId: transaction.transaction_id,
    pending: transaction.pending,
    dataSource,
    currency:
      transaction.iso_currency_code ||
      transaction.unofficial_currency_code ||
      accountCurrency,
    timestamp: transaction.datetime
      ? new Date(transaction.datetime)
      : new Date(`${transaction.date}T00:00:00.000Z`),
    syncedAt,
  };
}

export interface PlaidTransactionStore {
  promotePending(
    pendingTransactionId: string,
    accountId: number,
    values: ReturnType<typeof toTransactionValues>,
  ): Promise<boolean>;
  upsert(values: ReturnType<typeof toTransactionValues>): Promise<void>;
  remove(transactionId: string): Promise<void>;
}

export async function applyPlaidTransactionChanges(
  added: PlaidTransaction[],
  modified: PlaidTransaction[],
  removed: Array<{ transaction_id: string }>,
  accountIds: Map<string, number>,
  accountCurrencies: Map<string, string>,
  dataSource: TransactionDataSource,
  syncedAt: Date,
  store: PlaidTransactionStore,
) {
  const save = async (transaction: PlaidTransaction) => {
    const accountId = accountIds.get(transaction.account_id);
    if (!accountId) {
      throw new PlaidServiceError(
        "Plaid returned a transaction for an account Nexora could not match. Sync was not committed; please retry.",
        503,
      );
    }
    const values = toTransactionValues(
      transaction,
      accountId,
      dataSource,
      syncedAt,
      accountCurrencies.get(transaction.account_id) || "USD",
    );
    const pendingId = (transaction as PlaidTransaction & {
      pending_transaction_id?: string | null;
    }).pending_transaction_id;
    if (pendingId && !transaction.pending) {
      if (await store.promotePending(pendingId, accountId, values)) return;
    }
    await store.upsert(values);
  };

  for (const transaction of added) await save(transaction);
  for (const transaction of modified) await save(transaction);
  for (const transaction of removed) await store.remove(transaction.transaction_id);

  return {
    added: added.length,
    modified: modified.length,
    removed: removed.length,
    empty: added.length + modified.length + removed.length === 0,
  };
}

export async function exchangePlaidTokenAndSync(
  publicToken: string,
  userId: number,
  exchange: (token: string) => Promise<{ accessToken: string; itemId: string }>,
  save: (details: { accessToken: string; itemId: string; userId: number }) => Promise<void>,
  sync: (itemId: string, userId: number) => Promise<unknown>,
) {
  const exchanged = await exchange(publicToken);
  await save({ ...exchanged, userId });
  return {
    itemId: exchanged.itemId,
    sync: await sync(exchanged.itemId, userId),
  };
}

export class PlaidService {
  static async createLinkToken(userId: number) {
    const { client } = getPlaidClient();
    const countries = (process.env.PLAID_COUNTRY_CODES || "US")
      .split(",")
      .map((country) => country.trim().toUpperCase())
      .filter(Boolean) as CountryCode[];
    try {
      const response = await client.linkTokenCreate({
        user: { client_user_id: String(userId) },
        client_name: "Nexora Finance",
        products: [Products.Transactions],
        country_codes: countries,
        language: "en",
      });
      return { link_token: response.data.link_token, expiration: response.data.expiration };
    } catch (error) {
      throw mapPlaidApiError(error);
    }
  }

  static async exchangePublicToken(publicToken: string, userId: number) {
    const { client, environment } = getPlaidClient();
    getTokenEncryptionKey();
    return exchangePlaidTokenAndSync(
      publicToken,
      userId,
      async (token) => {
        try {
          const response = await client.itemPublicTokenExchange({ public_token: token });
          return {
            accessToken: response.data.access_token,
            itemId: response.data.item_id,
          };
        } catch (error) {
          throw mapPlaidApiError(error);
        }
      },
      async ({ accessToken, itemId: exchangedItemId, userId: ownerId }) => {
        const existing = await db.query.plaidItems.findFirst({
          where: eq(plaidItems.itemId, exchangedItemId),
        });
        if (existing && existing.userId !== ownerId) {
          throw new PlaidServiceError(
            "This bank connection is already linked to another user.",
            409,
          );
        }
        const encryptedToken = encryptAccessToken(accessToken);
        if (existing) {
          await db.update(plaidItems)
            .set({ accessToken: encryptedToken, syncCursor: null, environment })
            .where(and(
              eq(plaidItems.itemId, exchangedItemId),
              eq(plaidItems.userId, ownerId),
            ));
        } else {
          await db.insert(plaidItems).values({
            userId: ownerId,
            accessToken: encryptedToken,
            itemId: exchangedItemId,
            environment,
          });
        }
      },
      (exchangedItemId, ownerId) => this.syncTransactions(ownerId, exchangedItemId),
    );
  }

  static async syncUserTransactions(userId: number) {
    const savedItems = await db.query.plaidItems.findMany({
      where: eq(plaidItems.userId, userId),
    });
    const items = savedItems.filter((item) => item.accessToken.startsWith("enc:v1:"));
    if (!items.length) {
      return {
        added: 0,
        modified: 0,
        removed: 0,
        empty: true,
        needsRelink: savedItems.length > 0,
      };
    }

    const totals = { added: 0, modified: 0, removed: 0, empty: true };
    for (const item of items) {
      const result = await this.syncTransactions(userId, item.itemId);
      totals.added += result.added;
      totals.modified += result.modified;
      totals.removed += result.removed;
      totals.empty = totals.empty && result.empty;
    }
    return { ...totals, needsRelink: savedItems.length > items.length };
  }

  static async syncTransactions(userId: number, itemId: string) {
    const item = await db.query.plaidItems.findFirst({
      where: and(eq(plaidItems.itemId, itemId), eq(plaidItems.userId, userId)),
    });
    if (!item) {
      throw new PlaidServiceError("Bank connection not found for this user.", 404);
    }

    const environment = getPlaidEnvironment();
    const itemEnvironment = getPlaidEnvironment(item.environment);
    if (environment !== itemEnvironment) {
      throw new PlaidServiceError(
        `This bank connection belongs to Plaid ${itemEnvironment}. Restore PLAID_ENV=${itemEnvironment} and its matching credentials, or reconnect it.`,
        409,
      );
    }
    const { client } = getPlaidClient(environment);
    const accessToken = decryptAccessToken(item.accessToken);
    let cursor: string | undefined = item.syncCursor || undefined;
    const added: PlaidTransaction[] = [];
    const modified: PlaidTransaction[] = [];
    const removed: Array<{ transaction_id: string }> = [];

    try {
      let hasMore = true;
      while (hasMore) {
        const response = await client.transactionsSync({
          access_token: accessToken,
          ...(cursor ? { cursor } : {}),
        });
        added.push(...response.data.added);
        modified.push(...response.data.modified);
        removed.push(...response.data.removed);
        hasMore = response.data.has_more;
        cursor = response.data.next_cursor;
      }
    } catch (error) {
      throw mapPlaidApiError(error);
    }

    const accountsResponse = await (async () => {
      try {
        return await client.accountsGet({ access_token: accessToken });
      } catch (error) {
        throw mapPlaidApiError(error);
      }
    })();

    const dataSource = getPlaidDataSource(itemEnvironment);
    const now = new Date();
    const internalAccountIds = new Map<string, number>();
    const internalAccountCurrencies = new Map<string, string>();
    for (const plaidAccount of accountsResponse.data.accounts) {
      const existingAccount = await db.query.accounts.findFirst({
        where: eq(accounts.plaidAccountId, plaidAccount.account_id),
      });
      if (existingAccount && existingAccount.userId !== userId) {
        throw new PlaidServiceError(
          "Plaid returned an account already associated with another Nexora user.",
          409,
        );
      }
      const accountValues = {
        userId,
        type: String(plaidAccount.subtype || plaidAccount.type),
        balance: String(plaidAccount.balances.current ?? 0),
        accountNumber: `PLAID-${plaidAccount.account_id}`,
        plaidAccountId: plaidAccount.account_id,
        dataSource,
        currency:
          plaidAccount.balances.iso_currency_code ||
          plaidAccount.balances.unofficial_currency_code ||
          "USD",
      };
      let accountId: number;
      if (existingAccount) {
        const [updated] = await db.update(accounts)
          .set(accountValues)
          .where(and(eq(accounts.id, existingAccount.id), eq(accounts.userId, userId)))
          .returning({ id: accounts.id });
        accountId = updated.id;
      } else {
        const [created] = await db.insert(accounts).values(accountValues)
          .onConflictDoNothing({ target: accounts.plaidAccountId })
          .returning({ id: accounts.id });
        if (created) {
          accountId = created.id;
        } else {
          const conflictingAccount = await db.query.accounts.findFirst({
            where: eq(accounts.plaidAccountId, plaidAccount.account_id),
          });
          if (!conflictingAccount || conflictingAccount.userId !== userId) {
            throw new PlaidServiceError(
              "Plaid returned an account already associated with another Nexora user.",
              409,
            );
          }
          const [updated] = await db.update(accounts)
            .set(accountValues)
            .where(and(eq(accounts.id, conflictingAccount.id), eq(accounts.userId, userId)))
            .returning({ id: accounts.id });
          if (!updated) {
            throw new PlaidServiceError("Unable to update the connected account.", 503);
          }
          accountId = updated.id;
        }
      }
      internalAccountIds.set(plaidAccount.account_id, accountId);
      internalAccountCurrencies.set(plaidAccount.account_id, accountValues.currency);
    }

    try {
      const transactionChanges = await applyPlaidTransactionChanges(
        added,
        modified,
        removed,
        internalAccountIds,
        internalAccountCurrencies,
        dataSource,
        now,
        {
          async promotePending(pendingId, accountId, values) {
            const [pendingRecord] = await db.update(transactions)
              .set(values)
              .where(and(
                eq(transactions.plaidTransactionId, pendingId),
                eq(transactions.accountId, accountId),
              ))
              .returning({ id: transactions.id });
            return Boolean(pendingRecord);
          },
          async upsert(values) {
            const [saved] = await db.insert(transactions)
              .values(values)
              .onConflictDoUpdate({
                target: transactions.plaidTransactionId,
                set: values,
                setWhere: eq(transactions.accountId, values.accountId),
              })
              .returning({ id: transactions.id });
            if (!saved) {
              throw new PlaidServiceError(
                "Plaid returned a transaction already associated with another Nexora account.",
                409,
              );
            }
          },
          async remove(transactionId) {
            const existing = await db.query.transactions.findFirst({
              where: eq(transactions.plaidTransactionId, transactionId),
              with: { account: true },
            });
            if (!existing) return;
            if (existing.account.userId !== userId) {
              throw new PlaidServiceError(
                "Plaid returned a transaction already associated with another Nexora account.",
                409,
              );
            }
            await db.delete(transactions)
              .where(and(
                eq(transactions.id, existing.id),
                eq(transactions.accountId, existing.accountId),
              ));
          },
        },
      );
      await db.update(plaidItems)
        .set({ syncCursor: cursor || null })
        .where(and(eq(plaidItems.itemId, itemId), eq(plaidItems.userId, userId)));
      return transactionChanges;
    } catch (error) {
      if (error instanceof PlaidServiceError) throw error;
      throw new PlaidServiceError(
        "Plaid returned updates, but Nexora could not save them. Please retry the sync.",
        503,
      );
    }

  }

  static async getConnectionStatus(userId: number) {
    const { environment } = getPlaidClient();
    getTokenEncryptionKey();
    const items = await db.query.plaidItems.findMany({
      where: eq(plaidItems.userId, userId),
      columns: { itemId: true, environment: true, accessToken: true },
    });
    const activeItems = items.filter((item) => item.accessToken.startsWith("enc:v1:"));
    const needsRelink = items.length > activeItems.length;
    const itemEnvironments = Array.from(new Set(
      activeItems.map((item) => getPlaidEnvironment(item.environment)),
    ));
    const connectedEnvironment =
      itemEnvironments.length === 1 ? itemEnvironments[0] : itemEnvironments.length ? "mixed" : environment;
    return {
      available: true,
      connected: activeItems.length > 0,
      needsRelink,
      environment: connectedEnvironment,
      dataSource: itemEnvironments.length === 1
        ? getPlaidDataSource(itemEnvironments[0])
        : itemEnvironments.length
          ? null
          : getPlaidDataSource(environment),
      itemCount: activeItems.length,
    };
  }
}
