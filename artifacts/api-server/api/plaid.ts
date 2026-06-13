import express from "express";
import { PlaidService } from "../src/services/plaid.service";

export const plaidRouter = express.Router();

// Middleware to ensure user is authenticated (assuming req.user is set by authMiddleware)
// Since index.ts sets cookies, we should have a way to authenticate these requests.
// For now, let's assume the frontend sends the user info or authMiddleware protects this route.
// Let's implement basic logic based on cookies if needed, or rely on index.ts auth checking.
// In index.ts, /api/v1/* routes are not all protected by a single middleware.
// Let's look up the user via the access token. 
import { AuthService } from "../src/services/AuthService";

const authenticatePlaid = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.cookies.nexora_access || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const decoded = AuthService.verifyToken(token, "access");
    (req as any).user = decoded;
    next();
  } catch(e) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

plaidRouter.use(authenticatePlaid);

plaidRouter.post("/create-link-token", async (req, res) => {
  try {
    const user = (req as any).user;
    const tokenResponse = await PlaidService.createLinkToken(user.userId, user.email);
    res.json(tokenResponse);
  } catch (error: any) {
    console.error("Plaid Link Token Error:", error);
    res.status(500).json({ error: error.message });
  }
});

plaidRouter.post("/exchange-public-token", async (req, res) => {
  try {
    const user = (req as any).user;
    const { public_token } = req.body;
    if (!public_token) return res.status(400).json({ error: "public_token is required" });

    const result = await PlaidService.exchangePublicToken(public_token, user.userId);
    res.json(result);
  } catch (error: any) {
    console.error("Plaid Exchange Token Error:", error);
    res.status(500).json({ error: error.message });
  }
});

plaidRouter.post("/sync", async (req, res) => {
  try {
    const user = (req as any).user;
    const { item_id } = req.body;
    if (!item_id) return res.status(400).json({ error: "item_id is required" });

    const result = await PlaidService.syncTransactions(user.userId, item_id);
    res.json(result);
  } catch (error: any) {
    console.error("Plaid Sync Error:", error);
    res.status(500).json({ error: error.message });
  }
});
