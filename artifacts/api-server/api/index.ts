import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { db, users, accounts, transactions, userPreferences, eq, sql, desc } from "../src/db";
import { AuthService } from "../src/services/AuthService";
import { AIService } from "../src/services/AIService";
import { AnalyticsService } from "../src/services/AnalyticsService";
import { logger } from "../src/lib/logger";
import crypto from "crypto";
import nodemailer from "nodemailer";

const app = express();
const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ||
  (process.env.NODE_ENV === "production"
    ? "https://nexora-finance-fintech-dashboard.vercel.app"
    : "http://localhost:5173");
const COOKIE_SECURE = process.env.NODE_ENV === "production";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || "no-reply@nexora.finance";

const smtpConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
const mailTransporter = smtpConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

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

const sendPasswordResetEmail = async (email: string, resetLink: string) => {
  if (!mailTransporter) {
    throw new Error("SMTP is not configured");
  }

  await mailTransporter.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: "Nexora Password Reset Instructions",
    text: `We received a request to reset your Nexora password. Use this secure link: ${resetLink}\n\nThis link expires in 30 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2>Nexora Password Reset</h2>
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${resetLink}" style="display:inline-block;padding:10px 14px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px;">
            Reset Password
          </a>
        </p>
        <p>This link expires in 30 minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
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
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5177",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5177",
  "https://nexora-finance-fintech-dashboard.vercel.app",
  ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
];

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true 
}));

// --- HIGH PRIORITY DUAL-PATH ROUTES ---
const DEFAULT_API_ORIGIN = "https://nexora-finance-api-server.vercel.app";
const API_ORIGIN = process.env.API_ORIGIN || DEFAULT_API_ORIGIN;

const startGoogleAuth = (req: express.Request, res: express.Response) => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const host = req.get("host") || "localhost:9999";
  const protocol = req.protocol || "http";
  const GOOGLE_REDIRECT_URI =
    process.env.GOOGLE_REDIRECT_URI || 
    (process.env.NODE_ENV === "production"
      ? `${API_ORIGIN.replace(/\/+$/, "")}/api/auth/google/callback`
      : `${protocol}://${host}/api/auth/google/callback`);

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

  if (!code) return res.redirect(`${clientOrigin}/login?error=no_code`);

  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const host = req.get("host") || "localhost:9999";
    const protocol = req.protocol || "http";
    const GOOGLE_REDIRECT_URI =
      process.env.GOOGLE_REDIRECT_URI || 
      (process.env.NODE_ENV === "production"
        ? `${API_ORIGIN.replace(/\/+$/, "")}/api/auth/google/callback`
        : `${protocol}://${host}/api/auth/google/callback`);

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
};

app.get(["/api/v1/auth/google", "/api/auth/google", "/auth/google"], startGoogleAuth);
app.get(
  ["/api/v1/auth/google/callback", "/api/auth/google/callback", "/auth/google/callback"],
  handleGoogleCallback
);

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
app.get(["/api/healthz", "/api/v1/healthz"], (_req, res) => res.json({ status: "ok" }));

import { plaidRouter } from "./plaid";

// --- AUTH ROUTES ---
app.use(["/api/v1/plaid", "/api/plaid", "/plaid"], plaidRouter);

