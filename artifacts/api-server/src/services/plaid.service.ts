import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";
import { db, users, accounts, transactions, plaidItems } from "../db";
import { eq, sql } from "drizzle-orm";

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || "development";

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
      "PLAID-SECRET": PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

export class PlaidService {
  static async createLinkToken(userId: number, email: string) {
    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      throw new Error("Plaid credentials not configured.");
    }
    const request = {
      user: {
        client_user_id: userId.toString(),
      },
      client_name: "Nexora Finance",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    };

    const response = await plaidClient.linkTokenCreate(request);
    return response.data;
  }

  static async exchangePublicToken(publicToken: string, userId: number) {
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    
    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Save to DB
    await db.insert(plaidItems).values({
      userId,
      accessToken,
      itemId,
    });

    // Automatically trigger initial sync
    await this.syncTransactions(userId, itemId);

    return { itemId };
  }

  static async syncTransactions(userId: number, itemId: string) {
    // 1. Get the Plaid Item from DB
    const item = await db.query.plaidItems.findFirst({
      where: eq(plaidItems.itemId, itemId),
    });

    if (!item) throw new Error("Plaid item not found");

    let cursor = item.syncCursor;
    let added: any[] = [];
    let modified: any[] = [];
    let removed: any[] = [];
    let hasMore = true;

    // 2. Fetch updates from Plaid
    while (hasMore) {
      const request: any = {
        access_token: item.accessToken,
        cursor: cursor,
      };
      const response = await plaidClient.transactionsSync(request);
      const data = response.data;

      added = added.concat(data.added);
      modified = modified.concat(data.modified);
      removed = removed.concat(data.removed);

      hasMore = data.has_more;
      cursor = data.next_cursor;
    }

    // 3. Update cursor in DB
    await db.update(plaidItems)
      .set({ syncCursor: cursor })
      .where(eq(plaidItems.itemId, itemId));

    // 4. Map and store Accounts
    const accountsRes = await plaidClient.accountsGet({
      access_token: item.accessToken,
    });
    
    const plaidAccounts = accountsRes.data.accounts;
    for (const acc of plaidAccounts) {
      const typeStr = acc.subtype || acc.type;
      const balance = acc.balances.current || 0;
      
      // Upsert account
      const existingAcc = await db.query.accounts.findFirst({
        where: eq(accounts.plaidAccountId, acc.account_id)
      });
      
      let accountNumber = "PLAID-" + acc.account_id.substring(0,6);
      if (acc.mask) {
         accountNumber = "****" + acc.mask;
      }

      if (!existingAcc) {
        await db.insert(accounts).values({
          userId,
          type: typeStr.toString(),
          balance: balance.toString(),
          accountNumber: accountNumber,
          plaidAccountId: acc.account_id,
        });
      } else {
        await db.update(accounts)
          .set({ balance: balance.toString() })
          .where(eq(accounts.plaidAccountId, acc.account_id));
      }
    }

    // 5. Process added transactions
    if (added.length > 0) {
      const txData = [];
      for (const tx of added) {
        // Find our internal account_id
        const ourAcc = await db.query.accounts.findFirst({
          where: eq(accounts.plaidAccountId, tx.account_id)
        });
        if (ourAcc) {
          // Plaid amounts: positive is an expense, negative is income/refund
          // We map it to our schema: amount is absolute, type is income/expense
          const isExpense = tx.amount > 0;
          const absoluteAmount = Math.abs(tx.amount).toFixed(2);
          
          txData.push({
            accountId: ourAcc.id,
            amount: absoluteAmount,
            type: isExpense ? "expense" : "income",
            description: tx.name,
            category: tx.category ? tx.category[0] : "Other",
            plaidTransactionId: tx.transaction_id,
            pending: tx.pending,
            timestamp: new Date(tx.date),
          });
        }
      }
      if (txData.length > 0) {
        // Basic insert (could fail on conflict, usually upsert is better for syncs)
        for(const t of txData) {
          try {
             await db.insert(transactions).values(t);
          } catch(e) {
             // likely unique constraint on plaidTransactionId
             // in production, do an upsert
             await db.update(transactions)
               .set(t)
               .where(eq(transactions.plaidTransactionId, t.plaidTransactionId!));
          }
        }
      }
    }

    // 6. Process removed transactions
    for (const tx of removed) {
      await db.delete(transactions)
        .where(eq(transactions.plaidTransactionId, tx.transaction_id));
    }

    return { added: added.length, modified: modified.length, removed: removed.length };
  }
}
