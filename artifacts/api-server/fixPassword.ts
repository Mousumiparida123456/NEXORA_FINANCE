import { db, users } from "./src/db";
import { eq } from "drizzle-orm";
import { AuthService } from "./src/services/AuthService";

async function fixPassword() {
  const email = "demo@nexora.finance";
  const password = "DemoAccount123!";
  const hashedPassword = await AuthService.hashPassword(password);
  
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (user) {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.email, email));
    console.log(`✅ Fixed password for ${email}`);
  } else {
    console.log(`User ${email} does not exist yet.`);
  }
  process.exit(0);
}

fixPassword().catch(console.error);
