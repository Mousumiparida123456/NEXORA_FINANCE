import { db, users, accounts, transactions } from "./src/db";
import { eq } from "drizzle-orm";

async function seedDemoData() {
  const userId = 19;
  
  // 1. Delete existing data just in case
  const existingAccounts = await db.query.accounts.findMany({ where: eq(accounts.userId, userId) });
  for (const acc of existingAccounts) {
    await db.delete(transactions).where(eq(transactions.accountId, acc.id));
  }
  await db.delete(accounts).where(eq(accounts.userId, userId));
  
  // 2. Create account
  const [newAccount] = await db.insert(accounts).values({
    userId: userId,
    type: "checking",
    balance: "42500.00",
    accountNumber: "NEX-DEMO-123",
  }).returning();
  
  console.log("✅ Created account:", newAccount.id);

  // 3. Generate 12 months of realistic transactions
  console.log("📊 Generating 12 months of financial history...");
  const categories = [
    { name: "Salary", type: "income", avg: 8500, variance: 500, freq: "monthly" },
    { name: "Rent", type: "expense", avg: 2500, variance: 0, freq: "monthly" },
    { name: "Groceries", type: "expense", avg: 400, variance: 100, freq: "weekly" },
    { name: "Dining Out", type: "expense", avg: 200, variance: 150, freq: "weekly" },
    { name: "Utilities", type: "expense", avg: 350, variance: 50, freq: "monthly" },
    { name: "Streaming", type: "expense", avg: 49, variance: 0, freq: "monthly" },
  ];

  const now = new Date();
  const txData = [];

  for (let m = 0; m < 12; m++) {
    const monthDate = new Date(now);
    monthDate.setMonth(now.getMonth() - m);

    for (const cat of categories) {
      if (cat.freq === "monthly") {
        txData.push({
          accountId: newAccount.id,
          amount: (cat.avg + (Math.random() * cat.variance)).toFixed(2),
          type: cat.type,
          category: cat.name,
          description: `${cat.name} - ${monthDate.toLocaleString('default', { month: 'long' })}`,
          timestamp: new Date(monthDate),
        });
      } else if (cat.freq === "weekly") {
        for (let w = 0; w < 4; w++) {
          const weekDate = new Date(monthDate);
          weekDate.setDate(weekDate.getDate() - (w * 7));
          txData.push({
            accountId: newAccount.id,
            amount: (cat.avg + (Math.random() * cat.variance)).toFixed(2),
            type: cat.type,
            category: cat.name,
            description: `${cat.name} Week ${w + 1}`,
            timestamp: new Date(weekDate),
          });
        }
      }
    }
  }

  // Batch insert
  await db.insert(transactions).values(txData);
  console.log(`✅ Successfully seeded ${txData.length} transactions for Demo user!`);
  process.exit(0);
}

seedDemoData().catch(console.error);
