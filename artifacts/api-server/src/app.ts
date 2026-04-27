import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { pinoHttp } from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

const app: Express = express();

// Root route for friendly landing page
app.get("/", (_req: Request, res: Response) => {
  res.send("🚀 VERIFICATION_ID_998877_LIVE");
});

// Trust the Vercel proxy so req.ip and rate limiting work correctly
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Secure HTTP headers
app.use(
  (helmet as any)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Global rate limit: 600 req / 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// Tighter rate limit on auth endpoints to slow brute-force attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.use("/api", globalLimiter);
app.use("/api/login", authLimiter);
app.use("/api/logout", authLimiter);
app.use("/api/mobile-auth", authLimiter);

app.use(authMiddleware);

// Mount routes at both /api and /api/v1 for versioning
app.use("/api", router);
app.use("/api/v1", router);

export default app;
