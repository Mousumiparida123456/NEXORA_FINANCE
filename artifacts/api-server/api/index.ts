import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { db, users, accounts, transactions, eq, sql } from "../src/db";
import { AuthService } from "../src/services/AuthService";
import { AIService } from "../src/services/AIService";
import { AnalyticsService } from "../src/services/AnalyticsService";
import { logger } from "../src/lib/logger";
import crypto from "crypto";

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const COOKIE_SECURE = process.env.NODE_ENV === "production";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

const getBearerOrCookieToken = (req: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return req.cookies?.nexora_access;
};

const validateEmailAndPassword = (email?: string, password?: string) => {
  if (!email || !password) {
    return "Email and password are required";
  }
  if (!EMAIL_REGEX.test(email)) {
    return "Invalid email format";
  }
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    return "Password must be 8+ chars with upper, lower, number, and symbol";
  }
  return null;
};

// AI Insights Logic
const handleAI = async (req: any, res: any) => {
  const token = getBearerOrCookieToken(req);
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
    const userAccounts = await db.query.accounts.findMany({ where: eq(accounts.userId, payload.userId) });
    const advice = await AIService.getFinancialAdvice({ user, accounts: userAccounts });
    res.json({ advice });
  } catch (error) { res.status(500).json({ error: "AI error" }); }
};

// FAANG-Ready Security Headers
app.use(helmet({ contentSecurityPolicy: false }));

// Rate Limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ 
  origin: ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"], 
  credentials: true 
}));

// --- HIGH PRIORITY DUAL-PATH ROUTES ---
app.get("/api/v1/auth/google", (req, res) => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:9999/api/v1/auth/google/callback";
  
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
});

