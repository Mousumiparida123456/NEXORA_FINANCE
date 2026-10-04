import express from "express";
import { AuthService } from "../src/services/AuthService";
import { PlaidService, PlaidServiceError } from "../src/services/plaid.service";

export const plaidRouter = express.Router();

interface AuthenticatedPlaidRequest extends express.Request {
  user?: { userId: number; email: string };
}

const authenticatePlaid = (
  req: AuthenticatedPlaidRequest,
  res: express.Response,
  next: express.NextFunction,
) => {
  const token = req.cookies?.nexora_access || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Please sign in to connect a bank account." });
  try {
    const decoded = AuthService.verifyAccessToken(token);
    const userId = Number(decoded?.userId);
    if (!decoded || !Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: "Your session is invalid. Please sign in again." });
    }
    req.user = { userId, email: decoded.email };
    return next();
  } catch {
    return res.status(401).json({ error: "Your session is invalid. Please sign in again." });
  }
};

plaidRouter.use(authenticatePlaid);

const sendPlaidError = (res: express.Response, error: unknown) => {
  if (error instanceof PlaidServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  return res.status(503).json({
    error: "Bank connection is temporarily unavailable. Demo Mode can be used for testing.",
  });
};

plaidRouter.get("/status", async (req: AuthenticatedPlaidRequest, res) => {
  try {
    const status = await PlaidService.getConnectionStatus(req.user!.userId);
    return res.json(status);
  } catch (error) {
    if (error instanceof PlaidServiceError && error.statusCode === 503) {
      return res.json({
        available: false,
        connected: false,
        error: error.message,
      });
    }
    return sendPlaidError(res, error);
  }
});

plaidRouter.post("/create-link-token", async (req: AuthenticatedPlaidRequest, res) => {
  try {
    return res.json(await PlaidService.createLinkToken(req.user!.userId));
  } catch (error) {
    return sendPlaidError(res, error);
  }
});

plaidRouter.post("/exchange-public-token", async (req: AuthenticatedPlaidRequest, res) => {
  const publicToken =
    typeof req.body?.public_token === "string" ? req.body.public_token.trim() : "";
  if (!publicToken) {
    return res.status(400).json({ error: "public_token is required." });
  }
  try {
    return res.json(await PlaidService.exchangePublicToken(publicToken, req.user!.userId));
  } catch (error) {
    return sendPlaidError(res, error);
  }
});

plaidRouter.post("/sync", async (req: AuthenticatedPlaidRequest, res) => {
  try {
    return res.json(await PlaidService.syncUserTransactions(req.user!.userId));
  } catch (error) {
    return sendPlaidError(res, error);
  }
});