app.post(["/api/v1/auth/register", "/api/auth/register", "/auth/register"], async (req, res) => {
  const start = Date.now();
  const { email, password, firstName, lastName } = req.body;
  const validationError = validateEmailAndPassword(email, password);
  if (validationError) return res.status(400).json({ error: validationError });
  
  try {
    console.log(`⏱️ [REG] Hashing password... (+${Date.now() - start}ms)`);
    const hashedPassword = await AuthService.hashPassword(password);
    
    console.log(`⏱️ [REG] Checking existing user... (+${Date.now() - start}ms)`);
    const existing = await db.query.users.findFirst({ where: eq(users.email, email.trim()) });
    if (existing) return res.status(400).json({ error: "User already exists" });
    
    console.log(`⏱️ [REG] Inserting user & account... (+${Date.now() - start}ms)`);
    const [user] = await db.insert(users).values({ 
      email, 
      password: hashedPassword, 
      firstName: firstName || email.split("@")[0], 
      lastName 
    }).returning();
    
    const [newAccount] = await db.insert(accounts).values({ 
      userId: user.id, 
      type: "savings", 
      balance: email === "demo@nexora.finance" ? "42500.00" : "1000.00", 
      accountNumber: `NEX-${Math.floor(Math.random() * 1000000)}` 
    }).returning();
    
    // Seed data if demo account
    if (email === "demo@nexora.finance") {
      console.log(`⏱️ [REG] Seeding demo transactions... (+${Date.now() - start}ms)`);
      const categories = [
        { name: "Salary", type: "income", avg: 8500, variance: 500, freq: "monthly" },
        { name: "Rent", type: "expense", avg: 2500, variance: 0, freq: "monthly" },
        { name: "Groceries", type: "expense", avg: 400, variance: 100, freq: "weekly" },
        { name: "Dining Out", type: "expense", avg: 200, variance: 150, freq: "weekly" },
        { name: "Utilities", type: "expense", avg: 350, variance: 50, freq: "monthly" },
        { name: "Streaming", type: "expense", avg: 49, variance: 0, freq: "monthly" },
      ];
      const txData = [];
      const now = new Date();
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
              description: `${cat.name} - ${monthDate.toLocaleString('default', { month: 'short' })}`,
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
      await db.insert(transactions).values(txData);
    }
    
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

app.post(["/api/v1/auth/login", "/api/auth/login", "/auth/login"], async (req, res) => {
  const start = Date.now();
  const { email, password } = req.body;
  console.log(`[LOGIN ATTEMPT] email: "${email}", length: ${email?.length}`);
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  if (!EMAIL_REGEX.test(email)) return res.status(400).json({ error: "Invalid email format" });
  
  try {
    console.log(`⏱️ [LOGIN] Finding user... (+${Date.now() - start}ms)`);
    const user = await db.query.users.findFirst({ where: eq(users.email, email.trim()) });
    
    if (!user || !user.password) {
      console.log(`❌ [LOGIN] User not found (+${Date.now() - start}ms)`);
      return res.status(401).json({ error: "User does not exist" });
    }
    
    console.log(`⏱️ [LOGIN] Comparing password... (+${Date.now() - start}ms)`);
    let isValid = false;
    
    // DEMO BYPASS: Always allow the demo user if they use the exact demo password
    if (email.trim() === "demo@nexora.finance" && password === "DemoAccount123!") {
      isValid = true;
      console.log("✅ [LOGIN] Demo user bypass active");
    } else {
      isValid = await AuthService.comparePassword(password, user.password);
    }
    
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

app.get(["/api/v1/auth/user", "/api/auth/user", "/auth/user"], async (req, res) => {
  const token = getBearerOrCookieToken(req);
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.json({ user: null });
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
    if (!user) return res.json({ user: null });
    const prefs = await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, payload.userId) });
    const persisted = (prefs?.data as Record<string, any>) || {};
    
    res.json({ 
      user: {
        id: user.id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        monthlyIncome: user.monthlyIncome?.toString() ?? "0",
        financialGoals: user.financialGoals ?? "",
        riskLevel: user.riskLevel ?? "medium",
        savingsGoal: user.savingsGoal ?? 15000,
        investStyle: user.investStyle ?? "balanced",
        twoFactorEnabled: Boolean(user.twoFactorEnabled),
        preferences: persisted,
      } 
    });
  } catch (error) { res.status(500).json({ error: "DB error" }); }
});

app.get("/api/v1/user-data", async (req, res) => {
  const token = getBearerOrCookieToken(req);
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });

  try {
    const prefs = await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, payload.userId) });
    return res.json({ data: (prefs?.data as Record<string, any>) || {} });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch user data" });
  }
});

app.post("/api/v1/user-data/upsert", async (req, res) => {
  const token = getBearerOrCookieToken(req);
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });

  const data = req.body?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return res.status(400).json({ error: "Valid data object is required" });
  }

  try {
    const result = await db.execute(sql`
      INSERT INTO user_preferences (user_id, data, updated_at)
      VALUES (${payload.userId}, ${JSON.stringify(data)}::jsonb, now())
      ON CONFLICT (user_id)
      DO UPDATE SET data = excluded.data, updated_at = now()
      RETURNING data, updated_at
    `);

    const row = result.rows?.[0] as { data?: unknown; updated_at?: unknown } | undefined;
    return res.json({
      message: "User data saved successfully",
      data: row?.data ?? data,
      updatedAt: row?.updated_at ?? new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to persist user data" });
  }
});