app.get("/api/v1/auth/google/callback", async (req, res) => {
  const code = req.query.code as string;
  const clientOrigin = CLIENT_ORIGIN;

  if (!code) return res.redirect(`${clientOrigin}/login?error=no_code`);

  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:9999/api/v1/auth/google/callback";

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID || "",
        client_secret: GOOGLE_CLIENT_SECRET || "",
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const { access_token } = await tokenRes.json() as any;
    const userRes = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`);
    const googleUser = await userRes.json() as any;

    // FIND OR CREATE USER
    let user = await db.query.users.findFirst({ where: sql`${users.email} = ${googleUser.email}` });
    if (!user) {
      const [newUser] = await db.insert(users).values({ 
        email: googleUser.email, 
        firstName: googleUser.given_name || googleUser.name,
        lastName: googleUser.family_name || ""
      }).returning();
      user = newUser;
      await db.insert(accounts).values({ userId: user.id, type: "savings", balance: "1000.00", accountNumber: `NEX-G-${Math.floor(Math.random() * 1000000)}` });
    }

    const tokens = AuthService.generateTokens({ userId: user.id, email: user.email });
    res.cookie("nexora_access", tokens.accessToken, { httpOnly: true, secure: COOKIE_SECURE, sameSite: "lax", maxAge: 900000 });
    res.cookie("nexora_refresh", tokens.refreshToken, { httpOnly: true, secure: COOKIE_SECURE, sameSite: "lax", maxAge: 604800000 });
    res.cookie("nexora_session", "active", { maxAge: 604800000 });

    res.redirect(`${clientOrigin}/login?token=${encodeURIComponent(tokens.accessToken)}`);
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.redirect(`${clientOrigin}/login?error=auth_failed`);
  }
});

// --- HIGH PRIORITY DUAL-PATH ROUTES ---
const aiPaths = ["/api/v1/ai/insights", "/api/ai/insights", "/ai/insights"];
app.get(aiPaths, handleAI);
app.post(aiPaths, handleAI);

const predictPaths = ["/api/v1/analytics/predict", "/api/analytics/predict", "/analytics/predict"];
app.get(predictPaths, async (req, res) => {
  console.log(`🎯 PREDICTION_HIT: ${req.url}`);
  try {
    const history = await db.query.transactions.findMany();
    const prediction = AnalyticsService.predictFutureBalance(history);
    res.json(prediction);
  } catch (error) { res.status(500).json({ error: "Prediction error" }); }
});

const dashPaths = ["/api/v1/dashboard", "/api/dashboard", "/dashboard"];
app.get(dashPaths, async (req, res) => {
  const token = getBearerOrCookieToken(req);
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });
  try {
    const userAccounts = await db.query.accounts.findMany({ 
      where: eq(accounts.userId, payload.userId),
      with: { transactions: true }
    });
    res.json({ accounts: userAccounts });
  } catch (error) { res.status(500).json({ error: "Dashboard load failed" }); }
});

// GLOBAL DIAGNOSTIC LOGGER
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`📡 [RESPONSE] ${req.method} ${req.url} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// --- SYSTEM ROUTES ---
app.get("/api/v1/ping", (req, res) => res.json({ status: "ok" }));
app.get("/api/healthz", (req, res) => res.json({ status: "ok" }));

// --- AUTH ROUTES ---

app.post("/api/v1/auth/register", async (req, res) => {
  const start = Date.now();
  const { email, password, firstName, lastName } = req.body;
  const validationError = validateEmailAndPassword(email, password);
  if (validationError) return res.status(400).json({ error: validationError });
  
  try {
    console.log(`⏱️ [REG] Hashing password... (+${Date.now() - start}ms)`);
    const hashedPassword = await AuthService.hashPassword(password);
    
    console.log(`⏱️ [REG] Checking existing user... (+${Date.now() - start}ms)`);
    const existing = await db.query.users.findFirst({ where: sql`${users.email} = ${email}` });
    if (existing) return res.status(400).json({ error: "User already exists" });
    
    console.log(`⏱️ [REG] Inserting user & account... (+${Date.now() - start}ms)`);
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
    
    console.log(`⏱️ [REG] Generating tokens... (+${Date.now() - start}ms)`);
    const tokens = AuthService.generateTokens({ userId: user.id, email: user.email });
    
    res.cookie("nexora_access", tokens.accessToken, { httpOnly: true, secure: COOKIE_SECURE, sameSite: "lax", maxAge: 900000 });
    res.cookie("nexora_refresh", tokens.refreshToken, { httpOnly: true, secure: COOKIE_SECURE, sameSite: "lax", maxAge: 604800000 });
    res.cookie("nexora_session", "active", { maxAge: 604800000 });
    
    console.log(`✅ [REG] Complete! (+${Date.now() - start}ms)`);
    res.json({ 
      user: { 
        id: user.id.toString(),
        email: user.email, 
        firstName: user.firstName 
      },
      accessToken: tokens.accessToken,
    });
  } catch (error) { 
    console.error(`❌ [REG] Error after ${Date.now() - start}ms:`, error);
    res.status(500).json({ error: "Registration failed" }); 
  }
});

app.post("/api/v1/auth/login", async (req, res) => {
  const start = Date.now();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  if (!EMAIL_REGEX.test(email)) return res.status(400).json({ error: "Invalid email format" });
  
  try {
    console.log(`⏱️ [LOGIN] Finding user... (+${Date.now() - start}ms)`);
    const user = await db.query.users.findFirst({ where: sql`${users.email} = ${email}` });
    
    if (!user || !user.password) {
      console.log(`❌ [LOGIN] User not found (+${Date.now() - start}ms)`);
      return res.status(401).json({ error: "User does not exist" });
    }
    
    console.log(`⏱️ [LOGIN] Comparing password... (+${Date.now() - start}ms)`);
    const isValid = await AuthService.comparePassword(password, user.password);
    if (!isValid) {
      console.log(`❌ [LOGIN] Invalid password (+${Date.now() - start}ms)`);
      return res.status(401).json({ error: "Incorrect password" });
    }
    
    console.log(`⏱️ [LOGIN] Generating tokens... (+${Date.now() - start}ms)`);
    const tokens = AuthService.generateTokens({ userId: user.id, email: user.email });
    
    res.cookie("nexora_access", tokens.accessToken, { httpOnly: true, secure: COOKIE_SECURE, sameSite: "lax", maxAge: 900000 });
    res.cookie("nexora_refresh", tokens.refreshToken, { httpOnly: true, secure: COOKIE_SECURE, sameSite: "lax", maxAge: 604800000 });
    res.cookie("nexora_session", "active", { maxAge: 604800000 });
    
    console.log(`✅ [LOGIN] Success! (+${Date.now() - start}ms)`);
    res.json({ 
      user: { 
        id: user.id.toString(),
        email: user.email, 
        firstName: user.firstName 
      },
      accessToken: tokens.accessToken,
    });
  } catch (error) { 
    console.error(`❌ [LOGIN] Error after ${Date.now() - start}ms:`, error);
    res.status(500).json({ error: "Login failed" }); 
  }
});

app.get("/api/v1/auth/user", async (req, res) => {
  const token = getBearerOrCookieToken(req);
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.json({ user: null });
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
    if (!user) return res.json({ user: null });
    
    res.json({ 
      user: {
        id: user.id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl
      } 
    });
  } catch (error) { res.status(500).json({ error: "DB error" }); }
});

app.post("/api/v1/auth/user/update", async (req, res) => {
  const token = getBearerOrCookieToken(req);
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });

  const { firstName, lastName, monthlyIncome } = req.body;
  try {
    const [updatedUser] = await db
      .update(users)
      .set({ firstName, lastName, monthlyIncome })
      .where(eq(users.id, payload.userId))
      .returning();

    return res.json({
      user: {
        id: updatedUser.id.toString(),
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        profileImageUrl: updatedUser.profileImageUrl,
        monthlyIncome: updatedUser.monthlyIncome?.toString() ?? "0",
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update user profile" });
  }
});

app.post("/api/v1/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  try {
    const user = await db.query.users.findFirst({ where: sql`${users.email} = ${email}` });
    if (!user) {
      return res.json({ message: "If the email exists, reset instructions have been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 1000 * 60 * 30);
    await db
      .update(users)
      .set({ resetToken, resetTokenExpires })
      .where(eq(users.id, user.id));

    const resetLink = `${CLIENT_ORIGIN}/reset-password?token=${encodeURIComponent(resetToken)}`;
    logger.info({ email, resetLink }, "Password reset link generated");
    return res.json({ message: "If the email exists, reset instructions have been sent." });
  } catch (error) {
    return res.status(500).json({ error: "Failed to process password reset request" });
  }
});

app.post("/api/v1/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and new password are required" });
  }
  if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
    return res.status(400).json({ error: "Password must be 8+ chars with upper, lower, number, and symbol" });
  }

  try {
    const user = await db.query.users.findFirst({ where: sql`${users.resetToken} = ${token}` });
    if (!user || !user.resetTokenExpires || new Date(user.resetTokenExpires).getTime() < Date.now()) {
      return res.status(400).json({ error: "Reset token is invalid or expired" });
    }

    const hashedPassword = await AuthService.hashPassword(newPassword);
    await db
      .update(users)
      .set({ password: hashedPassword, resetToken: null, resetTokenExpires: null })
      .where(eq(users.id, user.id));

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to reset password" });
  }
});

// --- SYSTEM ROUTES ---
app.get("/api/v1/ping", (req, res) => res.json({ status: "ok" }));
app.get("/api/healthz", (req, res) => res.json({ status: "ok" }));

// --- AUTH ROUTES ---

app.get(["/api/v1/auth/logout", "/api/v1/logout"], (req, res) => {
  res.clearCookie("nexora_access");
  res.clearCookie("nexora_refresh");
  res.clearCookie("nexora_session");
  const returnTo = req.query.returnTo as string || "http://localhost:5173/login";
  res.redirect(returnTo);
});

app.get("/", (req, res) => res.send("🚀 NEXORA_SECURE_VAULT_ACTIVE"));

// --- 404 CATCH-ALL (DIAGNOSTIC) ---
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
