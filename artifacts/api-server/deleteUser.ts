import { db, users } from "./src/db";
import { eq } from "drizzle-orm";

async function run() {
  await db.delete(users).where(eq(users.email, "mousumiparida454@gmail.com"));
  console.log("Deleted user");
  process.exit(0);
}
run();