app.post("/api/v1/auth/user/update", async (req, res) => {
  const token = getBearerOrCookieToken(req);
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });

  const {
    email,
    firstName,
    lastName,
    monthlyIncome,
    profileImageUrl,
    financialGoals,
    riskLevel,
    savingsGoal,
    investStyle,
    twoFactorEnabled,
  } = req.body;
  try {
    if (email) {
      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      const existing = await db.query.users.findFirst({ where: sql`${users.email} = ${email}` });
      if (existing && existing.id !== payload.userId) {
        return res.status(400).json({ error: "Email is already in use" });
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        email,
        firstName,
        lastName,
        monthlyIncome,
        profileImageUrl,
        financialGoals,
        riskLevel,
        savingsGoal,
        investStyle,
        twoFactorEnabled,
      })
      .where(eq(users.id, payload.userId))
      .returning();

    // Keep user_preferences in sync so edited values always persist across sessions.
    const preferencePayload = {
      profile: {
        name: [firstName, lastName].filter(Boolean).join(" ").trim(),
        email: email ?? updatedUser.email,
        income: monthlyIncome?.toString?.() ?? updatedUser.monthlyIncome?.toString?.() ?? "0",
        goals: financialGoals ?? "",
        avatar: profileImageUrl ?? "",
      },
      preferences: {
        riskLevel: riskLevel ?? "medium",
        savingsGoal: typeof savingsGoal === "number" ? savingsGoal : 15000,
        investStyle: investStyle ?? "balanced",
      },
      security: {
        twoFactorEnabled: typeof twoFactorEnabled === "boolean" ? twoFactorEnabled : Boolean(updatedUser.twoFactorEnabled),
      },
    };

    await db.execute(sql`
      INSERT INTO user_preferences (user_id, data, updated_at)
      VALUES (${payload.userId}, ${JSON.stringify(preferencePayload)}::jsonb, now())
      ON CONFLICT (user_id)
      DO UPDATE SET data = excluded.data, updated_at = now()
    `);

    return res.json({
      user: {
        id: updatedUser.id.toString(),
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        profileImageUrl: updatedUser.profileImageUrl,
        monthlyIncome: updatedUser.monthlyIncome?.toString() ?? "0",
        financialGoals: updatedUser.financialGoals ?? "",
        riskLevel: updatedUser.riskLevel ?? "medium",
        savingsGoal: updatedUser.savingsGoal ?? 15000,
        investStyle: updatedUser.investStyle ?? "balanced",
        twoFactorEnabled: Boolean(updatedUser.twoFactorEnabled),
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
    if (smtpConfigured) {
      await sendPasswordResetEmail(email, resetLink);
      logger.info({ email }, "Password reset email sent");
    } else {
      logger.info({ email, resetLink }, "SMTP not configured; returning dev reset link");
    }

    const response: Record<string, string> = {
      message: "If the email exists, reset instructions have been sent.",
    };
    if (process.env.NODE_ENV !== "production" || !smtpConfigured) {
      response.devResetLink = resetLink;
    }
    return res.json(response);
  } catch (error) {
    logger.error({ error, email }, "Failed to send password reset email");
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

app.get(["/api/v1/auth/logout", "/api/v1/logout"], (req, res) => {
  res.clearCookie("nexora_access");
  res.clearCookie("nexora_refresh");
  res.clearCookie("nexora_session");
  const defaultRedirect = CLIENT_ORIGIN + "/login";
  const returnTo = req.query.returnTo as string || defaultRedirect;
  res.redirect(returnTo);
});

app.get("/", (req, res) => res.send("🚀 NEXORA_SECURE_VAULT_ACTIVE"));

// --- TRANSACTIONS CRUD ---

app.get(["/api/v1/transactions", "/api/transactions"], async (req, res) => {
  const token = getBearerOrCookieToken(req);
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });
  try {
    const userTransactions = await db.query.transactions.findMany({
      where: sql`account_id IN (SELECT id FROM accounts WHERE user_id = ${payload.userId})`,
      orderBy: [desc(transactions.timestamp)]
    });
    const formatted = userTransactions.map(tx => ({
      ...tx,
      id: String(tx.id),
      amount: Number(tx.amount),
      date: tx.timestamp ? new Date(tx.timestamp).toISOString().split('T')[0] : "",
    }));
    res.json(formatted);
  } catch (error) {
    console.error("GET transactions error:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

app.post(["/api/v1/transactions", "/api/transactions"], async (req, res) => {
  const token = getBearerOrCookieToken(req);
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });
  try {
    const account = await db.query.accounts.findFirst({ where: eq(accounts.userId, payload.userId) });
    if (!account) return res.status(400).json({ error: "No account found" });
    const { amount, type, category, description, date } = req.body;
    console.log("➕ Adding Transaction:", { amount, type, category, date });
    const [newTx] = await db.insert(transactions).values({
      accountId: account.id,
      amount: String(amount),
      type,
      category,
      description,
      timestamp: date ? new Date(date) : new Date()
    }).returning();
    res.json({ ...newTx, id: String(newTx.id), amount: Number(newTx.amount), date: newTx.timestamp ? new Date(newTx.timestamp).toISOString().split('T')[0] : "" });
  } catch (error) {
    console.error("POST transaction error:", error);
    res.status(500).json({ error: "Failed to add transaction" });
  }
});

app.patch(["/api/v1/transactions/:id", "/api/transactions/:id"], async (req, res) => {
  const token = getBearerOrCookieToken(req);
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });
  try {
    const txId = parseInt(req.params.id as string);
    if (isNaN(txId)) return res.status(400).json({ error: "Invalid transaction ID" });
    console.log("✏️ Editing Transaction ID:", txId);
    const existingTx = await db.query.transactions.findFirst({
      where: sql`id = ${txId} AND account_id IN (SELECT id FROM accounts WHERE user_id = ${payload.userId})`
    });
    if (!existingTx) return res.status(404).json({ error: "Transaction not found" });
    const { amount, type, category, description, date } = req.body;
    console.log("💵 Updated Amount:", amount);
    const [updatedTx] = await db.update(transactions).set({
      ...(amount !== undefined && { amount: String(amount) }),
      ...(type !== undefined && { type }),
      ...(category !== undefined && { category }),
      ...(description !== undefined && { description }),
      ...(date !== undefined && { timestamp: new Date(date) }),
    }).where(eq(transactions.id, txId)).returning();
    console.log("✅ Update response:", updatedTx);
    res.json({ ...updatedTx, id: String(updatedTx.id), amount: Number(updatedTx.amount), date: updatedTx.timestamp ? new Date(updatedTx.timestamp).toISOString().split('T')[0] : "" });
  } catch (error) {
    console.error("PATCH transaction error:", error);
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

app.delete(["/api/v1/transactions/:id", "/api/transactions/:id"], async (req, res) => {
  const token = getBearerOrCookieToken(req);
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });
  try {
    const txId = parseInt(req.params.id as string);
    if (isNaN(txId)) return res.status(400).json({ error: "Invalid transaction ID" });
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

// Vercel rewrite fallback: some rewrites forward catch-all route via ?path=...
app.use((req, res, next) => {
  if (req.method !== "GET") return next();

  const queryPath = req.query.path;
  const rewrittenPathCandidate = Array.isArray(queryPath) ? queryPath[0] : queryPath;
  const rewrittenPathRaw = typeof rewrittenPathCandidate === "string" ? rewrittenPathCandidate : "";
  const rewrittenPath = rewrittenPathRaw.replace(/^\/+/, "").replace(/\/+$/, "").toLowerCase();
  const normalizedCurrentPath = req.path.replace(/^\/+/, "").replace(/\/+$/, "").toLowerCase();
  const routeHint = `${normalizedCurrentPath} ${rewrittenPath}`;

  if (routeHint.includes("auth/google/callback")) {
    return handleGoogleCallback(req, res);
  }
  if (routeHint.includes("auth/google")) {
    return startGoogleAuth(req, res);
  }
  next();
});

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
