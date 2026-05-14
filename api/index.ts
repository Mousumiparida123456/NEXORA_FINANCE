import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { db, users, accounts, transactions, eq, sql, desc } from "../artifacts/api-server/src/db";
import { AuthService } from "../artifacts/api-server/src/services/AuthService";
import { AIService } from "../artifacts/api-server/src/services/AIService";
import { AnalyticsService } from "../artifacts/api-server/src/services/AnalyticsService";
import { logger } from "../artifacts/api-server/src/lib/logger";

const app = express();

const firstParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ 
  origin: ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "https://nexora-finance-fintech-dashboard.vercel.app"], 
  credentials: true 
}));

// GLOBAL DIAGNOSTIC LOGGER
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`📡 [ROOT_HIT] ${req.method} ${req.url} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// --- DASHBOARD FEATURES ---

app.get("/api/v1/ping", (req, res) => res.json({ status: "ok" }));
app.get("/api/healthz", (req, res) => res.json({ status: "ok" }));

const getDashboard = async (req: any, res: any) => {
  const token = req.cookies?.nexora_access;
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });
  try {
    const userAccounts = await db.query.accounts.findMany({ 
      where: eq(accounts.userId, payload.userId),
      with: { transactions: true }
    });
    res.json({ accounts: userAccounts });
  } catch (error) { res.status(500).json({ error: "Dashboard load failed" }); }
};
app.get(["/api/v1/dashboard", "/api/dashboard"], getDashboard);

const handleAI = async (req: any, res: any) => {
  const token = req.cookies?.nexora_access;
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
    const userAccounts = await db.query.accounts.findMany({ where: eq(accounts.userId, payload.userId) });
    const advice = await AIService.getFinancialAdvice({ user, accounts: userAccounts });
    res.json({ advice });
  } catch (error) { res.status(500).json({ error: "AI Service error" }); }
};
app.get(["/api/v1/ai/insights", "/api/ai/insights"], handleAI);
app.post(["/api/v1/ai/insights", "/api/ai/insights"], handleAI);

const getPrediction = async (req: any, res: any) => {
  const token = req.cookies?.nexora_access;
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });
  try {
    const history = await db.query.transactions.findMany({
      where: sql`account_id IN (SELECT id FROM accounts WHERE user_id = ${payload.userId})`
    });
    const prediction = AnalyticsService.predictFutureBalance(history);
    res.json(prediction);
  } catch (error) { res.status(500).json({ error: "Prediction error" }); }
};
app.get(["/api/v1/analytics/predict", "/api/analytics/predict"], getPrediction);

// --- TRANSACTIONS ---

app.get(["/api/v1/transactions", "/api/transactions"], async (req, res) => {
  const token = req.cookies?.nexora_access;
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });

  try {
    const userTransactions = await db.query.transactions.findMany({
      where: sql`account_id IN (SELECT id FROM accounts WHERE user_id = ${payload.userId})`,
      orderBy: [desc(transactions.timestamp)]
    });
    
    const formatted = userTransactions.map(tx => ({
      ...tx,
      date: new Date(tx.timestamp).toISOString()
    }));
    res.json(formatted);
  } catch (error) { 
    console.error("GET transactions error:", error);
    res.status(500).json({ error: "Failed to fetch transactions" }); 
  }
});

app.post(["/api/v1/transactions", "/api/transactions"], async (req, res) => {
  const token = req.cookies?.nexora_access;
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });

  try {
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.userId, payload.userId)
    });
    if (!account) return res.status(400).json({ error: "No account found" });

    const { amount, type, category, description, date } = req.body;
    
    const [newTx] = await db.insert(transactions).values({
      accountId: account.id,
      amount: String(amount),
      type,
      category,
      description,
      timestamp: date ? new Date(date) : new Date()
    }).returning();

    res.json({ ...newTx, date: new Date(newTx.timestamp).toISOString() });
  } catch (error) { 
    console.error("POST transaction error:", error);
    res.status(500).json({ error: "Failed to add transaction" }); 
  }
});

app.patch(["/api/v1/transactions/:id", "/api/transactions/:id"], async (req, res) => {
  const token = req.cookies?.nexora_access;
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });

  try {
    const idParam = firstParam(req.params.id);
    const txId = Number.parseInt(idParam ?? "", 10);
    if (isNaN(txId)) return res.status(400).json({ error: "Invalid ID" });

    const existingTx = await db.query.transactions.findFirst({
      where: sql`id = ${txId} AND account_id IN (SELECT id FROM accounts WHERE user_id = ${payload.userId})`
    });
    
    if (!existingTx) return res.status(404).json({ error: "Transaction not found" });

    const { amount, type, category, description, date } = req.body;

    const [updatedTx] = await db.update(transactions).set({
      amount: amount !== undefined ? String(amount) : undefined,
      type,
      category,
      description,
      timestamp: date ? new Date(date) : undefined
    }).where(eq(transactions.id, txId)).returning();

    res.json({ ...updatedTx, date: new Date(updatedTx.timestamp).toISOString() });
  } catch (error) { 
    console.error("PATCH transaction error:", error);
    res.status(500).json({ error: "Failed to update transaction" }); 
  }
});

app.delete(["/api/v1/transactions/:id", "/api/transactions/:id"], async (req, res) => {
  const token = req.cookies?.nexora_access;
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });

  try {
    const idParam = firstParam(req.params.id);
    const txId = Number.parseInt(idParam ?? "", 10);
    if (isNaN(txId)) return res.status(400).json({ error: "Invalid ID" });

    const existingTx = await db.query.transactions.findFirst({
      where: sql`id = ${txId} AND account_id IN (SELECT id FROM accounts WHERE user_id = ${payload.userId})`
    });
    
    if (!existingTx) return res.status(404).json({ error: "Transaction not found" });

    await db.delete(transactions).where(eq(transactions.id, txId));
    res.status(204).send();
  } catch (error) { 
    console.error("DELETE transaction error:", error);
    res.status(500).json({ error: "Failed to delete transaction" }); 
  }
});

// --- AUTH ROUTES ---

app.get(["/api/v1/auth/user", "/api/auth/user", "/auth/user"], async (req, res) => {
  const token = req.cookies?.nexora_access;
  const payload = AuthService.verifyAccessToken(token);
  
  if (!payload) {
    return res.json({ user: null });
  }

  try {
    const user = await db.query.users.findFirst({ 
      where: eq(users.id, payload.userId) 
    });

    if (!user) {
      return res.json({ user: null });
    }

    res.json({
      user: {
        id: user.id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      }
    });
  } catch (error) {
    res.json({ user: null });
  }
});

app.post(["/api/v1/auth/register", "/api/auth/register", "/auth/register"], async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const existingUser = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await AuthService.hashPassword(password);
    const [user] = await db.insert(users).values({ 
      email, 
      password: hashedPassword, 
      firstName: firstName || email.split("@")[0], 
      lastName 
    }).returning();

    await db.insert(accounts).values({ 
      userId: user.id, 
      type: "savings", 
      balance: "1000.00", 
      accountNumber: `NEX-${Math.floor(Math.random() * 1000000)}` 
    });

    const tokens = AuthService.generateTokens({ userId: user.id, email: user.email });
    res.cookie("nexora_access", tokens.accessToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      sameSite: "lax", 
      maxAge: 900000 
    });
    res.cookie("nexora_refresh", tokens.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 604800000 });
    res.cookie("nexora_session", "active", { maxAge: 604800000 });

    res.json({ 
      user: { 
        id: user.id.toString(),
        email: user.email, 
        firstName: user.firstName 
      } 
    });
  } catch (error) { 
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Registration failed" }); 
  }
});

app.post(["/api/v1/auth/login", "/api/auth/login", "/auth/login"], async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return res.status(401).json({ error: "User does not exist" });

    const isMatch = await AuthService.comparePassword(password, user.password || "");
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const tokens = AuthService.generateTokens({ userId: user.id, email: user.email });
    res.cookie("nexora_access", tokens.accessToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      sameSite: "lax", 
      maxAge: 900000 
    });
    res.cookie("nexora_refresh", tokens.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 604800000 });
    res.cookie("nexora_session", "active", { maxAge: 604800000 });

    res.json({ 
      user: { 
        id: user.id.toString(),
        email: user.email, 
        firstName: user.firstName 
      } 
    });
  } catch (error) { 
    console.error("Login Error:", error);
    res.status(500).json({ error: "Login failed" }); 
  }
});

app.get(["/api/v1/auth/logout", "/api/v1/logout"], (req, res) => {
  res.clearCookie("nexora_access");
  res.clearCookie("nexora_refresh");
  res.clearCookie("nexora_session");
  const returnTo = req.query.returnTo as string || "http://localhost:5173/login";
  res.redirect(returnTo);
});

// --- GOOGLE AUTH ---

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const DEFAULT_API_ORIGIN = "https://nexora-finance-api-server.vercel.app";
const DEFAULT_CLIENT_ORIGIN = "https://nexora-finance-fintech-dashboard.vercel.app";
const API_ORIGIN = process.env.API_ORIGIN || DEFAULT_API_ORIGIN;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || DEFAULT_CLIENT_ORIGIN;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || `${API_ORIGIN.replace(/\/+$/, "")}/api/v1/auth/google/callback`;

const startGoogleAuth = (req: express.Request, res: express.Response) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: "Google OAuth is not configured on server." });
  }

  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: GOOGLE_REDIRECT_URI,
    client_id: GOOGLE_CLIENT_ID || "",
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };

  const qs = new URLSearchParams(options);
  res.redirect(`${rootUrl}?${qs.toString()}`);
};

const handleGoogleCallback = async (req: express.Request, res: express.Response) => {
  const code = req.query.code as string;
  const clientOrigin = CLIENT_ORIGIN;

  if (!code) {
    return res.redirect(`${clientOrigin}/login?error=no_code`);
  }

  try {
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const values = {
      code,
      client_id: GOOGLE_CLIENT_ID || "",
      client_secret: GOOGLE_CLIENT_SECRET || "",
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    };

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      body: new URLSearchParams(values),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const tokenData = await tokenRes.json() as any;
    const access_token = tokenData.access_token;

    if (!access_token) {
        return res.redirect(`${clientOrigin}/login?error=no_token`);
    }

    const userRes = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`);
    const googleUser = await userRes.json() as any;

    let user = await db.query.users.findFirst({ where: eq(users.email, googleUser.email) });
    
    if (!user) {
      [user] = await db.insert(users).values({ 
        email: googleUser.email, 
        firstName: googleUser.given_name || googleUser.name,
        lastName: googleUser.family_name || "",
        profileImageUrl: googleUser.picture
      }).returning();
      
      await db.insert(accounts).values({ 
        userId: user.id, 
        type: "savings", 
        balance: "1000.00", 
        accountNumber: `NEX-G-${Math.floor(Math.random() * 1000000)}` 
      });
    }

    const tokens = AuthService.generateTokens({ userId: user.id, email: user.email });
    res.cookie("nexora_access", tokens.accessToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      sameSite: "lax", 
      maxAge: 900000 
    });
    res.cookie("nexora_refresh", tokens.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 604800000 });
    res.cookie("nexora_session", "active", { maxAge: 604800000 });

    res.redirect(`${clientOrigin}/dashboard`);
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.redirect(`${clientOrigin}/login?error=auth_failed`);
  }
};

