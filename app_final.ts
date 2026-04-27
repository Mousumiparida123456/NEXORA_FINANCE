import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

const app: Express = express();

app.get("/", (_req: Request, res: Response) => {
  res.send("NEXORA Finance API is running. See /api/healthz for health check.");
});

app.set("trust proxy", 1);

app.use(
  (pinoHttp as any)({
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

const globalLimiter = (rateLimit as any)({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

const authLimiter = (rateLimit as any)({
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

app.use("/api", router);
app.use("/api/v1", router);

export default app;
