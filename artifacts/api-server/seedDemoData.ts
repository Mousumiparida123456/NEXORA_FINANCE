import { db, users, accounts, transactions, and, eq } from "./src/db";

async function seedDemoData() {
  const email = "demo@nexora.local";
  let user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) {
    [user] = await db.insert(users).values({
      email,
      firstName: "Nexora Demo",
      lastName: "User",
    }).returning();
  }

  let demoAccount = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, user.id), eq(accounts.dataSource, "DEMO")),
  });
  if (!demoAccount) {
    [demoAccount] = await db.insert(accounts).values({
      userId: user.id,
      type: "demo",
      balance: "0.00",
      accountNumber: `NEX-DEMO-${user.id}`,
      dataSource: "DEMO",
      currency: "USD",
    }).returning();
  }

  const existingDemoData = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.accountId, demoAccount.id),
      eq(transactions.dataSource, "DEMO"),
    ),
  });
  if (existingDemoData) {
    console.log("DEMO DATA ONLY: existing synthetic records were left unchanged.");
    process.exit(0);
  }

  const now = new Date();
  const rows = [
    { category: "Salary", type: "income", amount: 8500 },
    { category: "Rent", type: "expense", amount: 2500 },
    { category: "Groceries", type: "expense", amount: 400 },
    { category: "Dining Out", type: "expense", amount: 200 },
    { category: "Utilities", type: "expense", amount: 350 },
    { category: "Streaming", type: "expense", amount: 49 },
  ];
  const demoTransactions = [];
  for (let month = 0; month < 12; month += 1) {
    for (const row of rows) {
      const timestamp = new Date(now);
      timestamp.setMonth(now.getMonth() - month);
      demoTransactions.push({
        accountId: demoAccount.id,
        amount: row.amount.toFixed(2),
        type: row.type,
        category: row.category,
        description: `DEMO - ${row.category} example`,
        dataSource: "DEMO",
        timestamp,
      });
    }
  }
  await db.insert(transactions).values(demoTransactions);
  console.log(`DEMO DATA ONLY: added ${demoTransactions.length} synthetic transactions.`);
  process.exit(0);
}

seedDemoData().catch((error) => {
  console.error("Unable to seed explicitly synthetic demo data.", error);
  process.exitCode = 1;
});