app.get(["/api/auth/google", "/api/v1/auth/google", "/auth/google"], startGoogleAuth);
app.get(
  ["/api/auth/google/callback", "/api/v1/auth/google/callback", "/auth/google/callback"],
  handleGoogleCallback
);

// Vercel rewrite fallback: catch-all rewrites can forward path as ?path=...
app.get("*", (req, res, next) => {
  const rewrittenPathRaw = firstParam(req.query.path as string | string[] | undefined) || "";
  const rewrittenPath = rewrittenPathRaw.replace(/^\/+/, "").replace(/\/+$/, "");

  if (
    rewrittenPath === "auth/google" ||
    rewrittenPath === "api/auth/google" ||
    rewrittenPath === "api/v1/auth/google"
  ) {
    return startGoogleAuth(req, res);
  }

  if (
    rewrittenPath === "auth/google/callback" ||
    rewrittenPath === "api/auth/google/callback" ||
    rewrittenPath === "api/v1/auth/google/callback"
  ) {
    return handleGoogleCallback(req, res);
  }

  next();
});

app.use((req, res) => {
  console.log(`❌ 404 NOT FOUND: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: "Route not found", 
    path: req.url, 
    method: req.method,
    suggestion: "Check api/index.ts for this route definition"
  });
});

export default app;
