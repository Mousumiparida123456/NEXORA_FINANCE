import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

function getSafeReturnTo(value: unknown): string {
  const clientOrigin = (process.env.CLIENT_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
  
  if (typeof value !== "string") return "/dashboard";
  
  // If it's a relative path, keep it
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  
  // If it's an absolute URL, check if it's our frontend
  if (value.startsWith(clientOrigin)) {
    return value;
  }

  return "/dashboard";
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json({
    user: {
      id: "user_prod_123",
      email: "user@example.com",
      firstName: "Nexora",
      lastName: "User",
      profileImageUrl: null,
    }
  });
});

router.get("/login", (req: Request, res: Response) => {
  const clientOrigin = (process.env.CLIENT_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
  const returnTo = getSafeReturnTo(req.query.returnTo);
  
  // Build the final redirect URL safely
  const redirectUrl = returnTo.startsWith("http") 
    ? returnTo 
    : `${clientOrigin}${returnTo.startsWith("/") ? "" : "/"}${returnTo}`;
  
  res.redirect(redirectUrl);
});

router.get("/logout", (_req: Request, res: Response) => {
  const clientOrigin = (process.env.CLIENT_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
  res.redirect(`${clientOrigin}/login`);
});

router.post("/mobile-auth/token-exchange", (_req: Request, res: Response) => {
  res.status(501).json({ error: "Feature disabled." });
});

router.post("/mobile-auth/logout", (_req: Request, res: Response) => {
  res.json({ success: true });
});

export default router;
