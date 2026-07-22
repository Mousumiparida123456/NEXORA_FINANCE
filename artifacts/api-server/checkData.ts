import { db, accounts, transactions } from "./src/db";
import { eq } from "drizzle-orm";

async function checkData() {
  const userId = 19;
  const userAccounts = await db.query.accounts.findMany({ where: eq(accounts.userId, userId) });
  console.log(`Found ${userAccounts.length} accounts for user ${userId}`);
  
  if (userAccounts.length > 0) {
    const accIds = userAccounts.map(a => a.id);
    const txs = await db.query.transactions.findMany({
      where: (t, { inArray }) => inArray(t.accountId, accIds)
    });
    console.log(`Found ${txs.length} transactions for user ${userId}`);
  }
  process.exit(0);
}

checkData().catch(console.error);
