import { db, users } from "./src/db";
import { eq } from "drizzle-orm";

async function checkUsers() {
  const allUsers = await db.query.users.findMany({
    where: eq(users.email, "demo@nexora.finance")
  });
  console.log(`Found ${allUsers.length} users with demo@nexora.finance`);
  for (const u of allUsers) {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Password: ${u.password?.substring(0, 10)}...`);
  }
  process.exit(0);
}

checkUsers().catch(console.error);
