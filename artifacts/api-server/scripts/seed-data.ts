import { db, users, accounts, transactions, and, eq } from "../src/db";

async function seedDemoData() {
  console.log("DEMO DATA ONLY: preparing synthetic transactions.");

  // 1. Find or create default user
  const email = "user@example.com";
  let user = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (!user) {
    const [newUser] = await db.insert(users).values({
      email,
      firstName: "Nexora",
      lastName: "User",
    }).returning();
    user = newUser;
  }

  // 2. Find or create account
  let account = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, user.id), eq(accounts.dataSource, "DEMO")),
  });
  if (!account) {
    const [newAccount] = await db.insert(accounts).values({
      userId: user.id,
      type: "demo",
      balance: "0.00",
      accountNumber: `NEX-DEMO-SEED-${user.id}`,
      dataSource: "DEMO",
      currency: "USD",
    }).returning();
    account = newAccount;
  }

  const existing = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.accountId, account.id),
      eq(transactions.dataSource, "DEMO"),
    ),
  });
  if (existing) {
    console.log("DEMO DATA ONLY: synthetic transaction history already exists; no rows added.");
    process.exit(0);
  }

  console.log("Generating explicitly synthetic demo history...");
  const categories = [
    { name: "Salary", type: "income", avg: 85000, variance: 5000, freq: "monthly" },
    { name: "Rent", type: "expense", avg: 25000, variance: 0, freq: "monthly" },
    { name: "Groceries", type: "expense", avg: 4000, variance: 1000, freq: "weekly" },
    { name: "Dining Out", type: "expense", avg: 2000, variance: 1500, freq: "weekly" },
    { name: "Utilities", type: "expense", avg: 3500, variance: 500, freq: "monthly" },
    { name: "Streaming", type: "expense", avg: 999, variance: 0, freq: "monthly" },
  ];

  const now = new Date();
  const txData = [];

  for (let m = 0; m < 12; m++) {
    const monthDate = new Date(now);
    monthDate.setMonth(now.getMonth() - m);

    for (const cat of categories) {
      if (cat.freq === "monthly") {
        txData.push({
          accountId: account.id,
          amount: (cat.avg + (Math.random() * cat.variance)).toFixed(2),
          type: cat.type,
          category: cat.name,
          description: `DEMO - ${cat.name} - ${monthDate.toLocaleString('default', { month: 'long' })}`,
          dataSource: "DEMO",
          timestamp: new Date(monthDate),
        });
      } else if (cat.freq === "weekly") {
        for (let w = 0; w < 4; w++) {
          const weekDate = new Date(monthDate);
          weekDate.setDate(weekDate.getDate() - (w * 7));
          txData.push({
            accountId: account.id,
            amount: (cat.avg + (Math.random() * cat.variance)).toFixed(2),
            type: cat.type,
            category: cat.name,
            description: `DEMO - ${cat.name} Week ${w + 1}`,
            dataSource: "DEMO",
            timestamp: new Date(weekDate),
          });
        }
      }
    }
  }

  // Batch insert
  await db.insert(transactions).values(txData);
  console.log(`DEMO DATA ONLY: added ${txData.length} synthetic transactions.`);
  process.exit(0);
}

seedDemoData().catch((error) => {
  console.error("Unable to seed explicitly synthetic demo data.", error);
  process.exitCode = 1;
});
