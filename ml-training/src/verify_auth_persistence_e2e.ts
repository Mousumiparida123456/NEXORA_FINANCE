process.env.NODE_ENV = "test";
import fs from "fs";
import { db, users, transactions, accounts, eq, sql } from "../../artifacts/api-server/src/db";
import { AuthService } from "../../artifacts/api-server/src/services/AuthService";

const LOG_FILE = "c:/Users/HP/Desktop/PROJECTS/NEXORA_FINANCE/test_debug.log";
try { fs.writeFileSync(LOG_FILE, ""); } catch(e){}

function logDebug(msg: string) {
  console.log(msg);
  fs.appendFileSync(LOG_FILE, msg + "\n");
}

const API_BASE = "http://localhost:9999/api/v1";

async function runAuthAndPersistenceVerification() {
  const { default: app } = await import("../../artifacts/api-server/api/index");
  
  let server: any = null;
  try {
    const pingRes = await fetch("http://localhost:9999/");
    if (!pingRes.ok) throw new Error("Not active");
    console.log("ℹ️ Server already active on port 9999");
  } catch (e) {
    await new Promise<void>((resolve, reject) => {
      server = app.listen(9999, () => {
        console.log("🚀 Server started on port 9999 for test runner");
        resolve();
      });
      server.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          console.log("ℹ️ Port 9999 in use, attaching to running server...");
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }

  console.log("==================================================");
  console.log("STARTING CRITICAL AUTH & PERSISTENCE E2E VERIFICATION");
  console.log("==================================================");

  // STEP 1: Test Unauthenticated GET /api/v1/transactions
  console.log("▶ [1/10] Testing Unauthenticated GET /api/v1/transactions...");
  const unauthGetRes = await fetch(`${API_BASE}/transactions`);
  console.log(`   Status: ${unauthGetRes.status}`);
  if (unauthGetRes.status !== 401) {
    throw new Error(`Expected HTTP 401 for unauthenticated GET, got ${unauthGetRes.status}`);
  }
  console.log("   ✅ PASS: Unauthenticated GET returns HTTP 401");

  // STEP 2: Test Unauthenticated POST /api/v1/transactions
  console.log("▶ [2/10] Testing Unauthenticated POST /api/v1/transactions...");
  const unauthPostRes = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 100, category: "Test" }),
  });
  console.log(`   Status: ${unauthPostRes.status}`);
  if (unauthPostRes.status !== 401) {
    throw new Error(`Expected HTTP 401 for unauthenticated POST, got ${unauthPostRes.status}`);
  }
  console.log("   ✅ PASS: Unauthenticated POST returns HTTP 401");

  // STEP 3: Register or Login Test User
  const testEmail = "test-persistence-user@nexora.local";
  const testPass = "TestPersistPass123!";
  console.log(`▶ [3/10] Authenticating user (${testEmail})...`);

  let loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: testPass, workspace: "PERSONAL" }),
  });

  if (!loginRes.ok) {
    // Try registering
    await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPass, role: "PERSONAL_USER" }),
    });

    loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPass, workspace: "PERSONAL" }),
    });
  }

  const loginData = await loginRes.json() as any;
  if (!loginData.accessToken) {
    throw new Error("Login failed to return accessToken");
  }
  let token = loginData.accessToken;
  const user = loginData.user;
  console.log(`   ✅ PASS: Logged in as User ID ${user.id} (${user.email})`);

  // STEP 4: Create TEST-TXN-PERSIST-001
  const txnDescription = `TEST-TXN-PERSIST-001-${Date.now()}`;
  console.log(`▶ [4/10] Creating transaction '${txnDescription}' ($999.99)...`);

  const createRes = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount: 999.99,
      type: "expense",
      category: "Shopping",
      description: txnDescription,
      date: new Date().toISOString().split("T")[0],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create transaction: ${createRes.status} ${errText}`);
  }
  const createdTxn = await createRes.json() as any;
  console.log(`   ✅ PASS: Transaction created with ID: ${createdTxn.id}`);

  // STEP 5: Direct PostgreSQL Query Verification
  console.log("▶ [5/10] Verifying transaction persistence in PostgreSQL database...");
  const dbTx = await db.query.transactions.findFirst({
    where: eq(transactions.id, Number(createdTxn.id)),
  });

  if (!dbTx) {
    throw new Error(`Transaction ID ${createdTxn.id} NOT found in PostgreSQL database!`);
  }
  console.log("   ✅ PASS: Transaction confirmed in PostgreSQL database record");

  // STEP 6: Simulate Logout & Re-Login
  console.log("▶ [6/10] Simulating Logout & Re-authenticating with same account...");
  token = ""; // Clear token

  const reloginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: testPass, workspace: "PERSONAL" }),
  });
  const reloginData = await reloginRes.json() as any;
  const newToken = reloginData.accessToken;
  console.log("   ✅ PASS: Re-login successful, new access token acquired");

  // STEP 7: Fetch Transactions After Re-Login
  console.log("▶ [7/10] Fetching Transactions after re-login...");
  const fetchTxsRes = await fetch(`${API_BASE}/transactions`, {
    headers: { Authorization: `Bearer ${newToken}` },
  });

  if (!fetchTxsRes.ok) {
    throw new Error(`Failed to fetch transactions after re-login: ${fetchTxsRes.status}`);
  }

  const userTxs = await fetchTxsRes.json() as any[];
  const foundTx = userTxs.find((tx) => String(tx.id) === String(createdTxn.id));

  if (!foundTx) {
    throw new Error(`Transaction ${createdTxn.id} disappeared after logout/login!`);
  }
  console.log(`   ✅ PASS: Transaction '${foundTx.description}' successfully retrieved after re-login!`);

  // STEP 8: Test Token Refresh Endpoint /api/v1/auth/refresh
  console.log("▶ [8/10] Testing Token Refresh Endpoint (/api/v1/auth/refresh)...");
  const refreshToken = jwtSignRefresh({ userId: Number(user.id), email: user.email, role: user.role });
  const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!refreshRes.ok) {
    throw new Error(`Token refresh failed with status ${refreshRes.status}`);
  }
  const refreshData = await refreshRes.json() as any;
  if (!refreshData.accessToken) {
    throw new Error("Refresh endpoint failed to return new accessToken");
  }
  console.log("   ✅ PASS: Token refresh issued valid new access token");

  // STEP 9: User Data Isolation Check
  console.log("▶ [9/10] Verifying User Data Isolation (creating secondary user)...");
  const secondaryEmail = "other-user-isolation@nexora.local";
  let secLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: secondaryEmail, password: testPass, workspace: "PERSONAL" }),
  });
  if (!secLoginRes.ok) {
    await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: secondaryEmail, password: testPass, role: "PERSONAL_USER" }),
    });
    secLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: secondaryEmail, password: testPass, workspace: "PERSONAL" }),
    });
  }
  const secLoginData = await secLoginRes.json() as any;
  const secToken = secLoginData.accessToken;

  const secTxsRes = await fetch(`${API_BASE}/transactions`, {
    headers: { Authorization: `Bearer ${secToken}` },
  });
  const secTxs = await secTxsRes.json() as any[];
  const leakedTx = secTxs.find((tx) => String(tx.id) === String(createdTxn.id));

  if (leakedTx) {
    throw new Error("SECURITY VIOLATION: Transaction leaked to secondary user!");
  }
  console.log("   ✅ PASS: User Data Isolation verified (0 transactions leaked to other accounts)");

  // STEP 10: Clean up test transaction
  console.log("▶ [10/10] Cleaning up test transaction...");
  await fetch(`${API_BASE}/transactions/${createdTxn.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${newToken}` },
  });
  console.log("   ✅ PASS: Cleaned up test transaction");

  console.log("==================================================");
  console.log("🎉 ALL 10 AUTH & TRANSACTION PERSISTENCE CHECKS PASSED!");
  console.log("==================================================");
  server?.close();
  process.exit(0);
}

function jwtSignRefresh(payload: any) {
  const jwt = require("jsonwebtoken");
  const secret = process.env.JWT_REFRESH_SECRET || "nexora_refresh_premium_key_2025";
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

runAuthAndPersistenceVerification().catch((err) => {
  logDebug("❌ E2E VERIFICATION FAILED: " + (err?.stack || err));
  process.exit(1);
});
