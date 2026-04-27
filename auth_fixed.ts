import { Router, type IRouter, type Request, type Response } from "express";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function getSafeReturnTo(value: unknown): string {
  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  
  if (typeof value !== "string") return "/dashboard";
  
  // Allow relative paths
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  
  // Allow absolute URLs that match our CLIENT_ORIGIN
  if (value.startsWith(clientOrigin)) {
    return value;
  }

  // Default to dashboard
  return "/dashboard";
}

router.get("/auth/user", (req: Request, res: Response) => {
  // Always returning a mock user for now to ensure the dashboard opens
  const user = {
    id: "user_prod_123",
    email: "user@example.com",
    firstName: "Nexora",
    lastName: "User",
    profileImageUrl: null,
  };

  res.json(
    GetCurrentAuthUserResponse.parse({
      user,
    }),
  );
});

router.get("/login", (req: Request, res: Response) => {
  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  const returnTo = getSafeReturnTo(req.query.returnTo);
  
  // If returnTo is relative, prepend the origin
  const redirectUrl = returnTo.startsWith("http") ? returnTo : `${clientOrigin}${returnTo}`;
  
  res.redirect(redirectUrl);
});

router.get("/logout", (_req: Request, res: Response) => {
  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  res.redirect(`${clientOrigin}/login`);
});

router.post("/mobile-auth/token-exchange", (_req: Request, res: Response) => {
  res.status(501).json({ error: "Mobile OIDC token exchange is disabled." });
});

router.post("/mobile-auth/logout", (_req: Request, res: Response) => {
  res.json({ success: true });
});

export default router;
